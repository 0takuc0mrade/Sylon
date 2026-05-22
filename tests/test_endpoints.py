from fastapi.testclient import TestClient
from openserv.server import app

client = TestClient(app)

print("Testing Task 1")
resp1 = client.post("/api/task1/generate_review", json={
    "persona": {
        "narrative": "A loyal customer who loves spicy food but hates loud music.",
        "top_words": ["spicy", "loud", "quiet"],
        "avg_rating": 4.0
    },
    "product_details": {
        "name": "Spicy Heaven",
        "categories": "Restaurants, Thai",
        "city": "Austin",
        "state": "TX",
        "price_range": "mid-range",
        "outdoor_seating": True,
        "open_late": False,
        "takes_reservations": True,
        "alcohol": "none",
        "noise_level": "loud",
        "overall_rating": 4.5,
        "review_count": 120
    }
})
print("Task 1 Status:", resp1.status_code)
if resp1.status_code == 200:
    print(resp1.json())
else:
    print(resp1.text)

print("\nTesting Task 2")
resp2 = client.post("/api/task2/recommend", json={
    "persona_narrative": "I love dense, 1000-page historical biographies. I hate shallow beach reads and anything that feels rushed. I need time to sit and reflect on the intricate worldbuilding.",
    "source_domain": "Goodreads Book Reviews"
})
print("Task 2 Status:", resp2.status_code)
if resp2.status_code == 200:
    print(resp2.json())
else:
    print(resp2.text)

