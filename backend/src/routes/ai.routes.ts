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
import { requireAuth } from '../middleware/auth.middleware.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

const router = Router();

router.post('/itinerary', requireAuth, generateItinerary);
router.post('/visa-check', requireAuth, checkVisaRequirements);
router.post('/document-check', requireAuth, upload.single('document'), analyzeDocument);
router.post('/chat', requireAuth, chatWithCopilot);
router.post('/customize-day', requireAuth, customizeItineraryDay);
router.post('/emergency-card', requireAuth, generateEmergencyCard);
router.post('/packing-checklist', requireAuth, generatePackingChecklist);

export default router;

