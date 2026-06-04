import os
import json
from cerebras.cloud.sdk import Cerebras
from dotenv import load_dotenv

load_dotenv()

cerebras_client = Cerebras(api_key=os.environ.get("CEREBRAS_API_KEY"))
model = os.environ.get("CEREBRAS_MODEL", "llama3.1-8b")

print(f"Testing model: {model} with JSON mode")
try:
    response = cerebras_client.chat.completions.create(
        messages=[{"role": "user", "content": "Return {\"hello\": \"world\"}"}],
        model=model,
        response_format={"type": "json_object"}
    )
    print("SUCCESS!")
    print(response.choices[0].message.content)
except Exception as e:
    print(f"ERROR: {e}")
