import React, { useState, useEffect } from 'react';
import { 
  Send, 
  Mic, 
  MicOff, 
  AlertTriangle, 
  BookOpen, 
  Clock, 
  CheckCircle2, 
  Volume2, 
  VolumeX, 
  ShieldAlert, 
  Sparkles,
  PhoneCall,
  Info,
  CornerDownRight
} from 'lucide-react';
import { QuestionAnswer } from '../types';
import { answerQuestionOffline } from '../services/answerEngine';

interface AskQuestionProps {
  onOpenSection: (sectionId: string) => void;
  onNavigate: (tab: string) => void;
}

const SAMPLE_QUERIES = [
  { label: "Vaginal bleeding in pregnancy", text: "A pregnant woman in 7th month has severe bleeding per vagina and abdominal pain. What should ASHA do?", type: "danger" },
  { label: "Newborn unable to feed & chest indrawing", text: "10-day-old newborn is unable to suck breast milk and chest is drawing deep inside when breathing.", type: "danger" },
  { label: "Child with stiff neck & convulsions", text: "A 3-year-old child has high fever, stiff neck, and had a convulsion this morning.", type: "danger" },
  { label: "Labour pain 14 ghante se chal raha hai", text: "Labour pain 14 ghante se chal raha hai aur baccha bahar nahi aa raha, delivery nahi hui.", type: "danger" },
  { label: "ANC Schedule & Check-ups", text: "How many total ANC check-ups are mandated during a normal pregnancy?", type: "grounded" },
  { label: "Birth Doses Immunisation (Janam teeke)", text: "Janam ke samay (birth doses) bacche ko kaun se teeke lagte hain UIP ke antargat?", type: "grounded" },
  { label: "MUAC Malnutrition Cutoffs", text: "MUAC tape mein red, yellow aur green zone ka kya cutoff hota hai?", type: "grounded" },
  { label: "ORS and Zinc for Diarrhoea", text: "What is the proper method to prepare ORS packet and zinc dosage for childhood diarrhoea?", type: "grounded" },
  { label: "Cancer Chemotherapy Dose (Out of scope)", text: "What is the exact pediatric dosage of intravenous Meropenem and Vancomycin for sepsis?", type: "refusal" },
  { label: "Emergency fit with chemo query (Precedence)", text: "What chemotherapy drug dose should I give to an unconscious patient having continuous seizures and high fever?", type: "danger" },
];

