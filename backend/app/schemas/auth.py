from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

class UserRegister(BaseModel):
    name: str
    email: EmailStr
    password: str
    phone: Optional[str] = None
    role: Optional[str] = "CITIZEN"
    department_id: Optional[int] = None
    protect_identity_default: Optional[bool] = False

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    email: EmailStr
    new_password: str

class PrivacyPreferenceUpdate(BaseModel):
    protect_identity_default: bool

class UserResponse(BaseModel):
    id: int
    name: str
    email: EmailStr
    role: str
    phone: Optional[str] = None
    avatar_url: Optional[str] = None
    is_verified: bool = True
    protect_identity_default: bool = False
    department_id: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class TokenData(BaseModel):
    email: Optional[str] = None
    role: Optional[str] = None
    user_id: Optional[int] = None
