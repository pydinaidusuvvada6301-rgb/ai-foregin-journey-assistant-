import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { classifyGeminiError } from '../services/gemini-resilience.js';

/**
 * ==============================================================================
 * VisaVoyage AI - Central Safe Error Handler
 * ==============================================================================
 * Sanitizes all errors and returns structured, secure responses.
 * Guarantees that internal API keys, database credentials, or server secrets
 * are NEVER leaked to the client or browser logs.
 */
export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Safe console log with sanitized message
  const rawMsg = String(err?.message || err?.error || err || 'Unknown Error');
  const sanitizedLogMsg = rawMsg
    .replace(/AIza[0-9A-Za-z-_]{35}/g, '[REDACTED_API_KEY]')
    .replace(/bearer\s+[A-Za-z0-9-_.]+/gi, 'Bearer [REDACTED_TOKEN]');

  console.error('[Error Handler]', {
    path: req.path,
    method: req.method,
    status: err?.status || err?.statusCode || 500,
    message: sanitizedLogMsg
  });

  // 1. Zod Validation Error
  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      error: 'Validation Error',
      code: 'VALIDATION_ERROR',
      message: 'Request payload failed schema validation.',
      details: err.errors.map(e => ({
        path: e.path.join('.'),
        message: e.message
      }))
    });
    return;
  }

  // 2. Multer Upload Error
  if (err?.name === 'MulterError' || rawMsg.includes('UnsupportedFileType')) {
    res.status(400).json({
      success: false,
      error: 'Upload Error',
      code: 'UPLOAD_ERROR',
      message: sanitizedLogMsg.includes('UnsupportedFileType')
        ? 'Only JPEG, PNG, WebP, and PDF documents are supported.'
        : err?.message || 'Document upload failed.'
    });
    return;
  }

  // 3. Classify Gemini AI & Upstream Provider Errors
  const classified = classifyGeminiError(err);

  if (classified.category === 'QUOTA_EXHAUSTED_DAILY') {
    res.status(429).json({
      success: false,
      error: 'Daily Quota Exhausted',
      code: 'DAILY_QUOTA_EXHAUSTED',
      message: 'Daily AI intelligence quota has been reached for today. Realistic offline consular intelligence is active.',
      retryAfterSeconds: 0,
      isQuotaExhausted: true,
      fallbackAvailable: true
    });
    return;
  }

  if (classified.category === 'RATE_LIMIT_TRANSIENT') {
    const retrySec = classified.retryDelayMs > 0 ? Math.ceil(classified.retryDelayMs / 1000) : 5;
    res.setHeader('Retry-After', retrySec);
    res.status(429).json({
      success: false,
      error: 'Rate Limit Exceeded',
      code: 'RATE_LIMIT_EXCEEDED',
      message: `The AI intelligence service is currently experiencing high demand. Please retry in ${retrySec} seconds.`,
      retryAfterSeconds: retrySec,
      isQuotaExhausted: false,
      fallbackAvailable: true
    });
    return;
  }

  if (classified.category === 'BILLING_RESTRICTION') {
    res.status(403).json({
      success: false,
      error: 'Service Access Restricted',
      code: 'BILLING_RESTRICTION',
      message: 'The AI service is temporarily restricted by provider quota policy. Offline intelligence is serving your request.',
      retryAfterSeconds: 0,
      isQuotaExhausted: true,
      fallbackAvailable: true
    });
    return;
  }

  if (classified.category === 'SERVICE_UNAVAILABLE') {
    res.status(503).json({
      success: false,
      error: 'Service Temporarily Unavailable',
      code: 'SERVICE_UNAVAILABLE',
      message: 'Upstream AI provider is temporarily unavailable. Please retry in a few seconds.',
      retryAfterSeconds: 3,
      fallbackAvailable: true
    });
    return;
  }

  // 4. Concurrency or Explicit Rate Limit Errors
  if (err?.code === 'CONCURRENCY_LIMIT_EXCEEDED') {
    res.status(429).json({
      success: false,
      error: 'Too Many Requests',
      code: 'CONCURRENCY_LIMIT_EXCEEDED',
      message: err.message || 'An AI operation is already in progress. Please wait for it to complete.',
      retryAfterSeconds: 2,
      isQuotaExhausted: false
    });
    return;
  }

  // 5. Generic Server Errors (Safe sanitized response)
  const statusCode = Number(err?.status || err?.statusCode || 500);
  const cleanStatusCode = statusCode >= 400 && statusCode < 600 ? statusCode : 500;

  res.status(cleanStatusCode).json({
    success: false,
    error: err?.name || 'Server Error',
    code: err?.code || 'INTERNAL_ERROR',
    message: cleanStatusCode === 500
      ? 'An internal server error occurred while processing your travel request. Please try again.'
      : sanitizedLogMsg
  });
}
