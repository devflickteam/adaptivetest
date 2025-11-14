from sqlalchemy.orm import Session
from app.database import SessionLocal, engine
from app.models import User, ScanResult
from passlib.hash import bcrypt


def seed_admin():
    db: Session = SessionLocal()
    try:
        # Check if admin exists
        existing = db.query(User).filter(User.email == "admin@example.com").first()
        if existing:
            print("⚠️ Admin already exists:", existing.email)
            return

        admin = User(
            username="admin",
            email="admin@example.com",
            password=bcrypt.hash("admin123"),  # default password
            role="admin"
        )
        db.add(admin)
        db.commit()
        db.refresh(admin)
        print("✅ Admin user created:", admin.email)
    finally:
        db.close()


def seed_scan():
    db: Session = SessionLocal()
    try:
        scan = ScanResult(url="https://example.com", status="seeded")
        db.add(scan)
        db.commit()

        count = db.query(ScanResult).count()
        print(f"✅ Database seeded successfully. Total ScanResults: {count}")
    finally:
        db.close()


if __name__ == "__main__":
    seed_admin()
    seed_scan()
