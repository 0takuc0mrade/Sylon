import os
import json
import pandas as pd
from dotenv import load_dotenv

from agents.llm_client import call_cerebras

load_dotenv()

def load_business(business_path, business_id):
    # finds a specific business by ID from the Yelp business file and reads it line by line
    with open(business_path, 'r', encoding='utf-8') as f:
        for line in f:
            business = json.loads(line)
            if business['business_id'] == business_id:
                return business
    return None


def find_businesses_by_category(business_path, category, limit=5):
    # to find businesses matching a category keyword.
    matches = []
    with open(business_path, 'r', encoding='utf-8') as f:
        for line in f:
            business = json.loads(line)
            if (business.get('categories') and
                    category.lower() in business['categories'].lower() and
                    business.get('review_count', 0) > 20):
                matches.append(business)
            if len(matches) >= limit:
                break
    return matches


def profile_business(business):
    #Extracts the signals that matter just what a real person would react to.
    attributes = business.get('attributes') or {}

    price_range = attributes.get('RestaurantsPriceRange2', 'unknown')
    price_map = {'1': 'cheap', '2': 'mid-range', '3': 'upscale', '4': 'fine dining'}
    price_label = price_map.get(str(price_range), 'unknown price range')

    has_wifi = 'wifi' in str(attributes).lower()
    outdoor_seating = attributes.get('OutdoorSeating', 'False') == 'True'
    takes_reservations = attributes.get('RestaurantsReservations', 'False') == 'True'
    good_for_groups = attributes.get('RestaurantsGoodForGroups', 'False') == 'True'
    alcohol = attributes.get('Alcohol', '')
    noise_level = attributes.get('NoiseLevel', '')
    ambiance = attributes.get('Ambience', '')

    hours = business.get('hours') or {}
    late_night = any(
        int(time_range.split('-')[1].split(':')[0]) >= 22
        for time_range in hours.values()
        if time_range and '-' in time_range
    )

    return {
        'business_id': business['business_id'],
        'name': business['name'],
        'categories': business.get('categories', ''),
        'city': business.get('city', ''),
        'state': business.get('state', ''),
        'overall_rating': business.get('stars', 0),
        'review_count': business.get('review_count', 0),
        'is_open': business.get('is_open', 0),
        'price_range': price_label,
        'has_wifi': has_wifi,
        'outdoor_seating': outdoor_seating,
        'takes_reservations': takes_reservations,
        'good_for_groups': good_for_groups,
        'alcohol': alcohol,
        'noise_level': noise_level,
        'ambiance': ambiance,
        'open_late': late_night
    }


def collision_analysis(persona, business_profile, segment='fully_committed', painpoints=None, grounding_quotes=None):
    phases = persona.get('structured', {}).get('phases', {})
    early_rating = phases.get('early', {}).get('signal', {}).get('avg_rating', 'N/A')
    recent_rating_val = phases.get('recent', {}).get('signal', {}).get('avg_rating', persona.get('avg_rating', 'N/A'))

    grounding_context = f"""
GROUNDING CONTEXT:
- Behavioral segment: {segment.upper().replace('_', ' ')}
- Rating trajectory: {early_rating} early → {recent_rating_val} recent
- This customer's complaints are trusted by other reviewers. Weight their friction points heavily.
"""

    prompt = f"""
Maintain a professional, B2B tone. Describe customer behavior as operational data points. A harsh critic is a "no nonsense" customer. An inconsistent rater shows "preference change". Never use judgemental language.
You are a customer behavior analyst. You have a deep profile of a real customer
and the details of a business they have never visited.

Your job is to reason through how this specific customer will experience this business,  
not generically, but based on exactly WHO they are.

CUSTOMER PROFILE:
{persona['narrative']}
{grounding_context}
DRIFT OBSERVED:
{chr(10).join(persona.get('structured', {}).get('drifts', persona.get('drifts', []))) or 'No significant drift'}

REAL CUSTOMER EVIDENCE:
{chr(10).join(f'- "{q}"' for q in grounding_quotes) if grounding_quotes else 'No grounding quotes available.'}

KNOWN PAINPOINTS:
{chr(10).join(f'- {c["theme"]} (severity: {c.get("severity","?")} )' for c in painpoints.get("complaints", [])[:3]) if painpoints else 'No painpoints extracted yet.'}

RECENT BEHAVIOR:
- Average recent rating: {recent_rating_val}
- What they keep talking about: {', '.join(persona.get('structured', {}).get('phases', {}).get('recent', {}).get('signal', {}).get('top_words', persona.get('top_words', []))[:8])}

BUSINESS:
- Name: {business_profile['name']}
- Type: {business_profile['categories']}
- Location: {business_profile['city']}, {business_profile['state']}
- Overall rating on Yelp: {business_profile['overall_rating']} ({business_profile['review_count']} reviews)
- Price range: {business_profile['price_range']}
- Outdoor seating: {business_profile['outdoor_seating']}
- Open late: {business_profile['open_late']}
- Takes reservations: {business_profile['takes_reservations']}
- Alcohol served: {business_profile['alcohol']}
- Noise level: {business_profile['noise_level']}

Respond in plain bullet points only. No prose. No metaphors. No poetic language.

WILL LOVE:
- [fact about the business that matches this user]
- [fact about the business that matches this user]

WILL HATE:
- [specific thing that will disappoint them]
- [specific thing that will disappoint them]

FIX THIS:
- [one action the business should take]
- [one action the business should take]
"""

    return call_cerebras(prompt)

