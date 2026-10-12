import React from 'react';
import {
  Monitor,
  Server,
  Database,
  ArrowRight,
  ShieldCheck,
  Lock,
  Cpu,
  Key,
  Layers,
  CheckCircle2,
  XCircle
} from 'lucide-react';

export const ArchitectureBoundaryCard: React.FC = () => {
  return (
    <div className="glass-card p-6 md:p-8 space-y-8 border-slate-800">
      {/* Title & Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="glass-pill text-cyan-400 border-cyan-500/30 flex items-center gap-1 font-mono text-[11px]">
              <Layers className="w-3 h-3" /> System Architecture Matrix
            </span>
            <span className="glass-pill text-emerald-400 border-emerald-500/30 font-mono text-[11px]">
              Strict Boundary Isolation
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
            Frontend vs. Backend Architectural Boundary
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Complete physical and logical isolation between browser rendering, server-side AI processing, and database persistence.
          </p>
        </div>
      </div>

      {/* Visual Comparison Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 relative">
        {/* FRONTEND CARD */}
        <div className="rounded-2xl p-6 bg-gradient-to-b from-navy-900/90 to-navy-950/90 border border-cyan-500/30 space-y-5 shadow-glow-cyan relative overflow-hidden">
          <div className="absolute top-0 right-0 px-3 py-1 bg-cyan-500/20 text-cyan-300 font-mono text-[10px] font-bold rounded-bl-xl border-l border-b border-cyan-500/30">
            CLIENT TIER (PORT 5173)
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
              <Monitor className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Frontend (Client)</h3>
              <p className="text-xs text-slate-400">Browser Environment (React 18 + Vite)</p>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div className="font-semibold text-slate-300 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" /> Authorized Responsibilities:
            </div>
            <ul className="space-y-1.5 text-slate-300 pl-1">
              <li className="flex items-start gap-2">
                <span className="text-cyan-400 font-bold">•</span>
                <span>User Interface (UI) rendering, interactive forms & visual cards</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cyan-400 font-bold">•</span>
                <span>Client-side routing via React Router DOM</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cyan-400 font-bold">•</span>
                <span>Supabase GoTrue Auth token management (JWT storage)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cyan-400 font-bold">•</span>
                <span>Axios API client attaching <code className="text-cyan-300">Authorization: Bearer &lt;JWT&gt;</code></span>
              </li>
            </ul>

            <div className="pt-2 border-t border-slate-800/80">
              <div className="font-semibold text-rose-400 uppercase tracking-wider text-[11px] flex items-center gap-1.5 mb-1.5">
                <XCircle className="w-3.5 h-3.5 text-rose-400" /> Strict Security Prohibitions:
              </div>
              <ul className="space-y-1 text-slate-400 pl-1">
                <li className="flex items-start gap-2">
                  <span className="text-rose-400">✕</span>
                  <span><strong>NO</strong> Gemini API key in client bundle or memory</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-400">✕</span>
                  <span><strong>NO</strong> direct Google GenAI SDK calls</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-400">✕</span>
                  <span><strong>NO</strong> Supabase Service Role key exposure</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* BACKEND CARD */}
        <div className="rounded-2xl p-6 bg-gradient-to-b from-navy-900/90 to-navy-950/90 border border-indigo-500/30 space-y-5 shadow-glow-indigo relative overflow-hidden">
          <div className="absolute top-0 right-0 px-3 py-1 bg-indigo-500/20 text-indigo-300 font-mono text-[10px] font-bold rounded-bl-xl border-l border-b border-indigo-500/30">
            SERVER TIER (PORT 5000)
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Backend (Server)</h3>
              <p className="text-xs text-slate-400">Isolated Runtime (Node.js + Express + ESM)</p>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div className="font-semibold text-slate-300 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" /> Authorized Responsibilities:
            </div>
            <ul className="space-y-1.5 text-slate-300 pl-1">
              <li className="flex items-start gap-2">
                <span className="text-indigo-400 font-bold">•</span>
                <span>Server-side JWT token verification (<code className="text-indigo-300">requireAuth</code> middleware)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-400 font-bold">•</span>
                <span>Payload validation with Zod schemas before AI orchestration</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-400 font-bold">•</span>
                <span>Exclusive host of <code className="text-indigo-300">@google/genai</code> SDK &amp; <code className="text-indigo-300">GEMINI_API_KEY</code></span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-400 font-bold">•</span>
                <span>Multer file upload handling for multimodal document vision checks</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-400 font-bold">•</span>
                <span>PostgreSQL database operations enforcing user ID isolation</span>
              </li>
            </ul>

            <div className="pt-2 border-t border-slate-800/80">
              <div className="font-semibold text-emerald-400 uppercase tracking-wider text-[11px] flex items-center gap-1.5 mb-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Security Hardening:
              </div>
              <ul className="space-y-1 text-slate-400 pl-1">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400">✓</span>
                  <span>Helmet HTTP security headers &amp; Cross-Origin Resource Policy</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400">✓</span>
                  <span>Express-rate-limit brute force protection (150 req/15min)</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Contract & Communication Bridge */}
      <div className="p-5 rounded-2xl bg-navy-950/70 border border-slate-800 space-y-3">
        <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
          <Key className="w-4 h-4 text-cyan-400" /> The Secure Bridge: Authenticated API Contract
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-mono">
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
            <span className="text-cyan-400 block font-bold">1. Client Request</span>
            <span className="text-slate-400 block">HTTP POST with JWT</span>
            <code className="text-[11px] text-slate-300 block truncate">Authorization: Bearer &lt;TOKEN&gt;</code>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
            <span className="text-indigo-400 block font-bold">2. Server Middleware</span>
            <span className="text-slate-400 block">Supabase GoTrue Auth</span>
            <code className="text-[11px] text-slate-300 block">req.user = &#123; id: auth.uid() &#125;</code>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
            <span className="text-emerald-400 block font-bold">3. Database Isolation</span>
            <span className="text-slate-400 block">PostgreSQL RLS Engine</span>
            <code className="text-[11px] text-slate-300 block">USING (auth.uid() = user_id)</code>
          </div>
        </div>
      </div>
    </div>
  );
};
