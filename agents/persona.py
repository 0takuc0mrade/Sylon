import os
import json
import pandas as pd
import numpy as np
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if ROOT not in sys.path:
    sys.path.insert(0, ROOT)
    
from cerebras.cloud.sdk import Cerebras
from dotenv import load_dotenv
from collections import defaultdict
from agents.llm_client import call_cerebras

load_dotenv()

def split_into_phases(user_history):
    # Split a user's review history into three life phases: early, middle, recent.

    user_history = user_history.sort_values('date').reset_index(drop=True)
    n = len(user_history)

    early = user_history.iloc[:n//3]
    middle = user_history.iloc[n//3: 2*n//3]
    recent = user_history.iloc[2*n//3:]

    return early, middle, recent


def extract_phase_signal(phase_reviews):
    # finds only the important signals that's necessary for any given phase: the average rating, rating variance, most used words, sample texts.
    if phase_reviews.empty:
        return None

    ratings = phase_reviews['stars'].tolist()
    texts = phase_reviews['text'].tolist()

    # word frequency, skip short words
    word_counts = defaultdict(int)
    for text in texts:
        for word in text.lower().split():
            if len(word) > 4:
                word_counts[word] += 1

    top_words = sorted(word_counts, key=word_counts.get, reverse=True)[:15]

    # find the reviews with the biggest gap between text length and rating
    phase_reviews = phase_reviews.copy()
    phase_reviews['text_length'] = phase_reviews['text'].apply(lambda x: len(x.split()))
    phase_reviews['normalized_rating'] = (phase_reviews['stars'] - 1) / 4
    phase_reviews['gap'] = phase_reviews['text_length'] * abs(phase_reviews['normalized_rating'] - 0.5)
    gap_reviews = phase_reviews.nlargest(2, 'gap')[['stars', 'text']].to_dict('records')

    # sample texts for LLM context, to pick the longest ones
    sample_texts = phase_reviews.nlargest(3, 'text_length')['text'].tolist()

    return {
        'review_count': len(phase_reviews),
        'avg_rating': round(np.mean(ratings), 2),
        'rating_variance': round(np.var(ratings), 2),
        'top_words': top_words,
        'gap_reviews': gap_reviews,
        'sample_texts': sample_texts
    }


def detect_drift(early_signal, middle_signal, recent_signal):
    # Compare signals across phases to find what changed over time.
    drifts = []

    if early_signal and recent_signal:
        rating_change = recent_signal['avg_rating'] - early_signal['avg_rating']
        if abs(rating_change) > 0.5:
            direction = "more generous" if rating_change > 0 else "harsher"
            drifts.append(f"Rating drift: became {direction} over time ({early_signal['avg_rating']} to {recent_signal['avg_rating']})")

        # word overlap between early and recent
        early_words = set(early_signal['top_words'])
        recent_words = set(recent_signal['top_words'])
        lost_words = early_words - recent_words
        gained_words = recent_words - early_words

        if lost_words:
            drifts.append(f"Stopped emphasizing: {', '.join(list(lost_words)[:5])}")
        if gained_words:
            drifts.append(f"Started emphasizing: {', '.join(list(gained_words)[:5])}")

    return drifts


def build_structured_persona(user_id, early, middle, recent, drifts):
    return {
        'user_id': user_id,
        'phases': {
            'early': {
                'period': f"{early['date'].min()} → {early['date'].max()}" if not early.empty else None,
                'signal': extract_phase_signal(early)
            },
            'middle': {
                'period': f"{middle['date'].min()} → {middle['date'].max()}" if not middle.empty else None,
                'signal': extract_phase_signal(middle)
            },
            'recent': {
                'period': f"{recent['date'].min()} → {recent['date'].max()}" if not recent.empty else None,
                'signal': extract_phase_signal(recent)
            }
        },
        'drifts': drifts
    }


def build_narrative_persona(structured_persona, user_id):
    # Feed the structured persona into the llm and asks it to write a character description; the human readable section.
    early_signal = structured_persona['phases']['early']['signal']
    recent_signal = structured_persona['phases']['recent']['signal']
    
    if not early_signal or not recent_signal:
        return "Not enough review history to build a narrative portrait."
    prompt = f"""
You are reading the behavioral data of a real person extracted from their Yelp review history.
Your job is to write a precise, on point and specific character portrait of this reviewer.

Do not be generic. Do not say things like "this user enjoys dining out."
Write like you actually know this person personally; their quirks, their priorities, their blind spots.

Here is their behavioral data:

EARLY PHASE ({structured_persona['phases']['early']['period']}):
- Average rating: {early_signal['avg_rating']}
- Rating variance: {early_signal['rating_variance']}
- Most used words: {', '.join(early_signal['top_words'])}
- Sample reviews: {json.dumps(early_signal['sample_texts'][:2])}

RECENT PHASE ({structured_persona['phases']['early']['period']}):
- Average rating: {early_signal['avg_rating']}
- Rating variance: {early_signal['rating_variance']}
- Most used words: {', '.join(early_signal['top_words'])}
- Sample reviews: {json.dumps(early_signal['sample_texts'][:2])}

OBSERVED DRIFTS:
{chr(10).join(structured_persona['drifts']) if structured_persona['drifts'] else 'No significant drift detected'}

Write a 150-200 word character portrait. Be specific. Be precise. No fluff.
End with one sentence that captures what this person would never forgive in a bad experience.
"""

    response = call_cerebras(prompt)
    return response


def excavate_user(user_id,user_history,category_filter= None):
   # Takes a user ID and their reviews and returns both their structured and narrative analysis.
    user_reviews =user_history[user_history['user_id'] == user_id].copy()
    user_reviews['date'] = pd.to_datetime(user_reviews['date'])
    if category_filter:
        user_reviews = user_reviews[user_reviews['primary_category'] == category_filter]

    if len(user_reviews) < 20:
        print(f"Skipping{user_id} - not enough review history")
        return None

    early, middle, recent = split_into_phases(user_reviews)

    early_signal = extract_phase_signal(early)
    middle_signal = extract_phase_signal(middle)
    recent_signal = extract_phase_signal(recent)

    drifts = detect_drift(early_signal, middle_signal, recent_signal)

    structured = build_structured_persona(user_id, early, middle, recent, drifts)
    narrative = build_narrative_persona(structured, user_id)

    return {
        'structured': structured,
        'narrative': narrative
    }

def excavate_contextual_personas(user_id, all_reviews):
    # splits user reviews by business category
    # builds a separate persona for each context
    # returns dict of category -> persona
    
    user_history = all_reviews[all_reviews['user_id'] == user_id].copy()
    user_history['date'] = pd.to_datetime(user_history['date'])
    
    if len(user_history) < 5:
        print(f"Skipping {user_id} — insufficient history")
        return None
    
    # find categories this user has reviewed
    categories = user_history['primary_category'].value_counts()
    
    # only build personas for categories with enough reviews
    active_categories = categories[categories >= 5].index.tolist()
    
    if not active_categories:
        return None
    
    contextual_personas = {}
    
    for category in active_categories:
        category_reviews = user_history[
            user_history['primary_category'] == category
        ].copy()
        
        print(f"  Building {category} persona ({len(category_reviews)} reviews)...")
        
        persona = excavate_user(user_id, all_reviews, 
                               category_filter=category)
        
        if persona:
            contextual_personas[category] = persona
    
    return contextual_personas

if __name__ == "__main__":
    all_reviews = pd.read_csv('data/sampled_reviews.csv')
    all_reviews['date'] = pd.to_datetime(all_reviews['date'])

    qualified = all_reviews['user_id'].value_counts()
    top_user = qualified[qualified >= 20].index[0]

    persona = excavate_user(top_user, all_reviews)

    if persona:
        os.makedirs('outputs', exist_ok=True)
        with open(f'outputs/{top_user}_persona.json', 'w') as f:
            json.dump(persona, f, indent=2, default=str)
        print(json.dumps(persona, indent=2, default=str))