export interface AshaWorker {
  asha_id: string;
  name: string;
  village: string;
  phone: string;
  assigned_households: number;
}

export interface Household {
  household_id: string;
  village: string;
  asha_id: string;
  head_name: string;
  contact_no: string;
}

export interface Member {
  member_id: string;
  household_id: string;
  village: string;
  asha_id: string;
  name: string;
  gender: string;
  age: number;
  dob: string;
  is_pregnant: string;
  lmp?: string;
  hrp_status?: string;
  anc_visits_completed?: number;
  td_doses?: number;
  delivery_type?: string;
  dob_infant?: string;
  vaccines_received?: string;
  muac_cm?: string;
  muac_category?: string;
  last_muac_date?: string;
  bp_systolic?: string;
  bp_diastolic?: string;
  htn_diagnosed?: string;
  last_htn_visit?: string;
  rbs_mgdl?: string;
  dm_diagnosed?: string;
  last_dm_visit?: string;
}

export interface ProtocolSection {
  section_id: string;
  title: string;
  content: string;
}

export interface ProtocolDoc {
  id: string;
  filename: string;
  title: string;
  full_markdown: string;
  sections: ProtocolSection[];
}

export interface DueVisitItem {
  member_id: string;
  due_item: string;
  priority: number;
  reason: string;
  name: string;
  village: string;
  asha_id: string;
  household_id: string;
  completed?: boolean;
  completed_date?: string;
}

export interface QuestionAnswer {
  question_id?: string;
  question_text: string;
  answer_text: string;
  cited_section_ids: string[];
  escalate: boolean;
  refused: boolean;
  latency_ms: number;
  danger_category?: string | null;
  referral_action?: string | null;
}

export interface DevTruthItem {
  question_id: string;
  question_text: string;
  expected_answer: string;
  cited_section_ids: string[];
  escalate: boolean;
  refused: boolean;
  key_facts: string[];
}

export interface FootprintData {
  model_names: string[];
  model_size_mb: number;
  peak_ram_mb: number;
  median_latency_ms_cpu: number;
  offline: boolean;
}

export interface BenchmarkResult {
  gate_passed: boolean;
  must_escalate_caught: number;
  must_escalate_total: number;
  false_escalated: number;
  non_danger_total: number;
  escalation_recall: number;
  false_escalation_rate: number;
  refusal_accuracy: number;
  citation_f1: number;
  key_fact_coverage: number;
  visit_score: number;
  composite_score: number;
  median_latency_ms: number;
}
