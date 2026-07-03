import { useEffect, useState } from 'react';

/**
 * True once we've confirmed the browser has *already* granted location
 * permission. Used to decide whether GPS may be warmed in the background
 * without showing a surprise permission prompt on a non-location screen.
 *
 * Falls back to `false` where the Permissions API is unavailable, so warming
 * simply doesn't happen and the prompt is deferred to when Explore opens.
 */
export function useGeolocationGranted(): boolean {
  const [granted, setGranted] = useState(false);

  useEffect(() => {
    if (!navigator.permissions?.query) return;
    let active = true;
    let status: PermissionStatus | null = null;
    const sync = () => active && status && setGranted(status.state === 'granted');
    navigator.permissions
      .query({ name: 'geolocation' as PermissionName })
      .then((s) => {
        if (!active) return;
        status = s;
        s.addEventListener('change', sync);
        sync();
      })
      .catch(() => {});
    return () => {
      active = false;
      status?.removeEventListener('change', sync);
    };
  }, []);

  return granted;
}
