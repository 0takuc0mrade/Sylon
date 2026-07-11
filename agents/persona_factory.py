# Persona Factory
import os
import json
# pyrefly: ignore [missing-import]
from dotenv import load_dotenv

from agents.alibaba_integration import call_cerebras_json, retry_with_backoff
from agents.review_ingest import load_reviews
from agents.painpoint_extractor import (
    extract_painpoints,
    excavate_personas_from_reviews,
    load_painpoints,
    load_personas,
)

load_dotenv()

# Phase 1: Synthetic Personas (always available — cold start / fallback)
@retry_with_backoff
def generate_synthetic_personas(business_description: str, location: str = "", count: int = 3) -> list:
    # generates synthetic customer personas based on a business description.
    prompt = f"""
You are an expert consumer psychologist. Generate exactly {count} psychologically distinct customer archetypes
who would realistically visit a business described as: "{business_description}"
{"Located in: " + location if location else ""}
If the location is in Africa or Nigeria specifically, ground the archetypes in 
local consumer behavior: price sensitivity, the role of word-of-mouth, 
informal feedback culture, and what "value" means in that market.

For EACH archetype, provide a JSON object with these exact fields:
- "name": A short archetype label (e.g., "The Weekend Explorer", "The Budget Loyalist")
- "narrative": A 100-150 word precise, specific character portrait. Write like you know this person.
  Include their priorities, pet peeves, what they notice first, what makes them leave a bad review.
  End with one sentence about what they would never forgive.
- "drifts": A list of 1-2 behavioral drift strings (e.g., "Rating drift: became harsher over time (4.2 → 3.1)")
- "avg_rating": Their typical average rating as a float (e.g., 3.8)
- "top_words": A list of 5-8 words they frequently use in reviews

Return ONLY a valid JSON array of {count} objects. No markdown, no explanation.
"""

    try:
        raw = call_cerebras_json(prompt)
        personas = json.loads(raw)

        # Handle if wrapped in an object
        if isinstance(personas, dict):
            personas = personas.get("personas", personas.get("archetypes", [personas]))

        # Normalize to ensure consistent structure
        normalized = []
        for p in personas:
            normalized.append({
                'name': p.get('name', 'Unknown Archetype'),
                'narrative': p.get('narrative', ''),
                'drifts': p.get('drifts', []),
                'avg_rating': float(p.get('avg_rating', 3.5)),
                'top_words': p.get('top_words', []),
                'grounding_quotes': [],
                'source': 'synthetic',
            })
        return normalized

    except Exception as e:
        print(f"[Persona Factory] Error generating synthetic personas: {e}")
        # Return a single fallback persona so the pipeline doesn't crash
        return [{
            'name': 'Generic Customer',
            'narrative': 'A typical customer with moderate expectations who values cleanliness and friendly service.',
            'drifts': [],
            'avg_rating': 3.5,
            'top_words': ['service', 'clean', 'friendly', 'price', 'atmosphere'],
            'grounding_quotes': [],
            'source': 'fallback',
        }]


# Phase 2: Grounded Personas (from real uploaded reviews)
def generate_grounded_personas(business_id: str, max_personas: int = 3) -> dict:
    reviews = load_reviews(business_id)
    if not reviews:
        return {'personas': [], 'painpoints': {}, 'review_count': 0}
    painpoints = extract_painpoints(reviews, business_id)
    personas = excavate_personas_from_reviews(reviews, painpoints, business_id, max_personas)

    return {
        'personas': personas,
        'painpoints': painpoints,
        'review_count': len(reviews),
    }


# Hybrid Mode: Blend synthetic + grounded when < 5 reviews
def get_personas_for_business(
    business_id: str = None,
    business_description: str = "Local Business",
    location: str = "",
    persona_count: int = 3,
) -> tuple:
    # smart persona selection:
    if business_id:
        reviews = load_reviews(business_id)
        review_count = len(reviews)

        if review_count >= 5:
            # Full grounded mode
            print(f"[Persona Factory] Grounded mode ({review_count} reviews)")
            painpoints = load_painpoints(business_id)
            personas = load_personas(business_id)

            # Re-generate if not cached
            if not personas:
                result = generate_grounded_personas(business_id, persona_count)
                personas = result['personas']
                painpoints = result['painpoints']

            return personas[:persona_count], painpoints, "grounded"

        elif review_count > 0:
            # Hybrid mode
            print(f"[Persona Factory] Hybrid mode ({review_count} reviews + synthetic fill)")
            result = generate_grounded_personas(business_id, max(1, persona_count - 1))
            grounded = result['personas']
            painpoints = result['painpoints']

            # Fill remaining slots with synthetic
            synthetic_needed = max(1, persona_count - len(grounded))
            synthetic = generate_synthetic_personas(business_description, location, synthetic_needed)

            return grounded + synthetic, painpoints, "hybrid"

    # Pure synthetic fallback
    print(f"[Persona Factory] Synthetic mode (no reviews)")
    synthetic = generate_synthetic_personas(business_description, location, persona_count)
    return synthetic, {"complaints": [], "praise": [], "trends": []}, "synthetic"


if __name__ == "__main__":
    personas = generate_synthetic_personas(
        business_description="A small, brightly lit cafe with 5 tables, serving Nigerian fusion food",
        location="Lagos, Nigeria",
        count=3
    )
    print(json.dumps(personas, indent=2))
