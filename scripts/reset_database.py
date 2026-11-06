import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.app.database.session import SessionLocal, Base, engine
from backend.app.models import Complaint, AIAnalysis, SimilarComplaint, Resolution, Feedback, AuditLog, User, Department
from backend.app.auth.security import hash_password
from backend.app.services.department_service import seed_default_departments

def reset_database(clear_complaints_only: bool = True):
    db = SessionLocal()
    try:
        print("Resetting database...")
        db.query(SimilarComplaint).delete()
        db.query(AIAnalysis).delete()
        db.query(Resolution).delete()
        db.query(Feedback).delete()
        db.query(AuditLog).delete()
        db.query(Complaint).delete()

        if not clear_complaints_only:
            db.query(User).delete()
            print("Deleted all users.")

        db.commit()
        print("All complaints, analyses, duplicates, and resolutions cleared.")
        print("Default municipal departments and baseline accounts retained.")
    finally:
        db.close()

if __name__ == "__main__":
    reset_database(clear_complaints_only=True)
