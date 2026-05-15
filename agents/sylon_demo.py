import os
import json
import pandas as pd
from dotenv import load_dotenv
from cerebras.cloud.sdk import Cerebras

import sys
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if ROOT not in sys.path:
    sys.path.insert(0, ROOT)

# NOW you can import your agents normally
from agents.llm_client import call_cerebras
from agents.review_ingest import load_reviews
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'utilities'))
from sample import load_and_score_users
from persona import excavate_user
from reviews import run as stress_test
from rec import (
    build_segment_report,
    describe_segments,
    detect_drift_alerts,
    find_revenue_opportunities
)

load_dotenv()
client = Cerebras(api_key=os.environ.get("CEREBRAS_API_KEY"))


def generate_business_advisory(report, business_type):
# implementation and improvement stage. Takes the segment report and business type, returns concrete decisions: pricing, experience design, retention strategy.
    segment_summary = []
    for segment, data in report.items():
        segment_summary.append(
            f"{segment.upper().replace('_', ' ')}: {data['count']} customers | "
            f"avg rating {data['avg_rating']} | "
            f"avg useful votes {data['avg_useful_votes']} | "
            f"avg years active {data['avg_years_active']}"
        )

    segment_text = "\n".join(segment_summary)

    prompt = f"""
You are a business strategy analyst. You have behavioral data on a customer base,
segmented into four types based on how they engage over time.

The business is: {business_type}

CUSTOMER SEGMENTS:
{segment_text}

Segment definitions:
- OBSERVER: rare reviewer, long history, high influence per review. Their silence is patience running out.
- CRITICAL: low average rating, high useful votes. People trust their negativity. One bad experience goes public and sticks.
- INCONSISTENT: high total reviews but uneven — shows up in bursts triggered by strong experiences.
- FULLY COMMITTED: consistent, long-term, engaged across all phases.

Give this business three concrete strategic recommendations.
Not generic advice. Specific decisions based on exactly who their customers are.

Structure your response exactly like this:

PRICING STRATEGY:
[One specific pricing decision based on the segment makeup. Who to reward, how, and why.]

EXPERIENCE DESIGN:
[One specific investment in the customer experience based on what these segments punish or reward.]

RETENTION STRATEGY:
[One specific action to keep the most valuable segment engaged and prevent the most dangerous segment from going public.]

BIGGEST RISK RIGHT NOW:
[One sentence. The single most expensive mistake this business could make given their current customer composition.]

Be sharp. Be specific to {business_type}. No generic consulting language.
"""

    response = call_cerebras(prompt)
    return response


def run_sylon(business_type, business_path, category=None, business_id=None):
    os.makedirs('outputs', exist_ok=True)

    #  load the data 
    print("\n[1/6] Loading data...")
    #base = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    base = os.path.dirname(os.path.abspath(__file__))
    all_reviews = pd.read_csv(os.path.join(ROOT, 'data', 'sampled_reviews.csv'))
    categories = pd.read_csv(os.path.join(ROOT, 'data', 'business_categories.csv'))[['business_id', 'primary_category']]
    all_reviews = all_reviews.merge(categories, on='business_id', how='left')
    all_reviews['date'] = pd.to_datetime(all_reviews['date'])
    print(f"      {all_reviews['user_id'].nunique()} users | {len(all_reviews)} reviews loaded")
     
    # segment users
    print("\n[2/6] Segmenting users...")
    report = build_segment_report(all_reviews)
    segment_description = describe_segments(report)
    print(segment_description)

    # detect drift alerts
    print("\n[3/6] Detecting drift alerts...")
    persona_dir = 'outputs'
    personas = {}
    for fname in os.listdir(persona_dir):
        if fname.endswith('_persona.json'):
            user_id = fname.replace('_persona.json', '')
            with open(os.path.join(persona_dir, fname)) as f:
                personas[user_id] = json.load(f)

    alerts = detect_drift_alerts(all_reviews, personas)
    if alerts:
        print(f"      {len(alerts)} drift alert(s) found:")
        for alert in alerts:
            print(f"      → {alert['customer_name']} | {alert['signal']} | Risk: {alert['risk_level']}")
    else:
        print("      No significant drift detected in loaded personas.")

    # find revenue opportunities
    print("\n[4/6] Finding revenue opportunities...")
    opportunities = find_revenue_opportunities(all_reviews, personas)
    if opportunities:
        print(f"      {len(opportunities)} high-value customer(s) identified:")
        for opp in opportunities[:3]:
            print(f"      to {opp['customer_name']} | Premium score: {opp['premium_score']}")
    else:
        print("      No revenue opportunities found in loaded personas.")

    # profile top user
    print("\n[5/6] Excavating top user persona...")
    top_user = all_reviews.sort_values('richness_score', ascending=False).iloc[0]['user_id']
    print(f"      Excavating: {top_user}")
    persona = excavate_user(top_user, all_reviews)

    top_user_segment = next(
    (seg for seg, data in report.items()
     if any(u['user_id'] == top_user for u in data['users'])),
    'fully_committed'
)
    if persona:
        persona_path = f'outputs/{top_user}_persona.json'
        with open(persona_path, 'w') as f:
            json.dump(persona, f, indent=2, default=str)
        print(f"      Persona saved → {persona_path}")
    else:
        print("      Not enough review history to excavate this user.")
        return

    # stress test for the business
    print(f"\n[6/6] Running stress test for: {business_type}...")

    stress_results = stress_test(
    persona=persona,
    business_path=business_path,
    category=category,
    business_id=business_id,
    segment=top_user_segment
)
    if stress_results:
        for r in stress_results:
            print(f"\n{'='*60}")
            print(f"BUSINESS: {r['business']['name']}")
            print(f"\nCOLLISION ANALYSIS:\n{r['collision_analysis']}")
            print(f"\nPREDICTED REVIEW:\n{r['prediction']}")
    else:
        print("      No stress test results.")

    # advise the business 
    print(f"\n{'='*60}")
    print("SYLON BUSINESS ADVISORY")
    print(f"{'='*60}")
    advisory = generate_business_advisory(report, business_type)
    print(advisory)


    final_report = {
        'business_type': business_type,
        'segment_report': {
            k: {kk: vv for kk, vv in v.items() if kk != 'users'}
            for k, v in report.items()
        },
        'drift_alerts': alerts,
        'revenue_opportunities': opportunities[:5] if opportunities else [],
        'stress_test': stress_results if stress_results else [],
        'advisory': advisory
    }

    with open('outputs/sylon_final_report.json', 'w') as f:
        json.dump(final_report, f, indent=2, default=str)

    print("\nFull report saved → outputs/sylon_final_report.json")


if __name__ == "__main__":
    print("  SYLON: A Behavioral Intelligence Engine")

    business_type = input("\nWhat type of business are you? (e.g. restaurant, bar, hotel): ").strip()
    business_path = OS.PATH.JOIN(ROOT, 'data', 'yelp_academic_dataset_business.json')

    run_sylon(
        business_type=business_type,
        business_path=business_path,
        category=business_type
    )