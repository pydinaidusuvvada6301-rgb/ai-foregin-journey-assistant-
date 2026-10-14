import React, { useState } from 'react';
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
  CheckCircle2,
  Plane,
  ChevronRight,
  Layers,
  Award,
  Zap,
  Globe
} from 'lucide-react';
import { InteractiveEarthGlobe3D } from '../components/InteractiveEarthGlobe3D.js';
import { Card3D } from '../components/Card3D.js';
import { FloatingPassport3D } from '../components/FloatingPassport3D.js';

export const LandingPage: React.FC = () => {
  const { user, signInWithDemo } = useAuth();
  const navigate = useNavigate();
  const [selectedHub, setSelectedHub] = useState<string | null>(null);
  const [corridorPassport, setCorridorPassport] = useState('United States');
  const [corridorDestination, setCorridorDestination] = useState('Japan');

  const handleLaunchDemo = () => {
    signInWithDemo();
    navigate('/dashboard');
  };

  const sampleDestinations = [
    { city: 'Tokyo', country: 'Japan', visa: 'Visa Free (90d)', status: 'Approved' },
    { city: 'Paris', country: 'France', visa: 'Schengen Area (90d)', status: 'Clearance' },
    { city: 'Singapore', country: 'Singapore', visa: 'SG Arrival / eVisa', status: 'Instant' },
    { city: 'Dubai', country: 'UAE', visa: 'Visa on Arrival (30d)', status: 'Fast-Track' },
  ];

  return (
    <div className="space-y-28 py-6 md:py-12 overflow-x-hidden">
      {/* 3D Hero Section */}
      <section className="relative px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Ambient 3D Neon Aura */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-gradient-to-tr from-cyan-500/20 via-indigo-600/15 to-emerald-500/10 blur-[130px] pointer-events-none -z-10" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column: Vision & CTAs */}
          <div className="lg:col-span-7 space-y-8 text-center lg:text-left">
            {/* Top Pill Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-navy-900/90 border border-cyan-500/30 text-xs font-semibold text-cyan-300 shadow-glow-cyan backdrop-blur-xl">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Next-Generation Autonomous Travel Intelligence</span>
            </div>

            {/* Main Punchy Heading */}
            <div className="space-y-4">
              <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.08]">
                Cross Borders with <br />
                <span className="text-gradient">Absolute Certainty</span>
              </h1>
              <p className="text-base sm:text-lg text-slate-300 max-w-xl mx-auto lg:mx-0 leading-relaxed font-normal">
                Eliminate consular surprises. VisaVoyage AI cross-references your origin passport against real-time international immigration protocols, day-by-day itinerary synthesis, and biometric MRZ compliance.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
              {user ? (
                <Link
                  to="/dashboard"
                  className="w-full sm:w-auto px-8 py-4 rounded-xl font-bold text-sm bg-cyan-500 hover:bg-cyan-400 text-navy-950 shadow-glow-cyan flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5 active:scale-95"
                >
                  Enter Traveler Command Center <ArrowRight className="w-4 h-4" />
                </Link>
              ) : (
                <>
                  <button
                    onClick={handleLaunchDemo}
                    className="w-full sm:w-auto px-8 py-4 rounded-xl font-bold text-sm bg-cyan-500 hover:bg-cyan-400 text-navy-950 shadow-glow-cyan flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5 active:scale-95"
                  >
                    <Sparkles className="w-4 h-4" /> Launch Interactive 3D Demo
                  </button>
                  <Link
                    to="/visa-checker"
                    className="w-full sm:w-auto px-8 py-4 rounded-xl font-semibold text-sm bg-navy-900/80 hover:bg-navy-800 text-white border border-slate-700/80 flex items-center justify-center gap-2 transition-all hover:border-cyan-500/40"
                  >
                    Explore Visa Wizard <ChevronRight className="w-4 h-4 text-slate-400" />
                  </Link>
                </>
              )}
            </div>

            {/* Live Corridor Quick-Check Bar */}
            <div className="p-4 rounded-2xl bg-navy-900/80 border border-cyan-500/30 backdrop-blur-xl shadow-lg shadow-cyan-500/5 max-w-xl mx-auto lg:mx-0">
              <div className="flex items-center gap-2 mb-3 text-xs font-semibold text-cyan-300">
                <Zap className="w-3.5 h-3.5 text-cyan-400" />
                <span>Instant Bilateral Corridor Checker</span>
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  navigate('/visa-checker', {
                    state: { origin: corridorPassport, destination: corridorDestination }
                  });
                }}
                className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center"
              >
                <div className="sm:col-span-5">
                  <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">Passport Origin</label>
                  <select
                    value={corridorPassport}
                    onChange={(e) => setCorridorPassport(e.target.value)}
                    className="w-full bg-navy-950/90 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                  >
                    {['United States', 'United Kingdom', 'Canada', 'Australia', 'Germany', 'France', 'India', 'Japan', 'Singapore'].map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-5">
                  <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">Destination Country</label>
                  <select
                    value={corridorDestination}
                    onChange={(e) => setCorridorDestination(e.target.value)}
                    className="w-full bg-navy-950/90 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                  >
                    {['Japan', 'France (Schengen)', 'Singapore', 'United Kingdom', 'Thailand', 'United Arab Emirates', 'Australia', 'United States'].map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-2 sm:self-end">
                  <button
                    type="submit"
                    className="w-full py-2 px-3 bg-cyan-500 hover:bg-cyan-400 text-navy-950 font-bold rounded-lg text-xs flex items-center justify-center gap-1 transition-all shadow-glow-cyan"
                    title="Check corridor rules"
                  >
                    <span>Check</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </form>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-slate-800/80 max-w-lg mx-auto lg:mx-0">
              <div>
                <span className="text-xl sm:text-2xl font-black text-white block">195+</span>
                <span className="text-xs text-slate-400 font-mono">Countries Indexed</span>
              </div>
              <div>
                <span className="text-xl sm:text-2xl font-black text-cyan-400 block">100%</span>
                <span className="text-xs text-slate-400 font-mono">ICAO 9303 Standard</span>
              </div>
              <div>
                <span className="text-xl sm:text-2xl font-black text-emerald-400 block">&lt; 1s</span>
                <span className="text-xs text-slate-400 font-mono">Verdict Latency</span>
              </div>
            </div>
          </div>

          {/* Right Column: 3D Holographic Passport Card */}
          <div className="lg:col-span-5 flex justify-center">
            <FloatingPassport3D />
          </div>
        </div>
      </section>

      {/* Interactive 3D Earth Globe Section */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-xs font-semibold text-cyan-300">
            <Globe2 className="w-3.5 h-3.5" /> Interactive 3D Flight & Mobility Network
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            Explore Global Corridors in Real Time
          </h2>
          <p className="text-sm sm:text-base text-slate-400">
            Drag to rotate the 3D globe. Inspect great-circle flight arcs, real-time bilateral immigration verification, and active air corridors connecting world capitals.
          </p>
          <div className="pt-1">
            <Link
              to="/mobility-globe"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500/20 to-indigo-500/20 hover:from-cyan-500/30 hover:to-indigo-500/30 text-cyan-300 border border-cyan-500/40 text-xs sm:text-sm font-semibold shadow-glow-cyan transition-all transform hover:scale-105 active:scale-95"
            >
              <Globe className="w-4 h-4 text-cyan-400 animate-spin-slow" />
              <span>Open Dedicated 3D Mobility Lab</span>
              <ArrowRight className="w-3.5 h-3.5 text-cyan-400" />
            </Link>
          </div>
        </div>

        {/* 3D WebGL Globe Viewport */}
        <div className="relative">
          <InteractiveEarthGlobe3D />
        </div>

        {/* Quick Sample Destinations Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {sampleDestinations.map((d, i) => (
            <Card3D key={i} depth={12}>
              <div
                className="p-5 glass-card border-slate-800/80 hover:border-cyan-500/50 transition-all cursor-pointer group bg-navy-950/70"
                onClick={() => {
                  if (!user) signInWithDemo();
                  navigate('/visa-checker');
                }}
              >
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5 font-mono">
                  <span>{d.country}</span>
                  <Plane className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-0.5 transition-all" />
                </div>
                <div className="text-lg font-bold text-white group-hover:text-cyan-300 transition-colors">
                  {d.city}
                </div>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/80 text-[11px] font-mono">
                  <span className="text-emerald-400 font-semibold">{d.visa}</span>
                  <span className="text-slate-500">{d.status}</span>
                </div>
              </div>
            </Card3D>
          ))}
        </div>
      </section>

      {/* 3 Pillar Capabilities Grid with 3D Tilt Cards */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-12">
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <span className="text-xs font-bold text-cyan-400 uppercase tracking-widest font-mono">
            Full-Spectrum Travel Advisory
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
            Engineered for International Travelers
          </h2>
          <p className="text-slate-400 text-sm md:text-base">
            From smart day-by-day itineraries to border checkpoint rules and passport validity checks, experience complete travel readiness.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Pillar 1 */}
          <Card3D depth={14} glowColor="rgba(6, 182, 212, 0.3)">
            <div className="p-8 glass-card border-slate-800/80 space-y-5 bg-navy-950/80 h-full">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-glow-cyan">
                <Compass className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white">AI Itinerary Architect</h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                Generates sequenced daily schedules, budget tier estimates, local neighborhood recommendations, and culturally authentic dining spots.
              </p>
              <ul className="space-y-2.5 text-xs text-slate-300 pt-4 border-t border-slate-800/80">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-cyan-400" /> Sequenced morning to evening pacing</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-cyan-400" /> Detailed budget breakdowns in USD</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-cyan-400" /> Local customs & emergency dispatch</li>
              </ul>
            </div>
          </Card3D>

          {/* Pillar 2 */}
          <Card3D depth={14} glowColor="rgba(99, 102, 241, 0.3)">
            <div className="p-8 glass-card border-slate-800/80 space-y-5 bg-navy-950/80 h-full">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-glow-indigo">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white">Global Visa Policy Matrix</h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                Cross-references your origin passport against official consular protocols, calculating entry windows, required solvency funds, and mandatory documents.
              </p>
              <ul className="space-y-2.5 text-xs text-slate-300 pt-4 border-t border-slate-800/80">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-indigo-400" /> Permitted stay window calculation</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-indigo-400" /> Interactive mandatory checklist</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-indigo-400" /> Health & vaccination advisories</li>
              </ul>
            </div>
          </Card3D>

          {/* Pillar 3 */}
          <Card3D depth={14} glowColor="rgba(16, 185, 129, 0.3)">
            <div className="p-8 glass-card border-slate-800/80 space-y-5 bg-navy-950/80 h-full">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <FileSearch className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white">Multimodal Document Scanner</h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                Multimodal vision inspection for passports and visas. Inspects the international 6-month validity rule, MRZ optical clarity, and generates a Travel Readiness Score.
              </p>
              <ul className="space-y-2.5 text-xs text-slate-300 pt-4 border-t border-slate-800/80">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> ICAO 9303 standard compliance</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Expiry warning & blank pages check</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Readiness score gauge (0-100)</li>
              </ul>
            </div>
          </Card3D>
        </div>
      </section>

      {/* Security & Traveler Trust Section (NO TECHNICAL CODE / JARGON) */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="glass-card p-8 md:p-12 border-slate-800/80 bg-gradient-to-br from-navy-900/90 via-navy-950/95 to-slate-950 relative overflow-hidden">
          <div className="max-w-3xl space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-xs font-semibold text-emerald-400">
              <Lock className="w-3.5 h-3.5" /> Traveler Privacy & Vault Security
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              Your Journey Plans. Completely Private & Encrypted.
            </h2>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              We treat travel documents, passports, and trip itineraries with enterprise-grade privacy protection. Your data is isolated, encrypted, and never sold or shared with advertisers.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
              <div className="p-4 rounded-xl bg-navy-950/80 border border-slate-800 space-y-1.5">
                <Award className="w-5 h-5 text-cyan-400" />
                <span className="text-xs font-bold text-white block">Bank-Grade Encryption</span>
                <p className="text-xs text-slate-400">All data in transit and at rest is protected with AES-256 and TLS 1.3.</p>
              </div>

              <div className="p-4 rounded-xl bg-navy-950/80 border border-slate-800 space-y-1.5">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <span className="text-xs font-bold text-white block">Biometric Privacy</span>
                <p className="text-xs text-slate-400">Uploaded documents are inspected in memory and never permanently stored without consent.</p>
              </div>

              <div className="p-4 rounded-xl bg-navy-950/80 border border-slate-800 space-y-1.5">
                <Zap className="w-5 h-5 text-indigo-400" />
                <span className="text-xs font-bold text-white block">Real-Time Intelligence</span>
                <p className="text-xs text-slate-400">Directly synchronized with official consular protocols and embassy guidelines.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* High-Conversion Closing Call-to-Action Section */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto pb-8">
        <div className="relative rounded-3xl overflow-hidden border border-cyan-500/40 bg-gradient-to-b from-navy-900/90 via-[#0b1222] to-navy-950 p-8 sm:p-14 text-center shadow-2xl shadow-cyan-950/50">
          {/* Ambient Glowing Halos */}
          <div className="absolute -top-32 -left-32 w-80 h-80 bg-cyan-500/20 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-indigo-500/20 rounded-full blur-[100px] pointer-events-none" />

          <div className="relative z-10 max-w-3xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-xs font-bold text-cyan-300 shadow-glow-cyan">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              <span>Official Consular Compliance • 100% Free Instant Access</span>
            </div>

            <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
              Ready to Cross Borders with <br className="hidden sm:inline" />
              <span className="text-gradient">Absolute Certainty?</span>
            </h2>

            <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
              Eliminate airport boarding rejections, verify bilateral visa exemptions against official sovereign databases, and generate custom day-by-day itineraries tailored to your passport.
            </p>

            {/* Conversion Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <button
                onClick={handleLaunchDemo}
                className="w-full sm:w-auto px-8 py-4 rounded-xl font-bold text-sm bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-navy-950 shadow-glow-cyan flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5 active:scale-95"
              >
                <Sparkles className="w-4 h-4 text-navy-950" />
                <span>Launch Interactive 3D Demo</span>
                <ArrowRight className="w-4 h-4 text-navy-950" />
              </button>

              <Link
                to="/visa-checker"
                className="w-full sm:w-auto px-8 py-4 rounded-xl font-semibold text-sm bg-slate-900/90 hover:bg-slate-800 text-white border border-slate-700/80 flex items-center justify-center gap-2 transition-all hover:border-cyan-500/40"
              >
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
                <span>Verify Visa Rules for 195+ Nations</span>
              </Link>
            </div>

            {/* Reassurance Badges */}
            <div className="flex flex-wrap items-center justify-center gap-6 pt-6 text-xs text-slate-400 font-medium">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> No credit card required
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-cyan-400" /> Verified official government sources
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-indigo-400" /> PostgreSQl RLS encrypted vault
              </span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
