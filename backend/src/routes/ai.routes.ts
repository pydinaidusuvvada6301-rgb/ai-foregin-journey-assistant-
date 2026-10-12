import { Router } from 'express';
import multer from 'multer';
import { generateItinerary, checkVisaRequirements, analyzeDocument } from '../controllers/ai.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

const router = Router();

router.post('/itinerary', requireAuth, generateItinerary);
router.post('/visa-check', requireAuth, checkVisaRequirements);
router.post('/document-check', requireAuth, upload.single('document'), analyzeDocument);

export default router;
