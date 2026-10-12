import { Request, Response, NextFunction } from 'express';
import { getUserVisaChecks, deleteVisaCheck } from '../services/supabase.service.js';

export async function listUserVisaChecks(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user?.id || 'demo-user-123';
    const visaChecks = await getUserVisaChecks(userId);

    res.status(200).json({
      success: true,
      data: visaChecks
    });
  } catch (err) {
    next(err);
  }
}

export async function removeVisaCheck(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user?.id || 'demo-user-123';
    const { id } = req.params;

    const deleted = await deleteVisaCheck(userId, id);
    res.status(200).json({
      success: true,
      message: deleted ? 'Visa check record successfully removed.' : 'Record not found.'
    });
  } catch (err) {
    next(err);
  }
}
