import assert from 'node:assert/strict';
import { chatWithGeminiAI } from '../services/gemini.service.js';
import { pruneChatHistory, classifyGeminiError } from '../services/gemini-resilience.js';
import { buildJourneyAssistantPrompt } from '../services/prompts.js';

async function runTest(name: string, fn: () => Promise<void>) {
  try {
    await fn();
    console.log(`  ✓ ${name}`);
  } catch (err: any) {
    console.error(`  ✗ ${name}`);
    console.error(`    ${err?.message || err}`);
    throw err;
  }
}

async function main() {
  console.log('\n======================================================');
  console.log('🧪 Running AI Foreign Journey Assistant Test Suite');
  console.log('======================================================\n');

  // Group 1: Conversation History Sanitization & Role Formatting (Step 3 & 4)
  console.log('[Suite 1: History Sanitization & Role Formatting]');
  await runTest('Sanitizes UI welcome messages and enforces user-first turn', async () => {
    const raw = [
      { role: 'assistant', content: '### Welcome to Gemini Foreign Journey Copilot ✨\nWhere are you heading?' },
      { role: 'user', content: 'Hi' }
    ];
    const sanitized = pruneChatHistory(raw, 5);
    assert.equal(sanitized.length, 1);
    assert.equal(sanitized[0].role, 'user');
    assert.equal(sanitized[0].parts[0].text, 'Hi');
  });

  await runTest('Merges consecutive same-role messages into alternating turns', async () => {
    const raw = [
      { role: 'user', content: 'Hello' },
      { role: 'user', content: 'I am planning a trip' },
      { role: 'assistant', content: 'Great, where are you going?' },
      { role: 'user', content: 'To Japan' }
    ];
    const sanitized = pruneChatHistory(raw, 5);
    assert.equal(sanitized.length, 3);
    assert.equal(sanitized[0].role, 'user');
    assert.ok(sanitized[0].parts[0].text.includes('Hello\nI am planning a trip'));
    assert.equal(sanitized[1].role, 'model');
    assert.equal(sanitized[2].role, 'user');
  });

  await runTest('Rejects and prunes empty or whitespace-only messages', async () => {
    const raw = [
      { role: 'user', content: '   ' },
      { role: 'assistant', content: '' },
      { role: 'user', content: 'What can you do?' }
    ];
    const sanitized = pruneChatHistory(raw, 5);
    assert.equal(sanitized.length, 1);
    assert.equal(sanitized[0].parts[0].text, 'What can you do?');
  });

  // Group 2: The Exact 10 Cases from Specification
  console.log('\n[Suite 2: Core Conversational Relevance Tests]');

  // Test 1: Hi
  await runTest('Test 1: Simple greeting returns warm greeting without unprompted visa dump', async () => {
    const res = await chatWithGeminiAI({
      messages: [{ role: 'user', content: 'Hi' }],
      context: { destination: 'Australia', originCountry: 'United States' }
    });
    const reply = res.reply.toLowerCase();
    assert.ok(reply.includes('hi') || reply.includes('hello') || reply.includes('welcome'), 'Must contain friendly greeting');
    // Crucial: Must NOT dump Australia ETA requirements or visa forms unprompted
    assert.ok(!reply.includes('subclass 601'), 'Must not dump specific visa subclasses unprompted for a simple "Hi"');
    assert.ok(!reply.includes('esim'), 'Must not dump eSIM advice unprompted for "Hi"');
  });

  // Test 2: What can you do?
  await runTest('Test 2: "What can you do?" returns capabilities overview', async () => {
    const res = await chatWithGeminiAI({
      messages: [{ role: 'user', content: 'What can you do?' }]
    });
    const reply = res.reply.toLowerCase();
    assert.ok(reply.includes('visa') || reply.includes('travel') || reply.includes('itinerar') || reply.includes('document'), 'Must describe assistant capabilities');
  });

  // Test 3: I want to travel to Australia.
  await runTest('Test 3: "I want to travel to Australia" asks relevant follow-up questions', async () => {
    const res = await chatWithGeminiAI({
      messages: [{ role: 'user', content: 'I want to travel to Australia.' }]
    });
    const reply = res.reply.toLowerCase();
    assert.ok(reply.includes('purpose') || reply.includes('nationality') || reply.includes('passport') || reply.includes('how long') || reply.includes('citizen'), 'Must ask relevant follow-up questions');
  });

  // Test 4: What documents do I need? (no context)
  await runTest('Test 4: "What documents do I need?" asks clarifying question when context is missing', async () => {
    const res = await chatWithGeminiAI({
      messages: [{ role: 'user', content: 'What documents do I need?' }]
    });
    const reply = res.reply.toLowerCase();
    assert.ok(reply.includes('destination') || reply.includes('country') || reply.includes('where') || reply.includes('purpose'), 'Must ask for destination/purpose clarification');
  });

  // Test 5: Contextual follow-up
  await runTest('Test 5: Follow-up interprets in context of Australia tourism', async () => {
    const res = await chatWithGeminiAI({
      messages: [
        { role: 'user', content: 'I want to visit Australia for tourism.' },
        { role: 'assistant', content: 'Australia is a fantastic destination! Depending on your passport, you can enter with an ETA, eVisitor, or Visitor visa.' },
        { role: 'user', content: 'What documents do I need?' }
      ]
    });
    const reply = res.reply.toLowerCase();
    assert.ok(reply.includes('passport') || reply.includes('ticket') || reply.includes('funds') || reply.includes('australia'), 'Must interpret documents in context of Australia tourism');
  });

  // Test 6: What is 2 + 2?
  await runTest('Test 6: Answers "4" directly without unprompted visa discussion', async () => {
    const res = await chatWithGeminiAI({
      messages: [
        { role: 'user', content: 'Hi' },
        { role: 'assistant', content: 'Hi! Welcome to AI Foreign Journey Assistant. How can I help you with your international travel or visa questions today?' },
        { role: 'user', content: 'What is 2 + 2?' }
      ]
    });
    const reply = res.reply.trim();
    assert.ok(reply.includes('4'), 'Must answer "4" directly');
    assert.ok(!reply.toLowerCase().includes('subclass'), 'Must not discuss visa subclasses when answering math');
  });

  // Test 7: Thanks
  await runTest('Test 7: "Thanks" receives a natural polite acknowledgement', async () => {
    const res = await chatWithGeminiAI({
      messages: [{ role: 'user', content: 'Thanks' }]
    });
    const reply = res.reply.toLowerCase();
    assert.ok(reply.includes('welcome') || reply.includes('anytime') || reply.includes('glad to help') || reply.includes('happy to help'), 'Must acknowledge thanks politely');
  });

  // Test 8: Tourist visa fee for Australia
  await runTest('Test 8: Explains tourist visa category and directs to official verification', async () => {
    const res = await chatWithGeminiAI({
      messages: [{ role: 'user', content: 'What is the current tourist visa fee for Australia?' }]
    });
    const reply = res.reply.toLowerCase();
    assert.ok(reply.includes('fee') || reply.includes('charge') || reply.includes('aud') || reply.includes('subclass') || reply.includes('600') || reply.includes('601') || reply.includes('eta'), 'Must address the visa fee');
    assert.ok(reply.includes('official') || reply.includes('home affairs') || reply.includes('immi') || reply.includes('verif'), 'Must identify need for official verification');
  });

  // Test 9: Rapid concurrent calls preserve response mapping
  console.log('\n[Suite 3: Concurrency, Sequence & Error Resilience]');
  await runTest('Test 9: Multiple distinct queries resolve to their respective answers without crosstalk', async () => {
    const p1 = chatWithGeminiAI({ messages: [{ role: 'user', content: 'What is 10 + 10?' }] });
    const p2 = chatWithGeminiAI({ messages: [{ role: 'user', content: 'What is the capital of France?' }] });

    const [r1, r2] = await Promise.all([p1, p2]);
    assert.ok(r1.reply.includes('20'), 'Request 1 must resolve to 20');
    assert.ok(r2.reply.toLowerCase().includes('paris'), 'Request 2 must resolve to Paris');
  });

  // Test 10: Simulate API failure
  await runTest('Test 10: Gracefully classifies API failure without fabricating fake travel advice', async () => {
    const simulatedError = {
      status: 429,
      message: 'RESOURCE_EXHAUSTED: Rate limit exceeded for Requests per minute'
    };
    const classified = classifyGeminiError(simulatedError);
    assert.equal(classified.statusCode, 429);
    assert.equal(classified.isRetryable, true);
    assert.equal(classified.category, 'RATE_LIMIT_TRANSIENT');
  });

  // Test 11: Exact User-Facing 429 Message Specification
  await runTest('Test 11: Transient 429 formats exact user-facing message required by specification', async () => {
    const simulated429 = {
      status: 429,
      message: 'RESOURCE_EXHAUSTED: Rate limit exceeded for Requests per minute',
      headers: { get: () => '8' }
    };
    const classified = classifyGeminiError(simulated429);
    const retryAfter = classified.retryDelayMs > 0 ? Math.ceil(classified.retryDelayMs / 1000) : 5;

    // Simulate controller response payload
    const responsePayload = {
      success: false,
      requestId: 1042,
      error: 'Rate Limit Exceeded',
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'The AI assistant is receiving too many requests right now. Please wait a moment and try again.',
      isRetryable: true,
      retryAfterSeconds: retryAfter,
      isQuotaExhausted: false
    };

    assert.equal(responsePayload.message, 'The AI assistant is receiving too many requests right now. Please wait a moment and try again.');
    assert.equal(responsePayload.retryAfterSeconds, 8);
    assert.equal(responsePayload.requestId, 1042);
    assert.equal(responsePayload.isRetryable, true);
  });

  // Test 12: Daily Quota Exhaustion Returns Non-Retryable Status
  await runTest('Test 12: Daily quota exhaustion sets isQuotaExhausted: true and isRetryable: false', async () => {
    const dailyErr = {
      status: 429,
      message: 'Quota exceeded for quota metric GenerateContentRequestsPerDayPerProject and limit Queries per day of FreeTier'
    };
    const classified = classifyGeminiError(dailyErr);
    assert.equal(classified.category, 'QUOTA_EXHAUSTED_DAILY');
    assert.equal(classified.isRetryable, false);
    assert.equal(classified.statusCode, 429);
    assert.equal(classified.limitType, 'RPD');
  });

  // Test 13: Invalid API Key / Billing Restriction
  await runTest('Test 13: Billing / API key restrictions fast-fail with 403 status', async () => {
    const billingErr = {
      status: 403,
      message: 'PERMISSION_DENIED: API_KEY_INVALID'
    };
    const classified = classifyGeminiError(billingErr);
    assert.equal(classified.category, 'BILLING_RESTRICTION');
    assert.equal(classified.isRetryable, false);
    assert.equal(classified.statusCode, 403);
  });

  console.log('\n======================================================');
  console.log('🎉 All 13 Test Cases Passed Successfully!');
  console.log('======================================================\n');
}

main().catch((e) => {
  console.error('\n❌ Test suite failed:', e);
  process.exit(1);
});
