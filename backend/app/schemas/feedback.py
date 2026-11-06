from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class FeedbackCreate(BaseModel):
    rating: int = Field(..., ge=1, le=5)
    comment: Optional[str] = None
    is_satisfied: Optional[bool] = True

class FeedbackResponse(BaseModel):
    id: int
    complaint_id: int
    citizen_id: int
    rating: int
    comment: Optional[str] = None
    is_satisfied: bool
    created_at: datetime

    class Config:
        from_attributes = True
