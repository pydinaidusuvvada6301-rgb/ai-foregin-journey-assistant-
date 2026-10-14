import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.js';
import { Navbar } from './components/Navbar.js';
import { Footer } from './components/Footer.js';
import { ProtectedRoute } from './components/ProtectedRoute.js';
import { GeminiCopilotDrawer } from './components/GeminiCopilotDrawer.js';
import { Sparkles } from 'lucide-react';

import { LandingPage } from './pages/LandingPage.js';
import { LoginPage } from './pages/LoginPage.js';
import { SignupPage } from './pages/SignupPage.js';
import { UpdatePasswordPage } from './pages/UpdatePasswordPage.js';
import { DashboardPage } from './pages/DashboardPage.js';
import { ItineraryPage } from './pages/ItineraryPage.js';
import { VisaCheckerPage } from './pages/VisaCheckerPage.js';
import { DocumentAnalyzerPage } from './pages/DocumentAnalyzerPage.js';
import { SettingsPage } from './pages/SettingsPage.js';
import { MobilityGlobePage } from './pages/MobilityGlobePage.js';

// Automatically handles incoming email confirmation, magic link, and password recovery tokens from Supabase
const AuthRedirectHandler: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const hash = window.location.hash || '';
    if (hash.includes('access_token=') || hash.includes('type=')) {
      const params = new URLSearchParams(hash.replace(/^#/, ''));
      const type = params.get('type');
      const error = params.get('error_description') || params.get('error');

      if (error) {
        navigate(`/login?error=${encodeURIComponent(error)}`, { replace: true });
        return;
      }

      if (type === 'recovery') {
        navigate('/reset-password', { replace: true });
      } else if (location.pathname === '/' || location.pathname === '/login' || location.pathname === '/signup') {
        const timer = setTimeout(() => {
          navigate('/dashboard', { replace: true });
        }, 200);
        return () => clearTimeout(timer);
      }
    }
  }, [location.pathname, navigate]);

  return null;
};

export const App: React.FC = () => {
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);

  return (
    <AuthProvider>
      <Router>
        <AuthRedirectHandler />
        <div className="min-h-screen flex flex-col bg-navy-950 text-slate-100 relative">
          <Navbar onOpenCopilot={() => setIsCopilotOpen(true)} />
          <main className="flex-1">
            <Routes>
              {/* Public Marketing & Global Tools */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/mobility-globe" element={<MobilityGlobePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route path="/reset-password" element={<UpdatePasswordPage />} />

              {/* Protected User Account Routes (Supabase Auth / Session Required) */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <DashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/itinerary"
                element={
                  <ProtectedRoute>
                    <ItineraryPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/visa-checker"
                element={
                  <ProtectedRoute>
                    <VisaCheckerPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/document-analyzer"
                element={
                  <ProtectedRoute>
                    <DocumentAnalyzerPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings"
                element={
                  <ProtectedRoute>
                    <SettingsPage />
                  </ProtectedRoute>
                }
              />

              {/* Catch-all fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <Footer />

          {/* Global Floating Gemini Travel Copilot Trigger */}
          <button
            onClick={() => setIsCopilotOpen(true)}
            className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 px-4 py-3 rounded-full bg-gradient-to-r from-cyan-500 to-indigo-600 text-white font-bold text-xs shadow-2xl shadow-cyan-500/30 hover:scale-105 active:scale-95 transition-all group border border-cyan-400/40"
            title="Ask Gemini Travel Copilot"
          >
            <div className="relative">
              <Sparkles className="w-4 h-4 text-cyan-200 group-hover:rotate-12 transition-transform" />
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            </div>
            <span className="hidden sm:inline tracking-wide font-sans">Gemini Copilot</span>
          </button>

          {/* Gemini Copilot Drawer */}
          <GeminiCopilotDrawer
            isOpen={isCopilotOpen}
            onClose={() => setIsCopilotOpen(false)}
          />
        </div>
      </Router>
    </AuthProvider>
  );
};

export default App;
