import asyncio
import traceback
# pyrefly: ignore [missing-import]
from fastapi import FastAPI, UploadFile, File, Form, BackgroundTasks, Depends
# pyrefly: ignore [missing-import]
from pydantic import BaseModel
import sys
import os

# Add parent directory to path to resolve absolute imports locally
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# pyrefly: ignore [missing-import]
from dotenv import load_dotenv
load_dotenv()

from openserv.orchestrator import process_user_scenario
from openserv.persistence import persistence_service
from openserv.dependencies import get_current_user, get_optional_user

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

from openserv.dependencies import get_current_user, get_optional_user
from fastapi import Request, HTTPException

@app.post("/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest, req: Request, user: dict = Depends(get_optional_user)):
    # Webhook exception for ElevenLabs (or frontend client)
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

        # detect rate-limit errors (google-genai raises ResourceExhausted / 429)
        if "429" in err_msg or ("resource" in err_msg and "exhausted" in err_msg):
            print("[Server] → Rate-limited. Returning graceful fallback.")
            return ChatResponse(response=RATELIMIT_FALLBACK)

        print("[Server] → Unknown error. Returning generic fallback.")
        return ChatResponse(response=GENERIC_FALLBACK)


def process_and_persist_background(business_id: str, batch_id: str, ingestion_payload: dict):
    from openserv.tools import tool_ingest_reviews, tool_extract_painpoints
    import uuid
    
    try:
        # 1. Ingest
        if "csv_path" in ingestion_payload:
            reviews = tool_ingest_reviews(business_id=business_id, csv_path=ingestion_payload["csv_path"])
            if ingestion_payload.get("delete_after"):
                import os
                try:
                    os.remove(ingestion_payload["csv_path"])
                except Exception:
                    pass
        elif "reviews_json" in ingestion_payload:
            reviews = tool_ingest_reviews(business_id=business_id, reviews_json=ingestion_payload["reviews_json"])
        else:
            reviews = tool_ingest_reviews(business_id=business_id, reviews_text=ingestion_payload["reviews_text"])
            
        # VERY IMPORTANT: Hard cap to 100 reviews to protect the Cerebras daily token quota.
        # Processing 65,000 reviews caused a 429 Token Quota Exceeded error and crashed the local server.
        reviews = reviews[:100]
            
        print(f"[Background] Starting AI extraction for {business_id} ({len(reviews)} reviews)")

        # 2. Extract painpoints
        result = tool_extract_painpoints(business_id=business_id)
        
        # Persistence Layer 
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
        print(f"[Background] Finished AI extraction & persistence for {business_id}")
    except Exception as e:
        print(f"[Background] Error during extraction/persistence: {e}")
        traceback.print_exc()

@app.post("/business/upload-reviews")
async def upload_reviews(background_tasks: BackgroundTasks, user: dict = Depends(get_current_user), file: UploadFile = File(...), business_id: str = Form(...)):
    # for structured review uploads (CSV/JSON files). for voice/pasted text, use the /chat endpoint with INGEST intent.
    try:
        content = await file.read()
        text = content.decode("utf-8")

        from openserv.tools import tool_ingest_reviews, tool_extract_painpoints
        import uuid
        
        batch_id = f"batch_{uuid.uuid4().hex[:8]}"
        
        ingestion_payload = {}
        
        if file.filename.endswith(".csv"):
            tmp_path = f"/tmp/sylon_upload_{business_id}.csv"
            with open(tmp_path, "w") as f:
                f.write(text)
            ingestion_payload = {"csv_path": tmp_path, "delete_after": True}
        else:
            try:
                data = __import__("json").loads(text)
                ingestion_payload = {"reviews_json": data}
            except Exception:
                ingestion_payload = {"reviews_text": text}

        # heavy AI processing to background task
        background_tasks.add_task(process_and_persist_background, business_id, batch_id, ingestion_payload)

        return {
            "status": "processing",
            "message": f"File uploaded successfully. AI extraction is running in the background.",
            "business_id": business_id
        }

    except Exception as e:
        print(f"[Server] Upload error: {e}")
        traceback.print_exc()
        return {"status": "error", "message": str(e)}

class SampleUploadRequest(BaseModel):
    business_id: str

@app.post("/business/upload-sample")
async def upload_sample(background_tasks: BackgroundTasks, request: SampleUploadRequest, user: dict = Depends(get_current_user)):
    try:
        business_id = request.business_id
        csv_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "utilities", "mini_sample.csv")
        
        from openserv.tools import tool_ingest_reviews, tool_extract_painpoints
        import uuid
        
        batch_id = f"batch_{uuid.uuid4().hex[:8]}"
        
        ingestion_payload = {"csv_path": csv_path, "delete_after": False}
        
        # heavy AI processing to background task
        background_tasks.add_task(process_and_persist_background, business_id, batch_id, ingestion_payload)

        return {
            "status": "processing",
            "message": f"Sample dataset loaded successfully. AI extraction is running in the background.",
            "business_id": business_id
        }

    except Exception as e:
        print(f"[Server] Sample Upload error: {e}")
        traceback.print_exc()
        return {"status": "error", "message": str(e)}

@app.get("/business/{business_id}/dashboard")
async def get_dashboard(business_id: str, user: dict = Depends(get_current_user)):
    try:
        data = persistence_service.get_business_dashboard_data(business_id)
        if not data["archetypes"] and not data["history"]:
            return {"status": "not_found", "message": "No data available for this business."}
        return {"status": "ok", "data": data}
    except Exception as e:
        print(f"[Server] Dashboard error: {e}")
        traceback.print_exc()
        return {"status": "error", "message": str(e)}

@app.get("/chat/history/{business_id}")
async def get_chat_history(business_id: str, user: dict = Depends(get_current_user)):
    from openserv.orchestrator import sessions
    try:
        session = sessions.get_or_create(business_id)
        # Exclude internal system messages if any, return user/assistant pairs
        return {"status": "ok", "history": session.history}
    except Exception as e:
        print(f"[Server] History error: {e}")
        return {"status": "error", "message": str(e)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("openserv.server:app", host="0.0.0.0", port=8000, reload=True)
