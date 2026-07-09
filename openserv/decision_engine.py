import json
import logging
import uuid
import time
from datetime import datetime
from pydantic import BaseModel, Field

from openserv.persistence import persistence_service
from openserv.tools import tool_send_meta_message

# We need the LLM clients. We'll use call_llm for generation, and call_gemini_structured for decision making if possible, or fallback to call_llm_json.
try:
    from agents.llm_client import call_llm_json, call_llm
except ImportError:
    # Fallback if running from root
    import sys, os
    sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
    from agents.llm_client import call_llm_json, call_llm

logger = logging.getLogger('morlen.decision_engine')

class DecisionEngineOutput(BaseModel):
    intent: str = Field(description="The primary intent of the customer's message (e.g., pricing_inquiry, complaint, negotiation, casual)")
    risk_score: int = Field(description="1-10 score. 10 means high legal, financial, or reputational risk if answered incorrectly.")
    confidence: int = Field(description="1-100 score. How confident is the AI that it knows the exact factual answer based ONLY on the provided context?")
    decision: str = Field(description="Must be exactly one of: REPLY, DRAFT, ESCALATE, WAIT")
    reasoning: str = Field(description="A brief explanation of why this decision was made.")

def build_context(business_id: str, sender_id: str) -> str:
    """Step 1: Retrieve Business Memory and Customer History"""
    profile = persistence_service.get_business_profile(business_id)
    if not profile:
        profile = {"name": "Unknown Business", "policies": "No policies found."}
    
    # In a full production system, we would fetch the last 10 messages from sender_id here.
    history = persistence_service.get_recent_memories(business_id, limit=5)
    history_text = "\n".join([f"- {h['source']}: {h['text_content']}" for h in history if str(sender_id) in str(h.get('text_content', ''))])
    
    context = f"""
BUSINESS CONTEXT:
Name: {profile.get('name')}
Description: {profile.get('description')}
Policies: {profile.get('policies')}

RECENT CUSTOMER HISTORY:
{history_text if history_text else "First time messaging or no recent history found."}
"""
    return context


def analyze_intent_and_risk(message: str, context: str) -> dict:
    """Step 2 & 3: Run the Intent and Risk analyzer via structured LLM output"""
    
    system_prompt = """
You are the Morlen AI Decision Engine for a business.
Your job is NOT to reply to the user. Your job is to classify the user's message and decide what the AI should do next based on risk, confidence, and business rules.

DECISION LOGIC:
1. REPLY (Automatic): Use for high-confidence, factual, or utility questions with near-zero risk.
   - Examples: "Are you open today?", "How much is the black shoe?", "Has my order shipped?", "Where are you located?"

2. DRAFT (Human Approval): Use when the conversation becomes subjective, involves negotiation, or mild complaints that require owner nuance.
   - Examples: "Can you remove ₦10,000?", "I bought this last month and it spoiled.", "Oga, this thing expensive o."

3. ESCALATE (Immediate Human Intervention): Use when the conversation is too risky. Wrong AI response costs more than a delayed human response.
   - Examples: "I'm taking you to court.", "I've been scammed.", "Payment deducted twice.", "Made my child sick.", "Speak to the owner.", "I've spent over ₦2 million with you." (VIP), "You're all thieves." (High emotion), "Cancel everything."

4. WAIT (Do Nothing): Use when replying hurts conversion or when the decision depends on time/others.
   - Examples: "Let me ask my husband.", "I'll be paid next Friday.", "Hmm... I'll think about it."

Output valid JSON exactly matching the schema.
"""

    prompt = f"{context}\n\nCUSTOMER MESSAGE:\n\"{message}\"\n\nAnalyze this message and return the JSON decision."
    
    try:
        # Requesting strict JSON structure
        result = call_llm_json(prompt=prompt, system_prompt=system_prompt)
        return result
    except Exception as e:
        logger.error(f"[Decision Engine] LLM routing failed: {e}")
        # Fallback to safe escalation
        return {"intent": "unknown", "risk_score": 10, "confidence": 0, "decision": "ESCALATE", "reasoning": "Fallback due to LLM failure"}


