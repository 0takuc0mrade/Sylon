import os
import json
import logging
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client

logger = logging.getLogger('sylon.fivetran_mcp')

async def call_fivetran_mcp(connector_id: str) -> dict:
    """
    Invokes the Fivetran MCP server at runtime to trigger a sync.
    If the MCP server is not running locally, catches the exception and falls back to mock.
    """
    logger.info(f"[MCP] Attempting connection to Fivetran MCP Server for connector {connector_id}")
    
    # Example MCP standard connection payload
    server_params = StdioServerParameters(
        command="npx",
        args=["-y", "@fivetran/mcp-server"],
        env=os.environ.copy()
    )

    try:
        async with stdio_client(server_params) as (read, write):
            async with ClientSession(read, write) as session:
                await session.initialize()
                
                # Call the Fivetran sync tool exposed by the MCP server
                result = await session.call_tool("sync_connector", arguments={"connector_id": connector_id})
                
                logger.info(f"[MCP] Fivetran Sync Triggered via MCP: {result}")
                return {"status": "success", "data": result}
    except Exception as e:
        logger.warning(f"[MCP] Fivetran MCP server unavailable ({e}). Falling back to REST API mock.")
        return {"status": "fallback", "message": "Using local CSV pipeline."}
