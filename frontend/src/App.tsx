import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.js';
import { Navbar } from './components/Navbar.js';
import { Footer } from './components/Footer.js';
import { ProtectedRoute } from './components/ProtectedRoute.js';
import { GeminiCopilotDrawer } from './components/GeminiCopilotDrawer.js';
import { Sparkles } from 'lucide-react';

import { LandingPage } from './pages/LandingPage.js';
import { LoginPage } from './pages/LoginPage.js';
import { SignupPage } from './pages/SignupPage.js';
import { DashboardPage } from './pages/DashboardPage.js';
import { ItineraryPage } from './pages/ItineraryPage.js';
import { VisaCheckerPage } from './pages/VisaCheckerPage.js';
import { DocumentAnalyzerPage } from './pages/DocumentAnalyzerPage.js';
import { SettingsPage } from './pages/SettingsPage.js';

export const App: React.FC = () => {
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);

  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen flex flex-col bg-navy-950 text-slate-100 relative">
          <Navbar onOpenCopilot={() => setIsCopilotOpen(true)} />
          <main className="flex-1">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />

              {/* Protected Routes (Supabase / Verified JWT) */}
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

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <Footer />

          {/* Global Floating Gemini Travel Copilot Button */}
          <button
            onClick={() => setIsCopilotOpen(true)}
            className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 px-4 py-3 rounded-full bg-gradient-to-r from-cyan-500 to-indigo-600 text-white font-bold text-xs shadow-2xl shadow-cyan-500/30 hover:scale-105 active:scale-95 transition-all group border border-cyan-400/40"
            title="Ask Gemini 3.8 Flash Travel Copilot"
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
