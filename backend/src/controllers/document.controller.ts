import { Request, Response, NextFunction } from 'express';
import { getUserDocumentChecks } from '../services/supabase.service.js';

export async function listUserDocumentChecks(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user?.id || 'demo-user-123';
    const documents = await getUserDocumentChecks(userId);

    res.status(200).json({
      success: true,
      data: documents
    });
  } catch (err) {
    next(err);
  }
}