export const AskQuestion: React.FC<AskQuestionProps> = ({ onOpenSection, onNavigate }) => {
  const [query, setQuery] = useState('');
  const [currentResult, setCurrentResult] = useState<QuestionAnswer | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [recentHistory, setRecentHistory] = useState<QuestionAnswer[]>([]);

  // Speech Recognition initialization
  const toggleSpeechRecognition = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert("Voice input is not supported in this browser. Please type your query.");
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      // @ts-ignore
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.lang = 'hi-IN'; // Indian code-mixed / Hindi / English
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = () => setIsListening(false);

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setQuery(transcript);
        handleAsk(transcript);
      };

      recognition.start();
    } catch (e) {
      setIsListening(false);
    }
  };

  // Text to Speech
  const toggleTTS = (text: string) => {
    if (!('speechSynthesis' in window)) return;

    if (isPlayingAudio) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.pitch = 1.0;
    utterance.onend = () => setIsPlayingAudio(false);
    utterance.onerror = () => setIsPlayingAudio(false);

    setIsPlayingAudio(true);
    window.speechSynthesis.speak(utterance);
  };

  const handleAsk = (textToAsk?: string) => {
    const q = (textToAsk !== undefined ? textToAsk : query).trim();
    if (!q) return;

    const answer = answerQuestionOffline(q, `Q-${Date.now().toString().slice(-4)}`);
    setCurrentResult(answer);
    setRecentHistory(prev => [answer, ...prev.filter(h => h.question_text !== q).slice(0, 4)]);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center space-x-2">
          <span>Frontline Protocol Guidance</span>
          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-teal-100 text-teal-800 border border-teal-200">
            Offline Grounded
          </span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Ask questions in English or Hinglish. Automatically detects emergency danger signs before processing.
        </p>
      </div>

      {/* Input Box */}
      <div className="bg-white rounded-2xl border border-slate-300 shadow-sm p-3 sm:p-4 focus-within:border-teal-500 focus-within:ring-2 focus-within:ring-teal-100 transition-all">
        <div className="relative">
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleAsk();
              }
            }}
            placeholder="Type symptoms or ask in Hinglish (e.g., 'Bacche ko tika kab lagta hai?', 'Pregnancy mein bleeding ho rahi hai', 'MUAC tape measurement')..."
            rows={3}
            className="w-full text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none resize-none pr-12"
          />
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
          <div className="flex items-center space-x-2">
            <button
              onClick={toggleSpeechRecognition}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                isListening 
                  ? 'bg-red-50 border-red-300 text-red-600 animate-pulse' 
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
              <span>{isListening ? 'Listening...' : 'Voice Query'}</span>
            </button>
            <span className="text-[11px] text-slate-400 hidden sm:inline">
              Deterministic ESC pre-check active
            </span>
          </div>

          <button
            onClick={() => handleAsk()}
            disabled={!query.trim()}
            className="flex items-center space-x-1.5 bg-teal-600 hover:bg-teal-500 disabled:opacity-40 disabled:cursor-not-allowed text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <span>Ask Assistant</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Suggested Test Scenarios */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span className="font-semibold uppercase tracking-wider text-[11px] text-slate-600">Sample Test Scenarios:</span>
          <span>Click any chip to run instantly</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {SAMPLE_QUERIES.map((sq, i) => (
            <button
              key={i}
              onClick={() => {
                setQuery(sq.text);
                handleAsk(sq.text);
              }}
              className={`text-xs px-2.5 py-1.5 rounded-lg border transition-colors text-left cursor-pointer ${
                sq.type === 'danger'
                  ? 'bg-red-50/70 border-red-200 text-red-800 hover:bg-red-100'
                  : sq.type === 'refusal'
                  ? 'bg-amber-50/70 border-amber-200 text-amber-800 hover:bg-amber-100'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              {sq.type === 'danger' && <span className="font-bold text-red-600 mr-1.5">🚨 Danger:</span>}
              {sq.type === 'refusal' && <span className="font-bold text-amber-600 mr-1.5">⛔ Scope:</span>}
              <span>{sq.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Current Result Card */}
      {currentResult && (
        <div className="space-y-4 pt-2">
          {/* A. EMERGENCY DANGER ALERT CARD (When escalate: true) */}
          {currentResult.escalate && (
            <div className="bg-red-50 border-2 border-red-600 rounded-2xl p-5 shadow-md space-y-4 animate-in fade-in duration-200">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <ShieldAlert className="w-6 h-6 animate-pulse" />
                  </div>
                  <div className="space-y-0.5">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-extrabold uppercase tracking-wider text-red-700 bg-red-100 px-2 py-0.5 rounded border border-red-300">
                        URGENT: Refer Immediately
                      </span>
                      <span className="text-xs text-red-600 font-medium">Deterministic Safety Gate</span>
                    </div>
                    <h2 className="text-base sm:text-lg font-bold text-red-950">
                      {currentResult.danger_category || "Obstetric or Neonatal Danger Sign Detected"}
                    </h2>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[11px] text-slate-500 flex items-center justify-end space-x-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span>{currentResult.latency_ms} ms CPU</span>
                  </span>
                </div>
              </div>

              {/* Immediate Referral Instructions */}
              <div className="bg-white rounded-xl p-4 border border-red-200 space-y-2">
                <div className="text-xs font-semibold uppercase text-red-800 tracking-wider">
                  Immediate Protocol Guidance:
                </div>
                <p className="text-sm font-medium text-slate-900 leading-relaxed">
                  {currentResult.answer_text}
                </p>
              </div>

              {/* Referral Hospital & Transport Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="bg-red-100/70 p-3 rounded-lg border border-red-200">
                  <div className="font-semibold text-red-900">Designated Referral Facility:</div>
                  <div className="text-slate-900 font-bold mt-0.5">Chandrapuri District Hospital</div>
                  <div className="text-slate-600 text-[11px]">Special Newborn Care Unit (SNCU) & 24x7 FRU</div>
                </div>
                <div className="bg-red-100/70 p-3 rounded-lg border border-red-200 flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-red-900">Emergency Transport:</div>
                    <div className="text-slate-900 font-bold text-sm mt-0.5">Call 108 Ambulance / 102 Janani</div>
                  </div>
                  <PhoneCall className="w-6 h-6 text-red-700" />
                </div>
              </div>

              {/* Action Buttons: Open Protocol Section & Audio */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-red-200">
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-slate-600 font-medium">Citations:</span>
                  {currentResult.cited_section_ids.map(cid => (
                    <button
                      key={cid}
                      onClick={() => onOpenSection(cid)}
                      className="px-2.5 py-1 rounded bg-red-100 hover:bg-red-200 text-red-900 border border-red-300 text-xs font-bold transition-colors cursor-pointer"
                    >
                      {cid} →
                    </button>
                  ))}
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => toggleTTS(currentResult.answer_text)}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white hover:bg-red-50 border border-red-200 text-red-900 transition-colors cursor-pointer"
                  >
                    {isPlayingAudio ? <VolumeX className="w-3.5 h-3.5 text-red-600" /> : <Volume2 className="w-3.5 h-3.5 text-red-600" />}
                    <span>{isPlayingAudio ? 'Stop Voice' : 'Read Aloud'}</span>
                  </button>
                  <button
                    onClick={() => onNavigate('emergency')}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-600 hover:bg-red-500 text-white transition-colors cursor-pointer"
                  >
                    Emergency Checklist →
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* B. OUT-OF-SCOPE REFUSAL CARD (When refused: true, escalate: false) */}
          {!currentResult.escalate && currentResult.refused && (
            <div className="bg-amber-50 border border-amber-300 rounded-2xl p-5 shadow-xs space-y-3 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-amber-800">
                  <Info className="w-4 h-4 text-amber-700" />
                  <span className="text-xs font-bold uppercase tracking-wider">Outside Standard Protocol Scope</span>
                </div>
                <span className="text-[11px] text-slate-500 flex items-center space-x-1">
                  <Clock className="w-3 h-3 text-slate-400" />
                  <span>{currentResult.latency_ms} ms</span>
                </span>
              </div>

              <div className="text-sm text-slate-900 leading-relaxed font-medium bg-white p-4 rounded-xl border border-amber-200">
                {currentResult.answer_text}
              </div>

              <div className="flex items-center justify-between pt-1 text-xs">
                <div className="flex items-center space-x-1.5 text-slate-600">
                  <span>Scope Guard Citation:</span>
                  {currentResult.cited_section_ids.map(cid => (
                    <button
                      key={cid}
                      onClick={() => onOpenSection(cid)}
                      className="px-2 py-0.5 rounded bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 font-semibold cursor-pointer"
                    >
                      {cid}
                    </button>
                  ))}
                </div>
                <span className="text-slate-500 text-[11px]">
                  Preserves patient safety by refusing unapproved medical advice
                </span>
              </div>
            </div>
          )}

          {/* C. IN-SCOPE GROUNDED ANSWER CARD */}
          {!currentResult.escalate && !currentResult.refused && (
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-7 h-7 rounded-lg bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center font-bold text-xs">
                    <CheckCircle2 className="w-4 h-4 text-teal-600" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-teal-900">Protocol-Grounded Response</span>
                    <p className="text-[11px] text-slate-400">Grounded exclusively in approved frontline guidelines</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 text-xs text-slate-500">
                  <span className="flex items-center space-x-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span>{currentResult.latency_ms} ms CPU</span>
                  </span>
                  <button
                    onClick={() => toggleTTS(currentResult.answer_text)}
                    className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 cursor-pointer"
                    title="Read Aloud"
                  >
                    {isPlayingAudio ? <VolumeX className="w-4 h-4 text-teal-600" /> : <Volume2 className="w-4 h-4 text-slate-500" />}
                  </button>
                </div>
              </div>

              {/* Answer Content */}
              <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-100 text-sm text-slate-900 leading-relaxed font-normal">
                {currentResult.answer_text}
              </div>

              {/* Citations & Traceability */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-semibold text-slate-700">Supporting Protocol Sections:</span>
                  {currentResult.cited_section_ids.map(cid => (
                    <button
                      key={cid}
                      onClick={() => onOpenSection(cid)}
                      className="flex items-center space-x-1 px-2.5 py-1 rounded bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 text-xs font-bold transition-colors cursor-pointer"
                    >
                      <BookOpen className="w-3 h-3" />
                      <span>{cid}</span>
                    </button>
                  ))}
                </div>

                <span className="text-[11px] text-slate-400">
                  Click section badge to inspect source markdown
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Recent Query History */}
      {recentHistory.length > 1 && (
        <div className="space-y-3 pt-4 border-t border-slate-200">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Recent Session Inquiries
          </div>
          <div className="space-y-2">
            {recentHistory.slice(1).map((h, idx) => (
              <div
                key={idx}
                onClick={() => setCurrentResult(h)}
                className="p-3 rounded-xl bg-white border border-slate-200 hover:border-teal-300 transition-colors cursor-pointer flex items-center justify-between text-xs"
              >
                <div className="truncate max-w-lg space-y-0.5">
                  <div className="font-medium text-slate-800 truncate">{h.question_text}</div>
                  <div className="text-slate-500 flex items-center space-x-2 text-[11px]">
                    <span className={h.escalate ? 'text-red-600 font-bold' : h.refused ? 'text-amber-600' : 'text-teal-700 font-medium'}>
                      {h.escalate ? '🚨 Urgent Danger' : h.refused ? '⛔ Scope Refused' : '✓ Grounded'}
                    </span>
                    <span>·</span>
                    <span>Citations: {h.cited_section_ids.join(', ')}</span>
                  </div>
                </div>
                <CornerDownRight className="w-3.5 h-3.5 text-slate-400" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
