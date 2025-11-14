# REPLACE YOUR app/services/scanner.py WITH THIS SYNCHRONOUS VERSION:

# app/services/scanner.py
import json
import subprocess
from typing import List, Dict, Any
from sqlalchemy.orm import Session
import logging
from app.models import ScanResult, ScanIssue
from app.services.recommendations import get_or_create_recommendation

logger = logging.getLogger(__name__)

def run_pa11y_scan_sync(url: str) -> List[Dict[str, Any]]:
    """
    Run pa11y CLI synchronously - more reliable for background tasks
    """
    try:
        logger.info(f"🔍 Starting Pa11y scan for: {url}")
        
        # Run pa11y synchronously
        result = subprocess.run(
            ["npx", "pa11y", "--reporter", "json", "--include-warnings", "--include-notices", url],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            timeout=60  # 60 second timeout
        )
        
        if result.returncode != 0:
            logger.warning(f"Pa11y scan completed with warnings: {result.stderr}")
            if result.stdout:
                try:
                    issues = json.loads(result.stdout)
                    logger.info(f"✅ Pa11y scan completed with {len(issues)} issues (with warnings)")
                    return issues
                except json.JSONDecodeError:
                    pass
            return []
        
        issues = json.loads(result.stdout)
        logger.info(f"✅ Pa11y scan completed successfully. Found {len(issues)} issues")
        return issues
        
    except subprocess.TimeoutExpired:
        logger.error("❌ Pa11y scan timed out after 60 seconds")
        return []
    except Exception as e:
        logger.error(f"❌ Pa11y scan failed: {e}")
        return []

def scan_website_with_recommendations(db: Session, url: str, scan_id: int = None) -> ScanResult:
    """
    Run Pa11y synchronously and persist ScanResult with ScanIssue rows and recommendations
    """
    scan_result = None
    
    try:
        # Get or create scan result
        if scan_id:
            scan_result = db.get(ScanResult, scan_id)
            if not scan_result:
                raise ValueError(f"Scan result with ID {scan_id} not found")
        else:
            scan_result = ScanResult(url=url, status="scanning")
            db.add(scan_result)
            db.commit()
            db.refresh(scan_result)
        
        # Update status to scanning
        scan_result.status = "scanning"
        db.commit()
        
        # Run scan synchronously (NO ASYNC = NO CRASH)
        issues = run_pa11y_scan_sync(url)
        
        saved_issues = []
        for issue in issues:
            try:
                code = issue.get("code") or issue.get("rule") or "unknown"
                message = issue.get("message") or "No message"
                context = issue.get("context")
                selector = issue.get("selector")
                issue_type = issue.get("type", "error")
                
                # Create scan issue
                scan_issue = ScanIssue(
                    scan_result_id=scan_result.id,
                    code=code,
                    message=message,
                    context=context,
                    selector=selector,
                    type=issue_type
                )
                db.add(scan_issue)
                db.commit()
                db.refresh(scan_issue)
                
                # Generate recommendation
                rec_text = get_or_create_recommendation(
                    db=db, 
                    rule_code=code, 
                    description=message, 
                    issue_id=scan_issue.id
                )
                
                logger.info(f"📝 Generated recommendation for {code}")
                
                db.refresh(scan_issue)
                saved_issues.append(scan_issue)
                
            except Exception as issue_error:
                logger.error(f"Failed to process issue: {issue_error}")
                continue
        
        # Update scan status to completed
        scan_result.status = "completed"
        db.commit()
        db.refresh(scan_result)
        
        logger.info(f"✅ Scan {scan_result.id} completed with {len(saved_issues)} issues")
        return scan_result
        
    except Exception as e:
        logger.error(f"❌ Scan failed: {e}")
        if scan_result:
            scan_result.status = "failed"
            db.commit()
        raise