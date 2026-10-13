import { Router, Request, Response } from 'express';

const router = Router();

// Cache to prevent excessive calls to reverse geocoding API
const geocodeCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

/**
 * GET /api/location/reverse-geocode?lat=XX.XXXX&lon=YY.YYYY
 * Secure server-side reverse geocoding proxy preventing secret key exposure in browser
 */
router.get('/reverse-geocode', async (req: Request, res: Response) => {
  const { lat, lon } = req.query;

  if (!lat || !lon) {
    res.status(400).json({
      error: 'BadRequest',
      message: 'Both latitude (lat) and longitude (lon) query parameters are required.'
    });
    return;
  }

  const latitude = parseFloat(String(lat));
  const longitude = parseFloat(String(lon));

  if (isNaN(latitude) || isNaN(longitude) || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    res.status(400).json({
      error: 'BadRequest',
      message: 'Invalid latitude or longitude coordinate bounds.'
    });
    return;
  }

  const cacheKey = `${latitude.toFixed(3)},${longitude.toFixed(3)}`;
  const cached = geocodeCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    res.status(200).json({
      success: true,
      fromCache: true,
      ...cached.data
    });
    return;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`;
    const response = await fetch(nominatimUrl, {
      headers: {
        'User-Agent': 'VisaVoyageAI-ForeignJourneyAssistant/1.0 (contact@visavoyage.ai)',
        'Accept': 'application/json'
      },
      signal: controller.signal
    });
    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`Reverse geocode provider returned status ${response.status}`);
    }

    const data: any = await response.json();
    const address = data.address || {};

    const city =
      address.city ||
      address.town ||
      address.village ||
      address.municipality ||
      address.suburb ||
      address.county ||
      '';

    const state = address.state || address.region || address.province || '';
    const country = address.country || '';
    const countryCode = (address.country_code || '').toUpperCase();

    // Formatted readable origin representation
    let formattedOrigin = '';
    if (city && country) {
      formattedOrigin = `${city}, ${country}`;
    } else if (country) {
      formattedOrigin = country;
    } else {
      formattedOrigin = data.display_name?.split(',').slice(0, 2).join(',').trim() || 'Detected Location';
    }

    const payload = {
      city,
      state,
      country,
      countryCode,
      formattedAddress: data.display_name || formattedOrigin,
      formattedOrigin,
      latitude,
      longitude
    };

    geocodeCache.set(cacheKey, { data: payload, timestamp: Date.now() });

    res.status(200).json({
      success: true,
      fromCache: false,
      ...payload
    });
  } catch (err: any) {
    console.warn('[Location Router] Reverse geocoding fallback invoked:', err?.message || err);

    // Fallback heuristic estimation based on coordinate ranges
    let fallbackCountry = 'United States';
    if (latitude >= -35 && latitude <= 37 && longitude >= -20 && longitude <= 55) {
      fallbackCountry = 'African / Mediterranean Corridor';
    } else if (latitude >= 35 && latitude <= 70 && longitude >= -10 && longitude <= 40) {
      fallbackCountry = 'European Union';
    } else if (latitude >= 0 && latitude <= 50 && longitude >= 60 && longitude <= 145) {
      fallbackCountry = 'Asia-Pacific';
    }

    res.status(200).json({
      success: true,
      city: '',
      state: '',
      country: fallbackCountry,
      countryCode: '',
      formattedAddress: `Coordinates: ${latitude.toFixed(2)}, ${longitude.toFixed(2)}`,
      formattedOrigin: fallbackCountry,
      latitude,
      longitude,
      fallbackUsed: true
    });
  }
});

export default router;
