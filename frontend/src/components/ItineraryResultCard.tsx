import React, { useState } from 'react';
import type { ItineraryDetails, DaySchedule, EmergencyCardResult, PackingChecklistResult } from '../types/index.js';
import {
  Calendar,
  DollarSign,
  Info,
  CheckCircle,
  Copy,
  Download,
  AlertCircle,
  Compass,
  PhoneCall,
  Clock,
  Sparkles,
  ShieldAlert,
  Luggage,
  Wand2,
  Check,
  RefreshCw,
  X
} from 'lucide-react';
import { customizeItineraryDay, generateEmergencyCard, generatePackingChecklist } from '../lib/api.js';

interface ItineraryResultCardProps {
  itinerary: ItineraryDetails;
  destination: string;
  durationDays: number;
  budgetRange: string;
}

export const ItineraryResultCard: React.FC<ItineraryResultCardProps> = ({
  itinerary: initialItinerary,
  destination,
  durationDays,
  budgetRange
}) => {
  const [dailySchedule, setDailySchedule] = useState<DaySchedule[]>(initialItinerary.dailySchedule);
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [copied, setCopied] = useState(false);

  // Deep Gemini: Day Customizer State
  const [showCustomizer, setShowCustomizer] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [customizationNote, setCustomizationNote] = useState<string | null>(null);

  // Deep Gemini: Emergency Safety Card State
  const [showEmergencyCard, setShowEmergencyCard] = useState(false);
  const [emergencyData, setEmergencyData] = useState<EmergencyCardResult | null>(null);
  const [isLoadingEmergency, setIsLoadingEmergency] = useState(false);

  // Deep Gemini: Packing Checklist State
  const [showPackingModal, setShowPackingModal] = useState(false);
  const [packingData, setPackingData] = useState<PackingChecklistResult | null>(null);
  const [isLoadingPacking, setIsLoadingPacking] = useState(false);
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

  const handleCopy = () => {
    const summary = `
Trip to ${destination} (${durationDays} Days, ${budgetRange})
Overview: ${initialItinerary.destinationOverview}
Estimated Budget: ${initialItinerary.estimatedCostBreakdown.estimatedTotal || 'Custom range'}

Schedule:
${dailySchedule.map(d => `Day ${d.day} (${d.theme || 'Exploration'}):
${d.activities.map(a => ` - ${a}`).join('\n')}`).join('\n\n')}

Tips:
${initialItinerary.essentialTips.map(t => `* ${t}`).join('\n')}
    `.trim();

    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({
      ...initialItinerary,
      dailySchedule
    }, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `${destination.replace(/\s+/g, '_')}_itinerary.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const currentDaySchedule = dailySchedule.find(d => d.day === selectedDay) || dailySchedule[0];

  const handleCustomizeCurrentDay = async (instruction: string) => {
    if (!instruction.trim() || isCustomizing) return;
    setIsCustomizing(true);
    try {
      const res = await customizeItineraryDay({
        destination,
        dayNumber: selectedDay,
        currentTheme: currentDaySchedule.theme,
        currentActivities: currentDaySchedule.activities,
        customizationInstruction: instruction,
        budgetRange
      });

      if (res?.data) {
        setDailySchedule(prev => prev.map(d => {
          if (d.day === selectedDay) {
            return {
              ...d,
              theme: res.data.theme,
              activities: res.data.activities
            };
          }
          return d;
        }));
        setCustomizationNote(res.data.customizationNotes || `Updated Day ${selectedDay}`);
        setShowCustomizer(false);
        setCustomPrompt('');
        setTimeout(() => setCustomizationNote(null), 5000);
      }
    } catch (err) {
      console.error('Failed to customize day:', err);
    } finally {
      setIsCustomizing(false);
    }
  };

  const handleFetchEmergencyCard = async () => {
    setShowEmergencyCard(true);
    if (emergencyData) return;
    setIsLoadingEmergency(true);
    try {
      const res = await generateEmergencyCard({ destination });
      if (res?.data) {
        setEmergencyData(res.data);
      }
    } catch (err) {
      console.error('Failed to generate emergency card:', err);
    } finally {
      setIsLoadingEmergency(false);
    }
  };

  const handleFetchPackingChecklist = async () => {
    setShowPackingModal(true);
    if (packingData) return;
    setIsLoadingPacking(true);
    try {
      const res = await generatePackingChecklist({
        destination,
        durationDays,
        travelPurpose: 'Tourism'
      });
      if (res?.data) {
        setPackingData(res.data);
      }
    } catch (err) {
      console.error('Failed to generate packing checklist:', err);
    } finally {
      setIsLoadingPacking(false);
    }
  };

  const togglePackingItem = (itemName: string) => {
    setCheckedItems(prev => ({ ...prev, [itemName]: !prev[itemName] }));
  };


  return (
    <div className="glass-card p-6 md:p-8 space-y-8 animate-fadeIn border-cyan-500/30 shadow-glow-cyan">
      {/* Header bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="glass-pill text-cyan-400 border-cyan-500/30 flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> AI Tailored Plan
            </span>
            <span className="glass-pill text-indigo-400 border-indigo-500/30">
              {budgetRange} Tier
            </span>
            <span className="glass-pill text-slate-300">
              {durationDays} Days
            </span>
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            {destination} Itinerary
          </h2>
        </div>

        {/* Quick action buttons & Deep Gemini Tools */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleFetchEmergencyCard}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 transition-all shadow-sm"
            title="Generate local emergency phrases & consular warnings"
          >
            <ShieldAlert className="w-4 h-4 text-rose-400" />
            Safety & Emergency Card
          </button>

          <button
            onClick={handleFetchPackingChecklist}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 transition-all shadow-sm"
            title="Generate smart destination packing checklist"
          >
            <Luggage className="w-4 h-4 text-indigo-400" />
            Smart Packing List
          </button>

          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all"
            title="Copy plain text summary"
          >
            {copied ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
            {copied ? 'Copied!' : 'Copy Summary'}
          </button>

          <button
            onClick={handleDownloadJSON}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 transition-all"
            title="Download structured JSON"
          >
            <Download className="w-4 h-4 text-cyan-400" />
            Download JSON
          </button>
        </div>
      </div>

      {/* Destination Overview */}
      <div className="bg-slate-900/40 rounded-xl p-5 border border-slate-800/60 leading-relaxed">
        <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-2">
          <Compass className="w-4 h-4 text-cyan-400" /> Destination Intelligence
        </h3>
        <p className="text-slate-300 text-sm md:text-base leading-relaxed">
          {initialItinerary.destinationOverview}
        </p>
      </div>

      {/* Estimated Cost Breakdown Cards */}
      <div>
        <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-emerald-400" /> Budget Breakdown ({budgetRange} Class)
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          <div className="bg-navy-950/70 p-4 rounded-xl border border-slate-800">
            <span className="text-xs text-slate-400 font-medium block mb-1">Accommodation</span>
            <span className="text-sm font-semibold text-white leading-snug block">
              {initialItinerary.estimatedCostBreakdown.accommodation}
            </span>
          </div>

          <div className="bg-navy-950/70 p-4 rounded-xl border border-slate-800">
            <span className="text-xs text-slate-400 font-medium block mb-1">Transit & Meals</span>
            <span className="text-sm font-semibold text-white leading-snug block">
              {initialItinerary.estimatedCostBreakdown.foodAndTransport}
            </span>
          </div>

          <div className="bg-navy-950/70 p-4 rounded-xl border border-slate-800">
            <span className="text-xs text-slate-400 font-medium block mb-1">Activities & Culture</span>
            <span className="text-sm font-semibold text-white leading-snug block">
              {initialItinerary.estimatedCostBreakdown.activities}
            </span>
          </div>

          <div className="bg-emerald-950/30 p-4 rounded-xl border border-emerald-500/30">
            <span className="text-xs text-emerald-400 font-medium block mb-1">Total Trip Estimate</span>
            <span className="text-sm font-bold text-emerald-300 leading-snug block">
              {initialItinerary.estimatedCostBreakdown.estimatedTotal || 'Calculated dynamic rate'}
            </span>
          </div>
        </div>
      </div>

      {/* Interactive Day Schedule Section with Gemini Customizer */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <Calendar className="w-4 h-4 text-indigo-400" /> Phased Day-by-Day Route
          </h3>
          <span className="text-xs text-slate-400">
            Day {selectedDay} of {dailySchedule.length}
          </span>
        </div>

        {/* Day selection tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none mb-4">
          {dailySchedule.map((d) => (
            <button
              key={d.day}
              onClick={() => {
                setSelectedDay(d.day);
                setShowCustomizer(false);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedDay === d.day
                  ? 'bg-cyan-500 text-navy-950 shadow-glow-cyan font-bold scale-105'
                  : 'bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              Day {d.day}
            </button>
          ))}
        </div>

        {/* Customization Success Toast */}
        {customizationNote && (
          <div className="mb-4 p-3.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs flex items-center gap-2 animate-fadeIn">
            <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>{customizationNote}</span>
          </div>
        )}

        {/* Active Day Detail Card */}
        {currentDaySchedule && (
          <div className="bg-navy-950/80 rounded-2xl p-5 md:p-6 border border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 font-bold text-sm flex items-center justify-center border border-indigo-500/30">
                  {currentDaySchedule.day}
                </span>
                <div>
                  <h4 className="text-base font-bold text-white">
                    {currentDaySchedule.theme || `Day ${currentDaySchedule.day} Itinerary`}
                  </h4>
                  <p className="text-xs text-slate-400">Curated sequence & timeline</p>
                </div>
              </div>

              {/* Customize Day Button */}
              <button
                onClick={() => setShowCustomizer(!showCustomizer)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 transition-all self-start sm:self-auto"
              >
                <Wand2 className="w-3.5 h-3.5 text-cyan-400" />
                <span>{showCustomizer ? 'Close Customizer' : 'Customize Day with Gemini'}</span>
              </button>
            </div>

            {/* Inline Deep Gemini Customizer Form */}
            {showCustomizer && (
              <div className="p-4 rounded-xl bg-slate-900 border border-cyan-500/30 space-y-3 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" /> Ask Gemini to reshape Day {selectedDay}:
                  </span>
                  <span className="text-[10px] text-cyan-400 font-mono">Gemini 3.8 Flash</span>
                </div>

                {/* Quick Presets */}
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { label: '🌧️ Rain / Indoor friendly', text: 'Replace outdoor walks with top museums, covered arcades, and indoor cultural activities' },
                    { label: '👶 Family & Kids', text: 'Tailor activities for family with young children with relaxed pacing' },
                    { label: '💰 Ultra-Budget', text: 'Switch to free walking spots, public parks, and budget street-food markets' },
                    { label: '🍷 Foodie & Nightlife', text: 'Focus heavily on renowned local food stalls, hidden speakeasies, and vibrant evening districts' }
                  ].map((preset, i) => (
                    <button
                      key={i}
                      disabled={isCustomizing}
                      onClick={() => handleCustomizeCurrentDay(preset.text)}
                      className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-cyan-500/20 text-slate-300 hover:text-cyan-300 border border-slate-700/80 transition-colors"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleCustomizeCurrentDay(customPrompt);
                    }}
                    placeholder="e.g. Focus on historic temples and vegan dining..."
                    disabled={isCustomizing}
                    className="flex-1 px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                  <button
                    onClick={() => handleCustomizeCurrentDay(customPrompt)}
                    disabled={!customPrompt.trim() || isCustomizing}
                    className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-navy-950 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all disabled:opacity-40"
                  >
                    {isCustomizing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />}
                    <span>{isCustomizing ? 'Adapting...' : 'Apply'}</span>
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-3 pt-2">
              {currentDaySchedule.activities.map((activity, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-slate-900/50 border border-slate-800/60">
                  <Clock className="w-4 h-4 text-cyan-400 mt-0.5 shrink-0" />
                  <p className="text-sm text-slate-200 leading-relaxed">
                    {activity}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Advisory Tips, Customs & Emergency Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
        {/* Essential Tips */}
        <div className="bg-slate-900/40 rounded-xl p-5 border border-slate-800/80 space-y-3">
          <h4 className="text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-2">
            <Info className="w-4 h-4 text-cyan-400" /> Essential Travel Intelligence
          </h4>
          <ul className="space-y-2 text-xs text-slate-300">
            {initialItinerary.essentialTips.map((tip, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-cyan-400 font-bold">•</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Local Customs & Contacts */}
        <div className="bg-slate-900/40 rounded-xl p-5 border border-slate-800/80 space-y-4">
          {initialItinerary.localCustoms && initialItinerary.localCustoms.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-2 mb-2">
                <AlertCircle className="w-4 h-4 text-amber-400" /> Cultural Etiquette & Customs
              </h4>
              <ul className="space-y-1.5 text-xs text-slate-300">
                {initialItinerary.localCustoms.map((custom, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-amber-400 font-bold">•</span>
                    <span>{custom}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {initialItinerary.emergencyContacts && initialItinerary.emergencyContacts.length > 0 && (
            <div className="pt-2 border-t border-slate-800/60">
              <h4 className="text-xs font-bold text-rose-300 uppercase tracking-wider flex items-center gap-2 mb-2">
                <PhoneCall className="w-4 h-4 text-rose-400" /> Emergency Hotlines
              </h4>
              <ul className="space-y-1 text-xs text-slate-400">
                {initialItinerary.emergencyContacts.map((contact, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <span className="text-rose-400">🚨</span>
                    <span>{contact}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Emergency Safety Card Modal */}
      {showEmergencyCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-2xl bg-navy-900 border border-rose-500/40 rounded-2xl p-6 md:p-8 space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Emergency Safety & Consular Card</h3>
                  <p className="text-xs text-slate-400">Destination: {destination}</p>
                </div>
              </div>
              <button
                onClick={() => setShowEmergencyCard(false)}
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {isLoadingEmergency ? (
              <div className="py-12 flex flex-col items-center justify-center gap-3">
                <RefreshCw className="w-8 h-8 text-rose-400 animate-spin" />
                <p className="text-sm text-slate-300">Gemini is compiling life-saving emergency intelligence...</p>
              </div>
            ) : emergencyData ? (
              <div className="space-y-6 text-xs md:text-sm">
                {/* Emergency Hotlines */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-center">
                    <span className="text-[11px] text-slate-400 block">Police</span>
                    <strong className="text-rose-400 text-base">{emergencyData.emergencyNumbers.police}</strong>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-center">
                    <span className="text-[11px] text-slate-400 block">Ambulance</span>
                    <strong className="text-emerald-400 text-base">{emergencyData.emergencyNumbers.ambulance}</strong>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-center">
                    <span className="text-[11px] text-slate-400 block">Tourist Help</span>
                    <strong className="text-cyan-400 text-base">{emergencyData.emergencyNumbers.touristHelp}</strong>
                  </div>
                </div>

                {/* Local Emergency Phrases */}
                <div>
                  <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-3">
                    Life-Saving Translated Phrases ({emergencyData.localLanguage}):
                  </h4>
                  <div className="space-y-2.5">
                    {emergencyData.emergencyPhrases.map((phrase, i) => (
                      <div key={i} className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                        <div className="text-slate-300 font-medium mb-1">{phrase.english}</div>
                        <div className="text-rose-300 font-bold text-sm">{phrase.localTranslation}</div>
                        <div className="text-[11px] text-slate-400 italic">Pronunciation: {phrase.phoneticPronunciation}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Scams to avoid */}
                <div>
                  <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider mb-2">
                    Known Tourist Scams & Red Flags:
                  </h4>
                  <ul className="space-y-1.5 text-slate-300 text-xs">
                    {emergencyData.criticalScamsAndWarnings.map((scam, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-amber-400 font-bold">⚠️</span>
                        <span>{scam}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Consular guidance */}
                <div className="p-4 rounded-xl bg-navy-950 border border-slate-800 text-xs text-slate-300">
                  <strong className="text-white block mb-1">Consular Advice:</strong>
                  {emergencyData.consularAdvice}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Smart Packing Checklist Modal */}
      {showPackingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-2xl bg-navy-900 border border-indigo-500/40 rounded-2xl p-6 md:p-8 space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                  <Luggage className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Smart Destination Packing Checklist</h3>
                  <p className="text-xs text-slate-400">Customized for {durationDays} days in {destination}</p>
                </div>
              </div>
              <button
                onClick={() => setShowPackingModal(false)}
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {isLoadingPacking ? (
              <div className="py-12 flex flex-col items-center justify-center gap-3">
                <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin" />
                <p className="text-sm text-slate-300">Gemini is analyzing destination weather, socket standards, and customs regulations...</p>
              </div>
            ) : packingData ? (
              <div className="space-y-6">
                <div className="p-3.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs">
                  💡 {packingData.seasonAdvice}
                </div>

                <div className="space-y-5">
                  {packingData.categories.map((cat, i) => (
                    <div key={i} className="space-y-2.5">
                      <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                        {cat.name}
                      </h4>
                      <div className="space-y-2">
                        {cat.items.map((item, j) => {
                          const isDone = Boolean(checkedItems[item.item]);
                          return (
                            <div
                              key={j}
                              onClick={() => togglePackingItem(item.item)}
                              className={`p-3 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                                isDone
                                  ? 'bg-slate-900/40 border-slate-800/40 text-slate-500 line-through'
                                  : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 text-slate-200'
                              }`}
                            >
                              <div className={`w-4 h-4 rounded mt-0.5 flex items-center justify-center border transition-all ${
                                isDone ? 'bg-cyan-500 border-cyan-500 text-navy-950' : 'border-slate-600'
                              }`}>
                                {isDone && <Check className="w-3 h-3 font-bold" />}
                              </div>
                              <div className="flex-1 text-xs">
                                <div className="font-semibold">{item.item}</div>
                                <div className="text-[11px] text-slate-400">{item.reason}</div>
                              </div>
                              {item.isEssential && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-300 border border-rose-500/20 uppercase font-mono">
                                  Essential
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};

