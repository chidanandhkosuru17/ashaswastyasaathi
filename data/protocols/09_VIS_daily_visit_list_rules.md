# Protocol 09: Daily Household Visit-List Generation Rules (VIS)

Disclaimer: Educational and operational decision support for trained frontline health workers. Protocols are simplified hackathon materials and are not for clinical use. This system does not replace clinical judgment or qualified medical care.

---

### VIS-1.1: Planning Scope and Reference Baseline Date
- Target Community: Chandrapuri Block comprising 6 villages (Amrapur, Belwadi Tola, Kesarganj, Dhanpura, Navagaon Khurd, Sitapahari) served by 5 ASHA workers.
- Household Dataset: 500 households, 2,234 registered members.
- Official Development Validation Date: 26 October 2026 (Monday). The household register contains historic event records up to 25 October 2026.
- All date calculations and priority classifications for the benchmark must strictly use 26 October 2026 (`2026-10-26`).

### VIS-1.2: Due-Item Eligibility and Calculation Logic
1. Antenatal Care (ANC) Visits:
   - Calculate gestational age in weeks as of planning date: `(Planning_Date - LMP) / 7`.
   - `ANC_VISIT_1`: 0 to 12 completed weeks. Due if pregnant and no ANC visit recorded yet.
   - `ANC_VISIT_2`: 14 to 26 weeks. Due if pregnant and latest recorded ANC visit was visit 1 (or none).
   - `ANC_VISIT_3`: 28 to 34 weeks. Due if pregnant and latest recorded ANC visit was visit 2 (or fewer).
   - `ANC_VISIT_4`: 36 weeks up to delivery. Due if pregnant and latest ANC visit was visit 3 (or fewer).

2. Tetanus-Diphtheria (Td) Immunisation in Pregnancy:
   - `TD_PREG_1`: Due as soon as pregnancy registered if 0 Td doses recorded.
   - `TD_PREG_2`: Due 4 weeks (28 days) after `TD_PREG_1` if only 1 dose recorded.
   - `TD_BOOSTER`: Due if pregnant woman had 2 doses in a prior pregnancy within last 3 years.

3. High-Risk Pregnancy (HRP) Follow-up:
   - `HRP_FOLLOWUP`: Due every 14 days for any pregnant woman with HRP flag (severe anaemia Hb < 7, BP >= 140/90, age < 18 or > 35, multiple gestation, past C-section) if last visit was >= 14 days ago.

4. Home-Based Newborn Care (HBNC) Visits:
   - Calculate infant age in days: `Planning_Date - Date_of_Birth`.
   - Institutional delivery schedule: Day 3 (`HBNC_D3`), Day 7 (`HBNC_D7`), Day 14 (`HBNC_D14`), Day 21 (`HBNC_D21`), Day 28 (`HBNC_D28`), Day 42 (`HBNC_D42`).
   - Home delivery schedule: Includes Day 1 (`HBNC_D1`) plus Days 3, 7, 14, 21, 28, and 42.
   - A visit is due if current age has reached or passed the visit day and that specific visit has not been logged.

5. Childhood Immunisation Doses:
   - At birth (< 15 days): `BCG`, `OPV_0`, `HEP_B_0`.
   - At 6 weeks (42 days): `OPV_1`, `PENTA_1`, `ROTA_1`, `FIPV_1`, `PCV_1`.
   - At 10 weeks (70 days): `OPV_2`, `PENTA_2`, `ROTA_2`.
   - At 14 weeks (98 days): `OPV_3`, `PENTA_3`, `ROTA_3`, `FIPV_2`, `PCV_2`.
   - At 9 months (270 days): `MR_1`, `JE_1`, `PCV_B`, `VIT_A_1`.
   - At 16-24 months (480 days): `MR_2`, `DPT_B1`, `OPV_B`, `VIT_A_2`.
   - At 5-6 years: `DPT_B2`.
   - At 10 years: `TD_10`.
   - At 16 years: `TD_16`.

6. Malnutrition (MUAC) Screening:
   - `MUAC_SCREENING`: Due monthly (every 30 days) for children aged 6 to 59 months previously identified as SAM (MUAC < 11.5 cm) or MAM (MUAC 11.5 - 12.4 cm).
   - Due quarterly (every 90 days) for all other registered children aged 6 to 59 months.

7. Non-Communicable Diseases (NCD) Follow-up:
   - `HTN_FOLLOWUP`: Due every 30 days for diagnosed hypertensive individuals (age >= 30).
   - `DM_FOLLOWUP`: Due every 30 days for diagnosed diabetic individuals (age >= 30).

### VIS-1.3: Priority Assignment Rules
Each due visit item MUST be assigned an integer priority:
- Priority 1 (High-Risk and Due/Overdue):
  - Any `HRP_FOLLOWUP` visit.
  - Any infant under 7 days of age requiring HBNC (`HBNC_D1`, `HBNC_D3`, `HBNC_D7`).
  - SAM children due for MUAC screening or follow-up.
  - Overdue visits where the scheduled date is more than 30 days in the past.
  - Hypertensive or diabetic patients overdue for follow-up by more than 14 days.
- Priority 2 (Routine Due / Currently Overdue):
  - Routine ANC visits (`ANC_VISIT_1`, `ANC_VISIT_2`, `ANC_VISIT_3`, `ANC_VISIT_4`) currently due.
  - Routine immunisation doses currently due or overdue by <= 30 days.
  - Routine HBNC visits for Days 14, 21, 28, and 42.
  - Routine NCD monthly follow-ups due.
  - Routine quarterly MUAC screening due.
- Priority 3 (Due This Week / Proactive Window):
  - Any scheduled visit or immunisation becoming due within the next 7 calendar days (26 October 2026 to 1 November 2026 inclusive).

### VIS-1.4: Output Requirements
- File name: `H5_visit_list.csv`
- Header: `member_id,due_item,priority`
- Rows must cover the entire 500-household register.
- Unique combinations of `member_id` and `due_item` only.
