import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import {
  Compass,
  ShieldCheck,
  FileSearch,
  Sparkles,
  ArrowRight,
  Globe2,
  Lock,
  Database,
  CheckCircle2,
  Plane,
  ChevronRight,
  Clock,
  Layers
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const { user, signInWithDemo } = useAuth();
  const navigate = useNavigate();

  const handleLaunchDemo = () => {
    signInWithDemo();
    navigate('/dashboard');
  };

  const sampleDestinations = [
    { city: 'Tokyo', country: 'Japan', visa: 'Visa Free (90d)', color: 'from-rose-500/20 to-orange-500/20' },
    { city: 'Paris', country: 'France', visa: 'Schengen Area (90d)', color: 'from-blue-500/20 to-indigo-500/20' },
    { city: 'Singapore', country: 'Singapore', visa: 'eVisa / SG Arrival', color: 'from-emerald-500/20 to-cyan-500/20' },
    { city: 'Dubai', country: 'UAE', visa: 'Visa on Arrival (30d)', color: 'from-amber-500/20 to-yellow-500/20' },
  ];

  return (
    <div className="space-y-24 py-8 md:py-16">
      {/* Hero Section */}
      <section className="relative px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center space-y-8">
        {/* Glow ambient background */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-cyan-500/15 via-indigo-500/10 to-transparent blur-3xl pointer-events-none -z-10" />

        {/* Top Feature Pill */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900/80 border border-slate-700/80 text-xs font-medium text-slate-300 shadow-sm backdrop-blur-md">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>Powered by Google GenAI (gemini-2.5-flash) & Supabase RLS</span>
        </div>

        {/* Main Title */}
        <div className="space-y-4 max-w-4xl mx-auto">
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.1]">
            Global Travel Intelligence & <br />
            <span className="text-gradient">Immigration Compliance</span>
          </h1>
          <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Eliminate border surprises. VisaVoyage AI generates phased travel itineraries, instant visa policy determinations, and multimodal passport validity inspections in real time.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          {user ? (
            <Link
              to="/dashboard"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-sm bg-cyan-500 hover:bg-cyan-400 text-navy-950 shadow-glow-cyan flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5"
            >
              Open Command Center <ArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <>
              <button
                onClick={handleLaunchDemo}
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-sm bg-cyan-500 hover:bg-cyan-400 text-navy-950 shadow-glow-cyan flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5"
              >
                <Sparkles className="w-4 h-4" /> Launch Interactive Demo
              </button>
              <Link
                to="/signup"
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-semibold text-sm bg-slate-800/80 hover:bg-slate-700 text-white border border-slate-700 flex items-center justify-center gap-2 transition-all"
              >
                Create Account <ChevronRight className="w-4 h-4 text-slate-400" />
              </Link>
            </>
          )}
        </div>

        {/* Quick Sample Destinations Bar */}
        <div className="pt-10 max-w-5xl mx-auto">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-4">
            Instant Immigration & Policy Intelligence for 195+ Countries
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {sampleDestinations.map((d, i) => (
              <div
                key={i}
                className="glass-card p-4 text-left border-slate-800/80 hover:border-cyan-500/40 transition-all cursor-pointer group"
                onClick={() => {
                  if (!user) signInWithDemo();
                  navigate('/visa-checker');
                }}
              >
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                  <span>{d.country}</span>
                  <Plane className="w-3.5 h-3.5 text-slate-400 group-hover:text-cyan-400 transition-colors" />
                </div>
                <div className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors">
                  {d.city}
                </div>
                <div className="text-[11px] font-medium text-emerald-400 mt-2">
                  {d.visa}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3 Pillar Capabilities Grid */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <h2 className="text-xs font-bold text-cyan-400 uppercase tracking-widest">Architectural Isolation & AI Power</h2>
          <h3 className="text-3xl sm:text-4xl font-extrabold text-white">
            Built for High-Trust International Mobility
          </h3>
          <p className="text-slate-400 text-sm md:text-base">
            Every layer—from browser presentation to server-side AI orchestration and PostgreSQL Row-Level Security—is engineered with zero compromises.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Pillar 1 */}
          <div className="glass-card glass-card-hover p-8 space-y-5">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Compass className="w-6 h-6" />
            </div>
            <h4 className="text-xl font-bold text-white">AI Itinerary Architect</h4>
            <p className="text-sm text-slate-400 leading-relaxed">
              Zod-validated endpoints that synthesize destination profiles, traveler origin, budget tiers, and custom preferences into sequenced daily itineraries with itemized cost models.
            </p>
            <ul className="space-y-2 text-xs text-slate-300 pt-2 border-t border-slate-800">
              <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" /> Day-by-day sequenced schedules</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" /> Accommodation & dining estimates</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" /> Local customs & emergency hotlines</li>
            </ul>
          </div>

          {/* Pillar 2 */}
          <div className="glass-card glass-card-hover p-8 space-y-5">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h4 className="text-xl font-bold text-white">Global Visa Policy Matrix</h4>
            <p className="text-sm text-slate-400 leading-relaxed">
              Automated passport-to-destination immigration matrix identifying eVisa, Visa on Arrival, consular appointments, processing times, and financial solvency proof guidelines.
            </p>
            <ul className="space-y-2 text-xs text-slate-300 pt-2 border-t border-slate-800">
              <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" /> Permitted stay window calculation</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" /> Mandatory document checklist</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" /> Vaccine & health declaration alerts</li>
            </ul>
          </div>

          {/* Pillar 3 */}
          <div className="glass-card glass-card-hover p-8 space-y-5">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <FileSearch className="w-6 h-6" />
            </div>
            <h4 className="text-xl font-bold text-white">Multimodal Document Scanner</h4>
            <p className="text-sm text-slate-400 leading-relaxed">
              Powered by gemini-2.5-flash multimodal vision. Safely upload your passport or visa photo to verify 6-month validity rules, MRZ legibility, and calculate a Border Readiness Score.
            </p>
            <ul className="space-y-2 text-xs text-slate-300 pt-2 border-t border-slate-800">
              <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> ICAO 9303 compliance verification</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Expiry & blank pages warnings</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Border readiness numerical score</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Security Architecture Deep Dive */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="glass-card p-8 md:p-12 relative overflow-hidden">
          <div className="max-w-2xl space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-xs font-semibold text-indigo-300">
              <Lock className="w-3.5 h-3.5" /> High-Security Architecture
            </div>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-white">
              Zero-Trust Architecture with Row-Level Security
            </h3>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              Travel itineraries and identity records contain highly sensitive personal data. VisaVoyage AI guarantees:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-navy-950/70 border border-slate-800 space-y-1">
                <span className="text-xs font-bold text-cyan-400 uppercase tracking-wide">Client-Side Isolation</span>
                <p className="text-xs text-slate-400">Zero Gemini API keys or service role secrets exist in the browser bundle.</p>
              </div>
              <div className="p-4 rounded-xl bg-navy-950/70 border border-slate-800 space-y-1">
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wide">PostgreSQL RLS</span>
                <p className="text-xs text-slate-400">Database rows enforce <code className="text-slate-300">auth.uid() = user_id</code> at the SQL engine level.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
