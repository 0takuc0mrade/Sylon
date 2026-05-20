import asyncio
import traceback
from fastapi import FastAPI, UploadFile, File, Form
from pydantic import BaseModel
import sys
import os

# Add parent directory to path to resolve absolute imports locally
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from openserv.orchestrator import process_user_scenario
from openserv.persistence import persistence_service

app = FastAPI(title="Sylon OpenServ Webhook", description="FastAPI webhook endpoint for ElevenLabs")

RATELIMIT_FALLBACK = (
    "I'm getting a lot of questions right now and need a moment to catch my breath. "
    "Try again in about thirty seconds — I'll be ready."
)

GENERIC_FALLBACK = (
    "Something unexpected happened on my end. "
    "Give me a moment and try that again."
)

class ChatRequest(BaseModel):
    text: str
    business_id: str | None = None

class ChatResponse(BaseModel):
    response: str
    business_id: str | None = None

@app.get("/health")
async def health():
    try:
        with persistence_service.get_connection() as conn:
            conn.execute("SELECT 1").fetchone()
        database_status = "ok"
    except Exception as e:
        print(f"[Health] Database check failed: {e}")
        database_status = "error"

    return {
        "status": "ok" if database_status == "ok" else "degraded",
        "service": "sylon-api",
        "persistence": "sqlite",
        "database": database_status,
    }

@app.post("/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest):
    # receives spoken text from ElevenLabs, runs the Sylon multi-agent orchestrator, and returns the Strategist's response text to be spoken back to the user.
    try:
        import uuid
        business_id = request.business_id or f"biz_{uuid.uuid4().hex[:8]}"

        # Run the sync orchestrator in a thread so we don't block the event loop
        strategist_response = await asyncio.to_thread(
            process_user_scenario, request.text, business_id
        )
        return ChatResponse(
            response=strategist_response,
            business_id=business_id,
        )

    except Exception as e:
        err_name = type(e).__name__
        err_msg = str(e).lower()
        print(f"[Server] Caught {err_name}: {e}")
        traceback.print_exc()

        # Detect rate-limit errors (google-genai raises ResourceExhausted / 429)
        if "429" in err_msg or ("resource" in err_msg and "exhausted" in err_msg):
            print("[Server] → Rate-limited. Returning graceful fallback.")
            return ChatResponse(response=RATELIMIT_FALLBACK)

        print("[Server] → Unknown error. Returning generic fallback.")
        return ChatResponse(response=GENERIC_FALLBACK)


@app.post("/business/upload-reviews")
async def upload_reviews(file: UploadFile = File(...), business_id: str = Form(...)):
    # for structured review uploads (CSV/JSON files). for voice/pasted text, use the /chat endpoint with INGEST intent.
    try:
        content = await file.read()
        text = content.decode("utf-8")

        from openserv.tools import tool_ingest_reviews, tool_extract_painpoints
        import uuid
        
        batch_id = f"batch_{uuid.uuid4().hex[:8]}"
        
        if file.filename.endswith(".csv"):
            # Save temp file and ingest
            tmp_path = f"/tmp/sylon_upload_{business_id}.csv"
            with open(tmp_path, "w") as f:
                f.write(text)
            reviews = tool_ingest_reviews(business_id=business_id, csv_path=tmp_path)
            os.remove(tmp_path)
        else:
            # Try JSON, fallback to text
            try:
                data = __import__("json").loads(text)
                reviews = tool_ingest_reviews(business_id=business_id, reviews_json=data)
            except Exception:
                reviews = tool_ingest_reviews(business_id=business_id, reviews_text=text)

        # Extract painpoints
        result = tool_extract_painpoints(business_id=business_id)
        
        # --- Persistence Layer ---
        try:
            persistence_service.upsert_business(business_id=business_id)
            persistence_service.create_review_batch(
                batch_id=batch_id, 
                business_id=business_id, 
                source_type="upload", 
                review_count=len(reviews)
            )
            
            # Map normalized reviews to DB schema
            db_reviews = []
            for r in reviews:
                db_reviews.append({
                    "review_id": r.get("id", f"rev_{uuid.uuid4().hex[:8]}"),
                    "business_id": business_id,
                    "batch_id": batch_id,
                    "author_id": r.get("author_id", r.get("author_name", "Anonymous")),
                    "rating": float(r.get("rating", 0)),
                    "review_date": r.get("date", r.get("time", "")),
                    "text": r.get("text", ""),
                    "source": "upload",
                    "text_hash": None
                })
            persistence_service.insert_reviews(db_reviews)
            
            # Painpoints
            painpoints = result.get("painpoints", {})
            persistence_service.create_painpoint_snapshot(
                snapshot_id=f"snap_{uuid.uuid4().hex[:8]}",
                business_id=business_id,
                batch_id=batch_id,
                complaints=painpoints.get("complaints", []),
                praise=painpoints.get("praise", []),
                trends=painpoints.get("trends", []),
                full_payload=painpoints
            )
            
            # Personas
            for p in result.get("personas", []):
                persistence_service.upsert_persona(
                    persona_id=f"per_{uuid.uuid4().hex[:8]}",
                    business_id=business_id,
                    name=p.get("name", "Unknown"),
                    source="upload",
                    narrative=p.get("narrative", ""),
                    drifts=p.get("drifts", []),
                    avg_rating=p.get("avg_rating", 0),
                    top_words=p.get("top_words", []),
                    grounding_quotes=p.get("grounding_quotes", p.get("sample_texts", [])),
                    review_count=p.get("review_count", len(reviews)),
                    full_payload=p
                )
            persistence_status = "saved"
        except Exception as e:
            print(f"[Server] Persistence failed: {e}")
            persistence_status = "failed"

        return {
            "status": "ok",
            "reviews_ingested": len(reviews),
            "total_reviews": result.get("review_count", 0),
            "painpoints": len(result.get("painpoints", {}).get("complaints", [])),
            "personas": len(result.get("personas", [])),
            "business_id": business_id,
            "persistence": {
                "database": "sqlite",
                "status": persistence_status
            }
        }

    except Exception as e:
        print(f"[Server] Upload error: {e}")
        traceback.print_exc()
        return {"status": "error", "message": str(e)}
