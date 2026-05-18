import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if ROOT not in sys.path:
    sys.path.insert(0, ROOT)

import pandas as pd
import numpy as np
import json
from collections import defaultdict
from dotenv import load_dotenv
from agents.llm_client import call_cerebras

load_dotenv(os.path.join(ROOT, '.env'))
categories_path = os.path.join(ROOT, 'data', 'business_categories.csv')
_user_names = None

def get_user_name(user_id):
    global _user_names
    if _user_names is None:
            _user_names = pd.read_csv(os.path.join(ROOT, 'data', 'user_names.csv'), index_col='user_id')['name'].to_dict()
    return  _user_names.get(user_id, f"User {user_id[:6]}")

def classify_user(rev):
    rev = rev.sort_values('date').reset_index(drop=True)
    
    total_reviews = len(rev)
    avg_rating = rev['stars'].mean()
    avg_useful = rev['useful'].mean()
    first_review = rev['date'].min()
    last_review = rev['date'].max()
    time_span = (last_review - first_review).days / 365
    
    # phase consistency
    third = total_reviews // 3
    early = len(rev.iloc[:third])
    mid = len(rev.iloc[third:2*third])
    recent = len(rev.iloc[2*third:])
    phase_mean = np.mean([early, mid, recent])
    phase_variance = np.std([early, mid, recent]) / phase_mean if phase_mean > 0 else 0
    
    # observer — few reviews, long history, high influence
    if total_reviews <= 8 and time_span >= 3 and avg_useful >= 2:
        return 'observer'
    
    # critical and harsh — low ratings, high useful votes
    if avg_rating <= 2.8 and avg_useful >= 1.5:
        return 'critical'
    
    # off and on — uneven across phases
    if phase_variance > 0.4:
        return 'inconsistent'
    
    # fully committed — consistent, long term
    return 'fully_committed'

def build_segment_report(reviews_sc):
   # groups all shortlisted users into behavioral segments and returns a summary of who they are and what they signal for a business.
    users = reviews_sc['user_id'].unique()
    
    segments = defaultdict(list)
    
    for uid in users:
        user_sc = reviews_sc[reviews_sc['user_id'] == uid].copy()
        user_sc['date'] = pd.to_datetime(user_sc['date'])
        segment = classify_user(user_sc)
        
        segments[segment].append({
            'user_id': uid,
            'total_reviews': len(user_sc),
            'avg_rating': round(user_sc['stars'].mean(), 2),
            'avg_useful': round(user_sc['useful'].mean(), 2),
            'time_span_years': round(
                (user_sc['date'].max() - user_sc['date'].min()).days / 365, 1
            ),
            'richness_score': round(user_sc['richness_score'].iloc[0], 2)
        })
    
    # build summary
    report = {}
    for segment, users in segments.items():
        avg_rating = np.mean([u['avg_rating'] for u in users])
        avg_useful = np.mean([u['avg_useful'] for u in users])
        avg_span = np.mean([u['time_span_years'] for u in users])
        
        report[segment] = {
            'count': len(users),
            'avg_rating': round(avg_rating, 2),
            'avg_useful_votes': round(avg_useful, 2),
            'avg_years_active': round(avg_span, 1),
            'users': users
        }
    
    return report

def detect_drift_alerts(all_reviews, personas):
    alerts = []
    for user_id, persona in personas.items():
        if 'structured' not in persona:
            continue
            
        phases = persona['structured']['phases']
        early = phases['early']['signal']
        recent = phases['recent']['signal']

        if not early or not recent:
            continue
        
        early_avg = early['avg_rating']
        recent_avg = recent['avg_rating']
        rating_drop = early_avg - recent_avg
        
        # find preferences that persisted into recent phase
        early_words = set(early['top_words'])
        recent_words = set(recent['top_words'])
        persistent_obsessions = early_words & recent_words
        
        # flag if rating dropped significantly
        if rating_drop >= 0.5:
            alerts.append({
                'customer_name': get_user_name(user_id),
                'early_avg': early_avg,
                'recent_avg': recent_avg,
                'rating_drop': round(rating_drop, 2),
                'persistent_obsessions': list(persistent_obsessions)[:5],
                'risk_level': 'high' if rating_drop >= 1.0 else 'medium',
                'signal': f"Rating dropped {round(rating_drop, 2)} stars. Still mentioning: {', '.join(list(persistent_obsessions)[:3])} unmet needs likely."
            })
    
    alerts.sort(key=lambda x: x['rating_drop'], reverse=True)
    return alerts

