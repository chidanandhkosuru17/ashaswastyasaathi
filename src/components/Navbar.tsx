import React from 'react';
import { 
  ShieldAlert, 
  HelpCircle, 
  CalendarCheck2, 
  BookOpen, 
  Users, 
  Cpu, 
  Settings, 
  Wifi, 
  WifiOff, 
  RefreshCw,
  HeartPulse,
  LayoutDashboard
} from 'lucide-react';
import { AshaWorker } from '../types';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOffline: boolean;
  setIsOffline: (offline: boolean) => void;
  pendingSyncCount: number;
  onSync: () => void;
  selectedAsha: AshaWorker | null;
  ashas: AshaWorker[];
  onSelectAsha: (asha: AshaWorker) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  isOffline,
  setIsOffline,
  pendingSyncCount,
  onSync,
  selectedAsha,
  ashas,
  onSelectAsha
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Home Dashboard', icon: LayoutDashboard },
    { id: 'ask', label: 'Ask a Question', icon: HelpCircle },
    { id: 'emergency', label: 'Emergency Alerts', icon: ShieldAlert, badge: 'ESC' },
    { id: 'visits', label: 'Daily Visit Planner', icon: CalendarCheck2 },
    { id: 'protocols', label: 'Protocol Library', icon: BookOpen },
    { id: 'register', label: 'Household Register', icon: Users },
    { id: 'diagnostics', label: 'Diagnostics & Eval', icon: Cpu },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40">
      {/* Top Banner / Utility Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-400">
              <HeartPulse className="w-6 h-6" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-white">SwasthyaSaathi</span>
            </div>
          </div>

          {/* Right Controls: ASHA Selector, Offline Status & Sync */}
          <div className="flex items-center space-x-3">
            {/* ASHA Profile Selector */}
            <div className="hidden md:flex items-center space-x-2 bg-slate-800/80 rounded-lg px-3 py-1.5 border border-slate-700 text-xs">
              <span className="text-slate-400">ASHA:</span>
              <select 
                aria-label="Active ASHA Worker"
                value={selectedAsha?.asha_id || ''} 
                onChange={(e) => {
                  const found = ashas.find(a => a.asha_id === e.target.value);
                  if (found) onSelectAsha(found);
                }}
                className="bg-transparent text-slate-200 font-medium focus:outline-none cursor-pointer"
              >
                {ashas.map(a => (
                  <option key={a.asha_id} value={a.asha_id} className="bg-slate-900 text-white">
                    {a.name} ({a.village})
                  </option>
                ))}
              </select>
            </div>

            {/* Offline Toggle */}
            <button
              onClick={() => setIsOffline(!isOffline)}
              title={isOffline ? "App running locally with zero external network requests" : "Online Mode active"}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                isOffline 
                  ? 'bg-amber-950/70 border-amber-600/50 text-amber-300 hover:bg-amber-900/70' 
                  : 'bg-emerald-950/70 border-emerald-600/50 text-emerald-300 hover:bg-emerald-900/70'
              }`}
            >
              {isOffline ? <WifiOff className="w-3.5 h-3.5" /> : <Wifi className="w-3.5 h-3.5" />}
              <span>{isOffline ? 'Offline Mode' : 'Online'}</span>
            </button>

            {/* Sync Status / Button */}
            {pendingSyncCount > 0 && (
              <button
                onClick={onSync}
                className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-blue-900/70 border border-blue-600/60 text-blue-200 hover:bg-blue-800 transition-colors"
                title={`${pendingSyncCount} completed visit records stored locally awaiting sync`}
              >
                <RefreshCw className="w-3 h-3 animate-spin text-blue-300" />
                <span>{pendingSyncCount} Sync Pending</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <nav className="bg-slate-950 border-t border-slate-800/80 overflow-x-auto no-scrollbar">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex space-x-1 py-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center space-x-2 px-3.5 py-2 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-teal-500/15 text-teal-300 border-b-2 border-teal-400 font-semibold'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-teal-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
                {item.badge && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-red-900/80 border border-red-600/60 text-red-200">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </header>
  );
};
