import os
import sys
import time

# Ensure agents can be imported
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from openserv.persistence import persistence_service
from openserv.tools import tool_send_meta_message
from agents.alibaba_integration import call_llm

def generate_and_send_daily_summary():
    """
    Iterates through all businesses, fetches their recent memories (conversations, sales, complaints),
    generates an executive summary using Qwen, and sends it to the owner's WhatsApp.
    """
    print("[Daily Summary] Starting job...")
    businesses = persistence_service.get_all_businesses()
    
    if not businesses:
        print("[Daily Summary] No businesses found.")
        return

    for biz in businesses:
        business_id = biz.get("business_id")
        business_name = biz.get("name", "Business Owner")
        
        owner_phone = persistence_service.get_owner_phone(business_id)
        if not owner_phone:
            print(f"[Daily Summary] Skipping {business_id} - no owner phone registered.")
            continue
            
        # Get recent memories (in production we'd filter by last 24h, here we get recent 50)
        memories = persistence_service.get_recent_memories(business_id, limit=50)
        
        if not memories:
            print(f"[Daily Summary] Skipping {business_id} - no recent activity.")
            continue
            
        print(f"[Daily Summary] Analyzing {len(memories)} interactions for {business_name}...")
        
        # Build context for LLM
        history_text = "\n".join([
            f"[{m.get('created_at')}] {m.get('source')}: {m.get('text_content')}" 
            for m in memories
        ])
        
        system_prompt = """
        You are Morlen, an AI Business Operator. 
        Analyze the provided daily log of business interactions and generate a concise, professional evening summary for the business owner.
        
        Your summary MUST include:
        1. Total number of conversations today.
        2. Closed sales (if any can be inferred).
        3. Lost customers or complaints (if any).
        4. Estimated revenue (if mentioned).
        5. A final question asking if you should remember anything specific from today.
        
        Keep the tone polite, helpful, and extremely brief (like a WhatsApp message).
        Example format:
        Good evening Hillary.
        Today you had 18 conversations.
        Closed 6 sales.
        Lost 3 customers because Product A was unavailable.
        Revenue today: ₦86,000
        Three customers complained about delivery time.
        
        Should I remember anything from today?
        """
        
        prompt = f"BUSINESS LOG:\n{history_text}\n\nGenerate the WhatsApp summary for {business_name}:"
        
        try:
            summary_text = call_llm(prompt=prompt, system_prompt=system_prompt)
            print(f"[Daily Summary] Generated for {business_id}:\n{summary_text}\n")
            
            # Send to Owner via WhatsApp
            tool_send_meta_message(
                platform="whatsapp", 
                to_number=owner_phone, 
                message_text=summary_text, 
                business_id=business_id
            )
            print(f"[Daily Summary] Sent successfully to +{owner_phone}.")
        except Exception as e:
            print(f"[Daily Summary] Failed for {business_id}: {e}")

if __name__ == "__main__":
    generate_and_send_daily_summary()
