import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.app.database.session import SessionLocal
from backend.app.models.user import User
from backend.app.models.department import Department
from backend.app.auth.security import hash_password

def add_officer(name: str, email: str, password: str, department_name: str):
    db = SessionLocal()
    try:
        existing = db.query(User).filter(User.email == email).first()
        if existing:
            print(f"Error: A user with email '{email}' already exists (Role: {existing.role}).")
            return

        dept = db.query(Department).filter(Department.name.ilike(f"%{department_name}%")).first()
        dept_id = dept.id if dept else None

        officer = User(
            name=name,
            email=email,
            password_hash=hash_password(password),
            role="OFFICER",
            department_id=dept_id
        )
        db.add(officer)
        db.commit()
        db.refresh(officer)
        dept_display = dept.name if dept else "Unassigned"
        print(f"Success: Created Officer '{name}' ({email}) assigned to '{dept_display}' department.")
    finally:
        db.close()

if __name__ == "__main__":
    if len(sys.argv) < 4:
        print("Usage: python scripts/add_officer.py <Name> <Email> <Password> [DepartmentName]")
        print("Example: python scripts/add_officer.py \"Suresh Kumar\" suresh@civicai.gov suresh123 \"Electrical Department\"")
    else:
        name = sys.argv[1]
        email = sys.argv[2]
        pwd = sys.argv[3]
        dept = sys.argv[4] if len(sys.argv) > 4 else "General Administration"
        add_officer(name, email, pwd, dept)
