import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  !supabaseUrl.includes('your-supabase-project') &&
  (supabaseServiceRoleKey || supabaseAnonKey) &&
  !supabaseServiceRoleKey.includes('your-supabase-service-role')
);

// Privileged Supabase Admin client for secure server-side operations
export const supabaseAdmin: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseServiceRoleKey || supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null;

console.log(`[VisaVoyage AI] Supabase Admin Service Initialized. Configured: ${isSupabaseConfigured}`);

// Resilient in-memory storage fallback for offline/development test states
interface InMemoryStore {
  profiles: Record<string, any>;
  itineraries: any[];
  visaChecks: any[];
  documentChecks: any[];
}

const memoryStore: InMemoryStore = {
  profiles: {
    'demo-user-123': {
      id: 'demo-user-123',
      full_name: 'Alex Vance (Voyager)',
      home_country: 'United States',
      created_at: new Date().toISOString()
    }
  },
  itineraries: [
    {
      id: 'mock-itin-1',
      user_id: 'demo-user-123',
      destination: 'Tokyo, Japan',
      duration_days: 7,
      budget_range: 'Moderate',
      itinerary_details: {
        destinationOverview: 'Tokyo offers an electric blend of neon skyscrapers, serene Shinto shrines, and world-leading rail transit.',
        estimatedCostBreakdown: {
          accommodation: '$140 - $210 / night (Shinjuku / Shibuya)',
          foodAndTransport: '$60 - $90 / day (Suica IC card & ramen/izakayas)',
          activities: '$80 total (teamLab Planets, Shibuya Sky observation deck)',
          estimatedTotal: '$1,650 - $2,300 USD'
        },
        dailySchedule: [
          { day: 1, theme: 'Arrival & Shinjuku Nightscape', activities: ['Check-in at Shinjuku hotel', 'Evening walk through Omoide Yokocho', 'Shinjuku Gyoen orientation'] },
          { day: 2, theme: 'Historic Asakusa & Akihabara', activities: ['Senso-ji temple morning visit', 'Sumida river water bus', 'Akihabara electronics exploration'] },
          { day: 3, theme: 'Shibuya Crossing & Harajuku', activities: ['Meiji Jingu early shrine walk', 'Takeshita street shopping', 'Shibuya Sky sunset panorama'] }
        ],
        essentialTips: [
          'Purchase a Welcome Suica or digital Apple Wallet Pasmo card for subway gates.',
          'Always carry cash (10,000 yen bills) as some authentic eateries do not accept international credit cards.',
          'Reserve teamLab and popular museums 3-4 weeks in advance.'
        ],
        localCustoms: [
          'Never eat or drink while walking on the street; stop at convenience store benches.',
          'Stand on the left side of escalators in Tokyo (right in Osaka).'
        ],
        emergencyContacts: ['Police: 110', 'Ambulance & Fire: 119', 'Japan Travel Hotline: 050-3816-2720']
      },
      created_at: new Date(Date.now() - 86400000 * 2).toISOString()
    }
  ],
  visaChecks: [
    {
      id: 'mock-visa-1',
      user_id: 'demo-user-123',
      passport_country: 'United States',
      destination_country: 'Japan',
      visa_result: {
        destinationCountry: 'Japan',
        passportCountry: 'United States',
        visaStatus: 'Visa Free',
        stayAllowed: 'Up to 90 days for tourism/business',
        passportValidityRequirement: 'Valid for the full duration of intended stay; 6 months recommended.',
        processingTime: 'Instant biometric clearance at airport gates with Visit Japan Web QR code.',
        estimatedFees: 'Free ($0 USD)',
        requiredDocuments: [
          'Valid US Passport with at least 1 blank visa page',
          'Confirmed return or onward airline ticket',
          'Visit Japan Web QR code for immigration & customs'
        ],
        financialProofGuidelines: 'Sufficient funds for trip; credit cards widely accepted.',
        healthAndVaccineMandates: ['No mandatory immunizations for direct arrival from USA.'],
        importantAdvisories: [
          'Strict prohibition of any paid work or digital freelancing under tourist waiver.',
          'Medication alert: Over-the-counter stimulant inhalers and certain painkillers (like pseudoephedrine) are strictly banned.'
        ],
        entryCheckpoints: 'Haneda (HND), Narita (NRT), Kansai (KIX)'
      },
      created_at: new Date(Date.now() - 86400000 * 1).toISOString()
    }
  ],
  documentChecks: []
};

