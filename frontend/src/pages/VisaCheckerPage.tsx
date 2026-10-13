import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
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
  ArrowRight,
  RotateCcw
} from 'lucide-react';

const commonPassports = ['United States', 'United Kingdom', 'Canada', 'Australia', 'Germany', 'France', 'India', 'Japan'];
const commonDestinations = ['Japan', 'France (Schengen)', 'Singapore', 'United Kingdom', 'Thailand', 'United Arab Emirates', 'Vietnam', 'Australia'];

export const VisaCheckerPage: React.FC = () => {
  const { user, recordViewedDestination } = useAuth();
  const location = useLocation();

  const prefillOrigin = (location.state as any)?.origin;
  const prefillDest = (location.state as any)?.destination;

  const [wizardStep, setWizardStep] = useState<1 | 2 | 3>(1);
  const [passportCountry, setPassportCountry] = useState(prefillOrigin || user?.homeCountry || 'United States');
  const [destinationCountry, setDestinationCountry] = useState(prefillDest || 'Japan');
  const [currentResidency, setCurrentResidency] = useState(prefillOrigin || user?.homeCountry || 'United States');
  const [intendedStayDuration, setIntendedStayDuration] = useState('14 days (standard vacation)');
  const [travelPurpose, setTravelPurpose] = useState<TravelPurpose>('Tourism');
  const [intendedArrivalDate, setIntendedArrivalDate] = useState('');
  const [hasReturnTicket, setHasReturnTicket] = useState(true);
  const [hasTransitStop, setHasTransitStop] = useState(false);
  const [isFirstTimeVisit, setIsFirstTimeVisit] = useState(true);
  const [hasProofOfFunds, setHasProofOfFunds] = useState(true);

  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [result, setResult] = useState<VisaCheckResult | null>(null);

  const progressiveSteps = [
    'Connecting to sovereign consular database...',
    'Cross-referencing IATA Timatic aviation matrix...',
    'Evaluating bilateral exemption agreements & eVisa portals...',
    'Generating mandatory document checklist & health rules...'
  ];

  useEffect(() => {
    if (prefillOrigin) setPassportCountry(prefillOrigin);
    if (prefillDest) setDestinationCountry(prefillDest);
  }, [prefillOrigin, prefillDest]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg(null);
    setLoading(true);
    setLoadingStep(0);
    setResult(null);

    // Track recently viewed destination for personalized traveler dashboard
    if (destinationCountry && recordViewedDestination) {
      recordViewedDestination(destinationCountry);
    }

    let step = 0;
    const interval = setInterval(() => {
      step = (step + 1) % progressiveSteps.length;
      setLoadingStep(step);
    }, 1100);

    try {
      const response = await checkVisaRequirements({
        passportCountry,
        destinationCountry,
        currentResidency,
        intendedStayDuration,
        travelPurpose
      });

      clearInterval(interval);
      setResult(response.data);
    } catch (err: any) {
      clearInterval(interval);
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
      clearInterval(interval);
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 space-y-10">
      {/* Title Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-xs font-semibold text-indigo-300">
          <ShieldCheck className="w-4 h-4 text-indigo-400" />
          <span>Official Sovereign Consular Matrix</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
          Global Visa Policy & Entry Wizard
        </h1>
        <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
          Cross-reference your origin passport against official international consular protocols, permitted entry durations, financial proof guidelines, and mandatory border documents.
        </p>
      </div>

      {/* Interactive Parameters Card */}
      <div className="glass-card p-6 md:p-8 border-slate-800 space-y-6">
        {/* Error State Banner with Retry */}
        {errorMsg && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start justify-between gap-3 animate-fadeIn">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
            <button
              onClick={handleSubmit}
              className="px-3 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-500/40 text-[11px] font-semibold flex items-center gap-1 shrink-0"
            >
              <RotateCcw className="w-3 h-3" /> Retry
            </button>
          </div>
        )}

        {/* Progressive Loading State Scanner */}
        {loading && (
          <div className="p-5 rounded-2xl bg-indigo-950/40 border border-indigo-500/40 space-y-3 animate-fadeIn shadow-glow-indigo">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-white flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                <span>{progressiveSteps[loadingStep]}</span>
              </span>
              <span className="font-mono text-cyan-400 text-[11px]">Phase {loadingStep + 1} of 4</span>
            </div>
            <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-cyan-500 to-indigo-500 h-1.5 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${((loadingStep + 1) / progressiveSteps.length) * 100}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Verifying against official foreign ministry protocols & IATA Timatic standard.
            </p>
          </div>
        )}

        {/* Wizard Multi-Step Progress Tracker */}
        <div className="grid grid-cols-3 gap-2 pb-2">
          {[
            { step: 1, label: '1. Corridor & Passports' },
            { step: 2, label: '2. Purpose & Timeline' },
            { step: 3, label: '3. Eligibility Verification' }
          ].map((s) => (
            <button
              key={s.step}
              type="button"
              onClick={() => setWizardStep(s.step as 1 | 2 | 3)}
              className={`p-3 rounded-xl text-left border transition-all ${
                wizardStep === s.step
                  ? 'bg-cyan-500/15 border-cyan-500/50 text-cyan-300 font-bold shadow-glow-cyan/20'
                  : wizardStep > s.step
                  ? 'bg-navy-950/70 border-emerald-500/30 text-emerald-300 font-semibold'
                  : 'bg-navy-950/40 border-slate-800 text-slate-400'
              }`}
            >
              <div className="text-[10px] uppercase font-mono tracking-wider">Step {s.step}</div>
              <div className="text-xs sm:text-sm font-semibold truncate">{s.label.split('. ')[1]}</div>
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* STEP 1: Corridor & Passports */}
          {wizardStep === 1 && (
            <div className="space-y-6 animate-fadeIn">
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

              <div className="space-y-1.5 max-w-md">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Current Country of Legal Residency
                </label>
                <input
                  type="text"
                  value={currentResidency}
                  onChange={(e) => setCurrentResidency(e.target.value)}
                  placeholder="e.g. United States or United Kingdom"
                  className="w-full px-3.5 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setWizardStep(2)}
                  className="px-6 py-3 bg-cyan-500 hover:bg-cyan-400 text-navy-950 font-bold text-xs rounded-xl flex items-center gap-2 shadow-glow-cyan transition-all"
                >
                  <span>Continue to Purpose & Dates</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Purpose & Timeline */}
          {wizardStep === 2 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1">
                    <Briefcase className="w-3.5 h-3.5 text-amber-400" /> Travel Purpose
                  </label>
                  <select
                    value={travelPurpose}
                    onChange={(e) => setTravelPurpose(e.target.value as TravelPurpose)}
                    className="w-full px-3 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Tourism">Tourism / Vacation</option>
                    <option value="Business">Business Meeting / Conference</option>
                    <option value="Digital Nomad">Digital Nomad / Remote Work</option>
                    <option value="Study">Study Abroad</option>
                    <option value="Permanent Relocation">Long-term / Relocation</option>
                  </select>
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
                    className="w-full px-3 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Intended Arrival Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={intendedArrivalDate}
                    onChange={(e) => setIntendedArrivalDate(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setWizardStep(1)}
                  className="px-4 py-2.5 bg-slate-800 text-slate-300 hover:text-white text-xs rounded-xl"
                >
                  ← Back to Corridor
                </button>
                <button
                  type="button"
                  onClick={() => setWizardStep(3)}
                  className="px-6 py-3 bg-cyan-500 hover:bg-cyan-400 text-navy-950 font-bold text-xs rounded-xl flex items-center gap-2 shadow-glow-cyan transition-all"
                >
                  <span>Continue to Eligibility Checkpoints</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Eligibility & Profile Factors */}
          {wizardStep === 3 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-navy-950/70 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">Confirmed Return / Onward Ticket</span>
                    <input
                      type="checkbox"
                      checked={hasReturnTicket}
                      onChange={(e) => setHasReturnTicket(e.target.checked)}
                      className="w-4 h-4 rounded text-cyan-500 bg-slate-900 border-slate-700"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400">Essential for visa-exempt entry and airline check-in boarding clearance.</p>
                </div>

                <div className="p-4 rounded-xl bg-navy-950/70 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">Sufficient Proof of Funds</span>
                    <input
                      type="checkbox"
                      checked={hasProofOfFunds}
                      onChange={(e) => setHasProofOfFunds(e.target.checked)}
                      className="w-4 h-4 rounded text-cyan-500 bg-slate-900 border-slate-700"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400">Bank statements or active credit cards meeting host nation daily quotas.</p>
                </div>

                <div className="p-4 rounded-xl bg-navy-950/70 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">First Time Visiting Destination</span>
                    <input
                      type="checkbox"
                      checked={isFirstTimeVisit}
                      onChange={(e) => setIsFirstTimeVisit(e.target.checked)}
                      className="w-4 h-4 rounded text-cyan-500 bg-slate-900 border-slate-700"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400">First-time visitors may require biometrics and digital arrival cards.</p>
                </div>

                <div className="p-4 rounded-xl bg-navy-950/70 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">Connecting Layover / Transit Stop</span>
                    <input
                      type="checkbox"
                      checked={hasTransitStop}
                      onChange={(e) => setHasTransitStop(e.target.checked)}
                      className="w-4 h-4 rounded text-cyan-500 bg-slate-900 border-slate-700"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400">Cross-references potential TWOV (Transit Without Visa) regulations.</p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setWizardStep(2)}
                  className="px-4 py-2.5 bg-slate-800 text-slate-300 hover:text-white text-xs rounded-xl"
                >
                  ← Back to Dates
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="py-3 px-6 rounded-xl font-extrabold text-xs bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 disabled:opacity-50 text-white shadow-glow-indigo flex items-center gap-2 transition-all transform active:scale-98"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Evaluating Official Consular Regimes...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4 text-indigo-200" />
                      <span>Assess Consular Rules & Visa Requirements</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
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
