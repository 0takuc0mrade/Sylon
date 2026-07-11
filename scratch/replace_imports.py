import os
import glob

files = glob.glob('/Users/ikhaisoshuare/Cascade/agents/**/*.py', recursive=True) + \
        glob.glob('/Users/ikhaisoshuare/Cascade/openserv/**/*.py', recursive=True)

for filepath in files:
    with open(filepath, 'r') as f:
        content = f.read()
    
    if 'agents.llm_client' in content:
        new_content = content.replace('agents.llm_client', 'agents.alibaba_integration')
        with open(filepath, 'w') as f:
            f.write(new_content)
        print(f"Updated {filepath}")
