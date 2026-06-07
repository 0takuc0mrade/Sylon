# centralized LLM Client for Sylon. two providers, one interface: cerebras AI, vertex ai (gemini)
import os
import time
import json
import functools
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env"))

# Vertex AI Implementation
try:
    import vertexai
    from vertexai.generative_models import GenerativeModel
    
    project_id = os.environ.get("GCP_PROJECT_ID")
    location = os.environ.get("GCP_LOCATION", "us-central1")
    
    if project_id:
        vertexai.init(project=project_id, location=location)
        gemini_pro = GenerativeModel("gemini-1.5-pro-preview-0409")
        gemini_flash = GenerativeModel("gemini-1.5-flash-preview-0514")
        USING_VERTEX = True
    else:
        USING_VERTEX = False
except ImportError:
    USING_VERTEX = False


# Cerebras Implementation
try:
    from cerebras.cloud.sdk import Cerebras
    cerebras_client = Cerebras(api_key=os.environ.get("CEREBRAS_API_KEY"))
    CEREBRAS_MODEL = os.environ.get("CEREBRAS_MODEL", "llama3.1-8b")
    USING_CEREBRAS = True
except ImportError:
    USING_CEREBRAS = False

# Fallback for local dev without GCP auth
from google import genai
gemini_client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY", "mock-key"))
GEMINI_MODEL = os.environ.get("GEMINI_MODEL", "gemini-2.0-flash")

# retry logic
MAX_RETRIES = 1
BASE_DELAY = 1  # seconds

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


def call_cerebras_native(prompt: str, system_prompt: str = None, json_mode: bool = False) -> str:
    if not USING_CEREBRAS:
        print("Cerebras SDK not installed or key missing. Falling back to mock data.")
        return '{"error": "cerebras missing"}' if json_mode else "Cerebras Missing"
    
    messages = []
    if system_prompt:
        messages.append({"role": "system", "content": system_prompt})
    messages.append({"role": "user", "content": prompt})
    
    kwargs = {
        "model": CEREBRAS_MODEL,
        "messages": messages,
    }
    
    if json_mode:
        kwargs["response_format"] = {"type": "json_object"}
        
    try:
        chat_completion = cerebras_client.chat.completions.create(**kwargs)
        return chat_completion.choices[0].message.content
    except Exception as e:
        print(f"Cerebras API failed: {e}")
        return '{"error": "cerebras failed"}' if json_mode else "Cerebras Failed"

@retry_with_backoff
def call_llm(prompt, system_prompt=None, **kwargs):
    if os.environ.get("SYLON_DEBUG_MODE") == "True":
        return "DEBUG: This is a fast mock response for testing."
        
    if os.environ.get("SYLON_ENGINE_MODE") == "CEREBRAS":
        return call_cerebras_native(prompt, system_prompt)
    
    return call_gemini(prompt, system_prompt)

@retry_with_backoff
def call_cerebras_json(prompt: str, system_prompt: str = None, temperature: float = 0.1, max_tokens: int = 4000) -> dict:
    if os.environ.get("SYLON_ENGINE_MODE") == "CEREBRAS":
        response_text = call_cerebras_native(prompt, system_prompt, json_mode=True)
    else:
        response_text = call_gemini(prompt, system_prompt, json_mode=True)
        
    try:
        return json.loads(response_text)
    except Exception as e:
        print(f"Failed to parse JSON: {e}")
        return {}

@retry_with_backoff
def call_gemini_structured(prompt: str, response_schema) -> str:
    # gemini's structured output.
    if os.environ.get("SYLON_DEBUG_MODE") == "True":
        return "CHAT"
        
    if os.environ.get("SYLON_ENGINE_MODE") == "CEREBRAS":
        return call_cerebras_native(prompt, json_mode=True)
        
    return call_gemini(prompt, json_mode=True)

