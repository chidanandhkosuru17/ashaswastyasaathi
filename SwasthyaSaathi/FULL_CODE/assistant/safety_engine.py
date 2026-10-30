"""
Deterministic Emergency Safety Engine for SwasthyaSaathi.
Implements the hard-coded danger-sign escalation layer from:
03_ESC_danger_signs_refer_immediately.md

CRITICAL SAFETY PRINCIPLE:
Must execute BEFORE any language model or retrieval reasoning.
Target: 100% recall on emergency danger signs with <=20% false escalation.
"""
import re
from typing import Dict, Any, Optional

def normalize_text(text: str) -> str:
    text = text.lower().strip()
    text = re.sub(r'[^a-z0-9\s]', ' ', text)
    text = re.sub(r'\s+', ' ', text)
    return text

# Explicit danger-sign patterns with synonyms, Hinglish, and clinical thresholds
DANGER_PATTERNS = [
    # 1. Pregnancy & Vaginal Bleeding (ESC-1.1)
    {
        "category": "Maternal Vaginal Bleeding in Pregnancy",
        "citation": "ESC-1.1",
        "patterns": [
            r"\b(vaginal\s*bleed(ing)?|bleeding\s*per\s*vagina|bleed(ing)?\s*heav(y|ily)|heav(y|ily)\s*bleed(ing)?|severe\s*bleed(ing)?|raktasrav|khoon\s*bah(na|raha|rahi)|fresh\s*bleed(ing)?|bleeding\s*in\s*pregnan(cy|t)|bleed(ing)?)\b",
            r"\b(painless\s*bleed(ing)?|spotting\s*with\s*pain|clots\s*per\s*vagina)\b"
        ],
        "require_context": ["pregnant", "pregnancy", "garbh", "garbhvati", "trimester", "month", "mother", "mahila", "woman"],
        "referral_text": "URGENT: Refer Immediately to Chandrapuri District Hospital. Bleeding in pregnancy indicates potential placenta praevia or abruption. Call 108 ambulance. Keep woman lying down with elevated legs; do not perform vaginal examination."
    },
    
    # 2. Fits, Convulsions in Child (ESC-2.2) vs Maternal Eclampsia (ESC-1.1)
    {
        "category": "Child Danger Signs - Convulsions / Unconsciousness",
        "citation": "ESC-2.2",
        "patterns": [
            r"\b(convulsion(s)?|fit(s)?|daur(a|e)|seizure(s)?|unconscious|behosh(i)?|stiff\s*neck)\b"
        ],
        "require_context": ["child", "baccha", "bacche", "year old", "saal", "infant", "3 year", "2 year", "4 year", "5 year"],
        "referral_text": "URGENT: Refer Immediately to Chandrapuri District Hospital. Convulsions, stiff neck, and unconsciousness in children are general danger signs of meningitis and severe cerebral malaria. Call 108 ambulance immediately."
    },
    {
        "category": "Convulsions / Fits / Eclampsia",
        "citation": "ESC-1.1",
        "patterns": [
            r"\b(convulsion(s)?|fit(s)?|daur(a|e)|mirgi|seizure(s)?|eclampsia)\b",
            r"\b(loss\s*of\s*consciousness|unconscious(ness)?|behosh(i)?)\b",
            r"\b(cannot\s*be\s*awakened|abnormally\s*sleepy\s*and\s*unresponsive)\b"
        ],
        "require_context": None,
        "referral_text": "URGENT: Refer Immediately to Chandrapuri District Hospital. Eclampsia and convulsions carry high mortality risk. Call 108. Turn patient onto left side to keep airway clear; never place anything in the mouth; do not give oral liquids."
    },

    # 3. Severe Pre-Eclampsia / Hypertensive Crisis in Pregnancy (ESC-1.1)
    {
        "category": "Imminent Pre-Eclampsia / Hypertensive Crisis",
        "citation": "ESC-1.1",
        "patterns": [
            r"\b(blurred\s*vision|blurry\s*vision|seeing\s*spots|dhundhla\s*dikh|severe\s*headache\s*and\s*bp|sar\s*dard.*bp|headache.*blurr)\b",
            r"\b(bp\s*(1[6-9][0-9]|2[0-9]{2})\s*/\s*(1[1-9][0-9]|[9][5-9]))\b"
        ],
        "require_context": ["pregnant", "garbh", "trimester", "month", "mother", "mahila", "woman"],
        "referral_text": "URGENT: Refer Immediately to Chandrapuri District Hospital. Severe headache, visual disturbance, and high BP signify impending eclampsia. Administer first dose magnesium sulphate if trained ANM available; call 108 ambulance."
    },

    # 4. Reduced or Absent Fetal Movement (ESC-1.1)
    {
        "category": "Reduced or Absent Fetal Movements",
        "citation": "ESC-1.1",
        "patterns": [
            r"\b(no\s*fetal\s*movement(s)?|fetal\s*movement(s)?\s*(stopped|absent|reduced|decrease)|bacche\s*ka\s*hilna\s*(band|kam|nahi))\b",
            r"\b(hilna\s*dulna.*band|movement.*(band|nahi|stopped|absent)|hilna\s*dulna\s*bilkul\s*band)\b",
            r"\b(bacche\s*ka\s*hilna.*(band|kam|nahi))\b"
        ],
        "require_context": None,
        "referral_text": "URGENT: Refer Immediately to Chandrapuri District Hospital. Absent or reduced fetal movements indicate acute fetal distress. Call 108 ambulance for immediate obstetric evaluation."
    },

    # 5. Prolonged Labour or Cord Prolapse (ESC-1.2)
    {
        "category": "Complicated or Prolonged Labour",
        "citation": "ESC-1.2",
        "patterns": [
            r"\b(cord\s*prolapse|umbilical\s*cord\s*(visible|protruding|bahar))\b",
            r"\b(labour\s*(pain(s)?)?.*(1[2-9]|[2-9][0-9])\s*hour(s)?|(1[2-9]|[2-9][0-9])\s*hour(s)?.*labour|labour\s*pain\s*14\s*ghante|prolonged\s*labour)\b",
            r"\b(water\s*break(s)?\s*(more\s*than|over|>)?\s*(1[8-9]|[2-9][0-9])\s*hour(s)?|prom\s*>|hand\s*presentation|breech\s*presentation)\b"
        ],
        "require_context": None,
        "referral_text": "URGENT: Refer Immediately to Chandrapuri District Hospital. Prolonged labour and cord prolapse are life-threatening delivery emergencies. For cord prolapse: place mother in knee-chest position, wrap cord in sterile cloth, and call 108 immediately."
    },

    # 6. Severe Postpartum Haemorrhage (PPH) or Sepsis (ESC-1.3)
    {
        "category": "Severe Postpartum Haemorrhage / Sepsis",
        "citation": "ESC-1.3",
        "patterns": [
            r"\b(soaking\s*(more\s*than|>)?\s*[2-9]\s*(large\s*)?pads|soaking\s*3\s*pads|pad(s)?\s*in\s*an\s*hour|pad(s)?\s*in\s*1\s*hour)\b",
            r"\b(postpartum\s*haemorrhage|pph|heavy\s*bleed(ing)?\s*after\s*deliver(y)?|deliver(ed)?\s*.*bleeding\s*heav)\b",
            r"\b(foul\s*smelling\s*(lochia|discharge)\s*and\s*fever|puerperal\s*sepsis)\b"
        ],
        "require_context": None,
        "referral_text": "URGENT: Refer Immediately to Chandrapuri District Hospital. Severe PPH can lead to hypovolemic shock within hours. Call 108. Perform uterine massage, keep mother warm, and transfer with skilled escort."
    },

    # 7. Newborn Inability to Feed, Severe Chest Indrawing, Fast Breathing, Hypothermia, Jaundice (ESC-2.1)
    {
        "category": "Critical Newborn / Young Infant Danger Signs",
        "citation": "ESC-2.1",
        "patterns": [
            r"\b(unable\s*to\s*(feed|suck|breastfeed)|refus(ing)?\s*to\s*(feed|suck|breastfeed)|doodh\s*nahi\s*pi\s*pa\s*raha|feeding\s*band)\b",
            r"\b(chest\s*indrawing|lower\s*chest\s*(moves|drawing|goes)\s*deep|chhati\s*dhas\s*rahi)\b",
            r"\b(breath(ing)?\s*(rate)?\s*([6-9][0-9]|1[0-9]{2})\s*(breaths|times|per\s*min)|breathing\s*68\s*times|fast\s*breathing\s*newborn)\b",
            r"\b(hypothermia|body\s*feels?\s*cold|temperature\s*(less\s*than|<)?\s*35(\.5)?\s*(c)?|thanda\s*pad\s*gaya)\b",
            r"\b(yellow\s*(palms|soles)|palms.*yellow|soles.*yellow|deep\s*yellow|jaundice\s*.*(first\s*24|24\s*hours)|peelapan\s*24\s*ghante|gasping|grunting)\b",
            r"\b(turned\s*deep\s*yellow|whole\s*body.*yellow)\b"
        ],
        "require_context": ["newborn", "baby", "infant", "shishu", "baccha", "child", "day", "month"],
        "referral_text": "URGENT: Refer Immediately to Chandrapuri District Hospital SNCU. Young infant danger signs indicate severe infection, pneumonia, or life-threatening neonatal jaundice. Keep infant warm using skin-to-skin wrapping; call 108."
    },

    # 8. Child Danger Signs (Stiff neck, vomiting everything, continuous seizures) (ESC-2.2)
    {
        "category": "Child General Danger Signs",
        "citation": "ESC-2.2",
        "patterns": [
            r"\b(stiff\s*neck|gardan\s*akdi|neck\s*stiffness)\b",
            r"\b(vomit(s|ing)?\s*everything|cannot\s*keep\s*anything\s*down|jo\s*bhi\s*khata\s*hai\s*ulti)\b",
            r"\b(stridor\s*in\s*a\s*calm\s*child|stridor\s*at\s*rest)\b"
        ],
        "require_context": None,
        "referral_text": "URGENT: Refer Immediately to Chandrapuri District Hospital. General danger signs in childhood illness point to meningitis or severe obstructive airway disease. Transport immediately without delay."
    }
]

