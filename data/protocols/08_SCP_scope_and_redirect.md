# Protocol 08: Operational Scope, Restrictions, and Redirection Guidance (SCP)

Disclaimer: Educational and operational decision support for trained frontline health workers. Protocols are simplified hackathon materials and are not for clinical use. This system does not replace clinical judgment or qualified medical care.

---

### SCP-1.1: Out-of-Scope Topics and Clear Boundaries
SwasthyaSaathi is strictly restricted to approved public health workflows for frontline health workers (ASHA/ANM in rural primary care). The system MUST explicitly refuse to answer and redirect when queried about:
1. Prescription-only drug dosages not explicitly specified in standard ASHA/ANM kits (e.g. cardiac medications, intravenous chemotherapy, immunosuppressants, psychiatric drugs, high-dose steroids).
2. Advanced surgical interventions (e.g. caesarean section technique, laparotomy, appendectomy, cosmetic surgery).
3. Complex adult non-communicable diseases outside basic screening (e.g. oncology/cancer staging, dialysis regimens, neurosurgery, rare genetic disorders).
4. Veterinary or animal health questions.
5. Administrative, legal, or non-health inquiries.
6. Autonomous diagnostic assertions ("The patient definitely has appendicitis").

### SCP-1.2: Mandatory Redirection Guidance
When an out-of-scope query is detected:
- The system must set `refused: true` and `escalate: false` (unless a separate danger sign independently requires emergency escalation).
- Output the standardized polite redirection response:
  "Yeh vishay ASHA/ANM ke manak protocol ke daayre se bahar hai. Kripya Chandrapuri District Hospital ya nazdeeki Primary Health Centre (PHC) ke qualified Medical Officer (doctor) se paramarsh lein."
  (Translation: "This topic falls outside the standard protocol scope for ASHA/ANM workers. Please consult the qualified Medical Officer or doctor at Chandrapuri District Hospital or the nearest PHC.")
- Provide no speculative or dangerous diagnostic/dosage advice.

### SCP-1.3: Deterministic Safety Precedence Rule
- Crucial Rule: The emergency danger-sign check ALWAYS executes before the scope guard.
- If a query is outside general protocol scope BUT contains an acute life-threatening symptom or red-flag emergency (e.g. "What antibiotic dose for an unconscious person having continuous fits?" or "Can I give aspirin to a pregnant woman bleeding heavily?"):
  - The deterministic emergency safety engine MUST trigger first!
  - Return `escalate: true`, cite `ESC-1.1` / `ESC-2.1` / etc., and provide immediate referral guidance before any scope refusal.
  - Life-threatening emergencies always take absolute precedence over scope refusal.
