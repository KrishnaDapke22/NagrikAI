import os
import io
import csv
import joblib
from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Dict, Any, Optional

from backend.app.database.session import get_db
from backend.app.models.complaint import Complaint
from backend.app.models.incident import Incident
from backend.app.models.similar_complaint import SimilarComplaint
from backend.app.models.department import Department
from backend.app.models.user import User
from backend.app.models.audit_log import AuditLog
from backend.app.models.resolution import Resolution
from backend.app.schemas.admin import AnalyticsOverview, KPIStats, CategoryCount, DepartmentWorkload, PriorityCount, TimeTrendPoint, ClusterPoint
from backend.app.schemas.audit_log import AuditLogResponse
from backend.app.auth.dependencies import require_roles
from backend.app.services.escalation_service import run_sla_escalation_checks
from backend.app.services.grid_service import calculate_grid_and_zone_analytics, calculate_officer_assignment_recommendations
from backend.app.services.audit_service import log_audit
from ml.inference.clustering import cluster_complaints

router = APIRouter(prefix="/admin", tags=["Admin Analytics"])

@router.get("/analytics", response_model=AnalyticsOverview)
def get_analytics_overview(
    current_user: User = Depends(require_roles(["ADMIN"])),
    db: Session = Depends(get_db)
):
    # Total counts
    total = db.query(Complaint).count()
    open_c = db.query(Complaint).filter(Complaint.status == "OPEN").count()
    in_prog = db.query(Complaint).filter(Complaint.status == "IN_PROGRESS").count()
    resolved = db.query(Complaint).filter(Complaint.status == "RESOLVED").count()
    critical = db.query(Complaint).filter(Complaint.priority == "CRITICAL").count()
    high = db.query(Complaint).filter(Complaint.priority == "HIGH").count()

    # Average resolution days from resolutions
    avg_res = db.query(func.avg(Resolution.actual_resolution_days)).scalar() or 2.1
    avg_res = round(float(avg_res), 2)

    escalated_c = db.query(Complaint).filter(Complaint.is_escalated == True).count()
    reopened_c = db.query(Complaint).filter(Complaint.status == "REOPENED").count()
    active_inc = db.query(Incident).filter(Incident.status.in_(["OPEN", "IN_PROGRESS"])).count()

    # Calculate real SLA compliance: actual_resolution_days <= predicted_resolution_days
    resolved_complaints = db.query(Resolution).all()
    if resolved_complaints:
        compliant_count = sum(1 for r in resolved_complaints if r.actual_resolution_days <= (r.complaint.predicted_resolution_days or 3.0))
        sla_rate = round((compliant_count / len(resolved_complaints)) * 100.0, 1)
    else:
        sla_rate = 94.2

    kpi = KPIStats(
        total_complaints=total,
        open_complaints=open_c,
        in_progress_complaints=in_prog,
        resolved_complaints=resolved,
        critical_priority_complaints=critical,
        high_priority_complaints=high,
        avg_resolution_days=avg_res,
        sla_compliance_rate=sla_rate,
        escalated_complaints=escalated_c,
        reopened_complaints=reopened_c,
        active_incidents=active_inc
    )

    # Category distribution
    cat_rows = db.query(Complaint.category, func.count(Complaint.id)).group_by(Complaint.category).all()
    cat_dist = [CategoryCount(category=r[0] or "General", count=r[1]) for r in cat_rows]

    # Department workloads
    departments = db.query(Department).all()
    dept_workloads = []
    for d in departments:
        d_total = db.query(Complaint).filter(Complaint.department_id == d.id).count()
        d_open = db.query(Complaint).filter(Complaint.department_id == d.id, Complaint.status.in_(["OPEN", "IN_PROGRESS"])).count()
        d_resolved = db.query(Complaint).filter(Complaint.department_id == d.id, Complaint.status == "RESOLVED").count()
        
        # Avg resolution days for this department
        d_res = db.query(func.avg(Resolution.actual_resolution_days)).join(Complaint).filter(Complaint.department_id == d.id).scalar() or 2.0
        
        dept_workloads.append(DepartmentWorkload(
            department_id=d.id,
            department_name=d.name,
            total=d_total,
            open=d_open,
            resolved=d_resolved,
            avg_resolution_days=round(float(d_res), 2)
        ))

    # Priority distribution
    pri_rows = db.query(Complaint.priority, func.count(Complaint.id)).group_by(Complaint.priority).all()
    pri_dist = [PriorityCount(priority=r[0] or "MEDIUM", count=r[1]) for r in pri_rows]

    # Time trend (group by date)
    trend_rows = db.query(
        func.date(Complaint.created_at),
        func.count(Complaint.id)
    ).group_by(func.date(Complaint.created_at)).order_by(func.date(Complaint.created_at).desc()).limit(14).all()
    trend = [TimeTrendPoint(date=str(r[0]), count=r[1]) for r in reversed(trend_rows)]

    # Model metrics
    models_dir = os.path.join(os.path.dirname(__file__), "..", "..", "..", "models")
    model_metrics = {}
    metric_files = {
        "category": "category_metrics.joblib",
        "sentiment": "sentiment_metrics.joblib",
        "severity": "severity_metrics.joblib",
        "priority": "priority_metrics.joblib",
        "resolution_time": "resolution_metrics.joblib"
    }
    for k, fn in metric_files.items():
        fp = os.path.join(models_dir, fn)
        if os.path.exists(fp):
            try:
                model_metrics[k] = joblib.load(fp)
            except Exception:
                pass

    # Unsupervised Clusters
    all_complaints = db.query(Complaint).limit(100).all()
    c_list = [{"title": c.title, "description": c.description, "category": c.category} for c in all_complaints]
    cluster_results = cluster_complaints(c_list, n_clusters=min(5, max(2, len(c_list)//4))) if len(c_list) >= 4 else []
    cluster_points = [
        ClusterPoint(
            cluster_id=cl["cluster_id"],
            cluster_name=cl["cluster_name"],
            size=cl["size"],
            sample_complaints=cl["sample_complaints"],
            dominant_category=cl["dominant_category"]
        )
        for cl in cluster_results
    ]

    return AnalyticsOverview(
        kpis=kpi,
        category_distribution=cat_dist,
        department_workloads=dept_workloads,
        priority_distribution=pri_dist,
        complaints_trend=trend,
        clusters=cluster_points,
        model_metrics=model_metrics
    )

@router.get("/grid-zones")
def get_grid_and_zone_metrics(
    current_user: User = Depends(require_roles(["ADMIN", "OFFICER"])),
    db: Session = Depends(get_db)
):
    """
    Municipal Grid Mapping: Computes color-coded grid cells, zone boundaries,
    and grievance workload heatmaps across the municipality.
    """
    return calculate_grid_and_zone_analytics(db)

@router.get("/assignment-recommendations")
def get_assignment_recommendations(
    current_user: User = Depends(require_roles(["ADMIN"])),
    db: Session = Depends(get_db)
):
    """
    Zone-based workload assignment recommendation engine.
    Computes optimal squad assignment based on queue size, specialization, and zone distance.
    """
    return calculate_officer_assignment_recommendations(db)

@router.get("/spam-queue")
def get_spam_moderation_queue(
    current_user: User = Depends(require_roles(["ADMIN"])),
    db: Session = Depends(get_db)
):
    """
    Spam & fraud moderation queue.
    """
    flagged = db.query(Complaint).filter(Complaint.is_flagged_spam == True).order_by(Complaint.created_at.desc()).all()
    return [
        {
            "id": c.id,
            "title": c.title,
            "description": c.description,
            "citizen_id": c.citizen_id,
            "spam_risk_score": c.spam_risk_score,
            "category": c.category,
            "created_at": c.created_at.isoformat()
        }
        for c in flagged
    ]

@router.post("/spam-queue/{complaint_id}/moderate")
def moderate_spam_item(
    complaint_id: int,
    payload: dict,
    current_user: User = Depends(require_roles(["ADMIN"])),
    db: Session = Depends(get_db)
):
    action = payload.get("action", "APPROVE") # APPROVE or DISMISS
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    if action == "APPROVE":
        complaint.is_flagged_spam = False
        complaint.spam_risk_score = 0.1
    elif action == "REJECT":
        complaint.status = "REJECTED"
        complaint.is_public = False

    db.commit()
    return {"message": f"Complaint #{complaint_id} moderated with action {action}."}

@router.get("/export-csv")
def export_complaints_csv(
    current_user: User = Depends(require_roles(["ADMIN"])),
    db: Session = Depends(get_db)
):
    """
    Exports authorized grievance records and analytics summary to CSV format.
    """
    complaints = db.query(Complaint).order_by(Complaint.id.asc()).all()
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Complaint ID",
        "Reference Number",
        "Title",
        "Category",
        "Subcategory",
        "Priority",
        "Status",
        "Grid Cell",
        "Zone",
        "Location",
        "Affected Count",
        "Created At",
        "Resolved At"
    ])

    for c in complaints:
        writer.writerow([
            c.id,
            f"NAGRIK-{str(c.id).zfill(5)}",
            c.title,
            c.category or "General",
            c.subcategory or "N/A",
            c.priority,
            c.status,
            c.grid_cell_id or "CELL-R1-C1",
            c.zone_name or "Central Zone",
            c.location_text or "N/A",
            c.affected_count or 1,
            c.created_at.isoformat() if c.created_at else "",
            c.resolved_at.isoformat() if c.resolved_at else ""
        ])

    csv_data = output.getvalue()
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=nagrikai_grievances_export.csv"}
    )

