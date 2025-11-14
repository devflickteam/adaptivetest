# app/models.py
from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, func
from sqlalchemy.orm import relationship
from app.database import Base


class ScanResult(Base):
    __tablename__ = "scan_results"

    id = Column(Integer, primary_key=True, index=True)
    url = Column(String, nullable=False)
    document_title = Column(String, nullable=True)
    page_url = Column(String, nullable=True)
    status = Column(String, default="pending")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # issues relationship
    issues = relationship(
        "ScanIssue", back_populates="scan_result", cascade="all, delete-orphan"
    )


class ScanIssue(Base):
    __tablename__ = "scan_issues"

    id = Column(Integer, primary_key=True, index=True)
    scan_result_id = Column(Integer, ForeignKey("scan_results.id"))
    code = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    context = Column(Text, nullable=True)
    selector = Column(Text, nullable=True)

    # New: store recommendation text directly on the issue (nullable)
    recommendation_text = Column(Text, nullable=True)

    # Relationships
    scan_result = relationship("ScanResult", back_populates="issues")
