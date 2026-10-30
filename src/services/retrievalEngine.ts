/**
 * Client-Side Protocol Retrieval Engine (BM25 + Domain Boosts)
 */
import { ProtocolDoc, ProtocolSection } from '../types';

export interface IndexedSection extends ProtocolSection {
  protocolId: string;
  sourceFile: string;
  tokens: string[];
  tokenLen: number;
}

const SYNONYM_EXPANSIONS: Record<string, string> = {
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
};

export class ClientRetrievalEngine {
  private sections: IndexedSection[] = [];
  private docFreqs: Map<string, number> = new Map();
  private avgDocLen: number = 0;
  private totalDocs: number = 0;
  private isLoaded: boolean = false;

  private tokenize(text: string): string[] {
    const cleaned = text.toLowerCase().replace(/[^a-zA-Z0-9\s-]/g, ' ');
    const rawTokens = cleaned.split(/\s+/).filter(Boolean);
    const tokens: string[] = [];

    for (const t of rawTokens) {
      tokens.push(t);
      if (SYNONYM_EXPANSIONS[t]) {
        tokens.push(...SYNONYM_EXPANSIONS[t].split(' '));
      }
    }
    return tokens;
  }

  public indexProtocols(protocols: ProtocolDoc[]) {
    const indexed: IndexedSection[] = [];

    for (const p of protocols) {
      for (const s of p.sections) {
        const tokens = this.tokenize(`${s.title} ${s.content}`);
        indexed.push({
          ...s,
          protocolId: p.id,
          sourceFile: p.filename,
          tokens,
          tokenLen: tokens.length
        });
      }
    }

    this.sections = indexed;
    this.totalDocs = indexed.length;

    if (this.totalDocs > 0) {
      const totalLen = indexed.reduce((acc, s) => acc + s.tokenLen, 0);
      this.avgDocLen = totalLen / this.totalDocs;

      const dfMap = new Map<string, number>();
      for (const s of indexed) {
        const uniqueTokens = new Set(s.tokens);
        for (const tok of uniqueTokens) {
          dfMap.set(tok, (dfMap.get(tok) || 0) + 1);
        }
      }
      this.docFreqs = dfMap;
    }

    this.isLoaded = true;
  }

  public searchBM25(query: string, topK: number = 2): Array<{ section: IndexedSection; score: number }> {
    if (!this.isLoaded || this.totalDocs === 0) return [];

    const queryTokens = this.tokenize(query);
    if (queryTokens.length === 0) {
      return [{ section: this.sections[0], score: 0 }];
    }

    const k1 = 1.5;
    const b = 0.75;
    const scored: Array<{ section: IndexedSection; score: number }> = [];
    const qLower = query.toLowerCase();

    for (const sec of this.sections) {
      let score = 0;
      const docLen = sec.tokenLen;
      const termCounts = new Map<string, number>();
      for (const t of sec.tokens) {
        termCounts.set(t, (termCounts.get(t) || 0) + 1);
      }

      for (const qTok of queryTokens) {
        if (termCounts.has(qTok)) {
          const tf = termCounts.get(qTok)!;
          const df = this.docFreqs.get(qTok) || 1;
          const idf = Math.log(1.0 + (this.totalDocs - df + 0.5) / (df + 0.5));
          const num = tf * (k1 + 1.0);
          const den = tf + k1 * (1.0 - b + b * (docLen / (this.avgDocLen || 1.0)));
          score += idf * (num / den);
        }
      }

      // Domain intent boosts
      const secId = sec.section_id;
      const secPrefix = secId.split('-')[0].toLowerCase();

      if (secPrefix && qLower.includes(secPrefix)) score += 4.0;
      if (qLower.includes(secId.toLowerCase())) score += 15.0;

      // Immunisation boost
      if (/tika|teeka|teeke|vaccin|birth dose|6 hafte|9 mahine|pentavalent|bcg|opv/i.test(qLower)) {
        if (secPrefix === 'imm') score += 6.0;
        if (/birth|janam ke samay/i.test(qLower) && secId === 'IMM-1.1') score += 8.0;
        if (/6 hafte|6 week/i.test(qLower) && secId === 'IMM-1.2') score += 8.0;
        if (/9 mahine|9 month/i.test(qLower) && secId === 'IMM-1.5') score += 8.0;
      }

      // HBNC boost
      if (/hbnc|ghar par delivery|home delivery|hospital mein janam|institutional delivery|kmc|kangaroo|nal|cord care|breastfeed|colostrum|sthanpan/i.test(qLower)) {
        if (secPrefix === 'hbnc') score += 7.0;
        if (/colostrum|exclusive breastfeeding/i.test(qLower) && secId === 'HBNC-1.4') score += 10.0;
        else if (/institutional|hospital/i.test(qLower) && secId === 'HBNC-1.1') score += 9.0;
        else if (/ghar par|home delivery/i.test(qLower) && secId === 'HBNC-1.2') score += 9.0;
        else if (/kmc|kangaroo/i.test(qLower) && secId === 'HBNC-1.3') score += 9.0;
        else if (/nal|cord/i.test(qLower) && secId === 'HBNC-1.5') score += 9.0;
      }

      // Malnutrition boost
      if (/muac|kuposhan|edema|pitting|nrc|sam|mam|upari aahar/i.test(qLower)) {
        if (secPrefix === 'nut') score += 6.0;
        if (/pitting|gadha/i.test(qLower) && (secId === 'NUT-1.3' || secId === 'NUT-1.4')) score += 8.0;
        else if (/nrc/i.test(qLower) && secId === 'NUT-1.4') score += 8.0;
      }

      // NCD boost
      if (/bp|blood pressure|hypertension|diabetes|rbs|sugar/i.test(qLower)) {
        if (secPrefix === 'ncd') score += 6.0;
      }

      // Diarrhoea / ARI boost
      if (/dast|diarrhoea|ors|zinc|pneumonia|fast breathing|paracetamol/i.test(qLower)) {
        if (secPrefix === 'chd') score += 6.0;
      }

      scored.push({ section: sec, score });
    }

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, topK);
  }

  public getSection(sectionId: string): IndexedSection | undefined {
    return this.sections.find(s => s.section_id.toUpperCase() === sectionId.toUpperCase());
  }

  public getAllSections(): IndexedSection[] {
    return this.sections;
  }
}

export const clientRetrieval = new ClientRetrievalEngine();
