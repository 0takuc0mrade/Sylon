import os
import json
from google import genai
from dotenv import load_dotenv

load_dotenv()
client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))
prompt = "compare changing my menu and increasing my prices for all customers"
response = client.models.generate_content(
    model="gemini-2.0-flash",
    contents=prompt,
    config={"max_output_tokens": 100} # Maybe a max output token is set somewhere?
)
print("Response length:", len(response.text))
print(response.text)
