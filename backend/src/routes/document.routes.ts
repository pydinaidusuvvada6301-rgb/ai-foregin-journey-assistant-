import { Router } from 'express';
import { listUserDocumentChecks } from '../controllers/document.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/', requireAuth, listUserDocumentChecks);

export default router;
