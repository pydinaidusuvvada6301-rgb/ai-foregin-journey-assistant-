import { Router } from 'express';
import multer from 'multer';
import {
  generateItinerary,
  checkVisaRequirements,
  analyzeDocument,
  chatWithCopilot,
  customizeItineraryDay,
  generateEmergencyCard,
  generatePackingChecklist
} from '../controllers/ai.controller.js';
import { optionalAuth } from '../middleware/auth.middleware.js';
import { createUserAiRateLimiter } from '../middleware/rateLimiter.middleware.js';

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf'
]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
    files: 1
  },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME_TYPES.has(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('UnsupportedFileType: Only JPEG, PNG, WebP, and PDF documents are allowed.'));
    }
  }
});

const router = Router();

// Per-user rate limiting & concurrency protection across all AI routes
// Resolves client key from authenticated Supabase JWT (req.user.id) or client IP
const aiLimiter = createUserAiRateLimiter({
  windowMs: 60 * 1000, // 1 minute window
  maxRequests: 20,     // 20 requests per minute
  maxConcurrency: 2    // Max 2 concurrent AI generation operations per user/IP
});

router.use(optionalAuth);
router.use(aiLimiter);

router.post('/itinerary', generateItinerary);
router.post('/visa-check', checkVisaRequirements);
router.post('/document-check', upload.single('document'), analyzeDocument);
router.post('/chat', chatWithCopilot);
router.post('/customize-day', customizeItineraryDay);
router.post('/emergency-card', generateEmergencyCard);
router.post('/packing-checklist', generatePackingChecklist);

export default router;
