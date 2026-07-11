# The raw WhatsApp logs for the Morlen Demo
# Business: A large-scale wholesale distributor
# The Hidden Opportunity: The "Aha!" Dataset Trap.
# A naive AI will suggest restocking Arabian Oud because it has massive demand.
# Kahn's Algorithm will prove that Premium Glass Bottles must be restocked FIRST.

DEMO_CHAT_LOGS = [
    # --- NOISE: Normal Business Operations ---
    {"intent": "Question", "text": "Hi, do you deliver to Abuja? How much is the shipping fee?"},
    {"intent": "Purchase Intent", "text": "I want to buy the Baccarat Rouge 540. Is it still 120k?"},
    {"intent": "Complaint", "text": "My delivery was supposed to arrive yesterday and I haven't gotten it!"},
    
    # --- THE MASSIVE DEMAND (The Trap) ---
    {"intent": "Purchase Intent", "text": "I need 50 cartons of Arabian Oud for my store. (Lost Revenue: 2,500,000)"},
    {"intent": "Purchase Intent", "text": "Please, I want to pre-order 20 cartons of Arabian Oud. (Lost Revenue: 1,000,000)"},
    {"intent": "Purchase Intent", "text": "Do you have Arabian Oud in bulk? I have 30 cartons ordered by my clients. (Lost Revenue: 1,500,000)"},
    {"intent": "Purchase Intent", "text": "I will pay double if you can get me Arabian Oud today!"},
    
    # --- THE HIDDEN BOTTLENECK (The Mathematical Solution) ---
    {"intent": "Complaint", "text": "I asked your manager why the Arabian Oud is delayed, he said you don't have the Premium Glass Bottles to package them!"},
    {"intent": "Purchase Intent", "text": "I want to buy a few Premium Glass Bottles. (Lost Revenue: 50,000)"},
    {"intent": "Complaint", "text": "My factory is waiting for the Premium Glass Bottles, but you said they are stuck at the Apapa Port."},
    
    # --- THE ROOT CAUSE ---
    {"intent": "Purchase Intent", "text": "I need to clear my Apapa Port Containers. (Lost Revenue: 0)"},
    {"intent": "Complaint", "text": "The Apapa Port Containers can't be cleared because the Customs Clearance is delayed."},
    {"intent": "Purchase Intent", "text": "Can I pay for the Customs Clearance now? (Lost Revenue: 0)"},
    {"intent": "Complaint", "text": "I am waiting on the Customs Clearance document from the clearing agent."},
]
