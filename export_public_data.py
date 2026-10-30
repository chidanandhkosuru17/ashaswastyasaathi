#!/usr/bin/env python3
"""
Export data to public/data/ for direct zero-latency browser access.
"""
import os
import json
import csv
import glob
import re

os.makedirs("public/data", exist_ok=True)

# 1. ASHAs
ashas = list(csv.DictReader(open("data/ashas.csv", encoding="utf-8")))
with open("public/data/ashas.json", "w", encoding="utf-8") as f:
    json.dump(ashas, f, indent=2)

# 2. Households
households = list(csv.DictReader(open("data/households.csv", encoding="utf-8")))
with open("public/data/households.json", "w", encoding="utf-8") as f:
    json.dump(households, f, indent=2)

# 3. Members
members = list(csv.DictReader(open("data/household_register.csv", encoding="utf-8")))
with open("public/data/household_register.json", "w", encoding="utf-8") as f:
    json.dump(members, f, indent=2)

# 4. Protocols
protocols = []
md_files = sorted(glob.glob("data/protocols/*.md"))
for fpath in md_files:
    fname = os.path.basename(fpath)
    with open(fpath, "r", encoding="utf-8") as f:
        content = f.read()
    # Extract title
    title_match = re.search(r'#\s+([^\n]+)', content)
    doc_title = title_match.group(1).strip() if title_match else fname

    # Extract sections
    sections = []
    parts = re.split(r'\n(?=###\s+[A-Z]{3}-\d+\.\d+)', content)
    for part in parts:
        m = re.search(r'###\s+([A-Z]{3}-\d+\.\d+):\s*([^\n]+)', part)
        if m:
            sec_id = m.group(1).strip()
            sec_title = m.group(2).strip()
            body = part[m.end():].strip()
            sections.append({
                "section_id": sec_id,
                "title": sec_title,
                "content": body
            })

    code_prefix = fname.split("_")[1]
    protocols.append({
        "id": code_prefix,
        "filename": fname,
        "title": doc_title,
        "full_markdown": content,
        "sections": sections
    })

with open("public/data/protocols.json", "w", encoding="utf-8") as f:
    json.dump(protocols, f, indent=2)

# 5. Dev truth & questions
dev_truth = [json.loads(line) for line in open("data/dev_truth.jsonl", encoding="utf-8") if line.strip()]
with open("public/data/dev_truth.json", "w", encoding="utf-8") as f:
    json.dump(dev_truth, f, indent=2)

# 6. Test questions
test_q = list(csv.DictReader(open("data/questions_test.csv", encoding="utf-8")))
with open("public/data/questions_test.json", "w", encoding="utf-8") as f:
    json.dump(test_q, f, indent=2)

# 7. Footprint
if os.path.exists("submission/H5_footprint.json"):
    fp = json.load(open("submission/H5_footprint.json", encoding="utf-8"))
    with open("public/data/submission_footprint.json", "w", encoding="utf-8") as f:
        json.dump(fp, f, indent=2)

print("Exported data to public/data/ successfully!")
