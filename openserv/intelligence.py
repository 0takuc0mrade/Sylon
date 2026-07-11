import json
import logging
from datetime import datetime

from openserv.persistence import persistence_service
try:
    from agents.llm_client import call_llm_json
except ImportError:
    import sys, os
    sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
    from agents.llm_client import call_llm_json

logger = logging.getLogger('morlen.intelligence')

def generate_executive_brief(business_id: str) -> dict:
    """
    The True Decision Engine.
    Pulls raw memories from the database, feeds them into the LLM, and extracts dynamic insights.
    """
    logger.info(f"[Intelligence Engine] Generating brief for {business_id}...")
    
    # 1. Fetch Business Profile
    profile = persistence_service.get_business_profile(business_id)
    business_name = profile.get("name", "Unknown Business") if profile else "Unknown Business"
    
    # 2. Fetch Raw Chat Logs (Memories)
    # We fetch up to 100 recent memories to provide sufficient context.
    memories = persistence_service.get_recent_memories(business_id, limit=100)
    
    if not memories or len(memories) < 3:
        # Not enough data to generate a meaningful brief
        return {
            "opportunities": [],
            "warnings": [
                {
                    "type": "Insufficient Data",
                    "title": "Awaiting More Customer Signals",
                    "description": "Morlen needs more customer conversations to generate reliable revenue forecasts."
                }
            ],
            "timeline": {
                "product": "Waiting for data...",
                "events": []
            }
        }

    # 3. Format the Context for the LLM
    context_lines = []
    for m in reversed(memories):
        # Clean up the text to save tokens
        text = m.get("text_content", "").replace("\n", " ")
        intent = m.get("intent", "unknown")
        # Format: [Intent] Message
        context_lines.append(f"[{intent}] {text}")
        
    chat_history = "\n".join(context_lines)
    
    # 4. Construct the Prompt for the Qwen/Gemini LLM
    system_prompt = """
    You are Morlen, an AI Chief of Staff and Business Operating Intelligence.
    Your job is to read raw customer chat logs and extract revenue-generating insights based on hard evidence.
    You must justify every recommendation with clear evidence points (e.g., number of requests, missed revenue, repeat customers).
    
    You must output ONLY valid JSON matching this schema:
    {
      "opportunities": [
        {
          "type": "restock | lead",
          "title": "Short title (e.g. Restock Alert, Hot Leads)",
          "product_or_metric": "Name of product or metric",
          "value_metric": "e.g. ₦100,000 or 15 customers",
          "metric_label": "e.g. Potential Recovered Revenue",
          "evidence": [
            "e.g. 8 requests in the last 30 days.",
            "e.g. 5 customers left without buying."
          ]
        }
      ],
      "warnings": [
        {
          "type": "pricing | demand | churn",
          "title": "Short title",
          "description": "Detailed explanation of the warning.",
          "evidence": [
            "e.g. 4 customers complained about the new price.",
            "e.g. Demand dropped 18%."
          ]
        }
      ],
      "timeline": {
        "product": "The product with the most interesting trend",
        "events": [
          {
            "day": "Day of week or chronological marker",
            "description": "What happened",
            "is_recommendation": boolean
          }
        ]
      }
    }
    """
    
    prompt = f"""
    BUSINESS: {business_name}
    
    RECENT CHAT LOGS:
    {chat_history}
    
    Based ONLY on the chat logs above, identify the top revenue opportunities (e.g., highly requested items that are out of stock, customers ready to buy) and warnings (e.g., pricing complaints).
    If there are no clear opportunities, state that the business is stable.
    Calculate estimated revenue in Naira (₦) if applicable based on context clues.
    """
    
    # 5. Execute LLM Call
    try:
        result = call_llm_json(prompt=prompt, system_prompt=system_prompt)
        return result
    except Exception as e:
        logger.error(f"[Intelligence Engine] Failed to generate brief: {e}")
        return {
            "opportunities": [],
            "warnings": [
                {
                    "type": "system_error",
                    "title": "Analysis Failed",
                    "description": "The intelligence engine encountered an error while processing the latest signals."
                }
            ],
            "timeline": {
                "product": "Error",
                "events": []
            }
        }
