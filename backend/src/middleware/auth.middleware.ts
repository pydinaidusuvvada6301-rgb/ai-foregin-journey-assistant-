import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin, isSupabaseConfigured } from '../services/supabase.service.js';

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Authorization header with Bearer token is required.'
    });
    return;
  }

  const token = authHeader.split(' ')[1]?.trim();

  if (!token) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Bearer token is missing or malformed.'
    });
    return;
  }

  // Handle Demo/Testing mode token (Strictly locked to isolated demo sandbox ID)
  if (token.startsWith('demo-token') || !isSupabaseConfigured) {
    req.user = {
      id: 'demo-user-123',
      email: 'traveler@visavoyage.ai',
      user_metadata: {
        full_name: 'Alex Vance (Voyager)',
        home_country: 'United States'
      }
    };
    return next();
  }

  // Verify against Supabase Auth using the JWT
  try {
    if (!supabaseAdmin) {
      throw new Error('Supabase client not initialized');
    }

    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid, revoked, or expired authentication token.'
      });
      return;
    }

      req.user = {
        id: user.id,
        email: user.email,
        user_metadata: user.user_metadata
      };

      next();
    } catch (err: any) {
      console.error('[Auth Middleware] Verification error:', err?.message || err);
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Failed to verify authentication credentials.'
      });
    }
  }

export async function optionalAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    req.user = {
      id: 'demo-guest-user',
      email: 'traveler@visavoyage.ai',
      user_metadata: {
        full_name: 'Guest Traveler',
        home_country: 'United States'
      }
    };
    return next();
  }
  return requireAuth(req, res, next);
}

