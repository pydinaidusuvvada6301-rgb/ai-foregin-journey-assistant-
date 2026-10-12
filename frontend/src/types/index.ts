export type TravelPurpose =
  | "Tourism"
  | "Business"
  | "Digital Nomad"
  | "Study"
  | "Permanent Relocation";

export type BudgetRange = "Budget" | "Moderate" | "Luxury";

export interface ItineraryInput {
  destination: string;
  durationDays: number;
  budgetRange: BudgetRange;
  travelPurpose: TravelPurpose;
  originCountry?: string;
  travelerPreferences?: string;
}

export interface EstimatedCostBreakdown {
  accommodation: string;
  foodAndTransport: string;
  activities: string;
  estimatedTotal?: string;
}

export interface DaySchedule {
  day: number;
  theme?: string;
  activities: string[];
}

export interface ItineraryDetails {
  destinationOverview: string;
  estimatedCostBreakdown: EstimatedCostBreakdown;
  dailySchedule: DaySchedule[];
  essentialTips: string[];
  localCustoms?: string[];
  emergencyContacts?: string[];
}

export interface VisaCheckInput {
  passportCountry: string;
  destinationCountry: string;
  currentResidency?: string;
  intendedStayDuration?: string;
  travelPurpose?: TravelPurpose;
}

export interface VisaCheckResult {
  destinationCountry: string;
  passportCountry: string;
  visaStatus: "Visa Free" | "eVisa" | "Visa on Arrival" | "Embassy Visa Required" | "Entry Restricted";
  stayAllowed: string;
  passportValidityRequirement: string;
  processingTime: string;
  estimatedFees: string;
  requiredDocuments: string[];
  financialProofGuidelines: string;
  healthAndVaccineMandates: string[];
  importantAdvisories: string[];
  entryCheckpoints?: string;
}

export interface DocumentComplianceItem {
  item: string;
  status: "PASS" | "WARNING" | "FAIL";
  details: string;
}

export interface DocumentAnalysisResult {
  documentType: "Passport" | "Visa" | "Boarding Pass" | "Vaccination Record" | "Identification" | "Other";
  detectedCountry?: string;
  holderName?: string;
  documentNumber?: string;
  expirationDate?: string;
  validityStatus: "Valid" | "Expiring Soon" | "Expired" | "Inconclusive";
  complianceChecklist: DocumentComplianceItem[];
  travelReadinessScore: number;
  recommendations: string[];
}

export interface UserProfile {
  id: string;
  full_name: string;
  home_country: string;
  created_at: string;
}

export interface TravelItineraryRecord {
  id: string;
  user_id: string;
  destination: string;
  duration_days: number;
  budget_range: string;
  itinerary_details: ItineraryDetails;
  created_at: string;
}

export interface VisaCheckRecord {
  id: string;
  user_id: string;
  passport_country: string;
  destination_country: string;
  visa_result: VisaCheckResult;
  created_at: string;
}

export interface DocumentCheckRecord {
  id: string;
  user_id: string;
  document_type: string;
  file_name: string;
  analysis_result: DocumentAnalysisResult;
  created_at: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'model';
  content: string;
  timestamp?: string;
}

export interface CustomizedDayResult {
  day: number;
  theme: string;
  activities: string[];
  customizationNotes: string;
}

export interface EmergencyPhrase {
  english: string;
  localTranslation: string;
  phoneticPronunciation: string;
}

export interface EmergencyCardResult {
  destination: string;
  localLanguage: string;
  emergencyNumbers: {
    police: string;
    ambulance: string;
    touristHelp: string;
  };
  emergencyPhrases: EmergencyPhrase[];
  consularAdvice: string;
  criticalScamsAndWarnings: string[];
}

export interface PackingItem {
  item: string;
  isEssential: boolean;
  reason: string;
}

export interface PackingCategory {
  name: string;
  items: PackingItem[];
}

export interface PackingChecklistResult {
  destination: string;
  seasonAdvice: string;
  categories: PackingCategory[];
}