// Database Access Wrappers ensuring Row Level Security
export async function saveItinerary(userId: string, data: {
  destination: string;
  duration_days: number;
  budget_range: string;
  itinerary_details: any;
}) {
  if (supabaseAdmin) {
    const { data: record, error } = await supabaseAdmin
      .from('travel_itineraries')
      .insert({
        user_id: userId,
        destination: data.destination,
        duration_days: data.duration_days,
        budget_range: data.budget_range,
        itinerary_details: data.itinerary_details
      })
      .select()
      .single();

    if (error) {
      console.error('[Supabase DB] Error saving itinerary:', error);
      throw error;
    }
    return record;
  }

  // Memory store fallback
  const record = {
    id: `itin-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    user_id: userId,
    destination: data.destination,
    duration_days: data.duration_days,
    budget_range: data.budget_range,
    itinerary_details: data.itinerary_details,
    created_at: new Date().toISOString()
  };
  memoryStore.itineraries.unshift(record);
  return record;
}

export async function getUserItineraries(userId: string) {
  if (supabaseAdmin) {
    const { data, error } = await supabaseAdmin
      .from('travel_itineraries')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  return memoryStore.itineraries.filter((i) => i.user_id === userId);
}

export async function deleteItinerary(userId: string, id: string) {
  if (supabaseAdmin) {
    const { error } = await supabaseAdmin
      .from('travel_itineraries')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;
    return true;
  }

  const initialLen = memoryStore.itineraries.length;
  memoryStore.itineraries = memoryStore.itineraries.filter(
    (i) => !(i.id === id && i.user_id === userId)
  );
  return memoryStore.itineraries.length < initialLen;
}

export async function saveVisaCheck(userId: string, data: {
  passport_country: string;
  destination_country: string;
  visa_result: any;
}) {
  if (supabaseAdmin) {
    const { data: record, error } = await supabaseAdmin
      .from('visa_checks')
      .insert({
        user_id: userId,
        passport_country: data.passport_country,
        destination_country: data.destination_country,
        visa_result: data.visa_result
      })
      .select()
      .single();

    if (error) throw error;
    return record;
  }

  const record = {
    id: `visa-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    user_id: userId,
    passport_country: data.passport_country,
    destination_country: data.destination_country,
    visa_result: data.visa_result,
    created_at: new Date().toISOString()
  };
  memoryStore.visaChecks.unshift(record);
  return record;
}

export async function getUserVisaChecks(userId: string) {
  if (supabaseAdmin) {
    const { data, error } = await supabaseAdmin
      .from('visa_checks')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  return memoryStore.visaChecks.filter((v) => v.user_id === userId);
}

export async function deleteVisaCheck(userId: string, id: string) {
  if (supabaseAdmin) {
    const { error } = await supabaseAdmin
      .from('visa_checks')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;
    return true;
  }

  const initialLen = memoryStore.visaChecks.length;
  memoryStore.visaChecks = memoryStore.visaChecks.filter(
    (v) => !(v.id === id && v.user_id === userId)
  );
  return memoryStore.visaChecks.length < initialLen;
}

export async function saveDocumentCheck(userId: string, data: {
  document_type: string;
  file_name: string;
  analysis_result: any;
}) {
  if (supabaseAdmin) {
    const { data: record, error } = await supabaseAdmin
      .from('document_checks')
      .insert({
        user_id: userId,
        document_type: data.document_type,
        file_name: data.file_name,
        analysis_result: data.analysis_result
      })
      .select()
      .single();

    if (error) throw error;
    return record;
  }

  const record = {
    id: `doc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    user_id: userId,
    document_type: data.document_type,
    file_name: data.file_name,
    analysis_result: data.analysis_result,
    created_at: new Date().toISOString()
  };
  memoryStore.documentChecks.unshift(record);
  return record;
}

export async function getUserDocumentChecks(userId: string) {
  if (supabaseAdmin) {
    const { data, error } = await supabaseAdmin
      .from('document_checks')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  return memoryStore.documentChecks.filter((d) => d.user_id === userId);
}

export async function getUserProfile(userId: string) {
  if (supabaseAdmin) {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  return memoryStore.profiles[userId] || {
    id: userId,
    full_name: 'Explorer Traveler',
    home_country: 'United States',
    created_at: new Date().toISOString()
  };
}

export async function upsertUserProfile(userId: string, updates: { full_name?: string; home_country?: string }) {
  if (supabaseAdmin) {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: userId,
        ...updates
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  const current = memoryStore.profiles[userId] || {
    id: userId,
    full_name: 'Explorer Traveler',
    home_country: 'United States',
    created_at: new Date().toISOString()
  };
  const updated = { ...current, ...updates };
  memoryStore.profiles[userId] = updated;
  return updated;
}
