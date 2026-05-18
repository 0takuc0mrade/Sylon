import asyncio
import traceback
from fastapi import FastAPI, UploadFile, File, Form
from pydantic import BaseModel
import sys
import os

# Add parent directory to path to resolve absolute imports locally
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from openserv.orchestrator import process_user_scenario, set_business_id, get_business_id

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

@app.post("/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest):
    # receives spoken text from ElevenLabs, runs the Sylon multi-agent orchestrator, and returns the Strategist's response text to be spoken back to the user.
    try:
        # Thread business_id through the session
        if request.business_id:
            set_business_id(request.business_id)

        # Run the sync orchestrator in a thread so we don't block the event loop
        strategist_response = await asyncio.to_thread(
            process_user_scenario, request.text
        )
        return ChatResponse(
            response=strategist_response,
            business_id=get_business_id(),
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

        return {
            "status": "ok",
            "reviews_ingested": len(reviews),
            "total_reviews": result.get("review_count", 0),
            "painpoints": len(result.get("painpoints", {}).get("complaints", [])),
            "personas": len(result.get("personas", [])),
            "business_id": business_id,
        }

    except Exception as e:
        print(f"[Server] Upload error: {e}")
        traceback.print_exc()
        return {"status": "error", "message": str(e)}
