import { Router, Request, Response } from 'express';
import { supabaseAdmin, isSupabaseConfigured } from '../services/supabase.service.js';

const router = Router();

// Public configuration endpoint providing verified Supabase client credentials
router.get('/config', (_req: Request, res: Response) => {
  const supabaseUrl = process.env.SUPABASE_URL || 'https://jclpmlxbvqfjpybkwjdb.supabase.co';
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpjbHBtbHhidnFmanB5Ymt3amRiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE3ODc4NDUsImV4cCI6MjEwNzM2Mzg0NX0.S6lxXQZ0u4Gl1d-nWy7F0bpcF31Cdx1g232CMwbOWB0';

  res.status(200).json({
    configured: isSupabaseConfigured,
    supabaseUrl,
    supabaseAnonKey
  });
});

// Auto-provision user account with instant email confirmation (no SMTP blocking)
router.post('/register', async (req: Request, res: Response) => {
  const { email, password, fullName, homeCountry } = req.body;

  if (!email || !password) {
    res.status(400).json({
      error: 'ValidationError',
      message: 'Email and password are required.'
    });
    return;
  }

  if (!supabaseAdmin) {
    res.status(503).json({
      error: 'ServiceUnavailable',
      message: 'Supabase admin service is not configured.'
    });
    return;
  }

  try {
    // 1. Create or ensure user exists with email_confirm: true
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: email.trim().toLowerCase(),
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName || 'Traveler',
        home_country: homeCountry || 'United States'
      }
    });

    if (error) {
      // If user already exists, attempt to auto-confirm their email and update metadata
      if (error.message?.toLowerCase().includes('already') || (error as any).code === 'email_exists') {
        const { data: userList } = await supabaseAdmin.auth.admin.listUsers();
        const existing = userList?.users?.find(u => u.email?.toLowerCase() === email.trim().toLowerCase());
        if (existing) {
          await supabaseAdmin.auth.admin.updateUserById(existing.id, {
            email_confirm: true,
            user_metadata: {
              full_name: fullName || existing.user_metadata?.full_name || 'Traveler',
              home_country: homeCountry || existing.user_metadata?.home_country || 'United States'
            }
          });
          res.status(200).json({
            success: true,
            message: 'User already exists and email is now confirmed. Please log in with your credentials.',
            userId: existing.id
          });
          return;
        }
      }

      res.status(400).json({
        error: 'RegistrationFailed',
        message: error.message
      });
      return;
    }

    const newUser = data.user;

    // 2. Insert initial profile record in profiles table
    try {
      await supabaseAdmin.from('profiles').upsert({
        id: newUser.id,
        full_name: fullName || 'Traveler',
        home_country: homeCountry || 'United States'
      });
    } catch (profileErr) {
      console.warn('[Auth Routes] Non-critical profile upsert warning:', profileErr);
    }

    res.status(201).json({
      success: true,
      message: 'Account registered and verified successfully.',
      userId: newUser.id
    });
  } catch (err: any) {
    console.error('[Auth Routes] Registration exception:', err);
    res.status(500).json({
      error: 'InternalServerError',
      message: err?.message || 'An unexpected error occurred during registration.'
    });
  }
});

// Auto-confirm existing unconfirmed user email
router.post('/auto-confirm', async (req: Request, res: Response) => {
  const { email } = req.body;

  if (!email || !supabaseAdmin) {
    res.status(400).json({ error: 'Email is required and admin must be configured.' });
    return;
  }

  try {
    const { data: userList, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    if (listError) throw listError;

    const user = userList?.users?.find(u => u.email?.toLowerCase() === email.trim().toLowerCase());

    if (!user) {
      res.status(404).json({ error: 'UserNotFound', message: 'No account found with this email.' });
      return;
    }

    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
      email_confirm: true
    });

    if (updateError) throw updateError;

    res.status(200).json({
      success: true,
      message: 'Email successfully verified. You can now log in.'
    });
  } catch (err: any) {
    console.error('[Auth Routes] Auto-confirm error:', err);
    res.status(500).json({ error: 'AutoConfirmFailed', message: err?.message || 'Failed to auto-confirm.' });
  }
});

export default router;
