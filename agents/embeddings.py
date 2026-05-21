# Local Embedding Engine for Sylon
# Uses sentence-transformers (all-MiniLM-L6-v2) for zero-cost, CPU-based embeddings.
# Provides two-stage retrieval: fast embedding similarity and LLM behavioral reranking.

import os
import sys
import numpy as np
import json
import pickle

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if ROOT not in sys.path:
    sys.path.insert(0, ROOT)

EMBEDDINGS_DIR = os.path.join(ROOT, "data", "embeddings")
MODEL_NAME = "all-MiniLM-L6-v2"

# Lazy-loaded singleton
_model = None
_user_embeddings = None
_user_ids = None
_business_embeddings = None
_business_ids = None


def _get_model():
    global _model
    if _model is None:
        from sentence_transformers import SentenceTransformer
        print(f"[Embeddings] Loading model '{MODEL_NAME}'...")
        _model = SentenceTransformer(MODEL_NAME)
        print(f"[Embeddings] Model loaded. Embedding dimension: {_model.get_sentence_embedding_dimension()}")
    return _model


def build_user_profiles(review_data, min_reviews=3):
    #Builds a text profile for each user by concatenating their review texts, weighted by star rating
    user_profiles = {}
    grouped = review_data.groupby("user_id")
    
    for user_id, group in grouped:
        if len(group) < min_reviews:
            continue
        
        # Weight reviews by star rating: 5-star reviews repeated 3x, 1-star 1x
        weighted_texts = []
        for _, row in group.iterrows():
            text = str(row["text"])[:500]  # Cap individual review length
            stars = float(row.get("stars", 3.0))
            # Repeat count: 1-star=1, 3-star=2, 5-star=3
            repeat = max(1, int(stars / 2))
            weighted_texts.extend([text] * repeat)
        
        # Concatenate into a single profile, capped at 2000 chars
        profile = " ".join(weighted_texts)[:2000]
        user_profiles[user_id] = profile
    
    return user_profiles


def build_business_profiles(review_data, business_data):
    business_profiles = {}
    
    # Aggregate reviews per business
    if review_data is not None and len(review_data) > 0:
        review_groups = review_data.groupby("business_id")
    else:
        review_groups = None
    
    for _, row in business_data.iterrows():
        bid = row["business_id"]
        
        # Metadata component
        name = str(row.get("name", ""))
        categories = str(row.get("categories", ""))
        city = str(row.get("city", ""))
        stars = row.get("stars", 0)
        
        metadata_text = f"{name}. {categories}. Located in {city}. Rated {stars} stars."
        
        # Review text component (if available)
        review_text = ""
        if review_groups is not None:
            try:
                biz_reviews = review_groups.get_group(bid)
                # Take top-rated reviews for the profile
                top_reviews = biz_reviews.nlargest(5, "stars")["text"].tolist()
                review_text = " ".join([str(t)[:300] for t in top_reviews])
            except KeyError:
                pass
        
        profile = f"{metadata_text} {review_text}"[:2000]
        business_profiles[bid] = profile
    
    return business_profiles


def precompute_embeddings(reviews_df, business_df, batch_size=256):
    """
    Pre-computes and saves user + business embeddings to disk.
    This is the one-time heavy operation (~10-15 min on CPU).
    """
    os.makedirs(EMBEDDINGS_DIR, exist_ok=True)
    model = _get_model()
    
    # --- User Embeddings ---
    print("[Embeddings] Building user profiles...")
    user_profiles = build_user_profiles(reviews_df)
    user_ids = list(user_profiles.keys())
    user_texts = list(user_profiles.values())
    
    print(f"[Embeddings] Encoding {len(user_ids)} user profiles...")
    user_vectors = model.encode(
        user_texts,
        batch_size=batch_size,
        show_progress_bar=True,
        normalize_embeddings=True,  # L2-normalize for cosine similarity via dot product
    )
    
    np.save(os.path.join(EMBEDDINGS_DIR, "user_embeddings.npy"), user_vectors)
    with open(os.path.join(EMBEDDINGS_DIR, "user_ids.pkl"), "wb") as f:
        pickle.dump(user_ids, f)
    
    print(f"[Embeddings] Saved {len(user_ids)} user embeddings ({user_vectors.shape})")
    
    # --- Business Embeddings ---
    print("[Embeddings] Building business profiles...")
    business_profiles = build_business_profiles(reviews_df, business_df)
    biz_ids = list(business_profiles.keys())
    biz_texts = list(business_profiles.values())
    
    print(f"[Embeddings] Encoding {len(biz_ids)} business profiles...")
    biz_vectors = model.encode(
        biz_texts,
        batch_size=batch_size,
        show_progress_bar=True,
        normalize_embeddings=True,
    )
    
    np.save(os.path.join(EMBEDDINGS_DIR, "business_embeddings.npy"), biz_vectors)
    with open(os.path.join(EMBEDDINGS_DIR, "business_ids.pkl"), "wb") as f:
        pickle.dump(biz_ids, f)
    
    print(f"[Embeddings] Saved {len(biz_ids)} business embeddings ({biz_vectors.shape})")
    print(f"[Embeddings] All embeddings saved to {EMBEDDINGS_DIR}")
    
    return user_vectors, user_ids, biz_vectors, biz_ids


