import React, { useState, useEffect, useMemo } from 'react';
import { CountryDirectoryItem } from '../lib/country-directory.js';
import { fetchExchangeRates, CurrencyRatesResponse } from '../lib/api.js';
import {
  Coins,
  ArrowRightLeft,
  Clock,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  TrendingUp,
  Sparkles
} from 'lucide-react';

interface CurrencyConverterCardProps {
  country?: CountryDirectoryItem | null;
  originCountry?: CountryDirectoryItem | null;
  className?: string;
}

const COMMON_CURRENCIES = [
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
  { code: 'AUD', name: 'Australian Dollar', symbol: '$' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: '$' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
  { code: 'SGD', name: 'Singapore Dollar', symbol: '$' },
  { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ' }
];

export const CurrencyConverterCard: React.FC<CurrencyConverterCardProps> = ({
  country,
  originCountry,
  className = ''
}) => {
  // Available currencies for the selected country (supports multiple accepted currencies)
  const countryCurrencies = useMemo(() => {
    return country?.currencies && country.currencies.length > 0
      ? country.currencies
      : [{ code: 'USD', name: 'US Dollar', symbol: '$' }];
  }, [country]);

  // Selected base (from) and target (to) currencies
  const [baseCurrency, setBaseCurrency] = useState<string>(
    originCountry?.currencies?.[0]?.code || 'USD'
  );
  const [targetCurrency, setTargetCurrency] = useState<string>(
    countryCurrencies[0]?.code || 'AUD'
  );
  const [amount, setAmount] = useState<number | string>(100);

  // Exchange rates state
  const [ratesData, setRatesData] = useState<CurrencyRatesResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Recently used conversions
  const [recentConversions, setRecentConversions] = useState<
    Array<{ from: string; to: string; rate: number }>
  >([]);

  // Update target currency when selected country changes
  useEffect(() => {
    if (countryCurrencies.length > 0) {
      setTargetCurrency(countryCurrencies[0].code);
    }
  }, [country, countryCurrencies]);

  // Update base currency when origin country changes
  useEffect(() => {
    if (originCountry?.currencies?.[0]?.code) {
      setBaseCurrency(originCountry.currencies[0].code);
    }
  }, [originCountry]);

  // Fetch exchange rates from backend service
  const loadRates = async (base: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchExchangeRates(base);
      setRatesData(data);
    } catch (err: any) {
      console.warn('[Currency] Failed to fetch live exchange rates:', err);
      setError('Live provider temporarily unreachable. Showing baseline rates.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRates(baseCurrency);
  }, [baseCurrency]);

  // Calculate conversion
  const exchangeRate = useMemo(() => {
    if (!ratesData?.rates) return 1.0;
    const rate = ratesData.rates[targetCurrency];
    return typeof rate === 'number' && rate > 0 ? rate : 1.0;
  }, [ratesData, targetCurrency]);

  const convertedResult = useMemo(() => {
    const num = typeof amount === 'number' ? amount : parseFloat(amount) || 0;
    return (num * exchangeRate).toFixed(2);
  }, [amount, exchangeRate]);

  // Handle currency swap
  const handleSwap = () => {
    const prevBase = baseCurrency;
    const prevTarget = targetCurrency;
    setBaseCurrency(prevTarget);
    setTargetCurrency(prevBase);

    // Save to recent
    setRecentConversions((prev) => {
      const filtered = prev.filter((c) => !(c.from === prevBase && c.to === prevTarget));
      return [{ from: prevBase, to: prevTarget, rate: exchangeRate }, ...filtered].slice(0, 3);
    });
  };

  return (
    <div className={`p-4 sm:p-5 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Coins className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span>Currency Exchange & Conversion</span>
              {country && (
                <span className="text-xs font-normal text-slate-400">
                  for {country.flag} {country.name}
                </span>
              )}
            </h3>
            <div className="flex items-center gap-2 text-[11px] text-slate-400">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-500" />
                Updated: {ratesData?.lastUpdated ? new Date(ratesData.lastUpdated).toLocaleDateString() : 'Real-time'}
              </span>
              <span>•</span>
              <span className={`inline-flex items-center gap-1 font-semibold ${ratesData?.isStale ? 'text-amber-400' : 'text-emerald-400'}`}>
                {ratesData?.isStale ? (
                  <>
                    <AlertCircle className="w-3 h-3" /> Cached Baseline
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3 h-3" /> Live Market Rate
                  </>
                )}
              </span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => loadRates(baseCurrency)}
          className={`p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all ${
            loading ? 'animate-spin text-cyan-400' : ''
          }`}
          title="Refresh Exchange Rates"
          aria-label="Refresh Exchange Rates"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Country Accepted Currencies Info Notice */}
      {country && (
        <div className="p-2.5 rounded-xl bg-navy-950/70 border border-slate-800 flex items-center justify-between flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-1.5 text-slate-300">
            <span className="text-slate-500">Legal Currency:</span>
            {countryCurrencies.map((c) => (
              <span key={c.code} className="px-2 py-0.5 rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/30 font-mono font-bold">
                {c.name} ({c.code} • {c.symbol})
              </span>
            ))}
          </div>
          {countryCurrencies.length > 1 && (
            <span className="text-[11px] text-cyan-400 font-medium">
              Multiple accepted legal currencies
            </span>
          )}
        </div>
      )}

      {/* Conversion Calculator Form */}
      <div className="grid grid-cols-1 md:grid-cols-7 gap-3 items-center">
        {/* Amount & Base Currency */}
        <div className="md:col-span-3 space-y-1.5">
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            You Send ({baseCurrency})
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="0"
              step="any"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-navy-950 border border-slate-700 rounded-xl text-sm font-bold text-white focus:outline-none focus:border-cyan-500"
              placeholder="100"
            />
            <select
              value={baseCurrency}
              onChange={(e) => setBaseCurrency(e.target.value)}
              className="px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold text-cyan-300 focus:outline-none focus:border-cyan-500 font-mono"
            >
              {COMMON_CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code} ({c.symbol})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Swap Button */}
        <div className="flex items-center justify-center pt-4 md:pt-0">
          <button
            type="button"
            onClick={handleSwap}
            className="p-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-cyan-500 text-slate-300 hover:text-cyan-300 transition-all hover:rotate-180 duration-300 shadow-sm"
            title="Swap Currencies"
            aria-label="Swap Currencies"
          >
            <ArrowRightLeft className="w-4 h-4" />
          </button>
        </div>

        {/* Converted Amount & Target Currency */}
        <div className="md:col-span-3 space-y-1.5">
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Converted Result ({targetCurrency})
          </label>
          <div className="flex items-center gap-2">
            <div className="w-full px-3.5 py-2.5 bg-navy-950 border border-slate-700/80 rounded-xl text-sm font-extrabold text-emerald-400 truncate flex items-center justify-between">
              <span>{convertedResult}</span>
              <span className="text-xs text-slate-500 font-mono font-medium">{targetCurrency}</span>
            </div>
            <select
              value={targetCurrency}
              onChange={(e) => setTargetCurrency(e.target.value)}
              className="px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold text-purple-300 focus:outline-none focus:border-purple-500 font-mono"
            >
              {/* Country currencies first if available */}
              {countryCurrencies.map((c) => (
                <option key={`dest-${c.code}`} value={c.code}>
                  {c.code} ({c.symbol})
                </option>
              ))}
              {/* Then common global currencies */}
              {COMMON_CURRENCIES.filter(
                (c) => !countryCurrencies.some((cc) => cc.code === c.code)
              ).map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code} ({c.symbol})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Exchange Rate Summary Bar */}
      <div className="p-3 rounded-2xl bg-slate-800/40 border border-slate-800 flex items-center justify-between flex-wrap gap-2 text-xs">
        <div className="flex items-center gap-1.5 font-mono text-slate-300">
          <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
          <span>1 {baseCurrency} = </span>
          <span className="font-bold text-white">{exchangeRate.toFixed(4)} {targetCurrency}</span>
        </div>
        <div className="text-[11px] text-slate-500">
          Source: {ratesData?.provider || 'Bilateral Forex Gateway'}
        </div>
      </div>

      {/* Common Currency Quick Chips */}
      <div className="space-y-1.5 pt-1">
        <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-bold">
          Quick Currency Select:
        </span>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
          {COMMON_CURRENCIES.map((c) => {
            const isTarget = targetCurrency === c.code;
            return (
              <button
                key={c.code}
                type="button"
                onClick={() => setTargetCurrency(c.code)}
                className={`px-2.5 py-1 rounded-xl text-[11px] font-mono font-semibold transition-all whitespace-nowrap ${
                  isTarget
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-sm'
                    : 'bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700/50'
                }`}
              >
                {c.symbol} {c.code}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
