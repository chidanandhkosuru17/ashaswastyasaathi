"""
Data Loader module for loading synthetic data and protocol texts.
"""
import os
import csv
from typing import List, Dict, Any

def load_ashas() -> List[Dict[str, Any]]:
    path = "data/ashas.csv"
    if not os.path.exists(path):
        return []
    with open(path, "r", encoding="utf-8") as f:
        return list(csv.DictReader(f))

def load_households() -> List[Dict[str, Any]]:
    path = "data/households.csv"
    if not os.path.exists(path):
        return []
    with open(path, "r", encoding="utf-8") as f:
        return list(csv.DictReader(f))

def load_members(limit: int = None) -> List[Dict[str, Any]]:
    path = "data/household_register.csv"
    if not os.path.exists(path):
        return []
    with open(path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        if limit:
            members = []
            for i, r in enumerate(reader):
                if i >= limit:
                    break
                members.append(r)
            return members
        return list(reader)
