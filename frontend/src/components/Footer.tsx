import React from 'react';
import { ShieldCheck, Cpu, Database, Lock, Plane } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-slate-800/80 bg-navy-950/90 py-12 px-4 sm:px-6 lg:px-8 mt-auto">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand Info */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-white">
                <Plane className="w-4 h-4 transform -rotate-45" />
              </div>
              <span className="text-base font-bold text-white tracking-tight">
                VisaVoyage <span className="text-cyan-400 font-mono text-xs">AI</span>
              </span>
            </div>
            <p className="text-sm text-slate-400 max-w-md leading-relaxed">
              Autonomous foreign journey planning, immigration policy intelligence, and multimodal travel compliance assessment for international travelers and digital nomads.
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium bg-slate-900 border border-slate-800 text-slate-400">
                <Database className="w-3 h-3 text-emerald-400" />
                PostgreSQL RLS Isolated
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium bg-slate-900 border border-slate-800 text-slate-400">
                <Cpu className="w-3 h-3 text-cyan-400" />
                Gemini 2.5 Flash SDK
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium bg-slate-900 border border-slate-800 text-slate-400">
                <Lock className="w-3 h-3 text-indigo-400" />
                Zero-Client Key Exposure
              </span>
            </div>
          </div>

          {/* Core Modules */}
          <div>
            <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-3">Core Modules</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><a href="/itinerary" className="hover:text-cyan-400 transition-colors">AI Itinerary Planner</a></li>
              <li><a href="/visa-checker" className="hover:text-cyan-400 transition-colors">Global Visa Policy Matrix</a></li>
              <li><a href="/document-analyzer" className="hover:text-cyan-400 transition-colors">Passport & MRZ Scanner</a></li>
              <li><a href="/dashboard" className="hover:text-cyan-400 transition-colors">Traveler Command Center</a></li>
            </ul>
          </div>

          {/* Compliance & Security */}
          <div>
            <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-3">Security & Trust</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-emerald-400" /> ICAO 9303 Standard</li>
              <li className="flex items-center gap-1.5"><Lock className="w-4 h-4 text-cyan-400" /> Supabase JWT Bearer Auth</li>
              <li className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-indigo-400" /> Express Helmet & Rate Limiting</li>
              <li className="flex items-center gap-1.5"><Database className="w-4 h-4 text-emerald-400" /> Row-Level User Isolation</li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-4">
          <p>© {new Date().getFullYear()} VisaVoyage AI. Built for secure global travel advisory.</p>
          <p className="flex items-center gap-2">
            <span>Server: Node.js/Express ESM</span>
            <span>•</span>
            <span>Client: React/Vite/Tailwind</span>
          </p>
        </div>
      </div>
    </footer>
  );
};
