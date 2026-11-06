from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from backend.app.database.session import get_db
from backend.app.models.complaint import Complaint
from backend.app.models.resolution import Resolution
from backend.app.models.user import User
from backend.app.models.department import Department
from backend.app.schemas.complaint import ComplaintResponse, ComplaintDetailResponse, ComplaintOverrideRequest
from backend.app.schemas.resolution import ResolutionCreate, ResolutionResponse
from backend.app.auth.dependencies import get_current_user, require_roles
from backend.app.services.audit_service import log_audit
from backend.app.services.notification_service import create_notification
from backend.app.api.complaints import format_complaint_response, get_complaint_detail

router = APIRouter(prefix="/officer", tags=["Officer Management"])

@router.get("/complaints", response_model=List[ComplaintResponse])
def get_officer_queue(
    status: Optional[str] = None,
    priority: Optional[str] = None,
    category: Optional[str] = None,
    department_id: Optional[int] = None,
    all_departments: bool = False,
    search: Optional[str] = None,
    current_user: User = Depends(require_roles(["OFFICER", "ADMIN"])),
    db: Session = Depends(get_db)
):
    query = db.query(Complaint)

    # Department filtering logic
    if department_id and department_id > 0:
        query = query.filter(Complaint.department_id == department_id)
    elif not all_departments and department_id != -1 and current_user.role == "OFFICER" and current_user.department_id:
        query = query.filter(Complaint.department_id == current_user.department_id)

    if status:
        query = query.filter(Complaint.status == status.upper())
    if priority:
        query = query.filter(Complaint.priority == priority.upper())
    if category:
        query = query.filter(Complaint.category == category)
    if search:
        s = f"%{search}%"
        query = query.filter(
            (Complaint.title.ilike(s)) |
            (Complaint.description.ilike(s)) |
            (Complaint.location_text.ilike(s))
        )

    complaints = query.order_by(
        Complaint.status == "OPEN",
        Complaint.priority == "CRITICAL",
        Complaint.priority == "HIGH",
        Complaint.created_at.desc()
    ).limit(200).all()

    return [format_complaint_response(c, current_user) for c in complaints]

@router.post("/complaints/{complaint_id}/status")
def update_complaint_status(
    complaint_id: int,
    new_status: str,
    remarks: Optional[str] = None,
    current_user: User = Depends(require_roles(["OFFICER", "ADMIN"])),
    db: Session = Depends(get_db)
):
    valid_statuses = ["OPEN", "IN_PROGRESS", "RESOLVED", "REJECTED", "REOPENED"]
    new_status_upper = new_status.upper()
    if new_status_upper not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of {valid_statuses}")

    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    old_status = complaint.status
    complaint.status = new_status_upper
    complaint.updated_at = datetime.utcnow()

    if new_status_upper == "RESOLVED":
        complaint.resolved_at = datetime.utcnow()
        duration_days = (complaint.resolved_at - complaint.created_at).total_seconds() / 86400.0
        # If no resolution record exists, create a default one
        existing_res = db.query(Resolution).filter(Resolution.complaint_id == complaint.id).first()
        if not existing_res:
            res = Resolution(
                complaint_id=complaint.id,
                officer_id=current_user.id,
                action_taken="Status updated to resolved by officer.",
                remarks=remarks or "Issue mitigated successfully.",
                actual_resolution_days=round(duration_days, 2),
                resolved_at=datetime.utcnow()
            )
            db.add(res)

    db.commit()

    ref_id = f"CIV-2026-{str(complaint.id).zfill(5)}"
    if new_status_upper == "IN_PROGRESS":
        create_notification(
            db=db,
            user_id=complaint.citizen_id,
            title="Work in Progress on Your Grievance",
            message=f"Officer {current_user.name} has initiated remediation work for {ref_id}.",
            event_type="STATUS_CHANGED",
            complaint_id=complaint.id
        )
    elif new_status_upper == "RESOLVED":
        create_notification(
            db=db,
            user_id=complaint.citizen_id,
            title="Grievance Resolved",
            message=f"Your grievance {ref_id} has been marked as RESOLVED. Please verify completion.",
            event_type="RESOLVED",
            complaint_id=complaint.id
        )

    log_audit(
        db=db,
        complaint_id=complaint_id,
        user_id=current_user.id,
        action="STATUS_CHANGE",
        field_name="status",
        old_value=old_status,
        new_value=new_status_upper
    )

    return {"message": f"Status updated from {old_status} to {new_status_upper}", "complaint_id": complaint_id}

