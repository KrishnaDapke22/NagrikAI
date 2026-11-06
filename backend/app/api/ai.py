from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import Dict, Any

from backend.app.database.session import get_db
from backend.app.schemas.ai_analysis import AIAnalyzeRequest, AIAnalysisResponse
from backend.app.models.complaint import Complaint
from backend.app.ai.pipeline import civic_pipeline

router = APIRouter(prefix="/ai", tags=["AI Analysis"])

@router.post("/analyze", response_model=AIAnalysisResponse)
def analyze_complaint_endpoint(req: AIAnalyzeRequest, db: Session = Depends(get_db)):
    """
    Real-time AI/ML analysis API for public complaints.
    Performs language detection, category/subcategory classification,
    sentiment analysis, severity prediction, location extraction,
    semantic duplicate detection, priority prediction with SHAP explainability,
    resolution time regression, and Generative AI recommendations.
    """
    # Query existing complaints to check for duplicate candidates
    existing = db.query(Complaint).order_by(Complaint.id.desc()).limit(150).all()
    existing_list = [
        {
            "id": c.id,
            "title": c.title,
            "description": c.description,
            "category": c.category,
            "status": c.status,
            "created_at": c.created_at
        }
        for c in existing
    ]

    analysis = civic_pipeline.analyze_complaint(
        complaint_text=req.complaint,
        location_override=req.location,
        existing_complaints=existing_list
    )

    return analysis
