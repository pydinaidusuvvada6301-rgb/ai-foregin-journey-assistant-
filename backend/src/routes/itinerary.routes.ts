import { Router } from 'express';
import { listUserItineraries, removeItinerary } from '../controllers/itinerary.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/', requireAuth, listUserItineraries);
router.delete('/:id', requireAuth, removeItinerary);

export default router;
