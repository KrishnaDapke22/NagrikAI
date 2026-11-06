from pydantic import BaseModel
from typing import Optional, List, Any
from datetime import datetime
from backend.app.schemas.ai_analysis import AIAnalysisResponse
from backend.app.schemas.auth import UserResponse
from backend.app.schemas.department import DepartmentResponse

class ComplaintBase(BaseModel):
    title: str
    description: str
    location_text: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    landmark: Optional[str] = None
    category: Optional[str] = None
    subcategory: Optional[str] = None
    language: Optional[str] = "English"
    image_url: Optional[str] = None
    before_image_url: Optional[str] = None
    media_type: Optional[str] = "IMAGE"
    audio_transcript: Optional[str] = None
    yolo_detections: Optional[str] = None
    is_identity_protected: Optional[bool] = False
    is_public: Optional[bool] = True
    is_emergency: Optional[bool] = False
    affected_count: Optional[int] = 1

class ComplaintCreate(ComplaintBase):
    pass

class SimilarComplaintItem(BaseModel):
    id: int
    similar_complaint_id: int
    title: Optional[str] = None
    similarity_score: float
    status: Optional[str] = None
    category: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class ComplaintResolutionItem(BaseModel):
    id: int
    officer_name: Optional[str] = None
    action_taken: str
    remarks: Optional[str] = None
    evidence_url: Optional[str] = None
    actual_resolution_days: Optional[float] = None
    resolved_at: datetime

    class Config:
        from_attributes = True

class FeedbackItem(BaseModel):
    id: int
    rating: int
    comment: Optional[str] = None
    is_satisfied: bool
    created_at: datetime

    class Config:
        from_attributes = True

class CommunityCommentItem(BaseModel):
    id: int
    user_id: int
    user_name: str
    user_role: str
    is_official_response: bool
    comment: str
    created_at: datetime

class ComplaintResponse(BaseModel):
    id: int
    citizen_id: int
    citizen_name: Optional[str] = None
    citizen_badge: str = "Verified Citizen"
    is_identity_protected: bool = False
    title: str
    description: str
    category: Optional[str] = None
    subcategory: Optional[str] = None
    language: str = "English"
    sentiment: Optional[str] = None
    severity: str = "MEDIUM"
    priority: str = "MEDIUM"
    status: str = "OPEN"
    department_id: Optional[int] = None
    department_name: Optional[str] = None
    location_text: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    landmark: Optional[str] = None
    grid_cell_id: Optional[str] = None
    zone_name: Optional[str] = None
    image_url: Optional[str] = None
    before_image_url: Optional[str] = None
    after_image_url: Optional[str] = None
    media_type: str = "IMAGE"
    audio_transcript: Optional[str] = None
    yolo_detections: Optional[str] = None
    is_public: bool = True
    is_emergency: bool = False
    affected_count: int = 1
    spam_risk_score: float = 0.0
    duplicate_count: int = 0
    predicted_resolution_days: Optional[float] = None
    sla_deadline: Optional[datetime] = None
    original_text: Optional[str] = None
    translated_text: Optional[str] = None
    incident_id: Optional[int] = None
    is_escalated: Optional[bool] = False
    appeal_reason: Optional[str] = None
    reopen_count: Optional[int] = 0
    supports_count: int = 0
    comments_count: int = 0
    has_supported: bool = False
    created_at: datetime
    updated_at: datetime
    resolved_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class ComplaintDetailResponse(ComplaintResponse):
    ai_analysis: Optional[AIAnalysisResponse] = None
    similar_complaints: List[SimilarComplaintItem] = []
    resolutions: List[ComplaintResolutionItem] = []
    feedback: Optional[FeedbackItem] = None
    comments: List[CommunityCommentItem] = []

class ComplaintOverrideRequest(BaseModel):
    category: Optional[str] = None
    priority: Optional[str] = None
    severity: Optional[str] = None
    department_id: Optional[int] = None
    reason: Optional[str] = None

class ComplaintReopenRequest(BaseModel):
    reason: str
    evidence_url: Optional[str] = None
