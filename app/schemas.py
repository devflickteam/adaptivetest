from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime


# ----------------------------
# Recommendation Schemas
# ----------------------------
class RecommendationBase(BaseModel):
    text: str


class RecommendationCreate(RecommendationBase):
    pass


class Recommendation(RecommendationBase):
    id: int

    class Config:
        from_attributes = True


# ----------------------------
# Issue Schemas
# ----------------------------
class ScanIssueBase(BaseModel):
    code: str
    message: str
    context: Optional[str] = None
    selector: Optional[str] = None


class ScanIssueCreate(ScanIssueBase):
    pass


class ScanIssue(ScanIssueBase):
    id: int
    recommendations: List[Recommendation] = []

    class Config:
        from_attributes = True


# ----------------------------
# Scan Result Schemas
# ----------------------------
class ScanResultBase(BaseModel):
    url: str
    status: str = "completed"


class ScanResultCreate(ScanResultBase):
    pass


class ScanResult(ScanResultBase):
    id: int
    created_at: datetime
    issues: List[ScanIssue] = []

    class Config:
        from_attributes = True


# ----------------------------
# API Request/Response
# ----------------------------
class ScanRequest(BaseModel):
    url: str


class ScanResultResponse(BaseModel):
    result: ScanResult
