import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { FriendFavorite, FriendDrinkFavorite } from '@/types/db';

/**
 * Friends' favorite venues (aggregated server-side via a security-definer
 * RPC so a friend's raw entries stay private). Sorted by rating then visits.
 */
export function useFriendFavorites() {
  return useQuery({
    queryKey: ['friendFavorites'],
    queryFn: async (): Promise<FriendFavorite[]> => {
      const { data, error } = await supabase.rpc('memoir_friend_venue_favorites');
      if (error) throw error;
      const rows = (data ?? []) as FriendFavorite[];
      return [...rows].sort(
        (a, b) => (b.avg_rating ?? -1) - (a.avg_rating ?? -1) || b.visits - a.visits,
      );
    },
  });
}

/**
 * Friends' favorite beverages (aggregated server-side via a security-definer
 * RPC so a friend's raw entries stay private). Sorted by rating then count.
 */
export function useFriendDrinkFavorites() {
  return useQuery({
    queryKey: ['friendDrinkFavorites'],
    queryFn: async (): Promise<FriendDrinkFavorite[]> => {
      const { data, error } = await supabase.rpc('memoir_friend_drink_favorites');
      if (error) throw error;
      const rows = (data ?? []) as FriendDrinkFavorite[];
      return [...rows].sort(
        (a, b) => (b.avg_rating ?? -1) - (a.avg_rating ?? -1) || b.count - a.count,
      );
    },
  });
}
