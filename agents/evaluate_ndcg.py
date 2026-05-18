import os
import sys
import pandas as pd
import numpy as np
import json
import math
from tqdm import tqdm

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if ROOT not in sys.path:
    sys.path.insert(0, ROOT)

from agents.persona import excavate_user
from agents.llm_client import call_cerebras_json
from agents.rec import classify_user

def dcg_at_k(r, k):
    #Discounted cumulative gain (dcg)
    r = np.asfarray(r)[:k]
    if r.size:
        return np.sum(np.subtract(np.power(2, r), 1) / np.log2(np.arange(2, r.size + 2)))
    return 0.

def ndcg_at_k(r, k):
    #Normalized discounted cumulative gain (ndcg)
    ideal_r = sorted(r, reverse=True)
    idcg = dcg_at_k(ideal_r, k)
    if not idcg:
        return 0.
    return dcg_at_k(r, k) / idcg

def hit_rate_at_k(recommended_ids, truth_ids, k):
    top_k = recommended_ids[:k]
    hits = set(top_k).intersection(set(truth_ids))
    return 1 if len(hits) > 0 else 0

def rank_candidates_with_llm(persona_narrative, persona_drifts, candidates):
    business_descriptions = ""
    for i, b in enumerate(candidates):
        business_descriptions += f"\n[{i}] ID: {b['business_id']} | Name: {b['name']} | Categories: {b.get('categories', '')} | Rating: {b.get('stars', 0)} ({b.get('review_count', 0)} reviews)"

    drifts_str = "; ".join(persona_drifts) if persona_drifts else "None"

    prompt = f"""
You are a highly analytical behavioral matching engine. 
Rank the following businesses based on how perfectly they fit this customer persona.

PERSONA NARRATIVE: {persona_narrative}
OBSERVED DRIFTS: {drifts_str}

CANDIDATE BUSINESSES:{business_descriptions}

For each business ID, assign a match_score from 0 to 100 based on how well the business categories and attribute align with the persona's preferences and dealbreakers.
Return ONLY a JSON object mapping the exact business_id to its score and a 1-sentence reason.
Example format:
{{
    "business_id_1": {{"score": 85, "reason": "Fits their need for quiet ambiance."}},
    "business_id_2": {{"score": 30, "reason": "Too loud, violates their main dealbreaker."}}
}}
"""
    try:
        response = call_cerebras_json(prompt, temperature=0.3, max_tokens=2000)
        return response
    except Exception as e:
        print(f"Error calling LLM: {e}")
        return {b['business_id']: {"score": np.random.randint(0, 100), "reason": "error fallback"} for b in candidates}


def evaluate_embedding_only(num_users=50):
    """
    Evaluates recommendation quality using ONLY embeddings (no LLM calls).
    This is the fast, zero-cost baseline.
    """
    from agents.embeddings import load_embeddings, find_similar_businesses
    
    data_dir = os.path.join(ROOT, 'data')
    train_reviews = pd.read_csv(os.path.join(data_dir, 'train_reviews.csv'))
    test_ground_truth = pd.read_csv(os.path.join(data_dir, 'test_ground_truth.csv'))
    
    if not load_embeddings():
        print("[ERROR] Embeddings not found. Run: python scripts/precompute_embeddings.py")
        return
    
    # Get users with most test reviews
    test_counts = test_ground_truth['user_id'].value_counts()
    eval_users = test_counts.head(num_users).index.tolist()
    
    print(f"\n{'='*60}")
    print(f"  EMBEDDING-ONLY EVALUATION ({num_users} users)")
    print(f"  Zero API credits | ~0.01s per user")
    print(f"{'='*60}")
    
    ndcg_scores = []
    hit_rates = []
    
    for user_id in tqdm(eval_users, desc="Evaluating"):
        # Ground truth: businesses they rated >= 4 in test set
        user_test = test_ground_truth[test_ground_truth['user_id'] == user_id]
        positives = set(user_test[user_test['stars'] >= 4]['business_id'].tolist())
        
        if not positives:
            continue
        
        # Businesses they already visited in train set (exclude from recommendations)
        visited = set(train_reviews[train_reviews['user_id'] == user_id]['business_id'].tolist())
        
        # Get top 50 recommendations from embeddings
        similar = find_similar_businesses(user_id, top_k=50, exclude_ids=list(visited))
        recommended_ids = [bid for bid, score in similar]
        
        # Calculate metrics
        r = [1 if bid in positives else 0 for bid in recommended_ids]
        
        ndcg_scores.append(ndcg_at_k(r, 10))
        hit_rates.append(hit_rate_at_k(recommended_ids, positives, 10))
    
    if ndcg_scores:
        print(f"\n{'='*60}")
        print(f"  EMBEDDING-ONLY RESULTS ({len(ndcg_scores)} valid users)")
        print(f"  Average NDCG@10:    {np.mean(ndcg_scores):.4f}")
        print(f"  Average HitRate@10: {np.mean(hit_rates):.4f}")
        print(f"{'='*60}")
    
    return np.mean(ndcg_scores) if ndcg_scores else 0.0


