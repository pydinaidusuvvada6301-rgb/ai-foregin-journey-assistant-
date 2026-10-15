import axios from 'axios';
import { supabase, isSupabaseConfigured } from './supabase.js';
import type {
  ItineraryInput,
  VisaCheckInput,
  TravelItineraryRecord,
  VisaCheckRecord,
  DocumentCheckRecord,
  UserProfile
} from '../types/index.js';

const rawBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

// Safe normalization for production hosting (Render, Vercel, etc.)
function normalizeApiBaseUrl(raw?: string): string {
  const defaultUrl = 'http://localhost:5000/api';
  if (!raw || typeof raw !== 'string') return defaultUrl;
  let cleaned = raw.trim();

  // Strip surrounding quotes
  if ((cleaned.startsWith('"') && cleaned.endsWith('"')) || (cleaned.startsWith("'") && cleaned.endsWith("'"))) {
    cleaned = cleaned.slice(1, -1).trim();
  }

  // Reject placeholder values or strings containing invalid URL characters
  if (
    !cleaned ||
    cleaned.includes('<') ||
    cleaned.includes('>') ||
    cleaned.includes('YOUR-RENDER-URL') ||
    cleaned.includes('your-api') ||
    cleaned.includes('placeholder')
  ) {
    return defaultUrl;
  }

  // Handle relative paths e.g. "/api"
  if (cleaned.startsWith('/')) {
    if (typeof window !== 'undefined' && window.location?.origin) {
      cleaned = `${window.location.origin}${cleaned}`;
    } else {
      cleaned = `http://localhost:5000${cleaned}`;
    }
  } else if (!cleaned.startsWith('http://') && !cleaned.startsWith('https://')) {
    cleaned = `https://${cleaned}`;
  }

  cleaned = cleaned.replace(/\/+$/, '');
  if (!cleaned.endsWith('/api')) {
    cleaned = `${cleaned}/api`;
  }

  try {
    const test = new URL(cleaned);
    return test.toString().replace(/\/+$/, '');
  } catch (_e) {
    return defaultUrl;
  }
}

