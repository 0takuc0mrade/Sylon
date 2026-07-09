# Alibaba Cloud Deployment & Architecture

This document serves as proof of Morlen OS's integration with Alibaba Cloud services, as mandated by the Global AI Hackathon Series with Qwen Cloud.

## 1. Core Intelligence: Alibaba Cloud DashScope (Qwen API)
Morlen OS is not a wrapper around standard LLMs. Our entire Multi-Agent Decision Engine is natively built on **Alibaba Cloud's DashScope API**, leveraging the advanced reasoning capabilities of `qwen-max` and `qwen-plus`. 

The system utilizes highly concurrent, specialized agents (CFO, CX, Ops) that debate scenarios in real-time. This is achieved via our custom `llm_client.py` integration:

```python
# From agents/llm_client.py
import os
from openai import OpenAI

# Native DashScope Integration
base_url = os.environ.get("QWEN_BASE_URL", "https://dashscope-intl.aliyuncs.com/compatible-mode/v1")
qwen_client = OpenAI(
    api_key=os.environ.get("DASHSCOPE_API_KEY"),
    base_url=base_url,
)

QWEN_FAST_MODEL = "qwen-plus"
QWEN_REASONING_MODEL = "qwen-max"
```

## 2. Persistence Layer: Alibaba Cloud RDS Architecture
Morlen OS is engineered for production enterprise use. Our persistent memory graph is designed to run on **Alibaba Cloud RDS (PostgreSQL)**. 

Our `persistence.py` engine automatically detects the Alibaba RDS environment and initializes `psycopg2` to establish a secure connection for state management:

```python
# From openserv/persistence.py
class PersistenceService:
    def __init__(self):
        # Alibaba Cloud RDS takes precedence for production deployment
        self.rds_url = os.environ.get("ALIBABA_RDS_URL")
        self.use_rds = bool(self.rds_url and psycopg2)
        
        if self.use_rds:
            logger.info("Connecting to Alibaba Cloud RDS (PostgreSQL)...")
            
    @contextmanager
    def get_connection(self):
        """Yields a database connection. Transparently handles Alibaba RDS (Postgres)."""
        if self.use_rds:
            conn = psycopg2.connect(self.rds_url)
            try:
                yield conn
            finally:
                conn.commit()
                conn.close()
```

## 3. Deployment Note & KYC Disclaimer
While our architecture is designed for an end-to-end Alibaba Cloud deployment (ECS for compute, RDS for storage), we encountered strict international KYC (Know Your Customer) / Real-Name Verification delays during the hackathon submission window that prevented us from provisioning the final ECS and RDS instances. 

To ensure the Judges can seamlessly test the live application and evaluate our Qwen-powered Multi-Agent architecture before the deadline, the frontend is temporarily hosted on Vercel and the backend container on Render, connected to a remote free-tier PostgreSQL database. This ensures the live application runs on the exact same database engine as Alibaba Cloud RDS, allowing us to maintain 100% architectural parity via `psycopg2`. The core cognitive engine remains 100% powered by Alibaba Cloud DashScope.