def process_customer_message(text_content: str, business_id: str, sender_id: str, sender_name: str = "Unknown", channel: str = "whatsapp"):
    """
    The Core Pipeline for Customer Messages (Qwen Multi-Agent Debate).
    Track 3 (Agent Society) Implementation: CX Agent and CFO Agent debate the response,
    then the Operations Router makes the final decision based on their conflict resolution.
    """
    print(f"[Decision Engine] Processing message from {sender_name} ({sender_id}) for business {business_id} via {channel}...")
    
    # 1. Build Context
    context = build_context(business_id, sender_id)
    
    # 2. Multi-Agent Debate
    cx_prompt = f"{context}\n\nCUSTOMER MESSAGE:\n\"{text_content}\"\n\nYou are the Customer Experience (CX) Agent. Your goal is to maximize customer satisfaction and retention. How should we respond?"
    cfo_prompt = f"{context}\n\nCUSTOMER MESSAGE:\n\"{text_content}\"\n\nYou are the Chief Financial Officer (CFO) Agent. Your goal is to minimize risk, reduce costs, and strictly enforce business policies. How should we respond?"
    
    # In a real async environment we would Promise.all these
    try:
        cx_perspective = call_llm(prompt=cx_prompt, system_prompt="You are a CX Agent. Focus on empathy, retention, and satisfaction. Keep it to 2 sentences.")
        cfo_perspective = call_llm(prompt=cfo_prompt, system_prompt="You are a CFO Agent. Focus on policy, cost reduction, and risk mitigation. Keep it to 2 sentences.")
    except Exception as e:
        logger.error(f"[Decision Engine] Agent debate failed: {e}")
        cx_perspective = "Provide immediate assistance to the customer."
        cfo_perspective = "Ensure no financial commitments are made without owner approval."
        
    debate_trace = {
        "cx": cx_perspective,
        "cfo": cfo_perspective,
        "ops": ""
    }
    
    # 3. Router Analysis (Takes the debate into account)
    analysis = analyze_intent_and_risk(
        f"Customer Message: {text_content}\n\nCX Agent Suggestion: {cx_perspective}\n\nCFO Agent Suggestion: {cfo_perspective}", 
        context
    )
    decision = str(analysis.get("decision", "ESCALATE")).upper()
    debate_trace["ops"] = analysis.get("reasoning", "")
    
    print(f"[Decision Engine] Agent Debate Trace: {json.dumps(debate_trace)}")
    print(f"[Decision Engine] Analysis Complete: {analysis}")
    print(f"[Decision Engine] Selected Route: {decision}")
    
    result_payload = {
        "decision": decision,
        "debate_trace": debate_trace,
        "reply": ""
    }
    
    # 4. Execute Decision
    if decision == "REPLY":
        # Generate the actual reply based on the resolved debate
        reply_prompt = f"{context}\n\nCustomer: {text_content}\nCX Agent: {cx_perspective}\nCFO Agent: {cfo_perspective}\n\nWrite a short, polite, helpful response acting as the business, taking both agent perspectives into account."
        final_reply = call_llm(prompt=reply_prompt, system_prompt="You are a helpful customer service AI representing the business. Keep it concise.")
        
        result_payload["reply"] = final_reply
        
        # Send it via Meta if channel is whatsapp
        if channel == "whatsapp":
            tool_send_meta_message("whatsapp", sender_id, final_reply, business_id=business_id)
            print(f"[Decision Engine] Sent AUTOMATIC REPLY to {sender_id}.")
        
    elif decision == "DRAFT":
        # Generate a draft but do NOT send it
        draft_prompt = f"{context}\n\nCustomer: {text_content}\nCX Agent: {cx_perspective}\nCFO Agent: {cfo_perspective}\n\nDraft a suggested response for the business owner to review. Do not send."
        draft_reply = call_llm(prompt=draft_prompt, system_prompt="You are an assistant drafting a reply for your boss. Keep it concise.")
        
        # Save as a draft memory with the debate trace
        memory_id = f"wm_draft_{uuid.uuid4().hex[:12]}"
        created_at = str(int(time.time()))
        formatted = f"[DRAFT REPLY to {sender_name} ({sender_id})]: {draft_reply}"
        with persistence_service.get_connection() as conn:
            conn.execute("""
                INSERT INTO business_memories (memory_id, business_id, source, text_content, created_at, intent, reasoning_trace)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (memory_id, business_id, "draft_reply", formatted, created_at, analysis.get("intent", "draft"), json.dumps(debate_trace)))
        
        print(f"[Decision Engine] Saved DRAFT REPLY for owner approval.")
        
        # PROXY LOOP: Alert the owner on their personal WhatsApp (Owner always gets this on WhatsApp if available)
        owner_phone = persistence_service.get_owner_phone(business_id)
        if owner_phone:
            proxy_msg = f"📝 *DRAFT READY*\nCustomer: {sender_name} (+{sender_id})\n\nMorlen suggests:\n\"{draft_reply}\"\n\n_Reply 'approve' to send, or type your own response to rewrite._"
            tool_send_meta_message("whatsapp", owner_phone, proxy_msg, business_id=business_id)
            
        result_payload["reply"] = "I need to check with the team on this. One moment."
        
    elif decision == "ESCALATE":
        # Flag immediately in the database
        memory_id = f"wm_esc_{uuid.uuid4().hex[:12]}"
        created_at = str(int(time.time()))
        formatted = f"[ESCALATED from {sender_name} ({sender_id})]: {text_content}\nReason: {analysis.get('reasoning')}"
        with persistence_service.get_connection() as conn:
            conn.execute("""
                INSERT INTO business_memories (memory_id, business_id, source, text_content, created_at, intent, reasoning_trace)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (memory_id, business_id, "escalation", formatted, created_at, "urgent", json.dumps(debate_trace)))
        
        print(f"[Decision Engine] ESCALATED message to business owner.")
        
        # PROXY LOOP: Alert the owner on their personal WhatsApp
        owner_phone = persistence_service.get_owner_phone(business_id)
        if owner_phone:
            proxy_msg = f"🚨 *ESCALATION REQUIRED*\nCustomer: {sender_name} (+{sender_id})\nMessage: \"{text_content}\"\n\n_Reason: {analysis.get('reasoning')}_\n\n_Reply to this message with your instructions to the customer._"
            tool_send_meta_message("whatsapp", owner_phone, proxy_msg, business_id=business_id)
            
        result_payload["reply"] = "I have escalated this to the manager. They will get back to you shortly."
        
    elif decision == "WAIT":
        # Do nothing immediately, could trigger a QStash delayed job here later
        print(f"[Decision Engine] Decision is WAIT. No immediate action taken.")
        result_payload["reply"] = "..."
        
    else:
        print(f"[Decision Engine] Unknown decision state: {decision}")
        result_payload["reply"] = "I'm not sure how to respond to that right now."

    return result_payload

