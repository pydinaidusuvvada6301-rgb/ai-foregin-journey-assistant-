import { createClient } from '@supabase/supabase-js';

// Live production credentials for VisaVoyage AI Supabase project
const FALLBACK_SUPABASE_URL = 'https://jclpmlxbvqfjpybkwjdb.supabase.co';
const FALLBACK_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpjbHBtbHhidnFmanB5Ymt3amRiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE3ODc4NDUsImV4cCI6MjEwNzM2Mzg0NX0.S6lxXQZ0u4Gl1d-nWy7F0bpcF31Cdx1g232CMwbOWB0';

// Robust URL sanitizer guaranteeing valid protocol and no trailing slash
function sanitizeSupabaseUrl(rawUrl?: string): string {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return FALLBACK_SUPABASE_URL;
  }
  let url = rawUrl.trim();
  if (!url || url.includes('your-supabase-project') || url.includes('placeholder')) {
    return FALLBACK_SUPABASE_URL;
  }
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = `https://${url}`;
  }
  url = url.replace(/\/+$/, '');
  try {
    const parsed = new URL(url);
    return parsed.origin;
  } catch (_e) {
    return FALLBACK_SUPABASE_URL;
  }
}

function sanitizeAnonKey(rawKey?: string): string {
  if (!rawKey || typeof rawKey !== 'string') {
    return FALLBACK_SUPABASE_ANON_KEY;
  }
  const key = rawKey.trim();
  if (!key || key.includes('your-supabase-anon-key') || key.includes('placeholder')) {
    return FALLBACK_SUPABASE_ANON_KEY;
  }
  return key;
}

const resolvedUrl = sanitizeSupabaseUrl(import.meta.env.VITE_SUPABASE_URL);
const resolvedAnonKey = sanitizeAnonKey(import.meta.env.VITE_SUPABASE_ANON_KEY);

export const isSupabaseConfigured = Boolean(
  resolvedUrl &&
  resolvedAnonKey &&
  !resolvedAnonKey.includes('placeholder')
);

// Safe initialization of client-side Supabase instance - never fails URL construction
export const supabase = createClient(resolvedUrl, resolvedAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: typeof window !== 'undefined'
  }
});
