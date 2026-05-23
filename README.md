# Sylon

Sylon is an agentic behavioral intelligence platform that transforms unstructured customer feedback into psychologically grounded personas, allowing businesses to simulate operational changes before making them.

**Live Web App:** [https://sylon.vercel.app/](https://sylon.vercel.app/)

## The Problem
Traditional business intelligence relies on aggregate star ratings. However, static scores obscure the reality of human behavior, they ignore temporal drift and contextual friction. A business owner knows a review is negative, but they don't know *who* that customer is, *why* their expectations shifted, or how to win them back without alienating others.

## The Solution
Sylon moves beyond collaborative filtering by treating customers as evolving psychological entities. 

Instead of generating a static dashboard, Sylon reads raw, unstructured data and excavates distinct customer archetypes. It acts as a conversational strategist, predicting how specific personas will react to future business decisions and recommending operational pivots grounded entirely in historical frustration data.

Sylon is completely domain-agnostic. While the primary demo focuses on the hospitality sector, the ingestion engine instantly adapts to extract relevant behavioral metrics for retail, real estate, SaaS, or education simply by uploading a different dataset.

## Agentic Workflow Architecture

Sylon is built on a highly modular, multi agent orchestration architecture to handle complex reasoning without hallucinations:

1. **The Intent Router:** Powered by Gemini 2.0 Flash, this agent analyzes conversation history to classify user intent (SIMULATE, RECOMMEND, INGEST, or CHAT) and routes the prompt to the appropriate subsystem.
2. **The Extraction Swarm:** During data ingestion, multiple worker agents analyze thousands of reviews in parallel, synthesizing localized pain points and personas before committing them to the database.
3. **The Strategist Agent:** When executing a recommendation task, this agent automatically injects the active SQLite business session, the extracted personas, and the pain points into a zero-shot reasoning prompt. This grounds the LLM strictly in historical data.
4. **The Voice Integration:** ElevenLabs Conversational AI is hooked into the Strategist Agent via a live client tool, allowing real time vocal reasoning.

## Documentation

For a deep dive into the underlying architecture, mathematical evaluations, and scaling roadmap, refer to the official solution papers:

*   [Task A Solution Paper: User Behaviour Modeling](task_a_solution_paper.md)
*   [Task B Solution Paper: Recommendation & Reasoning](task_b_solution_paper.md)

## Local Development & Contributing

If you wish to run the Sylon Engine locally or contribute to the repository, the application is fully containerized.

1. Clone the repository and create a `.env` file in the root directory:
   ```bash
   CEREBRAS_API_KEY=your_key
   GEMINI_API_KEY=your_key
   ELEVENLABS_API_KEY=your_key
   PRIVY_APP_SECRET=your_key
   ```
   *Note: Frontend `.env.local` requires `NEXT_PUBLIC_PRIVY_APP_ID`.*

2. Spin up the cluster using Docker Compose:
   ```bash
   docker compose up --build
   ```

3. Open your browser to: **http://localhost:3000**

---
*Built with Python, FastAPI, Next.js, Cerebras, Google GenAI, and SQLite.*
