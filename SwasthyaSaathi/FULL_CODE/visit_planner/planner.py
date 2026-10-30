"""
Visit Planner pipeline for Chandrapuri Block.
Generates H5_visit_list.csv matching exact column requirements:
member_id,due_item,priority
"""
import os
import csv
from typing import List, Dict, Any
from .rules import calculate_due_items_for_member, DEFAULT_PLANNING_DATE

def generate_daily_visit_list(
    register_path: str = "data/household_register.csv",
    planning_date: str = DEFAULT_PLANNING_DATE,
    output_path: str = "submission/H5_visit_list.csv"
) -> List[Dict[str, Any]]:
    """
    Processes the entire household register (500 households, 2,234 members).
    Outputs CSV with exact header: member_id,due_item,priority
    """
    if not os.path.exists(register_path):
        raise FileNotFoundError(f"Household register not found at {register_path}")

    members = []
    with open(register_path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            members.append(row)

    visit_rows = []
    for member in members:
        m_id = member["member_id"]
        due_items = calculate_due_items_for_member(member, planning_date)
        for item, prio, reason in due_items:
            visit_rows.append({
                "member_id": m_id,
                "due_item": item,
                "priority": prio,
                "reason": reason,
                "name": member.get("name", ""),
                "village": member.get("village", ""),
                "asha_id": member.get("asha_id", ""),
                "household_id": member.get("household_id", "")
            })

    # Ensure output directory exists
    os.makedirs(os.path.dirname(output_path), exist_ok=True)

    # Write submission CSV with exactly: member_id,due_item,priority
    with open(output_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["member_id", "due_item", "priority"])
        for row in visit_rows:
            writer.writerow([row["member_id"], row["due_item"], row["priority"]])

    return visit_rows

if __name__ == "__main__":
    rows = generate_daily_visit_list()
    print(f"Generated {len(rows)} visit items.")
