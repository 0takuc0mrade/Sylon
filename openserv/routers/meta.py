import os
import time
import uuid
from typing import Dict, Any, List
from fastapi import APIRouter, Request, HTTPException, Response, BackgroundTasks
from openserv.persistence import persistence_service
from openserv.orchestrator import process_user_scenario
from openserv.tools import tool_send_meta_message

router = APIRouter(prefix="/webhooks/meta", tags=["meta"])

META_VERIFY_TOKEN = os.environ.get("META_VERIFY_TOKEN")

@router.post("/internal/process-whatsapp")
async def receive_whatsapp_internal(request: Request):
    """
    Internal endpoint called by the Next.js API Gateway.
    Next.js has already verified the Meta signature and returned a 200 OK.
    """
    try:
        body = await request.json()
        print("[Python AI Microservice] Received forwarded webhook from Next.js Gateway.")
        
        obj_type = body.get("object")
        import asyncio
        if obj_type in ["whatsapp_business_account", "instagram", "page"]:
            for entry in body.get("entry", []):
                if obj_type == "whatsapp_business_account":
                    asyncio.create_task(asyncio.to_thread(process_whatsapp_message, entry))
                    
        return {"status": "accepted_for_processing"}
    except Exception as e:
        print(f"[Python AI Error] Error parsing internal payload: {e}")
        return {"status": "error"}


def process_whatsapp_message(entry: dict):
    """
    Extracts text messages from a WhatsApp webhook entry and routes them to the Decision Engine.
    """
    from openserv.decision_engine import process_customer_message
    from openserv.persistence import persistence_service
    import time
    import uuid

    for change in entry.get("changes", []):
        value = change.get("value", {})
        messages = value.get("messages", [])
        contacts = value.get("contacts", [])
        
        metadata = value.get("metadata", {})
        phone_number_id = metadata.get("phone_number_id")
        
        # Multi-Tenant Routing: Lookup the specific business that owns this WhatsApp number
        business_id = persistence_service.get_business_by_phone_id(phone_number_id)
        
        if not business_id:
            print(f"[Webhook Dropped] Received message for unregistered phone number: {phone_number_id}. Ignoring.")
            return

        contact_map = {c.get("wa_id"): c.get("profile", {}).get("name", "Unknown") for c in contacts}
        owner_phone = persistence_service.get_owner_phone(business_id)

        for msg in messages:
            if msg.get("type") == "text":
                sender_id = msg.get("from")
                sender_name = contact_map.get(sender_id, "Unknown")
                text_content = msg.get("text", {}).get("body", "")
                
                # Check if this message is from the Business Owner
                if owner_phone and sender_id == owner_phone:
                    from openserv.decision_engine import handle_owner_message
                    try:
                        handle_owner_message(business_id, text_content)
                    except Exception as ai_e:
                        print(f"[Business Intent Router Error] Pipeline failed: {ai_e}")
                    return # Stop execution so we don't process it as a customer message
                
                # 1. Log the incoming message to Business Memory
                memory_id = f"wm_{uuid.uuid4().hex[:12]}"
                created_at = str(int(time.time())) 
                try:
                    with persistence_service.get_connection() as conn:
                        formatted_content = f"[{sender_name} via WhatsApp]: {text_content}"
                        conn.execute("""
                            INSERT INTO business_memories 
                            (memory_id, business_id, source, text_content, created_at)
                            VALUES (?, ?, ?, ?, ?)
                        """, (memory_id, business_id, "whatsapp_inbound", formatted_content, created_at))
                except Exception as e:
                    print(f"[Morlen Meta Ingest Error] Failed to store memory: {e}")

                # 2. Pipe it into the new Customer Decision Engine
                try:
                    process_customer_message(text_content, business_id, sender_id, sender_name)
                except Exception as ai_e:
                    print(f"[Decision Engine Error] Pipeline failed: {ai_e}")
