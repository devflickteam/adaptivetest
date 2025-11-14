from app.database import SessionLocal
from app import models


def seed_recommendations():
    db = SessionLocal()

    recommendations = [
        models.Recommendation(text="Ensure all images have descriptive alt text."),
        models.Recommendation(text="Use sufficient color contrast between text and background."),
        models.Recommendation(text="Provide labels for all form fields."),
        models.Recommendation(text="Ensure interactive elements are keyboard accessible."),
        models.Recommendation(text="Use headings in a logical, hierarchical order."),
        models.Recommendation(text="Provide captions and transcripts for multimedia content."),
        models.Recommendation(text="Avoid using content that flashes more than three times per second."),
        models.Recommendation(text="Provide clear and descriptive link text."),
        models.Recommendation(text="Ensure ARIA attributes are used correctly."),
        models.Recommendation(text="Provide skip navigation links for keyboard users."),
    ]

    for rec in recommendations:
        db.add(rec)

    db.commit()
    db.close()
    print("✅ Recommendations seeded successfully!")


if __name__ == "__main__":
    seed_recommendations()
