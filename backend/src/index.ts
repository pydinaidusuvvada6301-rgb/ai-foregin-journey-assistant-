import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

import aiRoutes from './routes/ai.routes.js';
import itineraryRoutes from './routes/itinerary.routes.js';
import visaRoutes from './routes/visa.routes.js';
import documentRoutes from './routes/document.routes.js';
import profileRoutes from './routes/profile.routes.js';
import authRoutes from './routes/auth.routes.js';
import locationRoutes from './routes/location.routes.js';
import currencyRoutes from './routes/currency.routes.js';
import { errorHandler } from './middleware/errorHandler.middleware.js';
import { isGeminiConfigured, MODEL_NAME } from './services/gemini.service.js';
import { isSupabaseConfigured } from './services/supabase.service.js';
import { getClientKey } from './middleware/rateLimiter.middleware.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';

// Enable trust proxy for Render, Vercel, and Cloudflare reverse proxies
// Ensures req.ip and req.ips accurately identify the real client rather than the load balancer
app.set('trust proxy', 1);

// 1. Security HTTP Headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// 2. Cross-Origin Resource Sharing
// Allow requests from all origins (Vercel, Render, local dev) with credential support
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Request-Id']
}));

// 3. Body Parsing
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// 4. Rate Limiting: per-user / per-client rate limit to prevent abuse while allowing legitimate users
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // Generous 500 requests per 15 min per user/IP for general API navigation
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => getClientKey(req),
  message: {
    success: false,
    error: 'Too Many Requests',
    code: 'RATE_LIMIT_EXCEEDED',
    message: 'Rate limit exceeded. Please try again after a few minutes.'
  }
});
app.use('/api', apiLimiter);

// Dedicated stricter rate limit for sensitive authentication operations
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // 30 registration/confirmation attempts per 15 min per client
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => getClientKey(req),
  message: {
    success: false,
    error: 'Too Many Requests',
    code: 'AUTH_RATE_LIMIT_EXCEEDED',
    message: 'Too many authentication attempts. Please wait 15 minutes before trying again.'
  }
});
app.use('/api/auth', authLimiter);

// Root route for instant ping/status check
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'online',
    message: 'VisaVoyage AI Backend API is active and running.',
    healthEndpoint: '/api/health'
  });
});

// 5. System Health & Integration Status Route
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'VisaVoyage AI Backend Engine',
    architecture: {
      strictSeparation: true,
      authProvider: 'Supabase GoTrue JWT',
      database: 'Supabase PostgreSQL (RLS)',
      aiEngine: `Google GenAI SDK (${MODEL_NAME})`
    },
    integrations: {
      geminiKeyConfigured: isGeminiConfigured,
      supabaseConfigured: isSupabaseConfigured
    }
  });
});

// 6. Mount API Route Modules
app.use('/api/auth', authRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/itineraries', itineraryRoutes);
app.use('/api/visa-checks', visaRoutes);
app.use('/api/document-checks', documentRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/location', locationRoutes);
app.use('/api/currency', currencyRoutes);

// 7. Global Error Handler
app.use(errorHandler);

// 8. Start HTTP Server
const listenPort = Number(PORT) || 5000;
app.listen(listenPort, '0.0.0.0', () => {
  console.log(`
======================================================
  ✈️  VisaVoyage AI - Backend Server Running
  Port: ${listenPort} (bound to 0.0.0.0)
  Environment: ${process.env.NODE_ENV || 'development'}
  Client URL: ${clientUrl}
  Google GenAI (${MODEL_NAME}): ${isGeminiConfigured ? '🟢 Live API Key Active' : '🟡 Demo/Fallback Mode Active'}
  Supabase PostgreSQL / RLS Auth: ${isSupabaseConfigured ? '🟢 Live Supabase Connected' : '🟡 Local Test Store Active'}
======================================================
  `);
});

export default app;
