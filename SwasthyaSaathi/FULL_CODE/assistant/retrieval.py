"""
Protocol Retrieval Engine for SwasthyaSaathi.
Parses the 9 Markdown protocol documents into leaf sections (e.g. ANC-1.2, ESC-2.1)
and implements BM25 keyword matching with Hinglish synonym expansion.
"""
import os
import re
import glob
import math
from typing import List, Dict, Any, Tuple

# Domain term mapping for Hinglish/Hindi synonyms
SYNONYM_EXPANSIONS = {
    "tika": "immunisation vaccine immunization dose",
    "teeka": "immunisation vaccine immunization dose",
    "teeke": "immunisation vaccine immunization doses",
    "bukhar": "fever temperature paracetamol",
    "dast": "diarrhoea diarrhea dehydration ors zinc",
    "garbh": "pregnancy pregnant antenatal anc maternal",
    "garbhvati": "pregnant pregnancy antenatal anc woman",
    "bachha": "child infant newborn pediatric baby",
    "baccha": "child infant newborn pediatric baby",
    "bacche": "child infant newborn pediatric baby",
    "navjaat": "newborn infant young infant hbnc",
    "shishu": "infant newborn child baby",
    "janam": "birth delivery newborn",
    "doodh": "breastfeeding breast milk colostrum feed",
    "sthanpan": "breastfeeding exclusive lactation",
    "chhati": "chest respiratory pneumonia breathing",
    "sans": "breathing respiratory pneumonia fast breathing",
    "kuposhan": "malnutrition muac sam mam wasting edema",
    "sujan": "swelling edema pitting bilateral",
    "vajan": "weight anthropometric wasting",
    "goli": "tablet dose iron calcium paracetamol",
    "rakt": "blood hemoglobin anaemia anemia",
    "raktasrav": "bleeding haemorrhage hemorrhage",
    "chakkarg": "headache dizziness hypertension eclampsia",
    "nal": "cord umbilical cord stump",
    "aahar": "food nutrition complementary feeding iycf",
    "upari": "complementary feeding semi-solid",
    "daure": "convulsions fits seizures eclampsia",
    "behoshi": "unconscious lethargic coma"
}

