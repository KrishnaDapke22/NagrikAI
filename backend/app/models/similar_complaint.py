from sqlalchemy import Column, Integer, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from backend.app.database.session import Base

class SimilarComplaint(Base):
    __tablename__ = "similar_complaints"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    complaint_id = Column(Integer, ForeignKey("complaints.id"), nullable=False, index=True)
    similar_complaint_id = Column(Integer, ForeignKey("complaints.id"), nullable=False, index=True)
    similarity_score = Column(Float, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    complaint = relationship("Complaint", foreign_keys=[complaint_id], back_populates="similar_complaints")
    similar = relationship("Complaint", foreign_keys=[similar_complaint_id])
