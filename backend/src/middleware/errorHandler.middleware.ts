import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  console.error('[Error Handler]', err);

  if (err instanceof ZodError) {
    res.status(400).json({
      error: 'Validation Error',
      message: 'Request payload failed schema validation.',
      details: err.errors.map(e => ({
        path: e.path.join('.'),
        message: e.message
      }))
    });
    return;
  }

  if (err?.name === 'MulterError') {
    res.status(400).json({
      error: 'Upload Error',
      message: err.message || 'File upload failed.'
    });
    return;
  }

  const statusCode = err?.status || err?.statusCode || 500;
  const message = err?.message || 'Internal Server Error';

  res.status(statusCode).json({
    error: err?.name || 'Server Error',
    message
  });
}
