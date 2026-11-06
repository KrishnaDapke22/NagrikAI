from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import List, Dict, Any

from backend.app.models.complaint import Complaint
from backend.app.services.notification_service import notify_officers_of_department, notify_admins, create_notification
from backend.app.services.department_service import STANDARD_CATEGORIES, canonicalize_category
from backend.app.services.audit_service import log_audit

def run_sla_escalation_checks(db: Session) -> Dict[str, Any]:
    """
    Scans active complaints and flags cases that exceed SLA target or are high/critical without progress.
    Notifies responsible officers, admins, and the citizen.
    """
    now = datetime.utcnow()
    active_complaints = db.query(Complaint).filter(Complaint.status.in_(["OPEN", "IN_PROGRESS"])).all()
    
    escalated_count = 0
    escalated_items = []

    for c in active_complaints:
        age_hours = (now - c.created_at).total_seconds() / 3600.0
        
        # Determine category SLA
        canon_cat = canonicalize_category(c.category)
        cat_info = STANDARD_CATEGORIES.get(canon_cat, {})
        cat_slas = cat_info.get("sla_hours", {"CRITICAL": 12, "HIGH": 24, "MEDIUM": 48, "LOW": 96})
        target_hours = cat_slas.get(c.priority, 48)

        should_escalate = False
        reason = ""

        # Priority condition checks
        if c.priority == "CRITICAL" and age_hours > target_hours:
            should_escalate = True
            reason = f"CRITICAL emergency priority exceeded SLA deadline ({target_hours}h) at {round(age_hours, 1)}h"
        elif c.priority == "HIGH" and age_hours > target_hours:
            should_escalate = True
            reason = f"HIGH priority grievance pending resolution for {round(age_hours, 1)}h (SLA limit: {target_hours}h)"
        elif age_hours > target_hours:
            should_escalate = True
            reason = f"Exceeded municipal SLA resolution target of {target_hours} hours ({round(age_hours, 1)}h elapsed)"

        if should_escalate and not c.is_escalated:
            c.is_escalated = True
            escalated_count += 1
            escalated_items.append({
                "id": c.id,
                "title": c.title,
                "priority": c.priority,
                "age_hours": round(age_hours, 1),
                "reason": reason
            })

            # Notify department officers and admins
            ref = f"NAGRIK-{str(c.id).zfill(5)}"
            title = f"⚠️ SLA Escalation: {ref} [{c.priority}]"
            msg = f"Grievance {ref} '{c.title}' has been escalated to senior supervisor review: {reason}."

            notify_officers_of_department(
                db=db,
                department_id=c.department_id,
                title=title,
                message=msg,
                event_type="ESCALATED",
                complaint_id=c.id
            )

            # Also notify citizen of expedited supervisor attention
            create_notification(
                db=db,
                user_id=c.citizen_id,
                title=f"Update on your grievance #{ref}",
                message=f"Your grievance has been expedited and escalated to senior municipal engineers for prompt resolution.",
                event_type="ESCALATED",
                complaint_id=c.id
            )

            log_audit(
                db=db,
                complaint_id=c.id,
                user_id=c.citizen_id,
                action="ESCALATION_TRIGGERED",
                field_name="is_escalated",
                old_value="False",
                new_value=f"True: {reason}"
            )

    db.commit()

    return {
        "escalated_count": escalated_count,
        "escalated_complaints": escalated_items,
        "scanned_count": len(active_complaints),
        "timestamp": now.isoformat()
    }
