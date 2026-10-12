import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { updateProfile, checkSystemHealth } from '../lib/api.js';
import { isSupabaseConfigured } from '../lib/supabase.js';
import {
  Settings,
  User,
  Globe,
  ShieldCheck,
  Database,
  Cpu,
  Lock,
  LogOut,
  Save,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Server,
  RefreshCw
} from 'lucide-react';
import { ArchitectureBoundaryCard } from '../components/ArchitectureBoundaryCard.js';

export const SettingsPage: React.FC = () => {
  const { user, isDemoUser, signOut, updateUserProfileState } = useAuth();

  const [fullName, setFullName] = useState(user?.fullName || '');
  const [homeCountry, setHomeCountry] = useState(user?.homeCountry || '');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [healthStatus, setHealthStatus] = useState<any>(null);
  const [isCheckingHealth, setIsCheckingHealth] = useState(false);

  const fetchHealth = () => {
    setIsCheckingHealth(true);
    checkSystemHealth()
      .then(data => setHealthStatus(data))
      .catch(() => setHealthStatus({ status: 'offline' }))
      .finally(() => setIsCheckingHealth(false));
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateProfile({
        full_name: fullName,
        home_country: homeCountry
      });

      updateUserProfileState({
        fullName,
        homeCountry
      });

      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to update profile:', err);
    }
  };

  const sqlMigrationCode = `-- VisaVoyage AI: PostgreSQL Database Schema
-- Run in your Supabase SQL Editor:
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

create table if not exists public.profiles (
    id uuid references auth.users(id) on delete cascade primary key,
    full_name text not null,
    home_country text not null default 'United States',
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists public.travel_itineraries (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id) on delete cascade not null,
    destination text not null,
    duration_days integer not null check (duration_days > 0 and duration_days <= 365),
    budget_range text not null,
    itinerary_details jsonb not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists public.visa_checks (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id) on delete cascade not null,
    passport_country text not null,
    destination_country text not null,
    visa_result jsonb not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists public.document_checks (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id) on delete cascade not null,
    document_type text not null,
    file_name text not null,
    analysis_result jsonb not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.profiles enable row level security;
alter table public.travel_itineraries enable row level security;
alter table public.visa_checks enable row level security;
alter table public.document_checks enable row level security;

create policy "Users can perform CRUD on their own profile" on public.profiles for all using (auth.uid() = id) with check (auth.uid() = id);
create policy "Users can perform CRUD on their own itineraries" on public.travel_itineraries for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can perform CRUD on their own visa checks" on public.visa_checks for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can perform CRUD on their own document checks" on public.document_checks for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
`;

  const handleCopySql = () => {
    navigator.clipboard.writeText(sqlMigrationCode);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 space-y-10">
      {/* Title */}
      <div className="space-y-1">
        <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
          <Settings className="w-8 h-8 text-cyan-400" /> Traveler Settings & Security
        </h1>
        <p className="text-sm text-slate-400">
          Manage your traveler profile, inspect Row-Level Security, and verify backend integrations.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Profile Card */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-card p-6 md:p-8 border-slate-800 space-y-6">
            <h2 className="text-lg font-bold text-white flex items-center gap-2 pb-4 border-b border-slate-800">
              <User className="w-5 h-5 text-cyan-400" /> Traveler Profile
            </h2>

            {savedSuccess && (
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Profile updated successfully!</span>
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-900/80 border border-slate-700/80 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Home Passport Country (Used for automated visa calculations)
                </label>
                <input
                  type="text"
                  value={homeCountry}
                  onChange={(e) => setHomeCountry(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-900/80 border border-slate-700/80 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                  Registered Email Address (Read-Only)
                </label>
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="w-full px-4 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-sm text-slate-400 cursor-not-allowed"
                />
              </div>

              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl font-bold text-xs bg-cyan-500 hover:bg-cyan-400 text-navy-950 shadow-glow-cyan flex items-center gap-2 transition-all transform active:scale-95"
              >
                <Save className="w-4 h-4" /> Save Preferences
              </button>
            </form>
          </div>

          {/* Supabase Schema Reference Card */}
          <div className="glass-card p-6 md:p-8 border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Database className="w-5 h-5 text-indigo-400" /> PostgreSQL Database Schema (Supabase)
              </h2>
              <button
                onClick={handleCopySql}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all"
              >
                {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedSql ? 'Copied' : 'Copy SQL'}
              </button>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              To bind your real Supabase project, execute the SQL script in your Supabase SQL Editor. It enforces Row-Level Security policies so no user can access another's travel itineraries.
            </p>
            <pre className="p-3.5 rounded-xl bg-navy-950 border border-slate-800 text-[11px] font-mono text-slate-300 overflow-x-auto max-h-48 scrollbar-thin">
              {sqlMigrationCode}
            </pre>
          </div>
        </div>

        {/* Right Column: Security & System Integration Status */}
        <div className="space-y-6">
          <div className="glass-card p-6 border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-1">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" /> System Integration Status
              </h3>
              <button
                type="button"
                onClick={fetchHealth}
                disabled={isCheckingHealth}
                className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1.5 transition-colors disabled:opacity-50"
                title="Refresh Status"
              >
                <RefreshCw className={`w-3 h-3 ${isCheckingHealth ? 'animate-spin' : ''}`} />
                <span>{isCheckingHealth ? 'Checking...' : 'Refresh'}</span>
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {/* Backend Status */}
              <div className="p-3 rounded-xl bg-navy-950/80 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Server className="w-4 h-4 text-cyan-400" />
                  <span className="text-slate-300 font-medium">Express Backend</span>
                </div>
                <span className={`font-semibold flex items-center gap-1.5 ${
                  healthStatus?.status === 'healthy'
                    ? 'text-emerald-400'
                    : healthStatus?.status === 'offline'
                    ? 'text-rose-400'
                    : 'text-cyan-400'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    healthStatus?.status === 'healthy'
                      ? 'bg-emerald-400'
                      : healthStatus?.status === 'offline'
                      ? 'bg-rose-400 animate-pulse'
                      : 'bg-cyan-400 animate-ping'
                  }`} />
                  {healthStatus?.status === 'healthy'
                    ? 'Online (Port 5000)'
                    : healthStatus?.status === 'offline'
                    ? 'Offline (Not Started)'
                    : 'Verifying...'}
                </span>
              </div>

              {/* Gemini AI Status */}
              <div className="p-3 rounded-xl bg-navy-950/80 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-cyan-400" />
                  <span className="text-slate-300 font-medium">Gemini 3.8 Flash</span>
                </div>
                <span className={`font-semibold flex items-center gap-1.5 ${
                  healthStatus?.integrations?.geminiKeyConfigured !== false ? 'text-emerald-400' : 'text-slate-400'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    healthStatus?.integrations?.geminiKeyConfigured !== false ? 'bg-emerald-400' : 'bg-slate-400'
                  }`} />
                  {healthStatus?.integrations?.geminiKeyConfigured !== false ? 'Live API Key Connected' : 'Fallback Mode'}
                </span>
              </div>

              {/* Supabase Status */}
              <div className="p-3 rounded-xl bg-navy-950/80 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-indigo-400" />
                  <span className="text-slate-300 font-medium">Supabase RLS</span>
                </div>
                <span className={`font-semibold flex items-center gap-1 ${
                  isSupabaseConfigured ? 'text-emerald-400' : 'text-slate-400'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    isSupabaseConfigured ? 'bg-emerald-400' : 'bg-slate-400'
                  }`} />
                  {isSupabaseConfigured ? 'Connected (PostgreSQL)' : 'Local Memory Store'}
                </span>
              </div>
            </div>
          </div>

          {/* Session Details */}
          <div className="glass-card p-6 border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Lock className="w-4 h-4 text-cyan-400" /> Active Session
            </h3>

            <div className="space-y-2 text-xs">
              <div className="text-slate-400">
                Mode: <strong className="text-white">{isDemoUser ? 'Interactive Demo' : 'Live Supabase GoTrue'}</strong>
              </div>
              <div className="text-slate-400 truncate">
                User ID: <span className="font-mono text-cyan-300">{user?.id}</span>
              </div>
              <div className="text-slate-400">
                Token Type: <span className="font-mono text-slate-300">Bearer JWT</span>
              </div>
            </div>

            <button
              onClick={signOut}
              className="w-full mt-2 py-2.5 px-4 rounded-xl text-xs font-semibold text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 flex items-center justify-center gap-2 transition-colors"
            >
              <LogOut className="w-4 h-4" /> End Session & Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* Clear Differentiation: Frontend vs Backend Architecture Matrix */}
      <ArchitectureBoundaryCard />
    </div>
  );
};

