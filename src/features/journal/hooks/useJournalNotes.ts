import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { syncRun } from '@/lib/sync';
import { useAuth } from '@/context/AuthProvider';
import { toast } from '@/components/ui/Toast';
import type { JournalEntry } from '@/types/db';

const KEY = 'journalNotes';

/**
 * Freetext journal notes for a given day. Mirrors useDay's project semantics:
 *   - undefined → loading, query disabled
 *   - null      → "Everything" mode, notes from all projects
 *   - string    → a specific project
 */
export function useJournalNotes(projectId: string | null | undefined, date: string) {
  return useQuery({
    queryKey: [KEY, projectId, date],
    enabled: projectId !== undefined,
    queryFn: async (): Promise<JournalEntry[]> => {
      let q = supabase
        .from('memoir_journal_entries')
        .select('*')
        .eq('entry_date', date)
        .order('created_at');
      if (projectId !== null) q = q.eq('project_id', projectId!);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as JournalEntry[];
    },
  });
}

/**
 * Save/delete for journal notes. Like useEntryMutations, writes go through the
 * sync queue so a connectivity drop surfaces the Sync banner instead of losing
 * data, and upserts are idempotent by client-generated id.
 */
export function useJournalNoteMutations() {
  const qc = useQueryClient();
  const { user } = useAuth();

  const invalidate = () => void qc.invalidateQueries({ queryKey: [KEY] });

  const save = async (
    id: string,
    payload: { project_id: string; entry_date: string; body: string },
  ): Promise<void> => {
    const { queued } = await syncRun({
      kind: 'upsert',
      table: 'memoir_journal_entries',
      id,
      payload: { user_id: user!.id, ...payload },
    });
    invalidate();
    if (queued) toast('Saved locally — will sync', 'error');
    else toast('Saved');
  };

  const remove = async (id: string): Promise<void> => {
    const { queued } = await syncRun({ kind: 'delete', table: 'memoir_journal_entries', id });
    invalidate();
    if (queued) toast('Deleted locally — will sync', 'error');
    else toast('Deleted');
  };

  return { save, remove };
}
