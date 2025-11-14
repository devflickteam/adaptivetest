# app/routes/scan.py
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from fastapi.responses import StreamingResponse, JSONResponse
from pydantic import BaseModel, HttpUrl
from sqlalchemy.orm import Session
import io
import logging
from datetime import datetime

from app.database import get_db
from app.models import ScanResult, ScanIssue
from app.services.scanner import scan_website_with_recommendations

logger = logging.getLogger(__name__)
router = APIRouter()

class ScanRequest(BaseModel):
    url: HttpUrl

class ScanResponse(BaseModel):
    scan_id: int
    status: str
    message: str

# LEGACY ROUTE - ADD THIS FOR FRONTEND COMPATIBILITY
@router.post("/scan", include_in_schema=False)
async def legacy_start_scan(
    req: ScanRequest, 
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """
    Legacy endpoint for frontend compatibility
    Frontend is calling /scan but backend expects /scan/start
    """
    try:
        logger.info("🔄 Legacy /scan endpoint called - redirecting to /scan/start")
        # Call the same function as /scan/start
        return await start_scan(req, background_tasks, db)
    except Exception as e:
        logger.error(f"❌ Legacy /scan endpoint failed: {e}")
        raise HTTPException(status_code=500, detail=f"Scan failed: {str(e)}")

@router.post("/scan/start", response_model=ScanResponse)
async def start_scan(
    req: ScanRequest, 
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """
    Start accessibility scan for a given URL
    Returns immediately with scan_id, processes scan in background
    """
    url = str(req.url)
    
    try:
        # Create initial scan record
        scan_result = ScanResult(url=url, status="pending")
        db.add(scan_result)
        db.commit()
        db.refresh(scan_result)
        
        logger.info(f"🎯 Scan started for URL: {url} with ID: {scan_result.id}")
        
        # Process scan in background
        background_tasks.add_task(process_scan_async, scan_result.id, url, db)
        
        return ScanResponse(
            scan_id=scan_result.id,
            status="started",
            message=f"Accessibility scan initiated for {url}"
        )
        
    except Exception as e:
        logger.error(f"❌ Failed to start scan: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Scan initialization failed: {str(e)}")

async def process_scan_async(scan_id: int, url: str, db: Session):
    """Background task to process the accessibility scan"""
    try:
        # Get fresh database session for background task
        from app.database import SessionLocal
        background_db = SessionLocal()
        
        try:
            # Process the scan
            updated_scan = scan_website_with_recommendations(background_db, url, scan_id)
            logger.info(f"✅ Scan completed successfully for ID: {scan_id}")
            
        except Exception as scan_error:
            logger.error(f"❌ Scan processing failed for ID {scan_id}: {scan_error}")
            # Ensure scan status is updated to failed
            failed_scan = background_db.get(ScanResult, scan_id)
            if failed_scan:
                failed_scan.status = "failed"
                background_db.commit()
            raise
            
        finally:
            background_db.close()
            
    except Exception as e:
        logger.error(f"❌ Background scan failed for ID {scan_id}: {str(e)}")

@router.get("/scan/{scan_id}/status")
async def scan_status(scan_id: int, db: Session = Depends(get_db)):
    """Get current status of a scan"""
    scan = db.get(ScanResult, scan_id)
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")
    
    # Map status to frontend phases
    status_mapping = {
        "pending": "crawling",
        "scanning": "crawling", 
        "completed": "reporting", 
        "failed": "failed"
    }
    
    return {
        "scan_id": scan_id,
        "status": scan.status,
        "phase": status_mapping.get(scan.status, "crawling"),
        "url": scan.url,
        "created_at": scan.created_at.isoformat() if scan.created_at else None
    }

@router.get("/scan/{scan_id}/report")
async def get_report(scan_id: int, db: Session = Depends(get_db)):
    """Get detailed accessibility report"""
    scan = db.get(ScanResult, scan_id)
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")
    
    if scan.status == "pending" or scan.status == "scanning":
        raise HTTPException(status_code=425, detail="Scan not completed yet")
    
    if scan.status == "failed":
        raise HTTPException(status_code=500, detail="Scan failed to complete")
    
    issues = []
    for issue in scan.issues:
        issues.append({
            "id": issue.id,
            "code": issue.code,
            "type": getattr(issue, 'type', 'error'),
            "message": issue.message,
            "context": issue.context,
            "selector": issue.selector,
            "recommendation": getattr(issue, 'recommendation_text', 'No recommendation available'),
            "severity": "high" if getattr(issue, 'type', 'error') == 'error' else "medium"
        })
    
    # Calculate summary metrics
    error_count = len([i for i in issues if i.get('type') == 'error'])
    warning_count = len([i for i in issues if i.get('type') == 'warning'])
    notice_count = len([i for i in issues if i.get('type') == 'notice'])
    
    summary = {
        "total_issues": len(issues),
        "errors": error_count,
        "warnings": warning_count,
        "notices": notice_count,
        "accessibility_score": max(0, 100 - (error_count * 5 + warning_count * 2 + notice_count))
    }
    
    return {
        "scan_id": scan.id,
        "url": scan.url,
        "status": scan.status,
        "issues": issues,
        "summary": summary,
        "created_at": scan.created_at.isoformat() if scan.created_at else None,
        "scan_duration": "Completed"  # You can calculate actual duration if needed
    }

@router.get("/scan/{scan_id}/report/pdf")
async def download_report_pdf(scan_id: int, db: Session = Depends(get_db)):
    """Generate and download PDF report with enhanced formatting"""
    scan = db.get(ScanResult, scan_id)
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")
    
    if scan.status != "completed":
        raise HTTPException(status_code=425, detail="Scan not completed yet")

    try:
        # Use reportlab for PDF generation
        from reportlab.lib.pagesizes import letter, A4
        from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib import colors
        from reportlab.lib.units import inch
        import textwrap
        
        buffer = io.BytesIO()
        
        # Use A4 for better international compatibility
        doc = SimpleDocTemplate(
            buffer, 
            pagesize=A4,
            rightMargin=0.5*inch,
            leftMargin=0.5*inch,
            topMargin=0.5*inch,
            bottomMargin=0.5*inch
        )
        
        styles = getSampleStyleSheet()
        story = []
        
        # === CUSTOM STYLES ===
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=18,
            spaceAfter=12,
            alignment=1,  # Center
            textColor=colors.HexColor('#2D3748')
        )
        
        header_style = ParagraphStyle(
            'Header',
            parent=styles['Heading2'],
            fontSize=12,
            spaceAfter=6,
            textColor=colors.HexColor('#4A5568')
        )
        
        small_text_style = ParagraphStyle(
            'SmallText',
            parent=styles['Normal'],
            fontSize=8,
            leading=9,
            spaceAfter=4
        )
        
        # === HEADER SECTION ===
        story.append(Paragraph("Accessibility Scan Report", title_style))
        story.append(Paragraph(f"<b>Scanned URL:</b> {scan.url}", styles['Normal']))
        story.append(Paragraph(f"<b>Scan Date:</b> {scan.created_at.strftime('%Y-%m-%d %H:%M') if scan.created_at else 'Unknown'}", styles['Normal']))
        story.append(Spacer(1, 0.3*inch))
        
        # === EXECUTIVE SUMMARY ===
        story.append(Paragraph("Executive Summary", header_style))
        
        # Calculate scores
        error_count = len([i for i in scan.issues if getattr(i, 'type', 'error') == 'error'])
        warning_count = len([i for i in scan.issues if getattr(i, 'type', 'warning') == 'warning'])
        notice_count = len([i for i in scan.issues if getattr(i, 'type', 'notice') == 'notice'])
        total_issues = len(scan.issues)
        score = max(0, 100 - (error_count * 5 + warning_count * 2 + notice_count))
        
        summary_data = [
            ["Total Issues", "Errors", "Warnings", "Notices", "Score"],
            [
                str(total_issues),
                str(error_count),
                str(warning_count), 
                str(notice_count),
                f"{score}/100"
            ]
        ]
        
        summary_table = Table(summary_data, colWidths=[1.2*inch]*5)
        summary_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#4A5568')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONT', (0, 0), (-1, 0), 'Helvetica-Bold', 9),
            ('FONT', (0, 1), (-1, 1), 'Helvetica', 10),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ]))
        
        story.append(summary_table)
        story.append(Spacer(1, 0.3*inch))
        
        # === DETAILED ISSUES SECTION ===
        if scan.issues:
            story.append(Paragraph("Detailed Issues", header_style))
            story.append(Spacer(1, 0.1*inch))
            
            # Helper functions for text formatting
            def format_wcag_code(code):
                """Simplify long WCAG codes"""
                if not code:
                    return ""
                simplified = code.replace('WCAG2AA.Principle', 'P')
                simplified = simplified.replace('Guideline', 'G')
                return simplified[:35] + '...' if len(simplified) > 35 else simplified
            
            def wrap_text(text, width=70):
                """Wrap long text properly"""
                if not text:
                    return ""
                try:
                    clean_text = str(text).strip()
                    wrapped = textwrap.fill(clean_text, width=width)
                    return wrapped[:200] + '...' if len(wrapped) > 200 else wrapped
                except:
                    return str(text)[:150] + '...' if len(str(text)) > 150 else str(text)
            
            # Create issues table with better column widths
            table_data = [['Type', 'WCAG Code', 'Issue Description', 'AI Recommendation']]
            
            for issue in scan.issues:
                issue_type = getattr(issue, 'type', 'error')
                recommendation = getattr(issue, 'recommendation_text', None)
                
                # Color code the type
                type_display = issue_type.upper()
                
                table_data.append([
                    type_display,
                    format_wcag_code(issue.code),
                    wrap_text(issue.message, 60),
                    wrap_text(recommendation, 60) if recommendation else "No AI recommendation available"
                ])
            
            # Optimized column widths for A4 paper
            col_widths = [0.6*inch, 1.3*inch, 2.5*inch, 2.5*inch]
            
            issues_table = Table(table_data, colWidths=col_widths, repeatRows=1)
            
            # Enhanced table styling
            issues_table.setStyle(TableStyle([
                # Header row
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2D3748')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
                ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
                ('FONT', (0, 0), (-1, 0), 'Helvetica-Bold', 7),
                ('VALIGN', (0, 0), (-1, 0), 'MIDDLE'),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
                
                # Data rows
                ('FONT', (0, 1), (-1, -1), 'Helvetica', 6),
                ('VALIGN', (0, 1), (-1, -1), 'TOP'),
                ('ALIGN', (0, 1), (0, -1), 'CENTER'),  # Type column centered
                ('ALIGN', (1, 1), (-1, -1), 'LEFT'),   # Other columns left-aligned
                
                # Grid and alternating colors
                ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
                ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f7fafc')]),
                
                # Word wrap for text-heavy columns
                ('WORDWRAP', (2, 1), (-1, -1), True),
                
                # Type column styling based on severity
                ('TEXTCOLOR', (0, 1), (0, -1), 
                 lambda r, c, data: 
                    colors.red if data and data[r][c] == 'ERROR' 
                    else colors.orange if data and data[r][c] == 'WARNING' 
                    else colors.blue),
                ('FONT', (0, 1), (0, -1), 'Helvetica-Bold', 6),
            ]))
            
            story.append(issues_table)
        else:
            story.append(Paragraph("✅ No accessibility issues found!", styles['Heading2']))
        
        # === FOOTER ===
        story.append(Spacer(1, 0.3*inch))
        footer_style = ParagraphStyle(
            'Footer',
            parent=styles['Normal'],
            fontSize=8,
            textColor=colors.grey,
            alignment=1  # Center
        )
        story.append(Paragraph("Generated by AdaptiveTest AI - Automated Accessibility Scanner", footer_style))
        
        # === BUILD PDF ===
        doc.build(story)
        buffer.seek(0)
        
        # Create filename
        from urllib.parse import urlparse
        hostname = urlparse(scan.url).hostname or "website"
        safe_hostname = hostname.replace('.', '_')
        filename = f"accessibility-report-{safe_hostname}-{scan.id}.pdf"
        
        headers = {
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Access-Control-Expose-Headers": "Content-Disposition"
        }
        
        return StreamingResponse(
            buffer, 
            media_type="application/pdf", 
            headers=headers
        )
        
    except ImportError:
        logger.warning("ReportLab not installed, using simple PDF fallback")
        raise HTTPException(status_code=501, detail="PDF generation not available. Install reportlab.")
    except Exception as e:
        logger.error(f"PDF generation error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"PDF generation failed: {str(e)}")