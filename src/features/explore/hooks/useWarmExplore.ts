import { useItemList } from '@/hooks/useItems';
import { useGeoPosition } from './useGeoPosition';
import { useGeolocationGranted } from './useGeolocationGranted';
import { useFriendFavorites, useFriendDrinkFavorites } from './useFriendFavorites';

/**
 * Pre-warm everything the Explore tab needs so opening it is instant. Mounted on
 * the logged-in AppShell, this fires while the user is still on Journal:
 *
 *  - the GPS lookup — but only once location is already granted, so users never
 *    see a permission prompt on a screen that has nothing to do with location;
 *  - the venue / beverage / friend-favorite queries (React Query dedupes and
 *    caches these, so Explore reuses them with no extra fetch).
 */
export function useWarmExplore(): void {
  const geoGranted = useGeolocationGranted();
  useGeoPosition(geoGranted);
  useItemList('venue');
  useItemList('drink');
  useFriendFavorites();
  useFriendDrinkFavorites();
}
