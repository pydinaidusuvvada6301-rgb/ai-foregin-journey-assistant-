import React from 'react';
import { Plane, ShieldCheck, QrCode, CheckCircle2, Sparkles, Globe2 } from 'lucide-react';
import { Card3D } from './Card3D.js';

export const FloatingPassport3D: React.FC = () => {
  return (
    <div className="relative w-full max-w-md mx-auto">
      {/* Ambient 3D Neon Backlight */}
      <div className="absolute -inset-4 bg-gradient-to-tr from-cyan-500/25 via-indigo-600/20 to-emerald-500/20 rounded-3xl blur-2xl opacity-75 -z-10 animate-pulse" />

      <Card3D depth={18} glowColor="rgba(56, 189, 248, 0.35)">
        <div className="p-6 md:p-8 bg-gradient-to-br from-navy-900/95 via-navy-950/95 to-slate-950 border border-cyan-500/30 rounded-2xl space-y-6 text-white backdrop-blur-2xl">
          {/* Header Strip with Hologram Badge */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <Globe2 className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-mono tracking-widest uppercase text-cyan-400 block font-bold">
                  GLOBAL MOBILITY PASSPORT
                </span>
                <span className="text-xs font-bold text-slate-200">ICAO 9303 Electronic Vault</span>
              </div>
            </div>

            {/* Shimmering Holographic Security Chip */}
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-gradient-to-r from-amber-400/20 via-cyan-400/20 to-purple-400/20 border border-cyan-400/40 text-[10px] font-mono text-cyan-300 font-bold shadow-glow-cyan animate-pulse">
              <Sparkles className="w-3 h-3 text-amber-300" />
              <span>BIOMETRIC</span>
            </div>
          </div>

          {/* Traveler Bio Snapshot */}
          <div className="grid grid-cols-3 gap-4 items-center">
            {/* Bio Photo Placeholder */}
            <div className="w-20 h-24 rounded-xl bg-gradient-to-b from-slate-800 to-navy-900 border border-slate-700/80 flex flex-col items-center justify-center text-center p-2 relative overflow-hidden group">
              <div className="w-10 h-10 rounded-full bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300 font-bold text-sm mb-1">
                AV
              </div>
              <span className="text-[9px] font-mono text-slate-400">VERIFIED</span>
              <div className="absolute inset-x-0 bottom-0 py-0.5 bg-emerald-500/20 text-emerald-400 text-[8px] font-mono font-bold">
                VALID 10Y
              </div>
            </div>

            {/* Passport Identity Details */}
            <div className="col-span-2 space-y-2 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-mono block">Document Holder</span>
                <span className="font-bold text-sm text-white">ALEX VANCE</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">Nationality</span>
                  <span className="font-semibold text-slate-200">UNITED STATES</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">Expiry Date</span>
                  <span className="font-semibold text-emerald-400">2034-08-15</span>
                </div>
              </div>
            </div>
          </div>

          {/* Live Consular Clearance Status */}
          <div className="p-3.5 rounded-xl bg-navy-950/80 border border-cyan-500/20 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400">Current Destination:</span>
              <span className="text-cyan-300 font-bold flex items-center gap-1">
                <Plane className="w-3.5 h-3.5 text-cyan-400" /> Tokyo (HND)
              </span>
            </div>
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400">Visa Regime:</span>
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Visa Free (90 Days)
              </span>
            </div>
          </div>

          {/* Machine Readable Zone (MRZ) */}
          <div className="pt-2 border-t border-slate-800 font-mono text-[10px] tracking-wider text-slate-400 bg-slate-950/50 p-2.5 rounded-lg border border-slate-900 select-none">
            <div className="text-cyan-300/80">P&lt;USAVANCE&lt;&lt;ALEX&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;</div>
            <div className="text-slate-400/80">9834720912USA9408124M3408156&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;02</div>
          </div>
        </div>
      </Card3D>
    </div>
  );
};
