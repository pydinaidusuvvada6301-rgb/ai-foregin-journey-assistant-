import React, { useState } from 'react';
import { MobilityGlobe3D } from '../components/MobilityGlobe3D.js';
import { BilateralVisaTelemetry, GLOBAL_HUBS } from '../lib/mobility-data.js';
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
  HelpCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface PresetCorridor {
  originId: string;
  destId: string;
  label: string;
  category: string;
}

const PRESET_CORRIDORS: PresetCorridor[] = [
  { originId: 'nyc', destId: 'tyo', label: 'New York ➔ Tokyo', category: 'Transpacific' },
  { originId: 'lon', destId: 'sin', label: 'London ➔ Singapore', category: 'Euro-Asian Hub' },
  { originId: 'dxb', destId: 'syd', label: 'Dubai ➔ Sydney', category: 'Long-Haul Trans-Ocean' },
  { originId: 'sfo', destId: 'par', label: 'San Francisco ➔ Paris', category: 'Transatlantic' },
  { originId: 'fra', destId: 'del', label: 'Frankfurt ➔ New Delhi', category: 'Eurasia Gateway' },
  { originId: 'sin', destId: 'hnd', label: 'Singapore ➔ Tokyo', category: 'APAC Core' },
];

export const MobilityGlobePage: React.FC = () => {
  const [selectedPreset, setSelectedPreset] = useState<{ originId: string; destId: string }>({
    originId: 'nyc',
    destId: 'tyo',
  });
  const [telemetry, setTelemetry] = useState<BilateralVisaTelemetry | null>(null);

  const handleSelectPreset = (preset: PresetCorridor) => {
    setSelectedPreset({ originId: preset.originId, destId: preset.destId });
  };

  return (
    <div className="min-h-screen bg-navy-950 text-slate-100 py-6 sm:py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 sm:space-y-8">
        {/* Top Header & Overview */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-slate-800/80">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5 animate-pulse" />
              <span>Three.js WebGL Global Mobility Engine</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white flex items-center gap-3">
              <span>Interactive 3D Flight & Visa Globe</span>
              <Globe className="w-7 h-7 sm:w-8 sm:h-8 text-cyan-400 animate-spin-slow" />
            </h1>
            <p className="mt-2 text-sm sm:text-base text-slate-400 max-w-3xl">
              Rotate, zoom, and explore global flight corridors in real-time 3D. Inspect great-circle geodesics,
              calculate flight hours, and cross-reference bilateral sovereign visa policies with one click.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link
              to="/visa-checker"
              className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs sm:text-sm font-semibold text-slate-300 hover:text-white transition-all flex items-center gap-2 shadow-sm"
            >
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              <span>Full Visa Wizard</span>
            </Link>
            <Link
              to="/itinerary"
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-xs sm:text-sm font-semibold text-navy-950 shadow-glow-cyan transition-all flex items-center gap-2 transform active:scale-95"
            >
              <Compass className="w-4 h-4" />
              <span>Plan Journey</span>
            </Link>
          </div>
        </div>

        {/* Quick Corridor Selection Bar */}
        <div className="bg-slate-900/60 p-3 sm:p-4 rounded-2xl border border-slate-800/80">
          <div className="flex items-center justify-between gap-2 mb-2.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              <span>Popular Global Corridors</span>
            </div>
            <span className="text-[11px] text-slate-500 hidden sm:inline">Click any corridor to instantly swing the 3D globe</span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-slate-800">
            {PRESET_CORRIDORS.map((preset) => {
              const isActive =
                selectedPreset.originId === preset.originId && selectedPreset.destId === preset.destId;
              return (
                <button
                  key={`${preset.originId}-${preset.destId}`}
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

        {/* The 3D Interactive WebGL Globe */}
        <div className="relative">
          <MobilityGlobe3D
            key={`${selectedPreset.originId}-${selectedPreset.destId}`}
            initialOriginId={selectedPreset.originId}
            initialDestId={selectedPreset.destId}
            onSelectCorridor={(telemetryData) => setTelemetry(telemetryData)}
          />
        </div>

        {/* Technical Architecture & Intelligence Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800/80 hover:border-cyan-500/30 transition-all">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-3">
              <Compass className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white mb-1.5">Great-Circle Geodesics</h3>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Flight trajectories are computed along spherical geodesic curves. The 3D arc dynamically arches into the
              upper atmosphere, accounting for orbital altitudes and flight corridor geometry.
            </p>
          </div>

          <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800/80 hover:border-cyan-500/30 transition-all">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-3">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white mb-1.5">Sovereign Treaty Cross-Referencing</h3>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Every origin-destination pair cross-references bilateral visa exemption rules, Schengen 90/180 windows,
              eVisa portals, and consular application requirements with official links.
            </p>
          </div>

          <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800/80 hover:border-cyan-500/30 transition-all">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-3">
              <MapPin className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white mb-1.5">Browser GPS Synchronization</h3>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Use the built-in "Detect GPS" button to seamlessly anchor the origin hub to your current location.
              Strictly client-side with explicit browser consent and server-side reverse geocoding.
            </p>
          </div>
        </div>

        {/* Global Hub Reference List */}
        <div className="bg-slate-900/40 p-5 rounded-2xl border border-slate-800/80">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-300 flex items-center gap-2">
              <Globe className="w-4 h-4 text-cyan-400" />
              <span>Available High-Capacity Global Gateways ({GLOBAL_HUBS.length} Air Hubs)</span>
            </h3>
            <span className="text-xs text-slate-500">Includes major Star Alliance, oneworld & SkyTeam hubs</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 text-xs">
            {GLOBAL_HUBS.map((hub) => (
              <div
                key={hub.id}
                onClick={() => {
                  setSelectedPreset((prev) => ({ ...prev, destId: hub.id }));
                }}
                className="p-2.5 rounded-xl bg-slate-900/80 hover:bg-cyan-500/10 hover:border-cyan-500/40 border border-slate-800 cursor-pointer transition-all group"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono font-bold text-cyan-400 group-hover:text-cyan-300">{hub.code}</span>
                  <span className="text-[10px] text-slate-500">{hub.country}</span>
                </div>
                <div className="text-slate-300 font-medium truncate">{hub.name}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
