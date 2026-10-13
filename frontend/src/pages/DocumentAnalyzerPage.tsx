import React, { useState, useRef } from 'react';
import { analyzeDocument } from '../lib/api.js';
import { DocumentAnalysisCard } from '../components/DocumentAnalysisCard.js';
import type {
  DocumentAnalysisResult,
  ChecklistItemCategory,
  RequirementLevel,
  ChecklistItemStatus
} from '../types/index.js';
import {
  FileSearch,
  UploadCloud,
  FileCheck2,
  Sparkles,
  AlertCircle,
  Loader2,
  FileText,
  X,
  ShieldCheck,
  Check,
  RotateCcw,
  Plus,
  Trash2,
  Edit3,
  Info,
  Lock,
  ListChecks,
  CheckCircle2,
  Clock,
  HelpCircle
} from 'lucide-react';

interface ManagedChecklistItem {
  id: string;
  title: string;
  category: ChecklistItemCategory;
  requirement_level: RequirementLevel;
  status: ChecklistItemStatus;
  notes: string;
  guidance: string;
}

const defaultChecklistData: Record<string, ManagedChecklistItem[]> = {
  'Japan': [
    {
      id: 'jp-1',
      title: 'Biometric Passport (ICAO 9303 Compliant)',
      category: 'Identification',
      requirement_level: 'required',
      status: 'Ready',
      notes: 'Valid for 9 months from departure date',
      guidance: 'Must have at least 2 consecutive blank visa pages and valid for duration of stay.'
    },
    {
      id: 'jp-2',
      title: 'Visit Japan Web (Digital Arrival / Customs QR)',
      category: 'Travel Logistics',
      requirement_level: 'required',
      status: 'In progress',
      notes: 'Need to submit 24h before landing at NRT/HND',
      guidance: 'Generate immigration and tax-free customs declaration QR code via official digital agency.'
    },
    {
      id: 'jp-3',
      title: 'Confirmed Return / Onward Flight Itinerary',
      category: 'Travel Logistics',
      requirement_level: 'required',
      status: 'Ready',
      notes: 'Direct return flight ticket booked',
      guidance: 'Airlines will deny boarding without verified onward passage departing Japan within 90 days.'
    },
    {
      id: 'jp-4',
      title: 'Proof of Funds (Recent Bank Statements / Card)',
      category: 'Financial',
      requirement_level: 'conditional',
      status: 'In progress',
      notes: 'Export PDF statement showing >$3,000 balance',
      guidance: 'Immigration may request proof of min. $70 USD equivalent per day for independent travelers.'
    },
    {
      id: 'jp-5',
      title: 'International Travel Medical Insurance',
      category: 'Health & Vaccines',
      requirement_level: 'recommended',
      status: 'Not started',
      notes: 'Need to purchase policy with COVID/Emergency coverage',
      guidance: 'Japan medical facilities strongly recommend min. ¥10,000,000 emergency medical coverage.'
    },
    {
      id: 'jp-6',
      title: 'Hotel / Ryokan Reservations Confirmation',
      category: 'Accommodation',
      requirement_level: 'required',
      status: 'Ready',
      notes: 'All Tokyo and Kyoto hotels confirmed',
      guidance: 'Must include full property street address and Japanese telephone contact.'
    }
  ],
  'France (Schengen)': [
    {
      id: 'fr-1',
      title: 'Passport Issued Within Last 10 Years',
      category: 'Identification',
      requirement_level: 'required',
      status: 'Ready',
      notes: 'Passport issued in 2022, 6+ months remaining',
      guidance: 'Schengen border code strictly enforces 3-month validity beyond departure date and issue date <10 years.'
    },
    {
      id: 'fr-2',
      title: 'Schengen-Compliant Travel Medical Insurance',
      category: 'Health & Vaccines',
      requirement_level: 'required',
      status: 'In progress',
      notes: 'Policy must show min. €30,000 repatriation limit',
      guidance: 'Must explicitly cover emergency hospitalization and repatriation across all Schengen states with €0 deductible.'
    },
    {
      id: 'fr-3',
      title: 'Daily Proof of Subsistence Funds (€65 - €120/day)',
      category: 'Financial',
      requirement_level: 'required',
      status: 'Not started',
      notes: 'Need 3 months stamped bank statements',
      guidance: '€65/day if hotel booked, €120/day without accommodation bookings.'
    },
    {
      id: 'fr-4',
      title: 'Round-Trip Flight Itinerary with E-ticket Number',
      category: 'Travel Logistics',
      requirement_level: 'required',
      status: 'Ready',
      notes: 'Round-trip Air France flight confirmed',
      guidance: 'Confirmed flight reservation showing entry and exit points across European borders.'
    },
    {
      id: 'fr-5',
      title: 'Proof of Accommodation (Vouchers / Attestation d\'Accueil)',
      category: 'Accommodation',
      requirement_level: 'required',
      status: 'In progress',
      notes: 'Paris hotel voucher downloaded',
      guidance: 'If staying with private hosts, official town hall Attestation d\'Accueil certificate is mandatory.'
    }
  ]
};

