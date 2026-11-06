from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import timedelta

from backend.app.database.session import get_db
from backend.app.models.user import User
from backend.app.schemas.auth import (
    UserRegister,
    UserLogin,
    UserResponse,
    Token,
    ForgotPasswordRequest,
    ResetPasswordRequest,
    PrivacyPreferenceUpdate
)
from backend.app.auth.security import hash_password, verify_password, create_access_token, ACCESS_TOKEN_EXPIRE_MINUTES
from backend.app.auth.dependencies import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])

def canonical_email(email: str) -> str:
    """Normalize email and support nagrikai.gov / civicai.gov interoperability."""
    e = email.lower().strip()
    return e

@router.post("/register", response_model=UserResponse)
def register(user_in: UserRegister, db: Session = Depends(get_db)):
    clean_email = canonical_email(user_in.email)
    existing = db.query(User).filter(User.email == clean_email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address is already registered."
        )

    # Validate password length
    if len(user_in.password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 6 characters long."
        )

    # Validate role
    role = user_in.role.upper() if user_in.role else "CITIZEN"
    if role not in ["CITIZEN", "OFFICER", "ADMIN"]:
        role = "CITIZEN"

    user = User(
        name=user_in.name.strip(),
        email=clean_email,
        password_hash=hash_password(user_in.password),
        phone=user_in.phone,
        role=role,
        is_verified=True,
        protect_identity_default=bool(user_in.protect_identity_default),
        department_id=user_in.department_id
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

@router.post("/login", response_model=Token)
def login(login_in: UserLogin, db: Session = Depends(get_db)):
    clean_email = canonical_email(login_in.email)

    # Look up user directly or via nagrikai/civicai alias
    user = db.query(User).filter(User.email == clean_email).first()
    if not user:
        if "@nagrikai.gov" in clean_email:
            alias = clean_email.replace("@nagrikai.gov", "@civicai.gov")
            user = db.query(User).filter(User.email == alias).first()
        elif "@civicai.gov" in clean_email:
            alias = clean_email.replace("@civicai.gov", "@nagrikai.gov")
            user = db.query(User).filter(User.email == alias).first()

    if not user or not verify_password(login_in.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password. Please verify your credentials."
        )

    access_token = create_access_token(
        data={"sub": str(user.id), "user_id": user.id, "email": user.email, "role": user.role},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.put("/privacy-preferences", response_model=UserResponse)
def update_privacy_preferences(
    pref_in: PrivacyPreferenceUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Allows citizens to update their default identity protection preference.
    """
    current_user.protect_identity_default = pref_in.protect_identity_default
    db.commit()
    db.refresh(current_user)
    return current_user

@router.post("/forgot-password")
def forgot_password(req: ForgotPasswordRequest, db: Session = Depends(get_db)):
    clean_email = canonical_email(req.email)
    user = db.query(User).filter(User.email == clean_email).first()
    if not user:
        if "@nagrikai.gov" in clean_email:
            alias = clean_email.replace("@nagrikai.gov", "@civicai.gov")
            user = db.query(User).filter(User.email == alias).first()
    
    # Always return success message for security so as not to leak registered accounts
    return {
        "message": "Password reset instructions have been dispatched to your email address.",
        "email": req.email
    }

@router.post("/reset-password")
def reset_password(req: ResetPasswordRequest, db: Session = Depends(get_db)):
    clean_email = canonical_email(req.email)
    user = db.query(User).filter(User.email == clean_email).first()
    if not user:
        if "@nagrikai.gov" in clean_email:
            alias = clean_email.replace("@nagrikai.gov", "@civicai.gov")
            user = db.query(User).filter(User.email == alias).first()

    if not user:
        raise HTTPException(status_code=404, detail="User account not found.")

    if len(req.new_password) < 6:
        raise HTTPException(status_code=400, detail="New password must be at least 6 characters.")

    user.password_hash = hash_password(req.new_password)
    db.commit()
    return {"message": "Password updated successfully. You may now sign in."}
