import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { FriendFavorite } from '@/types/db';

/**
 * Friends' favorite restaurants (aggregated server-side via a security-definer
 * RPC so a friend's raw entries stay private). Sorted by rating then visits.
 */
export function useFriendFavorites() {
  return useQuery({
    queryKey: ['friendFavorites'],
    queryFn: async (): Promise<FriendFavorite[]> => {
      const { data, error } = await supabase.rpc('memoir_friend_restaurant_favorites');
      if (error) throw error;
      const rows = (data ?? []) as FriendFavorite[];
      return [...rows].sort(
        (a, b) => (b.avg_rating ?? -1) - (a.avg_rating ?? -1) || b.visits - a.visits,
      );
    },
  });
}
