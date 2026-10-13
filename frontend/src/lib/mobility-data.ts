export interface GlobalHub {
  id: string;
  name: string;
  country: string;
  lat: number;
  lon: number;
  code: string;
  continent: string;
}

export const GLOBAL_HUBS: GlobalHub[] = [
  { id: 'nyc', name: 'New York (JFK)', country: 'United States', lat: 40.6413, lon: -73.7781, code: 'JFK', continent: 'North America' },
  { id: 'sfo', name: 'San Francisco', country: 'United States', lat: 37.6213, lon: -122.3790, code: 'SFO', continent: 'North America' },
  { id: 'lon', name: 'London (LHR)', country: 'United Kingdom', lat: 51.4700, lon: -0.4543, code: 'LHR', continent: 'Europe' },
  { id: 'tyo', name: 'Tokyo (HND/NRT)', country: 'Japan', lat: 35.5494, lon: 139.7798, code: 'HND', continent: 'Asia' },
  { id: 'par', name: 'Paris (CDG)', country: 'France', lat: 49.0097, lon: 2.5479, code: 'CDG', continent: 'Europe' },
  { id: 'sin', name: 'Singapore (SIN)', country: 'Singapore', lat: 1.3644, lon: 103.9915, code: 'SIN', continent: 'Asia' },
  { id: 'dxb', name: 'Dubai (DXB)', country: 'United Arab Emirates', lat: 25.2532, lon: 55.3657, code: 'DXB', continent: 'Middle East' },
  { id: 'syd', name: 'Sydney (SYD)', country: 'Australia', lat: -33.9399, lon: 151.1753, code: 'SYD', continent: 'Oceania' },
  { id: 'ber', name: 'Berlin (BER)', country: 'Germany', lat: 52.3667, lon: 13.5033, code: 'BER', continent: 'Europe' },
  { id: 'del', name: 'New Delhi (DEL)', country: 'India', lat: 28.5562, lon: 77.1000, code: 'DEL', continent: 'Asia' },
  { id: 'bom', name: 'Mumbai (BOM)', country: 'India', lat: 19.0896, lon: 72.8656, code: 'BOM', continent: 'Asia' },
  { id: 'yyz', name: 'Toronto (YYZ)', country: 'Canada', lat: 43.6777, lon: -79.6248, code: 'YYZ', continent: 'North America' },
  { id: 'fco', name: 'Rome (FCO)', country: 'Italy', lat: 41.8003, lon: 12.2389, code: 'FCO', continent: 'Europe' },
  { id: 'zrh', name: 'Zurich (ZRH)', country: 'Switzerland', lat: 47.4582, lon: 8.5555, code: 'ZRH', continent: 'Europe' },
  { id: 'bkk', name: 'Bangkok (BKK)', country: 'Thailand', lat: 13.6900, lon: 100.7501, code: 'BKK', continent: 'Asia' },
  { id: 'icn', name: 'Seoul (ICN)', country: 'South Korea', lat: 37.4602, lon: 126.4407, code: 'ICN', continent: 'Asia' },
  { id: 'gru', name: 'São Paulo (GRU)', country: 'Brazil', lat: -23.4356, lon: -46.4731, code: 'GRU', continent: 'South America' },
  { id: 'cai', name: 'Cairo (CAI)', country: 'Egypt', lat: 30.1219, lon: 31.4056, code: 'CAI', continent: 'Africa' },
  { id: 'nbo', name: 'Nairobi (NBO)', country: 'Kenya', lat: -1.3192, lon: 36.9278, code: 'NBO', continent: 'Africa' },
  { id: 'eze', name: 'Buenos Aires (EZE)', country: 'Argentina', lat: -34.8222, lon: -58.5358, code: 'EZE', continent: 'South America' },
  { id: 'mex', name: 'Mexico City (MEX)', country: 'Mexico', lat: 19.4363, lon: -99.0721, code: 'MEX', continent: 'North America' },
  { id: 'akl', name: 'Auckland (AKL)', country: 'New Zealand', lat: -37.0082, lon: 174.7850, code: 'AKL', continent: 'Oceania' },
  { id: 'mad', name: 'Madrid (MAD)', country: 'Spain', lat: 40.4839, lon: -3.5680, code: 'MAD', continent: 'Europe' },
  { id: 'ams', name: 'Amsterdam (AMS)', country: 'Netherlands', lat: 52.3105, lon: 4.7683, code: 'AMS', continent: 'Europe' },
  { id: 'ist', name: 'Istanbul (IST)', country: 'Turkey', lat: 41.2753, lon: 28.7519, code: 'IST', continent: 'Europe/Asia' },
  { id: 'pek', name: 'Beijing (PEK)', country: 'China', lat: 40.0799, lon: 116.6031, code: 'PEK', continent: 'Asia' },
  { id: 'cpt', name: 'Cape Town (CPT)', country: 'South Africa', lat: -33.9715, lon: 18.6021, code: 'CPT', continent: 'Africa' }
];

export interface BilateralVisaTelemetry {
  origin: GlobalHub;
  destination: GlobalHub;
  distanceKm: number;
  distanceNauticalMiles: number;
  estimatedFlightHours: number;
  visaStatus: 'Visa Free' | 'Visa on Arrival' | 'eVisa / ETA' | 'Consulate Visa Required';
  allowedStay: string;
  passportValidityRequired: string;
  entryType: 'Biometric E-Gates' | 'Pre-Screened QR' | 'Consular Sticker' | 'Entry Slip';
  activeCorridorTier: 'Primary Transoceanic' | 'Regional High-Density' | 'Schengen Internal' | 'Continental Transit';
  advisoryNote: string;
}

