/**
 * ==============================================================================
 * VisaVoyage AI - Gemini API Resilience, Bounded Backoff, Caching & Deduplication
 * ==============================================================================
 *
 * Implements:
 * 1. Granular Gemini Error Classification (distinguishes transient 429 RPM/TPM vs
 *    daily quota exhaustion vs billing restrictions vs 503 service unavailable).
 * 2. Bounded Exponential Backoff with Jitter respecting Retry-After / retryDelay.
 * 3. In-flight Promise Deduplication (SingleFlight pattern) to prevent concurrent
 *    duplicate requests for identical parameters.
 * 4. In-Memory LRU / TTL Cache to reuse existing results and avoid unnecessary calls.
 * 5. Conversation History Pruning to prevent token limit exhaustion.
 */

export type GeminiErrorCategory =
  | 'RATE_LIMIT_TRANSIENT'   // 429 RPM/TPM: retryable with backoff
  | 'QUOTA_EXHAUSTED_DAILY'  // 429 RPD / FreeTier daily limit: non-retryable, fast-fail
  | 'BILLING_RESTRICTION'    // 403 / 429 billing account disabled/invalid key: non-retryable
  | 'SERVICE_UNAVAILABLE'    // 503 / 504 / high demand spikes: retryable
  | 'VALIDATION_ERROR'       // 400 bad request / invalid argument: non-retryable
  | 'NOT_FOUND'              // 404 model not found / deprecated: cascade to next model
  | 'UNKNOWN';

export interface ClassifiedGeminiError {
  category: GeminiErrorCategory;
  isRetryable: boolean;
  retryDelayMs: number;
  message: string;
  statusCode: number;
  originalError: any;
}

/**
 * Accurately classify a Gemini API error to prevent retrying non-retryable daily quotas
 * while allowing transient RPM rate limits to be retried with exponential backoff.
 */
export function classifyGeminiError(err: any): ClassifiedGeminiError {
  const status = Number(err?.status || err?.statusCode || err?.error?.code || 500);
  const rawMsg = String(err?.message || err?.error?.message || err || '');

  // 1. Check for Daily Quota Exhaustion (Non-retryable until next day UTC/Pacific)
  const isDailyQuota =
    (status === 429 || rawMsg.includes('RESOURCE_EXHAUSTED')) &&
    (
      rawMsg.includes('Queries per day') ||
      rawMsg.includes('GenerateContentRequestsPerDayPerProject') ||
      rawMsg.includes('RequestsPerDay') ||
      rawMsg.includes('per day') ||
      rawMsg.includes('PerDay') ||
      (rawMsg.includes('FreeTier') && rawMsg.includes('quota')) ||
      (rawMsg.includes('Quota exceeded for quota metric') && rawMsg.toLowerCase().includes('day'))
    );

  if (isDailyQuota) {
    return {
      category: 'QUOTA_EXHAUSTED_DAILY',
      isRetryable: false,
      retryDelayMs: 0,
      statusCode: 429,
      message: 'Daily Gemini API quota exhausted for today. Please wait for the daily quota reset or use offline intelligence.',
      originalError: err
    };
  }

  // 2. Check for Billing / Key Restrictions (Non-retryable)
  const isBilling =
    status === 403 ||
    rawMsg.includes('BILLING_DISABLED') ||
    rawMsg.includes('API_KEY_INVALID') ||
    rawMsg.includes('ACCOUNT_DISABLED') ||
    rawMsg.includes('billing account') ||
    rawMsg.includes('PERMISSION_DENIED');

  if (isBilling) {
    return {
      category: 'BILLING_RESTRICTION',
      isRetryable: false,
      retryDelayMs: 0,
      statusCode: 403,
      message: 'Gemini API billing or authentication restriction. Please check your API key configuration.',
      originalError: err
    };
  }

  // 3. Extract retryDelay if supplied by Google GenAI or HTTP headers
  let suggestedDelayMs = 0;
  if (err?.errorDetails && Array.isArray(err.errorDetails)) {
    for (const detail of err.errorDetails) {
      if (detail['@type']?.includes('RetryInfo') && detail.retryDelay) {
        const parsedSec = parseFloat(String(detail.retryDelay).replace('s', ''));
        if (!isNaN(parsedSec)) {
          suggestedDelayMs = Math.round(parsedSec * 1000);
        }
      }
    }
  }

  if (!suggestedDelayMs && err?.headers) {
    const retryHeader = err.headers['retry-after'] || err.headers['Retry-After'];
    if (retryHeader) {
      const parsedSec = parseFloat(retryHeader);
      if (!isNaN(parsedSec)) {
        suggestedDelayMs = Math.round(parsedSec * 1000);
      }
    }
  }

  // 4. Transient Per-Minute Rate Limit (RPM / TPM) (Retryable with backoff)
  const isTransientRateLimit =
    status === 429 ||
    rawMsg.includes('RESOURCE_EXHAUSTED') ||
    rawMsg.includes('RATE_LIMIT_EXCEEDED') ||
    rawMsg.includes('Rate limit exceeded') ||
    rawMsg.includes('Requests per minute') ||
    rawMsg.includes('Tokens per minute') ||
    rawMsg.includes('PerMinute') ||
    rawMsg.includes('rateLimitExceeded') ||
    rawMsg.includes('Too Many Requests');

  if (isTransientRateLimit) {
    return {
      category: 'RATE_LIMIT_TRANSIENT',
      isRetryable: true,
      retryDelayMs: suggestedDelayMs,
      statusCode: 429,
      message: 'Gemini API per-minute request rate limit reached. Retrying with bounded backoff.',
      originalError: err
    };
  }

  // 5. Transient High Demand / Server Spikes (Retryable)
  const isServiceUnavailable =
    status === 503 ||
    status === 504 ||
    rawMsg.includes('high demand') ||
    rawMsg.includes('UNAVAILABLE') ||
    rawMsg.includes('spikes in traffic');

  if (isServiceUnavailable) {
    return {
      category: 'SERVICE_UNAVAILABLE',
      isRetryable: true,
      retryDelayMs: suggestedDelayMs,
      statusCode: 503,
      message: 'Gemini service temporarily experiencing high traffic load.',
      originalError: err
    };
  }

  // 6. Model Not Found (Non-retryable on this model; cascade to fallback)
  if (status === 404 || rawMsg.includes('not found') || rawMsg.includes('no longer supported')) {
    return {
      category: 'NOT_FOUND',
      isRetryable: false,
      retryDelayMs: 0,
      statusCode: 404,
      message: 'Requested Gemini model not available.',
      originalError: err
    };
  }

  return {
    category: 'UNKNOWN',
    isRetryable: false,
    retryDelayMs: 0,
    statusCode: status || 500,
    message: rawMsg,
    originalError: err
  };
}