def find_revenue_opportunities(reviews, personas):
    opportunities = []

    experience_words = {
        'atmosphere', 'ambiance', 'experience', 'kitchen',
        'service', 'quality', 'perfect', 'excellent', 'refined',
        'special', 'memorable', 'exceptional', 'outstanding'
    }
    
    for user_id, persona in personas.items():
        if 'structured' not in persona:
            continue
        
        recent = persona['structured']['phases']['recent']['signal']
        early = persona['structured']['phases']['early']['signal']

        if not recent or not early:
            continue
        
        # first signal; vocabulary drift toward experience words
        recent_words = set(recent['top_words'])
        early_words = set(early['top_words'])
        experience_overlap = recent_words & experience_words
        early_experience = early_words & experience_words
        experience_growth = len(experience_overlap) - len(early_experience)
        
        # second signal review depth (longer means more emotionally invested)
        user_reviews = reviews[reviews['user_id'] == user_id]
        avg_review_length = user_reviews['text'].apply(lambda x: len(x.split())).mean()
        depth_score = 1 if avg_review_length > 150 else 0
        
    # third signal high useful votes (community validates their judgment)
        avg_useful = user_reviews['useful'].mean()
        influence_score = 1 if avg_useful >= 2 else 0
        
    # fourth signal rating generosity: high but not serial 5 star rater
        rating_quality = 1 if 3.5 <= recent['avg_rating'] <= 4.5 else 0
        
    # fifth signal reviewed same category repeatedly
        category_counts = user_reviews['primary_category'].value_counts()
        loyal_categories = category_counts[category_counts >= 5].index.tolist()
        loyalty_score = len(loyal_categories)
        
        # combined premium score
        premium_score = (
            experience_growth * 2 +
            depth_score * 2 +
            influence_score * 2 +
            rating_quality * 1 +
            loyalty_score * 1
            )
        
        if premium_score >= 4:
            opportunities.append({
                'customer_name': get_user_name(user_id),
                'premium_score': premium_score,
                'recent_avg_rating': recent['avg_rating'],
                'avg_review_length': round(avg_review_length),
                'avg_useful_votes': round(avg_useful, 2),
                'loyal_categories': loyal_categories,
                'experience_signals': list(experience_overlap),
                'opportunity': 'High value experience seeker with strong community influence.',
                'recommended_action': 'Introduce premium offerings, exclusive experiences, or loyalty recognition to convert engagement into higher spend.'
                })
    
    opportunities.sort(key=lambda x: x['premium_score'], reverse=True)
    return opportunities

def clairvoyance(user_id, all_reviews):
    # reads the user's most recent reviews and infers their current emotional state
    
    user_history = all_reviews[all_reviews['user_id'] == user_id].copy()
    user_history['date'] = pd.to_datetime(user_history['date'])
    user_history = user_history.sort_values('date', ascending=False)
    
    # take only the 5 most recent reviews
    recent = user_history.head(7)
    
    if len(recent) == 0:
        return None
    
    recent_texts = "\n\n---\n\n".join([
        f"Stars: {row['stars']}\n{row['text'][:500]}"
        for _, row in recent.iterrows()
    ])
    
    # get their historical average for comparison
    historical_avg = user_history['stars'].mean()
    recent_avg = recent['stars'].mean()
    trajectory = round(recent_avg - historical_avg, 2)

    prompt = f"""
You are analyzing a customer's most recent reviews to detect their current emotional state.
This is not sentiment analysis. You are detecting specific emotions and what triggered them.

HISTORICAL AVERAGE RATING: {round(historical_avg, 2)}
RECENT AVERAGE RATING: {round(recent_avg, 2)}
TRAJECTORY: {'improving' if trajectory > 0 else 'declining' if trajectory < 0 else 'stable'} ({trajectory:+.2f})

THEIR 5 MOST RECENT REVIEWS:
{recent_texts}

Analyze and respond in exactly this format:

CURRENT EMOTION: [one word — joy/satisfaction/frustration/disappointment/anger/resignation/neutral]
INTENSITY: [low/medium/high]
PRIMARY TRIGGER: [what specifically is causing this emotion — be precise, one sentence]
TRAJECTORY NOTE: [is this emotion new or has it been building — one sentence]
BUSINESS ALERT: [one specific action the business should take before this customer's next visit]
"""

    output = call_cerebras(prompt)
    
    return {
        'user_id': user_id,
        'customer_name': get_user_name(user_id),
        'historical_avg': round(historical_avg, 2),
        'recent_avg': round(recent_avg, 2),
        'trajectory': trajectory,
        'analysis': output
    }

