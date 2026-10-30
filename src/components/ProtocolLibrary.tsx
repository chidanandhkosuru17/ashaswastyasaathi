import React, { useState, useMemo, useEffect } from 'react';
import { 
  BookOpen, 
  Search, 
  ChevronRight, 
  ChevronDown, 
  Bookmark, 
  FileText, 
  HeartHandshake, 
  ExternalLink,
  ShieldAlert,
  Hash
} from 'lucide-react';
import { ProtocolDoc, ProtocolSection } from '../types';

interface ProtocolLibraryProps {
  protocols: ProtocolDoc[];
  targetSectionId?: string | null;
  onClearTargetSection?: () => void;
}

export const ProtocolLibrary: React.FC<ProtocolLibraryProps> = ({
  protocols,
  targetSectionId,
  onClearTargetSection
}) => {
  const [selectedDocId, setSelectedDocId] = useState<string>('01');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  // If a target section ID is passed from query answer, automatically switch to its document and expand it!
  useEffect(() => {
    if (targetSectionId) {
      const prefix = targetSectionId.split('-')[0].toUpperCase();
      const doc = protocols.find(p => p.sections.some(s => s.section_id.toUpperCase() === targetSectionId.toUpperCase()));
      if (doc) {
        setSelectedDocId(doc.id);
        setExpandedSections(prev => ({ ...prev, [targetSectionId.toUpperCase()]: true }));
        // Scroll to element after render
        setTimeout(() => {
          const el = document.getElementById(`section-${targetSectionId.toUpperCase()}`);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 150);
      }
    }
  }, [targetSectionId, protocols]);

  const activeDoc = useMemo(() => {
    return protocols.find(p => p.id === selectedDocId) || protocols[0];
  }, [protocols, selectedDocId]);

  // Search filtering across all protocols
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    const matches: Array<{ protocol: ProtocolDoc; section: ProtocolSection }> = [];

    for (const p of protocols) {
      for (const s of p.sections) {
        if (
          s.section_id.toLowerCase().includes(q) ||
          s.title.toLowerCase().includes(q) ||
          s.content.toLowerCase().includes(q)
        ) {
          matches.push({ protocol: p, section: s });
        }
      }
    }
    return matches;
  }, [protocols, searchQuery]);

  const toggleSection = (secId: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [secId]: !prev[secId]
    }));
  };

  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return text;
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, i) => 
      regex.test(part) ? (
        <mark key={i} className="bg-yellow-200 text-yellow-950 font-semibold px-0.5 rounded">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center space-x-2">
            <BookOpen className="w-6 h-6 text-teal-600" />
            <span>Healthcare Protocol Library</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Browse all 9 approved public health protocols for frontline health workers.
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search keywords, IDs (e.g. ANC-1.2, ORS, KMC)..."
            className="w-full pl-9 pr-3 py-2 text-xs text-slate-900 bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-teal-500 shadow-2xs"
          />
        </div>
      </div>

      {/* Prominent Disclaimer */}
      <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-3 text-xs text-blue-900 flex items-start space-x-2.5">
        <HeartHandshake className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
        <p>
          <span className="font-semibold">Educational and operational decision support for trained frontline health workers.</span> Protocols are simplified hackathon materials and are not for clinical use. This system does not replace clinical judgment or qualified medical care.
        </p>
      </div>

      {/* If Searching, show search results across all protocols */}
      {searchQuery.trim() ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-600">
            <span className="font-bold">Search Results ({searchResults.length} matches found)</span>
            <button 
              onClick={() => setSearchQuery('')}
              className="text-teal-700 font-semibold hover:underline cursor-pointer"
            >
              Clear Search
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {searchResults.map(({ protocol, section }, idx) => (
              <div 
                key={idx} 
                className="py-3.5 space-y-2 cursor-pointer hover:bg-slate-50/80 p-2 rounded-xl transition-colors"
                onClick={() => {
                  setSelectedDocId(protocol.id);
                  setSearchQuery('');
                  setExpandedSections(prev => ({ ...prev, [section.section_id]: true }));
                  setTimeout(() => {
                    const el = document.getElementById(`section-${section.section_id}`);
                    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }, 150);
                }}
              >
                <div className="flex items-center space-x-2">
                  <span className="font-mono font-bold text-xs bg-teal-100 text-teal-800 px-2 py-0.5 rounded border border-teal-200">
                    {section.section_id}
                  </span>
                  <span className="text-xs font-bold text-slate-900">
                    {highlightText(section.title, searchQuery)}
                  </span>
                  <span className="text-[11px] text-slate-400">· {protocol.title}</span>
                </div>
                <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                  {highlightText(section.content, searchQuery)}
                </p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Regular Split Layout: Document List on Left, Document Sections on Right */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Column: List of 9 Protocols */}
          <div className="space-y-2">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500 px-1">
              Protocols (9 Documents)
            </div>
            <div className="space-y-1.5">
              {protocols.map((doc) => {
                const isSelected = doc.id === selectedDocId;
                const isEsc = doc.id === '03' || doc.id.includes('ESC');
                return (
                  <button
                    key={doc.id}
                    onClick={() => setSelectedDocId(doc.id)}
                    className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                        : isEsc
                        ? 'bg-red-50/50 hover:bg-red-100/70 border-red-200 text-red-950'
                        : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800'
                    }`}
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center space-x-1.5">
                        <span className={`font-mono text-[11px] font-bold ${isSelected ? 'text-teal-400' : isEsc ? 'text-red-700' : 'text-teal-700'}`}>
                          {doc.id}
                        </span>
                        <span className="text-xs font-bold line-clamp-1">{doc.title.replace(/^Protocol \d+:\s*/, '')}</span>
                      </div>
                      <div className={`text-[11px] ${isSelected ? 'text-slate-400' : 'text-slate-500'}`}>
                        {doc.sections.length} leaf sections
                      </div>
                    </div>
                    <ChevronRight className={`w-4 h-4 shrink-0 ${isSelected ? 'text-teal-400' : 'text-slate-400'}`} />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right 2 Columns: Selected Protocol Sections */}
          <div className="md:col-span-2 space-y-4">
            {activeDoc && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-5">
                {/* Protocol Header */}
                <div className="border-b border-slate-100 pb-4 space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-mono font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                      {activeDoc.filename}
                    </span>
                    <span className="text-xs text-slate-400">· {activeDoc.sections.length} sections</span>
                  </div>
                  <h2 className="text-lg font-extrabold text-slate-900">
                    {activeDoc.title}
                  </h2>
                </div>

                {/* Leaf Sections Accordion */}
                <div className="space-y-3">
                  {activeDoc.sections.map((sec) => {
                    const isExpanded = expandedSections[sec.section_id] ?? true;
                    const isTarget = targetSectionId && targetSectionId.toUpperCase() === sec.section_id.toUpperCase();

                    return (
                      <div
                        id={`section-${sec.section_id}`}
                        key={sec.section_id}
                        className={`rounded-xl border transition-all ${
                          isTarget
                            ? 'border-2 border-teal-500 bg-teal-50/40 shadow-xs ring-2 ring-teal-100'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        {/* Section Header */}
                        <div
                          onClick={() => toggleSection(sec.section_id)}
                          className="p-3.5 flex items-center justify-between cursor-pointer select-none"
                        >
                          <div className="flex items-center space-x-2.5">
                            <span className="font-mono font-bold text-xs bg-slate-100 text-slate-800 px-2.5 py-0.5 rounded border border-slate-200">
                              {sec.section_id}
                            </span>
                            <span className="text-xs font-bold text-slate-900">{sec.title}</span>
                          </div>

                          <div className="flex items-center space-x-2 text-slate-400">
                            {isTarget && (
                              <span className="text-[10px] font-bold text-teal-700 bg-teal-100 px-2 py-0.5 rounded">
                                Cited Section
                              </span>
                            )}
                            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                          </div>
                        </div>

                        {/* Section Body */}
                        {isExpanded && (
                          <div className="px-4 pb-4 pt-1 border-t border-slate-100 text-xs text-slate-700 leading-relaxed font-normal whitespace-pre-line">
                            {sec.content}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
