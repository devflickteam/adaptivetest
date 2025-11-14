from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
import subprocess, json, datetime

from app.database import get_db
from app.models import ScanResult, ScanIssue

router = APIRouter(prefix="/scan", tags=["Scan Results"])


class ScanRequest(BaseModel):
    url: str


@router.post("/")
async def run_scan(request: ScanRequest, db: Session = Depends(get_db)):
    try:
        # Run Pa11y scan
        process = subprocess.run(
            ["pa11y", request.url, "--reporter", "json"],
            capture_output=True,
            text=True,
            check=False
        )

        if process.returncode != 0 and not process.stdout.strip():
            raise HTTPException(
                status_code=500,
                detail=f"Pa11y execution error: {process.stderr}"
            )

        try:
            issues = json.loads(process.stdout)
        except json.JSONDecodeError:
            raise HTTPException(
                status_code=500,
                detail=f"Could not parse Pa11y output: {process.stdout}"
            )

        # Save scan result in DB
        scan_result = ScanResult(
            url=request.url,
            created_at=datetime.datetime.utcnow(),
            status="completed"
        )
        db.add(scan_result)
        db.commit()
        db.refresh(scan_result)

        # Save each issue with recommendation text
        for issue in issues:
            recommendation = None
            if "Recommendation:" in issue.get("message", ""):
                recommendation = issue["message"].split("Recommendation:")[-1].strip()

            scan_issue = ScanIssue(
                scan_result_id=scan_result.id,
                code=issue.get("code"),
                context=issue.get("context"),
                selector=issue.get("selector"),
                message=issue.get("message"),
                recommendation_text=recommendation,
            )
            db.add(scan_issue)

        db.commit()

        # ✅ Return stored results
        return {
            "scan_result_id": scan_result.id,
            "url": scan_result.url,
            "status": scan_result.status,
            "issues_found": len(issues)
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected scan error: {str(e)}")
