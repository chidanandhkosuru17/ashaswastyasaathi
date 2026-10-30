"""
Automated tests for H5 submission file schemas and offline requirements.
"""
import unittest
import os
import json
import csv

class TestOfflineAndSchema(unittest.TestCase):
    def test_submission_files_exist(self):
        self.assertTrue(os.path.exists("submission/H5_answers.jsonl"))
        self.assertTrue(os.path.exists("submission/H5_visit_list.csv"))
        self.assertTrue(os.path.exists("submission/H5_footprint.json"))

    def test_h5_answers_schema(self):
        with open("submission/H5_answers.jsonl", "r", encoding="utf-8") as f:
            lines = [line.strip() for line in f if line.strip()]

        self.assertGreaterEqual(len(lines), 20)
        for line in lines:
            rec = json.loads(line)
            self.assertIn("question_id", rec)
            self.assertIn("answer_text", rec)
            self.assertIn("cited_section_ids", rec)
            self.assertIsInstance(rec["cited_section_ids"], list)
            self.assertLessEqual(len(rec["cited_section_ids"]), 2, "Never cite more than 2 leaf sections!")
            self.assertIsInstance(rec["escalate"], bool)
            self.assertIsInstance(rec["refused"], bool)
            self.assertIn("latency_ms", rec)
            self.assertIsInstance(rec["latency_ms"], (int, float))
            # Evaluator scoring window is 400 characters
            self.assertLessEqual(len(rec["answer_text"]), 400)

    def test_h5_visit_list_schema(self):
        with open("submission/H5_visit_list.csv", "r", encoding="utf-8") as f:
            reader = csv.reader(f)
            header = next(reader)
            self.assertEqual(header, ["member_id", "due_item", "priority"])
            rows = list(reader)

        self.assertGreater(len(rows), 500)
        for row in rows:
            self.assertEqual(len(row), 3)
            self.assertTrue(row[0].startswith("MEM-"))
            self.assertIn(int(row[2]), [1, 2, 3])

    def test_h5_footprint_schema(self):
        with open("submission/H5_footprint.json", "r", encoding="utf-8") as f:
            data = json.load(f)

        self.assertIn("model_names", data)
        self.assertIn("model_size_mb", data)
        self.assertIn("peak_ram_mb", data)
        self.assertIn("median_latency_ms_cpu", data)
        self.assertTrue(data["offline"])

if __name__ == "__main__":
    unittest.main()