/**
 * Calculates Great-Circle distance using Haversine formula
 */
export function calculateGreatCircleDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

/**
 * Evaluates real-time bilateral immigration and flight telemetry
 */
export function evaluateBilateralCorridor(origin: GlobalHub, destination: GlobalHub): BilateralVisaTelemetry {
  const distanceKm = calculateGreatCircleDistance(origin.lat, origin.lon, destination.lat, destination.lon);
  const distanceNauticalMiles = Math.round(distanceKm * 0.539957);
  // Average commercial flight speed ~840 km/h + 30 min taxi/climb/descent
  const estimatedFlightHours = parseFloat((distanceKm / 840 + 0.5).toFixed(1));

  // Determine bilateral immigration classification
  const originCountry = origin.country.toLowerCase();
  const destCountry = destination.country.toLowerCase();

  let visaStatus: BilateralVisaTelemetry['visaStatus'] = 'Consulate Visa Required';
  let allowedStay = '30 Days';
  let passportValidityRequired = '6 months beyond stay date';
  let entryType: BilateralVisaTelemetry['entryType'] = 'Consular Sticker';
  let advisoryNote = 'Standard sovereign entry protocols apply. Verify supporting documents.';

  if (originCountry === destCountry) {
    visaStatus = 'Visa Free';
    allowedStay = 'Unlimited (Domestic Travel)';
    passportValidityRequired = 'Valid ID / RealID';
    entryType = 'Biometric E-Gates';
    advisoryNote = 'Domestic travel corridor. No customs or passport clearance required.';
  } else if (
    (originCountry === 'united states' && (destCountry === 'united kingdom' || destCountry === 'japan' || destCountry === 'france' || destCountry === 'germany' || destCountry === 'italy' || destCountry === 'switzerland' || destCountry === 'spain' || destCountry === 'netherlands' || destCountry === 'singapore')) ||
    (originCountry === 'united kingdom' && (destCountry === 'united states' || destCountry === 'japan' || destCountry === 'france' || destCountry === 'germany' || destCountry === 'singapore')) ||
    (destCountry === 'singapore' && ['united states', 'united kingdom', 'germany', 'france', 'japan', 'australia', 'canada'].includes(originCountry)) ||
    (destCountry === 'japan' && ['united states', 'united kingdom', 'canada', 'germany', 'france', 'australia'].includes(originCountry))
  ) {
    visaStatus = 'Visa Free';
    allowedStay = '90 Days (Tourism / Business)';
    passportValidityRequired = 'Valid duration of stay (6 months recommended)';
    entryType = 'Biometric E-Gates';
    advisoryNote = 'Visa exemption treaty in force. Maintain return flight reservation and accommodation proof.';
  } else if (
    (destCountry === 'united states' && ['australia', 'japan', 'germany', 'france', 'spain', 'italy', 'netherlands', 'singapore', 'united kingdom'].includes(originCountry)) ||
    (destCountry === 'australia' && ['united states', 'united kingdom', 'canada', 'japan', 'singapore'].includes(originCountry)) ||
    (destCountry === 'canada' && ['united states', 'united kingdom', 'france', 'germany', 'japan', 'australia'].includes(originCountry))
  ) {
    visaStatus = 'eVisa / ETA';
    allowedStay = 'Up to 90 Days';
    passportValidityRequired = '6 months valid e-Passport';
    entryType = 'Pre-Screened QR';
    advisoryNote = 'Mandatory electronic travel authorization required prior to boarding carrier.';
  } else if (
    (destCountry === 'thailand' || destCountry === 'egypt' || destCountry === 'united arab emirates' || destCountry === 'kenya')
  ) {
    visaStatus = 'Visa on Arrival';
    allowedStay = '30 - 60 Days';
    passportValidityRequired = 'Minimum 6 months with 2 blank pages';
    entryType = 'Entry Slip';
    advisoryNote = 'Available upon arrival at designated international airports. Carry biometric photos and local currency fee.';
  } else if (originCountry === 'india') {
    if (destCountry === 'thailand' || destCountry === 'singapore' || destCountry === 'united arab emirates') {
      visaStatus = 'eVisa / ETA';
      allowedStay = '30 Days';
      passportValidityRequired = 'Minimum 6 months validity';
      entryType = 'Pre-Screened QR';
      advisoryNote = 'Apply online 5-7 business days prior to departure. Submit bank statements and roundtrip flight.';
    } else {
      visaStatus = 'Consulate Visa Required';
      allowedStay = 'Duration of approved visa';
      passportValidityRequired = '6 months minimum validity';
      entryType = 'Consular Sticker';
      advisoryNote = 'In-person biometric submission and dossier verification required at sovereign embassy/VFS center.';
    }
  }

  // Corridor density category
  let activeCorridorTier: BilateralVisaTelemetry['activeCorridorTier'] = 'Primary Transoceanic';
  if (distanceKm < 1500) {
    activeCorridorTier = 'Regional High-Density';
  } else if (['france', 'germany', 'italy', 'spain', 'netherlands', 'switzerland'].includes(originCountry) && ['france', 'germany', 'italy', 'spain', 'netherlands', 'switzerland'].includes(destCountry)) {
    activeCorridorTier = 'Schengen Internal';
  }

  return {
    origin,
    destination,
    distanceKm,
    distanceNauticalMiles,
    estimatedFlightHours,
    visaStatus,
    allowedStay,
    passportValidityRequired,
    entryType,
    activeCorridorTier,
    advisoryNote
  };
}

/**
 * Converts Latitude/Longitude on Sphere of Radius R to 3D Cartesian Vector
 */
export function latLonToVector3(lat: number, lon: number, radius: number): [number, number, number] {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);

  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);

  return [x, y, z];
}
