# Sylon LLM Client — Multi-Provider Inference with Automatic Failover
# Primary: Google Gemini (gemini-2.5-flash via google-genai SDK)
# Fallback: Cerebras (gpt-oss-120b)
# Architecture: Gemini is always attempted first. On 429/rate-limit/error,
# the system automatically cascades to Cerebras to guarantee zero downtime.

import os
import time
import json
import functools
import logging
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env"))

logger = logging.getLogger('sylon.llm')
logger.setLevel(logging.INFO)
if not logger.handlers:
    handler = logging.StreamHandler()
    handler.setFormatter(logging.Formatter('[%(asctime)s] [%(name)s] %(message)s', datefmt='%Y-%m-%d %H:%M:%S'))
    logger.addHandler(handler)

# ─── Google Gemini (Primary Engine) ──────────────────────────────────────────

from google import genai
gemini_client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY", ""))
GEMINI_MODEL = os.environ.get("GEMINI_MODEL", "gemini-2.5-flash")

# ─── Cerebras (Failover Engine) ──────────────────────────────────────────────

USING_CEREBRAS = False
try:
    from cerebras.cloud.sdk import Cerebras
    _cerebras_key = os.environ.get("CEREBRAS_API_KEY")
    if _cerebras_key:
        cerebras_client = Cerebras(api_key=_cerebras_key)
        CEREBRAS_MODEL = os.environ.get("CEREBRAS_MODEL", "gpt-oss-120b")
        USING_CEREBRAS = True
        logger.info(f"[INIT] Cerebras failover engine ready | model={CEREBRAS_MODEL}")
except ImportError:
    pass

# ─── Vertex AI (Optional — for GCP-authenticated environments) ───────────────

USING_VERTEX = False
try:
    import vertexai
    from vertexai.generative_models import GenerativeModel

    _gcp_project = os.environ.get("GCP_PROJECT_ID")
    _gcp_location = os.environ.get("GCP_LOCATION", "us-central1")
    if _gcp_project:
        vertexai.init(project=_gcp_project, location=_gcp_location)
        vertex_model = GenerativeModel("gemini-2.5-flash")
        USING_VERTEX = True
        logger.info(f"[INIT] Vertex AI connected | project={_gcp_project}")
except ImportError:
    pass

logger.info(f"[INIT] Primary engine: Gemini ({GEMINI_MODEL}) | Failover: {'Cerebras' if USING_CEREBRAS else 'None'} | Vertex: {USING_VERTEX}")


# ─── Retry Decorator ─────────────────────────────────────────────────────────

MAX_RETRIES = 1
BASE_DELAY = 1

def retry_with_backoff(func):
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        retries = 0
        while retries <= MAX_RETRIES:
            try:
                return func(*args, **kwargs)
            except Exception as e:
                if retries == MAX_RETRIES:
                    raise e
                time.sleep(BASE_DELAY * (2 ** retries))
                retries += 1
    return wrapper


# ─── Core Gemini Call (No mocks. Raises on failure.) ─────────────────────────

def call_gemini(prompt: str, system_prompt: str = None, json_mode: bool = False) -> str:
    """Direct Gemini API call. Raises exception on any failure."""

    # Path A: Vertex AI (GCP-authenticated)
    if USING_VERTEX:
        try:
            full_prompt = f"{system_prompt}\n\n{prompt}" if system_prompt else prompt
            response = vertex_model.generate_content(full_prompt)
            logger.info(f"[GEMINI] Response via Vertex AI ({len(response.text)} chars)")
            return response.text
        except Exception as e:
            logger.warning(f"[GEMINI] Vertex AI failed: {e}. Trying google-genai SDK...")

    # Path B: google-genai SDK (API key)
    config = {}
    if json_mode:
        config["response_mime_type"] = "application/json"

    full_prompt = f"{system_prompt}\n\n{prompt}" if system_prompt else prompt

    response = gemini_client.models.generate_content(
        model=GEMINI_MODEL,
        contents=full_prompt,
        config=config if config else None,
    )
    logger.info(f"[GEMINI] Response via API key ({len(response.text)} chars)")
    return response.text


# Core Cerebras Call

def call_cerebras_native(prompt: str, system_prompt: str = None, json_mode: bool = False) -> str:
    """Direct Cerebras API call. Raises exception on failure."""
    if not USING_CEREBRAS:
        raise RuntimeError("Cerebras SDK not available. No failover engine configured.")

    messages = []
    if system_prompt:
        messages.append({"role": "system", "content": system_prompt})
    messages.append({"role": "user", "content": prompt})

    kwargs = {"model": CEREBRAS_MODEL, "messages": messages}
    if json_mode:
        kwargs["response_format"] = {"type": "json_object"}

    chat_completion = cerebras_client.chat.completions.create(**kwargs)
    result = chat_completion.choices[0].message.content
    logger.info(f"[CEREBRAS] Failover response ({len(result)} chars)")
    return result


# ─── Public Interface: Gemini-First Cascade ──────────────────────────────────

@retry_with_backoff
def call_llm(prompt: str, system_prompt: str = None, **kwargs) -> str:
    """
    Primary interface for all Sylon agent calls.
    Strategy: Gemini first → Cerebras fallback on any error.
    """
    if os.environ.get("SYLON_DEBUG_MODE") == "True":
        return "DEBUG: This is a fast mock response for testing."

    try:
        return call_gemini(prompt, system_prompt)
    except Exception as e:
        logger.warning(f"[CASCADE] Gemini failed ({type(e).__name__}: {e}). Routing to Cerebras...")
        if USING_CEREBRAS:
            return call_cerebras_native(prompt, system_prompt)
        raise


@retry_with_backoff
def call_cerebras(prompt: str, system_prompt: str = None, **kwargs) -> str:
    """
    Explicit Cerebras call. Used by orchestrator for non-critical paths
    (general chat, recommendation synthesis) to preserve Gemini quota
    for the high-value Multi-Agent pipeline.
    """
    if USING_CEREBRAS:
        return call_cerebras_native(prompt, system_prompt)
    # If Cerebras unavailable, use Gemini
    return call_gemini(prompt, system_prompt)


@retry_with_backoff
def call_cerebras_json(prompt: str, system_prompt: str = None, temperature: float = 0.1, max_tokens: int = 4000) -> dict:
    """JSON-mode call with cascade."""
    try:
        response_text = call_gemini(prompt, system_prompt, json_mode=True)
    except Exception as e:
        logger.warning(f"[CASCADE] Gemini JSON failed. Routing to Cerebras...")
        if USING_CEREBRAS:
            response_text = call_cerebras_native(prompt, system_prompt, json_mode=True)
        else:
            raise

    try:
        return json.loads(response_text)
    except Exception as e:
        # Try to extract JSON from markdown fences
        import re
        match = re.search(r'```(?:json)?\s*([\s\S]*?)\s*```', response_text)
        if match:
            return json.loads(match.group(1))
        logger.error(f"[JSON] Failed to parse response: {e}")
        return {}


@retry_with_backoff
def call_gemini_structured(prompt: str, response_schema=None) -> str:
    """Structured output call for the Intent Router."""
    if os.environ.get("SYLON_DEBUG_MODE") == "True":
        return "CHAT"

    try:
        return call_gemini(prompt, json_mode=True)
    except Exception as e:
        logger.warning(f"[CASCADE] Structured call failed. Routing to Cerebras...")
        if USING_CEREBRAS:
            return call_cerebras_native(prompt, json_mode=True)
        raise
