"""
Citation validation and leaf-section resolution for SwasthyaSaathi.
Ensures that all generated answers cite only real, verified leaf section IDs (e.g. ANC-1.2, ESC-2.1)
and never cite more than two sections.
"""
from typing import List
from .retrieval import get_knowledge_base

def validate_and_filter_citations(candidate_ids: List[str], max_citations: int = 2) -> List[str]:
    """
    Validates candidates against loaded leaf section IDs.
    Returns at most max_citations (1 or 2). Never invents section IDs.
    """
    kb = get_knowledge_base()
    valid_ids = {sec["section_id"] for sec in kb.sections}

    filtered = []
    for cid in candidate_ids:
        cleaned = cid.strip().upper()
        if cleaned in valid_ids and cleaned not in filtered:
            filtered.append(cleaned)
        if len(filtered) >= max_citations:
            break

    return filtered
