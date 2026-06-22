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
