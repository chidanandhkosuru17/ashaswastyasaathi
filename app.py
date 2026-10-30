#!/usr/bin/env python3
"""
SwasthyaSaathi CLI & Evaluation Runner.
Reliable Health Guidance, Even Without a Network.
"""
import sys
import argparse
from FULL_CODE.assistant.answer_engine import process_question
from FULL_CODE.submission.generate_submission import generate_all_submissions
from evaluate import evaluate_system

def main():
    parser = argparse.ArgumentParser(description="SwasthyaSaathi CLI Companion")
    parser.add_argument("--ask", type=str, help="Ask a healthcare protocol question in natural language or Hinglish")
    parser.add_argument("--evaluate", action="store_true", help="Run official H5 benchmark evaluation on dev truth")
    parser.add_argument("--generate-submission", action="store_true", help="Generate all three submission files in submission/")

    args = parser.parse_args()

    if args.ask:
        print(f"\n--- INQUIRY: {args.ask} ---")
        res = process_question(args.ask)
        if res["escalate"]:
            print(f"🚨 [URGENT EMERGENCY ESCALATION]")
            print(f"Danger Category: {res['danger_category']}")
            print(f"Protocol Citation: {', '.join(res['cited_section_ids'])}")
            print(f"Guidance: {res['answer_text']}")
            print(f"Referral Facility: Chandrapuri District Hospital (Call 108)")
        elif res["refused"]:
            print(f"⛔ [SCOPE REFUSED]")
            print(f"Guidance: {res['answer_text']}")
            print(f"Citations: {', '.join(res['cited_section_ids'])}")
        else:
            print(f"✓ [PROTOCOL GROUNDED ANSWER]")
            print(f"Answer: {res['answer_text']}")
            print(f"Leaf Citations: {', '.join(res['cited_section_ids'])}")
        print(f"Monotonic CPU Latency: {res['latency_ms']} ms\n")
    elif args.evaluate:
        evaluate_system("submission", "data/dev_truth.jsonl")
    elif args.generate_submission:
        generate_all_submissions()
    else:
        print("SwasthyaSaathi Frontline Healthcare Companion")
        print("Usage:")
        print("  python3 app.py --ask 'Pregnancy mein bleeding ho rahi hai'")
        print("  python3 app.py --evaluate")
        print("  python3 app.py --generate-submission")

if __name__ == "__main__":
    main()
