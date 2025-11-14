# app/models/__init__.py
from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class ScanResult(Base):
    __tablename__ = "scan_results"
    
    id = Column(Integer, primary_key=True, index=True)
    url = Column(String, nullable=False)
    status = Column(String, default="pending")  # pending, scanning, completed, failed
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationship
    issues = relationship("ScanIssue", back_populates="scan_result")

class ScanIssue(Base):
    __tablename__ = "scan_issues"
    
    id = Column(Integer, primary_key=True, index=True)
    scan_result_id = Column(Integer, ForeignKey("scan_results.id"))
    code = Column(String, nullable=False)
    message = Column(Text)
    context = Column(Text)
    selector = Column(Text)
    type = Column(String, default="error")  # error, warning, notice
    recommendation_text = Column(Text)
    
    # Relationship
    scan_result = relationship("ScanResult", back_populates="issues") 