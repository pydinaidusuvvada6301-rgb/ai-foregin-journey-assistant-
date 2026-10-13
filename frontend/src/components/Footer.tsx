import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Cpu, Database, Lock, Plane } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-slate-800/80 bg-navy-950/90 py-12 px-4 sm:px-6 lg:px-8 mt-auto">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand Info */}
          <div className="md:col-span-2 space-y-4">
            <Link to="/" className="flex items-center gap-2.5 group w-fit">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-white transition-transform group-hover:scale-105">
                <Plane className="w-4 h-4 transform -rotate-45" />
              </div>
              <span className="text-base font-bold text-white tracking-tight">
                VisaVoyage <span className="text-cyan-400 font-mono text-xs">AI</span>
              </span>
            </Link>
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
                Gemini 3.8 Flash SDK
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
              <li><Link to="/itinerary" className="hover:text-cyan-400 transition-colors">AI Itinerary Planner</Link></li>
              <li><Link to="/visa-checker" className="hover:text-cyan-400 transition-colors">Global Visa Policy Matrix</Link></li>
              <li><Link to="/document-analyzer" className="hover:text-cyan-400 transition-colors">Passport & MRZ Scanner</Link></li>
              <li><Link to="/dashboard" className="hover:text-cyan-400 transition-colors">Traveler Command Center</Link></li>
            </ul>
          </div>

          {/* Compliance & Security */}
          <div>
            <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-3">Security & Trust</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-emerald-400" /> ICAO 9303 Standard</li>
              <li className="flex items-center gap-1.5"><Lock className="w-4 h-4 text-cyan-400" /> 256-Bit SSL Protection</li>
              <li className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-indigo-400" /> Biometric Privacy Protocol</li>
              <li className="flex items-center gap-1.5"><Database className="w-4 h-4 text-emerald-400" /> Encrypted Cloud Vault</li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-4">
          <p>© {new Date().getFullYear()} VisaVoyage AI. Autonomous Global Travel Mobility.</p>
          <p className="flex items-center gap-2">
            <span className="text-cyan-400 font-mono text-[11px]">Consular Network Active</span>
            <span>•</span>
            <span className="text-emerald-400 font-mono text-[11px]">195+ Jurisdictions</span>
          </p>
        </div>
      </div>
    </footer>
  );
};
