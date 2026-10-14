import { Router, Request, Response } from 'express';

const router = Router();

interface CachedRates {
  base: string;
  rates: Record<string, number>;
  lastUpdated: string;
  timestamp: number;
}

// In-memory cache with 1-hour TTL
const ratesCache = new Map<string, CachedRates>();
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

// Curated reliable baseline rates for key global currencies (fallback offline safety net)
const FALLBACK_USD_RATES: Record<string, number> = {
  USD: 1.0,
  EUR: 0.92,
  GBP: 0.79,
  JPY: 154.5,
  AUD: 1.53,
  CAD: 1.38,
  CHF: 0.89,
  CNY: 7.24,
  INR: 83.9,
  SGD: 1.34,
  AED: 3.67,
  THB: 36.8,
  NZD: 1.66,
  KRW: 1380.0,
  BRL: 5.45,
  MXN: 18.2,
  ZAR: 18.1,
  SEK: 10.6,
  NOK: 10.8,
  DKK: 6.86,
  TRY: 33.1,
  IDR: 16250.0,
  MYR: 4.68,
  PHP: 58.4,
  VND: 25400.0,
  EGP: 48.5,
  SAR: 3.75,
  QAR: 3.64,
  KWD: 0.31,
  BHD: 0.38,
  OMR: 0.38
};

/**
 * GET /api/currency/rates?base=USD
 * Fetches real-time exchange rates with server caching & fallback protection
 */
router.get('/rates', async (req: Request, res: Response) => {
  const base = String(req.query.base || 'USD').toUpperCase();

  // Check cache first
  const cached = ratesCache.get(base);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    res.status(200).json({
      success: true,
      base: cached.base,
      rates: cached.rates,
      lastUpdated: cached.lastUpdated,
      isStale: false,
      fromCache: true,
      provider: 'Open Exchange Rates (Cached)'
    });
    return;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const apiUrl = `https://open.er-api.com/v6/latest/${encodeURIComponent(base)}`;
    const response = await fetch(apiUrl, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'VisaVoyageAI-CurrencyService/1.0'
      }
    });
    clearTimeout(timeout);

    if (response.ok) {
      const data: any = await response.json();
      if (data.result === 'success' && data.rates) {
        const payload: CachedRates = {
          base: data.base_code || base,
          rates: data.rates,
          lastUpdated: data.time_last_update_utc || new Date().toISOString(),
          timestamp: Date.now()
        };
        ratesCache.set(base, payload);

        res.status(200).json({
          success: true,
          base: payload.base,
          rates: payload.rates,
          lastUpdated: payload.lastUpdated,
          isStale: false,
          fromCache: false,
          provider: 'Open Exchange Rates Live Gateway'
        });
        return;
      }
    }
  } catch (err: any) {
    console.warn(`[Currency Service] External exchange rate provider unreachable (${err?.message || err}). Serving cached/fallback baseline.`);
  }

  // If expired cache exists, return it with isStale: true
  if (cached) {
    res.status(200).json({
      success: true,
      base: cached.base,
      rates: cached.rates,
      lastUpdated: cached.lastUpdated,
      isStale: true,
      fromCache: true,
      provider: 'Open Exchange Rates (Stale Cache Fallback)'
    });
    return;
  }

  // Otherwise return structured fallback table
  const baseRateInUSD = FALLBACK_USD_RATES[base] || 1.0;
  const convertedRates: Record<string, number> = {};
  for (const [code, rateInUSD] of Object.entries(FALLBACK_USD_RATES)) {
    convertedRates[code] = parseFloat((rateInUSD / baseRateInUSD).toFixed(4));
  }

  res.status(200).json({
    success: true,
    base,
    rates: convertedRates,
    lastUpdated: new Date().toISOString(),
    isStale: true,
    isFallback: true,
    provider: 'VisaVoyage Built-in Currency Baseline'
  });
});

export default router;