def extract_voice_signature(sample_reviews):
    # reads actual reviews and extracts writing patterns
    samples = "\n\n---\n\n".join(sample_reviews[:5])
    
    prompt = f"""
Read these reviews written by one person and extract their writing signature in 5 bullet points.
Focus on: how they open, sentence rhythm, how they praise, how they complain, what they notice.
Be specific. No generic observations.

REVIEWS:
{samples}

Write 5 bullet points describing exactly how this person writes.
"""
    
    return call_cerebras(prompt)

def build_character_card(persona):
    phases = persona.get('structured', {}).get('phases', {})    
    early = phases.get('early', {}).get('signal', {})
    recent = phases.get('recent', {}).get('signal', {})
    drifts = persona.get('structured', {}).get('drifts',[])
    
    return f"""CHARACTER CARD:
    - Rating trajectory:{early.get('avg_rating', 'N/A')} early to {recent.get('avg_rating', 'N/A')} recent
    - Vocabulary shift: {'; '.join(drifts) if drifts else 'stable'}
    - Current obsessions: {'; '.join(recent.get('top_words', [])[:5])}
    - Review length tendency: {'detailed' if recent.get('avg_rating', 5.0) <3.5 else 'moderate'}
    - Praise style: specific details, names exact dishes or moments
    - Complaint style: states the principle being violated, not just the surface issue
    - Reader address: direct, uses asides, self corrections, parenthetical humor"""


def generate_review(persona, business_profile, collision, sample_reviews):
    character_card = build_character_card(persona)
   # write the review and predict the rating.
    samples_text = "\n\n---\n\n".join(sample_reviews[:3])
    prompt = f"""
Your only job is to sound exactly like the person who wrote these reviews.
Read them first. Do not do anything else until you have read all three.

{character_card}

REVIEW A:
{sample_reviews[0] if len(sample_reviews) > 0 else ''}

REVIEW B:
{sample_reviews[1] if len(sample_reviews) > 1 else ''}

REVIEW C:
{sample_reviews[2] if len(sample_reviews) > 2 else ''}

Now that you have read them — notice the opening. Notice how they build a scene before getting to the food. Notice what they find funny. Notice how they complain.

Write a review of this restaurant in that exact voice:

RESTAURANT: {business_profile['name']} in {business_profile['city']}, {business_profile['state']}
CATEGORY: {business_profile['categories']}
PRICE: {business_profile['price_range']}
WHAT TO WRITE ABOUT:
{collision}

Rules:
- 200-250 words exactly
- Open exactly the way the sample reviews open - copy that pattern precisely
- Do NOT copy any phrase from the WHAT TO WRITE ABOUT section
- Do NOT use words like: culinary, haven, gem, symphony, journey, vibrant
- Sound like a real person who just got home, not a food critic

REVIEW:

PREDICTED RATING: [X]/5
[one sentence on what tipped it to that number]

EARLY WARNING TO BUSINESS OWNER:
[two sharp specific sentences]
"""

    return call_cerebras(prompt)

def run(persona, business_path, business_id=None, category=None, segment='fully_committed'):
    if business_id:
        business = load_business(business_path, business_id)
        if not business:
            print(f"Business {business_id} not found.")
            return None
        businesses = [business]
    elif category:
        businesses = find_businesses_by_category(business_path, category)
        if not businesses:
            print(f"No businesses found for category: {category}")
            return None
    else:
        print("Provide either a business_id or a category.")
        return None

    def get_phase_samples(phase_signal, n=3):
        if not phase_signal or not phase_signal.get('sample_texts'):
            return []
        return phase_signal['sample_texts'][:n]

    early_samples = get_phase_samples(
        persona['structured']['phases']['early']['signal'], n=2
    )
    middle_samples = get_phase_samples(
        persona['structured']['phases']['middle']['signal'], n=3
    )
    recent_samples = get_phase_samples(
        persona['structured']['phases']['recent']['signal'], n=3
    )

    sample_reviews = early_samples + middle_samples + recent_samples

    results = []
    for business in businesses:
        profile = profile_business(business)
        print(f"\nAnalyzing: {profile['name']}")
        
        
        collision = collision_analysis(persona, profile, segment=segment)
        prediction = generate_review(persona, profile, collision, sample_reviews)

        results.append({
            'business': profile,
            'collision_analysis': collision,
            'prediction': prediction
        })

    return results


if __name__ == "__main__":
    print("starting")
    import json
    persona_path = 'outputs/-G7Zkl1wIWBBmD0KRy_sCw_persona.json'
    with open(persona_path, 'r') as f:
        raw = json.load(f)

    persona = {
        'structured': raw['structured'],
        'narrative': raw['narrative']
    }

    results = run(
        persona=persona,
        business_path='data/yelp_academic_dataset_business.json',
        business_id = 'MUTTqe8uqyMdBl186RmNeA'
    )

    if results:
        for r in results:
            print(f"\n{'='*60}")
            print(f"BUSINESS: {r['business']['name']}")
            print(f"\nCOLLISION ANALYSIS:\n{r['collision_analysis']}")
            print(f"\nPREDICTION:\n{r['prediction']}")

        # save
        os.makedirs('outputs', exist_ok=True)
        with open('outputs/review_predictions.json', 'w') as f:
            json.dump(results, f, indent=2, default=str)
        print("\nSaved to review_predictions.json")