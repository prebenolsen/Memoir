import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthProvider';
import type { Friendship } from '@/types/db';

/** A friendship row resolved to the *other* person's id + username/email. */
export interface FriendEdge {
  friendshipId: string;
  userId: string;
  username: string | null;
  email: string | null;
}

interface FriendLists {
  friends: FriendEdge[]; // accepted
  incoming: FriendEdge[]; // pending requests addressed to me
  outgoing: FriendEdge[]; // pending requests I sent
}

export function useFriends() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const me = user?.id;

  const query = useQuery({
    queryKey: ['friends', me],
    enabled: !!me,
    queryFn: async (): Promise<FriendLists> => {
      const { data: rows, error } = await supabase
        .from('memoir_friendships')
        .select('*')
        .or(`requester_id.eq.${me},addressee_id.eq.${me}`);
      if (error) throw error;
      const friendships = (rows ?? []) as Friendship[];

      // Resolve the other party's username in one lookup.
      const otherIds = friendships.map((f) => (f.requester_id === me ? f.addressee_id : f.requester_id));
      const profileById = new Map<string, { username: string | null; email: string | null }>();
      if (otherIds.length) {
        const { data: profiles } = await supabase
          .from('memoir_profiles')
          .select('user_id, username, email')
          .in('user_id', otherIds);
        (profiles ?? []).forEach((p: { user_id: string; username: string | null; email: string | null }) =>
          profileById.set(p.user_id, { username: p.username, email: p.email }),
        );
      }

      const edge = (f: Friendship): FriendEdge => {
        const otherId = f.requester_id === me ? f.addressee_id : f.requester_id;
        const p = profileById.get(otherId);
        return { friendshipId: f.id, userId: otherId, username: p?.username ?? null, email: p?.email ?? null };
      };

      return {
        friends: friendships.filter((f) => f.status === 'accepted').map(edge),
        incoming: friendships
          .filter((f) => f.status === 'pending' && f.addressee_id === me)
          .map(edge),
        outgoing: friendships
          .filter((f) => f.status === 'pending' && f.requester_id === me)
          .map(edge),
      };
    },
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['friends', me] });
    qc.invalidateQueries({ queryKey: ['friendFavorites'] });
  };

  const addFriend = useMutation({
    mutationFn: async (identifier: string) => {
      const id = identifier.trim();
      if (!id) throw new Error('Enter a username or email.');
      const { data, error } = await supabase.rpc('memoir_find_profile', { identifier: id });
      if (error) throw error;
      const found = (Array.isArray(data) ? data[0] : data) as { user_id: string } | null;
      if (!found?.user_id) throw new Error('No user found with that username or email.');
      if (found.user_id === me) throw new Error("That's you!");
      const { error: insErr } = await supabase
        .from('memoir_friendships')
        .insert({ requester_id: me, addressee_id: found.user_id, status: 'pending' });
      if (insErr) {
        if (insErr.code === '23505') throw new Error('You already have a request with this person.');
        throw insErr;
      }
    },
    onSuccess: invalidate,
  });

  const accept = useMutation({
    mutationFn: async (friendshipId: string) => {
      const { error } = await supabase
        .from('memoir_friendships')
        .update({ status: 'accepted', responded_at: new Date().toISOString() })
        .eq('id', friendshipId);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: async (friendshipId: string) => {
      const { error } = await supabase.from('memoir_friendships').delete().eq('id', friendshipId);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  return {
    friends: query.data?.friends ?? [],
    incoming: query.data?.incoming ?? [],
    outgoing: query.data?.outgoing ?? [],
    isLoading: query.isLoading,
    error: query.error as Error | null,
    addFriend: (identifier: string) => addFriend.mutateAsync(identifier),
    adding: addFriend.isPending,
    acceptRequest: (id: string) => accept.mutateAsync(id),
    removeFriend: (id: string) => remove.mutateAsync(id),
  };
}
