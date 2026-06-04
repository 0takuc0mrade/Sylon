import sys
import os
from dotenv import load_dotenv

load_dotenv()

from openserv.orchestrator import run_simulation
print(run_simulation("what if I change my menu?", "test_123"))
