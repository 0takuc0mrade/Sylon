# Sylon

Sylon is an AI-powered, review-grounded business intelligence platform. It ingests customer review histories, extracts core pain points, and excavates "hybrid personas" based on real customer data. It then simulates how these specific customer archetypes will react to new business decisions (a "collision analysis"), providing the business owner with traceable, data-driven advice.

## Core Features

*   **Review Ingestion & Persona Excavation:** Upload reviews via CSV/JSON or paste raw review text to automatically identify key customer segments and recurring pain points.
*   **Multi-Persona Simulator:** Propose a business change (e.g., "I want to raise prices by 10%"). Sylon runs a collision analysis, simulating how each excavated persona will react based on their historical preferences.
*   **Voice-Native Integration:** Conversational voice agent powered by ElevenLabs, embedded in an interactive GSAP Ethereal Orb on the landing page.
*   **Strategist Chat:** Text-based chat interface where the business owner can simulate scenarios, ingest reviews, get recommendations, or ask general strategy questions.
*   **Competitor Analysis Fallback:** If you don't have reviews, Sylon generates synthetic personas and fetches real competitor reviews via the Google Places API to ground its advice.

## Architecture & Data Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                        FRONTEND (Next.js)                          │
│                        http://localhost:3000                        │
│                                                                     │
│  ┌──────────┐   ┌──────────────┐   ┌────────────────────────────┐  │
│  │  Landing  │   │  /chat page  │   │  /upload page              │  │
│  │  Page     │   │              │   │                            │  │
│  │  ┌──────┐ │   │  POST        │   │  POST                     │  │
│  │  │ Orb  │ │   │  /api/chat   │   │  /api/business/            │  │
│  │  │(11L) │ │   │              │   │    upload-reviews          │  │
│  │  └──────┘ │   └──────┬───────┘   └─────────────┬──────────────┘  │
│  └──────────┘          │                          │                 │
│                         │    Next.js Rewrite       │                 │
│                         │    /api/* → :8000/*      │                 │
└─────────────────────────┼──────────────────────────┼─────────────────┘
                          │                          │
                          ▼                          ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     BACKEND (FastAPI)                               │
│                     http://localhost:8000                            │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │  Orchestrator (openserv/orchestrator.py)                    │    │
│  │                                                             │    │
│  │  ┌──────────┐    ┌───────────┐    ┌──────────────────────┐  │    │
│  │  │  Router   │──▶│ SIMULATE  │──▶│ Collision Simulator   │  │    │
│  │  │ (Gemini)  │   │ CHAT      │   │ (Cerebras)            │  │    │
│  │  │           │   │ INGEST    │   ├──────────────────────┤  │    │
│  │  │           │   │ RECOMMEND │   │ Strategist (Cerebras) │  │    │
│  │  └──────────┘    └───────────┘   └──────────────────────┘  │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                              │                                      │
│                              ▼                                      │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │  Persistence (SQLite)                                       │    │
│  │  businesses, reviews, personas, painpoints, collision_logs  │    │
│  └─────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
```

### Component Breakdown

1.  **Server (`openserv/server.py`):** FastAPI endpoints — `/chat` for the strategist, `/business/upload-reviews` for bulk data uploads, `/health` for status checks.
2.  **Orchestrator (`openserv/orchestrator.py`):** Master pipeline. Routes intents and manages the flow between ingestion, simulation, recommendations, and conversational responses. Maintains per-business session state.
3.  **Agents (`agents/`):**
    *   **Router:** Classifies user intent into `SIMULATE | CHAT | INGEST | RECOMMEND` (Gemini structured output).
    *   **Simulator:** Runs proposed changes against specific personas (Cerebras).
    *   **Strategist:** Synthesizes multi-persona collision results into conversational advice (Cerebras).
    *   **Persona Factory & Painpoint Extractor:** Analyzes reviews to build grounded customer profiles.
4.  **Persistence (`openserv/persistence.py`):** SQLite-backed storage for businesses, review batches, normalized reviews, painpoint snapshots, personas, collision logs, and recommendation logs.
5.  **LLM Client (`agents/llm_client.py`):** Centralized client with retry + exponential backoff for rate limiting across both provider APIs.
6.  **Frontend (`frontend/`):** Next.js app with GSAP-animated landing page, ElevenLabs voice agent, text chat, and review upload page. Proxies all `/api/*` requests to the FastAPI backend via Next.js rewrites.

## Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | Next.js 16, React 19, GSAP, Tailwind CSS | Landing page, chat, upload UI |
| Voice Agent | ElevenLabs Conversational AI | Real-time voice-to-voice interaction via the Ethereal Orb |
| API Server | FastAPI + Uvicorn | Webhook endpoints, REST API |
| Router Agent | Google Gemini 2.0 Flash | Structured intent classification |
| Core Intelligence | Cerebras (Qwen-3-235b) | Simulation, strategist, persona extraction |
| Competitor Data | Google Places API | Fetching real competitor reviews |
| Persistence | SQLite | Embedded database for all application state |
| Hosting (Planned) | QuikDB Compute | Decentralized backend hosting |
| Auth (Planned) | Privy | Web2-friendly authentication |

---

## Getting Started — Full E2E Setup

### Prerequisites

*   **Python 3.10+** with `pip`
*   **Node.js 18+** with `npm`
*   **API Keys:** Cerebras, Google Gemini (required); Google Places, ElevenLabs (optional)

### 1. Clone & Enter the Project

```bash
git clone https://github.com/your-org/Sylon.git
cd Sylon
```

### 2. Backend Setup

```bash
# Create and activate a virtual environment
python -m venv venv
source venv/bin/activate   # Linux/macOS
# venv\Scripts\activate    # Windows

# Install Python dependencies
pip install -r requirements.txt
```

Create a `.env` file in the **project root** with your API keys:

```env
# ── Required ──────────────────────────────────
CEREBRAS_API_KEY=your_cerebras_api_key
GEMINI_API_KEY=your_gemini_api_key

# ── Optional ──────────────────────────────────
GOOGLE_PLACES_API_KEY=           # Enables competitor review fallback personas
SYLON_DB_PATH=data/sylon.db     # SQLite database location (default: data/sylon.db)

# ── Tuning (defaults shown) ──────────────────
CEREBRAS_MODEL=qwen-3-235b-a22b-instruct-2507
GEMINI_MODEL=gemini-2.0-flash-exp
SYLON_PERSONA_COUNT=2
SYLON_DEBUG_MODE=False
```

### 3. Frontend Setup

```bash
cd frontend
npm install
```

Create `frontend/.env.local`:

```env
# ── ElevenLabs Voice Agent (optional) ─────────
NEXT_PUBLIC_ELEVENLABS_AGENT_ID=your_elevenlabs_agent_id

# ── Backend URL override (default: http://localhost:8000) ─
# SYLON_API_URL=http://localhost:8000
```

> **Note:** `SYLON_API_URL` only needs to be set if the FastAPI backend is running on a different host/port. The Next.js rewrite in `next.config.ts` proxies all `/api/*` requests to this URL.

### 4. Seed Demo Data (Optional)

Pre-populate the SQLite database with a sample business, reviews, personas, and a collision log:

```bash
# From the project root
python scripts/seed_demo.py
```

This creates a "Lagos Tech Cafe" business (`biz_demo_123`) with 3 reviews, 2 personas ("The Deep Worker" and "The Quick Commuter"), painpoint snapshots, and a sample collision log.

### 5. Start Both Servers

You need **two terminal sessions** running simultaneously:

**Terminal 1 — Backend (FastAPI on port 8000):**

```bash
# From the project root, with venv activated
uvicorn openserv.server:app --reload --port 8000
```

**Terminal 2 — Frontend (Next.js on port 3000):**

```bash
cd frontend
npm run dev
```

### 6. Verify the Connection

```bash
# Health check — should return {"status": "ok", ...}
curl http://localhost:8000/health
```

Then open **http://localhost:3000** in your browser.

---

## E2E Testing Guide

Once both servers are running, walk through these scenarios to verify end-to-end functionality:

### Test 1: Health Check

```bash
curl http://localhost:8000/health
```

**Expected:** `{"status": "ok", "service": "sylon-api", "persistence": "sqlite", "database": "ok"}`

### Test 2: Landing Page & Voice Agent

1. Open `http://localhost:3000`
2. Verify the animated Ethereal Orb renders with GSAP animations (floating, vortex rings, stardust particles)
3. If `NEXT_PUBLIC_ELEVENLABS_AGENT_ID` is configured:
   - Click the orb to start a voice session
   - Grant microphone permissions when prompted
   - The status pill below the orb should change to "Sylon is listening..."
   - Speak a scenario — the orb core should pulse when Sylon responds
4. Verify the theme toggle (sun/moon icon in the navbar) switches between light and dark mode

### Test 3: Text Chat (Strategist Oracle)

1. Navigate to `http://localhost:3000/chat`
2. Send a greeting: `"Hello, what can you do?"`
   - **Expected:** Router classifies as `CHAT`, Sylon responds conversationally (2-3 sentences)
3. Send a simulation scenario: `"What if I raise my prices by 15%?"`
   - **Expected:** Router classifies as `SIMULATE`, the multi-persona collision pipeline runs, and Sylon returns synthesized strategic advice
4. If demo data is seeded, send: `"Give me recommendations for my business"`
   - **Expected:** Router classifies as `RECOMMEND`, Sylon returns data-backed strategic recommendations grounded in the seeded personas and painpoints

### Test 4: Review Upload

1. Navigate to `http://localhost:3000/upload`
2. Enter a Business ID (or use the default `biz_demo_123`)
3. Upload a CSV file with columns like `text`, `rating`, `author_name`, `date`
4. Click "Upload & Excavate Personas"
   - **Expected:** The response JSON shows `reviews_ingested`, `painpoints`, `personas`, and `persistence.status: "saved"`

### Test 5: Review Ingestion via Chat

1. Go to `http://localhost:3000/chat`
2. Paste raw review text directly into the chat, e.g.:
   ```
   Here are some reviews: "Great food but terrible wait times" - 3 stars.
   "Love the ambiance, will come back!" - 5 stars.
   "Staff was rude and the place was dirty" - 1 star.
   ```
   - **Expected:** Router classifies as `INGEST`, Sylon parses the reviews, extracts painpoints, excavates personas, and confirms what it found

### Test 6: Inspect Persisted Data

After running any of the above tests:

```bash
python scripts/inspect_db.py
```

**Expected:** Shows all businesses, reviews, personas, painpoint snapshots, and collision logs persisted in SQLite.

### Test 7: Direct API Testing (No Frontend)

```bash
# Chat endpoint
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{"text": "What if I add a delivery option?", "business_id": "biz_demo_123"}'

# Upload endpoint
curl -X POST http://localhost:8000/business/upload-reviews \
  -F "file=@path/to/reviews.csv" \
  -F "business_id=biz_demo_123"
```

---

## Frontend → Backend Connection

The frontend and backend communicate through a **Next.js rewrite proxy** configured in `frontend/next.config.ts`:

```typescript
// All /api/* requests are rewritten to the FastAPI backend
{
  source: "/api/:path*",
  destination: `${apiUrl}/:path*`,  // defaults to http://localhost:8000
}
```

| Frontend Route | Proxied To | FastAPI Endpoint |
|---------------|-----------|-----------------|
| `POST /api/chat` | `http://localhost:8000/chat` | `server.py → chat_endpoint()` |
| `POST /api/business/upload-reviews` | `http://localhost:8000/business/upload-reviews` | `server.py → upload_reviews()` |
| `GET /api/health` | `http://localhost:8000/health` | `server.py → health()` |

Session continuity is maintained by persisting the `business_id` in the browser's `localStorage` under the key `sylon_business_id`. This ID is sent with every request so the backend can load the correct session, personas, and painpoint context.

---

## CLI Interface

You can interact with Sylon directly via the command line without starting any server:

```bash
python openserv/orchestrator.py
```

This starts an interactive REPL where you can type scenarios and receive strategist responses.

---

## Docker

```bash
docker-compose up --build
```

This builds and runs the FastAPI backend. The frontend must be started separately with `npm run dev` in the `frontend/` directory (or deployed as a standalone container).

---

## Project Structure

```
Sylon/
├── agents/                  # AI agent modules
│   ├── llm_client.py        # Cerebras + Gemini client with retry logic
│   ├── persona_factory.py   # Persona excavation and management
│   ├── rec.py               # Recommendation engine
│   ├── review_ingest.py     # Review parsing and normalization
│   └── reviews.py           # Review data utilities
├── frontend/                # Next.js frontend
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx     # Landing page (Ethereal Orb + voice agent)
│   │   │   ├── chat/        # Strategist chat interface
│   │   │   ├── upload/      # Review upload page
│   │   │   ├── layout.tsx   # Root layout with ThemeProvider
│   │   │   └── globals.css  # Design system and custom styles
│   │   └── components/
│   │       ├── EtherealOrb.tsx    # GSAP-animated voice orb
│   │       ├── Navbar.tsx         # Navigation bar
│   │       ├── ThemeProvider.tsx   # next-themes wrapper
│   │       └── ThemeToggle.tsx    # Dark/light mode toggle
│   ├── next.config.ts       # API proxy rewrite rules
│   └── .env.local           # Frontend environment variables
├── openserv/                # Backend orchestration
│   ├── server.py            # FastAPI endpoints
│   ├── orchestrator.py      # Master routing + pipeline
│   ├── persistence.py       # SQLite persistence service
│   ├── tools.py             # Tool functions (simulation, ingestion, etc.)
│   └── agents.yaml          # Agent system prompts and tool mappings
├── scripts/
│   ├── seed_demo.py         # Seed SQLite with demo data
│   └── inspect_db.py        # Inspect persisted data
├── data/                    # SQLite database storage
├── .env.example             # Backend environment template
├── requirements.txt         # Python dependencies
└── docker-compose.yml       # Docker configuration
```