def describe_segments(report):
    descriptions = {
        'fully_committed': "Your most loyal reviewers. Consistent, long term, and engaged across all phases. These are the customers worth investing in.",
        'inconsistent': "Inconsistent engagers. They show up in bursts then disappear. Usually triggered by strong experiences; good or bad.",
        'critical': "Your harshest judges. Low ratings, high useful votes: meaning people trust their criticism. One bad experience from them is costly.",
        'observer': "Quiet but influential. Rarely review, but when they do, people listen. Their silence is not loyalty, it's patience running out."
    }
    
    output = []
    for segment, data in report.items():
        desc = descriptions.get(segment, '')
        output.append(
            f"\n{segment.upper().replace('_', ' ')} ({data['count']} users)\n"
            f"{desc}\n"
            f"Avg rating: {data['avg_rating']} | "
            f"Avg useful votes: {data['avg_useful_votes']} | "
            f"Avg years active: {data['avg_years_active']}"
        )
    
    return "\n".join(output)


def recommend_businesses(user_id, all_reviews, business_ca, top_n=5, user_segment=None):
    # Two-stage recommendation: embeddings for retrieval, then behavioral scoring.
    from agents.embeddings import find_similar_businesses, load_embeddings
    
    persona_path = os.path.join(ROOT, 'outputs', f'{user_id}_persona.json')
    
    if not os.path.exists(persona_path):
        # if no history, return top rated in category
        return handle_cold_start(business_ca, top_n)

    with open(persona_path) as f:
        persona = json.load(f)

    # filter for businesses the user hasn't reviewed yet.
    user_visited = list(all_reviews[all_reviews['user_id'] == user_id]['business_id'].unique())
    narrative = persona.get('narrative', '').lower()

    # --- Stage 1: Embedding Retrieval (fast, free) ---
    embedding_candidates = find_similar_businesses(user_id, top_k=50, exclude_ids=user_visited)
    
    if embedding_candidates:
        # Filter to businesses in our catalog
        emb_bids = {bid for bid, _ in embedding_candidates}
        candidates = business_ca[business_ca['business_id'].isin(emb_bids)].copy()
        # Add embedding similarity score
        emb_score_map = {bid: score for bid, score in embedding_candidates}
        candidates['embedding_score'] = candidates['business_id'].map(emb_score_map).fillna(0)
    else:
        # Fallback: use all unvisited businesses
        candidates = business_ca[~business_ca['business_id'].isin(user_visited)].copy()
        candidates['embedding_score'] = 0

    # --- Stage 2: Behavioral Scoring ---
    def calculate_compatibility(bus_row):
        # Start with embedding score (scaled to 0-50 range)
        score = float(bus_row.get('embedding_score', 0)) * 50
        score += bus_row.get('stars', 3.0) * 10 
        
        categories = str(bus_row.get('categories', '')).lower()

        if 'price' in narrative or 'experience' in narrative or 'atmosphere' in narrative:
            if 'cheap' in categories or 'upscale' in categories or 'fine dining' in categories:
                score += 15
        if 'premium' in narrative or 'experience' in narrative or 'atmosphere' in narrative:
            if 'luxury' in str(bus_row['categories']).lower() and persona.get('is_premium_seeker'):
                score += 15

        vibe_keywords = ['quiet', 'romantic', 'fast', 'authentic', 'cozy', 'upscale', 'loud', 'casual']
        for attribute in vibe_keywords:
            if attribute in narrative and attribute in categories:
                score += 20

        if user_segment == 'fully_committed' and bus_row.get('review_count', 0) > 500:
            score += 15

        if user_segment == 'critical':
            if bus_row.get('stars', 5.0) < 4.0:
                score -= 30

        return score

    candidates['match_score'] = candidates.apply(calculate_compatibility, axis=1)
    
    recommendations = candidates.sort_values('match_score', ascending=False).head(top_n)

    cols_to_return = ['name', 'match_score', 'stars']
    if 'primary_category' in recommendations.columns:
        cols_to_return.append('primary_category')

    return recommendations[['name', 'match_score', 'stars', 'city']].to_dict('records')

