import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthProvider';
import type { Profile } from '@/types/db';

/** The signed-in user's profile (username), plus a setter for the username. */
export function useProfile() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ['profile', user?.id],
    enabled: !!user,
    queryFn: async (): Promise<Profile | null> => {
      const { data, error } = await supabase
        .from('memoir_profiles')
        .select('*')
        .eq('user_id', user!.id)
        .maybeSingle();
      if (error) throw error;
      return (data as Profile | null) ?? null;
    },
  });

  const setUsername = useMutation({
    mutationFn: async (username: string) => {
      const name = username.trim();
      const { error } = await supabase
        .from('memoir_profiles')
        .upsert({ user_id: user!.id, username: name }, { onConflict: 'user_id' });
      if (error) {
        // 23505 = unique violation on lower(username).
        if (error.code === '23505') throw new Error('That username is already taken.');
        throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['profile', user?.id] }),
  });

  return {
    profile: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error as Error | null,
    setUsername: (name: string) => setUsername.mutateAsync(name),
    saving: setUsername.isPending,
  };
}
