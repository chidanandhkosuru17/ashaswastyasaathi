import React, { useState, useMemo } from 'react';
import { 
  Users, 
  Search, 
  Filter, 
  Home, 
  Calendar, 
  Heart, 
  Activity, 
  X, 
  Baby, 
  AlertCircle,
  Eye,
  FileText
} from 'lucide-react';
import { Member, Household, AshaWorker } from '../types';
import { calculateMemberDueVisits, DEFAULT_PLANNING_DATE } from '../services/visitPlanner';

interface HouseholdRegisterProps {
  members: Member[];
  households: Household[];
  ashas: AshaWorker[];
  planningDate: string;
}

export const HouseholdRegister: React.FC<HouseholdRegisterProps> = ({
  members,
  households,
  ashas,
  planningDate
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVillage, setSelectedVillage] = useState('all');
  const [selectedAsha, setSelectedAsha] = useState('all');
  const [conditionFilter, setConditionFilter] = useState('all');
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  const villageList = ["Amrapur", "Belwadi Tola", "Kesarganj", "Dhanpura", "Navagaon Khurd", "Sitapahari"];

  const filteredMembers = useMemo(() => {
    return members.filter(m => {
      if (selectedVillage !== 'all' && m.village !== selectedVillage) return false;
      if (selectedAsha !== 'all' && m.asha_id !== selectedAsha) return false;

      if (conditionFilter === 'pregnant' && m.is_pregnant !== 'YES') return false;
      if (conditionFilter === 'hrp' && m.hrp_status !== 'YES') return false;
      if (conditionFilter === 'infant' && m.age > 0) return false;
      if (conditionFilter === 'sam' && m.muac_category !== 'SAM') return false;
      if (conditionFilter === 'htn' && m.htn_diagnosed !== 'YES') return false;
      if (conditionFilter === 'dm' && m.dm_diagnosed !== 'YES') return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = m.name.toLowerCase().includes(q);
        const matchMemId = m.member_id.toLowerCase().includes(q);
        const matchHhId = m.household_id.toLowerCase().includes(q);
        if (!matchName && !matchMemId && !matchHhId) return false;
      }

      return true;
    });
  }, [members, selectedVillage, selectedAsha, conditionFilter, searchQuery]);

  // Household lookup map
  const householdMap = useMemo(() => {
    const map = new Map<string, Household>();
    for (const h of households) {
      map.set(h.household_id, h);
    }
    return map;
  }, [households]);

  // Calculate due visits for selected member
  const memberDueVisits = useMemo(() => {
    if (!selectedMember) return [];
    return calculateMemberDueVisits(selectedMember, planningDate);
  }, [selectedMember, planningDate]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center space-x-2">
            <Users className="w-6 h-6 text-teal-600" />
            <span>Household & Member Register</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            500 Households · 2,234 Tracked Members in Chandrapuri Block
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs text-slate-500 bg-white px-3 py-1.5 rounded-xl border border-slate-200">
          <span className="font-semibold text-slate-900">{filteredMembers.length}</span> members matching
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search name, MEM-ID, HH-ID..."
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

          {/* Condition Filter */}
          <div>
            <select
              aria-label="Filter by Clinical Condition"
              value={conditionFilter}
              onChange={(e) => setConditionFilter(e.target.value)}
              className="w-full py-2 px-3 text-xs text-slate-800 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:border-teal-500 cursor-pointer"
            >
              <option value="all">All Clinical Cohorts</option>
              <option value="pregnant">Pregnant Women (ANC)</option>
              <option value="hrp">High-Risk Pregnancy (HRP)</option>
              <option value="infant">Newborns & Infants (Age 0)</option>
              <option value="sam">Severe Malnutrition (SAM MUAC)</option>
              <option value="htn">Hypertension Diagnosed</option>
              <option value="dm">Diabetes Diagnosed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Members Grid / Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
              <tr>
                <th className="py-3 px-4">Member ID</th>
                <th className="py-3 px-4">Name</th>
                <th className="py-3 px-4">Age / Gender</th>
                <th className="py-3 px-4">Village & Household</th>
                <th className="py-3 px-4">Clinical Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMembers.slice(0, 50).map((m) => {
                const isPregnant = m.is_pregnant === 'YES';
                const isHrp = m.hrp_status === 'YES';
                const isSam = m.muac_category === 'SAM';
                const isHtn = m.htn_diagnosed === 'YES';
                const isDm = m.dm_diagnosed === 'YES';

                return (
                  <tr key={m.member_id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-700 whitespace-nowrap">
                      {m.member_id}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900 whitespace-nowrap">
                      {m.name}
                    </td>
                    <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                      {m.age} yrs · {m.gender === 'F' ? 'Female' : 'Male'}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="text-slate-800 font-medium">{m.village}</div>
                      <div className="text-[11px] text-slate-500 font-mono">{m.household_id}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1">
                        {isPregnant && (
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            isHrp ? 'bg-red-100 text-red-800 border border-red-200' : 'bg-purple-100 text-purple-800 border border-purple-200'
                          }`}>
                            {isHrp ? 'Pregnant (HRP)' : 'Pregnant'}
                          </span>
                        )}
                        {m.age === 0 && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                            Infant
                          </span>
                        )}
                        {isSam && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                            SAM ({m.muac_cm} cm)
                          </span>
                        )}
                        {isHtn && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                            HTN ({m.bp_systolic}/{m.bp_diastolic})
                          </span>
                        )}
                        {isDm && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            DM (RBS {m.rbs_mgdl})
                          </span>
                        )}
                        {!isPregnant && m.age > 0 && !isSam && !isHtn && !isDm && (
                          <span className="text-slate-400 text-[11px]">General Household Member</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => setSelectedMember(m)}
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-teal-50 text-slate-700 hover:text-teal-800 border border-slate-200 transition-colors cursor-pointer"
                      >
                        Inspect Record
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredMembers.length > 50 && (
          <div className="p-3 text-center text-xs text-slate-500 border-t border-slate-100 bg-slate-50">
            Showing first 50 of {filteredMembers.length} records. Refine search or village filter to view specific families.
          </div>
        )}
      </div>

      {/* Member Detail Modal */}
      {selectedMember && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-5">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-xs font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                    {selectedMember.member_id}
                  </span>
                  <span className="text-xs text-slate-500">· Household {selectedMember.household_id}</span>
                </div>
                <h2 className="text-lg font-bold text-slate-900 mt-1">{selectedMember.name}</h2>
                <p className="text-xs text-slate-500">
                  {selectedMember.age} yrs · {selectedMember.gender === 'F' ? 'Female' : 'Male'} · Village: {selectedMember.village}
                </p>
              </div>

              <button
                onClick={() => setSelectedMember(null)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Clinical Breakdown */}
            <div className="space-y-3 text-xs">
              <div className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                Clinical Tracking Vitals
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-slate-500 font-medium">Date of Birth:</span>
                  <div className="font-bold text-slate-900 mt-0.5">{selectedMember.dob || 'Not recorded'}</div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-slate-500 font-medium">Assigned ASHA:</span>
                  <div className="font-bold text-slate-900 mt-0.5">{selectedMember.asha_id}</div>
                </div>

                {selectedMember.is_pregnant === 'YES' && (
                  <>
                    <div className="p-3 bg-purple-50 rounded-xl border border-purple-200">
                      <span className="text-purple-700 font-medium">LMP Date:</span>
                      <div className="font-bold text-purple-950 mt-0.5">{selectedMember.lmp || 'Pending'}</div>
                    </div>
                    <div className="p-3 bg-purple-50 rounded-xl border border-purple-200">
                      <span className="text-purple-700 font-medium">HRP Status:</span>
                      <div className="font-bold text-purple-950 mt-0.5">{selectedMember.hrp_status}</div>
                    </div>
                  </>
                )}

                {selectedMember.age >= 30 && (
                  <>
                    <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
                      <span className="text-amber-800 font-medium">Blood Pressure:</span>
                      <div className="font-bold text-amber-950 mt-0.5">
                        {selectedMember.bp_systolic}/{selectedMember.bp_diastolic} mmHg
                      </div>
                    </div>
                    <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                      <span className="text-emerald-800 font-medium">Blood Glucose (RBS):</span>
                      <div className="font-bold text-emerald-950 mt-0.5">
                        {selectedMember.rbs_mgdl ? `${selectedMember.rbs_mgdl} mg/dL` : 'Not tested'}
                      </div>
                    </div>
                  </>
                )}

                {selectedMember.muac_cm && (
                  <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 col-span-2">
                    <span className="text-rose-800 font-medium">Nutrition MUAC Score:</span>
                    <div className="font-bold text-rose-950 mt-0.5">
                      {selectedMember.muac_cm} cm ({selectedMember.muac_category})
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Calculated Due Items for This Member */}
            <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
              <div className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                Calculated Visit Items for {planningDate}
              </div>

              {memberDueVisits.length > 0 ? (
                <div className="space-y-2">
                  {memberDueVisits.map((v, i) => (
                    <div key={i} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-mono font-bold text-slate-900">{v.due_item}</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            v.priority === 1 ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            Priority {v.priority}
                          </span>
                        </div>
                        <p className="text-slate-600 mt-1">{v.reason}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-500 italic p-2 bg-slate-50 rounded-lg">
                  No overdue or scheduled visits pending for this member on {planningDate}.
                </p>
              )}
            </div>

            <button
              onClick={() => setSelectedMember(null)}
              className="w-full bg-slate-900 text-white py-2 rounded-xl text-xs font-semibold cursor-pointer"
            >
              Close Record
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
