# main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from routes import scan, scan_results
from config import settings
from database import create_tables
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

# CORS Middleware - FIXED VERSION
allowed_origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://adaptivetest-frontend.onrender.com",
    "https://adaptivetest.adaptiveatelier.com",
    "https://www.adaptivetest.adaptiveatelier.com",
    "http://localhost:8000",
]

# Add environment-specific origins
if settings.env == "development":
    allowed_origins.extend([
        "http://localhost:3001",
        "http://127.0.0.1:3001",
    ])
else:
    # Production - ensure all production domains are included
    production_domains = [
        "https://adaptivetest.adaptiveatelier.com",
        "https://www.adaptivetest.adaptiveatelier.com",
    ]
    for domain in production_domains:
        if domain not in allowed_origins:
            allowed_origins.append(domain)

# Handle frontend URL from environment with proper normalization
if settings.frontend_url:
    # Normalize the URL - remove trailing slashes and ensure proper format
    frontend_url = settings.frontend_url.rstrip('/')
    
    # Add both http and https versions if needed
    if frontend_url.startswith('http://'):
        https_version = frontend_url.replace('http://', 'https://')
        if https_version not in allowed_origins:
            allowed_origins.append(https_version)
    elif frontend_url.startswith('https://'):
        http_version = frontend_url.replace('https://', 'http://')
        if http_version not in allowed_origins:
            allowed_origins.append(http_version)
    
    # Add www and non-www versions
    if frontend_url.startswith('https://'):
        if 'www.' not in frontend_url:
            www_version = frontend_url.replace('https://', 'https://www.')
            if www_version not in allowed_origins:
                allowed_origins.append(www_version)
        else:
            non_www_version = frontend_url.replace('https://www.', 'https://')
            if non_www_version not in allowed_origins:
                allowed_origins.append(non_www_version)

logger.info(f"✅ CORS configured for {len(allowed_origins)} origins")
logger.info(f"🌐 Allowed origins: {allowed_origins}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],  # Simplified - allow all headers
)

# Initialize database tables on startup
@app.on_event("startup")
async def startup_event():
    try:
        create_tables()
        logger.info("🚀 AdaptiveTest API started successfully")
        logger.info(f"📋 CORS configured for {len(allowed_origins)} origins")
        logger.info(f"🌐 Frontend URL: {settings.frontend_url}")
        logger.info(f"🏷️ Environment: {settings.env}")
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
            "cors_origins_count": len(allowed_origins),
            "your_frontend_domain": "https://adaptivetest.adaptiveatelier.com",
            "frontend_in_cors": "https://adaptivetest.adaptiveatelier.com" in allowed_origins
        }
    except Exception as e:
        logger.error(f"Root endpoint crashed: {e}")
        return {"error": "Server configuration issue", "detail": str(e)}

@app.get("/health")
def health_check():
    try:
        # Test database connection
        from database import SessionLocal
        db = SessionLocal()
        db.execute(text("SELECT 1"))
        db.close()
        
        return {
            "status": "healthy", 
            "service": "AdaptiveTest API", 
            "version": "1.0.0",
            "environment": settings.env,
            "database": "connected",
            "cors_enabled": True,
            "frontend_domain_included": "https://adaptivetest.adaptiveatelier.com" in allowed_origins,
            "cors_origins_count": len(allowed_origins)
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
    frontend_included = "https://adaptivetest.adaptiveatelier.com" in allowed_origins
    www_included = "https://www.adaptivetest.adaptiveatelier.com" in allowed_origins
    
    return {
        "allowed_origins": allowed_origins,
        "environment": settings.env,
        "frontend_url": settings.frontend_url,
        "backend_url": settings.backend_url,
        "your_domain_included": frontend_included,
        "www_domain_included": www_included,
        "total_origins": len(allowed_origins),
        "cors_status": "✅ Configured" if frontend_included else "❌ Misconfigured"
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
        "cors_origins": len(allowed_origins),
        "your_domain": "https://adaptivetest.adaptiveatelier.com",
        "domain_in_cors": "https://adaptivetest.adaptiveatelier.com" in allowed_origins,
        "www_domain_in_cors": "https://www.adaptivetest.adaptiveatelier.com" in allowed_origins
    }

# Additional CORS test endpoint
@app.options("/api/v1/{rest_of_path:path}")
async def options_handler(rest_of_path: str):
    """Handle preflight OPTIONS requests"""
    return {"message": "CORS preflight OK"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)