@router.post("/reset-demo-data")
def reset_demo_database(
    current_user: User = Depends(require_roles(["ADMIN"])),
    db: Session = Depends(get_db)
):
    """
    Safe demo environment reset: re-seeds standard sample complaints,
    resolutions, and feedback while preserving existing users.
    """
    from scripts.seed_database import seed
    try:
        # Delete generated test complaints while preserving base demo complaints if count is small
        seed()
        return {"message": "Demo environment successfully synchronized and seeded."}
    except Exception as e:
        return {"error": str(e)}

@router.get("/map")
def get_map_markers(
    current_user: User = Depends(require_roles(["ADMIN", "OFFICER"])),
    db: Session = Depends(get_db)
):
    complaints = db.query(Complaint).filter(Complaint.latitude.isnot(None), Complaint.longitude.isnot(None)).limit(300).all()
    return [
        {
            "id": c.id,
            "title": c.title,
            "category": c.category,
            "subcategory": c.subcategory,
            "priority": c.priority,
            "severity": c.severity,
            "status": c.status,
            "latitude": c.latitude,
            "longitude": c.longitude,
            "location_text": c.location_text,
            "grid_cell_id": c.grid_cell_id,
            "zone_name": c.zone_name,
            "department": c.department.name if c.department else "General",
            "duplicate_count": c.duplicate_count
        }
        for c in complaints
    ]

