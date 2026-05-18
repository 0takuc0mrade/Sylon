import os
import json
import math
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if ROOT not in sys.path:
    sys.path.insert(0, ROOT)

from agents.llm_client import call_cerebras_json, call_cerebras

# constants
CHUNK_SIZE = 25  # reviews per map batch
DATA_ROOT = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "businesses")


def _ensure_dir(business_id: str) -> str:
    path = os.path.join(DATA_ROOT, business_id)
    os.makedirs(path, exist_ok=True)
    return path


# map phase: extract themes from a batch of reviews
def _map_extract_themes(review_batch: list, batch_index: int) -> dict:
    # extracts complaint themes, praise themes, and trends from a single batch.
    reviews_text = "\n\n---\n\n".join(
        f"[Rating: {r.get('rating', '?')}/5] {r['text']}"
        for r in review_batch
    )

    prompt = f"""Analyze these customer reviews and extract recurring themes.

REVIEWS (Batch {batch_index + 1}):
\"\"\"
{reviews_text}
\"\"\"

Return a JSON object with exactly these keys:
{{
  "complaints": [
    {{"theme": "short description", "count": <number of reviews mentioning this>, "severity": "low|medium|high", "quotes": ["exact quote 1", "exact quote 2"]}}
  ],
  "praise": [
    {{"theme": "short description", "count": <number>, "quotes": ["exact quote 1"]}}
  ],
  "trends": [
    {{"pattern": "description of trend", "direction": "improving|worsening|stable"}}
  ]
}}

Rules:
- Use EXACT quotes from the reviews, not paraphrases
- A theme must appear in at least 2 reviews to be included (unless batch is small)
- Severity is based on how much this issue affects the customer's overall experience
- Keep quotes short (under 20 words each)
- Maximum 5 complaints, 5 praise items, 3 trends per batch"""

    try:
        result = call_cerebras_json(
            prompt=prompt,
            system_prompt="You are a customer feedback analyst. Extract themes with exact quotes. Output valid JSON only.",
            temperature=0.3,
            max_tokens=2000,
        )
        return result
    except Exception as e:
        print(f"[Painpoints] Map phase failed for batch {batch_index}: {e}")
        return {"complaints": [], "praise": [], "trends": []}


# merge and deduplicate themes across batches
def _reduce_themes(batch_results: list) -> dict:
    # merges themes from all map batches, deduplicates, and tallies frequencies.
    if len(batch_results) == 1:
        result = batch_results[0]
        for complaint in result.get("complaints", []):
            complaint["frequency"] = complaint.pop("count", 1)
        for praise in result.get("praise", []):
            praise["frequency"] = praise.pop("count", 1)
        return result

    # ask LLM to merge
    batches_json = json.dumps(batch_results, indent=2)

    prompt = f"""You have theme extractions from multiple batches of customer reviews.
Merge them into a single consolidated analysis.

BATCH RESULTS:
{batches_json}

Rules:
- Combine similar themes (e.g., "slow service" and "long wait times" → one theme)
- Sum up counts across batches into a "frequency" field
- Keep the best 2-3 representative quotes per theme
- Rank by frequency (highest first)
- Determine overall severity based on frequency and impact
- For trends, merge overlapping patterns

Return a JSON object:
{{
  "complaints": [
    {{"theme": "merged theme", "frequency": <total count>, "severity": "low|medium|high", "quotes": ["quote1", "quote2"]}}
  ],
  "praise": [
    {{"theme": "merged theme", "frequency": <total count>, "quotes": ["quote1", "quote2"]}}
  ],
  "trends": [
    {{"pattern": "description", "direction": "improving|worsening|stable", "timeframe": "if detectable"}}
  ]
}}"""

    try:
        return call_cerebras_json(
            prompt=prompt,
            system_prompt="You are a data analyst merging customer feedback themes. Output valid JSON only.",
            temperature=0.3,
            max_tokens=3000,
        )
    except Exception as e:
        print(f"[Painpoints] Reduce phase failed: {e}")
        # just concatenate all batch results
        merged = {"complaints": [], "praise": [], "trends": []}
        for batch in batch_results:
            merged["complaints"].extend(batch.get("complaints", []))
            merged["praise"].extend(batch.get("praise", []))
            merged["trends"].extend(batch.get("trends", []))
        return merged


def extract_painpoints(reviews: list, business_id: str) -> dict:
    if not reviews:
        return {"complaints": [], "praise": [], "trends": []}

    #chunk reviews into batches
    num_chunks = math.ceil(len(reviews) / CHUNK_SIZE)
    print(f"[Painpoints] Processing {len(reviews)} reviews in {num_chunks} batch(es)...")

    batch_results = []
    for i in range(num_chunks):
        batch = reviews[i * CHUNK_SIZE : (i + 1) * CHUNK_SIZE]
        print(f"  [MAP] Batch {i + 1}/{num_chunks} ({len(batch)} reviews)...")
        result = _map_extract_themes(batch, i)
        batch_results.append(result)

    # merge all batch results
    print(f"  [REDUCE] Merging {len(batch_results)} batch results...")
    painpoints = _reduce_themes(batch_results)

    # save to disk
    biz_dir = _ensure_dir(business_id)
    painpoints_path = os.path.join(biz_dir, "painpoints.json")
    with open(painpoints_path, "w") as f:
        json.dump(painpoints, f, indent=2)

    complaint_count = len(painpoints.get("complaints", []))
    praise_count = len(painpoints.get("praise", []))
    trend_count = len(painpoints.get("trends", []))
    print(f"[Painpoints] Done: {complaint_count} complaints, {praise_count} praise themes, {trend_count} trends")

    return painpoints


