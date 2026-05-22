# DSN X BCT LLM Agent Challenge: Task A Solution Paper
**Team Name:** Cascade
**Team/Candidate:** Ikhais Hillary
**Project:** Sylon
**Task:** Task A (User Modeling)

## 1. Abstract & Approach
While traditional user modeling relies on rigid collaborative filtering or static matrix factorization, human behavior is intrinsically contextual, dynamic, and prone to "behavioral drift." Sylon solves Task A through **Grounded Generative Personas**. 

Instead of representing a user as a vector of preferences, Sylon's *Archaeologist Agent* ingests raw, unstructured review histories (via JSON, CSV, PDF, or text), extracts critical pain points, and clusters the data into distinct, psychologically rich behavioral archetypes. These personas are not generic "buyer profiles"; they are explicitly infused with authentic Nigerian cultural nuances, utilizing local slang (e.g., *abeg*, *omo*) and reflecting localized consumer priorities (e.g., generator noise tolerance, informal service expectations). 

## 2. Architecture: The Behavioral Synthesis Engine
Sylon employs a multi-agent orchestrated architecture, designed to balance generative flexibility with strict data grounding.

### The Archaeologist (Ingestion & Extraction)
When a business loads a dataset, the Archaeologist chunks the data and runs a Map-Reduce pipeline against a large LLM (Cerebras Llama-3/Qwen) to extract recurring complaints, praise, and trends. It then synthesizes these signals into JSON-formatted persona objects containing:
- **Narrative Profile:** A character portrait grounded in actual review quotes, written with Nigerian cultural context.
- **Behavioral Drifts:** Extracted shifts in preference over time (e.g., "Initially forgiving of wait times, now increasingly impatient").
- **Rating Fidelity:** The user's historical `avg_rating` and `rating_variance` to inform simulated outputs.
- **Grounding Quotes:** Exact, verifiable strings from the dataset.

### The Simulator (Predictive Collision)
To generate a simulated review and star rating for an unseen item/scenario, Sylon routes the input to the Simulator. The Simulator takes a generated persona and forces a "Collision Analysis" against the proposed business scenario (the "unseen item"). 
By leveraging the persona's *Narrative Profile* and *Grounding Quotes*, the Simulator predicts exact friction points and outputs a simulated reaction, tone, and star rating that strictly adheres to the user's established psychological baseline.

## 3. Handling API Constraints (Cerebras-to-Gemini Failover)
During large-scale ingestion (e.g., processing 65,000 Yelp/Amazon reviews), Token Quota Exceeded (429) errors are inevitable. To ensure uninterrupted user modeling, Sylon implements an automatic, exponential-backoff failover layer. If Cerebras exhausts its daily quota, the system seamlessly routes the prompt to Google Gemini 2.0 Flash, dynamically adjusting the `response_mime_type` to guarantee strict JSON schema compliance during the transition.

## 4. Evaluation & Behavioral Fidelity
Because Sylon's personas are mapped directly to verbatim quotes and `avg_rating` statistics from the source dataset, the generated reviews maintain exceptionally high behavioral fidelity. The Simulator refuses to hallucinate interactions; it projects the persona's known biases onto the explicitly provided parameters of the unseen item, resulting in highly realistic, Nigerian-contextualized simulated ratings.

*To evaluate Task A in the Sylon platform, navigate to the Chat interface and click "Simulate Audience Reaction".*
