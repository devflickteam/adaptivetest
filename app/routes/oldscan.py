from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models import ScanResult
from pydantic import BaseModel, Field
from datetime import datetime
from typing import List
from fastapi.responses import StreamingResponse
import io
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from urllib.parse import urlparse
from app.services.scanner import scan_website_with_recommendations

router = APIRouter(prefix="/scan", tags=["Scan Results"])

# -------------------------------
# Pydantic Schemas
# -------------------------------
class ScanResultSchema(BaseModel):
    id: int
    url: str
    title: str = Field(alias="document_title")
    created_at: datetime
    download_url: str

    class Config:
        orm_mode = True
        from_attributes = True  # Pydantic v2 change


class PaginatedScanResults(BaseModel):
    results: List[ScanResultSchema]
    download_all_url: str
    pagination: dict


# -------------------------------
# Scan Website Endpoint (with Pa11y + OpenAI)
# -------------------------------
@router.post("/website")
def scan_website(url: str, db: Session = Depends(get_db)):
    if not url.startswith(("http://", "https://")):
        url = "https://" + url
    parsed = urlparse(url)
    if not parsed.netloc:
        raise HTTPException(status_code=400, detail="Invalid URL format")

    try:
        scan_output = scan_website_with_recommendations(url, db)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Scan failed: {e}")

    new_scan = ScanResult(
        url=url,
        document_title=scan_output["title"],
        created_at=datetime.utcnow()
    )
    db.add(new_scan)
    db.commit()
    db.refresh(new_scan)

    return {
        "message": "Scan completed",
        "normalized_url": url,
        "scan_id": new_scan.id,
        "results": scan_output
    }


# -------------------------------
# List Scan Results (paginated)
# -------------------------------
@router.get("/results", response_model=PaginatedScanResults)
def list_scan_results(skip: int = 0, limit: int = 10, db: Session = Depends(get_db)):
    total = db.query(func.count(ScanResult.id)).scalar()
    records = db.query(ScanResult).offset(skip).limit(limit).all()

    results = [
        ScanResultSchema.from_orm(r).copy(update={
            "download_url": f"/scan/results/{r.id}/download"
        })
        for r in records
    ]

    return {
        "results": results,
        "download_all_url": "/scan/results/download",
        "pagination": {"skip": skip, "limit": limit, "count": total}
    }


# -------------------------------
# PDF Download (all results)
# -------------------------------
@router.get("/results/download")
def download_all_results(db: Session = Depends(get_db)):
    records = db.query(ScanResult).all()
    buffer = io.BytesIO()
    pdf = canvas.Canvas(buffer, pagesize=letter)
    width, height = letter

    y = height - 50
    pdf.setFont("Helvetica-Bold", 14)
    pdf.drawString(50, y, "Scan Results Report")
    y -= 30

    pdf.setFont("Helvetica", 10)
    for r in records:
        line = f"ID: {r.id} | Title: {r.document_title} | URL: {r.url} | Created: {r.created_at}"
        pdf.drawString(50, y, line)
        y -= 15
        if y < 50:
            pdf.showPage()
            pdf.setFont("Helvetica", 10)
            y = height - 50

    pdf.save()
    buffer.seek(0)
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=scan_results.pdf"}
    )