# excavate grounded personas from reviews
def excavate_personas_from_reviews(
    reviews: list,
    painpoints: dict,
    business_id: str,
    max_personas: int = 3,
) -> list:
    # clusters reviews by behavioral pattern and builds grounded customer archetypes.
    reviews_text = "\n\n---\n\n".join(
        f"[Rating: {r.get('rating', '?')}/5] [Author: {r.get('author_id', 'anon')}] {r['text']}"
        for r in reviews[:75]  # cap at 75 reviews to stay within context
    )

    painpoints_summary = json.dumps(painpoints, indent=2) if painpoints else "No painpoints extracted yet."

    prompt = f"""You are an expert consumer psychologist. Analyze these real customer reviews and identify
{max_personas} distinct customer archetypes (behavioral clusters).

CUSTOMER REVIEWS:
\"\"\"
{reviews_text}
\"\"\"

KNOWN PAINPOINTS & PRAISE:
{painpoints_summary}

For EACH archetype, provide a JSON object with these exact fields:
- "name": A respectful archetype label based on observable behavior (e.g., "The Lunch-Rush Regular", "The Detail-Oriented Diner", "The Weekend Explorer"). NEVER use judgmental or demeaning labels like "detail‑oriented customer", "budget‑conscious customer", "complainer". Describe behavior, not character.
- "narrative": A 100-150 word character portrait GROUNDED in the actual reviews.
  Reference specific things these customers said. Write like you know this person.
  Include their priorities, pet peeves, what they notice first, what makes them leave a bad review.
  End with one sentence about what they would never forgive.
- "drifts": A list of 1-2 behavioral drift strings inferred from the reviews
  (e.g., "Initially forgiving of wait times, now increasingly impatient")
- "avg_rating": Their typical rating based on the reviews (float, e.g., 3.8)
- "top_words": 5-8 words they frequently use, pulled from actual review text
- "grounding_quotes": 2-3 exact quotes from reviews that define this archetype
- "review_count": How many of the provided reviews map to this archetype

Return a JSON object: {{"personas": [<array of persona objects>]}}
Do NOT include any explanation outside the JSON."""

    try:
        result = call_cerebras_json(
            prompt=prompt,
            system_prompt="You are a consumer psychologist building data-grounded customer archetypes. Output valid JSON only.",
            temperature=0.5,
            max_tokens=3000,
        )

        if isinstance(result, dict) and "personas" in result:
            personas = result["personas"]
        elif isinstance(result, list):
            personas = result
        else:
            personas = []

        # normalize structure
        normalized = []
        for p in personas:
            normalized.append({
                "name": p.get("name", "Unknown Archetype"),
                "narrative": p.get("narrative", ""),
                "drifts": p.get("drifts", []),
                "avg_rating": float(p.get("avg_rating", 3.5)),
                "top_words": p.get("top_words", []),
                "grounding_quotes": p.get("grounding_quotes", []),
                "review_count": p.get("review_count", 0),
                "source": "grounded",
            })

        # save to disk
        biz_dir = _ensure_dir(business_id)
        personas_path = os.path.join(biz_dir, "personas.json")
        with open(personas_path, "w") as f:
            json.dump(normalized, f, indent=2)

        print(f"[Personas] Excavated {len(normalized)} grounded personas for {business_id}")
        return normalized

    except Exception as e:
        print(f"[Personas] Excavation failed: {e}")
        return []


# loads painpoints from disk for a business.
def load_painpoints(business_id: str) -> dict:
    path = os.path.join(DATA_ROOT, business_id, "painpoints.json")
    if not os.path.exists(path):
        return {"complaints": [], "praise": [], "trends": []}
    with open(path, "r") as f:
        return json.load(f)


def load_personas(business_id: str) -> list:
    # loads grounded personas from disk for a business.
    path = os.path.join(DATA_ROOT, business_id, "personas.json")
    if not os.path.exists(path):
        return []
    with open(path, "r") as f:
        return json.load(f)


if __name__ == "__main__":
    # quick test — requires reviews to already be ingested
    from agents.review_ingest import load_reviews

    test_id = "test_business_001"
    reviews = load_reviews(test_id)
    if reviews:
        painpoints = extract_painpoints(reviews, test_id)
        print("\n=== PAINPOINTS ===")
        print(json.dumps(painpoints, indent=2))

        personas = excavate_personas_from_reviews(reviews, painpoints, test_id)
        print("\n=== PERSONAS ===")
        print(json.dumps(personas, indent=2))
    else:
        print(f"No reviews found for {test_id}. Run review_ingest.py first.")
