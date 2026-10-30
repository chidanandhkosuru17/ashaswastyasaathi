import React, { useState, useEffect, useMemo } from 'react';
import { Navbar } from './components/Navbar';
import { HomeDashboard } from './components/HomeDashboard';
import { AskQuestion } from './components/AskQuestion';
import { EmergencyAlerts } from './components/EmergencyAlerts';
import { DailyVisitPlanner } from './components/DailyVisitPlanner';
import { ProtocolLibrary } from './components/ProtocolLibrary';
import { HouseholdRegister } from './components/HouseholdRegister';
import { DiagnosticsScreen } from './components/DiagnosticsScreen';
import { SettingsScreen } from './components/SettingsScreen';

import { AshaWorker, Household, Member, ProtocolDoc, DueVisitItem, DevTruthItem, FootprintData } from './types';
import { clientRetrieval } from './services/retrievalEngine';
import { generateAllVisits, DEFAULT_PLANNING_DATE } from './services/visitPlanner';
import { 
  getCompletedVisitsLocal, 
  getSyncQueueLocal, 
  flushSyncQueueLocal, 
  getOfflineModeLocal, 
  setOfflineModeLocal 
} from './services/localDatabase';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [ashas, setAshas] = useState<AshaWorker[]>([]);
  const [households, setHouseholds] = useState<Household[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [protocols, setProtocols] = useState<ProtocolDoc[]>([]);
  const [devTruth, setDevTruth] = useState<DevTruthItem[]>([]);
  const [footprint, setFootprint] = useState<FootprintData | null>(null);

  const [selectedAsha, setSelectedAsha] = useState<AshaWorker | null>(null);
  const [isOffline, setIsOffline] = useState<boolean>(getOfflineModeLocal());
  const [planningDate, setPlanningDate] = useState<string>(DEFAULT_PLANNING_DATE);
  const [targetSectionId, setTargetSectionId] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Load datasets on startup
  useEffect(() => {
    async function loadInitialData() {
      try {
        const [
          ashasRes,
          householdsRes,
          membersRes,
          protocolsRes,
          devTruthRes,
          footprintRes
        ] = await Promise.all([
          fetch('/data/ashas.json').then(r => r.json()),
          fetch('/data/households.json').then(r => r.json()),
          fetch('/data/household_register.json').then(r => r.json()),
          fetch('/data/protocols.json').then(r => r.json()),
          fetch('/data/dev_truth.json').then(r => r.json()),
          fetch('/data/submission_footprint.json').then(r => r.json()).catch(() => null)
        ]);

        setAshas(ashasRes);
        setHouseholds(householdsRes);
        setMembers(membersRes);
        setProtocols(protocolsRes);
        setDevTruth(devTruthRes);
        setFootprint(footprintRes);

        if (ashasRes && ashasRes.length > 0) {
          setSelectedAsha(ashasRes[0]);
        }

        // Initialize client-side BM25 index with all protocols
        clientRetrieval.indexProtocols(protocolsRes);
      } catch (err) {
        console.error("Failed to load initial data:", err);
      } finally {
        setIsLoading(false);
      }
    }

    loadInitialData();
  }, []);

  // Update offline mode in localStorage
  useEffect(() => {
    setOfflineModeLocal(isOffline);
  }, [isOffline]);

  // Completed visits map
  const completedMap = useMemo(() => {
    const list = getCompletedVisitsLocal();
    const map = new Map<string, string>();
    for (const v of list) {
      map.set(`${v.member_id}_${v.due_item}`, v.completed_date);
    }
    return map;
  }, [refreshTrigger]);

  // Pending sync items count
  const pendingSyncCount = useMemo(() => {
    return getSyncQueueLocal().length;
  }, [refreshTrigger]);

  // Calculate all due visits across members
  const dueVisits = useMemo<DueVisitItem[]>(() => {
    if (members.length === 0) return [];
    return generateAllVisits(members, planningDate, completedMap);
  }, [members, planningDate, completedMap]);

  const handleSync = () => {
    const syncedCount = flushSyncQueueLocal();
    setRefreshTrigger(prev => prev + 1);
    alert(`Successfully synchronized ${syncedCount} offline completed visits!`);
  };

  const handleOpenSectionInLibrary = (sectionId: string) => {
    setTargetSectionId(sectionId);
    setActiveTab('protocols');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mb-4" />
        <h2 className="text-lg font-bold">Initializing SwasthyaSaathi Offline Knowledge Base...</h2>
        <p className="text-xs text-slate-400 mt-1">Indexing 9 healthcare protocols and loading 500 households</p>
      </div>
    );
  }

  const totalSections = protocols.reduce((acc, p) => acc + p.sections.length, 0);

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col antialiased">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isOffline={isOffline}
        setIsOffline={setIsOffline}
        pendingSyncCount={pendingSyncCount}
        onSync={handleSync}
        selectedAsha={selectedAsha}
        ashas={ashas}
        onSelectAsha={setSelectedAsha}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'dashboard' && (
          <HomeDashboard
            householdsCount={households.length}
            membersCount={members.length}
            ashas={ashas}
            dueVisits={dueVisits}
            isOffline={isOffline}
            onNavigate={setActiveTab}
            onSelectAsha={setSelectedAsha}
          />
        )}

        {activeTab === 'ask' && (
          <AskQuestion
            onOpenSection={handleOpenSectionInLibrary}
            onNavigate={setActiveTab}
          />
        )}

        {activeTab === 'emergency' && (
          <EmergencyAlerts
            onOpenSection={handleOpenSectionInLibrary}
          />
        )}

        {activeTab === 'visits' && (
          <DailyVisitPlanner
            members={members}
            ashas={ashas}
            dueVisits={dueVisits}
            onVisitToggled={() => setRefreshTrigger(prev => prev + 1)}
            planningDate={planningDate}
            setPlanningDate={setPlanningDate}
          />
        )}

        {activeTab === 'protocols' && (
          <ProtocolLibrary
            protocols={protocols}
            targetSectionId={targetSectionId}
            onClearTargetSection={() => setTargetSectionId(null)}
          />
        )}

        {activeTab === 'register' && (
          <HouseholdRegister
            members={members}
            households={households}
            ashas={ashas}
            planningDate={planningDate}
          />
        )}

        {activeTab === 'diagnostics' && (
          <DiagnosticsScreen
            devTruth={devTruth}
            footprint={footprint}
            totalSections={totalSections}
            totalHouseholds={households.length}
            totalMembers={members.length}
            totalVisits={dueVisits.length}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsScreen
            isOffline={isOffline}
            setIsOffline={setIsOffline}
            pendingSyncCount={pendingSyncCount}
            onSync={handleSync}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 text-slate-400 text-xs py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
          <div>
            <span className="font-bold text-slate-200">SwasthyaSaathi</span> · Reliable Health Guidance, Even Without a Network
          </div>
          <div className="text-[11px] text-slate-500">
            Chandrapuri Block Scenario · Hackathon Prototype · Frontline Decision Support
          </div>
        </div>
      </footer>
    </div>
  );
}
