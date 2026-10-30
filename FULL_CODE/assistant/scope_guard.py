"""
Scope Guard module for SwasthyaSaathi.
Implements out-of-scope detection and redirection guidance from:
08_SCP_scope_and_redirect.md
"""
import re
from typing import Dict, Any, Optional

OUT_OF_SCOPE_PATTERNS = [
    # 1. Advanced surgical procedures
    r"\b(surg(ical|ery)|caesarean\s*section\s*technique|laparotomy|appendectomy|hernia\s*repair|surgical\s*sutures?|operating\s*room)\b",
    # 2. Prescription chemotherapy / oncology
    r"\b(chemo(therapy)?|doxorubicin|cisplatin|paclitaxel|cyclophosphamide|infusion\s*rate|cancer\s*staging|metastasis|oncology)\b",
    # 3. Intensive care / restricted drugs
    r"\b(vancomycin|meropenem|icu\s*care|dialysis|intubation|prescribe\s*metformin|cardiac\s*medication)\b",
    # 4. Animal / veterinary medicine
    r"\b(gaay|cow|buffalo|bhains|dog|kutta|animal|veterinary|pashu|cattle)\b",
    # 5. Cosmetic dermatology / aesthetic
    r"\b(chemical\s*peel|melasma|wrinkles|botox|cosmetic|plastic\s*surgery)\b",
    # 6. Unapproved adult procedures / legal
    r"\b(post\s*mortem|legal\s*dispute|land\s*dispute)\b"
]

def check_out_of_scope(question: str) -> Optional[Dict[str, Any]]:
    """
    Checks if a query falls outside public health frontline protocol scope.
    Returns refusal information if out of scope, else None.
    """
    text = question.lower()
    for pat in OUT_OF_SCOPE_PATTERNS:
        if re.search(pat, text):
            # Special case for animals: give veterinary guidance
            if re.search(r"\b(gaay|cow|buffalo|bhains|dog|kutta|animal|veterinary|pashu|cattle)\b", text):
                redirect_msg = (
                    "Yeh vishay ASHA/ANM ke manak protocol ke daayre se bahar hai. "
                    "Kripya nazdeeki veterinary doctor (pashu chikitsak) se paramarsh lein."
                )
            else:
                redirect_msg = (
                    "Yeh vishay ASHA/ANM ke manak protocol ke daayre se bahar hai. "
                    "Kripya Chandrapuri District Hospital ya nazdeeki PHC ke qualified Medical Officer (doctor) se paramarsh lein."
                )

            return {
                "refused": True,
                "escalate": False,
                "citation_ids": ["SCP-1.1", "SCP-1.2"],
                "refusal_text": redirect_msg
            }
    return None
