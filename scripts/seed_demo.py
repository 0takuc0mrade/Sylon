import os
import sys
import uuid

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from openserv.persistence import persistence_service

def seed():
    print("Seeding demo data to SQLite database...")
    business_id = "biz_demo_123"
    batch_id = f"batch_{uuid.uuid4().hex[:8]}"

    # Seed Business
    persistence_service.upsert_business(
        business_id=business_id,
        name="Lagos Tech Cafe",
        description="A popular coffee shop in Yaba serving developers and founders.",
        categories=["Coffee Shop", "Cafe"],
        location={"city": "Lagos", "state": "LA"}
    )
    print(f"Created business: {business_id}")

    # Seed Review Batch
    persistence_service.create_review_batch(
        batch_id=batch_id,
        business_id=business_id,
        source_type="seed",
        review_count=3
    )

    # Seed Reviews
    reviews = [
        {"review_id": f"rev_{uuid.uuid4().hex[:8]}", "business_id": business_id, "batch_id": batch_id, "author_id": "User1", "rating": 5.0, "text": "Great wifi and excellent coffee. Perfect for deep work.", "source": "seed"},
        {"review_id": f"rev_{uuid.uuid4().hex[:8]}", "business_id": business_id, "batch_id": batch_id, "author_id": "User2", "rating": 3.0, "text": "Coffee is good but it gets too noisy in the afternoon and seats are limited.", "source": "seed"},
        {"review_id": f"rev_{uuid.uuid4().hex[:8]}", "business_id": business_id, "batch_id": batch_id, "author_id": "User3", "rating": 2.0, "text": "Waited 20 minutes for a cappuccino. The staff seemed overwhelmed.", "source": "seed"}
    ]
    persistence_service.insert_reviews(reviews)
    print("Inserted reviews")

    # Seed Painpoints
    persistence_service.create_painpoint_snapshot(
        snapshot_id=f"snap_{uuid.uuid4().hex[:8]}",
        business_id=business_id,
        batch_id=batch_id,
        complaints=[{"theme": "Wait times", "count": 1}, {"theme": "Noise level", "count": 1}],
        praise=[{"theme": "Coffee quality", "count": 2}, {"theme": "Wifi", "count": 1}],
        trends=["Increasing complaints about afternoon noise"],
        full_payload={"model": "seed"}
    )
    print("Created painpoint snapshot")

    # Seed Personas
    personas = [
        {"id": f"per_{uuid.uuid4().hex[:8]}", "name": "The Deep Worker", "narrative": "A developer who comes for the wifi and stays for hours.", "avg_rating": 4.5, "drifts": [], "top_words": ["wifi", "work", "quiet"]},
        {"id": f"per_{uuid.uuid4().hex[:8]}", "name": "The Quick Commuter", "narrative": "Needs a fast coffee before heading to the office.", "avg_rating": 2.5, "drifts": ["Increasingly frustrated by wait times"], "top_words": ["wait", "slow", "staff"]}
    ]
    for p in personas:
        persistence_service.upsert_persona(
            persona_id=p["id"], business_id=business_id, name=p["name"], source="seed",
            narrative=p["narrative"], drifts=p["drifts"], avg_rating=p["avg_rating"],
            top_words=p["top_words"], grounding_quotes=[], review_count=3, full_payload={"model": "seed"}
        )
    print(f"Created {len(personas)} personas")

    # Seed Collision Log
    persistence_service.create_collision_log(
        log_id=f"log_{uuid.uuid4().hex[:8]}",
        business_id=business_id,
        scenario="What if we add a dedicated express lane for takeout coffee?",
        source_mode="seed",
        persona_ids=[p["name"] for p in personas],
        collision_analysis="The Quick Commuter strongly supports this, reducing their wait times. The Deep Worker is neutral.",
        strategist_response="Implementing an express lane is highly recommended. It directly addresses the primary dealbreaker for your Quick Commuter segment without alienating your core Deep Worker base."
    )
    print("Created collision log")
    print("Seeding complete. Ready for demo.")

if __name__ == "__main__":
    seed()
