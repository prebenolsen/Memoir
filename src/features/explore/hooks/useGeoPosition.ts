import { useQuery } from '@tanstack/react-query';
import { getCurrentPosition, type Coords } from '@/lib/geo';

/** Shared cache key so warming (on Journal) and Explore read the same position. */
export const GEO_POSITION_KEY = ['geo', 'position'] as const;

/**
 * The user's current GPS position, cached via React Query so it can be warmed
 * ahead of time (see `useWarmExplore`) and reused instantly when Explore opens.
 *
 * `enabled` lets the caller decide *when* the (permission-prompting) lookup may
 * run: the warmer enables it only once location is already granted, while
 * Explore enables it whenever the user is in "Nearby" mode.
 */
export function useGeoPosition(enabled: boolean) {
  return useQuery<Coords>({
    queryKey: GEO_POSITION_KEY,
    queryFn: getCurrentPosition,
    enabled,
    retry: false,
    // Matches the maximumAge passed to getCurrentPosition — a fresh-enough fix
    // is reused rather than re-prompting the device.
    staleTime: 60_000,
  });
}
