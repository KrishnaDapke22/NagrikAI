from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class ResolutionCreate(BaseModel):
    action_taken: str
    remarks: Optional[str] = None
    evidence_url: Optional[str] = None

class ResolutionResponse(BaseModel):
    id: int
    complaint_id: int
    officer_id: int
    officer_name: Optional[str] = None
    action_taken: str
    remarks: Optional[str] = None
    evidence_url: Optional[str] = None
    actual_resolution_days: Optional[float] = None
    resolved_at: datetime

    class Config:
        from_attributes = True
