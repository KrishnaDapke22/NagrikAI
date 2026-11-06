from sqlalchemy.orm import Session
from typing import Optional, List
from backend.app.models.notification import Notification
from backend.app.models.user import User

def create_notification(
    db: Session,
    user_id: int,
    title: str,
    message: str,
    event_type: str,
    complaint_id: Optional[int] = None
) -> Notification:
    notif = Notification(
        user_id=user_id,
        complaint_id=complaint_id,
        event_type=event_type,
        title=title,
        message=message,
        is_read=False
    )
    db.add(notif)
    db.commit()
    db.refresh(notif)
    return notif

def notify_officers_of_department(
    db: Session,
    department_id: Optional[int],
    title: str,
    message: str,
    event_type: str,
    complaint_id: Optional[int] = None
) -> List[Notification]:
    query = db.query(User).filter(User.role.in_(["OFFICER", "ADMIN"]))
    if department_id:
        query = query.filter((User.department_id == department_id) | (User.role == "ADMIN"))
    
    officers = query.all()
    created = []
    for officer in officers:
        notif = Notification(
            user_id=officer.id,
            complaint_id=complaint_id,
            event_type=event_type,
            title=title,
            message=message,
            is_read=False
        )
        db.add(notif)
        created.append(notif)
    
    if created:
        db.commit()
    return created

def notify_admins(
    db: Session,
    title: str,
    message: str,
    event_type: str,
    complaint_id: Optional[int] = None
) -> List[Notification]:
    admins = db.query(User).filter(User.role == "ADMIN").all()
    created = []
    for admin in admins:
        notif = Notification(
            user_id=admin.id,
            complaint_id=complaint_id,
            event_type=event_type,
            title=title,
            message=message,
            is_read=False
        )
        db.add(notif)
        created.append(notif)
    
    if created:
        db.commit()
    return created