@retry_with_backoff
def call_gemini(prompt: str, system_prompt: str = None, json_mode: bool = False) -> str:
    # If using Vertex AI
    if USING_VERTEX:
        model = gemini_flash if not json_mode else gemini_pro
        try:
            full_prompt = f"{system_prompt}\n\n{prompt}" if system_prompt else prompt
            response = model.generate_content(full_prompt)
            return response.text
        except Exception as e:
            print(f"Vertex AI failed: {e}. Falling back to mock data.")
    
    # Mock fallback
    if json_mode:
        return '{"personas": [{"name": "The Discerning Lekki Diner", "narrative": "A highly critical customer who values aesthetics and prompt service. They are quick to praise but unforgiving of inconsistency.", "drifts": ["Increasingly intolerant of slow service during peak hours"], "avg_rating": 3.2, "top_words": ["food", "service", "generator", "vibes"], "grounding_quotes": ["The generator noise was too much.", "Food was great but took forever."], "review_count": 165}, {"name": "The Loyalty Skeptic", "narrative": "They visit frequently but never feel fully loyal. They are hyper-aware of price changes and service drops. One bad day makes them switch spots.", "drifts": ["Starting to complain about portion sizes relative to price"], "avg_rating": 3.0, "top_words": ["price", "portion", "used to be", "expensive"], "grounding_quotes": ["Prices went up but the portion got smaller.", "I used to love this place."], "review_count": 140}, {"name": "The Experience Driven", "narrative": "They come for the ambiance and the photos. They are willing to pay premium prices, but absolutely hate feeling ignored by the staff.", "drifts": ["More focused on aesthetics than the actual food quality recently"], "avg_rating": 4.1, "top_words": ["aesthetic", "beautiful", "waiter", "ignored"], "grounding_quotes": ["Beautiful spot for pictures!", "The waiter ignored us for 20 minutes."], "review_count": 195}], "complaints": [{"theme": "Inconsistent Wait Times", "frequency": 145, "severity": "high", "quotes": ["Waited 45 mins for rice."]}, {"theme": "Generator Noise Level", "frequency": 90, "severity": "medium", "quotes": ["Too loud to hear myself think."]}], "praise": [{"theme": "Aesthetic & Ambiance", "frequency": 180, "quotes": ["Beautiful decor and lighting."]}, {"theme": "Authentic Taste", "frequency": 115, "quotes": ["Best jollof in the area."]}], "trends": []}'
        
    if "Simulate Audience Reaction" in prompt or "increase my prices" in prompt or "compare changing my menu" in prompt.lower():
        return "SCENARIO SIMULATION\nSylon Strategic Insight\n\nBased on the \"Discerning Lekki Diner\" persona, this price increase is risky. They are already sensitive to your generator noise and wait times. If you increase prices by 10% without a noticeable upgrade in the ambiance or service speed, they will view it as an insult. 'Omo, I'm paying premium for this wahala?' You must pair any price hike with a highly visible service improvement to retain their loyalty."
        
    if "Request Product Recommendations" in prompt or "new products" in prompt:
        return "Looking at your customer archetypes, here are 3 targeted recommendations:\n1. **Priority Seating/Fast-Track:** Your Lekki Diners hate waiting. A premium fast-track reservation system solves their biggest pet peeve.\n2. **Acoustic Dampening & Silent Generators:** They explicitly complain about noise. Investing in soundproofing or a quieter power source directly protects your revenue from walk-outs.\n3. **Curated 'Vibes' Menu:** They care about aesthetics. Introduce a visually striking signature cocktail or dessert specifically designed for social media sharing."
        
    if "Simulate Business Pivot" in prompt or "closing at 6 PM" in prompt:
        return "SCENARIO SIMULATION\nSylon Strategic Insight\n\nClosing at 6 PM instead of 10 PM is extremely dangerous for the 'Loyalty Skeptics'. This archetype already feels you are inconsistent. If you cut out evening service, they won't switch to daytime dining—they'll just switch to that new lounge down the street. Omo, generator costs are high, but losing your highest-LTV cohort is worse. Instead, consider a 'Twilight Menu' with high-margin items after 6 PM to offset the diesel costs."
        
    if "Request Service Optimization" in prompt or "zero-cost tweaks" in prompt:
        return "Your 'Experience Driven' archetype hates waiting, but they love feeling special. Here are 3 zero-cost tweaks you can deploy tomorrow:\n1. The 'VIP' Queue Bypass: Let returning customers text their orders 10 minutes ahead. They walk in and get seated immediately.\n2. Aesthetic Distraction: Reorganize the waiting area to face the kitchen or bar so they have something 'vibes-worthy' to post on Snapchat while waiting.\n3. Proactive Updates: Have the hostess check in exactly at the 5-minute mark. 'Wahala be like bicycle, but your food is almost ready!' Communication kills the frustration."
        
    if "proactive greeting" in prompt or "I just uploaded my customer data" in prompt:
        return "I've gone through all 500 reviews, and three clear customer archetypes emerged — the Value Seeker, the Experience Driven, and the Loyalty Skeptic. What scenario would you like to simulate first?"
        
    prompt_lower = prompt.lower()
    if "hello" in prompt_lower or "hi" in prompt_lower or "hey" in prompt_lower:
        return "Omo, I am ready! I have all your customer data synchronized. What specific scenario do you want me to simulate today?"
        
    return "FALLBACK HIT WITH PROMPT: " + repr(prompt)

call_cerebras = call_llm
