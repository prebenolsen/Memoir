import { useQueryClient } from '@tanstack/react-query';
import { syncRun } from '@/lib/sync';
import { useAuth } from '@/context/AuthProvider';
import { toast } from '@/components/ui/Toast';

export type EntryTable =
  | 'memoir_food_entries'
  | 'memoir_drink_entries'
  | 'memoir_activity_entries'
  | 'memoir_purchase_entries';

/**
 * Shared save/delete for entry rows. Writes go through the sync queue so a
 * connectivity drop surfaces the Sync banner instead of losing data. Idempotent
 * by client-generated id (upsert on conflict id).
 */
export function useEntryMutations() {
  const qc = useQueryClient();
  const { user } = useAuth();

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: ['day'] });
    void qc.invalidateQueries({ queryKey: ['itemList'] });
    void qc.invalidateQueries({ queryKey: ['itemDetail'] });
    void qc.invalidateQueries({ queryKey: ['stats'] });
    void qc.invalidateQueries({ queryKey: ['expenses'] });
    void qc.invalidateQueries({ queryKey: ['recentEntries'] });
  };

  const save = async (
    table: EntryTable,
    id: string,
    payload: Record<string, unknown>,
  ): Promise<void> => {
    const { queued } = await syncRun({
      kind: 'upsert',
      table,
      id,
      payload: { user_id: user!.id, ...payload },
    });
    invalidate();
    if (queued) toast('Saved locally — will sync', 'error');
    else toast('Saved');
  };

  const remove = async (table: EntryTable, id: string): Promise<void> => {
    const { queued } = await syncRun({ kind: 'delete', table, id });
    invalidate();
    if (queued) toast('Deleted locally — will sync', 'error');
    else toast('Deleted');
  };

  return { save, remove };
}