def evaluate_hybrid(num_users=10):
    #evaluates the HYBRID two-stage pipeline:
    from agents.embeddings import load_embeddings, find_similar_businesses
    
    data_dir = os.path.join(ROOT, 'data')
    train_reviews = pd.read_csv(os.path.join(data_dir, 'train_reviews.csv'))
    test_ground_truth = pd.read_csv(os.path.join(data_dir, 'test_ground_truth.csv'))
    business_catalog = pd.read_csv(os.path.join(data_dir, 'business_categories.csv'))
    
    if not load_embeddings():
        print("[ERROR] Embeddings not found. Run: python scripts/precompute_embeddings.py")
        return
    
    # Build a business lookup for candidate details
    biz_lookup = business_catalog.set_index('business_id').to_dict('index')
    
    test_counts = test_ground_truth['user_id'].value_counts()
    eval_users = test_counts.head(num_users).index.tolist()
    
    print(f"  HYBRID EVALUATION ({num_users} users)")
    print(f"  Stage 1: Embeddings → Stage 2: LLM Rerank (API)")
    
    ndcg_scores = []
    hit_rates = []
    
    for user_id in eval_users:
        print(f"\n Evaluating User: {user_id}")
        
        # Ground truth
        user_test = test_ground_truth[test_ground_truth['user_id'] == user_id]
        positives = set(user_test[user_test['stars'] >= 4]['business_id'].tolist())
        
        if not positives:
            print("No highly rated positives. Skipping.")
            continue
        
        print(f"Ground truth positives: {len(positives)}")
        visited = set(train_reviews[train_reviews['user_id'] == user_id]['business_id'].tolist())
        
        # embedding retrieval
        print("Embedding retrieval (top 50)...")
        embedding_candidates = find_similar_businesses(user_id, top_k=50, exclude_ids=list(visited))
        
        if not embedding_candidates:
            print("No embedding candidates found. Skipping.")
            continue
        
        # build candidate dicts for LLM reranking
        candidate_dicts = []
        for bid, emb_score in embedding_candidates[:15]:
            if bid in biz_lookup:
                biz_info = biz_lookup[bid]
                candidate_dicts.append({
                    'business_id': bid,
                    'name': biz_info.get('name', 'Unknown'),
                    'categories': biz_info.get('categories', ''),
                    'stars': biz_info.get('stars', 0),
                    'review_count': biz_info.get('review_count', 0),
                    'embedding_score': emb_score,
                })
        
        if not candidate_dicts:
            continue
        
        # LLM behavioral reranking (API call)
        print(f"Stage 2: Excavating persona + LLM reranking {len(candidate_dicts)} candidates...")
        try:
            persona = excavate_user(user_id, train_reviews)
            if not persona:
                print("Failed to excavate persona. Using embedding-only ranking.")
                recommended_ids = [bid for bid, _ in embedding_candidates[:15]]
            else:
                narrative = persona['narrative']
                drifts = persona['structured']['drifts']
                
                llm_scores = rank_candidates_with_llm(narrative, drifts, candidate_dicts)
                
                # combine embedding score + LLM score (weighted blend)
                ranked = []
                for c in candidate_dicts:
                    bid = c['business_id']
                    score_data = llm_scores.get(bid, {"score": 50})
                    if isinstance(score_data, (int, float)):
                        llm_score = float(score_data)
                    else:
                        llm_score = float(score_data.get('score', 50))
                    
                    # Hybrid score: 40% embedding + 60% LLM behavioral
                    hybrid_score = 0.4 * (c['embedding_score'] * 100) + 0.6 * llm_score
                    ranked.append((bid, hybrid_score))
                
                ranked.sort(key=lambda x: x[1], reverse=True)
                recommended_ids = [bid for bid, _ in ranked]
                
        except Exception as e:
            print(f"LLM reranking failed ({e}). Falling back to embedding-only.")
            recommended_ids = [bid for bid, _ in embedding_candidates[:15]]
        
        # Calculate metrics
        r = [1 if bid in positives else 0 for bid in recommended_ids]
        
        n_score = ndcg_at_k(r, 10)
        h_score = hit_rate_at_k(recommended_ids, positives, 10)
        
        print(f"NDCG@10: {n_score:.4f} | HitRate@10: {h_score:.4f}")
        
        ndcg_scores.append(n_score)
        hit_rates.append(h_score)
    
    if ndcg_scores:
        print(f"  HYBRID RESULTS ({len(ndcg_scores)} valid users)")
        print(f"  Average NDCG@10:    {np.mean(ndcg_scores):.4f}")
        print(f"  Average HitRate@10: {np.mean(hit_rates):.4f}")
    else:
        print("\nNo valid users evaluated.")
    
    return np.mean(ndcg_scores) if ndcg_scores else 0.0


