# Sylon Behavioral Intelligence

Sylon is a multi-agent behavioral intelligence platform designed for the **DSN X BCT LLM Agent Challenge**. It transforms unstructured customer reviews into psychologically grounded personas and simulates how they will react to business decisions.

## Quick Start (Judges Evaluation)

We have containerized the entire application for easy evaluation. 
**Prerequisites:** You must have Docker and Docker Compose installed.

1. Ensure your API keys are set in your environment or a `.env` file in the root directory:
   ```bash
   CEREBRAS_API_KEY=your_key
   GEMINI_API_KEY=your_key
   ELEVENLABS_API_KEY=your_key (Optional, for voice)
   ```

2. Run the application using Docker Compose:
   ```bash
   docker compose up --build
   ```

3. Open your browser and navigate to: **http://localhost:3000**

## Evaluating the Hackathon Tasks

To preserve the immersion of a market-ready B2B platform, we did not label the primary UI buttons "Task A" and "Task B". Instead, they are integrated natively into the Sylon Chat interface.

### Task A: User Modeling (Simulate Audience Reaction)
1. Navigate to the **Upload Data** page and click "Try with Sample Data".
2. Once the personas are excavated, click "Engage Sylon Core" to enter the Chat.
3. Above the chat input, click the quick-action button: **"Simulate Audience Reaction"**.
4. *Sylon will use the excavated Nigerian personas to simulate a highly contextual reaction and star rating to a hypothetical business change.*

### Task B: Recommendation (Generate Persona Recommendations)
1. In the Sylon Chat interface, click the quick-action button: **"Request Product Recommendations"**.
2. *Sylon will dynamically analyze the specific pain points and behavioral traits of the excavated personas to recommend products/services explicitly tailored to their context.*

## Solution Papers

Please refer to the following documents for our architectural approach and ablation studies:
*   [Task A Solution Paper: User Modeling](docs/paper_task_A_user_modeling.md)
*   [Task B Solution Paper: Recommendation](docs/paper_task_B_recommendation.md)

## Architecture
- **Frontend:** Next.js (App Router), TailwindCSS, React.
- **Backend:** FastAPI, Python 3.12.
- **LLM Orchestration:** Cerebras (Llama-3/Qwen) with an automated exponential-backoff failover to Google Gemini 2.0 Flash for API rate-limit resilience.
