import os
import json
import logging

logger = logging.getLogger(__name__)

class GCPVectorSearchClient:
    """
    Client for interfacing with Google Cloud Vertex AI Vector Search (formerly Matching Engine)
    and BigQuery for RAG (Retrieval-Augmented Generation).
    """
    def __init__(self, project_id=None, location="us-central1"):
        self.project_id = project_id or os.environ.get("GCP_PROJECT_ID")
        self.location = location
        self.initialized = False
        
        if self.project_id:
            try:
                from google.cloud import aiplatform
                from google.cloud import bigquery
                aiplatform.init(project=self.project_id, location=self.location)
                self.bq_client = bigquery.Client(project=self.project_id)
                self.initialized = True
                logger.info(f"[Vertex AI] Connected to Project {self.project_id}")
            except ImportError:
                logger.warning("[Vertex AI] GCP SDKs not installed. Running in mock mode.")
        else:
            logger.info("[Vertex AI] No GCP_PROJECT_ID provided. Running Vector Search in mock mode for hackathon development.")
            
    def get_embeddings(self, texts: list[str]):
        """
        Generates embeddings using Vertex AI's text-embedding-gecko model.
        """
        if self.initialized:
            try:
                from vertexai.language_models import TextEmbeddingModel
                model = TextEmbeddingModel.from_pretrained("text-embedding-004")
                embeddings = model.get_embeddings(texts)
                return [embedding.values for embedding in embeddings]
            except Exception as e:
                logger.error(f"[Vertex AI] Embedding error: {e}")
                
        # Mock embeddings
        logger.info(f"[Vertex AI] Generating mock embeddings for {len(texts)} chunks via GCP simulator.")
        return [[0.0] * 768 for _ in texts]
        
    def query_bigquery(self, query: str):
        """
        Executes a SQL query against BigQuery (or simulates it).
        """
        if self.initialized:
            try:
                query_job = self.bq_client.query(query)
                results = query_job.result()
                return [dict(row) for row in results]
            except Exception as e:
                logger.error(f"[BigQuery] Query error: {e}")
                
        # Mock BigQuery execution
        logger.info(f"[BigQuery] Executing simulated query: {query[:50]}...")
        return [{"row_count": 100, "status": "simulated_success", "data": "Mock data from BigQuery"}]

vector_search_client = GCPVectorSearchClient()
