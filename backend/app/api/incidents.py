from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from backend.app.database.session import get_db
from backend.app.models.incident import Incident
from backend.app.models.complaint import Complaint
from backend.app.models.user import User
from backend.app.auth.dependencies import get_current_user, require_roles
from backend.app.schemas.incident import IncidentResponse, IncidentCreate, IncidentStatusUpdate
from backend.app.services.audit_service import log_audit
from backend.app.services.notification_service import notify_officers_of_department

router = APIRouter(prefix="/incidents", tags=["Incident Management"])

@router.get("", response_model=List[IncidentResponse])
def get_incidents(
    status: Optional[str] = None,
    category: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Incident)
    if status:
        query = query.filter(Incident.status == status.upper())
    if category:
        query = query.filter(Incident.category == category)

    incidents = query.order_by(Incident.updated_at.desc()).limit(100).all()

    res = []
    for inc in incidents:
        linked = [
            {
                "id": c.id,
                "title": c.title,
                "description": c.description,
                "citizen_name": c.citizen.name if c.citizen else "Citizen",
                "priority": c.priority,
                "status": c.status,
                "created_at": c.created_at
            }
            for c in inc.complaints
        ]
        res.append({
            "id": inc.id,
            "title": inc.title,
            "category": inc.category,
            "department_id": inc.department_id,
            "department_name": inc.department.name if inc.department else "General Administration",
            "status": inc.status,
            "priority": inc.priority,
            "severity": inc.severity,
            "primary_complaint_id": inc.primary_complaint_id,
            "latitude": inc.latitude,
            "longitude": inc.longitude,
            "location_text": inc.location_text,
            "affected_citizen_count": inc.affected_citizen_count,
            "created_at": inc.created_at,
            "updated_at": inc.updated_at,
            "resolved_at": inc.resolved_at,
            "linked_complaints": linked
        })
    return res

@router.get("/{incident_id}", response_model=IncidentResponse)
def get_incident_detail(
    incident_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    inc = db.query(Incident).filter(Incident.id == incident_id).first()
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found")

    linked = [
        {
            "id": c.id,
            "title": c.title,
            "description": c.description,
            "citizen_name": c.citizen.name if c.citizen else "Citizen",
            "priority": c.priority,
            "status": c.status,
            "created_at": c.created_at
        }
        for c in inc.complaints
    ]

    return {
        "id": inc.id,
        "title": inc.title,
        "category": inc.category,
        "department_id": inc.department_id,
        "department_name": inc.department.name if inc.department else "General Administration",
        "status": inc.status,
        "priority": inc.priority,
        "severity": inc.severity,
        "primary_complaint_id": inc.primary_complaint_id,
        "latitude": inc.latitude,
        "longitude": inc.longitude,
        "location_text": inc.location_text,
        "affected_citizen_count": inc.affected_citizen_count,
        "created_at": inc.created_at,
        "updated_at": inc.updated_at,
        "resolved_at": inc.resolved_at,
        "linked_complaints": linked
    }

@router.post("", response_model=IncidentResponse)
def create_incident(
    inc_in: IncidentCreate,
    current_user: User = Depends(require_roles(["OFFICER", "ADMIN"])),
    db: Session = Depends(get_db)
):
    incident = Incident(
        title=inc_in.title,
        category=inc_in.category,
        department_id=inc_in.department_id,
        status="OPEN",
        priority=inc_in.priority or "MEDIUM",
        severity=inc_in.severity or "MEDIUM",
        primary_complaint_id=inc_in.primary_complaint_id,
        latitude=inc_in.latitude,
        longitude=inc_in.longitude,
        location_text=inc_in.location_text,
        affected_citizen_count=1
    )
    db.add(incident)
    db.commit()
    db.refresh(incident)

    if inc_in.primary_complaint_id:
        c = db.query(Complaint).filter(Complaint.id == inc_in.primary_complaint_id).first()
        if c:
            c.incident_id = incident.id
            db.commit()

    return get_incident_detail(incident.id, current_user, db)

@router.post("/{incident_id}/link/{complaint_id}")
def link_complaint_to_incident(
    incident_id: int,
    complaint_id: int,
    current_user: User = Depends(require_roles(["OFFICER", "ADMIN"])),
    db: Session = Depends(get_db)
):
    inc = db.query(Incident).filter(Incident.id == incident_id).first()
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found")

    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    complaint.incident_id = inc.id
    inc.affected_citizen_count = db.query(Complaint).filter(Complaint.incident_id == inc.id).count()
    inc.updated_at = datetime.utcnow()
    db.commit()

    log_audit(
        db=db,
        complaint_id=complaint.id,
        user_id=current_user.id,
        action="INCIDENT_LINKED",
        field_name="incident_id",
        old_value=None,
        new_value=str(inc.id)
    )

    return {"message": f"Complaint CIV-2026-{str(complaint.id).zfill(5)} linked to Incident #{inc.id}"}

@router.post("/{incident_id}/unlink/{complaint_id}")
def unlink_complaint_from_incident(
    incident_id: int,
    complaint_id: int,
    current_user: User = Depends(require_roles(["OFFICER", "ADMIN"])),
    db: Session = Depends(get_db)
):
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id, Complaint.incident_id == incident_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not linked to this incident")

    complaint.incident_id = None
    inc = db.query(Incident).filter(Incident.id == incident_id).first()
    if inc:
        inc.affected_citizen_count = max(1, db.query(Complaint).filter(Complaint.incident_id == inc.id).count())
        inc.updated_at = datetime.utcnow()
    db.commit()

    log_audit(
        db=db,
        complaint_id=complaint.id,
        user_id=current_user.id,
        action="INCIDENT_UNLINKED",
        field_name="incident_id",
        old_value=str(incident_id),
        new_value=None
    )

    return {"message": f"Complaint CIV-2026-{str(complaint.id).zfill(5)} unlinked from Incident #{incident_id}"}

@router.post("/{incident_id}/status")
def update_incident_status(
    incident_id: int,
    status_update: IncidentStatusUpdate,
    current_user: User = Depends(require_roles(["OFFICER", "ADMIN"])),
    db: Session = Depends(get_db)
):
    inc = db.query(Incident).filter(Incident.id == incident_id).first()
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found")

    new_st = status_update.status.upper()
    inc.status = new_st
    inc.updated_at = datetime.utcnow()
    if new_st == "RESOLVED":
        inc.resolved_at = datetime.utcnow()
        # Mark all linked complaints as resolved as well
        for c in inc.complaints:
            if c.status != "RESOLVED":
                c.status = "RESOLVED"
                c.resolved_at = datetime.utcnow()

    db.commit()

    return {"message": f"Incident #{inc.id} status updated to {new_st}"}
