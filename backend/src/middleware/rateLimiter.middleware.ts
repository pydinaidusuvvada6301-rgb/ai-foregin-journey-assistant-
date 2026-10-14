import { Request, Response, NextFunction } from 'express';

/**
 * ==============================================================================
 * VisaVoyage AI - Per-User Server-Side Rate Limiter & Concurrency Limiter
 * ==============================================================================
 * Supports:
 * 1. Rate limiting per authenticated user ID (or client IP for unauthenticated).
 * 2. Concurrency limiting to cap simultaneous active AI requests per user/IP.
 * 3. Shared store interface ready for multi-instance deployments (Vercel serverless).
 */

export interface RateLimitRecord {
  count: number;
  resetTime: number;
}

export interface SharedRateLimitStore {
  increment(key: string, windowMs: number): Promise<{ count: number; resetTime: number }>;
  get(key: string): Promise<RateLimitRecord | null>;
  reset(key: string): Promise<void>;
}

/**
 * High-performance sliding window in-memory rate limit store with auto-cleanup
 */
export class MemoryRateLimitStore implements SharedRateLimitStore {
  private store = new Map<string, RateLimitRecord>();

  async increment(key: string, windowMs: number): Promise<{ count: number; resetTime: number }> {
    const now = Date.now();
    const existing = this.store.get(key);

    if (!existing || now > existing.resetTime) {
      const record = { count: 1, resetTime: now + windowMs };
      this.store.set(key, record);
      return record;
    }

    existing.count += 1;
    return existing;
  }

  async get(key: string): Promise<RateLimitRecord | null> {
    const record = this.store.get(key);
    if (!record) return null;
    if (Date.now() > record.resetTime) {
      this.store.delete(key);
      return null;
    }
    return record;
  }

  async reset(key: string): Promise<void> {
    this.store.delete(key);
  }
}

// Global shared rate limit store instance
export const rateLimitStore: SharedRateLimitStore = new MemoryRateLimitStore();

/**
 * In-flight active concurrency tracker per user/IP
 */
class ConcurrencyTracker {
  private activeCounts = new Map<string, number>();

  acquire(key: string, maxConcurrency: number): boolean {
    const current = this.activeCounts.get(key) || 0;
    if (current >= maxConcurrency) {
      return false;
    }
    this.activeCounts.set(key, current + 1);
    return true;
  }

  release(key: string): void {
    const current = this.activeCounts.get(key) || 1;
    if (current <= 1) {
      this.activeCounts.delete(key);
    } else {
      this.activeCounts.set(key, current - 1);
    }
  }

  get(key: string): number {
    return this.activeCounts.get(key) || 0;
  }
}

export const concurrencyTracker = new ConcurrencyTracker();

/**
 * Resolve client key: Authenticated user ID (Supabase JWT) or client IP
 */
export function getClientKey(req: Request): string {
  if (req.user?.id) {
    return `user:${req.user.id}`;
  }
  const forwarded = req.headers['x-forwarded-for'];
  const ip = typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : req.ip || 'anonymous';
  return `ip:${ip}`;
}

/**
 * Rate limiter middleware specifically for AI generation endpoints
 * Limits requests per user/IP per time window
 */
export function createUserAiRateLimiter(options: {
  windowMs?: number;
  maxRequests?: number;
  maxConcurrency?: number;
} = {}) {
  const windowMs = options.windowMs || 60 * 1000; // 1 minute
  const maxRequests = options.maxRequests || 20;   // 20 AI requests per minute
  const maxConcurrency = options.maxConcurrency || 2; // max 2 concurrent generations

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const clientKey = getClientKey(req);

    // 1. Check & Acquire Concurrency Slot
    const acquired = concurrencyTracker.acquire(clientKey, maxConcurrency);
    if (!acquired) {
      res.status(429).json({
        success: false,
        error: 'Too Many Requests',
        code: 'CONCURRENCY_LIMIT_EXCEEDED',
        message: 'An AI request is already processing for your session. Please wait a moment before sending another.',
        retryAfterSeconds: 2,
        isQuotaExhausted: false
      });
      return;
    }

    // Release concurrency slot on response finish/close
    let released = false;
    const releaseOnce = () => {
      if (!released) {
        released = true;
        concurrencyTracker.release(clientKey);
      }
    };
    res.on('finish', releaseOnce);
    res.on('close', releaseOnce);

    // 2. Check Rate Limit (Requests per Window)
    try {
      const { count, resetTime } = await rateLimitStore.increment(`ai:${clientKey}`, windowMs);
      const remaining = Math.max(0, maxRequests - count);
      const resetSeconds = Math.ceil(Math.max(0, resetTime - Date.now()) / 1000);

      // Set standard RateLimit response headers
      res.setHeader('RateLimit-Limit', maxRequests);
      res.setHeader('RateLimit-Remaining', remaining);
      res.setHeader('RateLimit-Reset', resetSeconds);

      if (count > maxRequests) {
        releaseOnce();
        res.setHeader('Retry-After', resetSeconds);
        res.status(429).json({
          success: false,
          error: 'Rate Limit Exceeded',
          code: 'RATE_LIMIT_EXCEEDED',
          message: `You have reached the AI generation limit of ${maxRequests} requests per minute. Please retry in ${resetSeconds} seconds.`,
          retryAfterSeconds: resetSeconds,
          isQuotaExhausted: false
        });
        return;
      }

      next();
    } catch (err) {
      // In case of store error, log and fail-open to not block the user
      console.warn('[RateLimiter] Error updating rate limit store:', err);
      next();
    }
  };
}
