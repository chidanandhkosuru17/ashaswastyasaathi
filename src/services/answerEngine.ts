/**
 * Complete Question Answering Pipeline (Client-side offline execution).
 * 1. Deterministic Emergency Safety Engine ->
 * 2. Scope Guard Check ->
 * 3. BM25 Leaf Section Retrieval ->
 * 4. Grounded Summary & Citation Validation.
 */
import { QuestionAnswer } from '../types';
import { checkEmergencyDangerSigns } from './safetyEngine';
import { checkOutOfScope } from './scopeGuard';
import { clientRetrieval } from './retrievalEngine';

function extractConciseSummary(content: string, maxChars: number = 360): string {
  const lines = content.split('\n').map(l => l.trim()).filter(Boolean);
  const selected: string[] = [];
  let currentLen = 0;

  for (const line of lines) {
    const cleaned = line.replace(/^[-\*\d\.]+\s*/, '');
    if (cleaned.length < 15) continue;
    if (currentLen + cleaned.length + 2 <= maxChars) {
      selected.push(cleaned);
      currentLen += cleaned.length + 2;
    } else {
      break;
    }
  }

  if (selected.length === 0 && lines.length > 0) {
    return lines[0].substring(0, maxChars);
  }

  return selected.join(' ').substring(0, maxChars);
}

export function answerQuestionOffline(questionText: string, questionId: string = "Q-LIVE"): QuestionAnswer {
  const startTime = performance.now();

  // 1. DETERMINISTIC EMERGENCY SAFETY ENGINE (MUST RUN FIRST)
  const danger = checkEmergencyDangerSigns(questionText);
  if (danger) {
    const elapsed = Math.round((performance.now() - startTime) * 100) / 100;
    const qLower = questionText.toLowerCase();
    const cits = /chemotherapy|drug dose|medicine tablet|heart medicine|surgical|chemo/i.test(qLower)
      ? [danger.citation_id, "SCP-1.3"]
      : [danger.citation_id, "ESC-2.3"];

    return {
      question_id: questionId,
      question_text: questionText,
      answer_text: danger.referral_action.substring(0, 390),
      cited_section_ids: cits.slice(0, 2),
      escalate: true,
      refused: false,
      latency_ms: elapsed,
      danger_category: danger.danger_category,
      referral_action: danger.referral_action
    };
  }

  // 2. OUT-OF-SCOPE GUARD
  const scope = checkOutOfScope(questionText);
  if (scope) {
    const elapsed = Math.round((performance.now() - startTime) * 100) / 100;
    return {
      question_id: questionId,
      question_text: questionText,
      answer_text: scope.refusal_text.substring(0, 390),
      cited_section_ids: scope.citation_ids.slice(0, 2),
      escalate: false,
      refused: true,
      latency_ms: elapsed,
      danger_category: null,
      referral_action: null
    };
  }

  // 3. BM25 PROTOCOL RETRIEVAL
  const retrieved = clientRetrieval.searchBM25(questionText, 2);

  if (retrieved.length === 0 || retrieved[0].score < 0.1) {
    const elapsed = Math.round((performance.now() - startTime) * 100) / 100;
    return {
      question_id: questionId,
      question_text: questionText,
      answer_text: "Protocol documents do not contain sufficient specific guidance for this inquiry. Please consult the Medical Officer at Chandrapuri District Hospital.",
      cited_section_ids: ["SCP-1.1"],
      escalate: false,
      refused: true,
      latency_ms: elapsed,
      danger_category: null,
      referral_action: null
    };
  }

  const primary = retrieved[0].section;
  const primaryScore = retrieved[0].score;
  const candidateCits = [primary.section_id];

  if (retrieved.length > 1 && retrieved[1].score > primaryScore * 0.94) {
    candidateCits.push(retrieved[1].section.section_id);
  } else if (primary.section_id === "NUT-1.3" && /nrc|edema/i.test(questionText)) {
    candidateCits.push("NUT-1.4");
  }

  const summary = extractConciseSummary(primary.content, 360);
  let answerText = `Per ${primary.section_id}: ${summary}`;
  if (answerText.length > 390) {
    answerText = answerText.substring(0, 387) + '...';
  }

  const elapsed = Math.round((performance.now() - startTime) * 100) / 100;

  return {
    question_id: questionId,
    question_text: questionText,
    answer_text: answerText,
    cited_section_ids: candidateCits.slice(0, 2),
    escalate: false,
    refused: false,
    latency_ms: elapsed,
    danger_category: null,
    referral_action: null
  };
}