def translate_cross_domain_persona(source_domain, source_narrative, target_domain="Yelp Restaurants"):
    prompt = f"""
    You are a behavioral psychologist specializing in cross-domain translation.
    A user has the following persona in the domain of {source_domain}:
    "{source_narrative}"

    Extract their core psychological drivers (e.g., patience, need for control, aesthetic preference, introversion/extroversion).
    Then, project those EXACT psychological drivers onto the domain of {target_domain}.
    
    Write a 150-word narrative describing what this specific person will value, seek out, and hate in a {target_domain}.
    Do NOT mention {source_domain} in your output. Just describe their target domain persona.
    """
    return call_cerebras(prompt, temperature=0.6)

def llm_behavioral_ranker(persona_narrative, candidates, top_n=5):
    from agents.llm_client import call_cerebras_json
    
    business_descriptions = ""
    for i, b in enumerate(candidates):
        bid = b.get('business_id', str(i))
        # Ensure business_id exists as a string for the JSON map
        b['business_id'] = bid
        business_descriptions += f"\n[{i}] ID: {bid} | Name: {b['name']} | Categories: {b.get('categories', b.get('primary_category', ''))} | Rating: {b.get('stars', 0)} ({b.get('review_count', 0)} reviews)"

    prompt = f"""
You are a highly analytical behavioral matching engine. 
Rank the following businesses based on how perfectly they fit this customer persona.

PERSONA NARRATIVE: {persona_narrative}

CANDIDATE BUSINESSES:{business_descriptions}

For each business ID, assign a match_score from 0 to 100 based on how well the business categories and attribute align with the persona's preferences and dealbreakers.
Return ONLY a JSON object mapping the exact business_id to its score and a 1-sentence reason.
"""
    try:
        llm_scores = call_cerebras_json(prompt, temperature=0.3, max_tokens=2000)
        
        ranked_list = []
        for c in candidates:
            bid = str(c.get('business_id', ''))
            score_data = llm_scores.get(bid, {"score": 0})
            score = float(score_data) if isinstance(score_data, (int, float)) else float(score_data.get('score', 0))
            reason = score_data.get('reason', '') if isinstance(score_data, dict) else ''
            
            c_copy = c.copy()
            c_copy['match_score'] = score
            c_copy['match_reason'] = reason
            ranked_list.append(c_copy)
            
        ranked_list.sort(key=lambda x: x['match_score'], reverse=True)
        return ranked_list[:top_n]
    except Exception as e:
        print(f"Error in LLM ranking: {e}")
        return candidates[:top_n]


def handle_cold_start(business_ca, top_n=5, preferred_category=None, source_domain=None, source_narrative=None):
    from agents.embeddings import find_businesses_for_text
    
    candidates = business_ca.copy()

    if preferred_category and 'primary_category' in candidates.columns:
        candidates = candidates[candidates['primary_category'].str.lower() == preferred_category.lower()]
    
    # Stage 1: Embedding retrieval for cold start (if we have a source narrative)
    if source_domain and source_narrative:
        print(f"\nPreparing cold‑start candidate set from {source_domain}...")
        target_narrative = translate_cross_domain_persona(source_domain, source_narrative)
        print(f"[Cold Start] Translated Target Persona:\n{target_narrative}\n")
        
        # Use embeddings to find semantically similar businesses (fast, free)
        print(f"[Cold Start] Stage 1: Embedding retrieval from {len(candidates)} businesses...")
        embedding_results = find_businesses_for_text(target_narrative, top_k=20)
        
        if embedding_results:
            emb_bids = [bid for bid, _ in embedding_results]
            candidate_subset = candidates[candidates['business_id'].isin(emb_bids)]
            if len(candidate_subset) > 0:
                candidate_dicts = candidate_subset.to_dict('records')
            else:
                candidate_dicts = candidates.sort_values(['review_count'], ascending=[False]).head(20).to_dict('records')
        else:
            candidate_dicts = candidates.sort_values(['review_count'], ascending=[False]).head(20).to_dict('records')
        
        # Stage 2: LLM behavioral reranking on the embedding-filtered candidates
        print(f"[Cold Start] Stage 2: LLM reranking {len(candidate_dicts)} candidates...")
        return llm_behavioral_ranker(target_narrative, candidate_dicts, top_n)

    # Fallback: popularity-based (no source narrative provided)
    candidates = candidates.sort_values(['review_count'], ascending=[False]).head(20)
    cols = ['name', 'stars', 'review_count']
    if 'primary_category' in candidates.columns:
        cols.append('primary_category')

    return candidates.head(top_n)[cols].to_dict('records')


