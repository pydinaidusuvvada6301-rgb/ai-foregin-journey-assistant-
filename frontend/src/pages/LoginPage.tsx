import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { isSupabaseConfigured } from '../lib/supabase.js';
import { Plane, Lock, Mail, ArrowRight, Sparkles, AlertCircle, Loader2 } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { signInWithEmail, signInWithDemo } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as any)?.from?.pathname || '/dashboard';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSubmitting(true);

    const res = await signInWithEmail(email, password);
    setSubmitting(false);

    if (res.error) {
      setErrorMsg(res.error);
    } else {
      navigate(from, { replace: true });
    }
  };

  const handleDemoLogin = () => {
    signInWithDemo();
    navigate('/dashboard');
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-600 text-white shadow-glow-cyan mb-2">
            <Plane className="w-6 h-6 transform -rotate-45" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Welcome to VisaVoyage AI
          </h1>
          <p className="text-sm text-slate-400">
            Sign in to access your travel command center & compliance vault.
          </p>
        </div>

        {/* Quick Demo Access Callout */}
        <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-500/30 text-center space-y-2">
          <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-indigo-300">
            <Sparkles className="w-4 h-4 text-cyan-400" /> Instant Evaluator Access
          </div>
          <p className="text-xs text-slate-400">
            Preview the full suite with sample data and test AI generation without configuring Supabase.
          </p>
          <button
            type="button"
            onClick={handleDemoLogin}
            className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-glow-indigo transition-all transform active:scale-95"
          >
            Launch Interactive Demo Mode
          </button>
        </div>

        {/* Login Card */}
        <div className="glass-card p-6 sm:p-8 space-y-6 border-slate-800">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex flex-col gap-2">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                <span>{errorMsg}</span>
              </div>
              {errorMsg.toLowerCase().includes('create an account') && (
                <div className="flex items-center gap-3 pt-1 border-t border-rose-500/20">
                  <Link
                    to="/signup"
                    className="text-xs font-bold text-cyan-400 hover:text-cyan-300 underline flex items-center gap-1"
                  >
                    Create Account with this Email →
                  </Link>
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-900/80 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-300">
                  Password
                </label>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-900/80 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 px-4 rounded-xl text-sm font-bold bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-navy-950 shadow-glow-cyan flex items-center justify-center gap-2 transition-all transform active:scale-95"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Verifying...
                </>
              ) : (
                <>
                  Sign In with Supabase <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="pt-4 border-t border-slate-800 text-center text-xs text-slate-400">
            Don't have an account?{' '}
            <Link to="/signup" className="text-cyan-400 hover:underline font-semibold">
              Create an account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
