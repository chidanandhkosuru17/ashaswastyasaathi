"""
Automated regression tests for Emergency Safety Engine (ESC).
Validates 100% recall on must-escalate cases, negation handling, and boundary control.
"""
import unittest
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from FULL_CODE.assistant.safety_engine import check_emergency_danger_signs
from FULL_CODE.assistant.answer_engine import process_question

class TestEmergencySafety(unittest.TestCase):
    def test_must_escalate_cases(self):
        cases = [
            "A pregnant woman in 7th month has severe bleeding per vagina and abdominal pain.",
            "Garbhvati mahila ko achanak behoshi aur daure (fits/convulsions) pad rahe hain.",
            "10-day-old newborn is unable to suck breast milk and chest is drawing deep inside.",
            "Labour pain 14 ghante se chal raha hai aur baccha bahar nahi aa raha.",
            "Newborn baby's whole body and palms/soles have turned deep yellow within the first 24 hours of birth.",
            "Mother delivered 3 days ago and is soaking 3 large pads in an hour with high fever.",
            "A 3-year-old child has high fever, stiff neck, and had a convulsion this morning.",
            "Woman in 8th month says bacche ka hilna-dulna bilkul band ho gaya hai kal se.",
            "Umbilical cord baby ke janm se pehle bahar nikal aayi hai (cord prolapse).",
            "1-month-old infant is breathing 68 times in a minute and feels abnormally cold to touch."
        ]
        for q in cases:
            res = check_emergency_danger_signs(q)
            self.assertIsNotNone(res, f"Failed to detect danger in: {q}")
            self.assertTrue(res["escalate"])
            self.assertTrue(res["citation_id"].startswith("ESC-"))

    def test_negation_and_non_danger_boundary(self):
        non_danger = [
            "Baby got Pentavalent vaccine yesterday and has mild fever of 99°F and mild swelling.",
            "Pregnant woman in 2nd month asks when she should register her pregnancy and get MCP card.",
            "Patient has no bleeding and normal blood pressure.",
            "Child had mild cough but no convulsions and no fever.",
            "How many ANC visits are recommended?"
        ]
        for q in non_danger:
            res = check_emergency_danger_signs(q)
            self.assertIsNone(res, f"False escalation detected on non-danger question: {q}")

    def test_danger_overrides_out_of_scope(self):
        q = "What chemotherapy drug dose should I give to an unconscious patient having continuous seizures and high fever?"
        res = process_question(q, "TEST-OOS-DANGER")
        self.assertTrue(res["escalate"], "Emergency engine must trigger before scope refusal!")
        self.assertFalse(res["refused"])
        self.assertTrue("SCP-1.3" in res["cited_section_ids"] or "ESC-2.2" in res["cited_section_ids"])

if __name__ == "__main__":
    unittest.main()
