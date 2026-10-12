import { Router } from 'express';
import { listUserVisaChecks, removeVisaCheck } from '../controllers/visa.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/', requireAuth, listUserVisaChecks);
router.delete('/:id', requireAuth, removeVisaCheck);

export default router;
