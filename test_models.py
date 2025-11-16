# test_models.py
from app.database import Base, engine
from app.models import ScanResult, ScanIssue
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def test_models():
    try:
        print("🔍 Checking database models...")
        
        # List all tables in Base
        tables = Base.metadata.tables.keys()
        print(f"📋 Tables in metadata: {list(tables)}")
        
        # Try to create tables
        print("🏗️ Creating tables...")
        Base.metadata.create_all(bind=engine)
        print("✅ Tables created successfully!")
        
        # Check if tables exist
        with engine.connect() as conn:
            from sqlalchemy import text
            result = conn.execute(text("SELECT name FROM sqlite_master WHERE type='table';"))
            tables = [row[0] for row in result]
            print(f"📊 Actual tables in database: {tables}")
            
    except Exception as e:
        logger.error(f"❌ Failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_models()
