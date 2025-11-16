# check_schema_fixed.py
from app.database import engine
from sqlalchemy import text
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def check_schema():
    try:
        with engine.connect() as conn:
            # Simple query to check if tables exist - use text() for raw SQL
            result = conn.execute(text("SELECT name FROM sqlite_master WHERE type='table';"))
            tables = [row[0] for row in result]
            
            print("📋 Database Tables:")
            print("-" * 40)
            for table in tables:
                print(f"📄 {table}")
            print("-" * 40)
            
            if 'scan_issues' in tables:
                print("✅ scan_issues table exists!")
                # Check columns
                result = conn.execute(text("PRAGMA table_info(scan_issues);"))
                columns = [row[1] for row in result]
                
                print("📋 scan_issues columns:")
                for col in columns:
                    print(f"   - {col}")
                
                if 'type' in columns:
                    print("✅ 'type' column exists!")
                else:
                    print("❌ 'type' column is MISSING!")
            else:
                print("❌ scan_issues table does not exist!")
                
    except Exception as e:
        logger.error(f"❌ Failed to check schema: {e}")

if __name__ == "__main__":
    check_schema()