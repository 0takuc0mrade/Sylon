import os
import sys

# Ensure backend imports work
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from openserv.integrations import send_meta_message
from openserv.orchestrator import process_user_scenario

def run_live_demo():
    print("==================================================")
    print(" 🚀 Sylon OS: Live Demo Execution")
    print("==================================================\n")
    
    customer_phone = "2348157771198"  # Your exact test phone number
    customer_message = "I need 2 pairs of red Nikes, size 42, but delivery to Warri is too expensive. Can you help?"
    
    print(f"📥 Incoming message from {customer_phone}: '{customer_message}'\n")
    print("🧠 Triggering Qwen Agent Society (CFO, Ops, Sales)...")
    
    # 1. Ask the real AI for a response
    ai_reply = process_user_scenario(customer_message, business_id="live_demo_biz")
    print(f"\n✅ Agents reached consensus. Generated Reply:\n{ai_reply}\n")
    
    # 2. Fire it to your phone
    print("📡 Firing response to Meta Graph API (WhatsApp)...")
    result = send_meta_message("whatsapp", customer_phone, ai_reply)
    
    print(f"\n🎯 Meta API Response: {result}")
    print("\n==================================================")
    print(" ✅ Live Demo Complete. Check your WhatsApp!")
    print("==================================================")

if __name__ == "__main__":
    run_live_demo()
