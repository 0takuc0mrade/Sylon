import os
import json
import csv
import uuid
from datetime import datetime, timezone
from agents.alibaba_integration import call_cerebras_json

# storage
DATA_ROOT = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "businesses")


def _ensure_dir(business_id: str) -> str:
#Creates the business data directory and returns its path.
    path = os.path.join(DATA_ROOT, business_id)
    os.makedirs(path, exist_ok=True)
    return path


def _save_reviews(business_id: str, reviews: list) -> str:
    biz_dir = _ensure_dir(business_id)
    reviews_path = os.path.join(biz_dir, "reviews.json")

    existing = []
    if os.path.exists(reviews_path):
        with open(reviews_path, "r") as f:
            existing = json.load(f)

    # Deduplicate by text content (simple hash)
    existing_texts = {r["text"].strip().lower() for r in existing}
    new_reviews = [r for r in reviews if r["text"].strip().lower() not in existing_texts]

    combined = existing + new_reviews
    with open(reviews_path, "w") as f:
        json.dump(combined, f, indent=2, default=str)

    print(f"[Ingest] Saved {len(new_reviews)} new reviews ({len(combined)} total) for business {business_id}")
    return reviews_path


def _normalize_review(raw: dict, source: str = "unknown") -> dict:
# to normalize a raw review dict to the standard schema.
    return {
        "text": str(raw.get("text", raw.get("review_text", raw.get("comment", "")))).strip(),
        "rating": float(raw.get("rating", raw.get("stars", raw.get("score", 3.0)))),
        "date": raw.get("date", None),
        "author_id": raw.get("author_id", raw.get("author", raw.get("name", f"anonymous_{uuid.uuid4().hex[:6]}"))),
        "source": raw.get("source", source),
        "ingested_at": datetime.now(timezone.utc).isoformat(),
    }


# Ingestion Methods
def ingest_csv(file_path: str, business_id: str) -> list:
# reads a CSV file and normalizes reviews.
    reviews = []
    with open(file_path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            normalized = _normalize_review(row, source="csv")
            if normalized["text"]:
                reviews.append(normalized)

    _save_reviews(business_id, reviews)
    return reviews


def ingest_json(data: list, business_id: str) -> list:
#accepts a list of review dicts directly.
    reviews = [_normalize_review(r, source="json") for r in data if r.get("text")]
    _save_reviews(business_id, reviews)
    return reviews


def ingest_pdf(file_path: str, business_id: str) -> list:
    import pdfplumber
    text = ""
    with pdfplumber.open(file_path) as pdf:
        for page in pdf.pages:
            text += page.extract_text() or ""
    return ingest_text(text, business_id)


def ingest_image(file_path: str, business_id: str) -> list:
    import pytesseract
    from PIL import Image
    text = pytesseract.image_to_string(Image.open(file_path))
    return ingest_text(text, business_id)

def ingest_text(raw_text: str, business_id: str) -> list:
#use Cerebras to parse messy pasted text into structured reviews.the business owner can paste a wall of review text from any source this function extracts individual reviews with ratings.
    prompt = f"""
You are a review parser. The user pasted raw review text from their business.
Extract individual reviews from this text. For each review, return:
- "text": the review content (the actual customer feedback)
- "rating": inferred rating 1-5 (if not explicitly stated, infer from sentiment)
- "date": if a date is mentioned, otherwise null
- "author_id": if a name or handle is visible, otherwise "anonymous_1", "anonymous_2", etc.

IMPORTANT: Return ONLY a JSON object with a "reviews" key containing an array of review objects.
If you can only find one review, still return it as a single-element array.
If the text doesn't look like reviews at all, treat the entire text as one review and infer a rating.

Example output format:
{{"reviews": [{{"text": "Great food but slow service", "rating": 3, "date": null, "author_id": "anonymous_1"}}]}}

RAW TEXT TO PARSE:
\"\"\"
{raw_text}
\"\"\""""

    try:
        result = call_cerebras_json(
            prompt=prompt,
            system_prompt="You are a precise review parser. Output valid JSON only.",
            temperature=0.3,
            max_tokens=4000,
        )

        # Handle both {"reviews": [...]} and direct array
        if isinstance(result, dict) and "reviews" in result:
            raw_reviews = result["reviews"]
        elif isinstance(result, list):
            raw_reviews = result
        else:
            # Wrap the whole thing as one review
            raw_reviews = [{"text": raw_text, "rating": 3}]

        reviews = [_normalize_review(r, source="pasted") for r in raw_reviews if r.get("text")]

    except Exception as e:
        print(f"[Ingest] LLM parsing failed ({e}), treating as single review")
        reviews = [_normalize_review({"text": raw_text, "rating": 3}, source="pasted")]

    _save_reviews(business_id, reviews)
    return reviews


# Utility
def load_reviews(business_id: str) -> list:
#Loads all reviews for a business from disk.
    reviews_path = os.path.join(DATA_ROOT, business_id, "reviews.json")
    if not os.path.exists(reviews_path):
        return []
    with open(reviews_path, "r") as f:
        return json.load(f)


def get_review_count(business_id: str) -> int:
    return len(load_reviews(business_id))


def list_businesses() -> list:
    if not os.path.exists(DATA_ROOT):
        return []
    return [d for d in os.listdir(DATA_ROOT) if os.path.isdir(os.path.join(DATA_ROOT, d))]


if __name__ == "__main__":
    # Quick test with sample pasted text
    sample = """
    John D. - ★★★★★ - Jan 15, 2025
    The jollof rice here is absolutely incredible. Best I've had in Lagos.
    Service was quick and the staff were friendly. Will definitely come back.

    Sarah M. - ★★☆☆☆ - Feb 3, 2025
    Waited 40 minutes for my food during lunch rush. When it finally came,
    the portions were tiny for the price. The food itself was good but not
    worth the wait or the cost. Staff seemed overwhelmed.

    Anonymous - March 2025
    Decent spot for a quick meal. Nothing special but nothing terrible either.
    The suya was good. Would have liked more seating options.
    """
    test_id = "test_business_001"
    reviews = ingest_text(sample, test_id)
    print(json.dumps(reviews, indent=2))
