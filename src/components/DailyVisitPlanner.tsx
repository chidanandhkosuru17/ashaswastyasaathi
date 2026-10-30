import React, { useState, useMemo } from 'react';
import { 
  CalendarCheck2, 
  Download, 
  Search, 
  Filter, 
  CheckCircle, 
  Circle, 
  AlertTriangle, 
  Clock, 
  Calendar,
  User,
  MapPin,
  FileSpreadsheet
} from 'lucide-react';
import { Member, DueVisitItem, AshaWorker } from '../types';
import { calculateMemberDueVisits, DEFAULT_PLANNING_DATE } from '../services/visitPlanner';
import { markVisitCompletedLocal, unmarkVisitCompletedLocal } from '../services/localDatabase';

interface DailyVisitPlannerProps {
  members: Member[];
  ashas: AshaWorker[];
  dueVisits: DueVisitItem[];
  onVisitToggled: () => void;
  planningDate: string;
  setPlanningDate: (date: string) => void;
}

export const DailyVisitPlanner: React.FC<DailyVisitPlannerProps> = ({
  members,
  ashas,
  dueVisits,
  onVisitToggled,
  planningDate,
  setPlanningDate
}) => {
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [selectedVillage, setSelectedVillage] = useState<string>('all');
  const [selectedAsha, setSelectedAsha] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showOnlyIncomplete, setShowOnlyIncomplete] = useState<boolean>(true);

  // Village list from ASHAs
  const villageList = useMemo(() => {
    return ["Amrapur", "Belwadi Tola", "Kesarganj", "Dhanpura", "Navagaon Khurd", "Sitapahari"];
  }, []);

  // Filtered visits
  const filteredVisits = useMemo(() => {
    return dueVisits.filter(v => {
      if (showOnlyIncomplete && v.completed) return false;
      if (selectedPriority !== 'all' && v.priority !== Number(selectedPriority)) return false;
      if (selectedVillage !== 'all' && v.village !== selectedVillage) return false;
      if (selectedAsha !== 'all' && v.asha_id !== selectedAsha) return false;

      // Category filter
      if (categoryFilter !== 'all') {
        if (categoryFilter === 'anc' && !v.due_item.startsWith('ANC') && !v.due_item.startsWith('TD_PREG') && v.due_item !== 'HRP_FOLLOWUP') return false;
        if (categoryFilter === 'imm' && !['BCG', 'OPV', 'PENTA', 'ROTA', 'FIPV', 'PCV', 'MR', 'JE', 'DPT', 'TD_10', 'TD_16'].some(p => v.due_item.includes(p))) return false;
        if (categoryFilter === 'hbnc' && !v.due_item.startsWith('HBNC')) return false;
        if (categoryFilter === 'nut' && !v.due_item.startsWith('MUAC')) return false;
        if (categoryFilter === 'ncd' && !v.due_item.startsWith('HTN') && !v.due_item.startsWith('DM')) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = v.name.toLowerCase().includes(q);
        const matchMemId = v.member_id.toLowerCase().includes(q);
        const matchHhId = v.household_id.toLowerCase().includes(q);
        const matchItem = v.due_item.toLowerCase().includes(q);
        if (!matchName && !matchMemId && !matchHhId && !matchItem) return false;
      }

      return true;
    });
  }, [dueVisits, showOnlyIncomplete, selectedPriority, selectedVillage, selectedAsha, categoryFilter, searchQuery]);

  const handleToggleComplete = (v: DueVisitItem) => {
    if (v.completed) {
      unmarkVisitCompletedLocal(v.member_id, v.due_item);
    } else {
      markVisitCompletedLocal(v.member_id, v.due_item, v.asha_id, "Completed during field visit");
    }
    onVisitToggled();
  };

  const handleExportCSV = () => {
    // Generate official H5_visit_list.csv format: member_id,due_item,priority
    const headers = ["member_id", "due_item", "priority"];
    const rows = dueVisits.map(v => [v.member_id, v.due_item, v.priority]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `H5_visit_list_${planningDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const p1Count = dueVisits.filter(v => v.priority === 1 && !v.completed).length;
  const p2Count = dueVisits.filter(v => v.priority === 2 && !v.completed).length;
  const p3Count = dueVisits.filter(v => v.priority === 3 && !v.completed).length;
  const completedCount = dueVisits.filter(v => v.completed).length;

  return (
    <div className="space-y-6">
      {/* Top Header & Export */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center space-x-2">
            <CalendarCheck2 className="w-6 h-6 text-teal-600" />
            <span>Daily Household Visit Planner</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Automated priority scoring for 500 households as per Protocol 09 (VIS) rules.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {/* Historical Date Picker */}
          <div className="flex items-center space-x-2 bg-white px-3 py-1.5 rounded-xl border border-slate-300 text-xs shadow-2xs">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <label className="text-slate-500 font-medium">Planning Date:</label>
            <input
              type="date"
              aria-label="Planning Date"
              value={planningDate}
              onChange={(e) => setPlanningDate(e.target.value)}
              className="bg-transparent text-slate-800 font-semibold focus:outline-none cursor-pointer"
            />
          </div>

          <button
            onClick={handleExportCSV}
            className="flex items-center space-x-1.5 bg-teal-600 hover:bg-teal-500 text-white px-3.5 py-2 rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Priority Summary Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={() => setSelectedPriority('all')}
          className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
            selectedPriority === 'all'
              ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
              : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="text-[11px] font-medium opacity-80">All Due Items</div>
          <div className="text-xl font-bold mt-0.5">{dueVisits.length}</div>
          <div className="text-[10px] opacity-70 mt-0.5">{completedCount} completed</div>
        </button>

        <button
          onClick={() => setSelectedPriority('1')}
          className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
            selectedPriority === '1'
              ? 'bg-red-600 text-white border-red-600 shadow-xs'
              : 'bg-red-50/60 text-red-900 border-red-200 hover:border-red-300'
          }`}
        >
          <div className="text-[11px] font-semibold flex items-center justify-between">
            <span>Priority 1: High-Risk</span>
            <AlertTriangle className="w-3.5 h-3.5" />
          </div>
          <div className="text-xl font-bold mt-0.5">{p1Count} pending</div>
          <div className="text-[10px] opacity-80 mt-0.5">HRP, SAM, &gt;30d overdue</div>
        </button>

        <button
          onClick={() => setSelectedPriority('2')}
          className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
            selectedPriority === '2'
              ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
              : 'bg-amber-50/60 text-amber-900 border-amber-200 hover:border-amber-300'
          }`}
        >
          <div className="text-[11px] font-semibold flex items-center justify-between">
            <span>Priority 2: Routine Due</span>
            <Clock className="w-3.5 h-3.5" />
          </div>
          <div className="text-xl font-bold mt-0.5">{p2Count} pending</div>
          <div className="text-[10px] opacity-80 mt-0.5">Routine ANC, UIP, NCD</div>
        </button>

        <button
          onClick={() => setSelectedPriority('3')}
          className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
            selectedPriority === '3'
              ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
              : 'bg-blue-50/60 text-blue-900 border-blue-200 hover:border-blue-300'
          }`}
        >
          <div className="text-[11px] font-semibold flex items-center justify-between">
            <span>Priority 3: This Week</span>
            <CalendarCheck2 className="w-3.5 h-3.5" />
          </div>
          <div className="text-xl font-bold mt-0.5">{p3Count} scheduled</div>
          <div className="text-[10px] opacity-80 mt-0.5">Next 7 days window</div>
        </button>
      </div>

      {/* Filters and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search */}
          <div className="lg:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search member name, MEM-ID, HH-ID, due item..."
              className="w-full pl-9 pr-3 py-2 text-xs text-slate-900 border border-slate-300 rounded-xl focus:outline-none focus:border-teal-500"
            />
          </div>

          {/* Village Filter */}
          <div>
            <select
              aria-label="Filter by Village"
              value={selectedVillage}
              onChange={(e) => setSelectedVillage(e.target.value)}
              className="w-full py-2 px-3 text-xs text-slate-800 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:border-teal-500 cursor-pointer"
            >
              <option value="all">All Villages (6)</option>
              {villageList.map(v => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </div>

          {/* ASHA Filter */}
          <div>
            <select
              aria-label="Filter by ASHA Worker"
              value={selectedAsha}
              onChange={(e) => setSelectedAsha(e.target.value)}
              className="w-full py-2 px-3 text-xs text-slate-800 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:border-teal-500 cursor-pointer"
            >
              <option value="all">All ASHAs (5)</option>
              {ashas.map(a => (
                <option key={a.asha_id} value={a.asha_id}>{a.name} ({a.village})</option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <select
              aria-label="Filter by Healthcare Category"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full py-2 px-3 text-xs text-slate-800 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:border-teal-500 cursor-pointer"
            >
              <option value="all">All Healthcare Categories</option>
              <option value="anc">Antenatal Care (ANC / Td / HRP)</option>
              <option value="imm">Childhood Immunisation (UIP)</option>
              <option value="hbnc">Newborn Care (HBNC)</option>
              <option value="nut">Malnutrition (MUAC SAM/MAM)</option>
              <option value="ncd">NCD (Hypertension / Diabetes)</option>
            </select>
          </div>
        </div>

        {/* Status Toggle */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
          <label className="flex items-center space-x-2 text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={showOnlyIncomplete}
              onChange={(e) => setShowOnlyIncomplete(e.target.checked)}
              className="rounded text-teal-600 focus:ring-teal-500 cursor-pointer"
            />
            <span className="font-medium">Hide completed visits ({completedCount} marked completed)</span>
          </label>
          <span className="text-slate-500 text-[11px]">
            Showing {filteredVisits.length} of {dueVisits.length} total visit requirements
          </span>
        </div>
      </div>

      {/* Visit List Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
              <tr>
                <th className="py-3 px-4 w-12 text-center">Status</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">Due Item</th>
                <th className="py-3 px-4">Member Name & Details</th>
                <th className="py-3 px-4">Village & Household</th>
                <th className="py-3 px-4">Clinical Clinical Reason</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredVisits.slice(0, 100).map((v, idx) => {
                const isP1 = v.priority === 1;
                const isP2 = v.priority === 2;
                return (
                  <tr 
                    key={`${v.member_id}_${v.due_item}_${idx}`} 
                    className={`hover:bg-slate-50/80 transition-colors ${v.completed ? 'bg-slate-50 opacity-60' : ''}`}
                  >
                    {/* Status Checkbox */}
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleToggleComplete(v)}
                        className="text-slate-400 hover:text-teal-600 transition-colors cursor-pointer"
                        title={v.completed ? "Mark incomplete" : "Mark visit as completed"}
                      >
                        {v.completed ? (
                          <CheckCircle className="w-5 h-5 text-emerald-600" />
                        ) : (
                          <Circle className="w-5 h-5" />
                        )}
                      </button>
                    </td>

                    {/* Priority Badge */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                        isP1 
                          ? 'bg-red-100 text-red-800 border border-red-200' 
                          : isP2 
                          ? 'bg-amber-100 text-amber-800 border border-amber-200' 
                          : 'bg-blue-100 text-blue-800 border border-blue-200'
                      }`}>
                        Priority {v.priority}
                      </span>
                    </td>

                    {/* Due Item Code */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded text-[11px] border border-slate-200">
                        {v.due_item}
                      </span>
                    </td>

                    {/* Member Details */}
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{v.name}</div>
                      <div className="text-[11px] text-slate-500 font-mono">{v.member_id}</div>
                    </td>

                    {/* Village & Household */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="text-slate-800 font-medium">{v.village}</div>
                      <div className="text-[11px] text-slate-500 font-mono">{v.household_id} · {v.asha_id}</div>
                    </td>

                    {/* Clinical Reason */}
                    <td className="py-3 px-4">
                      <span className={`text-xs ${isP1 ? 'text-red-700 font-semibold' : 'text-slate-600 font-normal'}`}>
                        {v.reason}
                      </span>
                    </td>

                    {/* Action Button */}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => handleToggleComplete(v)}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                          v.completed
                            ? 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                            : 'bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200'
                        }`}
                      >
                        {v.completed ? 'Completed ✓' : 'Mark Done'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredVisits.length > 100 && (
          <div className="p-3 text-center text-xs text-slate-500 border-t border-slate-100 bg-slate-50">
            Showing first 100 of {filteredVisits.length} matching rows. Use the Export CSV button above to download the entire dataset.
          </div>
        )}
      </div>
    </div>
  );
};
