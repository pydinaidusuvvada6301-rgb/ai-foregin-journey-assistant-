import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import {
  fetchItineraries,
  fetchVisaChecks,
  fetchDocumentChecks,
  deleteItinerary,
  deleteVisaCheck
} from '../lib/api.js';
import type { TravelItineraryRecord, VisaCheckRecord, DocumentCheckRecord } from '../types/index.js';
import { StatusBadge } from '../components/StatusBadge.js';
import { ItineraryResultCard } from '../components/ItineraryResultCard.js';
import { VisaCheckCard } from '../components/VisaCheckCard.js';
import {
  Compass,
  ShieldCheck,
  FileSearch,
  Plus,
  Trash2,
  Eye,
  Calendar,
  Globe,
  Lock,
  Database,
  ArrowRight,
  Sparkles,
  Layers,
  Loader2,
  AlertCircle,
  X
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { user, isDemoUser } = useAuth();
  const navigate = useNavigate();

  const [itineraries, setItineraries] = useState<TravelItineraryRecord[]>([]);
  const [visaChecks, setVisaChecks] = useState<VisaCheckRecord[]>([]);
  const [docChecks, setDocChecks] = useState<DocumentCheckRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal inspection states
  const [viewingItinerary, setViewingItinerary] = useState<TravelItineraryRecord | null>(null);
  const [viewingVisaCheck, setViewingVisaCheck] = useState<VisaCheckRecord | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [itinData, visaData, docData] = await Promise.all([
        fetchItineraries().catch(() => []),
        fetchVisaChecks().catch(() => []),
        fetchDocumentChecks().catch(() => [])
      ]);
      setItineraries(itinData || []);
      setVisaChecks(visaData || []);
      setDocChecks(docData || []);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const handleDeleteItinerary = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this saved itinerary?')) return;
    try {
      await deleteItinerary(id);
      setItineraries(prev => prev.filter(item => item.id !== id));
      if (viewingItinerary?.id === id) setViewingItinerary(null);
    } catch (err) {
      console.error('Failed to delete itinerary:', err);
    }
  };

  const handleDeleteVisaCheck = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to remove this visa inquiry?')) return;
    try {
      await deleteVisaCheck(id);
      setVisaChecks(prev => prev.filter(item => item.id !== id));
      if (viewingVisaCheck?.id === id) setViewingVisaCheck(null);
    } catch (err) {
      console.error('Failed to delete visa check:', err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 space-y-10">
      {/* Unconfirmed Email Alert Notice */}
      {!user?.emailConfirmed && !isDemoUser && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong>Email Verification Advisory:</strong> A verification link was sent to <strong className="text-white">{user?.email}</strong>. Please confirm your email address to enable permanent account recovery and security alerts.
            </span>
          </div>
        </div>
      )}

      {/* Welcome Banner */}
      <div className="glass-card p-6 md:p-8 relative overflow-hidden border-slate-800">
        <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="glass-pill text-cyan-400 border-cyan-500/30 flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Traveler Command Center
              </span>
              <span className="glass-pill text-emerald-400 border-emerald-500/30 flex items-center gap-1">
                <Database className="w-3 h-3" /> RLS Isolated
              </span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              Greetings, {user?.fullName || 'Traveler'}
            </h1>
            <p className="text-sm text-slate-400 flex items-center gap-2">
              <Globe className="w-4 h-4 text-cyan-400" />
              Origin Passport: <span className="text-slate-200 font-semibold">{user?.homeCountry || 'United States'}</span>
              <span>•</span>
              <span className="text-xs text-slate-400 font-mono">UID: {user?.id.substring(0, 12)}...</span>
            </p>
          </div>

          {/* Quick Launch Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/itinerary"
              className="px-4 py-2.5 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-navy-950 shadow-glow-cyan flex items-center gap-2 transition-all transform active:scale-95"
            >
              <Plus className="w-4 h-4" /> New AI Itinerary
            </Link>
            <Link
              to="/visa-checker"
              className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/40 flex items-center gap-2 transition-all"
            >
              <ShieldCheck className="w-4 h-4 text-indigo-400" /> Check Visa Policy
            </Link>
            <Link
              to="/document-analyzer"
              className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-2 transition-all"
            >
              <FileSearch className="w-4 h-4 text-slate-400" /> Scan Document
            </Link>
          </div>
        </div>
      </div>

      {/* Traveler Preferences & Active Corridors */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Profile Travel Intent */}
        <div className="glass-card p-5 border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-cyan-400" /> Planned Journey Intent
            </span>
            <Link to="/settings" className="text-[11px] text-cyan-400 hover:underline">
              Edit
            </Link>
          </div>
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-800/80">
              <span className="text-slate-400">Target Destination:</span>
              <span className="text-white font-semibold">{user?.destinationPreference || 'Not set yet'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/80">
              <span className="text-slate-400">Travel Purpose:</span>
              <span className="text-cyan-300 font-semibold">{user?.travelPurpose || 'Tourism'}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-400">Target Departure:</span>
              <span className="text-slate-300 font-medium">{user?.intendedDepartureDate || 'Flexible timeline'}</span>
            </div>
          </div>
        </div>

        {/* Recently Viewed Corridors */}
        <div className="glass-card p-5 border-slate-800 space-y-3 md:col-span-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-indigo-400" /> Recently Viewed Destinations
            </span>
            <span className="text-[11px] text-slate-400">Auto-saved session history</span>
          </div>
          {user?.recentlyViewedDestinations && user.recentlyViewedDestinations.length > 0 ? (
            <div className="flex flex-wrap gap-2 pt-1">
              {user.recentlyViewedDestinations.map((dest, i) => (
                <div
                  key={i}
                  className="px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs flex items-center gap-2 group hover:border-cyan-500/40 transition-all"
                >
                  <span className="text-white font-medium">{dest}</span>
                  <Link
                    to={`/visa-checker?destination=${encodeURIComponent(dest)}`}
                    className="text-[10px] text-cyan-400 hover:text-cyan-300 font-semibold"
                    title="Check Visa"
                  >
                    Visa →
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-2 text-xs text-slate-400 flex items-center gap-2">
              <span>No recent destinations viewed. Explore countries via the</span>
              <Link to="/visa-checker" className="text-cyan-400 hover:underline">Visa Checker</Link>
              <span>or</span>
              <Link to="/itinerary" className="text-indigo-400 hover:underline">AI Itinerary Architect</Link>.
            </div>
          )}
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-card p-5 border-slate-800/80 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Saved Itineraries</span>
            <Compass className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white">
            {itineraries.length}
          </div>
          <p className="text-[11px] text-slate-400">Curated AI journey plans</p>
        </div>

        <div className="glass-card p-5 border-slate-800/80 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Visa Inquiries</span>
            <ShieldCheck className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white">
            {visaChecks.length}
          </div>
          <p className="text-[11px] text-slate-400">Evaluated border regimes</p>
        </div>

        <div className="glass-card p-5 border-slate-800/80 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Document Scans</span>
            <FileSearch className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white">
            {docChecks.length}
          </div>
          <p className="text-[11px] text-slate-400">ICAO 9303 MRZ verifications</p>
        </div>

        <div className="glass-card p-5 border-slate-800/80 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Security Status</span>
            <Lock className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-sm font-bold text-emerald-400 flex items-center gap-1.5 pt-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Active Isolated
          </div>
          <p className="text-[11px] text-slate-400">Supabase RLS active</p>
        </div>
      </div>

      {/* Journey Readiness & Application Milestones Tracker */}
      <div className="glass-card p-6 border-slate-800 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" /> Journey Milestones & Consular Readiness
            </h2>
            <p className="text-xs text-slate-400">Preparation trajectory for {user?.destinationPreference || 'Upcoming International Journey'}</p>
          </div>
          <Link
            to="/document-analyzer"
            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/20 transition-all flex items-center gap-1.5 w-fit"
          >
            <FileSearch className="w-3.5 h-3.5" /> Open Document Checklist
          </Link>
        </div>

        {/* 5-Phase Horizontal Milestone Timeline */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Phase 1 */}
          <div className="bg-navy-950/80 p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400">Phase 01</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${docChecks.length > 0 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-400'}`}>
                {docChecks.length > 0 ? 'Verified' : 'Pending'}
              </span>
            </div>
            <h4 className="text-xs font-bold text-white">Passport Validity</h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Verify 6-month validity & undamaged ICAO MRZ machine-readable zone.
            </p>
          </div>

          {/* Phase 2 */}
          <div className="bg-navy-950/80 p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-wider text-indigo-400">Phase 02</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${visaChecks.length > 0 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-400'}`}>
                {visaChecks.length > 0 ? 'Assessed' : 'In Progress'}
              </span>
            </div>
            <h4 className="text-xs font-bold text-white">Visa Policy Review</h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Evaluate visa-free, eVisa, ETA, or consular submission rules.
            </p>
          </div>

          {/* Phase 3 */}
          <div className="bg-navy-950/80 p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-wider text-purple-400">Phase 03</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300">
                Active
              </span>
            </div>
            <h4 className="text-xs font-bold text-white">Document Checklist</h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Assemble bank statements, employment letters & travel insurance.
            </p>
          </div>

          {/* Phase 4 */}
          <div className="bg-navy-950/80 p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400">Phase 04</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${itineraries.length > 0 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-400'}`}>
                {itineraries.length > 0 ? 'Generated' : 'Pending'}
              </span>
            </div>
            <h4 className="text-xs font-bold text-white">Itinerary Logistics</h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Plan day-to-day route, transit connectivity, and budget allocation.
            </p>
          </div>

          {/* Phase 5 */}
          <div className="bg-navy-950/80 p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400">Phase 05</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                Departure
              </span>
            </div>
            <h4 className="text-xs font-bold text-white">Border Entry Pack</h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Print boarding passes, offline embassy hotlines & arrival customs slips.
            </p>
          </div>
        </div>
      </div>

      {/* First-Time Traveler Onboarding Flow (Shown for new accounts) */}
      {!loading && itineraries.length === 0 && visaChecks.length === 0 && (
        <div className="glass-card p-6 border-cyan-500/30 bg-gradient-to-r from-navy-950 via-slate-900 to-navy-950 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-cyan-500/20 text-cyan-300">
                <Sparkles className="w-5 h-5" />
              </span>
              <div>
                <h3 className="text-base font-bold text-white">First-Time Setup: 3 Steps to Launch Your Journey</h3>
                <p className="text-xs text-slate-400">Complete these initial steps to establish your traveler intelligence dossier.</p>
              </div>
            </div>
            <span className="glass-pill text-[11px] text-cyan-400">Step 1 of 3</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
            <Link
              to="/visa-checker"
              className="p-4 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/40 transition-all flex flex-col justify-between group"
            >
              <div className="space-y-1">
                <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase">Step 01</span>
                <h4 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">Check Visa Eligibility</h4>
                <p className="text-xs text-slate-400">Evaluate sovereign visa rules, permitted length of stay, and embassy links.</p>
              </div>
              <span className="mt-3 text-xs font-semibold text-cyan-400 flex items-center gap-1">Launch Wizard →</span>
            </Link>

            <Link
              to="/document-analyzer"
              className="p-4 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-indigo-500/40 transition-all flex flex-col justify-between group"
            >
              <div className="space-y-1">
                <span className="text-[10px] font-mono font-bold text-indigo-400 uppercase">Step 02</span>
                <h4 className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors">Prepare Documents</h4>
                <p className="text-xs text-slate-400">Review required documents, track readiness, and scan passport MRZ.</p>
              </div>
              <span className="mt-3 text-xs font-semibold text-indigo-400 flex items-center gap-1">Open Checklist →</span>
            </Link>

            <Link
              to="/itinerary"
              className="p-4 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-purple-500/40 transition-all flex flex-col justify-between group"
            >
              <div className="space-y-1">
                <span className="text-[10px] font-mono font-bold text-purple-400 uppercase">Step 03</span>
                <h4 className="text-sm font-bold text-white group-hover:text-purple-300 transition-colors">Generate AI Itinerary</h4>
                <p className="text-xs text-slate-400">Architect phased day-by-day plans, activity schedules, and itemized cost models.</p>
              </div>
              <span className="mt-3 text-xs font-semibold text-purple-400 flex items-center gap-1">Generate Route →</span>
            </Link>
          </div>
        </div>
      )}

      {/* Main Content Split: Itineraries & Visa Checks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Saved Itineraries Column */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Compass className="w-5 h-5 text-cyan-400" /> Saved Travel Itineraries
            </h2>
            <Link to="/itinerary" className="text-xs font-medium text-cyan-400 hover:underline flex items-center gap-1">
              Create New <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {loading ? (
            <div className="glass-card p-8 flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-cyan-400" />
            </div>
          ) : itineraries.length === 0 ? (
            <div className="glass-card p-8 text-center space-y-3 border-dashed border-slate-800">
              <Compass className="w-10 h-10 text-slate-600 mx-auto" />
              <p className="text-sm text-slate-400">No travel itineraries saved yet.</p>
              <Link
                to="/itinerary"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/20 transition-all"
              >
                Plan Your First Destination
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {itineraries.map((itin) => (
                <div
                  key={itin.id}
                  onClick={() => setViewingItinerary(itin)}
                  className="glass-card p-4 hover:border-cyan-500/40 transition-all cursor-pointer flex items-center justify-between group"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors">
                        {itin.destination}
                      </h3>
                      <span className="glass-pill text-[10px] text-cyan-400">
                        {itin.duration_days} Days
                      </span>
                      <span className="glass-pill text-[10px] text-indigo-400">
                        {itin.budget_range}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 line-clamp-1">
                      {itin.itinerary_details?.destinationOverview || 'Curated journey plan'}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setViewingItinerary(itin);
                      }}
                      className="p-2 text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10 rounded-lg transition-colors"
                      title="View Itinerary"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => handleDeleteItinerary(itin.id, e)}
                      className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                      title="Delete record"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Saved Visa Inquiries Column */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-indigo-400" /> Recent Visa Inquiries
            </h2>
            <Link to="/visa-checker" className="text-xs font-medium text-cyan-400 hover:underline flex items-center gap-1">
              Check New <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {loading ? (
            <div className="glass-card p-8 flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
            </div>
          ) : visaChecks.length === 0 ? (
            <div className="glass-card p-8 text-center space-y-3 border-dashed border-slate-800">
              <ShieldCheck className="w-10 h-10 text-slate-600 mx-auto" />
              <p className="text-sm text-slate-400">No visa inquiries recorded yet.</p>
              <Link
                to="/visa-checker"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-500/20 transition-all"
              >
                Assess Destination Visa Policy
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {visaChecks.map((v) => (
                <div
                  key={v.id}
                  onClick={() => setViewingVisaCheck(v)}
                  className="glass-card p-4 hover:border-indigo-500/40 transition-all cursor-pointer flex items-center justify-between group"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-slate-400">
                        {v.passport_country} →
                      </span>
                      <h3 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors">
                        {v.destination_country}
                      </h3>
                      <StatusBadge status={v.visa_result?.visaStatus} />
                    </div>
                    <p className="text-xs text-slate-400 line-clamp-1">
                      Stay: {v.visa_result?.stayAllowed || 'Official permitted duration'}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setViewingVisaCheck(v);
                      }}
                      className="p-2 text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-colors"
                      title="View Policy Breakdown"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => handleDeleteVisaCheck(v.id, e)}
                      className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                      title="Delete record"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Row-Level Security & System Audit Logs */}
      <div className="glass-card p-6 border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Database className="w-4 h-4 text-emerald-400" /> Database Row-Level Security & Audit Logs
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
          <div className="bg-navy-950 p-3.5 rounded-xl border border-slate-800">
            <span className="text-slate-400 block mb-1">Authenticated Principal:</span>
            <span className="text-cyan-300 font-bold break-all">{user?.id}</span>
          </div>
          <div className="bg-navy-950 p-3.5 rounded-xl border border-slate-800">
            <span className="text-slate-400 block mb-1">Row-Level Security Policy:</span>
            <span className="text-emerald-400 font-bold">USING (auth.uid() = user_id)</span>
          </div>
          <div className="bg-navy-950 p-3.5 rounded-xl border border-slate-800">
            <span className="text-slate-400 block mb-1">AI Orchestration Host:</span>
            <span className="text-indigo-300 font-bold">Node/Express Server (gemini-2.5-flash)</span>
          </div>
        </div>
      </div>

      {/* Itinerary Modal Preview */}
      {viewingItinerary && (
        <div className="fixed inset-0 z-50 bg-navy-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl">
            <button
              onClick={() => setViewingItinerary(null)}
              className="sticky top-4 right-4 ml-auto z-20 p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center shadow-lg"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="-mt-10">
              <ItineraryResultCard
                itinerary={viewingItinerary.itinerary_details}
                destination={viewingItinerary.destination}
                durationDays={viewingItinerary.duration_days}
                budgetRange={viewingItinerary.budget_range}
              />
            </div>
          </div>
        </div>
      )}

      {/* Visa Check Modal Preview */}
      {viewingVisaCheck && (
        <div className="fixed inset-0 z-50 bg-navy-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl">
            <button
              onClick={() => setViewingVisaCheck(null)}
              className="sticky top-4 right-4 ml-auto z-20 p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center shadow-lg"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="-mt-10">
              <VisaCheckCard result={viewingVisaCheck.visa_result} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
