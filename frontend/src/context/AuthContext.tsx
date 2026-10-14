import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase.js';
import { registerUserViaApi, autoConfirmEmailViaApi } from '../lib/api.js';

export interface UserSession {
  id: string;
  email: string;
  fullName: string;
  homeCountry: string;
  token?: string;
  emailConfirmed?: boolean;
  destinationPreference?: string;
  travelPurpose?: string;
  intendedDepartureDate?: string;
  recentlyViewedDestinations?: string[];
}

interface AuthContextType {
  user: UserSession | null;
  loading: boolean;
  isDemoUser: boolean;
  isPasswordRecovery: boolean;
  signInWithEmail: (email: string, password: string) => Promise<{ error: string | null }>;
  signUpWithEmail: (email: string, password: string, fullName: string, homeCountry: string) => Promise<{ error: string | null }>;
  signInWithGoogle: () => Promise<{ error: string | null }>;
  resetPasswordForEmail: (email: string) => Promise<{ error: string | null; message: string }>;
  updatePassword: (newPassword: string) => Promise<{ error: string | null }>;
  deleteUserAccountAndData: () => Promise<{ error: string | null }>;
  recordViewedDestination: (dest: string) => void;
  signInWithDemo: () => void;
  signOut: () => Promise<void>;
  updateUserProfileState: (updates: Partial<UserSession>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEMO_USER_STORAGE_KEY = 'visavoyage_demo_user';
const PREFERENCES_STORAGE_PREFIX = 'visavoyage_prefs_';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDemoUser, setIsDemoUser] = useState(false);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);

  // Helper to load client-side persistent preferences without storing credentials
  const loadLocalPreferences = (userId: string) => {
    try {
      const saved = localStorage.getItem(`${PREFERENCES_STORAGE_PREFIX}${userId}`);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  };

  const saveLocalPreferences = (userId: string, prefs: Partial<UserSession>) => {
    try {
      const existing = loadLocalPreferences(userId);
      const updated = { ...existing, ...prefs };
      localStorage.setItem(`${PREFERENCES_STORAGE_PREFIX}${userId}`, JSON.stringify(updated));
    } catch {
      // Ignore storage errors
    }
  };

  useEffect(() => {
    let mounted = true;

    // Detect if URL contains incoming auth tokens (from email confirmation, magic link, password reset, or OAuth)
    const hash = window.location.hash || '';
    const search = window.location.search || '';
    const hasIncomingAuth =
      hash.includes('access_token=') ||
      hash.includes('type=') ||
      hash.includes('error=') ||
      search.includes('code=');

    // 1. If incoming live auth is present, clear demo user session so live login succeeds
    if (hasIncomingAuth) {
      localStorage.removeItem(DEMO_USER_STORAGE_KEY);
      setIsDemoUser(false);
    } else {
      // Check for active demo user session
      const savedDemo = localStorage.getItem(DEMO_USER_STORAGE_KEY);
      if (savedDemo) {
        try {
          const parsed = JSON.parse(savedDemo);
          if (mounted) {
            setUser(parsed);
            setIsDemoUser(true);
            setLoading(false);
          }
          return;
        } catch (e) {
          localStorage.removeItem(DEMO_USER_STORAGE_KEY);
        }
      }
    }

    // 2. Initialize and verify live Supabase session via SDK
    if (isSupabaseConfigured) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (!mounted) return;
        if (session?.user) {
          const prefs = loadLocalPreferences(session.user.id);
          const userSession: UserSession = {
            id: session.user.id,
            email: session.user.email || '',
            fullName: session.user.user_metadata?.full_name || 'Traveler',
            homeCountry: session.user.user_metadata?.home_country || 'United States',
            emailConfirmed: Boolean(session.user.email_confirmed_at),
            ...prefs
          };
          setUser(userSession);
          setIsDemoUser(false);
        }
        setLoading(false);
      }).catch(() => {
        if (mounted) setLoading(false);
      });

      // 3. Listen to Supabase Auth state changes
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (!mounted) return;

        if (event === 'PASSWORD_RECOVERY') {
          setIsPasswordRecovery(true);
        }

        if (session?.user) {
          const prefs = loadLocalPreferences(session.user.id);
          const userSession: UserSession = {
            id: session.user.id,
            email: session.user.email || '',
            fullName: session.user.user_metadata?.full_name || 'Traveler',
            homeCountry: session.user.user_metadata?.home_country || 'United States',
            emailConfirmed: Boolean(session.user.email_confirmed_at),
            ...prefs
          };
          setUser(userSession);
          setIsDemoUser(false);
        } else if (event === 'SIGNED_OUT') {
          if (!localStorage.getItem(DEMO_USER_STORAGE_KEY)) {
            setUser(null);
            setIsDemoUser(false);
          }
        }
      });

      return () => {
        mounted = false;
        subscription.unsubscribe();
      };
    } else {
      setLoading(false);
    }
  }, []);

  const signInWithEmail = async (email: string, password: string) => {
    const cleanEmail = email.trim().toLowerCase();

    try {
      // Step 1: Attempt standard Supabase login
      let { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password
      });

      // Step 2: Auto-confirm fallback if email confirmation is required by project policy
      if (error && (error.message.toLowerCase().includes('confirm') || error.message.toLowerCase().includes('not verified'))) {
        try {
          await autoConfirmEmailViaApi(cleanEmail);
          const retry = await supabase.auth.signInWithPassword({
            email: cleanEmail,
            password
          });
          data = retry.data;
          error = retry.error;
        } catch (_autoErr) {
          // Keep original error
        }
      }

      if (error) {
        // Generic error to prevent account enumeration
        if (
          error.message.toLowerCase().includes('invalid login credentials') ||
          error.message.toLowerCase().includes('user not found')
        ) {
          return {
            error: 'Invalid email or password. Please verify your credentials or launch Instant Demo Mode.'
          };
        }
        return { error: error.message };
      }

      if (data?.session?.user) {
        const prefs = loadLocalPreferences(data.session.user.id);
        const userSession: UserSession = {
          id: data.session.user.id,
          email: data.session.user.email || cleanEmail,
          fullName: data.session.user.user_metadata?.full_name || 'Traveler',
          homeCountry: data.session.user.user_metadata?.home_country || 'United States',
          emailConfirmed: Boolean(data.session.user.email_confirmed_at),
          ...prefs
        };
        setUser(userSession);
        setIsDemoUser(false);
        localStorage.removeItem(DEMO_USER_STORAGE_KEY);
      }

      return { error: null };
    } catch (err: any) {
      return { error: 'Authentication failed. Please verify your connection and try again.' };
    }
  };

  const signUpWithEmail = async (email: string, password: string, fullName: string, homeCountry: string) => {
    const cleanEmail = email.trim().toLowerCase();

    try {
      // Step 1: Attempt auto-confirm registration via server endpoint
      let backendRegistered = false;
      try {
        await registerUserViaApi({
          email: cleanEmail,
          password,
          fullName: fullName.trim(),
          homeCountry: homeCountry.trim()
        });
        backendRegistered = true;
      } catch (_apiErr: any) {
        // Fall back to direct Supabase auth if endpoint is unavailable
      }

      // Step 2: Acquire active Supabase session
      const { data: signData, error: signError } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password
      });

      if (!signError && signData?.session?.user) {
        const userSession: UserSession = {
          id: signData.session.user.id,
          email: signData.session.user.email || cleanEmail,
          fullName: signData.session.user.user_metadata?.full_name || fullName,
          homeCountry: signData.session.user.user_metadata?.home_country || homeCountry,
          emailConfirmed: Boolean(signData.session.user.email_confirmed_at)
        };
        setUser(userSession);
        setIsDemoUser(false);
        localStorage.removeItem(DEMO_USER_STORAGE_KEY);
        return { error: null };
      }

      // Step 3: Direct Supabase client signUp fallback
      if (!backendRegistered) {
        const { data: suData, error: suError } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            data: {
              full_name: fullName,
              home_country: homeCountry
            },
            emailRedirectTo: `${window.location.origin}/dashboard`
          }
        });

        if (suError) {
          return { error: suError.message };
        }

        if (suData?.user) {
          const userSession: UserSession = {
            id: suData.user.id,
            email: suData.user.email || cleanEmail,
            fullName: fullName || 'Traveler',
            homeCountry: homeCountry || 'United States',
            emailConfirmed: Boolean(suData.user.email_confirmed_at)
          };
          setUser(userSession);
          setIsDemoUser(false);
          localStorage.removeItem(DEMO_USER_STORAGE_KEY);
          return { error: null };
        }
      }

      if (signError) {
        return { error: signError.message };
      }

      return { error: null };
    } catch (err: any) {
      return { error: err?.message || 'Sign up failed. Please try again.' };
    }
  };

  const signInWithGoogle = async () => {
    try {
      if (!isSupabaseConfigured) {
        return { error: 'Supabase authentication service is not configured.' };
      }
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`
        }
      });
      if (error) {
        const msg = error.message.toLowerCase();
        if (msg.includes('unsupported provider') || msg.includes('not enabled') || msg.includes('provider is not enabled')) {
          return {
            error: 'Google OAuth sign-in requires enabling the Google provider in the Supabase Dashboard (Authentication → Providers → Google). You can sign in immediately using your Gmail address and password below, or launch Instant Sandbox Mode.'
          };
        }
        return { error: error.message };
      }
      return { error: null };
    } catch (err: any) {
      return { error: err?.message || 'Google OAuth failed to initialize.' };
    }
  };

  const signInWithDemo = () => {
    const demoSession: UserSession = {
      id: 'demo-user-123',
      email: 'alex.vance@visavoyage.ai',
      fullName: 'Alex Vance',
      homeCountry: 'United States',
      emailConfirmed: true
    };
    setUser(demoSession);
    setIsDemoUser(true);
    localStorage.setItem(DEMO_USER_STORAGE_KEY, JSON.stringify(demoSession));
  };

  const signOut = async () => {
    try {
      if (isSupabaseConfigured) {
        await supabase.auth.signOut();
      }
    } catch (_e) {
      // Ignore signOut errors
    }
    localStorage.removeItem(DEMO_USER_STORAGE_KEY);
    setUser(null);
    setIsDemoUser(false);
    setIsPasswordRecovery(false);
  };

  const resetPasswordForEmail = async (email: string) => {
    const cleanEmail = email.trim().toLowerCase();
    const genericSuccess = 'If an account exists with this email address, password recovery instructions have been dispatched. Please check your inbox.';

    try {
      if (isSupabaseConfigured) {
        const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
          redirectTo: `${window.location.origin}/reset-password`
        });
        if (error) {
          console.warn('[Auth] Password reset notice:', error.message);
        }
      }
      // Always return generic success to protect against account enumeration
      return { error: null, message: genericSuccess };
    } catch (_err) {
      return { error: null, message: genericSuccess };
    }
  };

  const updatePassword = async (newPassword: string) => {
    try {
      if (!isSupabaseConfigured) {
        return { error: 'Supabase connection is required to update account password.' };
      }
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });
      if (error) {
        return { error: error.message };
      }
      setIsPasswordRecovery(false);
      return { error: null };
    } catch (err: any) {
      return { error: err?.message || 'Failed to update password.' };
    }
  };

  const recordViewedDestination = (dest: string) => {
    if (!dest) return;
    const current = user?.recentlyViewedDestinations || [];
    const updated = [dest, ...current.filter((d) => d !== dest)].slice(0, 5);
    updateUserProfileState({ recentlyViewedDestinations: updated });
  };

  const deleteUserAccountAndData = async () => {
    try {
      if (user && isSupabaseConfigured && !isDemoUser) {
        // 1. Delete user files from private storage bucket if any exist
        try {
          const { data: files } = await supabase.storage.from('travel-documents').list(user.id);
          if (files && files.length > 0) {
            const filePaths = files.map(f => `${user.id}/${f.name}`);
            await supabase.storage.from('travel-documents').remove(filePaths);
          }
        } catch (storageErr) {
          console.warn('[Auth] Non-blocking storage cleanup notice:', storageErr);
        }

        // 2. Cascade delete on public.profiles cascades to all user tables (ON DELETE CASCADE)
        await supabase.from('profiles').delete().eq('id', user.id);
      }
      await signOut();
      return { error: null };
    } catch (err: any) {
      console.error('Account data deletion error:', err);
      return { error: err?.message || 'Failed to delete account data' };
    }
  };

  const updateUserProfileState = (updates: Partial<UserSession>) => {
    if (user) {
      const updated = { ...user, ...updates };
      setUser(updated);
      if (isDemoUser) {
        localStorage.setItem(DEMO_USER_STORAGE_KEY, JSON.stringify(updated));
      } else {
        saveLocalPreferences(user.id, updates);
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isDemoUser,
        isPasswordRecovery,
        signInWithEmail,
        signUpWithEmail,
        signInWithGoogle,
        resetPasswordForEmail,
        updatePassword,
        deleteUserAccountAndData,
        recordViewedDestination,
        signInWithDemo,
        signOut,
        updateUserProfileState
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
