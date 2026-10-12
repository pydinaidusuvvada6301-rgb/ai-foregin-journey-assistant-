import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { generateItineraryAI, checkVisaRequirementsAI, analyzeDocumentAI } from '../services/gemini.service.js';
import { saveItinerary, saveVisaCheck, saveDocumentCheck } from '../services/supabase.service.js';

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
      console.warn('[AI Controller] DB save failed, returning result anyway:', dbErr);
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
