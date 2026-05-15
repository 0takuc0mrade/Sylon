import json
import pandas as pd
import numpy as np
from collections import defaultdict
from tqdm import tqdm


def score_user(reviews):
    # Scores a user by how interesting they are to excavate. Three things matter: tone shift, what they care about, and the gap.
    if len(reviews) < 2:
        return 0

    reviews = sorted(reviews, key=lambda x: x['date'])
    ratings = [r['stars'] for r in reviews]
    texts = [r['text'].lower() for r in reviews]

    # 1. how much does their rating behaviour shift over time?
    mid = len(ratings) // 2
    early_avg = np.mean(ratings[:mid])
    late_avg = np.mean(ratings[mid:])
    rating_drift = abs(late_avg - early_avg)

    # 2. how consistent are their obsessions?
    word_counts = defaultdict(int)
    for text in texts:
        for word in text.split():
            if len(word) > 4:  # skip small words
                word_counts[word] += 1

    top_words = sorted(word_counts.values(), reverse=True)[:10]
    obsession_score = np.mean(top_words) if top_words else 0

    # 3. the gap between what they say and what they rate
    # long positive text + low rating = gap
    # long negative text + high rating = gap
    gaps = []
    for r in reviews:
        text_length = len(r['text'].split())
        rating = r['stars']
        # normalize rating to 0-1
        normalized_rating = (rating - 1) / 4
        # normalize text length
        normalized_length = min(text_length / 200, 1)
        # gap is when long text doesn't match extreme ratings
        gap = normalized_length * abs(normalized_rating - 0.5)
        gaps.append(gap)

    gap_score = np.mean(gaps)

    # time span in years; longer history = more to excavate
    dates = [r['date'] for r in reviews]
    time_span = (max(dates) - min(dates)).days / 365
    avg_useful = np.mean([r.get("useful", 0) for r in reviews])

    # final score weights
    score = (
        rating_drift * 2 +
        obsession_score * 0.01 +
        gap_score * 3 +
        time_span * 1.5 +
        avg_useful * 2
    )

    return score

def load_and_score_users(review_path, min_reviews=3, top_n=1000):
    # reads the review file, scores every user.
    user_reviews = defaultdict(list)

    print("Reading reviews...")
    with open(review_path, 'r', encoding='utf-8') as f:
        for line in tqdm(f):
            r = json.loads(line)
            user_reviews[r['user_id']].append({
                'review_id': r['review_id'],
                'user_id': r['user_id'],
                'business_id': r['business_id'],
                'stars': r['stars'],
                'text': r['text'],
                'date': pd.to_datetime(r['date']),
                'useful': r['useful']
            })

    print(f"\n{len(user_reviews)} total users found")

    # filter by minimum reviews
    qualified = {
        uid: reviews
        for uid, reviews in user_reviews.items()
        if len(reviews) >= min_reviews
    }

    print(f"{len(qualified)} users with {min_reviews}+ reviews")
    print("Scoring users...")

    # score every qualified user
    scored = []
    for uid, reviews in tqdm(qualified.items()):
        s = score_user(reviews)
        scored.append((uid, s, reviews))

    # sort by score, take the top N
    scored.sort(key=lambda x: x[1], reverse=True)
    top_users = scored[:top_n]

    print(f"\nTop {top_n} users selected")
    print(f"Score range: {top_users[-1][1]:.2f} → {top_users[0][1]:.2f}")

    # flatten to dataframe
    all_reviews = []
    for uid, score, reviews in top_users:
        for r in reviews:
            r['richness_score'] = score
            all_reviews.append(r)

    rev = pd.DataFrame(all_reviews)
    rev = rev.sort_values(['user_id', 'date'])

    return rev


if __name__ == "__main__":
    sampled = load_and_score_users(
        review_path='data/yelp_academic_dataset_review.json',
        min_reviews=3,
        top_n=1000
    )

    print(f"\n{sampled.shape[0]} reviews across {sampled['user_id'].nunique()} users")
    print(f"timeline: {sampled['date'].min()} to {sampled['date'].max()}")

    sampled.to_csv('data/sampled_reviews.csv', index=False)
    print("saved.")