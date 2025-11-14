# main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from app.routes import scan, scan_results
from app.config import settings
from app.database import create_tables
import logging
import traceback

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="AdaptiveTest API",
    version="1.0.0",
    description="Backend for AdaptiveTest - Automated Accessibility Scanner",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Middleware - Enhanced for Render
allowed_origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://adaptivetest-frontend.onrender.com",
]

# Add frontend URL from environment (make sure it's properly formatted)
if settings.frontend_url:
    # Clean the URL - remove trailing slashes
    frontend_url = settings.frontend_url.rstrip('/')
    if frontend_url not in allowed_origins:
        allowed_origins.append(frontend_url)

# Add the backend URL for same-origin requests (optional but good practice)
if settings.backend_url:
    backend_url = settings.backend_url.rstrip('/')
    if backend_url not in allowed_origins:
        allowed_origins.append(backend_url)

# For development, allow common localhost variations
if settings.env == "development":
    allowed_origins.extend([
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ])

logger.info(f"CORS allowed origins: {allowed_origins}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=[
        "Content-Type",
        "Authorization", 
        "Accept",
        "Origin",
        "X-Requested-With",
        "Access-Control-Allow-Headers",
        "Access-Control-Allow-Origin"
    ],
)

# Initialize database tables on startup
@app.on_event("startup")
async def startup_event():
    try:
        create_tables()
        logger.info("🚀 AdaptiveTest API started successfully")
        logger.info(f"📋 CORS configured for {len(allowed_origins)} origins")
    except Exception as e:
        logger.error(f"❌ Startup failed: {e}")
        logger.error(traceback.format_exc())

# Routers
app.include_router(scan.router, prefix="/api/v1", tags=["scans"])
app.include_router(scan_results.router, prefix="/api/v1", tags=["results"])

@app.get("/")
def root():
    try:
        return {
            "message": "AdaptiveTest API is running", 
            "status": "healthy",
            "version": "1.0.0",
            "environment": settings.env,
            "docs": "/docs",
            "cors_origins_count": len(allowed_origins)
        }
    except Exception as e:
        logger.error(f"Root endpoint crashed: {e}")
        return {"error": "Server configuration issue", "detail": str(e)}

@app.get("/health")
def health_check():
    try:
        # Test database connection
        from app.database import SessionLocal
        db = SessionLocal()
        db.execute(text("SELECT 1"))
        db.close()
        
        return {
            "status": "healthy", 
            "service": "AdaptiveTest API", 
            "version": "1.0.0",
            "environment": settings.env,
            "database": "connected",
            "cors_enabled": True
        }
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return {
            "status": "unhealthy", 
            "service": "AdaptiveTest API", 
            "error": str(e)
        }

@app.get("/cors-info")
def cors_info():
    """Endpoint to check CORS configuration"""
    return {
        "allowed_origins": allowed_origins,
        "environment": settings.env,
        "frontend_url": settings.frontend_url,
        "backend_url": settings.backend_url
    }

@app.get("/info")
def info():
    """Debug endpoint to see configuration"""
    return {
        "environment": settings.env,
        "database_type": "PostgreSQL" if "postgresql" in settings.DATABASE_URL else "SQLite",
        "frontend_url": settings.frontend_url,
        "backend_url": settings.backend_url,
        "openai_configured": bool(settings.openai_api_key),
        "cors_origins": len(allowed_origins)
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)