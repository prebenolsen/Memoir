/**
 * Browser geolocation helper. Promisifies navigator.geolocation with typed
 * errors so the UI can show a friendly, actionable message for each failure.
 */

export type GeoErrorKind = 'unsupported' | 'denied' | 'unavailable' | 'timeout';

export class GeoError extends Error {
  kind: GeoErrorKind;
  constructor(kind: GeoErrorKind, message: string) {
    super(message);
    this.name = 'GeoError';
    this.kind = kind;
  }
}

export interface Coords {
  latitude: number;
  longitude: number;
}

/** Great-circle distance between two coordinates, in metres. */
export function distanceMeters(aLat: number, aLon: number, bLat: number, bLon: number): number {
  const R = 6_371_000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLon = toRad(bLon - aLon);
  const lat1 = toRad(aLat);
  const lat2 = toRad(bLat);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.sin(dLon / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return Math.round(2 * R * Math.asin(Math.sqrt(h)));
}

export interface LocationInfo {
  city: string | null;
  country: string | null;
}

/**
 * Reverse-geocode coordinates to a human-readable city and country using
 * the Nominatim API (OpenStreetMap, free, no key required).
 */
export async function reverseGeocode(latitude: number, longitude: number): Promise<LocationInfo> {
  const url =
    `https://nominatim.openstreetmap.org/reverse` +
    `?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`;
  let res: Response;
  try {
    res = await fetch(url, { headers: { 'Accept-Language': 'en' } });
  } catch {
    throw new GeoError('unavailable', 'Could not reach the location service.');
  }
  if (!res.ok) throw new GeoError('unavailable', 'Location service returned an error.');
  const data = (await res.json()) as { address?: Record<string, string> };
  const addr = data.address ?? {};
  const city =
    addr.city ?? addr.town ?? addr.village ?? addr.hamlet ?? addr.suburb ?? null;
  return { city: city ?? null, country: addr.country ?? null };
}

export function getCurrentPosition(): Promise<Coords> {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new GeoError('unsupported', 'Location is not supported on this device.'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
      (err) => {
        switch (err.code) {
          case err.PERMISSION_DENIED:
            reject(new GeoError('denied', 'Location permission was denied.'));
            break;
          case err.POSITION_UNAVAILABLE:
            reject(new GeoError('unavailable', 'Your location is currently unavailable.'));
            break;
          case err.TIMEOUT:
            reject(new GeoError('timeout', 'Timed out getting your location.'));
            break;
          default:
            reject(new GeoError('unavailable', err.message || 'Could not get your location.'));
        }
      },
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 60_000 },
    );
  });
}
