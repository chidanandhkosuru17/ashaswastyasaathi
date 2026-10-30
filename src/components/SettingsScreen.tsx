import React, { useState } from 'react';
import { 
  Settings, 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  Database, 
  Globe, 
  CheckCircle2, 
  HardDrive,
  Trash2,
  Info,
  ShieldCheck
} from 'lucide-react';
import { flushSyncQueueLocal, getSyncQueueLocal, getCompletedVisitsLocal } from '../services/localDatabase';

interface SettingsScreenProps {
  isOffline: boolean;
  setIsOffline: (offline: boolean) => void;
  pendingSyncCount: number;
  onSync: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  isOffline,
  setIsOffline,
  pendingSyncCount,
  onSync
}) => {
  const [language, setLanguage] = useState('hinglish');
  const [syncHistory, setSyncHistory] = useState<any[]>(getSyncQueueLocal());
  const completedVisits = getCompletedVisitsLocal();

  const handleManualSync = () => {
    onSync();
    setSyncHistory(getSyncQueueLocal());
  };

  const handleClearLocalCompletions = () => {
    if (confirm("Reset all locally completed visits and pending sync queue?")) {
      localStorage.removeItem('swasthya_completed_visits');
      localStorage.removeItem('swasthya_sync_queue');
      window.location.reload();
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center space-x-2">
          <Settings className="w-6 h-6 text-teal-600" />
          <span>Application Settings & Offline Sync</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Manage local persistence, offline network simulation, and synchronization queue.
        </p>
      </div>

      {/* Network & Offline Operation Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <h2 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <span>Offline Operating Mode</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                isOffline ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
              }`}>
                {isOffline ? 'Simulating Zero Network' : 'Network Active'}
              </span>
            </h2>
            <p className="text-xs text-slate-500">
              When enabled, all network requests are blocked. Knowledge retrieval, danger sign detection, and visit planning run 100% on local CPU.
            </p>
          </div>

          <button
            onClick={() => setIsOffline(!isOffline)}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 transition-colors cursor-pointer ${
              isOffline
                ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
            }`}
          >
            {isOffline ? <WifiOff className="w-4 h-4" /> : <Wifi className="w-4 h-4" />}
            <span>{isOffline ? 'Disable Offline Mode' : 'Simulate Offline Mode'}</span>
          </button>
        </div>

        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1">
          <div className="font-semibold text-slate-800 flex items-center space-x-1.5">
            <ShieldCheck className="w-4 h-4 text-teal-600" />
            <span>Autonomous Offline Guarantees</span>
          </div>
          <p>
            No external APIs, cloud servers, or third-party diagnostic services are queried. The BM25 index and deterministic emergency rules operate inside the browser runtime and local SQLite storage.
          </p>
        </div>
      </div>

      {/* Local Sync Queue Management */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <h2 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <RefreshCw className="w-4 h-4 text-teal-600" />
              <span>Offline Synchronization Queue</span>
              {pendingSyncCount > 0 && (
                <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-bold">
                  {pendingSyncCount} Pending
                </span>
              )}
            </h2>
            <p className="text-xs text-slate-500">
              Field visits logged by ASHA workers while offline are held in a secure local queue until connection is restored.
            </p>
          </div>

          <button
            onClick={handleManualSync}
            disabled={pendingSyncCount === 0}
            className="flex items-center space-x-1.5 bg-teal-600 hover:bg-teal-500 disabled:opacity-40 disabled:cursor-not-allowed text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Sync Queue Now</span>
          </button>
        </div>

        {/* Completed Visits Count */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-slate-500">Total Visits Marked Completed:</span>
            <div className="text-lg font-bold text-slate-900 mt-0.5">{completedVisits.length} records</div>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-slate-500">Pending Sync Items:</span>
            <div className="text-lg font-bold text-blue-900 mt-0.5">{pendingSyncCount} records</div>
          </div>
        </div>

        {/* Sync Queue List */}
        {syncHistory.length > 0 ? (
          <div className="divide-y divide-slate-100 text-xs">
            <div className="font-semibold text-slate-700 py-1 text-[11px] uppercase tracking-wider">
              Pending Queue Entries:
            </div>
            {syncHistory.slice(0, 5).map((q, idx) => (
              <div key={idx} className="py-2 flex items-center justify-between">
                <div>
                  <span className="font-mono font-bold text-slate-800">{q.payload?.member_id}</span>
                  <span className="text-slate-500"> · Due Item: {q.payload?.due_item}</span>
                </div>
                <span className="text-[10px] text-amber-700 font-semibold px-2 py-0.5 rounded bg-amber-50 border border-amber-200">
                  {q.payload?.synced ? 'Synced' : 'Waiting for Sync'}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-400 italic">
            Sync queue is empty. All locally recorded field visits are in sync.
          </p>
        )}
      </div>

      {/* Language Preference */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
        <h2 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
          <Globe className="w-4 h-4 text-teal-600" />
          <span>Language & Regional Dialect Interface</span>
        </h2>
        <p className="text-xs text-slate-500">
          The natural language retrieval engine automatically interprets code-mixed Hinglish terms across all modes.
        </p>

        <div className="grid grid-cols-3 gap-3 text-xs">
          {[
            { id: 'hinglish', label: 'Hinglish (Code-Mixed)', desc: 'Hindi + English terms (e.g. teeka, bukhar, dast)' },
            { id: 'english', label: 'Standard English', desc: 'Medical terms and formal guidelines' },
            { id: 'hindi', label: 'Hindi (Devanagari)', desc: 'Regional protocol translation support' },
          ].map((lang) => (
            <button
              key={lang.id}
              onClick={() => setLanguage(lang.id)}
              className={`p-3 rounded-xl border text-left transition-colors cursor-pointer ${
                language === lang.id
                  ? 'border-teal-500 bg-teal-50/50 text-teal-950 font-semibold'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              <div className="font-bold text-xs">{lang.label}</div>
              <div className="text-[11px] text-slate-500 mt-1">{lang.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Database Reset & Storage Utilities */}
      <div className="bg-white rounded-2xl border border-red-200 p-5 shadow-xs space-y-3">
        <div className="flex items-center space-x-2 text-red-700">
          <Trash2 className="w-4 h-4" />
          <h2 className="text-sm font-bold">Local Database Reset</h2>
        </div>
        <p className="text-xs text-slate-500">
          Clear all locally logged completions, visit statuses, and sync records to restore fresh demonstration state.
        </p>

        <button
          onClick={handleClearLocalCompletions}
          className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-300 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
        >
          Reset Demonstration Data
        </button>
      </div>
    </div>
  );
};
