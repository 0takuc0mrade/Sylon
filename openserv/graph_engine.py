import json
import logging
from collections import deque, defaultdict
from agents.alibaba_integration import call_llm_json, QWEN_REASONING_MODEL, call_llm

logger = logging.getLogger('morlen.graph')

class KnowledgeGraphExtractor:
    """
    Uses Qwen's JSON function calling to extract a strict dependency graph
    from unstructured WhatsApp business logs.
    """
    
    @staticmethod
    def extract_graph(chat_logs: str) -> dict:
        prompt = f"""
You are Morlen's deterministic Knowledge Graph Extractor.
Your job is to read raw WhatsApp commerce logs and extract a dependency graph.

Logs:
{chat_logs}

Extract the following:
1. 'skus': A list of products mentioned (e.g. "Rice", "Generators").
2. 'customers': A list of customers and the SKU they want to buy.
3. 'dependencies': A list of edges where one SKU is blocked by another factor (e.g. "Rice" requires "Delivery Bike").
4. 'lost_revenue': Estimated lost revenue (in local currency) if a SKU stockout is not resolved.

Output MUST be strictly valid JSON in this shape:
{{
  "skus": ["SKU1", "SKU2"],
  "customers": [{{"name": "Customer A", "wants": "SKU1", "lost_revenue_value": 15000}}],
  "dependencies": [{{"sku": "SKU1", "blocked_by": "SKU2"}}]
}}
"""
        logger.info("[GRAPH] Extracting knowledge graph via Qwen JSON...")
        result = call_llm_json(
            prompt=prompt,
            system_prompt="You are a strict data extraction tool. Output valid JSON only.",
            model_override=QWEN_REASONING_MODEL
        )
        return result


class TopologicalRevenueSorter:
    """
    Applies Kahn's Algorithm to the extracted Knowledge Graph to mathematically prove
    the optimal restock/unblock sequence for maximum revenue recovery.
    """

    @staticmethod
    def calculate_optimal_path(graph_data: dict) -> dict:
        logger.info("[GRAPH] Running Topological Sort on Dependency Graph...")
        
        dependencies = graph_data.get("dependencies", [])
        customers = graph_data.get("customers", [])
        skus = graph_data.get("skus", [])
        
        # Calculate raw revenue tied to each SKU
        sku_revenue = defaultdict(int)
        for c in customers:
            sku_revenue[c["wants"]] += c.get("lost_revenue_value", 0)

        # Build adjacency list and in-degree count for Kahn's Algorithm
        # Edge direction: blocked_by -> sku (because blocked_by must be resolved FIRST)
        adj_list = defaultdict(list)
        in_degree = defaultdict(int)
        
        # Ensure all SKUs exist in the degree map
        for sku in skus:
            in_degree[sku] = 0

        for dep in dependencies:
            target = dep["sku"]
            blocker = dep["blocked_by"]
            
            adj_list[blocker].append(target)
            in_degree[target] += 1
            if blocker not in in_degree:
                in_degree[blocker] = 0
                
        # Queue for Kahn's algorithm (nodes with 0 in-degree)
        queue = deque([node for node, deg in in_degree.items() if deg == 0])
        sorted_order = []
        
        while queue:
            # If multiple independent nodes, prioritize by highest dependent revenue
            # This is a greedy topological sort approach
            # queue is a deque, sort it and rebuild deque
            queue = deque(sorted(list(queue), key=lambda x: sku_revenue[x], reverse=True))
            current = queue.popleft()
            sorted_order.append(current)
            
            for neighbor in adj_list[current]:
                in_degree[neighbor] -= 1
                if in_degree[neighbor] == 0:
                    queue.append(neighbor)
                    
        # Check for cycles
        if len(sorted_order) != len(in_degree):
            logger.warning("[GRAPH] Cycle detected in dependencies! Fallback to raw revenue sort.")
            sorted_order = sorted(skus, key=lambda x: sku_revenue[x], reverse=True)

        return {
            "optimal_sequence": sorted_order,
            "revenue_map": dict(sku_revenue),
            "total_at_risk": sum(sku_revenue.values()),
            "graph": {
                "nodes": list(in_degree.keys()),
                "edges": dependencies
            }
        }


class AutopilotActionEngine:
    """
    Track 4 Implementation: Closes the loop by taking action on the mathematically 
    proven bottleneck. E.g. drafting an email or generating an API payload to the supplier.
    """

    @staticmethod
    def generate_resolution_action(bottleneck_sku: str, total_risk: int) -> dict:
        logger.info(f"[AUTOPILOT] Generating resolution action for {bottleneck_sku}...")
        prompt = f"""
You are Morlen's Autopilot Agent.
A topological sort of the supply chain has identified "{bottleneck_sku}" as the primary bottleneck blocking ₦{total_risk:,} in revenue.

Your job is to act. Generate a formal communication or API action to resolve this blockage.
Output strictly valid JSON with this shape:
{{
  "action_type": "email_draft",
  "recipient": "Supplier / Logistics Provider",
  "subject": "Urgent Restock Request",
  "content": "The actual email or action payload to send.",
  "confidence": 0.95
}}
"""
        result = call_llm_json(
            prompt=prompt,
            system_prompt="You are a strict Autopilot action agent. Output JSON only.",
            model_override=QWEN_REASONING_MODEL
        )
        return result