const API_BASE_URL = normalizeApiBaseUrl(rawBaseUrl);

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Attach Supabase JWT Bearer token to all outgoing requests
apiClient.interceptors.request.use(async (config) => {
  let token: string | null = null;

  // 1. Try to get token from live Supabase session
  if (isSupabaseConfigured) {
    try {
      const { data } = await supabase.auth.getSession();
      token = data?.session?.access_token || null;
    } catch (e) {
      // Continue to demo fallback
    }
  }

  // 2. Check demo user stored in localStorage
  if (!token) {
    const demo = localStorage.getItem('visavoyage_demo_user');
    if (demo) {
      try {
        const parsed = JSON.parse(demo);
        token = parsed.token || `demo-token-${parsed.id}`;
      } catch (e) {
        // Ignore
      }
    }
  }

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

import {
  getOfflineVisaCheck,
  getOfflineItinerary,
  getOfflineDocumentAnalysis,
  getOfflineEmergencyCard,
  getOfflinePackingChecklist
} from './offline-fallback.js';

function isNetworkOrBackendOffline(err: any): boolean {
  const msg = String(err?.message || '');
  const code = String(err?.code || '');
  const status = err?.response?.status;
  return (
    msg.includes('Network Error') ||
    msg.includes('Failed to fetch') ||
    msg.includes('ECONNREFUSED') ||
    msg.includes('ERR_CONNECTION_REFUSED') ||
    code === 'ERR_NETWORK' ||
    status === 502 ||
    status === 503 ||
    status === 504 ||
    status === 404
  );
}

function shouldServeOfflineFallback(err: any): boolean {
  if (isNetworkOrBackendOffline(err)) return true;
  const status = err?.response?.status;
  const data = err?.response?.data;
  // If backend returns 429 with daily quota exhausted or fallback flag
  if (status === 429 && (data?.isQuotaExhausted || data?.fallbackAvailable)) {
    return true;
  }
  return false;
}

// Client-side in-flight deduplication and result caching
const clientCache = new Map<string, { data: any; expiresAt: number }>();
const clientInFlight = new Map<string, Promise<any>>();

async function dedupeAndCache<T>(key: string, ttlMs: number, fn: () => Promise<T>): Promise<T> {
  const cached = clientCache.get(key);
  if (cached && Date.now() < cached.expiresAt) {
    return cached.data;
  }
  const existing = clientInFlight.get(key);
  if (existing) {
    return existing;
  }
  const promise = fn().then((res) => {
    clientCache.set(key, { data: res, expiresAt: Date.now() + ttlMs });
    return res;
  }).finally(() => {
    clientInFlight.delete(key);
  });
  clientInFlight.set(key, promise);
  return promise;
}

// AI Orchestration endpoints with resilient offline intelligence fallback and client deduplication
export async function generateItinerary(payload: ItineraryInput) {
  const key = `client_itin:${payload.destination.toLowerCase().trim()}:${payload.durationDays}:${payload.budgetRange}`;
  return dedupeAndCache(key, 15 * 60 * 1000, async () => {
    try {
      const response = await apiClient.post('/ai/itinerary', payload);
      return response.data;
    } catch (err: any) {
      if (shouldServeOfflineFallback(err)) {
        console.warn('[VisaVoyage] Serving client-side travel intelligence engine due to backend/quota status.');
        return {
          success: true,
          data: getOfflineItinerary(payload),
          isOfflineFallback: true,
          rateLimitNotice: err?.response?.data?.message || null
        };
      }
      throw err;
    }
  });
}

export async function checkVisaRequirements(payload: VisaCheckInput) {
  const key = `client_visa:${payload.passportCountry.toLowerCase().trim()}:${payload.destinationCountry.toLowerCase().trim()}`;
  return dedupeAndCache(key, 30 * 60 * 1000, async () => {
    try {
      const response = await apiClient.post('/ai/visa-check', payload);
      return response.data;
    } catch (err: any) {
      if (shouldServeOfflineFallback(err)) {
        console.warn('[VisaVoyage] Serving client-side immigration intelligence engine due to backend/quota status.');
        return {
          success: true,
          data: getOfflineVisaCheck(payload),
          isOfflineFallback: true,
          rateLimitNotice: err?.response?.data?.message || null
        };
      }
      throw err;
    }
  });
}

export async function analyzeDocument(formData: FormData) {
  try {
    const response = await apiClient.post('/ai/document-check', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  } catch (err: any) {
    if (shouldServeOfflineFallback(err)) {
      console.warn('[VisaVoyage] Serving client-side document verification engine due to backend/quota status.');
      return {
        success: true,
        data: getOfflineDocumentAnalysis(),
        isOfflineFallback: true,
        rateLimitNotice: err?.response?.data?.message || null
      };
    }
    throw err;
  }
}

// Deep Gemini AI Integration Endpoints
export async function chatWithCopilot(
  messages: Array<{ role: string; content: string }>,
  context?: {
    originCountry?: string;
    destination?: string;
    preferences?: string;
    travelPurpose?: string;
    visaType?: string;
    residency?: string;
  },
  signal?: AbortSignal,
  requestId?: string | number
) {
  // Sanitize: filter UI banners, non-string/empty messages, and map assistant -> model
  const sanitizedMessages = messages
    .filter(m => m && typeof m.content === 'string' && m.content.trim().length > 0)
    .filter(m => !(m.role === 'assistant' && (
      m.content.includes('Welcome to Gemini Foreign Journey Copilot') ||
      m.content.includes('Conversation Cleared') ||
      m.content.includes('I can provide clean, real-time advice tailored to your itinerary')
    )))
    .slice(-8) // Bound to last 8 messages (4 turns) for token optimization
    .map(m => ({
      role: m.role === 'assistant' ? 'model' : m.role,
      content: m.content.trim()
    }));

  // Never return fabricated canned advice on failure; propagate error for transparent UI retry
  const response = await apiClient.post(
    '/ai/chat',
    { messages: sanitizedMessages, context, requestId },
    {
      signal,
      headers: requestId ? { 'X-Request-Id': String(requestId) } : undefined
    }
  );
  return response.data;
}

export async function customizeItineraryDay(payload: {
  destination: string;
  dayNumber: number;
  currentTheme?: string;
  currentActivities: string[];
  customizationInstruction: string;
  budgetRange?: string;
}) {
  const key = `client_day:${payload.destination}:${payload.dayNumber}:${payload.customizationInstruction}`;
  return dedupeAndCache(key, 10 * 60 * 1000, async () => {
    try {
      const response = await apiClient.post('/ai/customize-day', payload);
      return response.data;
    } catch (err: any) {
      if (shouldServeOfflineFallback(err)) {
        return {
          success: true,
          data: {
            day: payload.dayNumber,
            theme: `${payload.customizationInstruction} in ${payload.destination}`,
            activities: [
              `Morning: Tailored exploration centered around "${payload.customizationInstruction}"`,
              `Afternoon: Specialized local discovery and authentic culture experience`,
              `Evening: Relaxed dinner and neighborhood walk matched to your customized pace`
            ],
            customizationNotes: `Adjusted Day ${payload.dayNumber} around: ${payload.customizationInstruction}`
          },
          isOfflineFallback: true
        };
      }
      throw err;
    }
  });
}

export async function generateEmergencyCard(payload: {
  destination: string;
  originCountry?: string;
  medicalNotes?: string;
}) {
  const key = `client_emerg:${payload.destination}:${payload.originCountry || ''}`;
  return dedupeAndCache(key, 60 * 60 * 1000, async () => {
    try {
      const response = await apiClient.post('/ai/emergency-card', payload);
      return response.data;
    } catch (err: any) {
      if (shouldServeOfflineFallback(err)) {
        return { success: true, data: getOfflineEmergencyCard(payload.destination), isOfflineFallback: true };
      }
      throw err;
    }
  });
}

export async function generatePackingChecklist(payload: {
  destination: string;
  durationDays: number;
  travelPurpose?: string;
  seasonOrMonth?: string;
}) {
  const key = `client_pack:${payload.destination}:${payload.durationDays}`;
  return dedupeAndCache(key, 60 * 60 * 1000, async () => {
    try {
      const response = await apiClient.post('/ai/packing-checklist', payload);
      return response.data;
    } catch (err: any) {
      if (shouldServeOfflineFallback(err)) {
        return { success: true, data: getOfflinePackingChecklist(payload.destination), isOfflineFallback: true };
      }
      throw err;
    }
  });
}


// History & Persistence endpoints (RLS protected)
export async function fetchItineraries(): Promise<TravelItineraryRecord[]> {
  const response = await apiClient.get('/itineraries');
  return response.data.data;
}

export async function deleteItinerary(id: string) {
  const response = await apiClient.delete(`/itineraries/${id}`);
  return response.data;
}

export async function fetchVisaChecks(): Promise<VisaCheckRecord[]> {
  const response = await apiClient.get('/visa-checks');
  return response.data.data;
}

export async function deleteVisaCheck(id: string) {
  const response = await apiClient.delete(`/visa-checks/${id}`);
  return response.data;
}

export async function fetchDocumentChecks(): Promise<DocumentCheckRecord[]> {
  const response = await apiClient.get('/document-checks');
  return response.data.data;
}

export async function fetchProfile(): Promise<UserProfile> {
  const response = await apiClient.get('/profile');
  return response.data.data;
}

export async function updateProfile(data: { full_name?: string; home_country?: string }) {
  const response = await apiClient.put('/profile', data);
  return response.data.data;
}

export async function checkSystemHealth() {
  const response = await apiClient.get('/health');
  return response.data;
}

// User registration & auto-confirmation via backend admin engine
export async function registerUserViaApi(data: {
  email: string;
  password: string;
  fullName: string;
  homeCountry: string;
}) {
  const response = await apiClient.post('/auth/register', data);
  return response.data;
}

export async function autoConfirmEmailViaApi(email: string) {
  const response = await apiClient.post('/auth/auto-confirm', { email });
  return response.data;
}

export interface CurrencyRatesResponse {
  success: boolean;
  base: string;
  rates: Record<string, number>;
  lastUpdated: string;
  isStale: boolean;
  fromCache?: boolean;
  provider: string;
}

export async function fetchExchangeRates(base: string = 'USD'): Promise<CurrencyRatesResponse> {
  const response = await apiClient.get<CurrencyRatesResponse>(`/currency/rates?base=${encodeURIComponent(base)}`);
  return response.data;
}

