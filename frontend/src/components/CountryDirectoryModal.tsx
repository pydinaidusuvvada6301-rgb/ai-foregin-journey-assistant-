import React, { useState, useMemo } from 'react';
import {
  CountryDirectoryItem,
  COUNTRIES,
  CONTINENTS,
  ContinentFilter,
  searchCountries
} from '../lib/country-directory.js';
import {
  Search,
  X,
  Globe,
  MapPin,
  Phone,
  Coins,
  ExternalLink,
  Check,
  ArrowUpDown,
  Filter,
  Languages,
  ShieldCheck,
  Sparkles
} from 'lucide-react';

interface CountryDirectoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCountry: (country: CountryDirectoryItem, mode: 'destination' | 'origin') => void;
  initialMode?: 'destination' | 'origin';
  selectedDestinationCca2?: string;
  selectedOriginCca2?: string;
}

export const CountryDirectoryModal: React.FC<CountryDirectoryModalProps> = ({
  isOpen,
  onClose,
  onSelectCountry,
  initialMode = 'destination',
  selectedDestinationCca2,
  selectedOriginCca2
}) => {
  const [mode, setMode] = useState<'destination' | 'origin'>(initialMode);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedContinent, setSelectedContinent] = useState<ContinentFilter>('All');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Sync mode if initialMode changes
  React.useEffect(() => {
    setMode(initialMode);
  }, [initialMode, isOpen]);

  // Filtered and sorted countries
  const countries = useMemo(() => {
    return searchCountries(searchQuery, selectedContinent, sortOrder);
  }, [searchQuery, selectedContinent, sortOrder]);

  // Autocomplete suggestions while typing (top 4 matches)
  const suggestions = useMemo(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) return [];
    return countries.slice(0, 4);
  }, [searchQuery, countries]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="country-directory-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-navy-950/80 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-5xl max-h-[92vh] flex flex-col bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="p-4 sm:p-6 border-b border-slate-800 bg-slate-900/90 backdrop-blur-sm space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <Globe className="w-5 h-5 animate-spin-slow" />
              </div>
              <div>
                <h2 id="country-directory-title" className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                  <span>Global Sovereign Country Directory</span>
                  <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                    {COUNTRIES.length} Sovereign Territories
                  </span>
                </h2>
                <p className="text-xs text-slate-400">
                  Search all ISO 3166-1 nations with live currencies, capitals, dialing codes, and official consular portals.
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all"
              aria-label="Close country directory"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Mode Switcher: Destination vs Origin */}
          <div className="flex items-center justify-between flex-wrap gap-3 pt-1">
            <div className="inline-flex p-1 rounded-xl bg-navy-950 border border-slate-800 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setMode('destination')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  mode === 'destination'
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>Select Destination</span>
              </button>
              <button
                type="button"
                onClick={() => setMode('origin')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  mode === 'origin'
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Select Origin / Passport</span>
              </button>
            </div>

            {/* Sort Toggle */}
            <button
              type="button"
              onClick={() => setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'))}
              className="px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-xs text-slate-300 border border-slate-700 flex items-center gap-1.5 transition-all"
              title="Toggle Alphabetical Sorting"
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-cyan-400" />
              <span>Sort: {sortOrder === 'asc' ? 'A ➔ Z' : 'Z ➔ A'}</span>
            </button>
          </div>

          {/* Search Bar & Auto-Suggestions */}
          <div className="relative">
            <div className="relative flex items-center">
              <Search className="absolute left-4 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by country name, capital, ISO code (e.g. AU, JPN), or currency (e.g. AUD, EUR)..."
                className="w-full pl-11 pr-10 py-3 bg-navy-950/90 border border-slate-700/80 rounded-2xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-all"
                autoFocus
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 p-1 rounded-lg text-slate-400 hover:text-white"
                  aria-label="Clear search query"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Autocomplete Quick Suggestions */}
            {suggestions.length > 0 && (
              <div className="flex items-center gap-2 mt-2 text-xs flex-wrap">
                <span className="text-slate-500 flex items-center gap-1 font-medium">
                  <Sparkles className="w-3 h-3 text-cyan-400" /> Suggestions:
                </span>
                {suggestions.map((c) => (
                  <button
                    key={c.cca2}
                    type="button"
                    onClick={() => {
                      onSelectCountry(c, mode);
                      onClose();
                    }}
                    className="px-2.5 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 flex items-center gap-1.5 transition-all"
                  >
                    <span>{c.flag}</span>
                    <span className="font-semibold">{c.name}</span>
                    <span className="text-[10px] text-slate-400 font-mono">({c.cca2})</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Continent Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
            <span className="text-xs text-slate-400 flex items-center gap-1 mr-1 shrink-0">
              <Filter className="w-3 h-3 text-cyan-400" /> Continent:
            </span>
            {CONTINENTS.map((cont) => {
              const isActive = selectedContinent === cont;
              return (
                <button
                  key={cont}
                  type="button"
                  onClick={() => setSelectedContinent(cont)}
                  className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                      : 'bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700/50'
                  }`}
                >
                  {cont}
                </button>
              );
            })}
          </div>
        </div>

        {/* Countries Grid Viewport */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {countries.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-slate-800 flex items-center justify-center text-slate-500">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-white">No countries match your search</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                No sovereign nation matches "{searchQuery}". Try searching by continent or clear filters.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedContinent('All');
                }}
                className="px-4 py-2 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-xs font-bold hover:bg-cyan-500/30 transition-all"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {countries.map((country) => {
                const isSelectedDest = selectedDestinationCca2 === country.cca2;
                const isSelectedOrig = selectedOriginCca2 === country.cca2;
                const isCurrentModeSelected = mode === 'destination' ? isSelectedDest : isSelectedOrig;

                return (
                  <div
                    key={country.cca2}
                    className={`p-4 rounded-2xl border transition-all flex flex-col justify-between group ${
                      isCurrentModeSelected
                        ? mode === 'destination'
                          ? 'bg-purple-950/30 border-purple-500/60 shadow-glow-indigo'
                          : 'bg-cyan-950/30 border-cyan-500/60 shadow-glow-cyan'
                        : 'bg-navy-950/60 hover:bg-slate-800/50 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="space-y-2.5">
                      {/* Flag, Name, ISO Badges */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <span className="text-2xl sm:text-3xl select-none" role="img" aria-label={country.name}>
                            {country.flag}
                          </span>
                          <div>
                            <h3 className="text-sm sm:text-base font-bold text-white group-hover:text-cyan-300 transition-colors">
                              {country.name}
                            </h3>
                            <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                              <span>{country.continent}</span>
                              <span>•</span>
                              <span className="truncate max-w-[120px]">{country.region}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-1">
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                            {country.cca2} / {country.cca3}
                          </span>
                          {country.callingCode && (
                            <span className="text-[10px] font-mono text-cyan-400 flex items-center gap-0.5">
                              <Phone className="w-2.5 h-2.5" />
                              {country.callingCode}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Capital, Languages, Currency Matrix */}
                      <div className="pt-2 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-[11px]">
                        <div>
                          <span className="text-[10px] text-slate-500 block">Capital</span>
                          <span className="font-medium text-slate-200 truncate flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                            {country.capital || 'N/A'}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 block">Currency</span>
                          <span className="font-medium text-amber-300 truncate flex items-center gap-1">
                            <Coins className="w-3 h-3 text-amber-400 shrink-0" />
                            {country.currencies.map(c => `${c.code} (${c.symbol})`).join(', ')}
                          </span>
                        </div>
                      </div>

                      {/* Languages */}
                      <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                        <Languages className="w-3 h-3 text-slate-500 shrink-0" />
                        <span className="truncate">{country.languages.join(', ')}</span>
                      </div>
                    </div>

                    {/* Action Bar */}
                    <div className="mt-3.5 pt-2.5 border-t border-slate-800 flex items-center justify-between gap-2">
                      <a
                        href={country.officialImmigrationUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] text-cyan-400 hover:text-cyan-300 hover:underline flex items-center gap-1 transition-colors"
                        title={`Visit official government portal for ${country.name}`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <span>Official Portal</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>

                      <button
                        type="button"
                        onClick={() => {
                          onSelectCountry(country, mode);
                          onClose();
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                          mode === 'destination'
                            ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-sm'
                            : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-sm'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Select {mode === 'destination' ? 'Dest' : 'Origin'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer Info */}
        <div className="p-3 sm:p-4 border-t border-slate-800 bg-navy-950/80 flex items-center justify-between text-xs text-slate-400">
          <span>Showing {countries.length} of {COUNTRIES.length} sovereign territories</span>
          <span className="hidden sm:inline text-slate-500">ISO 3166-1 Standard Matrix • Bilateral Verified Data</span>
        </div>
      </div>
    </div>
  );
};
