<div align="center">
  <img src="https://raw.githubusercontent.com/ikhaisoshuare/Cascade/main/frontend/public/logo.png" width="120" alt="Morlen Logo" style="border-radius: 20px;"/>
  <h1>Morlen Cognitive Core</h1>
  <p><b>Enterprise Behavioral Intelligence & Multi-Agent Decision Engine</b></p>
  <p><i>Built by Navstra | Powered by Qwen Cloud & Alibaba Cloud Infrastructure</i></p>
</div>

---

**Live Web App:** [https://morlen.vercel.app/](https://morlen.vercel.app/)

---

## Global AI Hackathon with Qwen Cloud
**For the Judges:** Morlen is purpose-built to win **Track 3 (Agent Society)** with elements of Track 4. Here is exactly how we hit the judging criteria:

1. **Architectural Quality (Track 3 Core):** Morlen is not a chatbot; it is a highly concurrent Multi-Agent Decision Engine. The Qwen Orchestrator routes tasks to isolated Sales and Inventory agents via a custom `concurrent.futures.ThreadPoolExecutor` parallel state machine.
2. **Deterministic Conflict Resolution:** When the Sales Agent and Inventory Agent disagree on a customer request, Morlen utilizes a strict 1-turn Conflict Resolution tie-breaker to reach a consensus without human intervention or infinite loop API bloat.
3. **Sophisticated API Usage (MCP):** Morlen natively bypasses manual integrations by strictly adhering to the **Model Context Protocol (MCP)**. Our MCP Executor securely translates Qwen Cloud's consensus into a direct API execution back to the user.
4. **Alibaba Cloud Integration:** Morlen's intelligence relies exclusively on the **Alibaba Cloud Qwen API (DashScope)**. Furthermore, the backend is explicitly engineered to connect to **Alibaba Cloud RDS (PostgreSQL)** for production via `psycopg2`. *(Note: Due to standard KYC ID-verification delays for international accounts during the hackathon submission window, the live demo is temporarily utilizing a remote PostgreSQL fallback cluster. The architectural engine remains identical).*

## The Problem: The Death of the Dashboard
Modern business intelligence is fundamentally broken. Traditional platforms ingest millions of data points only to spit out static star ratings and sterile dashboards. They tell a business owner *what* happened, but they fail to explain *who* is angry, *why* their expectations shifted, and *how* a specific operational pivot will impact churn. 

Dashboards do not solve problems. Agents do.

## The Solution: Morlen
Morlen, the flagship cognitive engine built by **Navstra**, moves beyond collaborative filtering by treating customers as **evolving psychological entities**. 

Built natively on **Qwen Cloud**, Morlen ingests raw, unstructured data and mathematically excavates distinct customer archetypes. It acts as an autonomous conversational strategist. When a business owner proposes a change (e.g., *"If I raise prices by 15%, what happens?"*), Morlen triggers a highly concurrent, Multi-Agent simulation powered by Qwen-Max to debate the outcome in real-time.

---

## Architecture: The "Board of Directors" Pipeline

To achieve mathematical rigor without LLM hallucination, Morlen relies on a synchronized 4-Agent Pipeline executed via concurrent threading on Alibaba Cloud.

```mermaid
graph TD
    User([User / Store Owner]) -->|Proposes Pivot| UI[Next.js Frontend / Vercel]
    UI -->|API Payload| Gateway[Alibaba Cloud API Gateway]
    Gateway --> SAE[Alibaba Cloud Serverless App Engine]
    
    %% Multi-Agent Pipeline
    SAE -->|Context + Prompt| Router{Qwen Intent Router}
    
    Router -->|INGEST| DB[(Vector DB / Postgres)]
    Router -->|SIMULATE| RAG[RAG Retrieval]
    DB -.->|Customer Archetypes| RAG
    
    RAG -->|Payload| Threads[[Concurrent Execution]]
    
    %% Qwen Cloud API Nodes
    Threads -->|DashScope API| CFO[Qwen CFO Agent<br/>Margin Safety]
    Threads -->|DashScope API| CX[Qwen CX Agent<br/>Churn Risk]
    Threads -->|DashScope API| Ops[Qwen Ops Agent<br/>Execution Friction]
    
    CFO --> Synthesizer((Qwen Synthesizer))
    CX --> Synthesizer
    Ops --> Synthesizer
    
    Synthesizer -->|Actionable Directive| SAE
    SAE -->|Response| UI
    
    style User fill:#f4ebe1,stroke:#664229,stroke-width:2px,color:#664229
    style SAE fill:#FF6A00,stroke:#000,stroke-width:2px,color:#fff
    style Gateway fill:#FF6A00,stroke:#000,stroke-width:2px,color:#fff
    style CFO fill:#1e3a8a,stroke:#000,color:#fff
    style CX fill:#7f1d1d,stroke:#000,color:#fff
    style Ops fill:#14532d,stroke:#000,color:#fff
    style Synthesizer fill:#664229,stroke:#f4ebe1,stroke-width:3px,color:#fff
```

1. **The CFO Agent (Margin Safety):** Evaluates the strict financial impact of the proposed scenario, optimizing for revenue retention.
2. **The CX Agent (Churn Risk):** Analyzes the exact psychological personas excavated from the dataset to predict customer outrage or delight.
3. **The Ops Agent (Friction):** Evaluates supply chain, staff training, and ground-level execution friction.
4. **The Synthesizer (Morlen Core):** Synthesizes the internal debate and outputs a cohesive, actionable directive to the business owner.

This entire debate is streamed live to the Next.js frontend, exposing the raw "thinking" of the Qwen models to the user before delivering the final recommendation.

---

## Tech Stack

**AI & Machine Learning:**
*   **Qwen Cloud (DashScope API):** Native integration powering the Multi-Agent swarm with structured reasoning.
*   **Qwen-Max:** Used for deep simulation and synthesis.

**Backend Infrastructure (Proof of Alibaba Cloud Deployment):**
*   **Alibaba Cloud Serverless App Engine (SAE):** High-throughput, horizontally scaling container orchestration driving the Python orchestrator. (See `app.yaml`)
*   **FastAPI (Python):** Async backend handling agent concurrency.

**Frontend & Authentication:**
*   **Next.js 14:** Highly responsive, SSR-optimized React framework deployed on Vercel.
*   **Privy:** Seamless, secure Web3/Social authentication pipeline.
*   **Tailwind CSS:** Custom `brand-brown` aesthetic prioritizing a warm, native, and premium UX.

---

## Local Development

Morlen is fully containerized for instant deployment.

1. **Clone & Configure:**
   ```bash
   git clone https://github.com/HillaryIkhais/Morlen.git
   cd Morlen
   ```
   Create a `.env` file in the root directory:
   ```env
   DASHSCOPE_API_KEY=your_qwen_cloud_api_key
   QWEN_MODEL=qwen-max
   MORLEN_DB_PATH=data/morlen.db
   ```

2. **Spin up the Cluster:**
   ```bash
   docker-compose up --build
   ```

3. **Access the Engine:** Open your browser to `http://localhost:3000`

---
*Built to redefine Enterprise Intelligence at the Global AI Hackathon with Qwen Cloud.*
