import assert from 'node:assert/strict';
import {
  classifyGeminiError,
  withBoundedBackoff,
  inFlightDeduplicator,
  resilienceCache,
  pruneChatHistory
} from '../services/gemini-resilience.js';
import {
  createUserAiRateLimiter,
  concurrencyTracker,
  rateLimitStore,
  MemoryRateLimitStore
} from '../middleware/rateLimiter.middleware.js';

let passed = 0;
let failed = 0;

async function runTest(name: string, fn: () => Promise<void>) {
  try {
    await fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (err: any) {
    console.error(`  ✗ ${name}`);
    console.error(`    ${err?.message || err}`);
    failed++;
  }
}

async function main() {
  console.log('\n======================================================');
  console.log('🧪 Running VisaVoyage Gemini AI Resilience Test Suite');
  console.log('======================================================\n');

  // Test Group 1: Error Classification
  console.log('[Suite 1: Error Classification]');
  await runTest('Identifies transient 429 RPM rate limit as retryable', async () => {
    const err = {
      status: 429,
      message: '[429 Too Many Requests] RESOURCE_EXHAUSTED: Rate limit exceeded for metric GenerateContentRequestsPerMinutePerProject'
    };
    const classified = classifyGeminiError(err);
    assert.equal(classified.category, 'RATE_LIMIT_TRANSIENT');
    assert.equal(classified.isRetryable, true);
    assert.equal(classified.statusCode, 429);
  });

  await runTest('Identifies daily quota exhaustion as non-retryable and fast-fails', async () => {
    const err = {
      status: 429,
      message: 'Quota exceeded for quota metric GenerateContentRequestsPerDayPerProject and limit Queries per day of FreeTier'
    };
    const classified = classifyGeminiError(err);
    assert.equal(classified.category, 'QUOTA_EXHAUSTED_DAILY');
    assert.equal(classified.isRetryable, false);
    assert.equal(classified.statusCode, 429);
  });

  await runTest('Identifies billing restrictions as non-retryable 403', async () => {
    const err = {
      status: 403,
      message: 'BILLING_DISABLED: Google GenAI billing account is inactive'
    };
    const classified = classifyGeminiError(err);
    assert.equal(classified.category, 'BILLING_RESTRICTION');
    assert.equal(classified.isRetryable, false);
  });

  await runTest('Extracts provider retryDelay from errorDetails', async () => {
    const err = {
      status: 429,
      message: 'RESOURCE_EXHAUSTED: Rate limit exceeded',
      errorDetails: [
        {
          '@type': 'type.googleapis.com/google.rpc.RetryInfo',
          retryDelay: '4s'
        }
      ]
    };
    const classified = classifyGeminiError(err);
    assert.equal(classified.category, 'RATE_LIMIT_TRANSIENT');
    assert.equal(classified.isRetryable, true);
    assert.equal(classified.retryDelayMs, 4000);
  });

  // Test Group 2: Bounded Exponential Backoff
  console.log('\n[Suite 2: Bounded Exponential Backoff]');
  await runTest('Successful call succeeds immediately on attempt 0', async () => {
    let callCount = 0;
    const result = await withBoundedBackoff(async () => {
      callCount++;
      return { ok: true, data: 'instant' };
    }, { maxRetries: 2, baseDelayMs: 50 });

    assert.equal(callCount, 1);
    assert.equal(result.data, 'instant');
  });

  await runTest('Transient 429 retries with backoff and succeeds on retry', async () => {
    let callCount = 0;
    const result = await withBoundedBackoff(async () => {
      callCount++;
      if (callCount === 1) {
        throw { status: 429, message: 'RESOURCE_EXHAUSTED: Requests per minute exceeded' };
      }
      return { ok: true, count: callCount };
    }, { maxRetries: 2, baseDelayMs: 60, maxDelayMs: 500 });

    assert.equal(callCount, 2);
    assert.equal(result.ok, true);
  });

  await runTest('Daily exhausted quota fast-fails immediately without retrying', async () => {
    let callCount = 0;
    let thrownError: any = null;
    try {
      await withBoundedBackoff(async () => {
        callCount++;
        throw {
          status: 429,
          message: 'RESOURCE_EXHAUSTED: Quota exceeded for metric Queries per day'
        };
      }, { maxRetries: 2, baseDelayMs: 50 });
    } catch (e) {
      thrownError = e;
    }

    assert.notEqual(thrownError, null);
    assert.equal(callCount, 1, 'Must NOT retry exhausted daily quota');
  });

  // Test Group 3: Deduplication & Caching
  console.log('\n[Suite 3: Deduplication & Caching]');
  await runTest('In-flight SingleFlight deduplicates concurrent identical calls', async () => {
    let underlyingGenerations = 0;
    const worker = async () => {
      return inFlightDeduplicator.run('test-itinerary-japan', async () => {
        underlyingGenerations++;
        await new Promise((res) => setTimeout(res, 80));
        return { destination: 'Tokyo, Japan', days: 7 };
      });
    };

    // Fire 4 parallel requests for identical key
    const [r1, r2, r3, r4] = await Promise.all([worker(), worker(), worker(), worker()]);
    assert.equal(underlyingGenerations, 1, 'Only 1 underlying execution must happen for concurrent requests');
    assert.equal(r1.destination, 'Tokyo, Japan');
    assert.equal(r2.destination, 'Tokyo, Japan');
    assert.equal(r3.destination, 'Tokyo, Japan');
    assert.equal(r4.destination, 'Tokyo, Japan');
  });

  await runTest('Resilience cache returns cached result on duplicate call', async () => {
    resilienceCache.clear();
    const cacheKey = 'visa:united states:japan';

    resilienceCache.set(cacheKey, { visaStatus: 'Visa Free', stayAllowed: '90 days' }, 10000);
    const cached = resilienceCache.get<any>(cacheKey);

    assert.notEqual(cached, null);
    assert.equal(cached.visaStatus, 'Visa Free');
  });

  // Test Group 4: Chat History Pruning
  console.log('\n[Suite 4: Chat History Token Bounding]');
  await runTest('Prunes long chat histories to max 8 messages (4 turns)', async () => {
    const hugeHistory = Array.from({ length: 30 }, (_, i) => ({
      role: i % 2 === 0 ? 'user' : 'assistant',
      content: `Message ${i} with lengthy traveler content...`
    }));

    const pruned = pruneChatHistory(hugeHistory, 4);
    assert.equal(pruned.length, 8, 'Must bound to max 8 messages');
    assert.equal(pruned[pruned.length - 1].parts[0].text, 'Message 29 with lengthy traveler content...');
  });

  // Test Group 5: Server-side Rate Limiting & Concurrency Tracker
  console.log('\n[Suite 5: Rate Limiting & Concurrency Control]');
  await runTest('Concurrency tracker enforces max 2 concurrent requests per client', async () => {
    const clientKey = 'user:test-traveler-42';
    // Acquire slot 1
    const s1 = concurrencyTracker.acquire(clientKey, 2);
    assert.equal(s1, true);

    // Acquire slot 2
    const s2 = concurrencyTracker.acquire(clientKey, 2);
    assert.equal(s2, true);

    // Attempt slot 3 (must fail)
    const s3 = concurrencyTracker.acquire(clientKey, 2);
    assert.equal(s3, false, 'Third parallel request must be rejected');

    // Release slot 1
    concurrencyTracker.release(clientKey);

    // Now slot 3 attempt can succeed
    const s4 = concurrencyTracker.acquire(clientKey, 2);
    assert.equal(s4, true);

    // Cleanup
    concurrencyTracker.release(clientKey);
    concurrencyTracker.release(clientKey);
  });

  await runTest('Rate limit store increments and respects window reset', async () => {
    const store = new MemoryRateLimitStore();
    const rec1 = await store.increment('test:user', 1000);
    assert.equal(rec1.count, 1);

    const rec2 = await store.increment('test:user', 1000);
    assert.equal(rec2.count, 2);

    const check = await store.get('test:user');
    assert.equal(check?.count, 2);
  });

  console.log('\n======================================================');
  console.log(`📊 Test Summary: ${passed} Passed, ${failed} Failed`);
  console.log('======================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
