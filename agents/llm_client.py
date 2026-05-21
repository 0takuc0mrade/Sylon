#centralized LLM Client for Sylon. two providers, one interface: cerebras AI, gemini
import os
import time
import json
import functools
from google import genai
from cerebras.cloud.sdk import Cerebras
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env"))

# clients
gemini_client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))

cerebras_client = Cerebras(api_key=os.environ.get("CEREBRAS_API_KEY"))


CEREBRAS_MODEL = os.environ.get("CEREBRAS_MODEL", "qwen-3-235b-a22b-instruct-2507")
GEMINI_MODEL = os.environ.get("GEMINI_MODEL", "gemini-2.0-flash-exp")

# retry logic
MAX_RETRIES = 4
BASE_DELAY = 3  # seconds

def call_llm(prompt, system_prompt):
    if os.environ.get("SYLON_DEBUG_MODE") == "True":
        return "DEBUG: This is a fast mock response for testing."
    
    return call_cerebras(prompt, system_prompt)

def call_cerebras_mode(mode, prompt, system_prompt="", max_tokens=500):
    if mode == "persona":
        temperature = 0.9
    elif mode == "simulator":
        temperature = 0.3
    elif mode == "strategist":
        temperature = 0.6
    else:
        temperature = 0.7

    return call_cerebras(
        prompt=prompt,
        system_prompt=system_prompt,
        temperature=temperature,
        max_tokens=max_tokens,
    )

def retry_with_backoff(func):
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        for attempt in range(1, MAX_RETRIES + 1):
            try:
                return func(*args, **kwargs)
            except Exception as e:
                err_msg = str(e).lower()
                is_rate_limit = (
                    "429" in err_msg
                    or ("resource" in err_msg and "exhausted" in err_msg)
                    or "rate" in err_msg
                )
                if is_rate_limit and attempt < MAX_RETRIES:
                    wait = BASE_DELAY * (2 ** (attempt - 1))
                    print(f"[LLM Retry] Rate-limited on {func.__name__}, attempt {attempt}/{MAX_RETRIES}. Waiting {wait}s...")
                    time.sleep(wait)
                else:
                    raise
    return wrapper

@retry_with_backoff
def call_cerebras(
    prompt: str,
    system_prompt: str = "",
    temperature: float = 0.7,
    max_tokens: int = 2000,
) -> str:
    if os.environ.get("SYLON_DEBUG_MODE") == "True":
        return f"DEBUG (Cerebras): Mock response for prompt: {prompt[:50]}."
        
    messages = []
    if system_prompt:
        messages.append({"role": "system", "content": system_prompt})
    messages.append({"role": "user", "content": prompt})

    try:
        response = cerebras_client.chat.completions.create(
            model=CEREBRAS_MODEL,
            messages=messages,
            temperature=temperature,
            max_completion_tokens=max_tokens,
        )
        return response.choices[0].message.content
    except Exception as e:
        err_msg = str(e).lower()
        if "quota" in err_msg or "429" in err_msg or "exhausted" in err_msg:
            print(f"[LLM] Cerebras Quota Exceeded. Falling back to Gemini...")
            gemini_prompt = f"{system_prompt}\n\n{prompt}" if system_prompt else prompt
            return call_gemini(prompt=gemini_prompt, json_mode=False)
        raise


@retry_with_backoff
def call_cerebras_json(
    prompt: str,
    system_prompt: str = "",
    temperature: float = 0.4,
    max_tokens: int = 4000,
) -> dict | list:
    messages = []
    if system_prompt:
        messages.append({"role": "system", "content": system_prompt})
    messages.append({"role": "user", "content": prompt})

    try:
        response = cerebras_client.chat.completions.create(
            model=CEREBRAS_MODEL,
            messages=messages,
            temperature=temperature,
            max_completion_tokens=max_tokens,
            response_format={"type": "json_object"},
        )
        raw = response.choices[0].message.content
    except Exception as e:
        err_msg = str(e).lower()
        if "quota" in err_msg or "429" in err_msg or "exhausted" in err_msg:
            print(f"[LLM] Cerebras Quota Exceeded. Falling back to Gemini...")
            gemini_prompt = f"{system_prompt}\n\n{prompt}\n\nYou MUST respond with strictly valid JSON." if system_prompt else f"{prompt}\n\nYou MUST respond with strictly valid JSON."
            raw = call_gemini(prompt=gemini_prompt, json_mode=True)
        else:
            raise

    # try direct parse
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        pass

    # try extracting from markdown fences
    import re
    match = re.search(r"```(?:json)?\s*\n?(.*?)\n?```", raw, re.DOTALL)
    if match:
        return json.loads(match.group(1))

    raise ValueError(f"Could not parse JSON from Cerebras response: {raw[:200]}")


# gemini
@retry_with_backoff
def call_gemini_structured(prompt: str, response_schema) -> str:
    # gemini's structured output.
    if os.environ.get("SYLON_DEBUG_MODE") == "True":
        return "CHAT"

    response = gemini_client.models.generate_content(
        model=GEMINI_MODEL,
        contents=prompt,
        config={
            "response_mime_type": "text/x.enum",
            "response_schema": response_schema,
        },
    )
    return response.text.strip()


@retry_with_backoff
def call_gemini(prompt: str, json_mode: bool = False) -> str:
    # alternative for cerebras
    config = {}
    if json_mode:
        config["response_mime_type"] = "application/json"

    response = gemini_client.models.generate_content(
        model=GEMINI_MODEL,
        contents=prompt,
        config=config if config else None,
    )
    return response.text