if __name__ == "__main__":

    all_reviews = pd.read_csv(os.path.join(ROOT, 'data', 'sampled_reviews.csv'))
    business_pool = pd.read_csv(os.path.join(ROOT, 'data', 'business_categories.csv'))
    categories = pd.read_csv(os.path.join(ROOT, 'data', 'business_categories.csv'))[['business_id', 'primary_category', 'categories', 'review_count']]
    all_reviews = all_reviews.merge(categories, on='business_id', how='left')
    all_reviews['date'] = pd.to_datetime(all_reviews['date'])

    print("Building segment report...")
    report = build_segment_report(all_reviews)
    print(describe_segments(report))

    personas = {}
    persona_path = 'outputs/-G7Zkl1wIWBBmD0KRy_sCw_persona.json'
    with open(persona_path) as f:
        raw = json.load(f)
    personas['-G7Zkl1wIWBBmD0KRy_sCw'] = raw

    print("\n DRIFT ALERTS ")
    alerts = detect_drift_alerts(all_reviews, personas)
    for alert in alerts:
        print(f"\nUser: {alert['customer_name']}")
        print(f"Signal: {alert['signal']}")
        print(f"Risk: {alert['risk_level']}")

    print("\n REVENUE OPPORTUNITIES ")
    opportunities = find_revenue_opportunities(all_reviews, personas)
    for opp in opportunities:
        print(f"\nUser: {opp['customer_name']}")
        print(f"Premium score: {opp['premium_score']}")
        print(f"Action: {opp['recommended_action']}")

    print("\n CLAIRVOYANCE ")
    result = clairvoyance('-G7Zkl1wIWBBmD0KRy_sCw', all_reviews)
    
    if result:
        print(f"\nCustomer: {result['customer_name']}")
        print(f"Trajectory: {result['trajectory']:+.2f}")
        print(result['analysis'])

    print("\n SYLON'S RECOMMENDATIONS ")

    business_pool = pd.read_csv(os.path.join(ROOT, 'data', 'business_categories.csv'))
    if 'stars' not in business_pool.columns:
        business_pool['stars'] = 4.0
    if 'review_count' not in business_pool.columns:
        business_pool['review_count'] = 100
    if 'name' not in business_pool.columns:
        business_pool['name'] = "Business " + business_pool['business_id']
    if 'categories' not in business_pool.columns:
        business_pool['categories'] = business_pool['primary_category'] + ", upscale, luxury, quiet, authentic, cozy"
    if 'city' not in business_pool.columns:
        business_pool['city'] = "Unknown"

    # figure out the segment of our test user
    test_user = '-G7Zkl1wIWBBmD0KRy_sCw'
    test_user_segment = None
    for seg, data in report.items():
        if any(u['user_id'] == test_user for u in data['users']):
            test_user_segment = seg
            break

    # Get tailored recommendations
    recs = recommend_businesses(
        user_id=test_user, 
        all_reviews=all_reviews,
        business_ca=business_pool,
        top_n=3, 
        user_segment=test_user_segment
        )
    print(f"\nTop matches for returning user ({test_user_segment}):")
    for r in recs:
        print(f" {r['name']} || Match Score: {r['match_score']}")


    print(f"\nTop matches for brand new user (Cross-Domain Cold Start):")
    goodreads_persona = "I love dense, 1000-page historical biographies. I hate shallow beach reads and anything that feels rushed. I need time to sit and reflect on the intricate worldbuilding."
    cold_recs = handle_cold_start(
        business_ca=business_pool, 
        top_n=3, 
        source_domain="Goodreads Book Reviews", 
        source_narrative=goodreads_persona
    )
    for r in cold_recs:
        print(f" {r['name']} || ({r.get('stars', 'N/A')}) || {r.get('review_count', 'N/A')} reviews")
        if 'match_reason' in r:
            print(f"    -> {r['match_reason']}")