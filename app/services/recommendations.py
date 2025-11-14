# app/services/recommendations.py
"""
Production-ready recommendation service with caching and fallbacks
"""
from sqlalchemy.orm import Session
import logging
from app.models import ScanIssue

logger = logging.getLogger(__name__)

# Pre-defined recommendations for common issues
PREDEFINED_RECOMMENDATIONS = {
    "color-contrast": "Ensure text has sufficient color contrast ratio (at least 4.5:1 for normal text, 3:1 for large text). Use tools like WebAIM Contrast Checker to verify.",
    "image-alt": "Add descriptive alt text that conveys the content and function of images. For decorative images, use empty alt attribute: alt=''.",
    "link-name": "Ensure all links have discernible text. Add aria-label or visible text content that describes the link destination.",
    "button-name": "Buttons must have accessible names. Use aria-label or inner text content to describe the button's function.",
    "document-title": "Provide a descriptive title for the web page using the <title> element in the <head> section.",
    "html-has-lang": "Specify a valid language attribute on the HTML element (e.g., <html lang='en'>).",
    "aria-hidden-focus": "Ensure elements with aria-hidden='true' are not focusable. Remove tabindex or set it to -1.",
    "label": "Associate form controls with labels using the for attribute or by nesting the control inside the label.",
    "input-button-name": "Provide a descriptive value attribute for input buttons, or use a <button> element with text content."
}

def get_or_create_recommendation(
    db: Session,
    rule_code: str,
    description: str | None = None,
    issue_id: int | None = None,
) -> str:
    """
    Get cached recommendation or create new one with fallbacks
    """
    if not rule_code:
        return "No recommendation available for this issue."
    
    # 1) Check predefined recommendations first (fastest)
    predefined_rec = PREDEFINED_RECOMMENDATIONS.get(rule_code.lower())
    if predefined_rec:
        logger.info(f"Using predefined recommendation for: {rule_code}")
        return persist_recommendation(db, issue_id, predefined_rec)
    
    # 2) Check database cache
    existing = (
        db.query(ScanIssue)
        .filter(ScanIssue.code == rule_code)
        .filter(ScanIssue.recommendation_text.isnot(None))
        .first()
    )
    if existing and existing.recommendation_text:
        logger.info(f"Using cached recommendation for: {rule_code}")
        return persist_recommendation(db, issue_id, existing.recommendation_text)
    
    # 3) Generate with OpenAI or use fallback
    try:
        from app.integrations.openai_client import generate_recommendation_text
        
        prompt = f"""
        Accessibility issue detected:
        Rule Code: {rule_code}
        Description: {description or 'Not provided'}
        
        Provide a clear, actionable recommendation (1-2 sentences) for how to fix this accessibility issue.
        Focus on practical steps developers can take.
        """
        
        recommendation_text = generate_recommendation_text(prompt).strip()
        
    except Exception as e:
        logger.warning(f"OpenAI generation failed for {rule_code}: {e}")
        # Fallback recommendation
        recommendation_text = f"Review and fix the {rule_code} accessibility issue. Follow WCAG 2.1 guidelines and test with screen readers."
    
    return persist_recommendation(db, issue_id, recommendation_text)

def persist_recommendation(db: Session, issue_id: int | None, recommendation: str) -> str:
    """Persist recommendation to database if issue_id provided"""
    if issue_id:
        try:
            issue = db.get(ScanIssue, issue_id)
            if issue:
                issue.recommendation_text = recommendation
                db.add(issue)
                db.commit()
                db.refresh(issue)
        except Exception as e:
            logger.error(f"Failed to persist recommendation for issue {issue_id}: {e}")
    
    return recommendation