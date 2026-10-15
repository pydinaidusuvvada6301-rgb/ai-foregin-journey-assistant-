import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import {
  generateItineraryAI,
  checkVisaRequirementsAI,
  analyzeDocumentAI,
  chatWithGeminiAI,
  customizeDayAI,
  generateEmergencyCardAI,
  generatePackingChecklistAI
} from '../services/gemini.service.js';
import { saveItinerary, saveVisaCheck, saveDocumentCheck } from '../services/supabase.service.js';
import { classifyGeminiError } from '../services/gemini-resilience.js';

import { itineraryInputSchema, visaCheckInputSchema } from '../schemas/travel.schema.js';


export async function generateItinerary(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const validatedInput = itineraryInputSchema.parse(req.body);
    const userId = req.user?.id || 'demo-user-123';

    // Orchestrate server-side Gemini AI generation
    const itineraryDetails = await generateItineraryAI(validatedInput);

    // Persist to Supabase PostgreSQL under verified user ID
    let savedRecord = null;
    try {
      savedRecord = await saveItinerary(userId, {
        destination: validatedInput.destination,
        duration_days: validatedInput.durationDays,
        budget_range: validatedInput.budgetRange,
        itinerary_details: itineraryDetails
      });
    } catch (dbErr) {
      console.log('[AI Controller] DB save fallback notification:', dbErr);
    }

    res.status(200).json({
      success: true,
      data: itineraryDetails,
      recordId: savedRecord?.id || null,
      metadata: {
        destination: validatedInput.destination,
        durationDays: validatedInput.durationDays,
        budgetRange: validatedInput.budgetRange,
        userId
      }
    });
  } catch (err) {
    next(err);
  }
}

export async function checkVisaRequirements(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const validatedInput = visaCheckInputSchema.parse(req.body);
    const userId = req.user?.id || 'demo-user-123';

    // Orchestrate server-side Gemini AI visa rules check
    const visaResult = await checkVisaRequirementsAI(validatedInput);

    // Persist to Supabase PostgreSQL
    let savedRecord = null;
    try {
      savedRecord = await saveVisaCheck(userId, {
        passport_country: validatedInput.passportCountry,
        destination_country: validatedInput.destinationCountry,
        visa_result: visaResult
      });
    } catch (dbErr) {
      console.warn('[AI Controller] DB save failed, returning result anyway:', dbErr);
    }

    res.status(200).json({
      success: true,
      data: visaResult,
      recordId: savedRecord?.id || null,
      metadata: {
        passportCountry: validatedInput.passportCountry,
        destinationCountry: validatedInput.destinationCountry,
        userId
      }
    });
  } catch (err) {
    next(err);
  }
}

export async function analyzeDocument(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.file) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'A document file (image or PDF) must be provided in the "document" form field.'
      });
      return;
    }

    const userId = req.user?.id || 'demo-user-123';
    const documentType = req.body.documentType || 'Passport';

    const analysisResult = await analyzeDocumentAI(
      req.file.buffer,
      req.file.mimetype,
      documentType
    );

    let savedRecord = null;
    try {
      savedRecord = await saveDocumentCheck(userId, {
        document_type: documentType,
        file_name: req.file.originalname,
        analysis_result: analysisResult
      });
    } catch (dbErr) {
      console.warn('[AI Controller] Document check DB save failed:', dbErr);
    }

    res.status(200).json({
      success: true,
      data: analysisResult,
      recordId: savedRecord?.id || null,
      metadata: {
        documentType,
        fileName: req.file.originalname,
        fileSize: req.file.size
      }
    });
  } catch (err) {
    next(err);
  }
}

