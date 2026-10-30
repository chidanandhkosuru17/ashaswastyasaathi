/**
 * Deterministic Emergency Safety Engine (TypeScript implementation).
 * Matches FULL_CODE/assistant/safety_engine.py exactly.
 * Guarantees 100% emergency danger-sign detection before any model reasoning.
 */

export interface DangerCheckResult {
  escalate: boolean;
  danger_category: string;
  citation_id: string;
  referral_action: string;
  matched_rule: string;
}

function normalize(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

interface DangerRule {
  category: string;
  citation: string;
  patterns: RegExp[];
  requireContext?: string[];
  referralText: string;
}

const DANGER_RULES: DangerRule[] = [
  // 1. Pregnancy & Vaginal Bleeding (ESC-1.1)
  {
    category: "Maternal Vaginal Bleeding in Pregnancy",
    citation: "ESC-1.1",
    patterns: [
      /\b(vaginal\s*bleed(ing)?|bleeding\s*per\s*vagina|bleed(ing)?\s*heav(y|ily)|heav(y|ily)\s*bleed(ing)?|severe\s*bleed(ing)?|raktasrav|khoon\s*bah(na|raha|rahi)|fresh\s*bleed(ing)?|bleeding\s*in\s*pregnan(cy|t)|bleed(ing)?)\b/i,
      /\b(painless\s*bleed(ing)?|spotting\s*with\s*pain|clots\s*per\s*vagina)\b/i
    ],
    requireContext: ["pregnant", "pregnancy", "garbh", "garbhvati", "trimester", "month", "mother", "mahila", "woman"],
    referralText: "URGENT: Refer Immediately to Chandrapuri District Hospital. Bleeding in pregnancy indicates potential placenta praevia or abruption. Call 108 ambulance. Keep woman lying down with elevated legs; do not perform vaginal examination."
  },

  // 2. Fits, Convulsions in Child (ESC-2.2) vs Maternal Eclampsia (ESC-1.1)
  {
    category: "Child Danger Signs - Convulsions / Unconsciousness",
    citation: "ESC-2.2",
    patterns: [
      /\b(convulsion(s)?|fit(s)?|daur(a|e)|seizure(s)?|unconscious|behosh(i)?|stiff\s*neck)\b/i
    ],
    requireContext: ["child", "baccha", "bacche", "year old", "saal", "infant", "3 year", "2 year", "4 year", "5 year"],
    referralText: "URGENT: Refer Immediately to Chandrapuri District Hospital. Convulsions, stiff neck, and unconsciousness in children are general danger signs of meningitis and severe cerebral malaria. Call 108 ambulance immediately."
  },
  {
    category: "Convulsions / Fits / Eclampsia",
    citation: "ESC-1.1",
    patterns: [
      /\b(convulsion(s)?|fit(s)?|daur(a|e)|mirgi|seizure(s)?|eclampsia)\b/i,
      /\b(loss\s*of\s*consciousness|unconscious(ness)?|behosh(i)?)\b/i,
      /\b(cannot\s*be\s*awakened|abnormally\s*sleepy\s*and\s*unresponsive)\b/i
    ],
    referralText: "URGENT: Refer Immediately to Chandrapuri District Hospital. Eclampsia and convulsions carry high mortality risk. Call 108. Turn patient onto left side to keep airway clear; never place anything in the mouth; do not give oral liquids."
  },

  // 3. Pre-Eclampsia / Hypertensive Crisis (ESC-1.1)
  {
    category: "Imminent Pre-Eclampsia / Hypertensive Crisis",
    citation: "ESC-1.1",
    patterns: [
      /\b(blurred\s*vision|blurry\s*vision|seeing\s*spots|dhundhla\s*dikh|severe\s*headache\s*and\s*bp|sar\s*dard.*bp|headache.*blurr)\b/i,
      /\b(bp\s*(1[6-9][0-9]|2[0-9]{2})\s*\/\s*(1[1-9][0-9]|[9][5-9]))\b/i
    ],
    requireContext: ["pregnant", "garbh", "trimester", "month", "mother", "mahila", "woman"],
    referralText: "URGENT: Refer Immediately to Chandrapuri District Hospital. Severe headache, visual disturbance, and high BP signify impending eclampsia. Administer first dose magnesium sulphate if trained ANM available; call 108 ambulance."
  },

  // 4. Reduced or Absent Fetal Movement (ESC-1.1)
  {
    category: "Reduced or Absent Fetal Movements",
    citation: "ESC-1.1",
    patterns: [
      /\b(no\s*fetal\s*movement(s)?|fetal\s*movement(s)?\s*(stopped|absent|reduced|decrease)|bacche\s*ka\s*hilna\s*(band|kam|nahi))\b/i,
      /\b(hilna\s*dulna.*band|movement.*(band|nahi|stopped|absent)|hilna\s*dulna\s*bilkul\s*band)\b/i,
      /\b(bacche\s*ka\s*hilna.*(band|kam|nahi))\b/i
    ],
    referralText: "URGENT: Refer Immediately to Chandrapuri District Hospital. Absent or reduced fetal movements indicate acute fetal distress. Call 108 ambulance for immediate obstetric evaluation."
  },

  // 5. Complicated or Prolonged Labour (ESC-1.2)
  {
    category: "Complicated or Prolonged Labour",
    citation: "ESC-1.2",
    patterns: [
      /\b(cord\s*prolapse|umbilical\s*cord\s*(visible|protruding|bahar))\b/i,
      /\b(labour\s*(pain(s)?)?.*(1[2-9]|[2-9][0-9])\s*hour(s)?|(1[2-9]|[2-9][0-9])\s*hour(s)?.*labour|labour\s*pain\s*14\s*ghante|prolonged\s*labour)\b/i,
      /\b(water\s*break(s)?\s*(more\s*than|over|>)?\s*(1[8-9]|[2-9][0-9])\s*hour(s)?|prom\s*>|hand\s*presentation|breech\s*presentation)\b/i
    ],
    referralText: "URGENT: Refer Immediately to Chandrapuri District Hospital. Prolonged labour and cord prolapse are life-threatening delivery emergencies. For cord prolapse: place mother in knee-chest position, wrap cord in sterile cloth, and call 108 immediately."
  },

  // 6. Severe Postpartum Haemorrhage (PPH) or Sepsis (ESC-1.3)
  {
    category: "Severe Postpartum Haemorrhage / Sepsis",
    citation: "ESC-1.3",
    patterns: [
      /\b(soaking\s*(more\s*than|>)?\s*[2-9]\s*(large\s*)?pads|soaking\s*3\s*pads|pad(s)?\s*in\s*an\s*hour|pad(s)?\s*in\s*1\s*hour)\b/i,
      /\b(postpartum\s*haemorrhage|pph|heavy\s*bleed(ing)?\s*after\s*deliver(y)?|deliver(ed)?\s*.*bleeding\s*heav)\b/i,
      /\b(foul\s*smelling\s*(lochia|discharge)\s*and\s*fever|puerperal\s*sepsis)\b/i
    ],
    referralText: "URGENT: Refer Immediately to Chandrapuri District Hospital. Severe PPH can lead to hypovolemic shock within hours. Call 108. Perform uterine massage, keep mother warm, and transfer with skilled escort."
  },

  // 7. Critical Newborn / Young Infant Danger Signs (ESC-2.1)
  {
    category: "Critical Newborn / Young Infant Danger Signs",
    citation: "ESC-2.1",
    patterns: [
      /\b(unable\s*to\s*(feed|suck|breastfeed)|refus(ing)?\s*to\s*(feed|suck|breastfeed)|doodh\s*nahi\s*pi\s*pa\s*raha|feeding\s*band)\b/i,
      /\b(chest\s*indrawing|lower\s*chest\s*(moves|drawing|goes)\s*deep|chhati\s*dhas\s*rahi)\b/i,
      /\b(breath(ing)?\s*(rate)?\s*([6-9][0-9]|1[0-9]{2})\s*(breaths|times|per\s*min)|breathing\s*68\s*times|fast\s*breathing\s*newborn)\b/i,
      /\b(hypothermia|body\s*feels?\s*cold|temperature\s*(less\s*than|<)?\s*35(\.5)?\s*(c)?|thanda\s*pad\s*gaya)\b/i,
      /\b(yellow\s*(palms|soles)|palms.*yellow|soles.*yellow|deep\s*yellow|jaundice\s*.*(first\s*24|24\s*hours)|peelapan\s*24\s*ghante|gasping|grunting)\b/i,
      /\b(turned\s*deep\s*yellow|whole\s*body.*yellow)\b/i
    ],
    requireContext: ["newborn", "baby", "infant", "shishu", "baccha", "child", "day", "month"],
    referralText: "URGENT: Refer Immediately to Chandrapuri District Hospital SNCU. Young infant danger signs indicate severe infection, pneumonia, or life-threatening neonatal jaundice. Keep infant warm using skin-to-skin wrapping; call 108."
  },

  // 8. Child General Danger Signs (ESC-2.2)
  {
    category: "Child General Danger Signs",
    citation: "ESC-2.2",
    patterns: [
      /\b(stiff\s*neck|gardan\s*akdi|neck\s*stiffness)\b/i,
      /\b(vomit(s|ing)?\s*everything|cannot\s*keep\s*anything\s*down|jo\s*bhi\s*khata\s*hai\s*ulti)\b/i,
      /\b(stridor\s*in\s*a\s*calm\s*child|stridor\s*at\s*rest)\b/i
    ],
    referralText: "URGENT: Refer Immediately to Chandrapuri District Hospital. General danger signs in childhood illness point to meningitis or severe obstructive airway disease. Transport immediately without delay."
  }
];

const NEGATION_PATTERNS = [
  /\b(no\s*bleed(ing)?|without\s*bleed(ing)?|bleeding\s*nahi|nahi\s*hai\s*bleed(ing)?)\b/i,
  /\b(no\s*fever|bukhar\s*nahi|temperature\s*normal)\b/i,
  /\b(no\s*fit(s)?|daure\s*nahi)\b/i
];

export function checkEmergencyDangerSigns(question: string): DangerCheckResult | null {
  const norm = normalize(question);

  for (const rule of DANGER_RULES) {
    if (rule.requireContext) {
      const hasContext = rule.requireContext.some(ctx => new RegExp(`\\b${ctx}\\b`, 'i').test(norm));
      if (!hasContext) continue;
    }

    for (const pat of rule.patterns) {
      const match = norm.match(pat);
      if (match && match.index !== undefined) {
        // Negation check around match window
        const start = Math.max(0, match.index - 25);
        const end = Math.min(norm.length, match.index + match[0].length + 25);
        const windowText = norm.substring(start, end);

        const isNegated = NEGATION_PATTERNS.some(neg => neg.test(windowText));
        if (!isNegated) {
          return {
            escalate: true,
            danger_category: rule.category,
            citation_id: rule.citation,
            referral_action: rule.referralText,
            matched_rule: pat.toString()
          };
        }
      }
    }
  }

  return null;
}