export const DocumentAnalyzerPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'checklist' | 'scanner'>('checklist');

  // Checklist State
  const [selectedDestination, setSelectedDestination] = useState<string>('Japan');
  const [checklistItems, setChecklistItems] = useState<ManagedChecklistItem[]>(
    defaultChecklistData['Japan']
  );
  const [editingNotesId, setEditingNotesId] = useState<string | null>(null);
  const [notesInput, setNotesInput] = useState<string>('');
  const [showAddItem, setShowAddItem] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<ChecklistItemCategory>('Identification');
  const [newLevel, setNewLevel] = useState<RequirementLevel>('required');

  // Scanner State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [documentType, setDocumentType] = useState('Passport');
  const [userConsent, setUserConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<DocumentAnalysisResult | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Switch destination checklist
  const handleDestinationChange = (dest: string) => {
    setSelectedDestination(dest);
    if (defaultChecklistData[dest]) {
      setChecklistItems(defaultChecklistData[dest]);
    } else {
      // Default template
      setChecklistItems([
        {
          id: `doc-${Date.now()}-1`,
          title: 'Sovereign Passport with 6-Month Validity',
          category: 'Identification',
          requirement_level: 'required',
          status: 'Ready',
          notes: 'Verify minimum 2 blank pages',
          guidance: 'Check validity date against airline and destination visa policy.'
        },
        {
          id: `doc-${Date.now()}-2`,
          title: 'Round-Trip Air Ticket Confirmation',
          category: 'Travel Logistics',
          requirement_level: 'required',
          status: 'Not started',
          notes: 'Keep digital copy on phone',
          guidance: 'Most immigration officers inspect return ticket to prevent overstays.'
        },
        {
          id: `doc-${Date.now()}-3`,
          title: 'Proof of Financial Means (Bank Statements)',
          category: 'Financial',
          requirement_level: 'conditional',
          status: 'Not started',
          notes: 'Ensure statements have bank letterhead',
          guidance: 'Recommended $50-$100 daily allowance coverage.'
        }
      ]);
    }
  };

  // Status cycle: Not started -> In progress -> Ready -> Needs review -> Not started
  const handleToggleStatus = (id: string) => {
    setChecklistItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const cycle: Record<ChecklistItemStatus, ChecklistItemStatus> = {
          'Not started': 'In progress',
          'In progress': 'Ready',
          'Ready': 'Needs review',
          'Needs review': 'Not started'
        };
        return { ...item, status: cycle[item.status] };
      })
    );
  };

  const handleDeleteItem = (id: string) => {
    setChecklistItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleSaveNotes = (id: string) => {
    setChecklistItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, notes: notesInput } : item))
    );
    setEditingNotesId(null);
  };

  const handleAddNewItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    const newItem: ManagedChecklistItem = {
      id: `custom-${Date.now()}`,
      title: newTitle.trim(),
      category: newCategory,
      requirement_level: newLevel,
      status: 'Not started',
      notes: '',
      guidance: 'Custom traveler preparation item.'
    };
    setChecklistItems((prev) => [...prev, newItem]);
    setNewTitle('');
    setShowAddItem(false);
  };

  // Calculate completion percentage
  const totalCount = checklistItems.length;
  const readyCount = checklistItems.filter((i) => i.status === 'Ready').length;
  const completionPercentage = totalCount > 0 ? Math.round((readyCount / totalCount) * 100) : 0;

  // File Handlers
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setErrorMsg(null);

      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = () => setPreviewUrl(reader.result as string);
        reader.readAsDataURL(file);
      } else {
        setPreviewUrl(null);
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setSelectedFile(file);
      setErrorMsg(null);

      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = () => setPreviewUrl(reader.result as string);
        reader.readAsDataURL(file);
      } else {
        setPreviewUrl(null);
      }
    }
  };

  const handleTestSample = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 260;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, 400, 260);
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 16px sans-serif';
      ctx.fillText('PASSPORT SAMPLE DOCUMENT', 20, 40);
      ctx.fillStyle = '#94a3b8';
      ctx.font = '12px monospace';
      ctx.fillText('P<USAEXPLORER<<ALEX<<<<<<<<<<<<<<<<<<<', 20, 200);
      ctx.fillText('A123456789USA9001018M2908154<<<<<<<<<4', 20, 225);
    }
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], 'sample_passport_demo.png', { type: 'image/png' });
        setSelectedFile(file);
        setPreviewUrl(canvas.toDataURL());
        setUserConsent(true);
      }
    });
  };

  const handleSubmitScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setErrorMsg('Please select or upload a document file to analyze.');
      return;
    }
    if (!userConsent) {
      setErrorMsg('Please review and check the data privacy consent box before processing your document.');
      return;
    }

    setErrorMsg(null);
    setLoading(true);
    setAnalysisResult(null);

    const formData = new FormData();
    formData.append('document', selectedFile);
    formData.append('documentType', documentType);

    try {
      const response = await analyzeDocument(formData);
      setAnalysisResult(response.data);
    } catch (err: any) {
      console.error('Document analysis error:', err);
      setErrorMsg(
        err?.response?.data?.message ||
        err?.message ||
        'Document verification failed. Please ensure the file is an image or PDF.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 space-y-8">
      {/* Page Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-xs font-semibold text-emerald-300">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Consular Readiness Hub • ICAO 9303 Compliant</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
          Document Management & Vision Scanner
        </h1>
        <p className="text-sm sm:text-base text-slate-400">
          Track mandatory border documentation, manage requirement levels, and verify passport MRZ bio-data zones with privacy-protected AI analysis.
        </p>

        {/* Tab Switcher */}
        <div className="inline-flex p-1.5 rounded-2xl bg-navy-950/90 border border-slate-800 gap-1.5 mt-2">
          <button
            onClick={() => setActiveTab('checklist')}
            className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
              activeTab === 'checklist'
                ? 'bg-cyan-500 text-navy-950 shadow-glow-cyan'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ListChecks className="w-4 h-4" />
            <span>Journey Document Checklist</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-navy-900/60 text-white">
              {completionPercentage}%
            </span>
          </button>
          <button
            onClick={() => setActiveTab('scanner')}
            className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
              activeTab === 'scanner'
                ? 'bg-cyan-500 text-navy-950 shadow-glow-cyan'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Biometric MRZ Scanner</span>
          </button>
        </div>
      </div>

      {/* TAB 1: JOURNEY DOCUMENT CHECKLIST & MANAGEMENT */}
      {activeTab === 'checklist' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Header Controls & Progress Bar */}
          <div className="glass-card p-6 border-slate-800 space-y-5 bg-navy-950/80">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <label className="block text-xs font-mono uppercase text-slate-400 mb-1">
                  Select Destination Requirements Matrix
                </label>
                <div className="flex flex-wrap items-center gap-2">
                  {['Japan', 'France (Schengen)', 'Singapore', 'United Kingdom', 'United States'].map((dest) => (
                    <button
                      key={dest}
                      onClick={() => handleDestinationChange(dest)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                        selectedDestination === dest
                          ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                          : 'bg-navy-900 text-slate-400 border-slate-800 hover:text-white'
                      }`}
                    >
                      {dest}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowAddItem(!showAddItem)}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 flex items-center gap-1.5 transition-all"
                >
                  <Plus className="w-4 h-4 text-cyan-400" />
                  <span>Add Custom Document</span>
                </button>
              </div>
            </div>

            {/* Overall Completion Percentage Bar */}
            <div className="space-y-2 pt-2 border-t border-slate-800/80">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-slate-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Overall Preparation Completion: <strong className="text-white">{readyCount} of {totalCount} Ready</strong>
                </span>
                <span className="font-mono text-cyan-300 font-bold">{completionPercentage}%</span>
              </div>
              <div className="w-full bg-slate-900 rounded-full h-2.5 overflow-hidden border border-slate-800">
                <div
                  className="bg-gradient-to-r from-cyan-500 via-blue-500 to-emerald-400 h-2.5 rounded-full transition-all duration-500"
                  style={{ width: `${completionPercentage}%` }}
                />
              </div>
            </div>
          </div>

          {/* Add Custom Item Modal / Inline Form */}
          {showAddItem && (
            <form onSubmit={handleAddNewItem} className="glass-card p-5 border-cyan-500/30 space-y-4 animate-fadeIn">
              <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-300">Add New Document Requirement</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Document title (e.g. University Invitation Letter)"
                  required
                  className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                />
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as ChecklistItemCategory)}
                  className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-cyan-400"
                >
                  <option value="Identification">Identification</option>
                  <option value="Financial">Financial</option>
                  <option value="Travel Logistics">Travel Logistics</option>
                  <option value="Health & Vaccines">Health & Vaccines</option>
                  <option value="Accommodation">Accommodation</option>
                  <option value="Employment / Academic">Employment / Academic</option>
                  <option value="Other">Other</option>
                </select>
                <select
                  value={newLevel}
                  onChange={(e) => setNewLevel(e.target.value as RequirementLevel)}
                  className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-cyan-400"
                >
                  <option value="required">Required (Mandatory)</option>
                  <option value="conditional">Conditional (Contingent)</option>
                  <option value="recommended">Recommended (Best Practice)</option>
                </select>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddItem(false)}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-cyan-500 text-navy-950 font-bold text-xs rounded-lg shadow-glow-cyan"
                >
                  Save to Checklist
                </button>
              </div>
            </form>
          )}

          {/* Checklist Items List */}
          <div className="space-y-3">
            {checklistItems.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-xl glass-card border-slate-800/80 hover:border-slate-700 transition-all space-y-2 bg-navy-950/70"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(item.id)}
                      className={`w-6 h-6 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                        item.status === 'Ready'
                          ? 'bg-emerald-500 border-emerald-400 text-navy-950 font-bold'
                          : item.status === 'In progress'
                          ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                          : item.status === 'Needs review'
                          ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                          : 'bg-navy-900 border-slate-700 text-transparent hover:border-slate-500'
                      }`}
                      title="Click to cycle status: Not started -> In progress -> Ready -> Needs review"
                    >
                      {item.status === 'Ready' && <Check className="w-4 h-4" />}
                      {item.status === 'In progress' && <Clock className="w-3.5 h-3.5" />}
                      {item.status === 'Needs review' && <HelpCircle className="w-3.5 h-3.5" />}
                    </button>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-white">{item.title}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono uppercase font-semibold ${
                          item.requirement_level === 'required'
                            ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                            : item.requirement_level === 'conditional'
                            ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                            : 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                        }`}>
                          {item.requirement_level}
                        </span>
                        <span className="text-[10px] text-slate-400 px-2 py-0.5 rounded bg-slate-900 border border-slate-800">
                          {item.category}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">{item.guidance}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                    <button
                      onClick={() => handleToggleStatus(item.id)}
                      className={`text-xs px-2.5 py-1 rounded-lg font-semibold border ${
                        item.status === 'Ready'
                          ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                          : item.status === 'In progress'
                          ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30'
                          : item.status === 'Needs review'
                          ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                          : 'bg-slate-900 text-slate-400 border-slate-800'
                      }`}
                    >
                      {item.status}
                    </button>
                    <button
                      onClick={() => {
                        setEditingNotesId(item.id);
                        setNotesInput(item.notes || '');
                      }}
                      className="p-1.5 text-slate-400 hover:text-cyan-300 rounded hover:bg-slate-800"
                      title="Add or edit notes"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteItem(item.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-400 rounded hover:bg-rose-500/10"
                      title="Remove from checklist"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Traveler Notes Section */}
                {editingNotesId === item.id ? (
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-800/60">
                    <input
                      type="text"
                      value={notesInput}
                      onChange={(e) => setNotesInput(e.target.value)}
                      placeholder="Add specific notes (e.g. Appointment scheduled for Oct 24)"
                      className="flex-1 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-cyan-400"
                    />
                    <button
                      onClick={() => handleSaveNotes(item.id)}
                      className="px-3 py-1.5 bg-cyan-500 text-navy-950 font-bold text-xs rounded-lg"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingNotesId(null)}
                      className="px-2 py-1 text-xs text-slate-400 hover:text-white"
                    >
                      Cancel
                    </button>
                  </div>
                ) : item.notes ? (
                  <div className="text-[11px] text-cyan-300/80 bg-slate-900/40 px-3 py-1.5 rounded-lg border border-slate-800/80 flex items-center justify-between">
                    <span>Notes: {item.notes}</span>
                    <button
                      onClick={() => {
                        setEditingNotesId(item.id);
                        setNotesInput(item.notes);
                      }}
                      className="text-[10px] text-slate-400 hover:text-white underline ml-2"
                    >
                      Edit
                    </button>
                  </div>
                ) : null}
              </div>
            ))}
          </div>

          {/* Consular Document Preparation Guidelines Box */}
          <div className="p-5 rounded-2xl bg-indigo-950/30 border border-indigo-500/30 text-xs text-slate-300 space-y-2">
            <div className="flex items-center gap-2 text-indigo-300 font-bold uppercase tracking-wider">
              <Info className="w-4 h-4 text-cyan-400" />
              <span>International Document Preparation Standards</span>
            </div>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-slate-400">
              <li>• <strong>6-Month Rule:</strong> Passports must remain unexpired at least 6 months after arrival date.</li>
              <li>• <strong>Blank Pages:</strong> Consulates require 2 consecutive clean blank stamp pages for entry endorsement.</li>
              <li>• <strong>Certified Translations:</strong> Non-English/non-local certificates must have apostille or certified translations.</li>
              <li>• <strong>Bank Stamps:</strong> Printed financial statements should carry a teller stamp or branch letterhead.</li>
            </ul>
          </div>
        </div>
      )}

      {/* TAB 2: BIOMETRIC MRZ SCANNER */}
      {activeTab === 'scanner' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="glass-card p-6 md:p-8 border-slate-800 space-y-6">
            {errorMsg && (
              <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start justify-between gap-3 animate-fadeIn">
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
                {selectedFile && (
                  <button
                    onClick={handleSubmitScan}
                    className="px-3 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-500/40 text-[11px] font-semibold flex items-center gap-1 shrink-0"
                  >
                    <RotateCcw className="w-3 h-3" /> Retry
                  </button>
                )}
              </div>
            )}

            <form onSubmit={handleSubmitScan} className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Target Document Classification
                  </label>
                  <select
                    value={documentType}
                    onChange={(e) => setDocumentType(e.target.value)}
                    className="px-4 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="Passport">Passport (Bio-Data Page)</option>
                    <option value="Visa">Consular Visa Sticker / eVisa PDF</option>
                    <option value="Boarding Pass">Boarding Pass / Flight Ticket</option>
                    <option value="Vaccination Record">Vaccination / Health Certificate</option>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={handleTestSample}
                  className="self-start sm:self-auto px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800/80 hover:bg-slate-700 text-cyan-300 border border-slate-700 flex items-center gap-1.5 transition-all"
                >
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" /> Use Test Sample Document
                </button>
              </div>

              {/* Drag & Drop Area */}
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                  selectedFile
                    ? 'border-emerald-500/40 bg-emerald-950/10'
                    : 'border-slate-700 hover:border-cyan-500/40 hover:bg-slate-900/40'
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*,application/pdf"
                  className="hidden"
                />

                {selectedFile ? (
                  <div className="space-y-4">
                    {previewUrl ? (
                      <img
                        src={previewUrl}
                        alt="Uploaded preview"
                        className="max-h-48 mx-auto rounded-xl border border-slate-700 shadow-md object-contain"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center mx-auto">
                        <FileText className="w-8 h-8" />
                      </div>
                    )}
                    <div>
                      <div className="text-sm font-bold text-white">{selectedFile.name}</div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        {(selectedFile.size / 1024).toFixed(1)} KB • Click to replace file
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="w-16 h-16 rounded-2xl bg-slate-800/80 text-cyan-400 flex items-center justify-center mx-auto">
                      <UploadCloud className="w-8 h-8" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white">
                        Drop your passport or visa photo here
                      </div>
                      <div className="text-xs text-slate-400 mt-1">
                        Supports high-resolution PNG, JPG, or PDF up to 10MB
                      </div>
                    </div>
                    <span className="inline-block text-xs font-semibold px-3 py-1 rounded-full bg-slate-800 text-slate-300">
                      Select File from Computer
                    </span>
                  </div>
                )}
              </div>

              {/* Explicit Data Privacy & Consent Toggle (Phase 5 Requirement) */}
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex items-start gap-3">
                <input
                  type="checkbox"
                  id="privacy-consent"
                  checked={userConsent}
                  onChange={(e) => setUserConsent(e.target.checked)}
                  className="w-4 h-4 rounded text-cyan-500 bg-slate-900 border-slate-700 mt-0.5 shrink-0"
                />
                <label htmlFor="privacy-consent" className="text-xs text-slate-300 leading-relaxed cursor-pointer">
                  <strong className="text-white flex items-center gap-1 mb-0.5">
                    <Lock className="w-3.5 h-3.5 text-emerald-400" /> Strict Data Privacy & Consent Authorization
                  </strong>
                  I explicitly consent to the automated extraction and inspection of this travel document for validity checks. VisaVoyage AI operates strict zero-retention logging: document contents and biometric zones are encrypted in transit and never exposed to other travelers.
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || !selectedFile || !userConsent}
                className="w-full py-4 px-6 rounded-xl font-extrabold text-sm bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 disabled:opacity-50 text-navy-950 shadow-glow-cyan flex items-center justify-center gap-2 transition-all transform active:scale-98"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin text-navy-950" />
                    <span>Multimodal Vision Inspecting Document...</span>
                  </>
                ) : (
                  <>
                    <FileCheck2 className="w-5 h-5 text-navy-950" />
                    <span>Verify Document & Calculate Readiness Score</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Analysis Result Output */}
          {analysisResult && selectedFile && (
            <div className="space-y-4 pt-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" /> Verification Complete
                </h2>
                <span className="text-xs text-emerald-400 font-mono">Persisted to PostgreSQL RLS</span>
              </div>

              <DocumentAnalysisCard analysis={analysisResult} fileName={selectedFile.name} />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