@router.post("/complaints/{complaint_id}/override", response_model=ComplaintDetailResponse)
def human_in_the_loop_override(
    complaint_id: int,
    override_in: ComplaintOverrideRequest,
    current_user: User = Depends(require_roles(["OFFICER", "ADMIN"])),
    db: Session = Depends(get_db)
):
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    # Priority override
    if override_in.priority and override_in.priority != complaint.priority:
        old_pri = complaint.priority
        complaint.priority = override_in.priority.upper()
        log_audit(
            db=db,
            complaint_id=complaint.id,
            user_id=current_user.id,
            action="PRIORITY_OVERRIDE",
            field_name="priority",
            old_value=old_pri,
            new_value=override_in.priority.upper()
        )

    # Category override
    if override_in.category and override_in.category != complaint.category:
        old_cat = complaint.category
        complaint.category = override_in.category
        log_audit(
            db=db,
            complaint_id=complaint.id,
            user_id=current_user.id,
            action="CATEGORY_OVERRIDE",
            field_name="category",
            old_value=old_cat,
            new_value=override_in.category
        )

    # Severity override
    if override_in.severity and override_in.severity != complaint.severity:
        old_sev = complaint.severity
        complaint.severity = override_in.severity.upper()
        log_audit(
            db=db,
            complaint_id=complaint.id,
            user_id=current_user.id,
            action="SEVERITY_OVERRIDE",
            field_name="severity",
            old_value=old_sev,
            new_value=override_in.severity.upper()
        )

    # Department override
    if override_in.department_id and override_in.department_id != complaint.department_id:
        old_dept = complaint.department_id
        complaint.department_id = override_in.department_id
        log_audit(
            db=db,
            complaint_id=complaint.id,
            user_id=current_user.id,
            action="DEPARTMENT_REASSIGNMENT",
            field_name="department_id",
            old_value=str(old_dept),
            new_value=str(override_in.department_id)
        )

    complaint.updated_at = datetime.utcnow()
    db.commit()

    return get_complaint_detail(complaint_id, current_user, db)

@router.post("/complaints/{complaint_id}/resolve", response_model=ResolutionResponse)
def resolve_complaint_action(
    complaint_id: int,
    res_in: ResolutionCreate,
    current_user: User = Depends(require_roles(["OFFICER", "ADMIN"])),
    db: Session = Depends(get_db)
):
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    resolved_time = datetime.utcnow()
    duration_days = round((resolved_time - complaint.created_at).total_seconds() / 86400.0, 2)
    duration_days = max(0.1, duration_days)

    resolution = Resolution(
        complaint_id=complaint.id,
        officer_id=current_user.id,
        action_taken=res_in.action_taken,
        remarks=res_in.remarks,
        evidence_url=res_in.evidence_url,
        actual_resolution_days=duration_days,
        resolved_at=resolved_time
    )
    db.add(resolution)

    old_status = complaint.status
    complaint.status = "RESOLVED"
    complaint.resolved_at = resolved_time
    complaint.updated_at = resolved_time
    if res_in.evidence_url:
        complaint.after_image_url = res_in.evidence_url
    db.commit()
    db.refresh(resolution)

    log_audit(
        db=db,
        complaint_id=complaint_id,
        user_id=current_user.id,
        action="RESOLUTION_SUBMITTED",
        field_name="status",
        old_value=old_status,
        new_value="RESOLVED"
    )

    # Notify citizen of verified resolution with proof
    ref_id = f"NAGRIK-{str(complaint.id).zfill(5)}"
    create_notification(
        db=db,
        user_id=complaint.citizen_id,
        title="Grievance Resolved with Official Proof",
        message=f"Officer {current_user.name} has submitted verified resolution evidence for {ref_id}. Action: {res_in.action_taken}",
        event_type="RESOLVED",
        complaint_id=complaint.id
    )

    return {
        "id": resolution.id,
        "complaint_id": resolution.complaint_id,
        "officer_id": resolution.officer_id,
        "officer_name": current_user.name,
        "action_taken": resolution.action_taken,
        "remarks": resolution.remarks,
        "evidence_url": resolution.evidence_url,
        "actual_resolution_days": resolution.actual_resolution_days,
        "resolved_at": resolution.resolved_at
    }

@router.get("/workload")
def get_officer_workload(
    current_user: User = Depends(require_roles(["OFFICER", "ADMIN"])),
    db: Session = Depends(get_db)
):
    """
    Returns municipal squad officers with their current active workload.
    """
    officers = db.query(User).filter(User.role.in_(["OFFICER", "ADMIN"])).all()
    res = []
    for o in officers:
        active_count = db.query(Complaint).filter(
            Complaint.department_id == o.department_id,
            Complaint.status.in_(["OPEN", "IN_PROGRESS"])
        ).count() if o.department_id else 0

        res.append({
            "id": o.id,
            "name": o.name,
            "email": o.email,
            "role": o.role,
            "department_id": o.department_id,
            "department_name": o.department.name if o.department else "General Administration",
            "active_cases": active_count
        })
    return res

@router.post("/complaints/{complaint_id}/escalate")
def escalate_complaint_manually(
    complaint_id: int,
    reason: Optional[str] = "Manual supervisory escalation",
    current_user: User = Depends(require_roles(["OFFICER", "ADMIN"])),
    db: Session = Depends(get_db)
):
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    complaint.is_escalated = True
    complaint.updated_at = datetime.utcnow()
    db.commit()

    ref_id = f"CIV-2026-{str(complaint.id).zfill(5)}"
    log_audit(
        db=db,
        complaint_id=complaint.id,
        user_id=current_user.id,
        action="ESCALATION_TRIGGERED",
        field_name="is_escalated",
        old_value="False",
        new_value=f"True: {reason}"
    )

    create_notification(
        db=db,
        user_id=complaint.citizen_id,
        title=f"⚠️ Grievance Escalated to Senior Squad: {ref_id}",
        message=f"Your grievance {ref_id} has been escalated for priority municipal intervention.",
        event_type="ESCALATED",
        complaint_id=complaint.id
    )

    return {"message": f"Complaint {ref_id} successfully escalated.", "is_escalated": True}

