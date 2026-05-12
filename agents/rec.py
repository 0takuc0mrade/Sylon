import pandas as pd
import numpy as np
from collections import defaultdict


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
    phase_variance = np.var([early, mid, recent])
    
    # observer — few reviews, long history, high influence
    if total_reviews <= 8 and time_span >= 3 and avg_useful >= 2:
        return 'observer'
    
    # critical and harsh — low ratings, high useful votes
    if avg_rating <= 2.8 and avg_useful >= 1.5:
        return 'critical'
    
    # off and on — uneven across phases
    if phase_variance > 0.5:
        return 'inconsistent'
    
    # fully committed — consistent, long term
    return 'fully_committed'

def build_segment_report(reviews_df):
   # groups all shortlisted users into behavioral segments and returns a summary of who they are and what they signal for a business.
    users = reviews_df['user_id'].unique()
    
    segments = defaultdict(list)
    
    for uid in users:
        user_df = reviews_df[reviews_df['user_id'] == uid].copy()
        user_df['date'] = pd.to_datetime(user_df['date'])
        segment = classify_user(user_df)
        
        segments[segment].append({
            'user_id': uid,
            'total_reviews': len(user_df),
            'avg_rating': round(user_df['stars'].mean(), 2),
            'avg_useful': round(user_df['useful'].mean(), 2),
            'time_span_years': round(
                (user_df['date'].max() - user_df['date'].min()).days / 365, 1
            ),
            'richness_score': round(user_df['richness_score'].iloc[0], 2)
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


def describe_segments(report):
    descriptions = {
        'fully_committed': "Your most loyal reviewers. Consistent, long term, and engaged across all phases. These are the customers worth investing in.",
        'Inconsistent': "Inconsistent engagers. They show up in bursts then disappear. Usually triggered by strong experiences; good or bad.",
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


if __name__ == "__main__":
    df = pd.read_csv('data/sampled_reviews.csv')
    df['date'] = pd.to_datetime(df['date'])
    
    print("Building segment report...")
    report = build_segment_report(df)
    
    print(describe_segments(report))