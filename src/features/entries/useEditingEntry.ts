import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

/** Load a single entry row for editing (null when creating). */
export function useEditingEntry<T>(table: string, id: string | null) {
  return useQuery({
    queryKey: ['editEntry', table, id],
    enabled: !!id,
    gcTime: 0,
    queryFn: async (): Promise<T | null> => {
      const { data, error } = await supabase.from(table).select('*').eq('id', id!).maybeSingle();
      if (error) throw error;
      return data as T | null;
    },
  });
}
