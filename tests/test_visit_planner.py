"""
Automated tests for Visit Planning rules and Priority classifications.
"""
import unittest
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from FULL_CODE.visit_planner.rules import calculate_due_items_for_member

class TestVisitPlanner(unittest.TestCase):
    def test_hrp_and_anc_rules(self):
        # Pregnant woman with HRP and 28 weeks
        member = {
            "member_id": "MEM-0001",
            "age": 26,
            "is_pregnant": "YES",
            "lmp": "2026-04-10", # ~28 weeks
            "hrp_status": "YES",
            "anc_visits_completed": 1,
            "td_doses": 1
        }
        due = calculate_due_items_for_member(member, "2026-10-26")
        items = [d[0] for d in due]
        priorities = {d[0]: d[1] for d in due}

        self.assertIn("HRP_FOLLOWUP", items)
        self.assertEqual(priorities["HRP_FOLLOWUP"], 1) # HRP must be Priority 1
        self.assertIn("ANC_VISIT_3", items)

    def test_infant_hbnc_rules(self):
        # 4-day-old infant delivered in hospital
        member = {
            "member_id": "MEM-0002",
            "age": 0,
            "dob_infant": "2026-10-22", # 4 days old
            "delivery_type": "INSTITUTIONAL",
            "vaccines_received": "BCG, OPV_0, HEP_B_0"
        }
        due = calculate_due_items_for_member(member, "2026-10-26")
        items = [d[0] for d in due]
        priorities = {d[0]: d[1] for d in due}

        self.assertIn("HBNC_D3", items)
        self.assertEqual(priorities["HBNC_D3"], 1) # Day 3 newborn check is Priority 1

    def test_sam_malnutrition_rules(self):
        # 2-year-old child with MUAC < 11.5 cm
        member = {
            "member_id": "MEM-0003",
            "age": 2,
            "dob": "2024-05-01",
            "muac_cm": "10.8",
            "muac_category": "SAM",
            "last_muac_date": "2026-09-10" # >30 days ago
        }
        due = calculate_due_items_for_member(member, "2026-10-26")
        items = [d[0] for d in due]
        priorities = {d[0]: d[1] for d in due}

        self.assertIn("MUAC_SCREENING", items)
        self.assertEqual(priorities["MUAC_SCREENING"], 1) # SAM due item is Priority 1

if __name__ == "__main__":
    unittest.main()
