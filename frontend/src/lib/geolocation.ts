import { apiClient } from './api.js';

export interface DetectedLocationResult {
  city: string;
  state: string;
  country: string;
  countryCode: string;
  formattedOrigin: string;
  formattedAddress: string;
  latitude: number;
  longitude: number;
}

export interface GeolocationResponse {
  success: boolean;
  data?: DetectedLocationResult;
  error?: string;
  permissionDenied?: boolean;
}

/**
 * Requests the browser Geolocation API and reverses coordinates to City & Country.
 * Never requests permission automatically; must only be called via explicit user click.
 */
export async function detectUserLocation(): Promise<GeolocationResponse> {
  if (typeof window === 'undefined' || !('geolocation' in navigator)) {
    return {
      success: false,
      error: 'Geolocation is not supported by your browser or environment.'
    };
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        try {
          // 1. Try server-side reverse geocoding proxy
          const res = await apiClient.get('/location/reverse-geocode', {
            params: { lat: latitude, lon: longitude },
            timeout: 7000
          });

          if (res?.data?.success) {
            resolve({
              success: true,
              data: {
                city: res.data.city || '',
                state: res.data.state || '',
                country: res.data.country || 'Detected Region',
                countryCode: res.data.countryCode || '',
                formattedOrigin: res.data.formattedOrigin || res.data.country || 'Detected Region',
                formattedAddress: res.data.formattedAddress || `${latitude.toFixed(2)}, ${longitude.toFixed(2)}`,
                latitude,
                longitude
              }
            });
            return;
          }
        } catch (_backendErr) {
          // Fall back to client-side direct lookup if backend is temporarily unreachable
        }

        try {
          const directUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`;
          const clientRes = await fetch(directUrl, {
            headers: { 'Accept': 'application/json' }
          });

          if (clientRes.ok) {
            const data = await clientRes.json();
            const addr = data.address || {};
            const city = addr.city || addr.town || addr.village || addr.municipality || addr.county || '';
            const country = addr.country || '';
            const formattedOrigin = city && country ? `${city}, ${country}` : country || 'Current Location';

            resolve({
              success: true,
              data: {
                city,
                state: addr.state || '',
                country,
                countryCode: (addr.country_code || '').toUpperCase(),
                formattedOrigin,
                formattedAddress: data.display_name || formattedOrigin,
                latitude,
                longitude
              }
            });
            return;
          }
        } catch (_clientErr) {
          // Continue to fallback
        }

        // Resilient fallback with coordinates if reverse geocoding fails
        resolve({
          success: true,
          data: {
            city: '',
            state: '',
            country: 'Current Location',
            countryCode: '',
            formattedOrigin: `${latitude.toFixed(2)}°, ${longitude.toFixed(2)}°`,
            formattedAddress: `Coordinates: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
            latitude,
            longitude
          }
        });
      },
      (geoError) => {
        let errorMsg = 'Failed to retrieve device location.';
        let permissionDenied = false;

        switch (geoError.code) {
          case geoError.PERMISSION_DENIED:
            errorMsg = 'Location permission was denied. You can manually enter your origin country or city.';
            permissionDenied = true;
            break;
          case geoError.POSITION_UNAVAILABLE:
            errorMsg = 'Location information is unavailable from your device or network.';
            break;
          case geoError.TIMEOUT:
            errorMsg = 'Location request timed out. Please check your connection or enter manually.';
            break;
          default:
            errorMsg = geoError.message || errorMsg;
            break;
        }

        resolve({
          success: false,
          error: errorMsg,
          permissionDenied
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  });
}
