import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from backend.app.database.session import SessionLocal
from backend.app.api.auth import register
from backend.app.schemas.auth import UserRegister

db = SessionLocal()
try:
    req = UserRegister(
        name="Tushar Gupta",
        email="tg0634793@gmail.com",
        password="Password123!",
        phone="+919822000000",
        role="CITIZEN",
        protect_identity_default=True
    )
    user = register(req, db)
    print("Registration SUCCESS! Created user ID:", user.id, user.email, user.name)
except Exception as e:
    print("Registration FAILED with exception:", type(e), e)
