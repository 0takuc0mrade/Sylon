import sys
import os
import time

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi.testclient import TestClient
from openserv.server import app
from openserv.persistence import persistence_service
from openserv.routers.meta import META_VERIFY_TOKEN

client = TestClient(app)

print("=== Testing Meta Webhook Integration ===")

print("\n1. Testing GET Verification (Success)")
resp = client.get("/webhooks/meta", params={
    "hub.mode": "subscribe",
    "hub.challenge": "1158201444",
    "hub.verify_token": META_VERIFY_TOKEN
})
print("Status:", resp.status_code)
print("Response:", resp.text)
assert resp.status_code == 200
assert resp.text == "1158201444"


print("\n2. Testing GET Verification (Failure - Bad Token)")
resp = client.get("/webhooks/meta", params={
    "hub.mode": "subscribe",
    "hub.challenge": "1158201444",
    "hub.verify_token": "wrong-token"
})
print("Status:", resp.status_code)
assert resp.status_code == 403


print("\n3. Testing POST Webhook (Incoming WhatsApp Message)")
# Typical payload from Meta Graph API
payload = {
  "object": "whatsapp_business_account",
  "entry": [
    {
      "id": "1234567890",
      "changes": [
        {
          "value": {
            "messaging_product": "whatsapp",
            "metadata": {
              "display_phone_number": "16505551111",
              "phone_number_id": "test_business_99"
            },
            "contacts": [{"profile": {"name": "Kerry Fisher"}, "wa_id": "16315551234"}],
            "messages": [
              {
                "from": "16315551234",
                "id": "wamid.HBgLMTYzMTU1NTEyMzQ...",
                "timestamp": "1602320449",
                "text": {"body": "Do you have Oraimo power banks in stock?"},
                "type": "text"
              }
            ]
          },
          "field": "messages"
        }
      ]
    }
  ]
}

resp = client.post("/webhooks/meta", json=payload)
print("Status:", resp.status_code)
print("Response:", resp.text)
assert resp.status_code == 200
assert resp.text == "EVENT_RECEIVED"

# Allow background task to execute
time.sleep(1)

print("\n4. Verifying Database Injection (Business Memory)")
with persistence_service.get_connection() as conn:
    c = conn.cursor()
    # Check if business was created
    c.execute("SELECT name FROM businesses WHERE business_id = 'test_business_99'")
    biz = c.fetchone()
    print("Business profile created:", biz[0] if biz else "FAILED")
    assert biz is not None
    
    # Check if memory was created
    c.execute("SELECT text_content FROM business_memories WHERE business_id = 'test_business_99' ORDER BY ROWID DESC LIMIT 1")
    mem = c.fetchone()
    print("Memory created:", mem[0] if mem else "FAILED")
    assert mem is not None
    assert "Oraimo power banks" in mem[0]
    assert "Kerry Fisher via WhatsApp" in mem[0]

print("\n✅ All tests passed. The Meta webhook pipeline is working flawlessly.")
