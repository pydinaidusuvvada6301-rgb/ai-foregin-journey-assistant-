import { Request, Response, NextFunction } from 'express';
import { getUserProfile, upsertUserProfile } from '../services/supabase.service.js';

export async function getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user?.id || 'demo-user-123';
    const profile = await getUserProfile(userId);

    res.status(200).json({
      success: true,
      data: profile
    });
  } catch (err) {
    next(err);
  }
}

export async function updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user?.id || 'demo-user-123';
    const { full_name, home_country } = req.body;

    const profile = await upsertUserProfile(userId, {
      full_name,
      home_country
    });

    res.status(200).json({
      success: true,
      data: profile
    });
  } catch (err) {
    next(err);
  }
}
