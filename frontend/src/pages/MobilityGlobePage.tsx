import React, { useState, useMemo } from 'react';
import { InteractiveEarthGlobe3D } from '../components/InteractiveEarthGlobe3D.js';
import { CountryDirectoryModal } from '../components/CountryDirectoryModal.js';
import { CurrencyConverterCard } from '../components/CurrencyConverterCard.js';
import { GeminiCopilotDrawer } from '../components/GeminiCopilotDrawer.js';
import {
  CountryDirectoryItem,
  COUNTRIES,
  getCountryByCode,
  getCountryByName
} from '../lib/country-directory.js';
import {
  calculateGreatCircleDistance
} from '../lib/mobility-data.js';
import {
  Globe,
  Compass,
  Plane,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  ExternalLink,
  MapPin,
  Clock,
  Layers,
  HelpCircle,
  Search,
  MessageSquare,
  Coins,
  CheckCircle2,
  Calendar,
  Briefcase,
  FileText,
  DollarSign,
  ArrowRightLeft,
  ChevronRight,
  Info
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface PresetCorridor {
  originCode: string;
  destCode: string;
  label: string;
  category: string;
}

const PRESET_CORRIDORS: PresetCorridor[] = [
  { originCode: 'US', destCode: 'AU', label: 'USA ➔ Australia', category: 'Study & Work Core' },
  { originCode: 'US', destCode: 'JP', label: 'USA ➔ Japan', category: 'Transpacific' },
  { originCode: 'GB', destCode: 'SG', label: 'UK ➔ Singapore', category: 'Euro-Asian Hub' },
  { originCode: 'AE', destCode: 'AU', label: 'Dubai ➔ Sydney', category: 'Trans-Oceanic' },
  { originCode: 'IN', destCode: 'CA', label: 'India ➔ Canada', category: 'Global Migration' },
  { originCode: 'DE', destCode: 'JP', label: 'Germany ➔ Japan', category: 'Eurasia Corridor' },
  { originCode: 'FR', destCode: 'US', label: 'France ➔ USA', category: 'Transatlantic' }
];

export const MobilityGlobePage: React.FC = () => {
  // Synchronized selected countries state (Defaults: Origin = US, Destination = Australia)
  const [originCountry, setOriginCountry] = useState<CountryDirectoryItem>(() => {
    return getCountryByCode('US') || COUNTRIES[0];
  });
  const [destCountry, setDestCountry] = useState<CountryDirectoryItem>(() => {
    return getCountryByCode('AU') || COUNTRIES[10];
  });

  // Country Directory Modal state
  const [isDirectoryOpen, setIsDirectoryOpen] = useState(false);
  const [directoryMode, setDirectoryMode] = useState<'destination' | 'origin'>('destination');

  // Gemini Copilot Drawer state
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [copilotInitialQuery, setCopilotInitialQuery] = useState<string | undefined>(undefined);

  // Personalized Travel & Visa Planner State (Requirement 6)
  const [travelPurpose, setTravelPurpose] = useState<string>('Study');
  const [departureDate, setDepartureDate] = useState<string>(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 2);
    return d.toISOString().split('T')[0];
  });
  const [stayDuration, setStayDuration] = useState<string>('1 Year (Academic Program)');
  const [visaCategory, setVisaCategory] = useState<string>('Student Visa (Subclass 500)');
  const [budgetEst, setBudgetEst] = useState<string>('15,000');
  const [plannerGenerated, setPlannerGenerated] = useState(false);
  const [checklistChecks, setChecklistChecks] = useState<Record<string, boolean>>({});

  // Telemetry computation
  const telemetry = useMemo(() => {
    const distanceKm = calculateGreatCircleDistance(
      originCountry.lat,
      originCountry.lon,
      destCountry.lat,
      destCountry.lon
    );
    const distanceNm = Math.round(distanceKm * 0.539957);
    const flightHours = parseFloat((distanceKm / 850 + 0.5).toFixed(1));

    return {
      distanceKm,
      distanceNm,
      flightHours
    };
  }, [originCountry, destCountry]);

  // Handle Preset Corridor selection
  const handleSelectPreset = (preset: PresetCorridor) => {
    const origin = getCountryByCode(preset.originCode);
    const dest = getCountryByCode(preset.destCode);
    if (origin) setOriginCountry(origin);
    if (dest) setDestCountry(dest);
  };

  // Open directory modal for specific role
  const openDirectory = (mode: 'destination' | 'origin') => {
    setDirectoryMode(mode);
    setIsDirectoryOpen(true);
  };

  // Swap Origin and Destination
  const handleSwapCorridor = () => {
    const prevOrigin = originCountry;
    const prevDest = destCountry;
    setOriginCountry(prevDest);
    setDestCountry(prevOrigin);
  };

  // Generate Personalized Visa & Travel Plan
  const handleGeneratePlan = (e: React.FormEvent) => {
    e.preventDefault();
    setPlannerGenerated(true);
  };

  // Ask Copilot directly with country context
  const handleAskCopilot = (question?: string) => {
    setCopilotInitialQuery(question);
    setIsCopilotOpen(true);
  };

  // Dynamic tailored document checklist based on country & purpose
  const documentChecklistItems = useMemo(() => {
    const isDestAustralia = destCountry.cca2 === 'AU';
    const isStudy = travelPurpose.toLowerCase().includes('study');

    if (isDestAustralia && isStudy) {
      return [
        { id: 'coe', label: 'Electronic Confirmation of Enrolment (CoE) from CRICOS registered provider', essential: true },
        { id: 'passport', label: `Valid ${originCountry.name} passport with 6+ months validity`, essential: true },
        { id: 'oshc', label: 'Overseas Student Health Cover (OSHC) policy active for full study term', essential: true },
        { id: 'finance', label: 'Proof of Financial Capacity (min AUD $29,710/yr living costs + tuition)', essential: true },
        { id: 'gs', label: 'Genuine Student (GS) statement detailing academic & career goals', essential: true },
        { id: 'english', label: 'English proficiency test (IELTS 6.0+, PTE 50+, or exempt passport)', essential: true },
        { id: 'medical', label: 'Panel physician health examination & chest X-ray clearance', essential: false }
      ];
    }

    if (isStudy) {
      return [
        { id: 'acceptance', label: `Official Acceptance Letter from accredited institution in ${destCountry.name}`, essential: true },
        { id: 'passport', label: `Valid ${originCountry.name} passport with 6+ months validity`, essential: true },
        { id: 'insurance', label: 'International Student Medical & Repatriation Insurance', essential: true },
        { id: 'funds', label: 'Verified 6-month bank statements proving tuition and maintenance funds', essential: true },
        { id: 'academic', label: 'Certified academic diplomas & official transcripts with translations', essential: true },
        { id: 'police', label: 'Police conduct clearance certificate', essential: false }
      ];
    }

    return [
      { id: 'passport', label: `Valid ${originCountry.name} passport with 6+ months validity & blank pages`, essential: true },
      { id: 'flights', label: 'Confirmed return or onward international flight ticket reservation', essential: true },
      { id: 'accommodation', label: `Confirmed hotel vouchers or residential host address in ${destCountry.name}`, essential: true },
      { id: 'bank', label: 'Recent 3-month personal bank statements proving self-sufficiency', essential: true },
      { id: 'insurance', label: 'Comprehensive travel health & emergency medical insurance policy', essential: true },
      { id: 'leave', label: 'Proof of ties to home country (employment letter or business registration)', essential: false }
    ];
  }, [destCountry, originCountry, travelPurpose]);

  return (
    <div className="min-h-screen bg-navy-950 text-slate-100 py-6 sm:py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 sm:space-y-8">
        {/* Top Header & Overview */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-slate-800/80">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5 animate-pulse" />
              <span>Three.js Planetary Mobility & Visa Intelligence</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white flex items-center gap-3">
              <span>Interactive 3D Earth & Sovereign Directory</span>
              <Globe className="w-7 h-7 sm:w-8 sm:h-8 text-cyan-400 animate-spin-slow" />
            </h1>
            <p className="mt-2 text-sm sm:text-base text-slate-400 max-w-3xl">
              Rotate, zoom, and explore 250 sovereign nations in real-time 3D. Search official immigration portals,
              calculate live currency conversions, and ask Gemini for personalized visa guidance.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => openDirectory('destination')}
              className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-cyan-500/50 text-xs sm:text-sm font-semibold text-slate-300 hover:text-white transition-all flex items-center gap-2 shadow-sm"
            >
              <Search className="w-4 h-4 text-cyan-400" />
              <span>Browse Countries</span>
            </button>
            <button
              type="button"
              onClick={() => handleAskCopilot(`What documents do I need to study in ${destCountry.name}?`)}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-xs sm:text-sm font-semibold text-navy-950 shadow-glow-cyan transition-all flex items-center gap-2 transform active:scale-95"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Ask Copilot</span>
            </button>
          </div>
        </div>

        {/* Search & Origin/Destination Dual Selector Bar */}
        <div className="bg-slate-900/80 p-4 sm:p-5 rounded-3xl border border-slate-800 shadow-xl space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-9 gap-3 items-center">
            {/* Origin Country Picker */}
            <div className="md:col-span-4 space-y-1.5">
              <label className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" /> Origin Passport / Nationality
                </span>
                <button
                  type="button"
                  onClick={() => openDirectory('origin')}
                  className="text-xs text-slate-400 hover:text-cyan-300 underline font-normal"
                >
                  Change
                </button>
              </label>
              <div
                onClick={() => openDirectory('origin')}
                className="p-3 bg-navy-950 border border-slate-700/80 rounded-2xl flex items-center justify-between cursor-pointer hover:border-cyan-500/60 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl select-none">{originCountry.flag}</span>
                  <div>
                    <div className="font-bold text-white text-sm group-hover:text-cyan-300 transition-colors">
                      {originCountry.name}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Capital: {originCountry.capital} • {originCountry.continent}
                    </div>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold px-2 py-1 rounded bg-slate-800 text-slate-300">
                  {originCountry.cca2}
                </span>
              </div>
            </div>

            {/* Interchange Swap Arrow */}
            <div className="flex items-center justify-center pt-2 md:pt-4">
              <button
                type="button"
                onClick={handleSwapCorridor}
                className="p-3 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-cyan-500 text-slate-300 hover:text-cyan-300 transition-all hover:rotate-180 duration-300 shadow-md"
                title="Swap Origin and Destination"
                aria-label="Swap Origin and Destination"
              >
                <ArrowRightLeft className="w-4 h-4" />
              </button>
            </div>

            {/* Destination Country Picker */}
            <div className="md:col-span-4 space-y-1.5">
              <label className="text-[11px] font-bold text-purple-400 uppercase tracking-wider flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" /> Destination Country / Territory
                </span>
                <button
                  type="button"
                  onClick={() => openDirectory('destination')}
                  className="text-xs text-slate-400 hover:text-purple-300 underline font-normal"
                >
                  Change
                </button>
              </label>
              <div
                onClick={() => openDirectory('destination')}
                className="p-3 bg-navy-950 border border-slate-700/80 rounded-2xl flex items-center justify-between cursor-pointer hover:border-purple-500/60 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl select-none">{destCountry.flag}</span>
                  <div>
                    <div className="font-bold text-white text-sm group-hover:text-purple-300 transition-colors">
                      {destCountry.name}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Capital: {destCountry.capital} • {destCountry.continent}
                    </div>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold px-2 py-1 rounded bg-purple-950 text-purple-300 border border-purple-500/30">
                  {destCountry.cca2}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Preset Corridors Strip */}
          <div className="pt-2 border-t border-slate-800 flex items-center gap-2 overflow-x-auto scrollbar-thin">
            <span className="text-xs text-slate-400 font-semibold shrink-0 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-cyan-400" /> Presets:
            </span>
            {PRESET_CORRIDORS.map((preset) => {
              const isActive =
                originCountry.cca2 === preset.originCode && destCountry.cca2 === preset.destCode;
              return (
                <button
                  key={`${preset.originCode}-${preset.destCode}`}
                  type="button"
                  onClick={() => handleSelectPreset(preset)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-glow-cyan'
                      : 'bg-slate-800/50 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700/50'
                  }`}
                >
                  <Plane className={`w-3 h-3 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />
                  <span>{preset.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* The Upgraded 3D Interactive WebGL Earth Globe Viewport */}
        {/* On mobile: full globe fits inside without cropping! Controls floating cleanly without covering sphere! */}
        <div className="relative">
          <InteractiveEarthGlobe3D
            selectedDestination={destCountry}
            selectedOrigin={originCountry}
            onSelectCountry={(c, role) => {
              if (role === 'destination') setDestCountry(c);
              else setOriginCountry(c);
            }}
          />
        </div>

        {/* Selected Country Dossier & Currency Conversion Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* Country Intelligence & Official Portal Card */}
          <div className="p-5 sm:p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <span className="text-3xl select-none">{destCountry.flag}</span>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                    <span>{destCountry.name}</span>
                    <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/30">
                      {destCountry.cca2} / {destCountry.cca3}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">{destCountry.officialName}</p>
                </div>
              </div>

              <a
                href={destCountry.officialImmigrationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-bold transition-all flex items-center gap-1.5"
                title="Open Official Sovereign Portal"
              >
                <span>Official Portal</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            {/* Geographical & Diplomatic Specifications */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-2xl bg-navy-950/70 border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase block font-semibold">Capital City</span>
                <span className="font-bold text-white block truncate">{destCountry.capital || 'N/A'}</span>
              </div>
              <div className="p-3 rounded-2xl bg-navy-950/70 border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase block font-semibold">Continent & Region</span>
                <span className="font-bold text-white block truncate">{destCountry.region}</span>
              </div>
              <div className="p-3 rounded-2xl bg-navy-950/70 border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase block font-semibold">Dialing Code</span>
                <span className="font-bold text-cyan-400 block font-mono">{destCountry.callingCode || 'N/A'}</span>
              </div>
              <div className="p-3 rounded-2xl bg-navy-950/70 border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase block font-semibold">Languages</span>
                <span className="font-bold text-slate-200 block truncate">{destCountry.languages.join(', ')}</span>
              </div>
              <div className="p-3 rounded-2xl bg-navy-950/70 border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase block font-semibold">Coordinates</span>
                <span className="font-bold text-slate-200 block font-mono text-[11px] truncate">
                  {destCountry.lat.toFixed(1)}°, {destCountry.lon.toFixed(1)}°
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-navy-950/70 border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase block font-semibold">Flight Distance</span>
                <span className="font-bold text-emerald-400 block font-mono text-[11px]">
                  ~{telemetry.distanceKm.toLocaleString()} km
                </span>
              </div>
            </div>

            {/* One-click Action to Ask Copilot */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-purple-950/40 via-navy-950 to-cyan-950/40 border border-purple-500/30 flex items-center justify-between flex-wrap gap-2">
              <div className="text-xs">
                <span className="font-bold text-white block">Got questions about {destCountry.name}?</span>
                <span className="text-slate-400 text-[11px]">Ask about student visas, study documents, or daily budgets.</span>
              </div>
              <button
                type="button"
                onClick={() => handleAskCopilot(`What documents do I need to study in ${destCountry.name}?`)}
                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Ask: Study in {destCountry.name}</span>
              </button>
            </div>
          </div>

          {/* Real-time Country Currency Information & Conversion Calculator */}
          <CurrencyConverterCard
            country={destCountry}
            originCountry={originCountry}
          />
        </div>

        {/* Personalized Travel & Visa Preparation Planner (Requirement 6) */}
        <div className="p-5 sm:p-8 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-cyan-400 uppercase tracking-wider mb-1">
                <Compass className="w-4 h-4" /> Personalized Travel & Visa Planner
              </div>
              <h2 className="text-lg sm:text-2xl font-bold text-white">
                Preparation Plan for {originCountry.name} ➔ {destCountry.name}
              </h2>
            </div>
            <span className="text-xs text-slate-400">
              Tailored preparation checklist & living expense estimates
            </span>
          </div>

          {/* Planner Input Form */}
          <form onSubmit={handleGeneratePlan} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Nationality / Citizenship */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
                Nationality (Passport)
              </label>
              <div
                onClick={() => openDirectory('origin')}
                className="w-full px-3.5 py-2.5 bg-navy-950 border border-slate-700 rounded-xl text-xs font-semibold text-white cursor-pointer hover:border-cyan-500 flex items-center justify-between"
              >
                <span>{originCountry.flag} {originCountry.name}</span>
                <span className="text-slate-500 text-[10px]">Change</span>
              </div>
            </div>

            {/* Destination */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
                Destination
              </label>
              <div
                onClick={() => openDirectory('destination')}
                className="w-full px-3.5 py-2.5 bg-navy-950 border border-slate-700 rounded-xl text-xs font-semibold text-white cursor-pointer hover:border-purple-500 flex items-center justify-between"
              >
                <span>{destCountry.flag} {destCountry.name}</span>
                <span className="text-slate-500 text-[10px]">Change</span>
              </div>
            </div>

            {/* Travel Purpose */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
                Purpose of Journey
              </label>
              <select
                value={travelPurpose}
                onChange={(e) => setTravelPurpose(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-navy-950 border border-slate-700 rounded-xl text-xs font-semibold text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="Study">Higher Education / Student Visa</option>
                <option value="Tourism">Tourism & Leisure Vacation</option>
                <option value="Business">Business Conference / Trade Meeting</option>
                <option value="Work">Employment / Skilled Migration</option>
                <option value="Transit">Airport Layover & Transit</option>
              </select>
            </div>

            {/* Planned Departure Date */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
                Planned Departure Date
              </label>
              <input
                type="date"
                value={departureDate}
                onChange={(e) => setDepartureDate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-navy-950 border border-slate-700 rounded-xl text-xs font-semibold text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* Intended Stay Duration */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
                Intended Duration
              </label>
              <select
                value={stayDuration}
                onChange={(e) => setStayDuration(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-navy-950 border border-slate-700 rounded-xl text-xs font-semibold text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="14 Days">Short Stay (1–2 Weeks)</option>
                <option value="30–90 Days">Medium Stay (1–3 Months)</option>
                <option value="1 Year (Academic Program)">Long Stay: 1 Year (Academic)</option>
                <option value="2–4 Years (Degree Program)">Long Stay: 2–4 Years (Degree)</option>
              </select>
            </div>

            {/* Visa Category */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
                Visa Stream / Category
              </label>
              <input
                type="text"
                value={visaCategory}
                onChange={(e) => setVisaCategory(e.target.value)}
                placeholder="e.g. Subclass 500, Working Holiday..."
                className="w-full px-3.5 py-2.5 bg-navy-950 border border-slate-700 rounded-xl text-xs font-semibold text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* Estimated Budget & Currency */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
                Est. Budget ({destCountry.currencies[0]?.code || 'USD'})
              </label>
              <input
                type="text"
                value={budgetEst}
                onChange={(e) => setBudgetEst(e.target.value)}
                placeholder="e.g. 15,000"
                className="w-full px-3.5 py-2.5 bg-navy-950 border border-slate-700 rounded-xl text-xs font-semibold text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* Submit Action */}
            <div className="flex items-end">
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-navy-950 font-bold text-xs shadow-glow-cyan transition-all flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-4 h-4" />
                <span>Generate Plan</span>
              </button>
            </div>
          </form>

          {/* Generated Plan & Interactive Document Checklist */}
          <div className="pt-4 border-t border-slate-800 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-cyan-400" />
                <span>Statutory Document Checklist for {destCountry.name}</span>
                <span className="text-xs font-normal text-slate-400">
                  ({Object.values(checklistChecks).filter(Boolean).length} of {documentChecklistItems.length} items ready)
                </span>
              </h3>
              <a
                href={destCountry.officialImmigrationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-cyan-400 hover:underline flex items-center gap-1 font-semibold"
              >
                <span>Verify on {destCountry.name} Official Portal</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            {/* Interactive Checkbox Items */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {documentChecklistItems.map((item) => {
                const isChecked = Boolean(checklistChecks[item.id]);
                return (
                  <div
                    key={item.id}
                    onClick={() =>
                      setChecklistChecks((prev) => ({ ...prev, [item.id]: !isChecked }))
                    }
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 select-none ${
                      isChecked
                        ? 'bg-emerald-950/30 border-emerald-500/50 text-white'
                        : 'bg-navy-950/70 hover:bg-slate-800/60 border-slate-800 text-slate-300'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-lg border mt-0.5 flex items-center justify-center shrink-0 transition-all ${
                        isChecked
                          ? 'bg-emerald-500 border-emerald-400 text-navy-950'
                          : 'border-slate-700 bg-slate-900'
                      }`}
                    >
                      {isChecked && <CheckCircle2 className="w-3.5 h-3.5 font-bold" />}
                    </div>
                    <div className="text-xs space-y-0.5">
                      <span className={`font-semibold block ${isChecked ? 'line-through text-slate-400' : 'text-slate-200'}`}>
                        {item.label}
                      </span>
                      <span className="text-[10px] font-mono text-cyan-400 uppercase">
                        {item.essential ? 'Mandatory Requirement' : 'Recommended Supporting'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Plan Advisory Notice */}
            <div className="p-3.5 rounded-2xl bg-slate-800/40 border border-slate-800 flex items-center gap-2 text-xs text-slate-400">
              <Info className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>
                Official visa processing and eligibility decisions remain at the sole sovereign discretion of the{' '}
                {destCountry.name} Department of Immigration or Consular Embassy. VisaVoyage AI provides verified preparation guidelines and never guarantees visa grants.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Global Country Directory Modal */}
      <CountryDirectoryModal
        isOpen={isDirectoryOpen}
        onClose={() => setIsDirectoryOpen(false)}
        initialMode={directoryMode}
        selectedDestinationCca2={destCountry.cca2}
        selectedOriginCca2={originCountry.cca2}
        onSelectCountry={(country, role) => {
          if (role === 'destination') {
            setDestCountry(country);
          } else {
            setOriginCountry(country);
          }
        }}
      />

      {/* Gemini Copilot Drawer */}
      <GeminiCopilotDrawer
        isOpen={isCopilotOpen}
        onClose={() => setIsCopilotOpen(false)}
        destinationContext={destCountry.name}
        originCountryContext={originCountry.name}
        travelPurposeContext={travelPurpose}
        visaTypeContext={visaCategory}
      />
    </div>
  );
};
