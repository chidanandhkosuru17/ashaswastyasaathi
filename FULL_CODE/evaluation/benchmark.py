"""
Automated Benchmark Runner for Chandrapuri Development Dataset.
Runs all 40 dev questions and computes the official score.
"""
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from evaluate import evaluate_system

def run_development_benchmark():
    return evaluate_system("submission", "data/dev_truth.jsonl")

if __name__ == "__main__":
    run_development_benchmark()
