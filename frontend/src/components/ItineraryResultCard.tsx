import React, { useState } from 'react';
import type { ItineraryDetails } from '../types/index.js';
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
  Sparkles
} from 'lucide-react';

interface ItineraryResultCardProps {
  itinerary: ItineraryDetails;
  destination: string;
  durationDays: number;
  budgetRange: string;
}

export const ItineraryResultCard: React.FC<ItineraryResultCardProps> = ({
  itinerary,
  destination,
  durationDays,
  budgetRange
}) => {
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const summary = `
Trip to ${destination} (${durationDays} Days, ${budgetRange})
Overview: ${itinerary.destinationOverview}
Estimated Budget: ${itinerary.estimatedCostBreakdown.estimatedTotal || 'Custom range'}

Schedule:
${itinerary.dailySchedule.map(d => `Day ${d.day} (${d.theme || 'Exploration'}):
${d.activities.map(a => ` - ${a}`).join('\n')}`).join('\n\n')}

Tips:
${itinerary.essentialTips.map(t => `* ${t}`).join('\n')}
    `.trim();

    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(itinerary, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `${destination.replace(/\s+/g, '_')}_itinerary.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const currentDaySchedule = itinerary.dailySchedule.find(d => d.day === selectedDay) || itinerary.dailySchedule[0];

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

        {/* Quick action buttons */}
        <div className="flex items-center gap-2">
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
          {itinerary.destinationOverview}
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
              {itinerary.estimatedCostBreakdown.accommodation}
            </span>
          </div>

          <div className="bg-navy-950/70 p-4 rounded-xl border border-slate-800">
            <span className="text-xs text-slate-400 font-medium block mb-1">Transit & Meals</span>
            <span className="text-sm font-semibold text-white leading-snug block">
              {itinerary.estimatedCostBreakdown.foodAndTransport}
            </span>
          </div>

          <div className="bg-navy-950/70 p-4 rounded-xl border border-slate-800">
            <span className="text-xs text-slate-400 font-medium block mb-1">Activities & Culture</span>
            <span className="text-sm font-semibold text-white leading-snug block">
              {itinerary.estimatedCostBreakdown.activities}
            </span>
          </div>

          <div className="bg-emerald-950/30 p-4 rounded-xl border border-emerald-500/30">
            <span className="text-xs text-emerald-400 font-medium block mb-1">Total Trip Estimate</span>
            <span className="text-sm font-bold text-emerald-300 leading-snug block">
              {itinerary.estimatedCostBreakdown.estimatedTotal || 'Calculated dynamic rate'}
            </span>
          </div>
        </div>
      </div>

      {/* Interactive Day Schedule Section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <Calendar className="w-4 h-4 text-indigo-400" /> Phased Day-by-Day Route
          </h3>
          <span className="text-xs text-slate-400">
            Day {selectedDay} of {itinerary.dailySchedule.length}
          </span>
        </div>

        {/* Day selection tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none mb-4">
          {itinerary.dailySchedule.map((d) => (
            <button
              key={d.day}
              onClick={() => setSelectedDay(d.day)}
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

        {/* Active Day Detail Card */}
        {currentDaySchedule && (
          <div className="bg-navy-950/80 rounded-2xl p-5 md:p-6 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
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
            </div>

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
            {itinerary.essentialTips.map((tip, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-cyan-400 font-bold">•</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Local Customs & Contacts */}
        <div className="bg-slate-900/40 rounded-xl p-5 border border-slate-800/80 space-y-4">
          {itinerary.localCustoms && itinerary.localCustoms.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-2 mb-2">
                <AlertCircle className="w-4 h-4 text-amber-400" /> Cultural Etiquette & Customs
              </h4>
              <ul className="space-y-1.5 text-xs text-slate-300">
                {itinerary.localCustoms.map((custom, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-amber-400 font-bold">•</span>
                    <span>{custom}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {itinerary.emergencyContacts && itinerary.emergencyContacts.length > 0 && (
            <div className="pt-2 border-t border-slate-800/60">
              <h4 className="text-xs font-bold text-rose-300 uppercase tracking-wider flex items-center gap-2 mb-2">
                <PhoneCall className="w-4 h-4 text-rose-400" /> Emergency Hotlines
              </h4>
              <ul className="space-y-1 text-xs text-slate-400">
                {itinerary.emergencyContacts.map((contact, idx) => (
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
    </div>
  );
};
