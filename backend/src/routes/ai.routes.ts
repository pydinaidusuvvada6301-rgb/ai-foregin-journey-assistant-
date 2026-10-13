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
import { requireAuth, optionalAuth } from '../middleware/auth.middleware.js';

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

router.post('/itinerary', optionalAuth, generateItinerary);
router.post('/visa-check', optionalAuth, checkVisaRequirements);
router.post('/document-check', optionalAuth, upload.single('document'), analyzeDocument);
router.post('/chat', optionalAuth, chatWithCopilot);
router.post('/customize-day', optionalAuth, customizeItineraryDay);
router.post('/emergency-card', optionalAuth, generateEmergencyCard);
router.post('/packing-checklist', optionalAuth, generatePackingChecklist);

export default router;

