# app/database.py
from sqlalchemy import create_engine, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from app.config import settings
import logging

logger = logging.getLogger(__name__)

# Use the DATABASE_URL from settings
SQLALCHEMY_DATABASE_URL = settings.DATABASE_URL

logger.info(f"Database type: {'PostgreSQL' if 'postgresql' in SQLALCHEMY_DATABASE_URL else 'SQLite'}")

try:
    # If using SQLite
    if SQLALCHEMY_DATABASE_URL.startswith("sqlite"):
        engine = create_engine(
            SQLALCHEMY_DATABASE_URL, 
            connect_args={"check_same_thread": False},
            pool_pre_ping=True
        )
    else:
        # For PostgreSQL (Render)
        engine = create_engine(
            SQLALCHEMY_DATABASE_URL,
            pool_pre_ping=True,
            pool_recycle=300,  # Recycle connections after 5 minutes
            pool_size=5,
            max_overflow=10
        )
    
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    Base = declarative_base()
    
    # Test connection
    with engine.connect() as conn:
        conn.execute(text("SELECT 1"))
    
    logger.info("✅ Database engine created successfully")
    
except Exception as e:
    logger.error(f"❌ Database engine creation failed: {e}")
    raise

def get_db():
    db: Session = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_engine():
    return engine

def create_tables():
    """Create all tables - call this on startup"""
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("✅ Database tables created/verified")
    except Exception as e:
        logger.error(f"❌ Table creation failed: {e}")
        raise