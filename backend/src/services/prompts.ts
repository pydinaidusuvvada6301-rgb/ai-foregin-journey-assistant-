export const TRAVEL_SYSTEM_PROMPT = `
You are VisaVoyage AI, an elite international travel advisor, immigration policy specialist, and global itinerary architect. Your responses must be accurate, up-to-date, practical, and tailored specifically to the traveler's origin passport, destination, and purpose of journey. Output strict JSON according to the requested schema.
`;

export const ITINERARY_JSON_SCHEMA = {
  type: "OBJECT",
  properties: {
    destinationOverview: { type: "STRING" },
    estimatedCostBreakdown: {
      type: "OBJECT",
      properties: {
        accommodation: { type: "STRING" },
        foodAndTransport: { type: "STRING" },
        activities: { type: "STRING" },
        estimatedTotal: { type: "STRING" }
      },
      required: ["accommodation", "foodAndTransport", "activities"]
    },
    dailySchedule: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          day: { type: "NUMBER" },
          theme: { type: "STRING" },
          activities: { type: "ARRAY", items: { type: "STRING" } }
        },
        required: ["day", "activities"]
      }
    },
    essentialTips: { type: "ARRAY", items: { type: "STRING" } },
    localCustoms: { type: "ARRAY", items: { type: "STRING" } },
    emergencyContacts: { type: "ARRAY", items: { type: "STRING" } }
  },
  required: ["destinationOverview", "estimatedCostBreakdown", "dailySchedule", "essentialTips"]
};

export const VISA_CHECK_JSON_SCHEMA = {
  type: "OBJECT",
  properties: {
    destinationCountry: { type: "STRING" },
    passportCountry: { type: "STRING" },
    visaStatus: { type: "STRING" },
    stayAllowed: { type: "STRING" },
    passportValidityRequirement: { type: "STRING" },
    processingTime: { type: "STRING" },
    estimatedFees: { type: "STRING" },
    requiredDocuments: { type: "ARRAY", items: { type: "STRING" } },
    financialProofGuidelines: { type: "STRING" },
    healthAndVaccineMandates: { type: "ARRAY", items: { type: "STRING" } },
    importantAdvisories: { type: "ARRAY", items: { type: "STRING" } },
    entryCheckpoints: { type: "STRING" }
  },
  required: [
    "destinationCountry",
    "passportCountry",
    "visaStatus",
    "stayAllowed",
    "passportValidityRequirement",
    "processingTime",
    "estimatedFees",
    "requiredDocuments",
    "financialProofGuidelines",
    "healthAndVaccineMandates",
    "importantAdvisories"
  ]
};

export const DOCUMENT_ANALYSIS_SCHEMA = {
  type: "OBJECT",
  properties: {
    documentType: { type: "STRING" },
    detectedCountry: { type: "STRING" },
    holderName: { type: "STRING" },
    documentNumber: { type: "STRING" },
    expirationDate: { type: "STRING" },
    validityStatus: { type: "STRING" },
    complianceChecklist: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          item: { type: "STRING" },
          status: { type: "STRING" },
          details: { type: "STRING" }
        },
        required: ["item", "status", "details"]
      }
    },
    travelReadinessScore: { type: "NUMBER" },
    recommendations: { type: "ARRAY", items: { type: "STRING" } }
  },
  required: [
    "documentType",
    "validityStatus",
    "complianceChecklist",
    "travelReadinessScore",
    "recommendations"
  ]
};

export const CUSTOMIZE_DAY_SCHEMA = {
  type: "OBJECT",
  properties: {
    day: { type: "NUMBER" },
    theme: { type: "STRING" },
    activities: { type: "ARRAY", items: { type: "STRING" } },
    customizationNotes: { type: "STRING" }
  },
  required: ["day", "theme", "activities", "customizationNotes"]
};

export const EMERGENCY_CARD_SCHEMA = {
  type: "OBJECT",
  properties: {
    destination: { type: "STRING" },
    localLanguage: { type: "STRING" },
    emergencyNumbers: {
      type: "OBJECT",
      properties: {
        police: { type: "STRING" },
        ambulance: { type: "STRING" },
        touristHelp: { type: "STRING" }
      },
      required: ["police", "ambulance", "touristHelp"]
    },
    emergencyPhrases: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          english: { type: "STRING" },
          localTranslation: { type: "STRING" },
          phoneticPronunciation: { type: "STRING" }
        },
        required: ["english", "localTranslation", "phoneticPronunciation"]
      }
    },
    consularAdvice: { type: "STRING" },
    criticalScamsAndWarnings: { type: "ARRAY", items: { type: "STRING" } }
  },
  required: ["destination", "localLanguage", "emergencyNumbers", "emergencyPhrases", "consularAdvice", "criticalScamsAndWarnings"]
};

export const PACKING_CHECKLIST_SCHEMA = {
  type: "OBJECT",
  properties: {
    destination: { type: "STRING" },
    seasonAdvice: { type: "STRING" },
    categories: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          name: { type: "STRING" },
          items: {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              properties: {
                item: { type: "STRING" },
                isEssential: { type: "BOOLEAN" },
                reason: { type: "STRING" }
              },
              required: ["item", "isEssential", "reason"]
            }
          }
        },
        required: ["name", "items"]
      }
    }
  },
  required: ["destination", "seasonAdvice", "categories"]
};

