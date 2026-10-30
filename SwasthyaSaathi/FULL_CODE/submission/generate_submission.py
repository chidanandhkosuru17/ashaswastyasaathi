"""
Submission Generator for SwasthyaSaathi.
Produces the three required files in the submission/ directory:
1. submission/H5_answers.jsonl
2. submission/H5_visit_list.csv
3. submission/H5_footprint.json
"""
import os
import sys
import csv
import json

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from FULL_CODE.assistant.answer_engine import process_question
from FULL_CODE.visit_planner.planner import generate_daily_visit_list
from FULL_CODE.evaluation.footprint import measure_footprint

def generate_all_submissions(
    test_questions_path: str = "data/questions_test.csv",
    register_path: str = "data/household_register.csv"
):
    print("Generating H5 Submission Files...")
    os.makedirs("submission", exist_ok=True)

    # 1. H5_answers.jsonl
    answers = []
    latencies = []
    with open(test_questions_path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            q_id = row["question_id"]
            q_text = row["question_text"]
            res = process_question(q_text, question_id=q_id)
            answers.append({
                "question_id": res["question_id"],
                "answer_text": res["answer_text"],
                "cited_section_ids": res["cited_section_ids"],
                "escalate": res["escalate"],
                "refused": res["refused"],
                "latency_ms": res["latency_ms"]
            })
            latencies.append(res["latency_ms"])

    with open("submission/H5_answers.jsonl", "w", encoding="utf-8") as f:
        for ans in answers:
            f.write(json.dumps(ans, ensure_ascii=False) + "\n")
    print(f"-> Generated submission/H5_answers.jsonl ({len(answers)} records)")

    # 2. H5_visit_list.csv
    visit_rows = generate_daily_visit_list(
        register_path=register_path,
        output_path="submission/H5_visit_list.csv"
    )
    print(f"-> Generated submission/H5_visit_list.csv ({len(visit_rows)} rows)")

    # 3. H5_footprint.json
    fp = measure_footprint(latencies)
    print("-> Generated submission/H5_footprint.json")

    return answers, visit_rows, fp

if __name__ == "__main__":
    generate_all_submissions()
