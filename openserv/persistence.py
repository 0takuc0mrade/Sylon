import sqlite3
import os
import json
from datetime import datetime
from contextlib import contextmanager

class PersistenceService:
    def __init__(self):
        self.db_path = os.environ.get("SYLON_DB_PATH", "data/sylon.db")
        db_dir = os.path.dirname(self.db_path)
        if db_dir:
            os.makedirs(db_dir, exist_ok=True)
        self.init_db()

    @contextmanager
    def get_connection(self):
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA foreign_keys = ON")
        try:
            yield conn
        finally:
            conn.commit()
            conn.close()

    def init_db(self):
        with self.get_connection() as conn:
            conn.execute("""
            CREATE TABLE IF NOT EXISTS businesses (
                business_id TEXT PRIMARY KEY,
                name TEXT,
                description TEXT,
                categories TEXT,
                city TEXT,
                state TEXT,
                location TEXT,
                metadata_json TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
            """)

            conn.execute("""
            CREATE TABLE IF NOT EXISTS review_batches (
                batch_id TEXT PRIMARY KEY,
                business_id TEXT NOT NULL,
                source_type TEXT,
                review_count INTEGER NOT NULL,
                checksum TEXT,
                status TEXT NOT NULL,
                created_at TEXT NOT NULL,
                metadata_json TEXT,
                FOREIGN KEY (business_id) REFERENCES businesses(business_id)
            )
            """)

            conn.execute("""
            CREATE TABLE IF NOT EXISTS reviews (
                review_id TEXT PRIMARY KEY,
                business_id TEXT NOT NULL,
                batch_id TEXT,
                author_id TEXT,
                rating REAL,
                review_date TEXT,
                text TEXT NOT NULL,
                source TEXT,
                ingested_at TEXT NOT NULL,
                text_hash TEXT,
                FOREIGN KEY (business_id) REFERENCES businesses(business_id),
                FOREIGN KEY (batch_id) REFERENCES review_batches(batch_id)
            )
            """)

            conn.execute("""
            CREATE TABLE IF NOT EXISTS painpoint_snapshots (
                snapshot_id TEXT PRIMARY KEY,
                business_id TEXT NOT NULL,
                batch_id TEXT,
                complaints_json TEXT,
                praise_json TEXT,
                trends_json TEXT,
                full_payload_json TEXT,
                model TEXT,
                created_at TEXT NOT NULL,
                FOREIGN KEY (business_id) REFERENCES businesses(business_id),
                FOREIGN KEY (batch_id) REFERENCES review_batches(batch_id)
            )
            """)

            conn.execute("""
            CREATE TABLE IF NOT EXISTS personas (
                persona_id TEXT PRIMARY KEY,
                business_id TEXT NOT NULL,
                name TEXT,
                source TEXT,
                narrative TEXT,
                drifts_json TEXT,
                avg_rating REAL,
                top_words_json TEXT,
                grounding_quotes_json TEXT,
                review_count INTEGER,
                full_payload_json TEXT,
                model TEXT,
                created_at TEXT NOT NULL,
                FOREIGN KEY (business_id) REFERENCES businesses(business_id)
            )
            """)

            conn.execute("""
            CREATE TABLE IF NOT EXISTS collision_logs (
                log_id TEXT PRIMARY KEY,
                business_id TEXT NOT NULL,
                scenario TEXT NOT NULL,
                source_mode TEXT,
                persona_ids_json TEXT,
                collision_analysis TEXT,
                strategist_response TEXT,
                predicted_rating REAL,
                early_warning TEXT,
                model TEXT,
                created_at TEXT NOT NULL,
                metadata_json TEXT,
                FOREIGN KEY (business_id) REFERENCES businesses(business_id)
            )
            """)

            conn.execute("""
            CREATE TABLE IF NOT EXISTS recommendation_logs (
                recommendation_id TEXT PRIMARY KEY,
                business_id TEXT NOT NULL,
                query TEXT NOT NULL,
                raw_recommendations TEXT,
                final_response TEXT,
                persona_ids_json TEXT,
                painpoint_snapshot_id TEXT,
                model TEXT,
                created_at TEXT NOT NULL,
                metadata_json TEXT,
                FOREIGN KEY (business_id) REFERENCES businesses(business_id)
            )
            """)

    def _now(self):
        return datetime.utcnow().isoformat()

    def upsert_business(self, business_id: str, name: str = None, description: str = None, 
                        categories: list = None, location: dict = None, metadata: dict = None):
        with self.get_connection() as conn:
            cursor = conn.execute("SELECT business_id FROM businesses WHERE business_id = ?", (business_id,))
            exists = cursor.fetchone() is not None

            now = self._now()
            cat_str = json.dumps(categories) if categories else None
            loc_str = json.dumps(location) if location else None
            meta_str = json.dumps(metadata) if metadata else None
            city = location.get("city") if location else None
            state = location.get("state") if location else None

            if exists:
                conn.execute("""
                    UPDATE businesses SET
                        name = COALESCE(?, name),
                        description = COALESCE(?, description),
                        categories = COALESCE(?, categories),
                        city = COALESCE(?, city),
                        state = COALESCE(?, state),
                        location = COALESCE(?, location),
                        metadata_json = COALESCE(?, metadata_json),
                        updated_at = ?
                    WHERE business_id = ?
                """, (name, description, cat_str, city, state, loc_str, meta_str, now, business_id))
            else:
                conn.execute("""
                    INSERT INTO businesses (business_id, name, description, categories, city, state, location, metadata_json, created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (business_id, name, description, cat_str, city, state, loc_str, meta_str, now, now))

    def create_review_batch(self, batch_id: str, business_id: str, source_type: str, review_count: int, checksum: str = None, metadata: dict = None):
        with self.get_connection() as conn:
            conn.execute("""
                INSERT INTO review_batches (batch_id, business_id, source_type, review_count, checksum, status, created_at, metadata_json)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (batch_id, business_id, source_type, review_count, checksum, "completed", self._now(), json.dumps(metadata) if metadata else None))

    def insert_reviews(self, reviews: list):
        if not reviews:
            return
        with self.get_connection() as conn:
            for r in reviews:
                conn.execute("""
                    INSERT OR IGNORE INTO reviews (review_id, business_id, batch_id, author_id, rating, review_date, text, source, ingested_at, text_hash)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    r.get("review_id"), r.get("business_id"), r.get("batch_id"), r.get("author_id"),
                    r.get("rating"), r.get("review_date"), r.get("text"), r.get("source"),
                    self._now(), r.get("text_hash")
                ))

    def create_painpoint_snapshot(self, snapshot_id: str, business_id: str, complaints: list, praise: list, trends: list, full_payload: dict, batch_id: str = None):
        with self.get_connection() as conn:
            conn.execute("""
                INSERT INTO painpoint_snapshots (snapshot_id, business_id, batch_id, complaints_json, praise_json, trends_json, full_payload_json, model, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                snapshot_id, business_id, batch_id,
                json.dumps(complaints), json.dumps(praise), json.dumps(trends), json.dumps(full_payload),
                full_payload.get("model", "unknown"), self._now()
            ))

    def upsert_persona(self, persona_id: str, business_id: str, name: str, source: str, narrative: str, 
                       drifts: list, avg_rating: float, top_words: list, grounding_quotes: list, 
                       review_count: int, full_payload: dict):
        with self.get_connection() as conn:
            conn.execute("""
                INSERT OR REPLACE INTO personas (persona_id, business_id, name, source, narrative, drifts_json, avg_rating, top_words_json, grounding_quotes_json, review_count, full_payload_json, model, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                persona_id, business_id, name, source, narrative, json.dumps(drifts), avg_rating, 
                json.dumps(top_words), json.dumps(grounding_quotes), review_count, json.dumps(full_payload),
                full_payload.get("model", "unknown"), self._now()
            ))

    def create_collision_log(self, log_id: str, business_id: str, scenario: str, source_mode: str, 
                             persona_ids: list, collision_analysis: str, strategist_response: str, 
                             predicted_rating: float = None, early_warning: str = None, metadata: dict = None):
        with self.get_connection() as conn:
            conn.execute("""
                INSERT INTO collision_logs (log_id, business_id, scenario, source_mode, persona_ids_json, collision_analysis, strategist_response, predicted_rating, early_warning, model, created_at, metadata_json)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                log_id, business_id, scenario, source_mode, json.dumps(persona_ids), collision_analysis, strategist_response, 
                predicted_rating, early_warning, metadata.get("model", "unknown") if metadata else "unknown", self._now(), json.dumps(metadata) if metadata else None
            ))

    def create_recommendation_log(self, log_id: str, business_id: str, query: str, raw_recommendations: str, 
                                  final_response: str, persona_ids: list = None, painpoint_snapshot_id: str = None, metadata: dict = None):
        with self.get_connection() as conn:
            conn.execute("""
                INSERT INTO recommendation_logs (recommendation_id, business_id, query, raw_recommendations, final_response, persona_ids_json, painpoint_snapshot_id, model, created_at, metadata_json)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                log_id, business_id, query, raw_recommendations, final_response, json.dumps(persona_ids) if persona_ids else None, 
                painpoint_snapshot_id, metadata.get("model", "unknown") if metadata else "unknown", self._now(), json.dumps(metadata) if metadata else None
            ))

    def get_business_dashboard_data(self, business_id: str) -> dict:
        with self.get_connection() as conn:
            # 1. Get latest painpoint snapshot
            snapshot_row = conn.execute(
                "SELECT complaints_json, praise_json FROM painpoint_snapshots WHERE business_id = ? ORDER BY created_at DESC LIMIT 1",
                (business_id,)
            ).fetchone()
            
            top_complaint = "No complaint data available yet."
            top_praise = "No praise data available yet."
            if snapshot_row:
                try:
                    complaints = json.loads(snapshot_row["complaints_json"])
                    if complaints and len(complaints) > 0:
                        top_complaint = complaints[0] if isinstance(complaints[0], str) else str(complaints[0].get("description", complaints[0]))
                    
                    praise = json.loads(snapshot_row["praise_json"])
                    if praise and len(praise) > 0:
                        top_praise = praise[0] if isinstance(praise[0], str) else str(praise[0].get("description", praise[0]))
                except Exception:
                    pass

            # 2. Get Personas / Archetypes
            persona_rows = conn.execute(
                "SELECT name, drifts_json, avg_rating FROM personas WHERE business_id = ? ORDER BY created_at DESC LIMIT 10",
                (business_id,)
            ).fetchall()
            
            archetypes = []
            total_rating = 0
            for row in persona_rows:
                drifts = []
                try:
                    drifts = json.loads(row["drifts_json"])
                except:
                    pass
                drift_str = drifts[0] if drifts and len(drifts) > 0 else "No significant drift detected."
                if isinstance(drift_str, dict):
                    drift_str = drift_str.get("description", str(drift_str))
                    
                rating = float(row["avg_rating"] or 0)
                total_rating += rating
                
                archetypes.append({
                    "name": row["name"],
                    "drift": str(drift_str),
                    "rating": rating
                })
            
            # Health Score
            health_score = 78 # Default placeholder
            if archetypes and len(archetypes) > 0:
                avg = total_rating / len(archetypes)
                # Convert 1-5 rating to percentage
                health_score = int((avg / 5.0) * 100)

            # 3. Get Ingestion History
            history_rows = conn.execute(
                "SELECT batch_id, source_type, review_count, created_at FROM review_batches WHERE business_id = ? ORDER BY created_at DESC LIMIT 5",
                (business_id,)
            ).fetchall()
            
            history = []
            for row in history_rows:
                # Format date nicely
                try:
                    dt = datetime.fromisoformat(row["created_at"])
                    date_str = dt.strftime("%b %d, %Y")
                except:
                    date_str = row["created_at"]
                    
                history.append({
                    "date": date_str,
                    "source": row["source_type"].capitalize() if row["source_type"] else "Upload",
                    "review_count": row["review_count"]
                })

            return {
                "health_score": health_score,
                "top_complaint": top_complaint,
                "top_praise": top_praise,
                "archetypes": archetypes,
                "history": history
            }

persistence_service = PersistenceService()
