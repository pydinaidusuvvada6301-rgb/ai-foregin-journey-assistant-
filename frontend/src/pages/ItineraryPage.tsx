import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { generateItinerary } from '../lib/api.js';
import { ItineraryResultCard } from '../components/ItineraryResultCard.js';
import { LocationDetectorButton } from '../components/LocationDetectorButton.js';
import { CountryDirectoryModal } from '../components/CountryDirectoryModal.js';
import type { ItineraryDetails, BudgetRange, TravelPurpose } from '../types/index.js';
import {
  Compass,
  Sparkles,
  Calendar,
  DollarSign,
  Briefcase,
  Globe,
  Sliders,
  Loader2,
  AlertCircle,
  MapPin,
  Check,
  RotateCcw
} from 'lucide-react';

const popularDestinations = [
  'Tokyo, Japan',
  'Paris, France',
  'Rome, Italy',
  'Singapore',
  'Bali, Indonesia',
  'Zurich, Switzerland',
  'London, United Kingdom',
  'Bangkok, Thailand'
];

export const ItineraryPage: React.FC = () => {
  const { user, recordViewedDestination } = useAuth();

  const [destination, setDestination] = useState('Tokyo, Japan');
  const [durationDays, setDurationDays] = useState(7);
  const [departureDate, setDepartureDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  });
  const [preferredCurrency, setPreferredCurrency] = useState('USD');
  const [travelPace, setTravelPace] = useState<'Relaxed' | 'Balanced' | 'Fast-Paced'>('Balanced');
  const [budgetRange, setBudgetRange] = useState<BudgetRange>('Moderate');
  const [travelPurpose, setTravelPurpose] = useState<TravelPurpose>('Tourism');
  const [originCountry, setOriginCountry] = useState(user?.homeCountry || 'United States');
  const [travelerPreferences, setTravelerPreferences] = useState('Focus on authentic dining, cultural walking districts, and reliable subway transit.');

  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [generatedResult, setGeneratedResult] = useState<ItineraryDetails | null>(null);
  const [isDirectoryOpen, setIsDirectoryOpen] = useState(false);

  const isSubmittingRef = useRef(false);

  const steps = [
    'Connecting to backend AI orchestration service...',
    'Evaluating immigration policies & regional logistics...',
    'Synthesizing day-by-day sequenced schedule...',
    'Structuring itemized cost breakdown & essential tips...'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading || isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    setErrorMsg(null);
    setLoading(true);
    setGeneratedResult(null);

    // Persist destination to user's recently viewed corridors
    if (destination) {
      recordViewedDestination(destination);
    }

    // Simulate progressive status steps
    let step = 0;
    const interval = setInterval(() => {
      step = (step + 1) % steps.length;
      setCurrentStep(step);
    }, 1200);

    try {
      const augmentedPreferences = `${travelerPreferences} | Target Departure: ${departureDate} | Preferred Currency: ${preferredCurrency} | Travel Pace: ${travelPace}`;
      const response = await generateItinerary({
        destination,
        durationDays: Number(durationDays),
        budgetRange,
        travelPurpose,
        originCountry,
        travelerPreferences: augmentedPreferences
      });

      clearInterval(interval);
      setGeneratedResult(response.data);
    } catch (err: any) {
      clearInterval(interval);
      console.error('Itinerary generation error:', err);
      const is429 = err?.response?.status === 429;
      const retrySec = err?.response?.data?.retryAfterSeconds;
      let rawErr =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        'Failed to generate itinerary. Please try again.';

      if (is429) {
        rawErr = retrySec
          ? `The AI service is experiencing high traffic. Please retry in ${retrySec} seconds.`
          : 'Rate limit reached. Please wait a few moments before trying again.';
      } else if (
        rawErr.includes('Failed to construct') ||
        rawErr.includes('Invalid URL') ||
        rawErr.includes('Network Error') ||
        rawErr.includes('ECONNREFUSED')
      ) {
        rawErr =
          'The itinerary intelligence engine is momentarily busy. Please try again or test sample itineraries via Demo Mode.';
      }

      setErrorMsg(rawErr);
    } finally {
      setLoading(false);
      isSubmittingRef.current = false;
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 space-y-10">
      {/* Page Title */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-xs font-semibold text-cyan-300">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          Powered by gemini-2.5-flash AI
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
          AI Foreign Journey Architect
        </h1>
        <p className="text-sm sm:text-base text-slate-400">
          Input your travel parameters to produce high-precision, Zod-validated itineraries with realistic itemized cost estimations and immigration advisories.
        </p>
      </div>

      {/* Input Parameters Form Card */}
      <div className="glass-card p-6 md:p-8 border-slate-800 space-y-6">
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

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Destination Selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between flex-wrap gap-1">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-cyan-400" /> Destination City & Country
              </label>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setIsDirectoryOpen(true)}
                  className="text-[11px] px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-purple-300 border border-slate-700 font-medium"
                >
                  Browse 250 Countries
                </button>
                <LocationDetectorButton
                  variant="compact"
                  label="Set to My Location"
                  onLocationDetected={(text) => setDestination(text)}
                />
              </div>
            </div>
            <input
              type="text"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="e.g. Kyoto, Japan or Florence, Italy"
              required
              className="w-full px-4 py-3 bg-slate-900/90 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all font-medium"
            />

            {/* Destination quick chips */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[11px] text-slate-400 mr-1">Popular:</span>
              {popularDestinations.map((dest) => (
                <button
                  type="button"
                  key={dest}
                  onClick={() => setDestination(dest)}
                  className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all ${
                    destination === dest
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 font-semibold'
                      : 'bg-navy-950/60 text-slate-400 border-slate-800 hover:text-slate-200'
                  }`}
                >
                  {dest}
                </button>
              ))}
            </div>
          </div>

          {/* Grid row: Duration, Budget, Purpose, Origin */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Duration */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-indigo-400" /> Duration</span>
                <span className="text-cyan-400 font-mono">{durationDays} Days</span>
              </label>
              <div className="flex items-center gap-3 bg-slate-900/80 p-2.5 rounded-xl border border-slate-700/80">
                <input
                  type="range"
                  min="1"
                  max="30"
                  value={durationDays}
                  onChange={(e) => setDurationDays(Number(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </div>
            </div>

            {/* Budget Range */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" /> Budget Tier
              </label>
              <select
                value={budgetRange}
                onChange={(e) => setBudgetRange(e.target.value as BudgetRange)}
                className="w-full px-3 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="Budget">Budget (Hostels / Street Food / Transit)</option>
                <option value="Moderate">Moderate (3-4★ Boutique / Bistros)</option>
                <option value="Luxury">Luxury (5★ Resorts / Fine Dining / VIP)</option>
              </select>
            </div>

            {/* Travel Purpose */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1">
                <Briefcase className="w-3.5 h-3.5 text-amber-400" /> Travel Purpose
              </label>
              <select
                value={travelPurpose}
                onChange={(e) => setTravelPurpose(e.target.value as TravelPurpose)}
                className="w-full px-3 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="Tourism">Tourism & Sightseeing</option>
                <option value="Digital Nomad">Digital Nomad / Remote Work</option>
                <option value="Business">Business & Conventions</option>
                <option value="Study">Study Abroad & Research</option>
                <option value="Permanent Relocation">Permanent Relocation</option>
              </select>
            </div>

            {/* Origin Passport */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1">
                  <Globe className="w-3.5 h-3.5 text-cyan-400" /> Passport Origin
                </label>
                <LocationDetectorButton
                  variant="compact"
                  label="Detect"
                  onLocationDetected={(_text, data) => {
                    if (data.country) {
                      setOriginCountry(data.country);
                    } else if (data.formattedOrigin) {
                      setOriginCountry(data.formattedOrigin);
                    }
                  }}
                />
              </div>
              <input
                type="text"
                value={originCountry}
                onChange={(e) => setOriginCountry(e.target.value)}
                placeholder="e.g. United States"
                className="w-full px-3 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-cyan-500 font-medium"
              />
            </div>
          </div>

          {/* Travel Dates, Currency & Travel Pace */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-cyan-400" /> Target Departure Date
              </label>
              <input
                type="date"
                value={departureDate}
                onChange={(e) => setDepartureDate(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" /> Display Currency
              </label>
              <select
                value={preferredCurrency}
                onChange={(e) => setPreferredCurrency(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="USD">USD ($) — US Dollar</option>
                <option value="EUR">EUR (€) — Euro</option>
                <option value="GBP">GBP (£) — British Pound</option>
                <option value="INR">INR (₹) — Indian Rupee</option>
                <option value="JPY">JPY (¥) — Japanese Yen</option>
                <option value="AUD">AUD ($) — Australian Dollar</option>
                <option value="CAD">CAD ($) — Canadian Dollar</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1">
                <Sliders className="w-3.5 h-3.5 text-purple-400" /> Preferred Travel Pace
              </label>
              <select
                value={travelPace}
                onChange={(e) => setTravelPace(e.target.value as 'Relaxed' | 'Balanced' | 'Fast-Paced')}
                className="w-full px-3 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="Relaxed">Relaxed (1-2 curated spots / day, leisure downtime)</option>
                <option value="Balanced">Balanced (3-4 highlights / day, steady pacing)</option>
                <option value="Fast-Paced">Fast-Paced (Maximum sightseeing, active transit)</option>
              </select>
            </div>
          </div>

          {/* Traveler Preferences & Notes */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1">
              <Sliders className="w-3.5 h-3.5 text-purple-400" /> Traveler Preferences & Special Requests
            </label>
            <textarea
              rows={2}
              value={travelerPreferences}
              onChange={(e) => setTravelerPreferences(e.target.value)}
              placeholder="e.g. Vegetarian foodie spots, art galleries, high-speed Wi-Fi cafes, walking-friendly..."
              className="w-full px-4 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 px-6 rounded-xl font-extrabold text-sm bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 disabled:opacity-50 text-white shadow-glow-cyan flex items-center justify-center gap-2 transition-all transform active:scale-98"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin text-white" />
                <span>Orchestrating AI Itinerary...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 text-cyan-200" />
                <span>Generate Phased Itinerary & Cost Model</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Loading Progress State */}
      {loading && (
        <div className="glass-card p-8 text-center space-y-4 animate-pulse">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-cyan-500/20 text-cyan-400 mb-2">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
          <h3 className="text-lg font-bold text-white">Synthesizing Travel Intelligence</h3>
          <p className="text-xs font-mono text-cyan-400">
            {steps[currentStep]}
          </p>
          <div className="w-full max-w-md mx-auto bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800">
            <div
              className="bg-gradient-to-r from-cyan-400 to-indigo-500 h-full transition-all duration-500"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Generated Result Output */}
      {generatedResult && (
        <div className="space-y-4 pt-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Check className="w-5 h-5 text-emerald-400" /> Advisory Itinerary Ready
            </h2>
            <span className="text-xs text-emerald-400 font-mono">Persisted to PostgreSQL RLS</span>
          </div>

          <ItineraryResultCard
            itinerary={generatedResult}
            destination={destination}
            durationDays={durationDays}
            budgetRange={budgetRange}
          />
        </div>
      )}

      {/* Country Directory Modal */}
      <CountryDirectoryModal
        isOpen={isDirectoryOpen}
        onClose={() => setIsDirectoryOpen(false)}
        initialMode="destination"
        onSelectCountry={(country) => {
          setDestination(country.name);
          if (country.currencies?.[0]?.code) {
            setPreferredCurrency(country.currencies[0].code);
          }
        }}
      />
    </div>
  );
};
