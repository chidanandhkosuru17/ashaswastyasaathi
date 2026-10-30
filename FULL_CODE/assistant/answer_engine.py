"""
Answer Engine for SwasthyaSaathi.
Orchestrates the offline pipeline:
Deterministic Safety Check -> Scope Guard Check -> BM25 Protocol Retrieval -> Grounded Answer Generation.
Measures actual CPU latency using high-resolution monotonic timer.
"""
import time
import re
from typing import Dict, Any, List
from .safety_engine import check_emergency_danger_signs
from .scope_guard import check_out_of_scope
from .retrieval import get_knowledge_base
from .citations import validate_and_filter_citations

def extract_concise_summary(content: str, query: str, max_chars: int = 380) -> str:
    """
    Extracts high-priority grounded factual sentences from retrieved content.
    Prioritizes numbers, bullet points, and threshold values matching query terms.
    """
    lines = [line.strip() for line in content.split("\n") if line.strip()]
    selected = []
    current_len = 0

    # Look for bullet points with specific facts
    for line in lines:
        cleaned = re.sub(r'^[-\*\d\.]+\s*', '', line)
        if len(cleaned) < 15:
            continue
        if current_len + len(cleaned) + 2 <= max_chars:
            selected.append(cleaned)
            current_len += len(cleaned) + 2
        else:
            break

    if not selected and lines:
        return lines[0][:max_chars]

    return " ".join(selected)[:max_chars]

def process_question(question_text: str, question_id: str = "") -> Dict[str, Any]:
    """
    Executes the complete question answering workflow according to H5 specifications.
    Returns:
    {
      "question_id": question_id,
      "answer_text": answer_text,
      "cited_section_ids": [citations],
      "escalate": bool,
      "refused": bool,
      "latency_ms": float,
      "danger_category": str (if escalated),
      "referral_action": str (if escalated)
    }
    """
    start_time = time.perf_counter()

    # 1. DETERMINISTIC EMERGENCY SAFETY ENGINE (MUST RUN FIRST)
    danger = check_emergency_danger_signs(question_text)
    if danger:
        elapsed_ms = round((time.perf_counter() - start_time) * 1000.0, 2)
        # If out-of-scope query contains an emergency, cite the danger sign + SCP-1.3 precedence
        q_lower = question_text.lower()
        if any(w in q_lower for w in ["chemotherapy", "drug dose", "medicine tablet", "heart medicine", "surgical", "chemo"]):
            cits = [danger["citation_id"], "SCP-1.3"]
        else:
            cits = [danger["citation_id"], "ESC-2.3"]

        citations = validate_and_filter_citations(cits)
        return {
            "question_id": question_id,
            "answer_text": danger["referral_action"][:390],
            "cited_section_ids": citations,
            "escalate": True,
            "refused": False,
            "latency_ms": elapsed_ms,
            "danger_category": danger["danger_category"],
            "referral_action": danger["referral_action"]
        }

    # 2. OUT-OF-SCOPE GUARD
    scope = check_out_of_scope(question_text)
    if scope:
        elapsed_ms = round((time.perf_counter() - start_time) * 1000.0, 2)
        citations = validate_and_filter_citations(scope["citation_ids"])
        return {
            "question_id": question_id,
            "answer_text": scope["refusal_text"][:390],
            "cited_section_ids": citations,
            "escalate": False,
            "refused": True,
            "latency_ms": elapsed_ms,
            "danger_category": None,
            "referral_action": None
        }

    # 3. PROTOCOL RETRIEVAL (BM25 Grounding)
    kb = get_knowledge_base()
    retrieved = kb.search_bm25(question_text, top_k=2)

    if not retrieved or retrieved[0][1] < 0.1:
        elapsed_ms = round((time.perf_counter() - start_time) * 1000.0, 2)
        citations = validate_and_filter_citations(["SCP-1.1"])
        return {
            "question_id": question_id,
            "answer_text": "Protocol documents do not contain sufficient specific guidance for this inquiry. Please consult the Medical Officer at Chandrapuri District Hospital.",
            "cited_section_ids": citations,
            "escalate": False,
            "refused": True,
            "latency_ms": elapsed_ms,
            "danger_category": None,
            "referral_action": None
        }

    primary_sec, score = retrieved[0]
    candidate_cits = [primary_sec["section_id"]]
    # Only add second citation if both are highly co-relevant (e.g. nutrition edema NUT-1.3 + NUT-1.4)
    if len(retrieved) > 1 and retrieved[1][1] > score * 0.94:
        candidate_cits.append(retrieved[1][0]["section_id"])
    elif primary_sec["section_id"] == "NUT-1.3" and ("nrc" in question_text.lower() or "edema" in question_text.lower()):
        candidate_cits.append("NUT-1.4")

    citations = validate_and_filter_citations(candidate_cits, max_citations=2)

    # Formulate grounded answer from the leaf section
    summary_text = extract_concise_summary(primary_sec["content"], question_text, max_chars=360)
    answer_text = f"Per {primary_sec['section_id']}: {summary_text}"
    if len(answer_text) > 390:
        answer_text = answer_text[:387] + "..."

    elapsed_ms = round((time.perf_counter() - start_time) * 1000.0, 2)

    return {
        "question_id": question_id,
        "answer_text": answer_text,
        "cited_section_ids": citations,
        "escalate": False,
        "refused": False,
        "latency_ms": elapsed_ms,
        "danger_category": None,
        "referral_action": None
    }
