import React from 'react';
import {
  ShieldCheck,
  Lock,
  Globe,
  Award,
  CheckCircle2,
  FileCheck,
  Check
} from 'lucide-react';

export const ArchitectureBoundaryCard: React.FC = () => {
  return (
    <div className="glass-card p-6 md:p-8 space-y-6 border-slate-800 bg-navy-950/80">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="glass-pill text-cyan-400 border-cyan-500/30 flex items-center gap-1 font-mono text-[11px]">
              <ShieldCheck className="w-3.5 h-3.5" /> Global Mobility Standards
            </span>
            <span className="glass-pill text-emerald-400 border-emerald-500/30 font-mono text-[11px]">
              Bank-Grade Privacy
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
            Security & Compliance Infrastructure
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Built with strict client-to-cloud encryption, biometric data privacy, and direct consular integration.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
          <div className="w-9 h-9 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Lock className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-white">Encrypted Cloud Vault</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            All itineraries, travel dates, and personal profile information are protected with AES-256 encryption.
          </p>
          <ul className="space-y-1 text-xs text-slate-300 pt-2">
            <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-cyan-400" /> Isolated user data partitions</li>
            <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-cyan-400" /> Zero third-party ad tracking</li>
          </ul>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Award className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-white">ICAO 9303 Compliance</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Document scanning uses optical verification matching the international standards established for biometric travel passports.
          </p>
          <ul className="space-y-1 text-xs text-slate-300 pt-2">
            <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-indigo-400" /> MRZ optical checksum checks</li>
            <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-indigo-400" /> 6-month international validity rule</li>
          </ul>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Globe className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-white">Official Consular Rules</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Rules engine constantly updates with entry policies, e-Visa systems, visa-free waivers, and arrival card protocols across 195+ jurisdictions.
          </p>
          <ul className="space-y-1 text-xs text-slate-300 pt-2">
            <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-400" /> Real-time stay duration calculations</li>
            <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-400" /> Solvency proof guidelines</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
