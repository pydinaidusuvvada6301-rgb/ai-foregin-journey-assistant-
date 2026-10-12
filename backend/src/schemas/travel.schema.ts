import { z } from 'zod';

export const travelPurposeEnum = z.enum([
  "Tourism",
  "Business",
  "Digital Nomad",
  "Study",
  "Permanent Relocation"
]);

export const budgetRangeEnum = z.enum(["Budget", "Moderate", "Luxury"]);

export const itineraryInputSchema = z.object({
  destination: z.string().min(2, "Destination is required"),
  durationDays: z.coerce.number().min(1, "Minimum 1 day").max(90, "Maximum 90 days"),
  budgetRange: budgetRangeEnum,
  travelPurpose: travelPurposeEnum.default("Tourism"),
  originCountry: z.string().optional(),
  travelerPreferences: z.string().optional()
});

export type ItineraryInput = z.infer<typeof itineraryInputSchema>;

export const visaCheckInputSchema = z.object({
  passportCountry: z.string().min(2, "Passport country is required"),
  destinationCountry: z.string().min(2, "Destination country is required"),
  currentResidency: z.string().optional(),
  intendedStayDuration: z.string().optional(),
  travelPurpose: z.string().optional()
});

export type VisaCheckInput = z.infer<typeof visaCheckInputSchema>;
