from sqlalchemy import Column, Integer, String, Text, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from backend.app.database.session import Base

class AIAnalysis(Base):
    __tablename__ = "ai_analyses"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    complaint_id = Column(Integer, ForeignKey("complaints.id"), unique=True, nullable=False, index=True)
    category = Column(String(100), nullable=True)
    category_confidence = Column(Float, default=0.0)
    subcategory = Column(String(100), nullable=True)
    subcategory_confidence = Column(Float, default=0.0)
    sentiment = Column(String(50), nullable=True)
    sentiment_confidence = Column(Float, default=0.0)
    severity = Column(String(50), nullable=True)
    severity_confidence = Column(Float, default=0.0)
    priority = Column(String(50), nullable=True)
    priority_confidence = Column(Float, default=0.0)
    duplicate_probability = Column(Float, default=0.0)
    location_confidence = Column(Float, default=0.0)
    model_version = Column(String(100), default="v1.0")
    explanation_json = Column(Text, nullable=True)    # JSON string for SHAP / feature importance factors
    recommendation_json = Column(Text, nullable=True) # JSON string for LLM recommendations & action checklist
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    complaint = relationship("Complaint", back_populates="ai_analysis")
