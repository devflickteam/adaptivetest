# check_schema.py
from app.database import engine
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def check_schema():
    try:
        with engine.connect() as conn:
            # For SQLite
            result = conn.execute("""
                SELECT name FROM sqlite_master 
                WHERE type='table' AND name='scan_issues';
            """)
            
            table_exists = result.fetchone()
            if not table_exists:
                print("❌ scan_issues table does not exist!")
                return
            
            # Get columns for scan_issues table
            result = conn.execute("PRAGMA table_info(scan_issues);")
            
            print("📋 scan_issues table columns:")
            print("-" * 60)
            columns = []
            for row in result:
                columns.append(row[1])  # column name is at index 1
                print(f"{row[1]:<20} {row[2]:<15}")
            print("-" * 60)
            
            # Check if 'type' column exists
            if 'type' in columns:
                print("✅ 'type' column exists!")
            else:
                print("❌ 'type' column is MISSING!")
                
    except Exception as e:
        logger.error(f"❌ Failed to check schema: {e}")

if __name__ == "__main__":
    check_schema()