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

// AI Orchestration endpoints
export async function generateItinerary(payload: ItineraryInput) {
  const response = await apiClient.post('/ai/itinerary', payload);
  return response.data;
}

export async function checkVisaRequirements(payload: VisaCheckInput) {
  const response = await apiClient.post('/ai/visa-check', payload);
  return response.data;
}

export async function analyzeDocument(formData: FormData) {
  const response = await apiClient.post('/ai/document-check', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
  return response.data;
}

// Deep Gemini AI Integration Endpoints
export async function chatWithCopilot(
  messages: Array<{ role: string; content: string }>,
  context?: { originCountry?: string; destination?: string; preferences?: string }
) {
  const response = await apiClient.post('/ai/chat', { messages, context });
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
  const response = await apiClient.post('/ai/customize-day', payload);
  return response.data;
}

export async function generateEmergencyCard(payload: {
  destination: string;
  originCountry?: string;
  medicalNotes?: string;
}) {
  const response = await apiClient.post('/ai/emergency-card', payload);
  return response.data;
}

export async function generatePackingChecklist(payload: {
  destination: string;
  durationDays: number;
  travelPurpose?: string;
  seasonOrMonth?: string;
}) {
  const response = await apiClient.post('/ai/packing-checklist', payload);
  return response.data;
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
