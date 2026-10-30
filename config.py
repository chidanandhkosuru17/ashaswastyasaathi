"""
Configuration settings for SwasthyaSaathi.
Chandrapuri Block Scenario.
"""
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

DATA_DIR = os.path.join(BASE_DIR, "data")
PROTOCOLS_DIR = os.path.join(DATA_DIR, "protocols")
SUBMISSION_DIR = os.path.join(BASE_DIR, "submission")
MODELS_DIR = os.path.join(BASE_DIR, "models")
DB_PATH = os.path.join(DATA_DIR, "swasthyasaathi.db")

# Reference Baseline Date for H5 Visit Planner
PLANNING_DATE = "2026-10-26"

# Emergency Referral Facility
REFERRAL_HOSPITAL = "Chandrapuri District Hospital"
AMBULANCE_HOTLINE = "108"
JANANI_EXPRESS = "102"

# Block Demographics
VILLAGES = [
    "Amrapur",
    "Belwadi Tola",
    "Kesarganj",
    "Dhanpura",
    "Navagaon Khurd",
    "Sitapahari"
]

TOTAL_HOUSEHOLDS = 500
TOTAL_MEMBERS = 2234