/**
 * Bounded Exponential Backoff with Jitter for Gemini API operations
 */
export async function withBoundedBackoff<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    baseDelayMs?: number;
    maxDelayMs?: number;
    actionName?: string;
  } = {}
): Promise<T> {
  const {
    maxRetries = 2,
    baseDelayMs = 1200,
    maxDelayMs = 6000,
    actionName = 'Gemini AI Operation'
  } = options;

  let lastError: any;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err: any) {
      lastError = err;
      const classified = classifyGeminiError(err);

      // Fast-fail immediately on non-retryable errors (exhausted daily quota, billing, 404)
      if (!classified.isRetryable) {
        console.warn(`[Gemini Resilience] ${actionName}: Fast-failing non-retryable error [${classified.category}]: ${classified.message}`);
        throw err;
      }

      // Check if we reached the retry bound
      if (attempt >= maxRetries) {
        console.warn(`[Gemini Resilience] ${actionName}: Max retry attempts (${maxRetries}) reached for transient limit.`);
        throw err;
      }

      // Compute bounded exponential backoff with full jitter
      let delayMs: number;
      if (classified.retryDelayMs > 0) {
        // Respect provider suggested delay, but cap at maxDelayMs to prevent thread locking
        delayMs = Math.min(classified.retryDelayMs + Math.random() * 300, maxDelayMs);
      } else {
        const expDelay = baseDelayMs * Math.pow(2, attempt);
        const jitter = Math.random() * 400;
        delayMs = Math.min(expDelay + jitter, maxDelayMs);
      }

      console.log(`[Gemini Resilience] ${actionName}: Transient 429/503 (Attempt ${attempt + 1}/${maxRetries}). Backing off for ${Math.round(delayMs)}ms...`);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  throw lastError;
}

/**
 * In-Flight Request Deduplication (SingleFlight pattern)
 * If two requests arrive for identical parameters concurrently, both wait for and share the same promise.
 */
class InFlightDeduplicator {
  private inFlight = new Map<string, Promise<any>>();

  async run<T>(key: string, fn: () => Promise<T>): Promise<T> {
    const existing = this.inFlight.get(key);
    if (existing) {
      console.log(`[Gemini Deduplicator] In-flight request match for key "${key}". Sharing pending promise.`);
      return existing as Promise<T>;
    }

    const promise = fn().finally(() => {
      this.inFlight.delete(key);
    });

    this.inFlight.set(key, promise);
    return promise;
  }
}

export const inFlightDeduplicator = new InFlightDeduplicator();

/**
 * Result Cache with TTL & LRU Eviction
 */
interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

class ResilienceCache {
  private store = new Map<string, CacheEntry<any>>();
  private maxEntries: number;

  constructor(maxEntries = 300) {
    this.maxEntries = maxEntries;
  }

  get<T>(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }

    // Refresh position for LRU
    this.store.delete(key);
    this.store.set(key, entry);
    return entry.data as T;
  }

  set<T>(key: string, data: T, ttlMs: number): void {
    if (this.store.size >= this.maxEntries) {
      // Evict oldest item
      const oldestKey = this.store.keys().next().value;
      if (oldestKey) this.store.delete(oldestKey);
    }

    this.store.set(key, {
      data,
      expiresAt: Date.now() + ttlMs
    });
  }

  clear(): void {
    this.store.clear();
  }

  size(): number {
    return this.store.size;
  }
}

export const resilienceCache = new ResilienceCache(300);

/**
 * Prune and bound chat conversation history to avoid unbounded token accumulation
 */
export function pruneChatHistory(
  messages: Array<{ role: string; content: string }>,
  maxTurns = 4
): Array<{ role: 'user' | 'model'; parts: [{ text: string }] }> {
  // 1 turn = 1 user + 1 model message => maxTurns * 2 messages
  const maxMessages = maxTurns * 2;
  const recent = messages.slice(-maxMessages);

  return recent.map((m) => ({
    role: m.role === 'assistant' || m.role === 'model' ? ('model' as const) : ('user' as const),
    parts: [{ text: m.content.slice(0, 2000) }] // Safeguard per-message text length
  }));
}