def evaluate_ndcg(num_users=5):
   #LLM-only evaluation
    data_dir = os.path.join(ROOT, 'data')
    train_reviews = pd.read_csv(os.path.join(data_dir, 'train_reviews.csv'))
    test_ground_truth = pd.read_csv(os.path.join(data_dir, 'test_ground_truth.csv'))
    
    business_catalog = pd.read_csv(os.path.join(data_dir, 'business_categories.csv'))
    
    # get top users with most test reviews
    test_counts = test_ground_truth['user_id'].value_counts()
    eval_users = test_counts.head(num_users).index.tolist()
    
    print(f"Evaluating {num_users} users for NDCG@10...")
    
    ndcg_scores = []
    hit_rates = []
    
    for user_id in eval_users:
        print(f"\n--- Evaluating User: {user_id} ---")
        
        # get ground truth positives (businesses they visited and rated >= 4)
        user_test = test_ground_truth[(test_ground_truth['user_id'] == user_id)]
        positives = user_test[user_test['stars'] >= 4]['business_id'].tolist()
        
        if not positives:
            print("No highly-rated ground truth positives in test set. Skipping.")
            continue
            
        print(f"Ground truth positives: {len(positives)}")
        
        # build persona from train set
        print("Excavating persona from train set...")
        persona = excavate_user(user_id, train_reviews)
        if not persona:
            print("Failed to excavate persona. Skipping.")
            continue
            
        narrative = persona['narrative']
        drifts = persona['structured']['drifts']
        
        # construct candidate pool (positives + random negatives)
        np.random.shuffle(positives)
        target_positives = positives[:3]
        
        positive_businesses = business_catalog[business_catalog['business_id'].isin(target_positives)].to_dict('records')
        
        num_negatives = 15 - len(positive_businesses)
        negatives = business_catalog[~business_catalog['business_id'].isin(positives)].sample(n=num_negatives).to_dict('records')
        
        candidates = positive_businesses + negatives
        np.random.shuffle(candidates)
        

        # LLM Ranking
        print(f"Ranking {len(candidates)} candidates using Cerebras Qwen 235B...")
        llm_scores = rank_candidates_with_llm(narrative, drifts, candidates)
        
        # extract and sort scores
        ranked_list = []
        for c in candidates:
            bid = c['business_id']
            score_data = llm_scores.get(bid, {"score": 0})
            # Handle if LLM returned an int instead of dict
            if isinstance(score_data, int) or isinstance(score_data, float):
                 score = float(score_data)
            else:
                 score = float(score_data.get('score', 0))
                 
            ranked_list.append((bid, score))
            
        ranked_list.sort(key=lambda x: x[1], reverse=True)
        recommended_ids = [x[0] for x in ranked_list]
        
        # calculate Metrics
        # r is a list of relevance scores (1 if in positives, 0 otherwise) for the ranked items
        r = [1 if bid in positives else 0 for bid in recommended_ids]
        
        n_score = ndcg_at_k(r, 10)
        h_score = hit_rate_at_k(recommended_ids, positives, 10)
        
        print(f"NDCG@10: {n_score:.4f}")
        print(f"HitRate@10: {h_score:.4f}")
        
        ndcg_scores.append(n_score)
        hit_rates.append(h_score)
        
    if ndcg_scores:
        print("FINAL EVALUATION METRICS")
        print(f"Average NDCG@10:  {np.mean(ndcg_scores):.4f}")
        print(f"Average HitRate@10: {np.mean(hit_rates):.4f}")
    else:
        print("\nNo valid users evaluated.")

if __name__ == '__main__':
    import argparse
    parser = argparse.ArgumentParser(description="Sylon NDCG Evaluation")
    parser.add_argument("--mode", choices=["embedding", "hybrid", "llm"], default="embedding",
                        help="Evaluation mode: 'embedding' (fast, free), 'hybrid' (embedding + LLM), 'llm' (legacy)")
    parser.add_argument("--users", type=int, default=50, help="Number of users to evaluate")
    args = parser.parse_args()
    
    if args.mode == "embedding":
        evaluate_embedding_only(num_users=args.users)
    elif args.mode == "hybrid":
        evaluate_hybrid(num_users=args.users)
    else:
        evaluate_ndcg(num_users=args.users)