class ProtocolKnowledgeBase:
    def __init__(self, protocols_dir: str = "data/protocols"):
        self.protocols_dir = protocols_dir
        self.sections: List[Dict[str, Any]] = []
        self.doc_freqs: Dict[str, int] = {}
        self.avg_doc_len: float = 0.0
        self.total_docs: int = 0
        self._load_and_index_protocols()

    def _tokenize(self, text: str) -> List[str]:
        cleaned = re.sub(r'[^a-zA-Z0-9\s-]', ' ', text.lower())
        tokens = cleaned.split()
        expanded_tokens = []
        for t in tokens:
            expanded_tokens.append(t)
            if t in SYNONYM_EXPANSIONS:
                expanded_tokens.extend(SYNONYM_EXPANSIONS[t].split())
        return expanded_tokens

    def _load_and_index_protocols(self):
        md_files = sorted(glob.glob(os.path.join(self.protocols_dir, "*.md")))
        all_sections = []

        for fpath in md_files:
            fname = os.path.basename(fpath)
            with open(fpath, "r", encoding="utf-8") as f:
                content = f.read()

            # Split by leaf sections: ### ID: Title
            raw_parts = re.split(r'\n(?=###\s+[A-Z]{3}-\d+\.\d+)', content)
            for part in raw_parts:
                match = re.search(r'###\s+([A-Z]{3}-\d+\.\d+):\s*([^\n]+)', part)
                if match:
                    sec_id = match.group(1).strip()
                    sec_title = match.group(2).strip()
                    # Clean section body
                    body = part[match.end():].strip()
                    tokens = self._tokenize(sec_title + " " + body)
                    all_sections.append({
                        "section_id": sec_id,
                        "title": sec_title,
                        "content": body,
                        "full_text": f"{sec_title}\n{body}",
                        "source_file": fname,
                        "tokens": tokens,
                        "token_len": len(tokens)
                    })

        self.sections = all_sections
        self.total_docs = len(all_sections)

        # Build BM25 document frequencies
        if self.total_docs > 0:
            self.avg_doc_len = sum(s["token_len"] for s in all_sections) / self.total_docs
            doc_freqs: Dict[str, int] = {}
            for s in all_sections:
                unique_tokens = set(s["tokens"])
                for tok in unique_tokens:
                    doc_freqs[tok] = doc_freqs.get(tok, 0) + 1
            self.doc_freqs = doc_freqs

    def search_bm25(self, query: str, top_k: int = 2) -> List[Tuple[Dict[str, Any], float]]:
        """
        BM25 ranking for the query across leaf sections.
        """
        if not self.sections or self.total_docs == 0:
            return []

        query_tokens = self._tokenize(query)
        if not query_tokens:
            return [(self.sections[0], 0.0)]

        k1 = 1.5
        b = 0.75
        scores = []

        for sec in self.sections:
            score = 0.0
            doc_len = sec["token_len"]
            term_counts = {}
            for t in sec["tokens"]:
                term_counts[t] = term_counts.get(t, 0) + 1

            for q_tok in query_tokens:
                if q_tok in term_counts:
                    tf = term_counts[q_tok]
                    df = self.doc_freqs.get(q_tok, 1)
                    # Lucene-style IDF
                    idf = math.log(1.0 + (self.total_docs - df + 0.5) / (df + 0.5))
                    numerator = tf * (k1 + 1.0)
                    denominator = tf + k1 * (1.0 - b + b * (doc_len / (self.avg_doc_len or 1.0)))
                    score += idf * (numerator / denominator)

            # Boost if query explicitly mentions the section category or id
            sec_id = sec["section_id"]
            sec_prefix = sec_id.split("-")[0].lower()
            q_lower = query.lower()

            if sec_prefix in q_lower:
                score += 4.0
            if sec_id.lower() in q_lower:
                score += 15.0

            # Domain-specific routing boosts
            if any(w in q_lower for w in ["tika", "teeka", "teeke", "vaccin", "birth dose", "6 hafte", "9 mahine", "pentavalent", "bcg", "opv"]):
                if sec_prefix == "imm":
                    score += 6.0
                if "birth" in q_lower or "janam ke samay" in q_lower:
                    if sec_id == "IMM-1.1":
                        score += 8.0
                elif "6 hafte" in q_lower or "6 week" in q_lower:
                    if sec_id == "IMM-1.2":
                        score += 8.0
                elif "9 mahine" in q_lower or "9 month" in q_lower:
                    if sec_id == "IMM-1.5":
                        score += 8.0

            if any(w in q_lower for w in ["hbnc", "ghar par delivery", "home delivery", "hospital mein janam", "institutional delivery", "kmc", "kangaroo", "nal", "cord care", "breastfeed", "colostrum", "sthanpan"]):
                if sec_prefix == "hbnc":
                    score += 7.0
                if "colostrum" in q_lower or "exclusive breastfeeding" in q_lower:
                    if sec_id == "HBNC-1.4":
                        score += 10.0
                elif "institutional" in q_lower or "hospital" in q_lower:
                    if sec_id == "HBNC-1.1":
                        score += 9.0
                elif "ghar par" in q_lower or "home delivery" in q_lower:
                    if sec_id == "HBNC-1.2":
                        score += 9.0
                elif "kmc" in q_lower or "kangaroo" in q_lower:
                    if sec_id == "HBNC-1.3":
                        score += 9.0
                elif "nal" in q_lower or "cord" in q_lower:
                    if sec_id == "HBNC-1.5":
                        score += 9.0

            if any(w in q_lower for w in ["muac", "kuposhan", "edema", "pitting", "nrc", "sam", "mam", "upari aahar"]):
                if sec_prefix == "nut":
                    score += 6.0
                if "pitting" in q_lower or "gadha" in q_lower:
                    if sec_id in ["NUT-1.3", "NUT-1.4"]:
                        score += 8.0
                elif "nrc" in q_lower:
                    if sec_id == "NUT-1.4":
                        score += 8.0

            if any(w in q_lower for w in ["bp", "blood pressure", "hypertension", "diabetes", "rbs", "sugar"]):
                if sec_prefix == "ncd":
                    score += 6.0

            if any(w in q_lower for w in ["dast", "diarrhoea", "ors", "zinc", "pneumonia", "fast breathing", "paracetamol"]):
                if sec_prefix == "chd":
                    score += 6.0

            scores.append((sec, score))

        # Sort descending
        scores.sort(key=lambda x: x[1], reverse=True)
        return scores[:top_k]

# Global knowledge base instance
_KB_INSTANCE = None

def get_knowledge_base() -> ProtocolKnowledgeBase:
    global _KB_INSTANCE
    if _KB_INSTANCE is None:
        _KB_INSTANCE = ProtocolKnowledgeBase()
    return _KB_INSTANCE