def handle_owner_message(business_id: str, text_content: str):
    """
    Business Intent Router: Parses the owner's response to an escalation/draft via WhatsApp
    and forwards the action to the customer.
    """
    import re
    # 1. Fetch the latest action item (Draft or Escalation)
    items = persistence_service.get_action_items(business_id)
    if not items:
        owner_phone = persistence_service.get_owner_phone(business_id)
        if owner_phone:
            tool_send_meta_message("whatsapp", owner_phone, "✅ You have no pending drafts or escalations.", business_id=business_id)
        return

    latest_item = items[0]
    memory_id = latest_item["id"]
    interaction_text = latest_item["interaction_text"]
    
    # 2. Extract Customer Phone Number
    # We formatted it as: [DRAFT REPLY to CustomerName (+1234567890)]: suggested text
    # Or [ESCALATED from CustomerName (+1234567890)]: text
    phone_match = re.search(r'\(\+(\d+)\)', interaction_text)
    
    if not phone_match:
        # Try without the plus sign in case of formatting variations
        phone_match = re.search(r'\((\d+)\)', interaction_text)
        
    if not phone_match:
        print("[Business Intent Router] Error: Could not extract customer phone number from draft.")
        owner_phone = persistence_service.get_owner_phone(business_id)
        if owner_phone:
            tool_send_meta_message("whatsapp", owner_phone, "⚠️ Error: Could not extract customer phone number from the draft. Please use the Web Dashboard.", business_id=business_id)
        return
        
    customer_phone = phone_match.group(1)
    
    # 3. Process the Owner's Intent
    text_clean = text_content.strip().lower()
    final_reply = ""
    
    if text_clean in ["approve", "yes", "send", "y", "ok"]:
        # If it's a draft, extract the AI's suggested text
        if latest_item["source"] == "draft_reply":
            parts = interaction_text.split("]: ", 1)
            final_reply = parts[1] if len(parts) > 1 else "Error extracting draft."
        else:
            owner_phone = persistence_service.get_owner_phone(business_id)
            if owner_phone:
                tool_send_meta_message("whatsapp", owner_phone, "⚠️ This is an escalation, not a draft. Please type the message you want to send to the customer.", business_id=business_id)
            return
    else:
        # If they didn't just say "approve", then what they typed IS the reply.
        # Qwen Intent Router extension: We could use Qwen here to polish their text, but for production speed we will just pass it directly.
        final_reply = text_content
        
    # 4. Send to Customer
    tool_send_meta_message("whatsapp", customer_phone, final_reply, business_id=business_id)
    
    # 5. Resolve the Action Item
    persistence_service.resolve_action_item(memory_id)
    
    # 6. Confirm to Owner
    owner_phone = persistence_service.get_owner_phone(business_id)
    if owner_phone:
        tool_send_meta_message("whatsapp", owner_phone, f"✅ Sent to customer (+{customer_phone}).", business_id=business_id)
