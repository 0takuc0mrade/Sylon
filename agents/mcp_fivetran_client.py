# Fivetran REST API Integration (Option 2 per hackathon docs)
# Authentication: API Key + Secret via HTTPBasicAuth
# Reference: https://fivetran.com/docs/rest-api/getting-started#authentication

import os
import time
import json
import uuid
import logging

logger = logging.getLogger('sylon.fivetran')
logger.setLevel(logging.INFO)
if not logger.handlers:
    handler = logging.StreamHandler()
    handler.setFormatter(logging.Formatter('[%(asctime)s] [%(name)s] %(message)s', datefmt='%Y-%m-%d %H:%M:%S'))
    logger.addHandler(handler)


class FivetranAPIClient:
    """
    Integrates with the Fivetran REST API to give Sylon's agent pipeline
    the ability to trigger fresh data syncs before making strategic decisions.

    Two modes:
      - Live: Uses real Fivetran API credentials (HTTPBasicAuth)
      - Mock: Simulates sync responses for local development/demo
    """

    def __init__(self):
        self.api_key = os.environ.get("FIVETRAN_API_KEY")
        self.api_secret = os.environ.get("FIVETRAN_API_SECRET")
        self.is_connected = bool(self.api_key and self.api_secret)
        if self.is_connected:
            logger.info("[FIVETRAN] API credentials detected — live mode enabled")
        else:
            logger.info("[FIVETRAN] No credentials — running in mock mode")

    def list_tools(self):
        """Returns the available Fivetran tools the agent can invoke."""
        return [
            {
                "name": "sync_connector",
                "description": "Trigger an immediate data sync for a Fivetran connector to pull the latest customer reviews and sales data.",
                "input_schema": {
                    "type": "object",
                    "properties": {
                        "connector_id": {"type": "string", "description": "The Fivetran connector ID"}
                    },
                    "required": ["connector_id"]
                }
            },
            {
                "name": "check_sync_status",
                "description": "Check if a Fivetran sync has completed successfully.",
                "input_schema": {
                    "type": "object",
                    "properties": {
                        "connector_id": {"type": "string"}
                    },
                    "required": ["connector_id"]
                }
            },
            {
                "name": "list_connectors",
                "description": "List all available Fivetran connectors in the account to discover data sources dynamically.",
                "input_schema": {
                    "type": "object",
                    "properties": {},
                }
            },
        ]

    def call_tool(self, name: str, arguments: dict):
        """Executes a Fivetran tool call via the REST API."""
        if not self.is_connected:
            logger.info(f"[FIVETRAN] [MOCK] Tool call: {name}")
            return self._mock_call_tool(name, arguments)

        import requests
        from requests.auth import HTTPBasicAuth
        auth = HTTPBasicAuth(self.api_key, self.api_secret)

        if name == "sync_connector":
            connector_id = arguments.get("connector_id")
            url = f"https://api.fivetran.com/v1/connectors/{connector_id}/force"
            response = requests.post(url, auth=auth)
            if response.status_code in [200, 201]:
                logger.info(f"[FIVETRAN] Sync triggered for connector {connector_id}")
                return {"status": "success", "message": f"Successfully triggered sync for connector {connector_id}"}
            else:
                logger.error(f"[FIVETRAN] API error {response.status_code}: {response.text[:200]}")
                return {"status": "error", "code": response.status_code, "message": response.text[:200]}

        elif name == "check_sync_status":
            connector_id = arguments.get("connector_id")
            url = f"https://api.fivetran.com/v1/connectors/{connector_id}"
            response = requests.get(url, auth=auth)
            if response.status_code == 200:
                data = response.json().get("data", {})
                status = data.get("status", {})
                sync_state = status.get("sync_state")
                logger.info(f"[FIVETRAN] Connector {connector_id} sync_state={sync_state}")
                return {"status": "success", "sync_state": sync_state, "is_syncing": sync_state == "syncing"}
            else:
                logger.error(f"[FIVETRAN] API error {response.status_code}: {response.text[:200]}")
                return {"status": "error", "code": response.status_code, "message": response.text[:200]}

        elif name == "list_connectors":
            url = "https://api.fivetran.com/v1/connectors"
            response = requests.get(url, auth=auth)
            if response.status_code == 200:
                items = response.json().get("data", {}).get("items", [])
                connectors = [
                    {
                        "id": c.get("id"),
                        "service": c.get("service"),
                        "schema": c.get("schema"),
                        "status": c.get("status", {}).get("sync_state"),
                    }
                    for c in items[:10]
                ]
                logger.info(f"[FIVETRAN] Found {len(connectors)} connectors")
                return {"status": "success", "connectors": connectors}
            else:
                logger.error(f"[FIVETRAN] API error {response.status_code}: {response.text[:200]}")
                return {"status": "error", "code": response.status_code, "message": response.text[:200]}

        return {"status": "error", "message": f"Unknown tool: {name}"}

    def _mock_call_tool(self, name: str, arguments: dict):
        """Mock implementation for local development and demo recording."""
        if name == "sync_connector":
            logger.info(f"[FIVETRAN] [MOCK] Triggering sync for {arguments.get('connector_id')}...")
            time.sleep(1)  # simulate network latency
            return {"status": "success", "message": "Sync triggered successfully (mock)."}

        elif name == "check_sync_status":
            return {"status": "success", "sync_state": "scheduled", "is_syncing": False}

        elif name == "list_connectors":
            return {
                "status": "success",
                "connectors": [
                    {"id": "quarries_stiffened", "service": "google_sheets", "schema": "customer_reviews", "status": "connected"},
                    {"id": "polygon_rested", "service": "square", "schema": "pos_transactions", "status": "connected"},
                ]
            }

        return {"status": "error", "message": f"Unknown mock tool: {name}"}


fivetran_api_client = FivetranAPIClient()


def tool_trigger_fivetran_sync(business_id: str) -> dict:
    """
    Called by the Sylon Intent Router to autonomously pull fresh data
    before the Board of Directors agents make strategic recommendations.
    """
    logger.info(f"[{business_id}] Agent triggering Fivetran sync")

    connector_id = os.environ.get("FIVETRAN_CONNECTOR_ID", "mock_connector")
    result = fivetran_api_client.call_tool("sync_connector", {"connector_id": connector_id})
    return result
