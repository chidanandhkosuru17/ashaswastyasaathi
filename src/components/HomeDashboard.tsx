import React from 'react';
import { 
  Users, 
  Home, 
  CalendarCheck2, 
  AlertTriangle, 
  HeartHandshake, 
  ArrowRight, 
  BookOpen, 
  Sparkles,
  PhoneCall,
  MapPin,
  CheckCircle2,
  HardDrive
} from 'lucide-react';
import { AshaWorker, DueVisitItem } from '../types';

interface HomeDashboardProps {
  householdsCount: number;
  membersCount: number;
  ashas: AshaWorker[];
  dueVisits: DueVisitItem[];
  isOffline: boolean;
  onNavigate: (tab: string) => void;
  onSelectAsha: (asha: AshaWorker) => void;
}

export const HomeDashboard: React.FC<HomeDashboardProps> = ({
  householdsCount,
  membersCount,
  ashas,
  dueVisits,
  isOffline,
  onNavigate,
  onSelectAsha
}) => {
  const pendingVisits = dueVisits.filter(v => !v.completed);
  const priority1Visits = pendingVisits.filter(v => v.priority === 1);
  const priority2Visits = pendingVisits.filter(v => v.priority === 2);
  const completedVisitsCount = dueVisits.filter(v => v.completed).length;

  return (
    <div className="space-y-6">
      {/* Disclaimer Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-3.5 text-xs text-blue-900 flex items-start space-x-2">
        <HeartHandshake className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
        <p>
          <span className="font-semibold">Healthcare Decision Support System:</span> Built for trained frontline healthcare workers (ASHA/ANM) in Chandrapuri Block. Does not replace professional clinical judgment or emergency hospital services.
        </p>
      </div>

      {/* Hero Welcome & Operational Status */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-teal-950 rounded-2xl p-6 text-white shadow-sm border border-slate-700">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-teal-400 text-xs font-semibold uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse"></span>
              <span>Chandrapuri Block · Operational Dashboard</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              SwasthyaSaathi Healthcare Companion
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              Empowering frontline ASHAs with deterministic danger-sign pre-checks, grounded protocol retrieval, and daily prioritized household visit planning — fully operational without an internet connection.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-2 text-xs text-slate-300">
              <span className="flex items-center space-x-1.5 bg-slate-800/80 px-2.5 py-1 rounded-md border border-slate-700">
                <MapPin className="w-3.5 h-3.5 text-teal-400" />
                <span>6 Villages</span>
              </span>
              <span className="flex items-center space-x-1.5 bg-slate-800/80 px-2.5 py-1 rounded-md border border-slate-700">
                <HardDrive className="w-3.5 h-3.5 text-teal-400" />
                <span>SQLite + IndexedDB Local Store</span>
              </span>
              <span className="flex items-center space-x-1.5 bg-slate-800/80 px-2.5 py-1 rounded-md border border-slate-700">
                <span className={`w-2 h-2 rounded-full ${isOffline ? 'bg-amber-400' : 'bg-emerald-400'}`}></span>
                <span>{isOffline ? 'Running 100% Offline (Local CPU)' : 'Connected'}</span>
              </span>
              <span className="flex items-center space-x-1.5 bg-slate-800/80 px-2.5 py-1 rounded-md border border-slate-700">
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" />
                <span>Planning Date: 26 Oct 2026</span>
              </span>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-col sm:flex-row lg:flex-col gap-2 shrink-0">
            <button
              onClick={() => onNavigate('ask')}
              className="flex items-center justify-center space-x-2 bg-teal-600 hover:bg-teal-500 text-white px-4 py-2.5 rounded-xl font-medium text-xs shadow-sm transition-colors cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Ask a Protocol Question</span>
            </button>
            <button
              onClick={() => onNavigate('visits')}
              className="flex items-center justify-center space-x-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 px-4 py-2.5 rounded-xl font-medium text-xs transition-colors cursor-pointer"
            >
              <CalendarCheck2 className="w-4 h-4 text-teal-400" />
              <span>Open Daily Visit Planner</span>
            </button>
            <button
              onClick={() => onNavigate('emergency')}
              className="flex items-center justify-center space-x-2 bg-red-950/80 hover:bg-red-900 border border-red-700/60 text-red-200 px-4 py-2.5 rounded-xl font-medium text-xs transition-colors cursor-pointer"
            >
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <span>Emergency Referral Guide</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main KPI Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* Households */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-xs font-medium">Households</span>
            <Home className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{householdsCount}</div>
          <p className="text-[11px] text-slate-500 mt-0.5">500 in Chandrapuri</p>
        </div>

        {/* Registered Members */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-xs font-medium">Members</span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{membersCount}</div>
          <p className="text-[11px] text-slate-500 mt-0.5">Tracked individuals</p>
        </div>

        {/* ASHA Workers */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-xs font-medium">ASHA Workers</span>
            <HeartHandshake className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{ashas.length}</div>
          <p className="text-[11px] text-slate-500 mt-0.5">Across 6 villages</p>
        </div>

        {/* Pending Visits */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-xs font-medium">Pending Visits</span>
            <CalendarCheck2 className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-blue-900">{pendingVisits.length}</div>
          <p className="text-[11px] text-blue-600 mt-0.5">{completedVisitsCount} logged completed</p>
        </div>

        {/* High-Priority P1 */}
        <div className="bg-red-50/70 p-4 rounded-xl border border-red-200 shadow-xs hover:border-red-300 transition-colors">
          <div className="flex items-center justify-between text-red-700 mb-1.5">
            <span className="text-xs font-semibold">Priority 1 (Urgent)</span>
            <AlertTriangle className="w-4 h-4 text-red-600" />
          </div>
          <div className="text-2xl font-bold text-red-700">{priority1Visits.length}</div>
          <p className="text-[11px] text-red-600 mt-0.5">HRP, SAM, &gt;30d overdue</p>
        </div>

        {/* Routine P2 */}
        <div className="bg-amber-50/70 p-4 rounded-xl border border-amber-200 shadow-xs hover:border-amber-300 transition-colors">
          <div className="flex items-center justify-between text-amber-800 mb-1.5">
            <span className="text-xs font-medium">Priority 2 (Routine)</span>
            <CalendarCheck2 className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-amber-900">{priority2Visits.length}</div>
          <p className="text-[11px] text-amber-700 mt-0.5">Routine ANC, UIP, NCD</p>
        </div>
      </div>

      {/* Two Column Layout: Urgent Action Panel & ASHA Village Assignment */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: High-Priority Visit Queue Preview */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Urgent High-Priority Visits Today (Priority 1)</h2>
              <p className="text-xs text-slate-500">Require immediate frontline follow-up as per VIS Protocol</p>
            </div>
            <button
              onClick={() => onNavigate('visits')}
              className="text-xs text-teal-700 font-semibold flex items-center space-x-1 hover:underline cursor-pointer"
            >
              <span>View All {dueVisits.length}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {priority1Visits.slice(0, 5).map((v, idx) => (
              <div key={`${v.member_id}_${v.due_item}_${idx}`} className="py-3 flex items-start justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-slate-900">{v.name}</span>
                    <span className="text-[11px] text-slate-500">· {v.member_id}</span>
                    <span className="text-[11px] text-slate-500">· {v.village}</span>
                  </div>
                  <p className="text-xs text-red-700 font-medium">{v.reason}</p>
                  <p className="text-[11px] text-slate-400">ASHA: {v.asha_id} · Household: {v.household_id}</p>
                </div>
                <div className="shrink-0 text-right">
                  <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800 border border-red-200">
                    {v.due_item}
                  </span>
                  <div className="text-[10px] text-slate-500 mt-1">Priority 1</div>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Showing top 5 of {priority1Visits.length} urgent cases</span>
            <button 
              onClick={() => onNavigate('visits')}
              className="text-teal-700 font-medium hover:underline cursor-pointer"
            >
              Go to Daily Planner →
            </button>
          </div>
        </div>

        {/* Right Col: Chandrapuri Block Overview & Hotlines */}
        <div className="space-y-4">
          {/* Emergency Escalation Facility Card */}
          <div className="bg-gradient-to-br from-red-950 to-slate-900 text-white rounded-xl p-5 border border-red-800/60 space-y-3">
            <div className="flex items-center space-x-2 text-red-300">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              <span className="text-xs font-bold uppercase tracking-wider">Referral Hospital</span>
            </div>
            <div>
              <div className="text-base font-bold">Chandrapuri District Hospital</div>
              <p className="text-xs text-slate-300 mt-0.5">Designated 24x7 First Referral Unit (FRU) & SNCU</p>
            </div>
            <div className="pt-2 border-t border-red-900/60 space-y-1.5 text-xs">
              <div className="flex items-center justify-between text-slate-200">
                <span className="flex items-center space-x-1.5">
                  <PhoneCall className="w-3.5 h-3.5 text-red-400" />
                  <span>Ambulance Emergency</span>
                </span>
                <span className="font-bold text-white text-sm">108</span>
              </div>
              <div className="flex items-center justify-between text-slate-200">
                <span className="flex items-center space-x-1.5">
                  <PhoneCall className="w-3.5 h-3.5 text-red-400" />
                  <span>Janani Express (Maternal)</span>
                </span>
                <span className="font-bold text-white text-sm">102</span>
              </div>
            </div>
            <button
              onClick={() => onNavigate('emergency')}
              className="w-full mt-2 bg-red-600 hover:bg-red-500 text-white py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            >
              View Immediate Referral Rules (ESC)
            </button>
          </div>

          {/* ASHA Coverage List */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-900">ASHA Workers ({ashas.length})</span>
              <span className="text-slate-500">Tap to filter</span>
            </div>
            <div className="space-y-2">
              {ashas.map(a => (
                <div
                  key={a.asha_id}
                  onClick={() => {
                    onSelectAsha(a);
                    onNavigate('visits');
                  }}
                  className="flex items-center justify-between p-2 rounded-lg bg-slate-50 hover:bg-teal-50 border border-slate-100 hover:border-teal-200 transition-colors cursor-pointer text-xs"
                >
                  <div>
                    <div className="font-semibold text-slate-900">{a.name}</div>
                    <div className="text-[11px] text-slate-500">{a.village} · {a.asha_id}</div>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] font-bold text-teal-800">{a.assigned_households} HHs</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
