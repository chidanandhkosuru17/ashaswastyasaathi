import React, { useState } from 'react';
import { 
  ShieldAlert, 
  PhoneCall, 
  AlertTriangle, 
  Heart, 
  Baby, 
  Activity, 
  Ambulance, 
  CheckSquare, 
  Search,
  ExternalLink,
  Info
} from 'lucide-react';
import { checkEmergencyDangerSigns } from '../services/safetyEngine';

interface EmergencyAlertsProps {
  onOpenSection: (sectionId: string) => void;
}

export const EmergencyAlerts: React.FC<EmergencyAlertsProps> = ({ onOpenSection }) => {
  const [triageInput, setTriageInput] = useState('');
  const [triageResult, setTriageResult] = useState<any>(null);

  const handleSimulate = (symptom: string) => {
    setTriageInput(symptom);
    const res = checkEmergencyDangerSigns(symptom);
    setTriageResult(res);
  };

  const dangerCategories = [
    {
      id: "ESC-1.1",
      title: "Maternal Danger Signs During Pregnancy",
      icon: Heart,
      color: "border-red-300 bg-red-50/50",
      signs: [
        "Vaginal bleeding (spotting, fresh bleeding, clots)",
        "Severe headache with blurred vision, seeing spots, or epigastric pain",
        "Convulsions, fits, or loss of consciousness (eclampsia)",
        "Blood pressure >= 160/110 mmHg or >= 140/90 with symptoms",
        "High fever (>101°F / 38.3°C) with chills or rigors",
        "Severe continuous abdominal pain or rigid abdomen",
        "Reduced or absent fetal movements after 24 weeks / 5th month"
      ]
    },
    {
      id: "ESC-1.2",
      title: "Maternal Danger Signs During Labour & Delivery",
      icon: Activity,
      color: "border-rose-300 bg-rose-50/50",
      signs: [
        "Prolonged labour: Labour pain lasting >12 hours without delivery",
        "Rupture of membranes (water breaks) >18 hours before delivery",
        "Umbilical cord prolapse: Cord visible outside vagina",
        "Abnormal presentation: Hand, foot, or breech presenting first",
        "Retained placenta: Placenta not delivered within 30 minutes",
        "Severe vaginal bleeding during or following delivery",
        "Maternal collapse or fits during delivery"
      ]
    },
    {
      id: "ESC-1.3",
      title: "Maternal Postpartum Danger Signs (After Delivery)",
      icon: ShieldAlert,
      color: "border-orange-300 bg-orange-50/50",
      signs: [
        "Severe Postpartum Haemorrhage (PPH): Soaking >2 large pads in 1 hour",
        "High fever with chills and foul-smelling lochia / vaginal discharge",
        "Severe, unbearable lower abdominal pain",
        "Fits, convulsions, or loss of consciousness",
        "Swollen red painful calf, sudden chest pain or breathlessness",
        "Postpartum psychosis (delusions, extreme agitation, harming baby)"
      ]
    },
    {
      id: "ESC-2.1",
      title: "Newborn & Young Infant Danger Signs (< 2 Months)",
      icon: Baby,
      color: "border-red-400 bg-red-100/40",
      signs: [
        "Inability to suck breast milk or stopped feeding completely",
        "Convulsions, fits, or abnormal twitching",
        "Fast breathing: >= 60 breaths per minute",
        "Severe chest indrawing (lower chest wall sinks deep inside)",
        "High fever (>= 37.5°C) or Hypothermia (body feels cold, < 35.5°C)",
        "Lethargy, floppiness, abnormally difficult to wake",
        "Yellow palms and soles, or deep jaundice appearing in first 24 hours",
        "Umbilical redness spreading to skin or draining foul pus"
      ]
    },
    {
      id: "ESC-2.2",
      title: "Child Danger Signs (2 Months to 5 Years)",
      icon: AlertTriangle,
      color: "border-amber-300 bg-amber-50/50",
      signs: [
        "Inability to drink, breastfeed, or take any oral fluids",
        "Vomits everything (cannot keep anything down)",
        "Convulsions or seizures during the present illness",
        "Lethargic, abnormally sleepy, or unconscious",
        "Stridor in a calm child (harsh rasping sound on breathing in)",
        "Severe acute malnutrition with bilateral pitting edema on both feet",
        "Stiff neck with high fever (suspected meningitis)"
      ]
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center space-x-2">
            <ShieldAlert className="w-6 h-6 text-red-600" />
            <span>Emergency Referral Guide & Danger Signs</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Authoritative immediate referral criteria under Protocol 03 (ESC). Precedes all model reasoning.
          </p>
        </div>

        {/* Hotlines Banner */}
        <div className="flex items-center space-x-2 bg-red-950 text-white px-4 py-2 rounded-xl text-xs font-semibold shrink-0 border border-red-800">
          <PhoneCall className="w-4 h-4 text-red-400 animate-bounce" />
          <span>Ambulance: 108</span>
          <span className="text-red-400">·</span>
          <span>Janani: 102</span>
        </div>
      </div>

      {/* Emergency Triage Simulator */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <h2 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <span>Interactive Emergency Triage Simulator</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-100 text-red-800 border border-red-200">
                Deterministic Evaluator
              </span>
            </h2>
            <p className="text-xs text-slate-500">
              Test how the safety engine parses symptoms in natural language and executes immediate referral.
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={triageInput}
              onChange={(e) => {
                setTriageInput(e.target.value);
                setTriageResult(checkEmergencyDangerSigns(e.target.value));
              }}
              placeholder="Type any symptom (e.g. 'bleeding heavily in pregnancy', 'infant breathing 68 times', 'stiff neck with convulsions')..."
              className="w-full pl-3 pr-4 py-2.5 text-xs text-slate-900 border border-slate-300 rounded-xl focus:outline-none focus:border-red-500"
            />
          </div>
          <button
            onClick={() => handleSimulate(triageInput)}
            className="bg-red-600 hover:bg-red-500 text-white px-4 py-2.5 rounded-xl text-xs font-semibold shrink-0 cursor-pointer"
          >
            Run Triage
          </button>
        </div>

        {/* Quick Simulator Test Chips */}
        <div className="flex flex-wrap gap-1.5 text-xs">
          <span className="text-[11px] text-slate-400 self-center">Try:</span>
          {[
            "Vaginal bleeding with pain",
            "Bacche ko daure pad rahe hain",
            "Labour pain 14 hours without delivery",
            "Soaking 3 pads in 1 hour after birth",
            "Baby unable to suck doodh and cold body",
            "Stiff neck and seizure in 3yo child"
          ].map((sample, i) => (
            <button
              key={i}
              onClick={() => handleSimulate(sample)}
              className="text-[11px] px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
            >
              {sample}
            </button>
          ))}
        </div>

        {/* Triage Output */}
        {triageResult ? (
          <div className="p-4 rounded-xl bg-red-50 border border-red-300 space-y-2 animate-in fade-in">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase text-red-700 flex items-center space-x-1.5">
                <ShieldAlert className="w-4 h-4 text-red-600" />
                <span>URGENT ESCALATION TRIGGERED</span>
              </span>
              <button
                onClick={() => onOpenSection(triageResult.citation_id)}
                className="text-xs font-bold text-red-800 underline flex items-center space-x-1 cursor-pointer"
              >
                <span>Section {triageResult.citation_id}</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>
            <div className="text-xs font-bold text-red-950">{triageResult.danger_category}</div>
            <p className="text-xs text-slate-900 font-medium leading-relaxed bg-white p-3 rounded-lg border border-red-200">
              {triageResult.referral_action}
            </p>
          </div>
        ) : triageInput.trim() ? (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center space-x-2">
            <Info className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>No immediate ESC danger signs matched. Safe for routine protocol inquiry.</span>
          </div>
        ) : null}
      </div>

      {/* Danger Sign Protocol Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {dangerCategories.map((cat) => {
          const Icon = cat.icon;
          return (
            <div
              key={cat.id}
              className={`rounded-2xl border p-5 space-y-3 shadow-xs hover:shadow-sm transition-all ${cat.color}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-lg bg-white shadow-2xs flex items-center justify-center text-red-600">
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold text-slate-900">{cat.id}</span>
                </div>
                <button
                  onClick={() => onOpenSection(cat.id)}
                  className="text-xs text-red-700 font-bold hover:underline cursor-pointer"
                >
                  View Details →
                </button>
              </div>

              <h2 className="text-sm font-bold text-slate-900 leading-snug">{cat.title}</h2>

              <ul className="space-y-1.5 text-xs text-slate-700">
                {cat.signs.map((sign, idx) => (
                  <li key={idx} className="flex items-start space-x-2">
                    <span className="text-red-500 font-bold">•</span>
                    <span>{sign}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}

        {/* Action & Transport Protocol Card */}
        <div className="rounded-2xl border border-blue-300 bg-blue-50/60 p-5 space-y-3 shadow-xs md:col-span-2 lg:col-span-1">
          <div className="flex items-center space-x-2 text-blue-900">
            <Ambulance className="w-5 h-5 text-blue-700" />
            <h2 className="text-sm font-bold">ESC-2.3 Transport & Stabilization</h2>
          </div>
          <div className="space-y-2 text-xs text-slate-800">
            <div className="p-2.5 bg-white rounded-lg border border-blue-100">
              <span className="font-bold text-blue-900">1. Emergency Transport:</span> Call 108 immediately. Keep vehicle standby.
            </div>
            <div className="p-2.5 bg-white rounded-lg border border-blue-100">
              <span className="font-bold text-blue-900">2. Positioning:</span> Turn on left side if unconscious or vomiting to prevent aspiration.
            </div>
            <div className="p-2.5 bg-white rounded-lg border border-blue-100">
              <span className="font-bold text-blue-900">3. Warmth:</span> Keep newborn in skin-to-skin wrap / warm cloths to prevent hypothermia.
            </div>
            <div className="p-2.5 bg-white rounded-lg border border-blue-100">
              <span className="font-bold text-blue-900">4. Documents:</span> Carry MCP card and referral slip to Chandrapuri District Hospital.
            </div>
          </div>
          <button
            onClick={() => onOpenSection('ESC-2.3')}
            className="w-full bg-blue-700 hover:bg-blue-600 text-white py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            Inspect Transport Checklist →
          </button>
        </div>
      </div>
    </div>
  );
};
