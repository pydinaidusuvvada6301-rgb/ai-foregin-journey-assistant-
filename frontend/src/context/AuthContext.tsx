import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase.js';

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

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDemoUser, setIsDemoUser] = useState(false);

  useEffect(() => {
    // 1. Check local storage for active demo user session
    const savedDemo = localStorage.getItem('visavoyage_demo_user');
    if (savedDemo) {
      try {
        const parsed = JSON.parse(savedDemo);
        setUser(parsed);
        setIsDemoUser(true);
        setLoading(false);
        return;
      } catch (e) {
        localStorage.removeItem('visavoyage_demo_user');
      }
    }

    // 2. If Supabase is configured, check live Supabase session
    if (isSupabaseConfigured) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          setUser({
            id: session.user.id,
            email: session.user.email || '',
            fullName: session.user.user_metadata?.full_name || 'Traveler',
            homeCountry: session.user.user_metadata?.home_country || 'United States',
            token: session.access_token
          });
          setIsDemoUser(false);
        }
        setLoading(false);
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          setUser({
            id: session.user.id,
            email: session.user.email || '',
            fullName: session.user.user_metadata?.full_name || 'Traveler',
            homeCountry: session.user.user_metadata?.home_country || 'United States',
            token: session.access_token
          });
          setIsDemoUser(false);
        } else if (!localStorage.getItem('visavoyage_demo_user')) {
          setUser(null);
        }
        setLoading(false);
      });

      return () => {
        subscription.unsubscribe();
      };
    } else {
      setLoading(false);
    }
  }, []);

  const signInWithEmail = async (email: string, password: string) => {
    if (!isSupabaseConfigured) {
      return {
        error: 'Supabase credentials are not yet configured in client/.env. Please use the "Launch Interactive Demo Mode" button to preview all features!'
      };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) return { error: error.message };

      if (data.session?.user) {
        setUser({
          id: data.session.user.id,
          email: data.session.user.email || '',
          fullName: data.session.user.user_metadata?.full_name || 'Traveler',
          homeCountry: data.session.user.user_metadata?.home_country || 'United States',
          token: data.session.access_token
        });
        setIsDemoUser(false);
        localStorage.removeItem('visavoyage_demo_user');
      }

      return { error: null };
    } catch (err: any) {
      return { error: err?.message || 'Login failed' };
    }
  };

  const signUpWithEmail = async (email: string, password: string, fullName: string, homeCountry: string) => {
    if (!isSupabaseConfigured) {
      return {
        error: 'Supabase is not yet configured. Please configure client/.env or use Interactive Demo Mode.'
      };
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            home_country: homeCountry
          }
        }
      });

      if (error) return { error: error.message };

      if (data.session?.user) {
        setUser({
          id: data.session.user.id,
          email: data.session.user.email || '',
          fullName,
          homeCountry,
          token: data.session.access_token
        });
        setIsDemoUser(false);
        localStorage.removeItem('visavoyage_demo_user');
      }

      return { error: null };
    } catch (err: any) {
      return { error: err?.message || 'Sign up failed' };
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
    localStorage.setItem('visavoyage_demo_user', JSON.stringify(demoSession));
  };

  const signOut = async () => {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    localStorage.removeItem('visavoyage_demo_user');
    setUser(null);
    setIsDemoUser(false);
  };

  const updateUserProfileState = (updates: Partial<UserSession>) => {
    if (user) {
      const updated = { ...user, ...updates };
      setUser(updated);
      if (isDemoUser) {
        localStorage.setItem('visavoyage_demo_user', JSON.stringify(updated));
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
