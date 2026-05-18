import os
import pandas as pd
import numpy as np

def create_evaluation_sets():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    reviews_path = os.path.join(base_dir, 'sampled_reviews.csv')
    
    print(f"Loading reviews from {reviews_path}...")
    all_reviews_dataset = pd.read_csv(reviews_path)
    all_reviews_dataset['date'] = pd.to_datetime(all_reviews_dataset['date'])
    
    # Filter to users with at least 10 reviews to ensure enough history for persona + testing
    user_counts = all_reviews_dataset['user_id'].value_counts()
    valid_users = user_counts[user_counts >= 10].index
    
    print(f"Found {len(valid_users)} users with 10+ reviews.")
    eligible_users_dataset = all_reviews_dataset[all_reviews_dataset['user_id'].isin(valid_users)].copy()
    
    training_chunks = []
    testing_chunks = []
    
    print("Splitting chronologically (80% train, 20% test) per user...")
    for user_id, user_history in eligible_users_dataset.groupby('user_id'):
        user_history = user_history.sort_values('date').reset_index(drop=True)
        n = len(user_history)
        split_idx = int(n * 0.8)
        
        # Ensure at least 1 test review if 80% rounds up too much
        if split_idx == n:
            split_idx = n - 1
            
        training_chunks.append(user_history.iloc[:split_idx])
        testing_chunks.append(user_history.iloc[split_idx:])
        
    training_data = pd.concat(training_chunks, ignore_index=True)
    testing_data = pd.concat(testing_chunks, ignore_index=True)
    
    train_out = os.path.join(base_dir, 'train_reviews.csv')
    test_out = os.path.join(base_dir, 'test_ground_truth.csv')
    
    training_data.to_csv(train_out, index=False)
    testing_data.to_csv(test_out, index=False)
    
    print(f"Total Train Reviews: {len(training_data)}")
    print(f"Total Test (Ground Truth) Reviews: {len(testing_data)}")
    print(f"Saved to:\n - {train_out}\n - {test_out}")

if __name__ == '__main__':
    create_evaluation_sets()
