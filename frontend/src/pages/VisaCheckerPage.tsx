import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { checkVisaRequirements } from '../lib/api.js';
import { VisaCheckCard } from '../components/VisaCheckCard.js';
import type { VisaCheckResult, TravelPurpose } from '../types/index.js';
import {
  ShieldCheck,
  Globe,
  MapPin,
  Clock,
  Briefcase,
  Sparkles,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';

const commonPassports = ['United States', 'United Kingdom', 'Canada', 'Australia', 'Germany', 'France', 'India', 'Japan'];
const commonDestinations = ['Japan', 'France (Schengen)', 'Singapore', 'United Kingdom', 'Thailand', 'United Arab Emirates', 'Vietnam', 'Australia'];

export const VisaCheckerPage: React.FC = () => {
  const { user } = useAuth();

  const [passportCountry, setPassportCountry] = useState(user?.homeCountry || 'United States');
  const [destinationCountry, setDestinationCountry] = useState('Japan');
  const [currentResidency, setCurrentResidency] = useState(user?.homeCountry || 'United States');
  const [intendedStayDuration, setIntendedStayDuration] = useState('14 days (standard vacation)');
  const [travelPurpose, setTravelPurpose] = useState<TravelPurpose>('Tourism');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [result, setResult] = useState<VisaCheckResult | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);
    setResult(null);

    try {
      const response = await checkVisaRequirements({
        passportCountry,
        destinationCountry,
        currentResidency,
        intendedStayDuration,
        travelPurpose
      });

      setResult(response.data);
    } catch (err: any) {
      console.error('Visa policy check error:', err);
      let rawErr =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        'Failed to retrieve visa policy report. Please try again.';

      if (
        rawErr.includes('Failed to construct') ||
        rawErr.includes('Invalid URL') ||
        rawErr.includes('Network Error') ||
        rawErr.includes('ECONNREFUSED')
      ) {
        rawErr =
          'The global consular network is momentarily busy. Please try again in a few moments, or explore instant protocols using Demo Mode.';
      }

      setErrorMsg(rawErr);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 space-y-10">
      {/* Title Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-xs font-semibold text-indigo-300">
          <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
          Global Immigration Policy Engine
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
          Global Visa Policy & Entry Wizard
        </h1>
        <p className="text-sm sm:text-base text-slate-400">
          Cross-reference your origin passport against official international consular protocols, entry windows, financial sufficiency rules, and mandatory documents.
        </p>
      </div>

      {/* Interactive Parameters Card */}
      <div className="glass-card p-6 md:p-8 border-slate-800 space-y-6">
        {errorMsg && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Passport Origin */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-cyan-400" /> Passport Country of Citizenship
              </label>
              <input
                type="text"
                value={passportCountry}
                onChange={(e) => setPassportCountry(e.target.value)}
                placeholder="e.g. United States, Canada, India..."
                required
                className="w-full px-4 py-3 bg-slate-900/90 border border-slate-700/80 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-500 font-medium"
              />
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[11px] text-slate-400 mr-1">Origin:</span>
                {commonPassports.slice(0, 5).map((p) => (
                  <button
                    type="button"
                    key={p}
                    onClick={() => setPassportCountry(p)}
                    className={`text-[11px] px-2 py-0.5 rounded-lg border transition-all ${
                      passportCountry === p
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 font-semibold'
                        : 'bg-navy-950/60 text-slate-400 border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Destination Country */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-indigo-400" /> Destination Country / Territory
              </label>
              <input
                type="text"
                value={destinationCountry}
                onChange={(e) => setDestinationCountry(e.target.value)}
                placeholder="e.g. Japan, Schengen Area, Vietnam..."
                required
                className="w-full px-4 py-3 bg-slate-900/90 border border-slate-700/80 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500 font-medium"
              />
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[11px] text-slate-400 mr-1">Destination:</span>
                {commonDestinations.slice(0, 5).map((d) => (
                  <button
                    type="button"
                    key={d}
                    onClick={() => setDestinationCountry(d)}
                    className={`text-[11px] px-2 py-0.5 rounded-lg border transition-all ${
                      destinationCountry === d
                        ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40 font-semibold'
                        : 'bg-navy-950/60 text-slate-400 border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Additional Metadata */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                Current Residency
              </label>
              <input
                type="text"
                value={currentResidency}
                onChange={(e) => setCurrentResidency(e.target.value)}
                placeholder="e.g. United States"
                className="w-full px-3 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-cyan-400" /> Intended Duration
              </label>
              <input
                type="text"
                value={intendedStayDuration}
                onChange={(e) => setIntendedStayDuration(e.target.value)}
                placeholder="e.g. 14 days, 3 months"
                className="w-full px-3 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1">
                <Briefcase className="w-3.5 h-3.5 text-amber-400" /> Travel Purpose
              </label>
              <select
                value={travelPurpose}
                onChange={(e) => setTravelPurpose(e.target.value as TravelPurpose)}
                className="w-full px-3 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="Tourism">Tourism / Vacation</option>
                <option value="Business">Business Meeting / Conference</option>
                <option value="Digital Nomad">Digital Nomad / Remote Work</option>
                <option value="Study">Study Abroad</option>
                <option value="Permanent Relocation">Long-term / Relocation</option>
              </select>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 px-6 rounded-xl font-extrabold text-sm bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 disabled:opacity-50 text-white shadow-glow-indigo flex items-center justify-center gap-2 transition-all transform active:scale-98"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin text-white" />
                <span>Evaluating Official Visa Regimes...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-5 h-5 text-indigo-200" />
                <span>Assess Consular Rules & Visa Requirements</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Result Display */}
      {result && (
        <div className="space-y-4 pt-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-indigo-400" /> Official Policy Assessment
            </h2>
            <span className="text-xs text-indigo-400 font-mono">Persisted to PostgreSQL RLS</span>
          </div>

          <VisaCheckCard result={result} />
        </div>
      )}
    </div>
  );
};
