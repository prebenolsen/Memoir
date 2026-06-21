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
