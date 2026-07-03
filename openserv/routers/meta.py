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

@router.get("/")
async def verify_webhook(request: Request):
    """
    Meta Webhook Verification endpoint.
    When you configure a webhook in the Meta App Dashboard, Meta sends a GET request
    with hub.mode, hub.challenge, and hub.verify_token.
    """
    mode = request.query_params.get("hub.mode")
    token = request.query_params.get("hub.verify_token")
    challenge = request.query_params.get("hub.challenge")

    if mode and token:
        if mode == "subscribe" and token == META_VERIFY_TOKEN:
            print("WEBHOOK_VERIFIED")
            # Meta requires the raw challenge string returned
            return Response(content=challenge, media_type="text/plain")
        else:
            # Responds with '403 Forbidden' if verify tokens do not match
            raise HTTPException(status_code=403, detail="Verification token mismatch")
    
    raise HTTPException(status_code=400, detail="Missing mode or token")


def process_whatsapp_message(entry: Dict[str, Any]):
    """
    Extracts text messages from a WhatsApp webhook entry and stores them in Business Memory.
    """
    for change in entry.get("changes", []):
        value = change.get("value", {})
        messages = value.get("messages", [])
        contacts = value.get("contacts", [])
        
        metadata = value.get("metadata", {})
        business_id = metadata.get("phone_number_id", "default_business")

        contact_map = {c.get("wa_id"): c.get("profile", {}).get("name", "Unknown") for c in contacts}

        for msg in messages:
            if msg.get("type") == "text":
                sender_id = msg.get("from")
                sender_name = contact_map.get(sender_id, "Unknown")
                text_content = msg.get("text", {}).get("body", "")
                
                # Store in business memory
                memory_id = f"wm_{uuid.uuid4().hex[:12]}"
                # Format to ISO-like string since that is how other components read it
                created_at = str(int(time.time())) 
                
                try:
                    with persistence_service.get_connection() as conn:
                        # Upsert business if it doesn't exist
                        conn.execute("""
                            INSERT OR IGNORE INTO businesses 
                            (business_id, name, created_at, updated_at) 
                            VALUES (?, ?, ?, ?)
                        """, (business_id, f"WhatsApp Biz {business_id}", created_at, created_at))
                        
                        # Log the memory
                        formatted_content = f"[{sender_name} via WhatsApp]: {text_content}"
                        conn.execute("""
                            INSERT INTO business_memories 
                            (memory_id, business_id, source, text_content, created_at)
                            VALUES (?, ?, ?, ?, ?)
                        """, (memory_id, business_id, "whatsapp", formatted_content, created_at))
                        print(f"[Sylon Meta Ingest] Stored WhatsApp memory for {business_id}: {text_content}")
                        
                except Exception as e:
                    print(f"[Sylon Meta Ingest Error] Failed to store memory: {e}")

                # --- WIRE THE EARS TO THE BRAIN (OUTSIDE DB LOCK) ---
                try:
                    print(f"[Sylon AI] Triggering Orchestrator for message from {sender_id}...")
                    ai_reply = process_user_scenario(text_content, business_id=business_id)
                    if ai_reply:
                        tool_send_meta_message("whatsapp", sender_id, ai_reply)
                        print(f"[Sylon Meta Egress] Successfully sent AI reply back to {sender_id}")
                except Exception as ai_e:
                    print(f"[Sylon AI Error] Failed to process/send reply: {ai_e}")
                # ----------------------------------


@router.post("/")
async def receive_webhook(request: Request, background_tasks: BackgroundTasks):
    """
    Receives incoming webhook payloads from Meta (WhatsApp, Instagram, Messenger).
    Must return 200 OK immediately so Meta doesn't timeout. Processing happens in background.
    """
    try:
        body = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON payload")

    # Meta webhook structure has 'object'
    obj_type = body.get("object")
    
    if obj_type in ["whatsapp_business_account", "instagram", "page"]:
        # Dispatch to background task to free up connection immediately
        for entry in body.get("entry", []):
            if obj_type == "whatsapp_business_account":
                background_tasks.add_task(process_whatsapp_message, entry)
            # Future: add process_instagram_message, process_messenger_message
            
        return Response(content="EVENT_RECEIVED", status_code=200, media_type="text/plain")
    
    raise HTTPException(status_code=404, detail="Unrecognized webhook object")
