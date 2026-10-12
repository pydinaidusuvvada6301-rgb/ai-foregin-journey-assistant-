import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase.js';
import { registerUserViaApi, autoConfirmEmailViaApi } from '../lib/api.js';

export interface UserSession {
  id: string;
  email: string;
  fullName: string;
  homeCountry: string;
  token: string;
}

interface AuthContextType {
  user: UserSession | null;
  loading: boolean;
  isDemoUser: boolean;
  signInWithEmail: (email: string, password: string) => Promise<{ error: string | null }>;
  signUpWithEmail: (email: string, password: string, fullName: string, homeCountry: string) => Promise<{ error: string | null }>;
  signInWithDemo: () => void;
  signOut: () => Promise<void>;
  updateUserProfileState: (updates: Partial<UserSession>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ACTIVE_USER_STORAGE_KEY = 'visavoyage_active_user';
const DEMO_USER_STORAGE_KEY = 'visavoyage_demo_user';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDemoUser, setIsDemoUser] = useState(false);

  useEffect(() => {
    // 1. Check local storage for active demo user session
    const savedDemo = localStorage.getItem(DEMO_USER_STORAGE_KEY);
    if (savedDemo) {
      try {
        const parsed = JSON.parse(savedDemo);
        setUser(parsed);
        setIsDemoUser(true);
        setLoading(false);
        return;
      } catch (e) {
        localStorage.removeItem(DEMO_USER_STORAGE_KEY);
      }
    }

    // 2. Check cached active user session
    const cachedActive = localStorage.getItem(ACTIVE_USER_STORAGE_KEY);
    if (cachedActive) {
      try {
        const parsed = JSON.parse(cachedActive);
        setUser(parsed);
        setIsDemoUser(false);
      } catch (e) {
        localStorage.removeItem(ACTIVE_USER_STORAGE_KEY);
      }
    }

    // 3. Check live Supabase session
    if (isSupabaseConfigured) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          const userSession: UserSession = {
            id: session.user.id,
            email: session.user.email || '',
            fullName: session.user.user_metadata?.full_name || 'Traveler',
            homeCountry: session.user.user_metadata?.home_country || 'United States',
            token: session.access_token
          };
          setUser(userSession);
          setIsDemoUser(false);
          localStorage.setItem(ACTIVE_USER_STORAGE_KEY, JSON.stringify(userSession));
        }
        setLoading(false);
      }).catch(() => {
        setLoading(false);
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          const userSession: UserSession = {
            id: session.user.id,
            email: session.user.email || '',
            fullName: session.user.user_metadata?.full_name || 'Traveler',
            homeCountry: session.user.user_metadata?.home_country || 'United States',
            token: session.access_token
          };
          setUser(userSession);
          setIsDemoUser(false);
          localStorage.setItem(ACTIVE_USER_STORAGE_KEY, JSON.stringify(userSession));
        } else if (!localStorage.getItem(DEMO_USER_STORAGE_KEY)) {
          // If no session and no demo user, verify if cached active session is still wanted
        }
      });

      return () => {
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

      // Step 2: If rejected because email is not confirmed, auto-confirm via backend and retry
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
        if (error.message.toLowerCase().includes('invalid login credentials')) {
          return {
            error: 'Invalid login credentials. If you haven\'t created an account with this email yet, click "Create an account" below or use Instant Demo Mode.'
          };
        }
        return { error: error.message };
      }

      if (data?.session?.user) {
        const userSession: UserSession = {
          id: data.session.user.id,
          email: data.session.user.email || cleanEmail,
          fullName: data.session.user.user_metadata?.full_name || 'Traveler',
          homeCountry: data.session.user.user_metadata?.home_country || 'United States',
          token: data.session.access_token
        };
        setUser(userSession);
        setIsDemoUser(false);
        localStorage.setItem(ACTIVE_USER_STORAGE_KEY, JSON.stringify(userSession));
        localStorage.removeItem(DEMO_USER_STORAGE_KEY);
      }

      return { error: null };
    } catch (err: any) {
      return { error: err?.message || 'Login failed. Please check your credentials.' };
    }
  };

  const signUpWithEmail = async (email: string, password: string, fullName: string, homeCountry: string) => {
    const cleanEmail = email.trim().toLowerCase();

    try {
      // Step 1: Use backend auto-confirm registration (bypasses SMTP lock and guarantees verified user)
      let backendRegistered = false;
      try {
        await registerUserViaApi({
          email: cleanEmail,
          password,
          fullName: fullName.trim(),
          homeCountry: homeCountry.trim()
        });
        backendRegistered = true;
      } catch (apiErr: any) {
        // If user already exists or backend had an issue, we fall back to direct Supabase auth
        const errMsg = apiErr?.response?.data?.message || apiErr?.message || '';
        if (errMsg.toLowerCase().includes('already') || errMsg.toLowerCase().includes('exists')) {
          // Attempt sign in directly in case user already has an account
        }
      }

      // Step 2: Sign in to acquire the active Supabase JWT session
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
          token: signData.session.access_token
        };
        setUser(userSession);
        setIsDemoUser(false);
        localStorage.setItem(ACTIVE_USER_STORAGE_KEY, JSON.stringify(userSession));
        localStorage.removeItem(DEMO_USER_STORAGE_KEY);
        return { error: null };
      }

      // Step 3: Direct Supabase signUp fallback if sign-in wasn't immediately ready
      if (!backendRegistered) {
        const { data: suData, error: suError } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            data: {
              full_name: fullName,
              home_country: homeCountry
            }
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
            token: suData.session?.access_token || `active-token-${suData.user.id}`
          };
          setUser(userSession);
          setIsDemoUser(false);
          localStorage.setItem(ACTIVE_USER_STORAGE_KEY, JSON.stringify(userSession));
          localStorage.removeItem(DEMO_USER_STORAGE_KEY);
          return { error: null };
        }
      }

      // If sign in gave an error after registration
      if (signError) {
        return { error: signError.message };
      }

      return { error: null };
    } catch (err: any) {
      return { error: err?.message || 'Sign up failed. Please try again.' };
    }
  };

  const signInWithDemo = () => {
    const demoSession: UserSession = {
      id: 'demo-user-123',
      email: 'alex.vance@visavoyage.ai',
      fullName: 'Alex Vance',
      homeCountry: 'United States',
      token: 'demo-token-demo-user-123'
    };
    setUser(demoSession);
    setIsDemoUser(true);
    localStorage.setItem(DEMO_USER_STORAGE_KEY, JSON.stringify(demoSession));
    localStorage.removeItem(ACTIVE_USER_STORAGE_KEY);
  };

  const signOut = async () => {
    try {
      if (isSupabaseConfigured) {
        await supabase.auth.signOut();
      }
    } catch (_e) {
      // Ignore sign out errors
    }
    localStorage.removeItem(DEMO_USER_STORAGE_KEY);
    localStorage.removeItem(ACTIVE_USER_STORAGE_KEY);
    setUser(null);
    setIsDemoUser(false);
  };

  const updateUserProfileState = (updates: Partial<UserSession>) => {
    if (user) {
      const updated = { ...user, ...updates };
      setUser(updated);
      if (isDemoUser) {
        localStorage.setItem(DEMO_USER_STORAGE_KEY, JSON.stringify(updated));
      } else {
        localStorage.setItem(ACTIVE_USER_STORAGE_KEY, JSON.stringify(updated));
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isDemoUser,
        signInWithEmail,
        signUpWithEmail,
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
