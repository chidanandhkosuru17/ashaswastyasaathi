/**
 * Visit Planning Engine (TypeScript implementation).
 * Matches FULL_CODE/visit_planner/rules.py exactly.
 */
import { Member, DueVisitItem } from '../types';

export const DEFAULT_PLANNING_DATE = "2026-10-26";

function parseDate(dateStr?: string): Date | null {
  if (!dateStr || !dateStr.trim()) return null;
  const d = new Date(dateStr.trim());
  return isNaN(d.getTime()) ? null : d;
}

export function calculateMemberDueVisits(
  member: Member,
  planningDateStr: string = DEFAULT_PLANNING_DATE,
  completedMap?: Map<string, string> // memberId_dueItem -> completedDate
): DueVisitItem[] {
  const pDate = parseDate(planningDateStr) || new Date("2026-10-26T00:00:00Z");
  const items: Array<{ item: string; priority: number; reason: string }> = [];

  const age = Number(member.age) || 0;
  const isPregnant = member.is_pregnant === "YES";
  const lmpDate = parseDate(member.lmp);
  const hrpStatus = member.hrp_status === "YES";
  const ancDone = Number(member.anc_visits_completed) || 0;
  const tdDoses = Number(member.td_doses) || 0;
  const deliveryType = member.delivery_type || "INSTITUTIONAL";
  const infantDob = parseDate(member.dob_infant);
  const dob = parseDate(member.dob);
  const vaxList = (member.vaccines_received || "").split(',').map(v => v.trim()).filter(Boolean);
  const muacCat = member.muac_category || "";
  const lastMuac = parseDate(member.last_muac_date);
  const htnDiag = member.htn_diagnosed === "YES";
  const lastHtn = parseDate(member.last_htn_visit);
  const dmDiag = member.dm_diagnosed === "YES";
  const lastDm = parseDate(member.last_dm_visit);

  // 1. ANC
  if (isPregnant && lmpDate) {
    const diffDays = Math.floor((pDate.getTime() - lmpDate.getTime()) / (1000 * 60 * 60 * 24));
    const weeks = Math.floor(diffDays / 7);

    if (hrpStatus) {
      items.push({ item: "HRP_FOLLOWUP", priority: 1, reason: `High-risk pregnancy follow-up (${weeks} weeks)` });
    }

    if (tdDoses === 0) {
      items.push({ item: "TD_PREG_1", priority: 2, reason: "First pregnancy Td vaccine due" });
    } else if (tdDoses === 1 && diffDays >= 28) {
      items.push({ item: "TD_PREG_2", priority: 2, reason: "Second pregnancy Td vaccine due (4 weeks after Td-1)" });
    }

    if (weeks <= 12 && ancDone === 0) {
      items.push({ item: "ANC_VISIT_1", priority: 2, reason: `1st trimester ANC check-up (${weeks} wks)` });
    } else if (weeks >= 14 && weeks <= 26 && ancDone < 2) {
      items.push({ item: "ANC_VISIT_2", priority: hrpStatus || weeks > 22 ? 1 : 2, reason: `2nd trimester ANC check-up (${weeks} wks)` });
    } else if (weeks >= 28 && weeks <= 34 && ancDone < 3) {
      items.push({ item: "ANC_VISIT_3", priority: hrpStatus || weeks > 32 ? 1 : 2, reason: `3rd trimester ANC check-up (${weeks} wks)` });
    } else if (weeks >= 36 && ancDone < 4) {
      items.push({ item: "ANC_VISIT_4", priority: hrpStatus ? 1 : 2, reason: `Near-term 4th ANC check-up (${weeks} wks)` });
    } else if (weeks > 12 && weeks < 14 && ancDone === 0) {
      items.push({ item: "ANC_VISIT_2", priority: 3, reason: "2nd trimester ANC visit approaching this week" });
    } else if (weeks > 26 && weeks < 28 && ancDone < 3) {
      items.push({ item: "ANC_VISIT_3", priority: 3, reason: "3rd trimester ANC visit approaching this week" });
    }
  }

  // 2. HBNC
  if (infantDob) {
    const infantDays = Math.floor((pDate.getTime() - infantDob.getTime()) / (1000 * 60 * 60 * 24));
    if (infantDays >= 0 && infantDays <= 45) {
      if (deliveryType === "HOME" && infantDays >= 1 && infantDays <= 2) {
        items.push({ item: "HBNC_D1", priority: 1, reason: "Home delivery Day 1 newborn assessment" });
      }
      if (infantDays >= 3 && infantDays <= 5) {
        items.push({ item: "HBNC_D3", priority: 1, reason: "Day 3 newborn thermal and breastfeeding assessment" });
      } else if (infantDays >= 7 && infantDays <= 10) {
        items.push({ item: "HBNC_D7", priority: 1, reason: "Day 7 newborn danger sign and jaundice check" });
      } else if (infantDays >= 14 && infantDays <= 18) {
        items.push({ item: "HBNC_D14", priority: 2, reason: "Day 14 newborn growth and cord check" });
      } else if (infantDays >= 21 && infantDays <= 25) {
        items.push({ item: "HBNC_D21", priority: 2, reason: "Day 21 newborn home check" });
      } else if (infantDays >= 28 && infantDays <= 32) {
        items.push({ item: "HBNC_D28", priority: 2, reason: "Day 28 neonatal completion check" });
      } else if (infantDays >= 42 && infantDays <= 45) {
        items.push({ item: "HBNC_D42", priority: 2, reason: "Day 42 postnatal 6-week immunization follow-up" });
      }
    }
  }

  // 3. IMMUNISATION
  if (dob) {
    const childDays = Math.floor((pDate.getTime() - dob.getTime()) / (1000 * 60 * 60 * 24));
    const childMonths = Math.floor(childDays / 30);
    const childYears = Math.floor(childDays / 365);

    if (childDays >= 0 && childDays <= 15) {
      if (!vaxList.includes("BCG")) items.push({ item: "BCG", priority: childDays <= 7 ? 1 : 2, reason: "Birth dose BCG" });
      if (!vaxList.includes("OPV_0")) items.push({ item: "OPV_0", priority: childDays <= 7 ? 1 : 2, reason: "Birth dose OPV-0" });
      if (!vaxList.includes("HEP_B_0")) items.push({ item: "HEP_B_0", priority: childDays <= 2 ? 1 : 2, reason: "Birth dose Hepatitis B within 24-48h" });
    }

    if (childDays >= 42 && childMonths < 6) {
      const overdue = childDays - 42;
      const p = overdue > 30 ? 1 : 2;
      if (!vaxList.includes("PENTA_1")) items.push({ item: "PENTA_1", priority: p, reason: `Pentavalent-1 (${childDays} days old)` });
      if (!vaxList.includes("OPV_1")) items.push({ item: "OPV_1", priority: p, reason: `OPV-1 (${childDays} days old)` });
      if (!vaxList.includes("ROTA_1")) items.push({ item: "ROTA_1", priority: p, reason: `Rotavirus-1 (${childDays} days old)` });
      if (!vaxList.includes("FIPV_1")) items.push({ item: "FIPV_1", priority: p, reason: `fIPV-1 (${childDays} days old)` });
      if (!vaxList.includes("PCV_1")) items.push({ item: "PCV_1", priority: p, reason: `PCV-1 (${childDays} days old)` });
    }

    if (childDays >= 70 && childMonths < 6) {
      const overdue = childDays - 70;
      const p = overdue > 30 ? 1 : 2;
      if (!vaxList.includes("PENTA_2") && vaxList.includes("PENTA_1")) items.push({ item: "PENTA_2", priority: p, reason: `Pentavalent-2 (${childDays} days old)` });
      if (!vaxList.includes("OPV_2") && vaxList.includes("OPV_1")) items.push({ item: "OPV_2", priority: p, reason: `OPV-2 (${childDays} days old)` });
      if (!vaxList.includes("ROTA_2") && vaxList.includes("ROTA_1")) items.push({ item: "ROTA_2", priority: p, reason: `Rotavirus-2 (${childDays} days old)` });
    }

    if (childDays >= 98 && childMonths < 9) {
      const overdue = childDays - 98;
      const p = overdue > 30 ? 1 : 2;
      if (!vaxList.includes("PENTA_3") && vaxList.includes("PENTA_2")) items.push({ item: "PENTA_3", priority: p, reason: `Pentavalent-3 (${childDays} days old)` });
      if (!vaxList.includes("OPV_3") && vaxList.includes("OPV_2")) items.push({ item: "OPV_3", priority: p, reason: `OPV-3 (${childDays} days old)` });
      if (!vaxList.includes("ROTA_3") && vaxList.includes("ROTA_2")) items.push({ item: "ROTA_3", priority: p, reason: `Rotavirus-3 (${childDays} days old)` });
      if (!vaxList.includes("FIPV_2")) items.push({ item: "FIPV_2", priority: p, reason: `fIPV-2 (${childDays} days old)` });
      if (!vaxList.includes("PCV_2") && vaxList.includes("PCV_1")) items.push({ item: "PCV_2", priority: p, reason: `PCV-2 (${childDays} days old)` });
    }

    if (childDays >= 270 && childMonths < 16) {
      const overdue = childDays - 270;
      const p = overdue > 30 ? 1 : 2;
      if (!vaxList.includes("MR_1")) items.push({ item: "MR_1", priority: p, reason: `Measles-Rubella 1st dose (${childMonths} months)` });
      if (!vaxList.includes("VIT_A_1")) items.push({ item: "VIT_A_1", priority: p, reason: `Vitamin A 1st dose (${childMonths} months)` });
      if (!vaxList.includes("PCV_B")) items.push({ item: "PCV_B", priority: p, reason: `PCV Booster (${childMonths} months)` });
    }

    if (childDays >= 480 && childMonths < 30) {
      const overdue = childDays - 480;
      const p = overdue > 30 ? 1 : 2;
      if (!vaxList.includes("MR_2") && vaxList.includes("MR_1")) items.push({ item: "MR_2", priority: p, reason: `MR 2nd dose (${childMonths} months)` });
      if (!vaxList.includes("DPT_B1")) items.push({ item: "DPT_B1", priority: p, reason: `DPT Booster 1 (${childMonths} months)` });
      if (!vaxList.includes("OPV_B")) items.push({ item: "OPV_B", priority: p, reason: `OPV Booster (${childMonths} months)` });
    }

    if (childYears >= 5 && childYears <= 6 && !vaxList.includes("DPT_B2")) {
      items.push({ item: "DPT_B2", priority: 2, reason: "DPT Booster 2 (5-6 years)" });
    }
    if (childYears >= 10 && childYears <= 11 && !vaxList.includes("TD_10")) {
      items.push({ item: "TD_10", priority: 2, reason: "Td vaccine at 10 years" });
    }
    if (childYears >= 16 && childYears <= 17 && !vaxList.includes("TD_16")) {
      items.push({ item: "TD_16", priority: 2, reason: "Td vaccine at 16 years" });
    }
  }

  // 4. MUAC
  if (age >= 1 && age <= 4) {
    const daysSince = lastMuac ? Math.floor((pDate.getTime() - lastMuac.getTime()) / (1000 * 60 * 60 * 24)) : 999;
    if (muacCat === "SAM") {
      if (daysSince >= 30) items.push({ item: "MUAC_SCREENING", priority: 1, reason: `SAM child monthly follow-up (${daysSince} days)` });
    } else if (muacCat === "MAM") {
      if (daysSince >= 30) items.push({ item: "MUAC_SCREENING", priority: 2, reason: `MAM child monthly follow-up (${daysSince} days)` });
    } else {
      if (daysSince >= 90) items.push({ item: "MUAC_SCREENING", priority: 2, reason: `Routine growth monitoring (${daysSince} days)` });
      else if (daysSince >= 83) items.push({ item: "MUAC_SCREENING", priority: 3, reason: "Routine growth monitoring due this week" });
    }
  }

  // 5. NCD
  if (age >= 30) {
    if (htnDiag) {
      const daysSince = lastHtn ? Math.floor((pDate.getTime() - lastHtn.getTime()) / (1000 * 60 * 60 * 24)) : 999;
      if (daysSince >= 44) items.push({ item: "HTN_FOLLOWUP", priority: 1, reason: `Hypertension overdue by ${daysSince - 30} days` });
      else if (daysSince >= 30) items.push({ item: "HTN_FOLLOWUP", priority: 2, reason: `Monthly hypertension compliance check (${daysSince} days)` });
      else if (daysSince >= 23) items.push({ item: "HTN_FOLLOWUP", priority: 3, reason: "Monthly hypertension check due this week" });
    }

    if (dmDiag) {
      const daysSince = lastDm ? Math.floor((pDate.getTime() - lastDm.getTime()) / (1000 * 60 * 60 * 24)) : 999;
      if (daysSince >= 44) items.push({ item: "DM_FOLLOWUP", priority: 1, reason: `Diabetes follow-up overdue by ${daysSince - 30} days` });
      else if (daysSince >= 30) items.push({ item: "DM_FOLLOWUP", priority: 2, reason: `Monthly diabetes review (${daysSince} days)` });
      else if (daysSince >= 23) items.push({ item: "DM_FOLLOWUP", priority: 3, reason: "Monthly diabetes review due this week" });
    }
  }

  // Deduplicate keeping lowest integer priority
  const bestMap = new Map<string, { priority: number; reason: string }>();
  for (const it of items) {
    const existing = bestMap.get(it.item);
    if (!existing || it.priority < existing.priority) {
      bestMap.set(it.item, { priority: it.priority, reason: it.reason });
    }
  }

  const results: DueVisitItem[] = [];
  bestMap.forEach((val, itemCode) => {
    const key = `${member.member_id}_${itemCode}`;
    const compDate = completedMap ? completedMap.get(key) : undefined;

    results.push({
      member_id: member.member_id,
      due_item: itemCode,
      priority: val.priority,
      reason: val.reason,
      name: member.name,
      village: member.village,
      asha_id: member.asha_id,
      household_id: member.household_id,
      completed: !!compDate,
      completed_date: compDate
    });
  });

  return results.sort((a, b) => a.priority - b.priority || a.due_item.localeCompare(b.due_item));
}

export function generateAllVisits(
  members: Member[],
  planningDate: string = DEFAULT_PLANNING_DATE,
  completedMap?: Map<string, string>
): DueVisitItem[] {
  const all: DueVisitItem[] = [];
  for (const m of members) {
    const due = calculateMemberDueVisits(m, planningDate, completedMap);
    all.push(...due);
  }
  return all;
}
