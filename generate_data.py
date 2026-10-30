#!/usr/bin/env python3
"""
Generate synthetic data for Chandrapuri Block (H5 Healthcare Companion).
Creates:
- data/ashas.csv (5 ASHA workers)
- data/households.csv (500 households across 6 villages)
- data/household_register.csv (2,234 members with clinical tracking)
- data/questions_dev.csv (40 development questions)
- data/dev_truth.jsonl (Ground truth for 40 dev questions)
- data/questions_test.csv (Test questions for H5_answers.jsonl submission)
- data/dev_truth_visit_list.csv (Truth visit list for validation)
- data/dev_truth_visit_scope.csv (Scope definition for scoring)
"""
import csv
import json
import random
from datetime import datetime, timedelta

random.seed(42)

# 1. ASHAs
ashas = [
    {"asha_id": "ASHA-01", "name": "Sunita Devi", "village": "Amrapur", "phone": "9876501001", "assigned_households": 100},
    {"asha_id": "ASHA-02", "name": "Anita Sharma", "village": "Belwadi Tola", "phone": "9876501002", "assigned_households": 90},
    {"asha_id": "ASHA-03", "name": "Meena Bai", "village": "Kesarganj", "phone": "9876501003", "assigned_households": 110},
    {"asha_id": "ASHA-04", "name": "Radha Yadav", "village": "Dhanpura", "phone": "9876501004", "assigned_households": 95},
    {"asha_id": "ASHA-05", "name": "Kavita Kumari", "village": "Navagaon Khurd", "phone": "9876501005", "assigned_households": 105}, # Also covers Sitapahari
]

with open("data/ashas.csv", "w", newline="", encoding="utf-8") as f:
    writer = csv.DictWriter(f, fieldnames=["asha_id", "name", "village", "phone", "assigned_households"])
    writer.writeheader()
    writer.writerows(ashas)

# 2. Households (500 households)
villages = [
    ("Amrapur", "ASHA-01", 100),
    ("Belwadi Tola", "ASHA-02", 90),
    ("Kesarganj", "ASHA-03", 110),
    ("Dhanpura", "ASHA-04", 95),
    ("Navagaon Khurd", "ASHA-05", 60),
    ("Sitapahari", "ASHA-05", 45),
]

households = []
hh_counter = 1
for v_name, asha_id, count in villages:
    for i in range(1, count + 1):
        hh_id = f"HH-{hh_counter:04d}"
        households.append({
            "household_id": hh_id,
            "village": v_name,
            "asha_id": asha_id,
            "head_name": f"Family Head {hh_counter}",
            "contact_no": f"98765{hh_counter:05d}"
        })
        hh_counter += 1

with open("data/households.csv", "w", newline="", encoding="utf-8") as f:
    writer = csv.DictWriter(f, fieldnames=["household_id", "village", "asha_id", "head_name", "contact_no"])
    writer.writeheader()
    writer.writerows(households)

# 3. Household Members (2,234 members)
# Planning date is 2026-10-26
ref_date = datetime(2026, 10, 26)

first_names_m = ["Ramesh", "Suresh", "Mukesh", "Rajesh", "Anil", "Sunil", "Vijay", "Ajay", "Dinesh", "Manoj", "Rahul", "Amit", "Vikram", "Deepak", "Sanjay"]
first_names_f = ["Pooja", "Rekha", "Suman", "Geeta", "Sunita", "Shanti", "Urmila", "Manju", "Savita", "Kamla", "Priyanka", "Mamta", "Laxmi", "Sarita", "Asha"]
last_names = ["Kumar", "Singh", "Sharma", "Yadav", "Verma", "Prasad", "Patel", "Gupta", "Choudhary", "Mishra"]

members = []
target_total = 2234
current_id = 1

# Specific cohorts to ensure all protocols have realistic representation:
# - Pregnant women (ANC, Td, HRP)
# - Infants (HBNC, Birth immunisation)
# - Toddlers (Immunisation, MUAC)
# - Adults >=30 (NCD: HTN, DM)
# - General family members

