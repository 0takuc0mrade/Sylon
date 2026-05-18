#!/usr/bin/env python3
"""
One-time precomputation of user and business embeddings.
Run this ONCE before evaluation:
    python scripts/precompute_embeddings.py

Uses sentence-transformers (all-MiniLM-L6-v2) — runs on CPU, zero API credits.
Generates ~384-dimensional embeddings for all users and businesses.
Saves to data/embeddings/ for instant reloading.
"""

import os
import sys
import time

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT)

import pandas as pd
from agents.embeddings import precompute_embeddings

def main():
    print("=" * 60)
    print("  SYLON EMBEDDING PRECOMPUTATION")
    print("  Model: all-MiniLM-L6-v2 (CPU, zero API credits)")
    print("=" * 60)
    
    data_dir = os.path.join(ROOT, "data")
    
    # Load reviews
    reviews_path = os.path.join(data_dir, "sampled_reviews.csv")
    if not os.path.exists(reviews_path):
        print(f"[ERROR] Reviews file not found: {reviews_path}")
        print("Please ensure sampled_reviews.csv is in the data/ directory.")
        sys.exit(1)
    
    print(f"\n[1/3] Loading reviews from {reviews_path}...")
    all_reviews = pd.read_csv(reviews_path)
    print(f"       Loaded {len(all_reviews):,} reviews from {all_reviews['user_id'].nunique():,} users")
    
    # Load business catalog
    business_path = os.path.join(data_dir, "business_categories.csv")
    if not os.path.exists(business_path):
        print(f"[ERROR] Business catalog not found: {business_path}")
        sys.exit(1)
    
    print(f"\n[2/3] Loading business catalog from {business_path}...")
    business_catalog = pd.read_csv(business_path)
    print(f"       Loaded {len(business_catalog):,} businesses")
    
    # Precompute
    print(f"\n[3/3] Computing embeddings (this takes ~10-15 minutes on CPU)...")
    start = time.time()
    
    user_vecs, user_ids, biz_vecs, biz_ids = precompute_embeddings(
        all_reviews, business_catalog, batch_size=256
    )
    
    elapsed = time.time() - start
    print(f"\n{'=' * 60}")
    print(f"  DONE in {elapsed:.1f}s ({elapsed/60:.1f} minutes)")
    print(f"  Users:      {len(user_ids):,} embeddings ({user_vecs.shape})")
    print(f"  Businesses: {len(biz_ids):,} embeddings ({biz_vecs.shape})")
    print(f"  Saved to:   data/embeddings/")
    print(f"{'=' * 60}")


if __name__ == "__main__":
    main()
