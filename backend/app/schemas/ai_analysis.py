from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

class AIAnalyzeRequest(BaseModel):
    complaint: str
    location: Optional[str] = None
    language: Optional[str] = "English"

class ExplanationItem(BaseModel):
    feature: str
    impact: float
    direction: str # "INCREASES_PRIORITY" or "DECREASES_PRIORITY"
    description: str

class AIRecommendation(BaseModel):
    summary: str
    action_steps: List[str]
    possible_causes: List[str]
    verification_checklist: List[str]
    citizen_response_draft: str

class AIAnalysisResponse(BaseModel):
    id: Optional[int] = None
    complaint_id: Optional[int] = None
    language: Optional[str] = "English"
    category: str
    category_confidence: float
    subcategory: Optional[str] = None
    subcategory_confidence: Optional[float] = 0.0
    sentiment: str
    sentiment_confidence: float
    severity: str
    severity_confidence: float
    priority: str
    priority_confidence: float
    duplicate_probability: float
    duplicate_count: int = 0
    location_extracted: Optional[str] = None
    location_confidence: float = 0.0
    department: Optional[str] = None
    predicted_resolution_days: float
    model_version: str = "v1.0"
    original_text: Optional[str] = None
    normalized_text: Optional[str] = None
    translated_text: Optional[str] = None
    requires_human_review: Optional[bool] = False
    confidence_scores: Optional[Dict[str, float]] = None
    explanations: Optional[List[ExplanationItem]] = []
    recommendation: Optional[AIRecommendation] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