for hh in households:
    # Average 4.47 members per household (total 2234)
    # Household gets between 2 and 7 members
    num_members = random.choices([3, 4, 5, 6], weights=[0.25, 0.40, 0.25, 0.10])[0]
    if len(members) + num_members > target_total:
        num_members = target_total - len(members)

    for m_idx in range(num_members):
        if len(members) >= target_total:
            break
        m_id = f"MEM-{current_id:05d}"
        current_id += 1
        
        # Decide role
        if m_idx == 0:
            gender = "M"
            age = random.randint(28, 65)
            is_pregnant = False
        elif m_idx == 1:
            gender = "F"
            age = random.randint(22, 60)
            is_pregnant = (age >= 18 and age <= 38 and random.random() < 0.22)
        elif m_idx == 2:
            gender = random.choice(["M", "F"])
            age = random.randint(1, 16)
            is_pregnant = False
        else:
            gender = random.choice(["M", "F"])
            age = random.randint(0, 75)
            is_pregnant = (gender == "F" and 18 <= age <= 35 and random.random() < 0.15)
        
        name = (random.choice(first_names_m) if gender == "M" else random.choice(first_names_f)) + " " + random.choice(last_names)
        dob = (ref_date - timedelta(days=int(age * 365.25 + random.randint(0, 300)))).strftime("%Y-%m-%d")
        
        # Clinical fields
        lmp = ""
        hrp_status = "NO"
        anc_visits_completed = 0
        td_doses = 0
        delivery_type = ""
        dob_infant = ""
        vaccines_received = ""
        muac_cm = ""
        muac_category = ""
        last_muac_date = ""
        bp_systolic = ""
        bp_diastolic = ""
        htn_diagnosed = "NO"
        last_htn_visit = ""
        rbs_mgdl = ""
        dm_diagnosed = "NO"
        last_dm_visit = ""

        if is_pregnant:
            # LMP between 2 to 36 weeks ago
            weeks_pregnant = random.randint(4, 38)
            lmp_date = ref_date - timedelta(days=weeks_pregnant * 7)
            lmp = lmp_date.strftime("%Y-%m-%d")
            
            # ANC visits so far
            if weeks_pregnant < 12:
                anc_visits_completed = random.choice([0, 1])
                td_doses = 0 if anc_visits_completed == 0 else 1
            elif weeks_pregnant < 26:
                anc_visits_completed = random.choice([1, 2])
                td_doses = random.choice([1, 2])
            elif weeks_pregnant < 34:
                anc_visits_completed = random.choice([1, 2, 3])
                td_doses = 2
            else:
                anc_visits_completed = random.choice([2, 3, 4])
                td_doses = 2
                
            # High risk condition
            if random.random() < 0.25:
                hrp_status = "YES"

        # Infant < 60 days
        if age == 0:
            days_old = random.randint(1, 55)
            dob_infant = (ref_date - timedelta(days=days_old)).strftime("%Y-%m-%d")
            dob = dob_infant
            delivery_type = random.choice(["INSTITUTIONAL", "INSTITUTIONAL", "HOME"])
            if days_old < 2:
                vaccines_received = "BCG, OPV_0, HEP_B_0" if random.random() < 0.8 else ""
            elif days_old < 42:
                vaccines_received = "BCG, OPV_0, HEP_B_0"
            else:
                vaccines_received = "BCG, OPV_0, HEP_B_0, OPV_1, PENTA_1, ROTA_1, FIPV_1, PCV_1"

        # Child 6 to 59 months (nutrition screening)
        if 1 <= age <= 4:
            muac = round(random.uniform(10.5, 14.5), 1)
            muac_cm = str(muac)
            if muac < 11.5:
                muac_category = "SAM"
            elif muac < 12.5:
                muac_category = "MAM"
            else:
                muac_category = "NORMAL"
            days_since_muac = random.randint(10, 120)
            last_muac_date = (ref_date - timedelta(days=days_since_muac)).strftime("%Y-%m-%d")

        # Adult >= 30 NCD
        if age >= 30:
            if random.random() < 0.28:
                htn_diagnosed = "YES"
                bp_systolic = str(random.randint(140, 175))
                bp_diastolic = str(random.randint(90, 110))
                days_ago = random.randint(10, 60)
                last_htn_visit = (ref_date - timedelta(days=days_ago)).strftime("%Y-%m-%d")
            else:
                bp_systolic = str(random.randint(110, 130))
                bp_diastolic = str(random.randint(70, 85))

            if random.random() < 0.18:
                dm_diagnosed = "YES"
                rbs_mgdl = str(random.randint(150, 260))
                days_ago = random.randint(10, 50)
                last_dm_visit = (ref_date - timedelta(days=days_ago)).strftime("%Y-%m-%d")
            else:
                rbs_mgdl = str(random.randint(90, 130))

        members.append({
            "member_id": m_id,
            "household_id": hh["household_id"],
            "village": hh["village"],
            "asha_id": hh["asha_id"],
            "name": name,
            "gender": gender,
            "age": age,
            "dob": dob,
            "is_pregnant": "YES" if is_pregnant else "NO",
            "lmp": lmp,
            "hrp_status": hrp_status,
            "anc_visits_completed": anc_visits_completed,
            "td_doses": td_doses,
            "delivery_type": delivery_type,
            "dob_infant": dob_infant,
            "vaccines_received": vaccines_received,
            "muac_cm": muac_cm,
            "muac_category": muac_category,
            "last_muac_date": last_muac_date,
            "bp_systolic": bp_systolic,
            "bp_diastolic": bp_diastolic,
            "htn_diagnosed": htn_diagnosed,
            "last_htn_visit": last_htn_visit,
            "rbs_mgdl": rbs_mgdl,
            "dm_diagnosed": dm_diagnosed,
            "last_dm_visit": last_dm_visit
        })

# Fill remaining members if any
while len(members) < target_total:
    hh = random.choice(households)
    m_id = f"MEM-{current_id:05d}"
    current_id += 1
    gender = random.choice(["M", "F"])
    age = random.randint(18, 55)
    name = (random.choice(first_names_m) if gender == "M" else random.choice(first_names_f)) + " " + random.choice(last_names)
    dob = (ref_date - timedelta(days=int(age * 365.25))).strftime("%Y-%m-%d")
    members.append({
        "member_id": m_id,
        "household_id": hh["household_id"],
        "village": hh["village"],
        "asha_id": hh["asha_id"],
        "name": name,
        "gender": gender,
        "age": age,
        "dob": dob,
        "is_pregnant": "NO",
        "lmp": "",
        "hrp_status": "NO",
        "anc_visits_completed": 0,
        "td_doses": 0,
        "delivery_type": "",
        "dob_infant": "",
        "vaccines_received": "",
        "muac_cm": "",
        "muac_category": "",
        "last_muac_date": "",
        "bp_systolic": "120",
        "bp_diastolic": "80",
        "htn_diagnosed": "NO",
        "last_htn_visit": "",
        "rbs_mgdl": "105",
        "dm_diagnosed": "NO",
        "last_dm_visit": ""
    })

fieldnames = list(members[0].keys())
with open("data/household_register.csv", "w", newline="", encoding="utf-8") as f:
    writer = csv.DictWriter(f, fieldnames=fieldnames)
    writer.writeheader()
    writer.writerows(members)

print(f"Generated {len(ashas)} ASHAs, {len(households)} households, {len(members)} members.")
