import { Request, Response, NextFunction } from 'express';
import { getUserItineraries, deleteItinerary } from '../services/supabase.service.js';

export async function listUserItineraries(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user?.id || 'demo-user-123';
    const itineraries = await getUserItineraries(userId);

    res.status(200).json({
      success: true,
      data: itineraries
    });
  } catch (err) {
    next(err);
  }
}

export async function removeItinerary(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user?.id || 'demo-user-123';
    const { id } = req.params;

    const deleted = await deleteItinerary(userId, id);
    res.status(200).json({
      success: true,
      message: deleted ? 'Itinerary successfully deleted.' : 'Record not found or already deleted.'
    });
  } catch (err) {
    next(err);
  }
}
