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

export type GeminiLimitType = 'RPM' | 'TPM' | 'RPD' | 'BILLING' | 'UNKNOWN';

export interface ClassifiedGeminiError {
  category: GeminiErrorCategory;
  limitType?: GeminiLimitType;
  isRetryable: boolean;
  retryDelayMs: number;
  message: string;
  statusCode: number;
  originalError: any;
}

/**
 * Accurately classify a Gemini API error to prevent retrying non-retryable daily quotas
 * while allowing transient RPM/TPM rate limits to be retried with exponential backoff.
 */
export function classifyGeminiError(err: any): ClassifiedGeminiError {
  const status = Number(
    err?.status ||
    err?.statusCode ||
    err?.response?.status ||
    err?.error?.code ||
    (typeof err?.code === 'number' ? err.code : 0) ||
    500
  );
  const rawMsg = String(err?.message || err?.error?.message || (typeof err === 'string' ? err : ''));

  // 1. Check for Daily Quota Exhaustion (Non-retryable until daily reset UTC/Pacific)
  const isDailyQuota =
    (status === 429 || rawMsg.includes('RESOURCE_EXHAUSTED')) &&
    (
      rawMsg.includes('Queries per day') ||
      rawMsg.includes('GenerateContentRequestsPerDayPerProject') ||
      rawMsg.includes('RequestsPerDay') ||
      rawMsg.includes('per day') ||
      rawMsg.includes('PerDay') ||
      (rawMsg.includes('FreeTier') && rawMsg.includes('quota') && !rawMsg.includes('minute')) ||
      (rawMsg.includes('Quota exceeded for quota metric') && rawMsg.toLowerCase().includes('day'))
    );

  if (isDailyQuota) {
    return {
      category: 'QUOTA_EXHAUSTED_DAILY',
      limitType: 'RPD',
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
      limitType: 'BILLING',
      isRetryable: false,
      retryDelayMs: 0,
      statusCode: 403,
      message: 'Gemini API billing or authentication restriction. Please check your API key configuration in Google AI Studio.',
      originalError: err
    };
  }

  // 3. Extract retryDelay / Retry-After if supplied by Google GenAI SDK, RPC details, or HTTP headers
  let suggestedDelayMs = 0;

  // 3a. Check Google RPC RetryInfo in errorDetails or details array
  const detailsList = err?.errorDetails || err?.details || err?.error?.details || err?.response?.data?.error?.details;
  if (Array.isArray(detailsList)) {
    for (const detail of detailsList) {
      if (detail && detail['@type']?.includes('RetryInfo')) {
        if (detail.retryDelay) {
          if (typeof detail.retryDelay === 'string') {
            const parsedSec = parseFloat(detail.retryDelay.replace('s', ''));
            if (!isNaN(parsedSec)) suggestedDelayMs = Math.round(parsedSec * 1000);
          } else if (typeof detail.retryDelay === 'object') {
            const sec = Number(detail.retryDelay.seconds || 0);
            const nanos = Number(detail.retryDelay.nanos || 0);
            suggestedDelayMs = Math.round((sec + nanos / 1e9) * 1000);
          } else if (typeof detail.retryDelay === 'number') {
            suggestedDelayMs = Math.round(detail.retryDelay * 1000);
          }
        }
      }
    }
  }

  // 3b. Check HTTP Retry-After headers (supports Headers instance from fetch or plain object)
  if (!suggestedDelayMs) {
    const headers = err?.headers || err?.response?.headers;
    if (headers) {
      let retryHeader: string | null = null;
      if (typeof headers.get === 'function') {
        retryHeader = headers.get('retry-after') || headers.get('Retry-After');
      } else {
        retryHeader = headers['retry-after'] || headers['Retry-After'] || null;
      }

      if (retryHeader) {
        const parsedSec = parseFloat(String(retryHeader));
        if (!isNaN(parsedSec)) {
          suggestedDelayMs = Math.round(parsedSec * 1000);
        }
      }
    }
  }

  // 3c. Extract retry delay from error message regex e.g. "Please retry in 4s"
  if (!suggestedDelayMs) {
    const delayMatch = rawMsg.match(/(?:retry\s+(?:in|after)|reset\s+in)\s+([0-9.]+)\s*s/i);
    if (delayMatch && delayMatch[1]) {
      const parsedSec = parseFloat(delayMatch[1]);
      if (!isNaN(parsedSec)) {
        suggestedDelayMs = Math.round(parsedSec * 1000);
      }
    }
  }

  // 4. Distinguish Tokens-Per-Minute (TPM) vs Requests-Per-Minute (RPM) rate limits
  const isTPM =
    rawMsg.includes('Tokens per minute') ||
    rawMsg.includes('TokensPerMinute') ||
    rawMsg.includes('TokenCount') ||
    rawMsg.includes('tokens per minute');

  // 5. Transient Rate Limits (RPM / TPM / RESOURCE_EXHAUSTED) (Retryable with backoff)
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
      limitType: isTPM ? 'TPM' : 'RPM',
      isRetryable: true,
      retryDelayMs: suggestedDelayMs,
      statusCode: 429,
      message: isTPM
        ? 'Gemini API tokens-per-minute rate limit reached. Retrying with bounded backoff.'
        : 'Gemini API per-minute request rate limit reached. Retrying with bounded backoff.',
      originalError: err
    };
  }

  // 6. Transient High Demand / Server Spikes (503 / 504) (Retryable)
  const isServiceUnavailable =
    status === 503 ||
    status === 504 ||
    rawMsg.includes('high demand') ||
    rawMsg.includes('UNAVAILABLE') ||
    rawMsg.includes('spikes in traffic');

  if (isServiceUnavailable) {
    return {
      category: 'SERVICE_UNAVAILABLE',
      limitType: 'UNKNOWN',
      isRetryable: true,
      retryDelayMs: suggestedDelayMs,
      statusCode: 503,
      message: 'Gemini service temporarily experiencing high traffic load.',
      originalError: err
    };
  }

  // 7. Model Not Found (Non-retryable on this model; cascade to fallback)
  if (status === 404 || rawMsg.includes('not found') || rawMsg.includes('no longer supported')) {
    return {
      category: 'NOT_FOUND',
      limitType: 'UNKNOWN',
      isRetryable: false,
      retryDelayMs: 0,
      statusCode: 404,
      message: 'Requested Gemini model not available.',
      originalError: err
    };
  }

  return {
    category: 'UNKNOWN',
    limitType: 'UNKNOWN',
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
 * Prune, sanitize, and bound chat conversation history for Gemini API.
 * Guarantees:
 * 1. Non-empty, valid text messages only.
 * 2. Excludes UI-only initial greetings or banners.
 * 3. Conversation history strictly begins with a 'user' message.
 * 4. Merges consecutive same-role turns to preserve strict alternating user/model sequence.
 * 5. Bounded to recent maxTurns to avoid token overflow.
 */
export function pruneChatHistory(
  messages: Array<{ role: string; content: string }>,
  maxTurns = 4
): Array<{ role: 'user' | 'model'; parts: [{ text: string }] }> {
  if (!Array.isArray(messages) || messages.length === 0) {
    return [];
  }

  // 1. Filter out empty, non-string, and UI-only introductory banners
  const valid = messages.filter((m) => {
    if (!m || typeof m.content !== 'string') return false;
    const trimmed = m.content.trim();
    if (!trimmed) return false;
    // Exclude UI-only initial welcome cards
    if ((m.role === 'assistant' || m.role === 'model') && (
      trimmed.includes('Welcome to Gemini Foreign Journey Copilot') ||
      trimmed.includes('Conversation Cleared') ||
      trimmed.includes('I can provide clean, real-time advice tailored to your itinerary')
    )) {
      return false;
    }
    return true;
  });

  if (valid.length === 0) {
    return [];
  }

  // 2. Bound to recent turns (1 turn = 1 user + 1 model message => maxTurns * 2)
  const maxMessages = maxTurns * 2;
  const recent = valid.slice(-maxMessages);

  // 3. Drop any leading assistant/model messages so history strictly begins with 'user'
  let firstUserIdx = 0;
  while (firstUserIdx < recent.length && (recent[firstUserIdx].role === 'assistant' || recent[firstUserIdx].role === 'model')) {
    firstUserIdx++;
  }
  const userStarted = recent.slice(firstUserIdx);
  if (userStarted.length === 0) {
    return [];
  }

  // 4. Merge consecutive same-role turns into strict alternating sequence
  const alternating: Array<{ role: 'user' | 'model'; parts: [{ text: string }] }> = [];
  for (const msg of userStarted) {
    const role: 'user' | 'model' = (msg.role === 'assistant' || msg.role === 'model') ? 'model' : 'user';
    const text = msg.content.trim().slice(0, 2500);

    if (alternating.length > 0 && alternating[alternating.length - 1].role === role) {
      alternating[alternating.length - 1].parts[0].text += `\n${text}`;
    } else {
      alternating.push({
        role,
        parts: [{ text }]
      });
    }
  }

  return alternating;
}
