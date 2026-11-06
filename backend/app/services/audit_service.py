from sqlalchemy.orm import Session
from typing import Optional
from backend.app.models.audit_log import AuditLog

def log_audit(
    db: Session,
    complaint_id: int,
    action: str,
    user_id: Optional[int] = None,
    field_name: Optional[str] = None,
    old_value: Optional[str] = None,
    new_value: Optional[str] = None
) -> AuditLog:
    entry = AuditLog(
        user_id=user_id,
        complaint_id=complaint_id,
        action=action,
        field_name=field_name,
        old_value=str(old_value) if old_value is not None else None,
        new_value=str(new_value) if new_value is not None else None
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry
