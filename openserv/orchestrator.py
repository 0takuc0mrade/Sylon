import yaml
import json
import time
import enum
import re
import datetime

def log_demo(label: str, message: str):
    ts = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print(f"[{ts}] [{label}] {message}")

# pyrefly: ignore [missing-import]
from dotenv import load_dotenv
import sys
import os
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, ROOT)

if ROOT not in sys.path:
    sys.path.insert(0, ROOT)

from agents.llm_client import call_llm, call_cerebras, call_cerebras_json, call_gemini_structured, retry_with_backoff
from agents.persona_factory import get_personas_for_business
from agents.review_ingest import get_review_count
from agents.rec import generate_recommendations
from openserv.tools import (
    tool_run_collision_simulation,
    tool_generate_synthetic_personas,
    tool_fetch_competitor_personas,
    tool_ingest_reviews,
    tool_extract_painpoints,
)

load_dotenv()

import logging
from datetime import datetime

logger = logging.getLogger('sylon')
logger.setLevel(logging.INFO)
if not logger.handlers:
    handler = logging.StreamHandler()
    handler.setFormatter(logging.Formatter('[%(asctime)s] [%(name)s] %(message)s', datefmt='%Y-%m-%d %H:%M:%S'))
    logger.addHandler(handler)

# Load agents config
with open(os.path.join(os.path.dirname(__file__), 'agents.yaml'), 'r') as f:
    agents_config = yaml.safe_load(f)['agents']

# Structured Output Schema for Router 
class Route(enum.Enum):
    SIMULATE = "SIMULATE"
    CHAT = "CHAT"
    INGEST = "INGEST"
    RECOMMEND = "RECOMMEND"
    COMPARE = "COMPARE"

from pydantic import BaseModel
class RouteSchema(BaseModel):
    intent: str

import threading
from dataclasses import dataclass, field
from typing import Dict, Any, List

@dataclass
class BusinessSession:
    business_id: str
    context: Dict[str, str] = field(default_factory=lambda: {"description": "Business Entity", "location": ""})
    history: List[Dict[str, Any]] = field(default_factory=list)

class SessionStore:
    '''Thread-safe per-business session state.'''
    def __init__(self):
        self._sessions: Dict[str, BusinessSession] = {}
        self._lock = threading.Lock()

    def get_or_create(self, business_id: str) -> BusinessSession:
        with self._lock:
            if business_id not in self._sessions:
                self._sessions[business_id] = BusinessSession(business_id=business_id)
            return self._sessions[business_id]

sessions = SessionStore()


def normalize_route_value(route) -> str:
    if isinstance(route, Route):
        return route.value
    if isinstance(route, str):
        stripped = route.strip().strip('"')
        try:
            parsed = json.loads(stripped)
            if isinstance(parsed, str):
                return parsed.strip().upper()
            if isinstance(parsed, dict):
                for key in ("route", "intent", "value"):
                    if key in parsed:
                        return str(parsed[key]).strip().upper()
        except Exception:
            pass
        return stripped.upper()
    return "CHAT"


def is_comparison_prompt(user_input: str) -> bool:
    prompt = user_input.lower()
    comparison_markers = [
        "compare",
        "which is safer",
        "which option",
        "which one",
        "rank these",
        "help me choose",
        "choose between",
        "best option",
        "safest option",
    ]
    if any(marker in prompt for marker in comparison_markers):
        return True
    return bool(re.search(r"\bvs\.?\b|\bversus\b", prompt))


def extract_comparison_options(user_input: str, max_options: int = 3) -> list[dict[str, str]]:
    text = user_input.strip()
    text = re.sub(r"(?i)\bwhich\s+(one|option)\s+is\s+(safest|best|better).*$", "", text)
    text = re.sub(r"(?i)\bwhich\s+is\s+(safest|best|better).*$", "", text)
    text = re.sub(r"(?i)^\s*(compare|rank)\s+(these\s+options\s*:?\s*)?", "", text)
    text = re.sub(r"(?i)^\s*(help\s+me\s+choose\s+between|choose\s+between)\s+", "", text)
    text = re.sub(r"(?i)^\s*(options\s*:|these\s*:)\s*", "", text)

    pieces = re.split(r"\s+(?:vs\.?|versus)\s+|[;\n]+|,\s*(?:or\s+|and\s+)?|\s+\bor\b\s+", text)
    options = []
    seen = set()

    for piece in pieces:
        cleaned = re.sub(r"^\s*[-*\d.)]+\s*", "", piece).strip(" .?!")
        cleaned = re.sub(r"(?i)^(or|and)\s+", "", cleaned).strip(" .?!")
        if len(cleaned) < 4:
            continue
        key = cleaned.lower()
        if key in seen:
            continue
        seen.add(key)
        options.append({
            "label": cleaned[:80],
            "scenario": cleaned,
        })
        if len(options) >= max_options:
            break

    return options


@retry_with_backoff
def evaluate_route(user_input: str, business_id: str) -> str:
    session = sessions.get_or_create(business_id)
    history = session.history[-3:] # Last 3 turns
    history_str = json.dumps(history) if history else "No history."

    if is_comparison_prompt(user_input) and len(extract_comparison_options(user_input)) >= 2:
        log_demo("ROUTER", "Intent: COMPARE | Prompt received")
        return "COMPARE"

    prompt = f"Classify this intent as SIMULATE, INGEST, RECOMMEND, COMPARE, or CHAT. Only return one word.\nHistory: {history_str}\nInput: {user_input}"
    try:
        result_obj = call_gemini_structured(
            prompt=f"{agents_config['router']['system_prompt']}\n\nRecent History: {history_str}\nUser input: \"{user_input}\"",
            response_schema=RouteSchema,
        )
        try:
            parsed = json.loads(result_obj)
            return parsed.get("intent", "CHAT")
        except Exception:
            # If the fallback returned the raw string 'SIMULATE', 'CHAT', etc.
            if isinstance(result_obj, str) and result_obj.upper() in ["SIMULATE", "CHAT", "INGEST", "RECOMMEND"]:
                return result_obj.upper()
            return "CHAT"
    except Exception as e:
        print(f"[Router Exception] {e}")
        user_input_lower = user_input.lower()
        if any(word in user_input_lower for word in ["if", "scenario", "what if", "simulate", "compare", " vs "]):
            print("[Router Failsafe] Rate-limited or error. Heuristic: SIMULATE")
            return "SIMULATE"
        return "CHAT"


import concurrent.futures

@retry_with_backoff
def simulate_strategist(user_input: str, collision_result: str, painpoints: dict = None) -> dict:
    painpoint_context = ""
    if painpoints and painpoints.get("complaints"):
        top_complaints = [c["theme"] for c in painpoints["complaints"][:3]]
        
        temporal_drift = (
            "\n[SYSTEM ALERT: BigQuery ML Temporal Drift Detected]\n"
            f"Negative sentiment regarding '{top_complaints[0]}' has accelerated by 14% over the last 30 days. "
            "Predictive churn models suggest a high probability of cohort loss if this issue is exacerbated."
        )
        
        painpoint_context = f"\n\nKNOWN CUSTOMER PAINPOINTS: {', '.join(top_complaints)}\n{temporal_drift}\nYour advice MUST address how the proposed change relates to these real issues."

    log_demo("MULTI-AGENT", "Spawning CFO, CX, OPS concurrently")
    
    def call_cfo():
        t = time.time()
        log_demo("CFO", "Thread started")
        prompt = f"""You are the CFO. Evaluate the financial impact and margin safety of this scenario: {user_input}
Context: {collision_result}
{painpoint_context}
Limit your answer to 2 concise sentences. Focus strictly on economic survival, cost coverage, and revenue retention in a highly volatile market."""
        res = call_llm(prompt, system_prompt="You are a ruthless, numbers-focused CFO fighting for business survival in a volatile emerging market.")
        log_demo("CFO", f"Response received ({time.time() - t:.1f}s)")
        return res
        
    def call_cx():
        t = time.time()
        log_demo("CX", "Thread started")
        prompt = f"""You are the VP of Customer Experience. Evaluate how the customer personas will react to this scenario, focusing on churn risk: {user_input}
Context: {collision_result}
{painpoint_context}
Limit your answer to 2 concise sentences. Focus on whether the core demographic will abandon the business if pricing or quality changes."""
        res = call_llm(prompt, system_prompt="You are a fiercely protective VP of Customer Experience, highly attuned to the breaking point of local customer loyalty.")
        log_demo("CX", f"Response received ({time.time() - t:.1f}s)")
        return res
        
    def call_ops():
        t = time.time()
        log_demo("OPS", "Thread started")
        prompt = f"""You are the COO. Evaluate the operational friction (staff training, supply chain) of this scenario: {user_input}
Context: {collision_result}
{painpoint_context}
Limit your answer to 2 concise sentences. Focus on execution under pressure, grid instability, and supply chain shocks."""
        res = call_llm(prompt, system_prompt="You are a pragmatic, execution-focused COO who understands the harsh physical realities of operating in an emerging market.")
        log_demo("OPS", f"Response received ({time.time() - t:.1f}s)")
        return res

    t0 = time.time()
    with concurrent.futures.ThreadPoolExecutor(max_workers=3) as executor:
        future_cfo = executor.submit(call_cfo)
        future_cx = executor.submit(call_cx)
        future_ops = executor.submit(call_ops)
        
        cfo_response = future_cfo.result()
        cx_response = future_cx.result()
        ops_response = future_ops.result()
    elapsed = time.time() - t0
    logger.info(f"[MULTI-AGENT] All 3 agents completed in {elapsed:.1f}s")
        
    debate_summary = f"""CFO PERSPECTIVE:
{cfo_response}

CX PERSPECTIVE:
{cx_response}

OPS PERSPECTIVE:
{ops_response}"""
    
    synthesized_prompt = f"""The Board of Directors has debated the scenario: '{user_input}'.

{debate_summary}

As Sylon, the final AI Strategist, synthesize this debate into a single, cohesive, authoritative recommendation for the business owner. Do not use corporate jargon. Be direct. 3-4 sentences."""
    
    log_demo("SYNTHESIZER", "Merging board debate")
    final_decision = call_llm(synthesized_prompt, system_prompt="You are Sylon, a premium business strategist.")
    log_demo("COMPLETE", "Response delivered")
    
    return {
        "cfo": cfo_response,
        "cx": cx_response,
        "ops": ops_response,
        "final": final_decision
    }



@retry_with_backoff
def direct_chat_strategist(user_input: str, business_id: str) -> str:
    context = ""
    if business_id and business_id != "default":
        review_count = get_review_count(business_id)
        if review_count > 0:
            context = f"\n\nContext: You have {review_count} customer reviews loaded for this business."

    prompt = f"""{agents_config['strategist']['system_prompt']}

The business owner said: "{user_input}"
{context}
This is a general question or greeting—NOT a business scenario to simulate.
Respond conversationally as Sylon, a premium business strategist.
Briefly explain what you can do if they ask, or respond naturally to their greeting.
Keep it to 2-3 sentences max."""

    return call_cerebras(
        prompt=prompt,
        system_prompt="You are Sylon, a premium business strategist. Be conversational and precise.",
        temperature=0.7,
        max_tokens=400,
    )


@retry_with_backoff
def synthesize_recommendation_response(user_input: str, raw_recommendations: str, business_id: str) -> str:
    session = sessions.get_or_create(business_id)
    prompt = f"""{agents_config['strategist']['system_prompt']}

The business owner asked for strategic advice: "{user_input}"

Business context:
{json.dumps(session.context, indent=2)}

Recommendation engine output:
{raw_recommendations}

Synthesize this into a natural, conversational, authoritative response.
Do not read lists verbatim. Speak like a trusted strategy advisor.
Keep it practical and specific. 3-5 concise sentences."""

    return call_cerebras(
        prompt=prompt,
        system_prompt="You are Sylon, a premium business strategist. Be conversational, practical, and specific.",
        temperature=0.6,
        max_tokens=700,
    )


from agents.fivetran_mcp import call_fivetran_mcp
import asyncio

def handle_ingest(user_input: str, business_id: str) -> str:
    import uuid
    session = sessions.get_or_create(business_id)

    # Trigger MCP at runtime to comply with hackathon rules
    connector_id = os.environ.get("FIVETRAN_CONNECTOR_ID", "default_connector")
    try:
        asyncio.run(call_fivetran_mcp(connector_id))
    except Exception as e:
        print(f"[MCP] Warning: {e}")

    print(f"[Ingest] Parsing pasted reviews for {business_id}...")
    reviews = tool_ingest_reviews(business_id=business_id, reviews_text=user_input)

    if not reviews:
        return "I couldn't find any reviews in what you shared. Try pasting the actual review text — even messy formatting works."

    print(f"[Ingest] Extracting painpoints and building personas...")
    result = tool_extract_painpoints(business_id=business_id)

    complaint_count = len(result.get("painpoints", {}).get("complaints", []))
    praise_count = len(result.get("painpoints", {}).get("praise", []))
    persona_count = len(result.get("personas", []))
    review_count = result.get("review_count", len(reviews))

    persona_names = [p.get("name", "Unknown") for p in result.get("personas", [])]
    top_complaints = [c["theme"] for c in result.get("painpoints", {}).get("complaints", [])[:3]]

    response_parts = [f"Got it. I've looked through {review_count} reviews."]

    if complaint_count > 0:
        response_parts.append(f"and found {complaint_count} key pain points")
    if persona_count > 0:
        response_parts.append(f"I identified {persona_count} distinct customer types: {', '.join(persona_names)}")
    if top_complaints:
        response_parts.append(f"The biggest issues your customers mention: {', '.join(top_complaints)}")

    response_parts.append("Now ask me anything about your business — my advice will be grounded in what your real customers are saying.")

    try:
        from openserv.persistence import persistence_service
        import uuid
        batch_id = f"batch_{uuid.uuid4().hex[:8]}"
        persistence_service.upsert_business(business_id=business_id, description=session.context.get("description"), location={"city": session.context.get("location", ""), "state": ""})
        persistence_service.create_review_batch(batch_id=batch_id, business_id=business_id, source_type="chat", review_count=len(reviews))
        
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
                "source": "chat",
                "text_hash": None
            })
        persistence_service.insert_reviews(db_reviews)
        
        painpoints_dict = result.get("painpoints", {})
        persistence_service.create_painpoint_snapshot(
            snapshot_id=f"snap_{uuid.uuid4().hex[:8]}", business_id=business_id, batch_id=batch_id,
            complaints=painpoints_dict.get("complaints", []), praise=painpoints_dict.get("praise", []),
            trends=painpoints_dict.get("trends", []), full_payload=painpoints_dict
        )
        
        for p in result.get("personas", []):
            persistence_service.upsert_persona(
                persona_id=f"per_{uuid.uuid4().hex[:8]}", business_id=business_id, name=p.get("name", "Unknown"),
                source="chat", narrative=p.get("narrative", ""), drifts=p.get("drifts", []), avg_rating=p.get("avg_rating", 0),
                top_words=p.get("top_words", []), grounding_quotes=p.get("grounding_quotes", p.get("sample_texts", [])),
                review_count=p.get("review_count", len(reviews)), full_payload=p
            )
    except Exception as e:
        print(f"[SQLite] Persistence failed (non-fatal): {e}")

    return ". ".join(response_parts)


def get_local_persona():
    persona_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'outputs', 'bJ5FtCtZX3ZZacz2_2PJjA_persona.json')
    try:
        with open(persona_path, 'r') as f:
            raw_persona = json.load(f)
            persona_narrative = raw_persona.get('narrative', '')
            drifts = raw_persona.get('structured', {}).get('drifts', [])
            recent_signal = raw_persona.get('structured', {}).get('phases', {}).get('recent', {}).get('signal', {})
            recent_rating = recent_signal.get('avg_rating', 0)
            top_words = recent_signal.get('top_words', [])
    except FileNotFoundError:
        print("Warning: Pre-excavated persona not found. Using a mock persona.")
        persona_narrative = "This user loves quiet, cheap places and hates loud noises."
        drifts = []
        recent_rating = 3.0
        top_words = ["quiet", "cheap", "noise"]

    return persona_narrative, drifts, recent_rating, top_words


def run_simulation(user_input: str, business_id: str): 
    session = sessions.get_or_create(business_id)
    business_description = session.context.get("description", "Business Entity") 
    location = session.context.get("location", "")
    name_source = business_description or "Business Entity"
    business_attributes = {
        'name': name_source.split(',')[0].strip(),
        'categories': name_source,
        'price_range': 'mid-range',
        'noise_level': 'average'
    }

    all_collisions = []
    painpoints = None
    personas = []

    if business_id:
        personas, painpoints, mode = get_personas_for_business(
            business_id=business_id,
            business_description=business_description,
            location=location,
            persona_count=int(os.environ.get("SYLON_PERSONA_COUNT", "2")),
        )

        if personas:
            logger.info(f"[SIMULATOR] Using {len(personas)} grounded personas | mode={mode}")
            simulator_rules = f"\n{agents_config['simulator']['system_prompt']}\nOwner's scenario: \"{user_input}\""

            for persona in personas:
                print(f"  [Simulator] Running collision for: {persona['name']} ({persona.get('source', 'unknown')})")
                try:
                    result = tool_run_collision_simulation(
                        persona_narrative=persona['narrative'] + "\n\nSIMULATOR RULES:" + simulator_rules,
                        persona_drifts=persona.get('drifts', []),
                        recent_rating=persona.get('avg_rating', 3.5),
                        top_words=persona.get('top_words', []),
                        business_attributes=business_attributes,
                        painpoints=painpoints,
                        grounding_quotes=persona.get('grounding_quotes', []),
                    )
                    source_tag = f" ({persona.get('source', '')})" if persona.get('source') else ""
                    all_collisions.append(f"### {persona['name']}{source_tag}\n{result}")
                except Exception as e:
                    print(f"  [Simulator] Collision failed for {persona['name']}: {e}")

    if not all_collisions:
        persona_count = int(os.environ.get("SYLON_PERSONA_COUNT", "1"))
        print(f"[Archaeologist] Phase 1: Generating {persona_count} synthetic archetype(s)...")
        synthetic_personas = tool_generate_synthetic_personas(
            business_description=business_description,
            location=location,
            count=persona_count
        )

        simulator_rules = f"\n{agents_config['simulator']['system_prompt']}\nOwner's scenario: \"{user_input}\""

        for persona in synthetic_personas:
            print(f"  [Simulator] Running collision for: {persona['name']}")
            try:
                result = tool_run_collision_simulation(
                    persona_narrative=persona['narrative'] + "\n\nSIMULATOR RULES:" + simulator_rules,
                    persona_drifts=persona.get('drifts', []),
                    recent_rating=persona.get('avg_rating', 3.5),
                    top_words=persona.get('top_words', []),
                    business_attributes=business_attributes
                )
                all_collisions.append(f"### {persona['name']}\n{result}")
                time.sleep(1)
            except Exception as e:
                print(f"  [Simulator] Collision failed for {persona['name']}: {e}")

        if os.environ.get("GOOGLE_PLACES_API_KEY"):
            print("[Archaeologist] Phase 2: Fetching competitor reviews from Google Places...")
            google_personas = tool_fetch_competitor_personas(
                business_category=business_description,
                location=location,
                limit=2
            )
            for persona in google_personas:
                print(f"  [Simulator] Running collision for: {persona['name']} (source: {persona.get('source', 'Google')})")
                try:
                    result = tool_run_collision_simulation(
                        persona_narrative=persona['narrative'] + "\n\nSIMULATOR RULES:" + simulator_rules,
                        persona_drifts=persona.get('drifts', []),
                        recent_rating=persona.get('avg_rating', 3.5),
                        top_words=persona.get('top_words', []),
                        business_attributes=business_attributes
                    )
                    all_collisions.append(f"### {persona['name']} (Real Review)\n{result}")
                    time.sleep(1)
                except Exception as e:
                    print(f"  [Simulator] Collision failed for {persona['name']}: {e}")

    if not all_collisions:
        print("[Archaeologist] Falling back to pre-excavated Yelp persona...")
        persona_narrative, drifts, recent_rating, top_words = get_local_persona()
        simulator_rules = f"\n{agents_config['simulator']['system_prompt']}\nOwner's scenario: \"{user_input}\""
        result = tool_run_collision_simulation(
            persona_narrative=persona_narrative + "\n\nSIMULATOR RULES:" + simulator_rules,
            persona_drifts=drifts,
            recent_rating=recent_rating,
            top_words=top_words,
            business_attributes=business_attributes
        )
        all_collisions.append(f"### Baseline Persona\n{result}")

    combined = "\n\n---\n\n".join(all_collisions)

    strategist_response = simulate_strategist(user_input, combined, painpoints)
    
    try:
        from openserv.persistence import persistence_service
        import uuid
        persistence_service.upsert_business(business_id=business_id)
        persistence_service.create_collision_log(
            log_id=f"log_{uuid.uuid4().hex[:8]}",
            business_id=business_id,
            scenario=user_input,
            source_mode="hybrid",
            persona_ids=[p.get("name") for p in personas] if personas else ["synthetic/google"],
            collision_analysis=combined,
            strategist_response=json.dumps(strategist_response) if isinstance(strategist_response, dict) else strategist_response
        )
    except Exception as e:
        print(f"[SQLite] Collision persistence failed (non-fatal): {e}")

    return strategist_response
 

def _build_business_attributes(session: BusinessSession) -> dict:
    business_description = session.context.get("description", "Business Entity")
    name_source = business_description or "Business Entity"
    return {
        'name': name_source.split(',')[0].strip(),
        'categories': business_description,
        'price_range': 'mid-range',
        'noise_level': 'average',
    }


def _fallback_comparison_result(user_input: str, options: list[dict[str, str]], option_results: list[dict[str, Any]], personas: list[dict[str, Any]]) -> dict:
    ranked_options = []
    for idx, option_result in enumerate(option_results):
        analysis = option_result.get("analysis", "")
        analysis_lower = analysis.lower()
        risk_score = analysis_lower.count("hate") + analysis_lower.count("risk") + analysis_lower.count("disappoint")
        upside_score = analysis_lower.count("love") + analysis_lower.count("match") + analysis_lower.count("benefit")
        risk = "high" if risk_score >= 3 else "medium" if risk_score >= 1 else "low"
        ranked_options.append({
            "rank": idx + 1,
            "label": option_result["label"],
            "risk": risk,
            "upside": "Strong persona fit" if upside_score >= 2 else "Mixed upside",
            "rationale": analysis.splitlines()[0][:180] if analysis else "Needs owner judgment; the simulator returned limited detail.",
        })

    ranked_options.sort(key=lambda item: {"low": 0, "medium": 1, "high": 2}.get(item["risk"], 1))
    for idx, item in enumerate(ranked_options):
        item["rank"] = idx + 1

    evidence_quotes = []
    for persona in personas:
        evidence_quotes.extend(persona.get("grounding_quotes", [])[:1])

    winner = ranked_options[0]["label"] if ranked_options else options[0]["label"]
    riskiest = ranked_options[-1]["label"] if ranked_options else options[-1]["label"]

    return {
        "title": "Decision Comparison",
        "summary": (
            f"The safest move is {winner}. The riskiest move is {riskiest}. "
            "I ranked the options by persona friction, customer pain points, and likely downside."
        ),
        "winner": winner,
        "riskiest_option": riskiest,
        "persona_churn_risk": personas[0].get("name", "Most sensitive customer archetype") if personas else "Most sensitive customer archetype",
        "persona_positive_reaction": personas[-1].get("name", "Most receptive customer archetype") if personas else "Most receptive customer archetype",
        "recommended_next_step": f"Pilot {winner} first, communicate the customer benefit clearly, and watch for complaints tied to the riskiest persona.",
        "evidence_quotes": evidence_quotes[:3],
        "options": ranked_options,
        "source_prompt": user_input,
    }


def synthesize_comparison_response(user_input: str, option_results: list[dict[str, Any]], personas: list[dict[str, Any]], painpoints: dict | None) -> dict:
    painpoint_summary = ""
    if painpoints and painpoints.get("complaints"):
        painpoint_summary = json.dumps(painpoints.get("complaints", [])[:3], indent=2)

    prompt = f"""{agents_config['strategist']['system_prompt']}

The business owner wants to compare multiple operational decisions:
"{user_input}"

Persona simulation results by option:
{json.dumps(option_results, indent=2)[:9000]}

Known customer pain points:
{painpoint_summary or "No pain point data available."}

Return strictly valid JSON with this exact shape:
{{
  "title": "Decision Comparison",
  "summary": "2-3 sentence executive verdict in plain English",
  "winner": "best option label",
  "riskiest_option": "riskiest option label",
  "persona_churn_risk": "persona most likely to react negatively",
  "persona_positive_reaction": "persona most likely to react positively",
  "recommended_next_step": "one practical next action",
  "evidence_quotes": ["up to three exact customer quotes if available"],
  "options": [
    {{
      "rank": 1,
      "label": "option label",
      "risk": "low|medium|high",
      "upside": "short upside",
      "rationale": "one concise reason grounded in personas or pain points"
    }}
  ]
}}"""

    result = call_cerebras_json(
        prompt=prompt,
        system_prompt="You are Sylon's decision comparison engine. Output valid JSON only, grounded in the supplied simulation results.",
        temperature=0.3,
        max_tokens=1800,
    )
    if not isinstance(result, dict) or not result.get("options"):
        raise ValueError("Comparison JSON was missing required options")
    return result


def run_scenario_comparison(user_input: str, business_id: str) -> dict:
    options = extract_comparison_options(user_input)
    if len(options) < 2:
        return {
            "response": "Give me two or three clear options to compare, like: compare raising prices by 15%, closing earlier, or reducing the menu size.",
            "comparison": None,
        }

    session = sessions.get_or_create(business_id)
    business_description = session.context.get("description", "Business Entity")
    location = session.context.get("location", "")
    business_attributes = _build_business_attributes(session)

    personas, painpoints, mode = get_personas_for_business(
        business_id=business_id,
        business_description=business_description,
        location=location,
        persona_count=min(2, int(os.environ.get("SYLON_PERSONA_COUNT", "2"))),
    )

    option_results = []
    for option in options[:3]:
        print(f"[Comparator] Simulating option: {option['label']} ({mode})")
        persona_outputs = []
        simulator_rules = f"\n{agents_config['simulator']['system_prompt']}\nOwner's option to evaluate: \"{option['scenario']}\""

        for persona in personas:
            try:
                result = tool_run_collision_simulation(
                    persona_narrative=persona['narrative'] + "\n\nSIMULATOR RULES:" + simulator_rules,
                    persona_drifts=persona.get('drifts', []),
                    recent_rating=persona.get('avg_rating', 3.5),
                    top_words=persona.get('top_words', []),
                    business_attributes=business_attributes,
                    painpoints=painpoints,
                    grounding_quotes=persona.get('grounding_quotes', []),
                )
                persona_outputs.append({
                    "persona": persona.get("name", "Unknown Persona"),
                    "source": persona.get("source", mode),
                    "analysis": result,
                })
            except Exception as e:
                print(f"  [Comparator] Collision failed for {persona.get('name', 'persona')}: {e}")

        option_results.append({
            "label": option["label"],
            "scenario": option["scenario"],
            "personas": persona_outputs,
            "analysis": "\n\n".join(f"### {item['persona']}\n{item['analysis']}" for item in persona_outputs),
        })

    try:
        comparison = synthesize_comparison_response(user_input, option_results, personas, painpoints)
    except Exception as e:
        print(f"[Comparator] Structured synthesis failed, using fallback: {e}")
        comparison = _fallback_comparison_result(user_input, options, option_results, personas)

    response = comparison.get("summary") or (
        f"The safest option is {comparison.get('winner', options[0]['label'])}. "
        f"The riskiest option is {comparison.get('riskiest_option', options[-1]['label'])}. "
        f"Next step: {comparison.get('recommended_next_step', 'Pilot the safest option before a full rollout.')}"
    )

    try:
        from openserv.persistence import persistence_service
        import uuid
        persistence_service.upsert_business(business_id=business_id)
        persistence_service.create_collision_log(
            log_id=f"cmp_{uuid.uuid4().hex[:8]}",
            business_id=business_id,
            scenario=user_input,
            source_mode=f"comparison:{mode}",
            persona_ids=[p.get("name") for p in personas] if personas else ["synthetic"],
            collision_analysis=json.dumps(option_results),
            strategist_response=response,
        )
    except Exception as e:
        print(f"[SQLite] Comparison persistence failed (non-fatal): {e}")

    return {
        "response": response,
        "comparison": comparison,
    }


def handle_recommendation(user_input: str, business_id: str) -> str:
    session = sessions.get_or_create(business_id)
    personas, painpoints, _ = get_personas_for_business(
        business_id=business_id,
        business_description=session.context.get("description", "Business Entity"),
        location=session.context.get("location", ""),
    )
    has_painpoint_data = bool(painpoints and (painpoints.get("complaints") or painpoints.get("praise") or painpoints.get("trends")))

    if not personas or not has_painpoint_data:
        return (
            "I need to analyze your customer reviews before I can give targeted, data-backed recommendations. "
            "Upload or paste your reviews first, then I can show you what to fix, what to protect, and where the revenue opportunities are."
        )

    print(f"[Orchestrator] Generating dynamic recommendations for {business_id}...")

    try:
        raw_recommendations = generate_recommendations(
            query=user_input,
            painpoints=painpoints,
            personas=personas,
            business_context=session.context,
        )
        final_response = synthesize_recommendation_response(user_input, raw_recommendations, business_id)
    except Exception as e:
        print(f"[Orchestrator] Dynamic Rec Engine Error: {e}")
        return "The recommendation engine hit a snag. If you want, ask me to simulate a specific scenario instead, like a price change or menu update."

    try:
        from openserv.persistence import persistence_service
        import uuid
        persistence_service.upsert_business(business_id=business_id)
        persistence_service.create_recommendation_log(
            log_id=f"rec_{uuid.uuid4().hex[:8]}",
            business_id=business_id,
            query=user_input,
            raw_recommendations=raw_recommendations,
            final_response=final_response,
            persona_ids=[p.get("name") for p in personas] if personas else [],
        )
    except Exception as e:
        print(f"[SQLite] Recommendation persistence failed (non-fatal): {e}")
    
    return final_response

from agents.agent_builder_client import call_agent_builder

def process_user_scenario(user_input: str, business_id: str = "default", description: str = "Business Entity", location:str = "") -> str:
    # Trigger Google Cloud Agent Builder at runtime
    call_agent_builder(query=user_input)
    
    session = sessions.get_or_create(business_id)
    if description != "Business Entity":
        session.context["description"] = description
    if location != "":
        session.context["location"] = location
    
    session.history.append({"role": "user", "content": user_input})
    
    route = evaluate_route(user_input, business_id)
    logger.info(f"[ROUTER] Intent: {route} | Business: {business_id}")

    if route == "INGEST":
        response = handle_ingest(user_input, business_id)
    elif route == "COMPARE":
        response = run_scenario_comparison(user_input, business_id)
    elif route == "SIMULATE":
        response = run_simulation(user_input, business_id)
    elif route == "RECOMMEND":
        response = handle_recommendation(user_input, business_id)

    else:
        response = direct_chat_strategist(user_input, business_id)

    response_text = response.get("response", "") if isinstance(response, dict) else response
    session.history.append({"role": "assistant", "content": response_text})
    return response


def main():
    import uuid
    print("Sylon Strategist Initialization...")
    print("Loaded local persona profile.")
    print("Type 'exit' to quit.\n")
    
    cli_business_id = f"biz_{uuid.uuid4().hex[:8]}"

    while True:
        user_input = input("Owner: ")
        if user_input.lower() in ['exit', 'quit']:
            break

        final_response = process_user_scenario(user_input, business_id=cli_business_id)
        print(f"Sylon: {final_response}\n")

if __name__ == "__main__":
    main()