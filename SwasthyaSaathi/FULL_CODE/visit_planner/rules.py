"""
Visit-Planning Rules engine implementing 09_VIS_daily_visit_list_rules.md
Calculates due items and assigns official priorities (1, 2, 3) for the 500-household register.
"""
from datetime import datetime
from typing import List, Dict, Any, Tuple

DEFAULT_PLANNING_DATE = "2026-10-26"

def parse_date(date_str: str):
    if not date_str or date_str.strip() == "":
        return None
    try:
        return datetime.strptime(date_str.strip(), "%Y-%m-%d")
    except ValueError:
        return None

def calculate_due_items_for_member(member: Dict[str, Any], planning_date_str: str = DEFAULT_PLANNING_DATE) -> List[Tuple[str, int, str]]:
    """
    Returns list of tuples: (due_item, priority, reason)
    Priority:
      1 = High-Risk & Due/Overdue
      2 = Routine Due / Currently Overdue
      3 = Due this week (proactive window)
    """
    due_items = []
    p_date = parse_date(planning_date_str) or datetime(2026, 10, 26)
    m_id = member.get("member_id", "")
    age = int(member.get("age", 0) or 0)
    gender = member.get("gender", "")
    is_preg = member.get("is_pregnant", "NO") == "YES"
    lmp_date = parse_date(member.get("lmp", ""))
    hrp_status = member.get("hrp_status", "NO") == "YES"
    anc_done = int(member.get("anc_visits_completed", 0) or 0)
    td_doses = int(member.get("td_doses", 0) or 0)
    delivery_type = member.get("delivery_type", "INSTITUTIONAL")
    infant_dob = parse_date(member.get("dob_infant", ""))
    dob = parse_date(member.get("dob", ""))
    vax_str = member.get("vaccines_received", "")
    vaccines_received = [v.strip() for v in vax_str.split(",") if v.strip()]
    muac_cm = float(member.get("muac_cm", 0.0) or 0.0)
    muac_cat = member.get("muac_category", "")
    last_muac = parse_date(member.get("last_muac_date", ""))
    htn_diag = member.get("htn_diagnosed", "NO") == "YES"
    last_htn = parse_date(member.get("last_htn_visit", ""))
    dm_diag = member.get("dm_diagnosed", "NO") == "YES"
    last_dm = parse_date(member.get("last_dm_visit", ""))

    # 1. ANTENATAL CARE (ANC)
    if is_preg and lmp_date:
        gestation_days = (p_date - lmp_date).days
        gestation_weeks = gestation_days // 7

        # HRP follow-up: Priority 1
        if hrp_status:
            due_items.append(("HRP_FOLLOWUP", 1, f"High-risk pregnancy follow-up ({gestation_weeks} weeks)"))

        # Td vaccination
        if td_doses == 0:
            due_items.append(("TD_PREG_1", 2, "First pregnancy Td vaccine due"))
        elif td_doses == 1 and gestation_days >= 28:
            due_items.append(("TD_PREG_2", 2, "Second pregnancy Td vaccine due (4 weeks after Td-1)"))

        # ANC visits
        if gestation_weeks <= 12 and anc_done == 0:
            due_items.append(("ANC_VISIT_1", 2, f"1st trimester ANC check-up ({gestation_weeks} wks)"))
        elif 14 <= gestation_weeks <= 26 and anc_done < 2:
            prio = 1 if hrp_status or gestation_weeks > 22 else 2
            due_items.append(("ANC_VISIT_2", prio, f"2nd trimester ANC check-up ({gestation_weeks} wks)"))
        elif 28 <= gestation_weeks <= 34 and anc_done < 3:
            prio = 1 if hrp_status or gestation_weeks > 32 else 2
            due_items.append(("ANC_VISIT_3", prio, f"3rd trimester ANC check-up ({gestation_weeks} wks)"))
        elif gestation_weeks >= 36 and anc_done < 4:
            prio = 1 if hrp_status else 2
            due_items.append(("ANC_VISIT_4", prio, f"Near-term 4th ANC check-up ({gestation_weeks} wks)"))
        elif 12 < gestation_weeks < 14 and anc_done == 0:
            due_items.append(("ANC_VISIT_2", 3, "2nd trimester ANC visit approaching this week"))
        elif 26 < gestation_weeks < 28 and anc_done < 3:
            due_items.append(("ANC_VISIT_3", 3, "3rd trimester ANC visit approaching this week"))

    # 2. HOME-BASED NEWBORN CARE (HBNC)
    if infant_dob:
        infant_days = (p_date - infant_dob).days
        if 0 <= infant_days <= 45:
            # Home delivery Day 1
            if delivery_type == "HOME" and infant_days >= 1:
                if infant_days <= 2:
                    due_items.append(("HBNC_D1", 1, "Home delivery Day 1 newborn assessment"))
            
            # Day 3
            if infant_days >= 3 and infant_days <= 5:
                due_items.append(("HBNC_D3", 1, "Day 3 newborn thermal and breastfeeding assessment"))
            elif infant_days >= 7 and infant_days <= 10:
                due_items.append(("HBNC_D7", 1, "Day 7 newborn danger sign and jaundice check"))
            elif infant_days >= 14 and infant_days <= 18:
                due_items.append(("HBNC_D14", 2, "Day 14 newborn growth and cord check"))
            elif infant_days >= 21 and infant_days <= 25:
                due_items.append(("HBNC_D21", 2, "Day 21 newborn home check"))
            elif infant_days >= 28 and infant_days <= 32:
                due_items.append(("HBNC_D28", 2, "Day 28 neonatal completion check"))
            elif infant_days >= 42 and infant_days <= 45:
                due_items.append(("HBNC_D42", 2, "Day 42 postnatal 6-week immunization follow-up"))

    # 3. CHILDHOOD IMMUNISATION
    if dob:
        child_days = (p_date - dob).days
        child_months = child_days // 30
        child_years = child_days // 365

        # Birth doses (< 15 days)
        if child_days >= 0 and child_days <= 15:
            if "BCG" not in vaccines_received:
                due_items.append(("BCG", 1 if child_days <= 7 else 2, "Birth dose BCG"))
            if "OPV_0" not in vaccines_received:
                due_items.append(("OPV_0", 1 if child_days <= 7 else 2, "Birth dose OPV-0"))
            if "HEP_B_0" not in vaccines_received:
                due_items.append(("HEP_B_0", 1 if child_days <= 2 else 2, "Birth dose Hepatitis B within 24-48h"))

        # 6 Weeks (>= 42 days)
        if child_days >= 42 and child_months < 6:
            overdue_days = child_days - 42
            prio = 1 if overdue_days > 30 else 2
            if "PENTA_1" not in vaccines_received:
                due_items.append(("PENTA_1", prio, f"Pentavalent-1 ({child_days} days old)"))
            if "OPV_1" not in vaccines_received:
                due_items.append(("OPV_1", prio, f"OPV-1 ({child_days} days old)"))
            if "ROTA_1" not in vaccines_received:
                due_items.append(("ROTA_1", prio, f"Rotavirus-1 ({child_days} days old)"))
            if "FIPV_1" not in vaccines_received:
                due_items.append(("FIPV_1", prio, f"fIPV-1 ({child_days} days old)"))
            if "PCV_1" not in vaccines_received:
                due_items.append(("PCV_1", prio, f"PCV-1 ({child_days} days old)"))

        # 10 Weeks (>= 70 days)
        if child_days >= 70 and child_months < 6:
            overdue_days = child_days - 70
            prio = 1 if overdue_days > 30 else 2
            if "PENTA_2" not in vaccines_received and "PENTA_1" in vaccines_received:
                due_items.append(("PENTA_2", prio, f"Pentavalent-2 ({child_days} days old)"))
            if "OPV_2" not in vaccines_received and "OPV_1" in vaccines_received:
                due_items.append(("OPV_2", prio, f"OPV-2 ({child_days} days old)"))
            if "ROTA_2" not in vaccines_received and "ROTA_1" in vaccines_received:
                due_items.append(("ROTA_2", prio, f"Rotavirus-2 ({child_days} days old)"))

        # 14 Weeks (>= 98 days)
        if child_days >= 98 and child_months < 9:
            overdue_days = child_days - 98
            prio = 1 if overdue_days > 30 else 2
            if "PENTA_3" not in vaccines_received and "PENTA_2" in vaccines_received:
                due_items.append(("PENTA_3", prio, f"Pentavalent-3 ({child_days} days old)"))
            if "OPV_3" not in vaccines_received and "OPV_2" in vaccines_received:
                due_items.append(("OPV_3", prio, f"OPV-3 ({child_days} days old)"))
            if "ROTA_3" not in vaccines_received and "ROTA_2" in vaccines_received:
                due_items.append(("ROTA_3", prio, f"Rotavirus-3 ({child_days} days old)"))
            if "FIPV_2" not in vaccines_received:
                due_items.append(("FIPV_2", prio, f"fIPV-2 ({child_days} days old)"))
            if "PCV_2" not in vaccines_received and "PCV_1" in vaccines_received:
                due_items.append(("PCV_2", prio, f"PCV-2 ({child_days} days old)"))

        # 9 Months (>= 270 days)
        if child_days >= 270 and child_months < 16:
            overdue_days = child_days - 270
            prio = 1 if overdue_days > 30 else 2
            if "MR_1" not in vaccines_received:
                due_items.append(("MR_1", prio, f"Measles-Rubella 1st dose ({child_months} months)"))
            if "VIT_A_1" not in vaccines_received:
                due_items.append(("VIT_A_1", prio, f"Vitamin A 1st dose ({child_months} months)"))
            if "PCV_B" not in vaccines_received:
                due_items.append(("PCV_B", prio, f"PCV Booster ({child_months} months)"))

        # 16-24 Months (>= 480 days)
        if child_days >= 480 and child_months < 30:
            overdue_days = child_days - 480
            prio = 1 if overdue_days > 30 else 2
            if "MR_2" not in vaccines_received and "MR_1" in vaccines_received:
                due_items.append(("MR_2", prio, f"MR 2nd dose ({child_months} months)"))
            if "DPT_B1" not in vaccines_received:
                due_items.append(("DPT_B1", prio, f"DPT Booster 1 ({child_months} months)"))
            if "OPV_B" not in vaccines_received:
                due_items.append(("OPV_B", prio, f"OPV Booster ({child_months} months)"))

        # 5-6 Years
        if 5 <= child_years <= 6 and "DPT_B2" not in vaccines_received:
            due_items.append(("DPT_B2", 2, "DPT Booster 2 (5-6 years)"))

        # 10 Years
        if 10 <= child_years <= 11 and "TD_10" not in vaccines_received:
            due_items.append(("TD_10", 2, "Td vaccine at 10 years"))

        # 16 Years
        if 16 <= child_years <= 17 and "TD_16" not in vaccines_received:
            due_items.append(("TD_16", 2, "Td vaccine at 16 years"))

    # 4. MALNUTRITION (MUAC) SCREENING
    if 1 <= age <= 4:
        days_since_muac = (p_date - last_muac).days if last_muac else 999
        if muac_cat == "SAM":
            # SAM monthly screening: Priority 1
            if days_since_muac >= 30:
                due_items.append(("MUAC_SCREENING", 1, f"SAM child monthly follow-up ({days_since_muac} days since last check)"))
        elif muac_cat == "MAM":
            # MAM monthly screening: Priority 2
            if days_since_muac >= 30:
                due_items.append(("MUAC_SCREENING", 2, f"MAM child monthly follow-up ({days_since_muac} days since last check)"))
        else:
            # Routine quarterly screening
            if days_since_muac >= 90:
                due_items.append(("MUAC_SCREENING", 2, f"Routine growth monitoring ({days_since_muac} days since last check)"))
            elif 83 <= days_since_muac < 90:
                due_items.append(("MUAC_SCREENING", 3, "Routine growth monitoring due this week"))

    # 5. NON-COMMUNICABLE DISEASES (NCD)
    if age >= 30:
        if htn_diag:
            days_since_htn = (p_date - last_htn).days if last_htn else 999
            if days_since_htn >= 44:  # Overdue by >14 days
                due_items.append(("HTN_FOLLOWUP", 1, f"Hypertension overdue by {days_since_htn - 30} days"))
            elif days_since_htn >= 30:
                due_items.append(("HTN_FOLLOWUP", 2, f"Routine monthly hypertension compliance check ({days_since_htn} days)"))
            elif 23 <= days_since_htn < 30:
                due_items.append(("HTN_FOLLOWUP", 3, "Monthly hypertension check due this week"))

        if dm_diag:
            days_since_dm = (p_date - last_dm).days if last_dm else 999
            if days_since_dm >= 44:  # Overdue by >14 days
                due_items.append(("DM_FOLLOWUP", 1, f"Diabetes follow-up overdue by {days_since_dm - 30} days"))
            elif days_since_dm >= 30:
                due_items.append(("DM_FOLLOWUP", 2, f"Routine monthly diabetes review ({days_since_dm} days)"))
            elif 23 <= days_since_dm < 30:
                due_items.append(("DM_FOLLOWUP", 3, "Monthly diabetes review due this week"))

    # Deduplicate member + due_item, keeping highest priority (lowest integer)
    seen = {}
    for item, prio, reason in due_items:
        if item not in seen or prio < seen[item][0]:
            seen[item] = (prio, reason)

    return [(item, seen[item][0], seen[item][1]) for item in sorted(seen.keys())]
