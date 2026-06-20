import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from './supabase';
import { queryClient } from './queryClient';

// ---------------------------------------------------------------------------
// Sync queue.
//
// The app is online-only, but a failed write must not be lost or silently
// dropped. Every queued op is idempotent:
//   - upsert uses the client-generated `id` as the conflict target, so retrying
//     the same write never creates a duplicate row.
//   - delete on an already-deleted row is a no-op.
//
// On failure we keep the op in the queue and raise a persistent error; the
// SyncBanner shows a "Sync" button that flushes the queue on demand. The queue
// is persisted to localStorage so a refresh / app restart does not lose writes.
// ---------------------------------------------------------------------------

type Table = string;

export type QueuedOp =
  | { kind: 'upsert'; table: Table; id: string; payload: Record<string, unknown> }
  | { kind: 'update'; table: Table; id: string; payload: Record<string, unknown> }
  | { kind: 'delete'; table: Table; id: string };

interface SyncState {
  pending: QueuedOp[];
  isSyncing: boolean;
  error: string | null;
  /**
   * Run an op now; on connectivity failure, queue it and surface an error.
   * Resolves with { queued: true } if it could not reach the server.
   */
  run: (op: QueuedOp) => Promise<{ queued: boolean }>;
  /** Retry every queued op. */
  flush: () => Promise<void>;
  clearError: () => void;
}

function isNetworkError(e: unknown): boolean {
  if (typeof navigator !== 'undefined' && !navigator.onLine) return true;
  const msg = (e as { message?: string })?.message?.toLowerCase() ?? '';
  const name = (e as { name?: string })?.name ?? '';
  return (
    name === 'TypeError' ||
    msg.includes('failed to fetch') ||
    msg.includes('network') ||
    msg.includes('fetch')
  );
}

async function execute(op: QueuedOp): Promise<void> {
  if (op.kind === 'upsert') {
    const { error } = await supabase
      .from(op.table)
      .upsert({ id: op.id, ...op.payload }, { onConflict: 'id' });
    if (error) throw error;
  } else if (op.kind === 'update') {
    const { error } = await supabase.from(op.table).update(op.payload).eq('id', op.id);
    if (error) throw error;
  } else {
    const { error } = await supabase.from(op.table).delete().eq('id', op.id);
    if (error) throw error;
  }
}

export const useSyncStore = create<SyncState>()(
  persist(
    (set, get) => ({
      pending: [],
      isSyncing: false,
      error: null,
      clearError: () => set({ error: null }),

      run: async (op) => {
        // If we already have a backlog, queue behind it to preserve order.
        if (get().pending.length > 0) {
          set((s) => ({ pending: [...s.pending, op] }));
          await get().flush();
          return { queued: get().pending.length > 0 };
        }
        try {
          await execute(op);
          return { queued: false };
        } catch (e) {
          if (isNetworkError(e)) {
            set((s) => ({
              pending: [...s.pending, op],
              error: 'You appear to be offline. Your changes are saved locally — tap Sync to retry.',
            }));
            return { queued: true };
          }
          // Non-connectivity error (e.g. validation): surface and rethrow so the
          // caller can roll back its optimistic update.
          set({ error: (e as { message?: string })?.message ?? 'Something went wrong.' });
          throw e;
        }
      },

      flush: async () => {
        if (get().isSyncing) return;
        set({ isSyncing: true });
        const queue = [...get().pending];
        const remaining: QueuedOp[] = [];
        let firstError: string | null = null;
        for (const op of queue) {
          try {
            await execute(op);
          } catch (e) {
            remaining.push(op);
            if (!firstError) {
              firstError = isNetworkError(e)
                ? 'Still offline — tap Sync to retry once you have a connection.'
                : (e as { message?: string })?.message ?? 'Sync failed.';
            }
          }
        }
        set({ pending: remaining, isSyncing: false, error: remaining.length ? firstError : null });
        // Once the backlog clears, refetch so the UI reflects server truth.
        if (remaining.length === 0) await queryClient.invalidateQueries();
      },
    }),
    { name: 'memoir-sync-queue', partialize: (s) => ({ pending: s.pending }) },
  ),
);

// Convenience helper for hooks.
export function syncRun(op: QueuedOp): Promise<{ queued: boolean }> {
  return useSyncStore.getState().run(op);
}

// Retry the queue automatically when the browser regains connectivity.
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    const { pending, flush } = useSyncStore.getState();
    if (pending.length) void flush();
  });
}
