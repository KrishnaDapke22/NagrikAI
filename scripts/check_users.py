import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from backend.app.database.session import SessionLocal
from backend.app.models.user import User

db = SessionLocal()
users = db.query(User).all()
print("Total users in database:", len(users))
for u in users:
    print(f"ID: {u.id} | Email: {u.email} | Name: {u.name} | Role: {u.role}")
