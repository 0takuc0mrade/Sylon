# Sylon

Sylon is an AI-powered, review-grounded business intelligence platform. It ingests customer review histories, extracts core pain points, and excavates "hybrid personas" based on real customer data. It then simulates how these specific customer archetypes will react to new business decisions (a "collision analysis"), providing the business owner with traceable, data-driven advice.

## Core Features

*   **Review Ingestion & Persona Excavation:** Upload reviews (via CSV/JSON,PDF, JPG or pasted text) to automatically identify key customer segments and their recurring pain points.
*   **Multi-Persona Simulator:** Propose a business change (e.g., "I want to raise prices by 10%"). Sylon runs a collision analysis, simulating how each excavated persona will react based on their historical preferences.
*   **Voice-Native Integration:** Designed as a FastAPI webhook for ElevenLabs, allowing business owners to talk to Sylon conversationally.
*   **Competitor Analysis Fallback:** If you don't have reviews, Sylon generates synthetic personas and fetches real competitor reviews via the Google Places API to ground its advice.

## Technology Stack

*   **FastAPI:** Serves as the webhook endpoint for ElevenLabs and handles data ingestion routes.
*   **Cerebras AI (Qwen-3-235b-a22b-instruct-2507):** Powers the core simulation engine, strategist summarization, and persona extraction. Chosen for rapid inference and complex instruction following.
*   **Google Gemini (2.0 Flash):** Handles the "Router" agent, utilizing Gemini's structured output capabilities to classify user intent (`CHAT`, `SIMULATE`, `INGEST`).
*   **Google Places API:** Used for fetching competitor reviews when generating fallback personas.
*   **ElevenLabs (Integration):** Acts as the frontend for real-time voice-to-voice interaction.

## Architecture & Data Flow

1.  **Server (`openserv/server.py`):** Provides the FastAPI endpoints (`/chat` for voice agent webhooks, `/business/upload-reviews` for bulk data uploads).
2.  **Orchestrator (`openserv/orchestrator.py`):** The master pipeline. Routes intents and manages the flow between ingestion, simulation, and conversational responses.
3.  **Agents (`agents/`):**
    *   **Router:** Classifies intent (Gemini).
    *   **Simulator:** Runs proposed changes against specific personas (Cerebras).
    *   **Strategist:** Synthesizes the multi-persona collision results into actionable, conversational advice (Cerebras).
    *   **Persona Factory & Painpoint Extractor:** Analyzes reviews to build grounded customer profiles.
4.  **LLM Client (`agents/llm_client.py`):** Centralized client with robust retry and exponential backoff for rate limiting across both provider APIs.

## Getting Started

### Prerequisites

*   Python 3.10+
*   Cerebras API Key
*   Google Gemini API Key
*   Google Places API Key (optional, for fallback personas)

### Setup

1.  Clone the repository and navigate to the project root.
2.  Set up a virtual environment:
    ```bash
    python -m venv venv
    source venv/bin/activate
    ```
3.  Install the required dependencies:
    ```bash
    pip install fastapi uvicorn pydantic python-multipart google-genai openai python-dotenv pyyaml
    ```
4.  Create a `.env` file in the `agents/` directory (or project root) and configure your API keys:
    ```env
    CEREBRAS_API_KEY=your_cerebras_key
    GEMINI_API_KEY=your_gemini_key
    GOOGLE_PLACES_API_KEY=your_google_places_key
    ```

### Running the Project

**Start the FastAPI Server:**
```bash
uvicorn openserv.server:app --reload --port 8000
```
This is useful if you are exposing the `/chat` endpoint via ngrok to ElevenLabs.

**Run the CLI Interface:**
You can also interact with Sylon directly via the command line:
```bash
python openserv/orchestrator.py
```
