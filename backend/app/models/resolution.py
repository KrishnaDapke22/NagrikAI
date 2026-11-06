from sqlalchemy import Column, Integer, String, Text, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from backend.app.database.session import Base

class Resolution(Base):
    __tablename__ = "resolutions"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    complaint_id = Column(Integer, ForeignKey("complaints.id"), nullable=False, index=True)
    officer_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    action_taken = Column(Text, nullable=False)
    remarks = Column(Text, nullable=True)
    evidence_url = Column(String(500), nullable=True)
    actual_resolution_days = Column(Float, nullable=True)
    resolved_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    complaint = relationship("Complaint", back_populates="resolutions")
    officer = relationship("User", back_populates="resolutions")
