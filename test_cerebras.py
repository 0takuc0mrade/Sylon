import os
from cerebras.cloud.sdk import Cerebras
from dotenv import load_dotenv

load_dotenv()
cerebras_client = Cerebras(api_key=os.environ.get("CEREBRAS_API_KEY"))
model = os.environ.get("CEREBRAS_MODEL", "gpt-oss-120b")

print(f"Testing basic chat with {model}...")
try:
    response = cerebras_client.chat.completions.create(
        messages=[{"role": "user", "content": "Hello"}],
        model=model,
        max_tokens=2000,
        temperature=0.7
    )
    print("SUCCESS!")
    print(response.choices[0].message.content)
except Exception as e:
    print(f"ERROR: {e}")
