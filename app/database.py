import os
from sqlalchemy import create_engine, text  # ADDED: import text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import logging

logger = logging.getLogger(__name__)

DATABASE_URL = os.environ.get('DATABASE_URL')

if not DATABASE_URL:
    logger.warning("DATABASE_URL not set, using SQLite fallback")
    DATABASE_URL = "sqlite:///./adaptivetest.db"

# Ensure proper PostgreSQL format
if DATABASE_URL.startswith('postgres://'):
    DATABASE_URL = DATABASE_URL.replace('postgres://', 'postgresql://', 1)

logger.info(f"Connecting to: {DATABASE_URL.split('@')[-1].split('?')[0]}")

try:
    # Base engine configuration
    engine_config = {
        'pool_pre_ping': True,
        'pool_recycle': 300,
        'echo': False
    }
    
    # ADD THIS: Check if it's Supabase and add SSL requirement
    if 'supabase' in DATABASE_URL:
        logger.info("🔌 Supabase detected, adding SSL requirements")
        engine_config['connect_args'] = {
            'sslmode': 'require',
            'connect_timeout': 30
        }
    
    engine = create_engine(DATABASE_URL, **engine_config)
    
    # FIXED: Wrap raw SQL in text()
    with engine.connect() as conn:
        conn.execute(text("SELECT 1"))  # CHANGED: added text()
    
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    Base = declarative_base()
    logger.info("✅ Database connection successful")
    
except Exception as e:
    logger.error(f"❌ Database connection failed: {e}")
    logger.info("🔄 Falling back to SQLite")
    
    DATABASE_URL = "sqlite:///./adaptivetest.db"
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def create_tables():
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("✅ Database tables created successfully")
    except Exception as e:
        logger.error(f"❌ Error creating tables: {e}")