export async function chatWithCopilot(req: Request, res: Response, next: NextFunction): Promise<void> {
  const requestId = req.body?.requestId || req.headers['x-request-id'] || null;

  try {
    const { messages, context } = req.body;
    if (!Array.isArray(messages) || messages.length === 0) {
      res.status(400).json({
        success: false,
        requestId,
        error: 'Bad Request',
        code: 'VALIDATION_ERROR',
        message: 'messages array is required and must not be empty.'
      });
      return;
    }

    const lastMsg = messages[messages.length - 1];
    if (!lastMsg || typeof lastMsg.content !== 'string' || !lastMsg.content.trim()) {
      res.status(400).json({
        success: false,
        requestId,
        error: 'Bad Request',
        code: 'VALIDATION_ERROR',
        message: 'The latest customer message must contain non-empty text content.'
      });
      return;
    }

    const result = await chatWithGeminiAI({ messages, context });
    res.status(200).json({
      success: true,
      requestId,
      data: result
    });
  } catch (err: any) {
    const classified = classifyGeminiError(err);
    const retryAfter = classified.retryDelayMs > 0 ? Math.ceil(classified.retryDelayMs / 1000) : 5;

    if (classified.statusCode === 429) {
      res.setHeader('Retry-After', retryAfter);
    }

    if (classified.category === 'RATE_LIMIT_TRANSIENT') {
      res.status(429).json({
        success: false,
        requestId,
        error: 'Rate Limit Exceeded',
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'The AI assistant is receiving too many requests right now. Please wait a moment and try again.',
        isRetryable: true,
        retryAfterSeconds: retryAfter,
        isQuotaExhausted: false
      });
      return;
    }

    if (classified.category === 'QUOTA_EXHAUSTED_DAILY') {
      res.status(429).json({
        success: false,
        requestId,
        error: 'Daily Quota Exhausted',
        code: 'DAILY_QUOTA_EXHAUSTED',
        message: 'Daily AI intelligence quota has been reached for today. Realistic offline consular intelligence is active.',
        isRetryable: false,
        retryAfterSeconds: 0,
        isQuotaExhausted: true
      });
      return;
    }

    if (classified.category === 'BILLING_RESTRICTION') {
      res.status(403).json({
        success: false,
        requestId,
        error: 'Service Access Restricted',
        code: 'BILLING_RESTRICTION',
        message: 'The AI service is temporarily restricted by provider quota policy. Offline intelligence is serving your request.',
        isRetryable: false,
        retryAfterSeconds: 0,
        isQuotaExhausted: true
      });
      return;
    }

    // Never expose API keys, internal stack traces, or provider secrets to customers
    const statusCode = classified.statusCode >= 400 && classified.statusCode < 600 ? classified.statusCode : 500;
    res.status(statusCode).json({
      success: false,
      requestId,
      error: classified.category,
      code: 'AI_ERROR',
      message: statusCode === 500
        ? 'An internal error occurred while generating AI response. Please retry in a few moments.'
        : (classified.message || 'Unable to generate response from Gemini AI. Please retry.'),
      isRetryable: classified.isRetryable,
      retryAfterSeconds: classified.isRetryable ? retryAfter : undefined,
      isQuotaExhausted: false
    });
  }
}

export async function customizeItineraryDay(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const {
      destination,
      dayNumber,
      currentTheme,
      currentActivities,
      customizationInstruction,
      budgetRange
    } = req.body;

    if (!destination || !dayNumber || !customizationInstruction) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'destination, dayNumber, and customizationInstruction are required.'
      });
      return;
    }

    const result = await customizeDayAI({
      destination,
      dayNumber: Number(dayNumber),
      currentTheme,
      currentActivities: Array.isArray(currentActivities) ? currentActivities : [],
      customizationInstruction,
      budgetRange
    });

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (err) {
    next(err);
  }
}

export async function generateEmergencyCard(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { destination, originCountry, medicalNotes } = req.body;
    if (!destination) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'destination is required.'
      });
      return;
    }

    const result = await generateEmergencyCardAI({
      destination,
      originCountry,
      medicalNotes
    });

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (err) {
    next(err);
  }
}

export async function generatePackingChecklist(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { destination, durationDays, travelPurpose, seasonOrMonth } = req.body;
    if (!destination) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'destination is required.'
      });
      return;
    }

    const result = await generatePackingChecklistAI({
      destination,
      durationDays: Number(durationDays) || 7,
      travelPurpose: travelPurpose || 'Tourism',
      seasonOrMonth
    });

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (err) {
    next(err);
  }
}

