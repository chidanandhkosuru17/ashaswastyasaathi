/**
 * Scope Guard module (TypeScript implementation).
 * Matches FULL_CODE/assistant/scope_guard.py.
 */

export interface ScopeCheckResult {
  refused: boolean;
  escalate: boolean;
  citation_ids: string[];
  refusal_text: string;
}

const OUT_OF_SCOPE_PATTERNS = [
  /\b(surg(ical|ery)|caesarean\s*section\s*technique|laparotomy|appendectomy|hernia\s*repair|surgical\s*sutures?|operating\s*room)\b/i,
  /\b(chemo(therapy)?|doxorubicin|cisplatin|paclitaxel|cyclophosphamide|infusion\s*rate|cancer\s*staging|metastasis|oncology)\b/i,
  /\b(vancomycin|meropenem|icu\s*care|dialysis|intubation|prescribe\s*metformin|cardiac\s*medication)\b/i,
  /\b(gaay|cow|buffalo|bhains|dog|kutta|animal|veterinary|pashu|cattle)\b/i,
  /\b(chemical\s*peel|melasma|wrinkles|botox|cosmetic|plastic\s*surgery)\b/i,
  /\b(post\s*mortem|legal\s*dispute|land\s*dispute)\b/i
];

export function checkOutOfScope(question: string): ScopeCheckResult | null {
  const text = question.toLowerCase();

  for (const pat of OUT_OF_SCOPE_PATTERNS) {
    if (pat.test(text)) {
      const isAnimal = /\b(gaay|cow|buffalo|bhains|dog|kutta|animal|veterinary|pashu|cattle)\b/i.test(text);
      const redirectMsg = isAnimal
        ? "Yeh vishay ASHA/ANM ke manak protocol ke daayre se bahar hai. Kripya nazdeeki veterinary doctor (pashu chikitsak) se paramarsh lein."
        : "Yeh vishay ASHA/ANM ke manak protocol ke daayre se bahar hai. Kripya Chandrapuri District Hospital ya nazdeeki PHC ke qualified Medical Officer (doctor) se paramarsh lein.";

      return {
        refused: true,
        escalate: false,
        citation_ids: ["SCP-1.1", "SCP-1.2"],
        refusal_text: redirectMsg
      };
    }
  }

  return null;
}
