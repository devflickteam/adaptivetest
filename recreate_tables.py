# recreate_tables.py
from app.database import Base, engine
from app.models import ScanResult, ScanIssue  # This imports the models
import logging
import os

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def recreate_tables():
    try:
        # Check if SQLite database file exists and remove it
        db_file = "./adaptivetest.db"
        if os.path.exists(db_file):
            os.remove(db_file)
            logger.info(f"🗑️  Removed existing database file: {db_file}")
        
        logger.info("🏗️  Creating tables with correct schema...")
        
        # Import models to ensure they're registered with Base
        from app.models import ScanResult, ScanIssue
        
        # Create all tables
        Base.metadata.create_all(bind=engine)
        logger.info("✅ Created all tables with correct schema")
        
        # Verify tables were created
        with engine.connect() as conn:
            from sqlalchemy import text
            result = conn.execute(text("SELECT name FROM sqlite_master WHERE type='table';"))
            tables = [row[0] for row in result]
            logger.info(f"📋 Created tables: {tables}")
        
        logger.info("🎉 Database schema is now ready!")
        
    except Exception as e:
        logger.error(f"❌ Failed to recreate tables: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    recreate_tables()