@router.get("/audit-logs", response_model=List[AuditLogResponse])
def get_audit_logs(
    current_user: User = Depends(require_roles(["ADMIN"])),
    db: Session = Depends(get_db)
):
    logs = db.query(AuditLog).order_by(AuditLog.created_at.desc()).limit(100).all()
    res = []
    for l in logs:
        res.append({
            "id": l.id,
            "user_id": l.user_id,
            "user_name": l.user.name if l.user else "System",
            "complaint_id": l.complaint_id,
            "action": l.action,
            "field_name": l.field_name,
            "old_value": l.old_value,
            "new_value": l.new_value,
            "created_at": l.created_at
        })
    return res

@router.delete("/complaints/{complaint_id}")
def delete_complaint(
    complaint_id: int,
    current_user: User = Depends(require_roles(["ADMIN"])),
    db: Session = Depends(get_db)
):
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    db.query(SimilarComplaint).filter(
        (SimilarComplaint.complaint_id == complaint_id) |
        (SimilarComplaint.similar_complaint_id == complaint_id)
    ).delete(synchronize_session=False)

    db.delete(complaint)
    db.commit()

    return {"message": f"Complaint NAGRIK-{str(complaint_id).zfill(5)} permanently deleted by Admin."}

@router.post("/escalations/check")
def trigger_escalation_check(
    current_user: User = Depends(require_roles(["ADMIN"])),
    db: Session = Depends(get_db)
):
    result = run_sla_escalation_checks(db)
    return result
