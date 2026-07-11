import json
import logging
from datetime import datetime

from openserv.persistence import persistence_service
try:
    from agents.alibaba_integration import call_llm_json
except ImportError:
    import sys, os
    sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
    from agents.alibaba_integration import call_llm_json

logger = logging.getLogger('morlen.intelligence')

def generate_executive_brief(business_id: str) -> dict:
    """
    The True Decision Engine.
    Pulls raw memories from the database, feeds them into the LLM, and extracts dynamic insights.
    """
    logger.info(f"[Intelligence Engine] Generating brief for {business_id}...")
    
    # 1. Fetch Business Profile
    profile = persistence_service.get_business_profile(business_id)
    business_name = profile.get("name", "Unknown Business") if profile else "Unknown Business"
    
    # 2. Fetch Raw Chat Logs (Memories)
    # We fetch up to 100 recent memories to provide sufficient context.
    memories = persistence_service.get_recent_memories(business_id, limit=100)
    
    if not memories or len(memories) < 3:
        # Not enough data to generate a meaningful brief
        return {
            "opportunities": [],
            "warnings": [
                {
                    "type": "Insufficient Data",
                    "title": "Awaiting More Customer Signals",
                    "description": "Morlen needs more customer conversations to generate reliable revenue forecasts."
                }
            ],
            "timeline": {
                "product": "Waiting for data...",
                "events": []
            }
        }

    # 3. Format the Context for the LLM
    context_lines = []
    for m in reversed(memories):
        # Clean up the text to save tokens
        text = m.get("text_content", "").replace("\n", " ")
        intent = m.get("intent", "unknown")
        # Format: [Intent] Message
        context_lines.append(f"[{intent}] {text}")
        
    chat_history = "\n".join(context_lines)
    
    # 4. Extract Knowledge Graph and Topological Sort
    try:
        from openserv.graph_engine import KnowledgeGraphExtractor, TopologicalRevenueSorter, AutopilotActionEngine
        
        # Build strict dependency graph from raw logs
        graph_data = KnowledgeGraphExtractor.extract_graph(chat_history)
        
        # Apply Kahn's Algorithm to mathematically prove optimal restock sequence
        sort_result = TopologicalRevenueSorter.calculate_optimal_path(graph_data)
        
        optimal_seq = sort_result.get("optimal_sequence", [])
        total_risk = sort_result.get("total_at_risk", 0)
        revenue_map = sort_result.get("revenue_map", {})
        
        autopilot_action = None
        if optimal_seq:
            primary_sku = optimal_seq[0]
            autopilot_action = AutopilotActionEngine.generate_resolution_action(primary_sku, total_risk)
        
        # Format the deterministic mathematical output back into the Executive Brief schema
        opportunities = []
        if optimal_seq:
            primary_sku = optimal_seq[0]
            opportunities.append({
                "type": "restock",
                "title": f"Topological Priority: {primary_sku}",
                "product_or_metric": primary_sku,
                "value_metric": f"₦{revenue_map.get(primary_sku, 0):,}",
                "metric_label": "Blocked Revenue Recoverable",
                "evidence": [
                    f"Kahn's Algorithm identified {primary_sku} as the primary dependency bottleneck.",
                    f"Unblocking this SKU unlocks ₦{revenue_map.get(primary_sku, 0):,} in downstream revenue."
                ]
            })
            
            for sku in optimal_seq[1:3]:
                opportunities.append({
                    "type": "lead",
                    "title": f"Secondary Unblock: {sku}",
                    "product_or_metric": sku,
                    "value_metric": f"₦{revenue_map.get(sku, 0):,}",
                    "metric_label": "Cascading Revenue",
                    "evidence": [f"Dependent on earlier graph resolution. Restock sequence priority."]
                })
        else:
            opportunities.append({
                "type": "lead",
                "title": "System Stable",
                "product_or_metric": "All SKUs",
                "value_metric": "₦0",
                "metric_label": "Blocked Revenue",
                "evidence": ["No dependency blockages detected in the graph."]
            })

        warnings = []
        if total_risk > 0:
            warnings.append({
                "type": "demand",
                "title": "Supply Chain Cascade Failure",
                "description": "Topological sort reveals compounding blockages.",
                "evidence": [
                    f"Total mathematical revenue at risk across the graph: ₦{total_risk:,}",
                    f"Graph edges detected: {len(sort_result.get('graph', {}).get('edges', []))}"
                ]
            })
            
        return {
            "opportunities": opportunities,
            "warnings": warnings,
            "timeline": {
                "product": "Topological Analysis Complete",
                "events": [
                    {
                        "day": "System Output",
                        "description": f"Graph extraction mapped {len(graph_data.get('skus', []))} SKUs and {len(graph_data.get('dependencies', []))} dependencies.",
                        "is_recommendation": False
                    },
                    {
                        "day": "Kahn's Algorithm",
                        "description": f"Mathematical sort completed. Optimal restock sequence generated: {', '.join(optimal_seq)}",
                        "is_recommendation": True
                    }
                ]
            },
            "topological_graph": sort_result,  # Pass the raw graph data to the frontend for visualization
            "autopilot_action": autopilot_action
        }

    except Exception as e:
        logger.error(f"[Intelligence Engine] Failed to generate brief: {e}")
        return {
            "opportunities": [],
            "warnings": [
                {
                    "type": "system_error",
                    "title": "Analysis Failed",
                    "description": "The graph engine encountered an error while processing the latest signals."
                }
            ],
            "timeline": {
                "product": "Error",
                "events": []
            }
        }