def load_embeddings():
    """Loads pre-computed embeddings from disk. Returns False if not found."""
    global _user_embeddings, _user_ids, _business_embeddings, _business_ids
    
    user_emb_path = os.path.join(EMBEDDINGS_DIR, "user_embeddings.npy")
    user_ids_path = os.path.join(EMBEDDINGS_DIR, "user_ids.pkl")
    biz_emb_path = os.path.join(EMBEDDINGS_DIR, "business_embeddings.npy")
    biz_ids_path = os.path.join(EMBEDDINGS_DIR, "business_ids.pkl")
    
    if not all(os.path.exists(p) for p in [user_emb_path, user_ids_path, biz_emb_path, biz_ids_path]):
        print("[Embeddings] Pre-computed embeddings not found. Run scripts/precompute_embeddings.py first.")
        return False
    
    _user_embeddings = np.load(user_emb_path)
    with open(user_ids_path, "rb") as f:
        _user_ids = pickle.load(f)
    
    _business_embeddings = np.load(biz_emb_path)
    with open(biz_ids_path, "rb") as f:
        _business_ids = pickle.load(f)
    
    print(f"[Embeddings] Loaded {len(_user_ids)} user and {len(_business_ids)} business embeddings.")
    return True


def find_similar_businesses(user_id, top_k=50, exclude_ids=None):
    """
    Finds the top-k most similar businesses to a user using cosine similarity.
    Uses pre-computed, L2-normalized embeddings so cosine sim = dot product.
    
    Returns: list of (business_id, similarity_score) tuples, sorted descending.
    """
    global _user_embeddings, _user_ids, _business_embeddings, _business_ids
    
    if _user_embeddings is None:
        if not load_embeddings():
            return []
    
    if user_id not in _user_ids:
        return []
    
    user_idx = _user_ids.index(user_id)
    user_vec = _user_embeddings[user_idx]  # Shape: (384,)
    
    # Dot product with all business embeddings (equivalent to cosine sim since normalized)
    similarities = _business_embeddings @ user_vec  # Shape: (num_businesses,)
    
    # Get top-k indices
    if exclude_ids:
        exclude_set = set(exclude_ids)
        mask = np.array([bid not in exclude_set for bid in _business_ids])
        similarities = similarities * mask  # Zero out excluded businesses
    
    top_indices = np.argsort(similarities)[::-1][:top_k]
    
    results = [(
        _business_ids[idx],
        float(similarities[idx])
    ) for idx in top_indices]
    
    return results


def embed_text(text):
    """
    Generates an embedding for arbitrary text (e.g., a cold-start persona narrative).
    Useful for cross-domain cold start where we don't have pre-computed user embeddings.
    """
    model = _get_model()
    vector = model.encode([text], normalize_embeddings=True)[0]
    return vector


def find_businesses_for_text(text, top_k=50, exclude_ids=None):
    """
    Finds businesses similar to an arbitrary text description.
    Used for cold-start users who have no review history but have a persona narrative.
    """
    global _business_embeddings, _business_ids
    
    if _business_embeddings is None:
        if not load_embeddings():
            return []
    
    query_vec = embed_text(text)
    similarities = _business_embeddings @ query_vec
    
    if exclude_ids:
        exclude_set = set(exclude_ids)
        mask = np.array([bid not in exclude_set for bid in _business_ids])
        similarities = similarities * mask
    
    top_indices = np.argsort(similarities)[::-1][:top_k]
    
    return [(
        _business_ids[idx],
        float(similarities[idx])
    ) for idx in top_indices]


if __name__ == "__main__":
    # Quick test: load and query
    if load_embeddings():
        print(f"\nUser IDs sample: {_user_ids[:5]}")
        print(f"Business IDs sample: {_business_ids[:5]}")
        
        test_user = _user_ids[0]
        results = find_similar_businesses(test_user, top_k=5)
        print(f"\nTop 5 businesses for user {test_user}:")
        for bid, score in results:
            print(f"  {bid}: {score:.4f}")
    else:
        print("Run scripts/precompute_embeddings.py first!")