# Negation check: ensure user is not saying "no bleeding", "fever resolved", "not having fits"
NEGATION_PATTERNS = [
    r"\b(no\s*bleed(ing)?|without\s*bleed(ing)?|bleeding\s*nahi|nahi\s*hai\s*bleed(ing)?)\b",
    r"\b(no\s*fever|bukhar\s*nahi|temperature\s*normal)\b",
    r"\b(no\s*fit(s)?|daure\s*nahi)\b"
]

def check_emergency_danger_signs(question: str) -> Optional[Dict[str, Any]]:
    """
    Evaluates question text for deterministic emergency danger signs.
    Returns escalation details dict if danger detected, else None.
    """
    normalized = normalize_text(question)

    for entry in DANGER_PATTERNS:
        # Check context requirement if present
        if entry["require_context"]:
            context_matched = any(re.search(rf"\b{ctx}\b", normalized) for ctx in entry["require_context"])
            if not context_matched:
                continue

        for pat in entry["patterns"]:
            match = re.search(pat, normalized)
            if match:
                # Check for explicit negation of the matched pattern
                is_negated = False
                matched_span = match.span()
                matched_text = normalized[max(0, matched_span[0]-25):min(len(normalized), matched_span[1]+25)]
                for neg in NEGATION_PATTERNS:
                    if re.search(neg, matched_text):
                        is_negated = True
                        break

                if not is_negated:
                    return {
                        "escalate": True,
                        "danger_category": entry["category"],
                        "citation_id": entry["citation"],
                        "referral_action": entry["referral_text"],
                        "matched_rule": pat
                    }

    return None
