import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { Plane, Lock, Mail, ArrowRight, Sparkles, AlertCircle, Loader2 } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { user, loading, signInWithEmail, signInWithDemo, signInWithGoogle, resetPasswordForEmail } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [resetSuccess, setResetSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  const from = (location.state as any)?.from?.pathname || '/dashboard';

  // Detect OAuth redirect errors from URL hash (e.g., from Supabase OAuth redirect)
  useEffect(() => {
    const hash = window.location.hash || '';
    const search = window.location.search || '';
    const paramsString = hash.replace(/^#/, '') || search.replace(/^\?/, '');
    if (paramsString) {
      const params = new URLSearchParams(paramsString);
      const err = params.get('error_description') || params.get('error');
      if (err) {
        const decoded = decodeURIComponent(err).replace(/\+/g, ' ');
        if (decoded.toLowerCase().includes('unsupported') || decoded.toLowerCase().includes('not enabled') || decoded.toLowerCase().includes('provider')) {
          setErrorMsg('Google OAuth is pending activation in your Supabase Dashboard (Authentication → Providers → Google). You can sign in immediately with your Gmail address and password below, or use Instant Sandbox Mode.');
        } else {
          setErrorMsg(`OAuth notice: ${decoded}`);
        }
        window.history.replaceState(null, '', window.location.pathname);
      }
    }
  }, []);

  // Redirect authenticated users away from login
  if (!loading && user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setResetSuccess(null);
    setSubmitting(true);

    const res = await signInWithEmail(email, password);
    setSubmitting(false);

    if (res.error) {
      setErrorMsg(res.error);
    } else {
      navigate(from, { replace: true });
    }
  };

  const handleGoogleLogin = async () => {
    setErrorMsg(null);
    setGoogleLoading(true);
    const res = await signInWithGoogle();
    setGoogleLoading(false);
    if (res.error) {
      setErrorMsg(res.error);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) return;
    setResetLoading(true);
    const res = await resetPasswordForEmail(resetEmail);
    setResetLoading(false);
    setResetSuccess(res.message);
    setShowForgotModal(false);
    setResetEmail('');
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
            <Sparkles className="w-4 h-4 text-cyan-400" /> Instant Sandbox Access
          </div>
          <p className="text-xs text-slate-400">
            Preview the full suite with sample data and test AI generation without email credentials.
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
              {errorMsg.toLowerCase().includes('invalid email or password') && (
                <div className="pt-1.5 border-t border-rose-500/20 flex items-center justify-between">
                  <span className="text-[11px] text-slate-300">Need to create an account first?</span>
                  <Link
                    to={`/signup${email ? `?email=${encodeURIComponent(email)}` : ''}`}
                    className="text-xs font-bold text-cyan-400 hover:text-cyan-300 underline"
                  >
                    Sign Up Now →
                  </Link>
                </div>
              )}
            </div>
          )}

          {resetSuccess && (
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-start gap-2">
              <Sparkles className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
              <span>{resetSuccess}</span>
            </div>
          )}

          {/* Optional Google OAuth */}
          <div>
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={googleLoading}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-700/80 text-xs font-semibold text-slate-200 hover:text-white flex items-center justify-center gap-2.5 transition-all"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{googleLoading ? 'Redirecting to Google...' : 'Continue with Google'}</span>
            </button>
            <div className="relative flex py-4 items-center">
              <div className="flex-grow border-t border-slate-800" />
              <span className="flex-shrink mx-3 text-[11px] text-slate-500 uppercase tracking-wider">or email</span>
              <div className="flex-grow border-t border-slate-800" />
            </div>
          </div>

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
                <button
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  className="text-xs text-cyan-400 hover:text-cyan-300 hover:underline"
                >
                  Forgot password?
                </button>
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

        {/* Password Recovery Modal */}
        {showForgotModal && (
          <div className="fixed inset-0 z-50 bg-navy-950/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="glass-card p-6 rounded-2xl border-slate-700 max-w-sm w-full space-y-4 bg-navy-900">
              <h3 className="text-base font-bold text-white">Reset Account Password</h3>
              <p className="text-xs text-slate-300">
                Enter your registered email address. We will dispatch a password recovery link to your inbox.
              </p>
              <form onSubmit={handlePasswordReset} className="space-y-3">
                <input
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                />
                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={resetLoading}
                    className="px-4 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-navy-950 font-bold text-xs rounded-lg flex items-center gap-1.5"
                  >
                    {resetLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Send Reset Link'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
