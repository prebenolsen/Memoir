import { RefreshCw, WifiOff } from 'lucide-react';
import { useSyncStore } from '@/lib/sync';
import { cn } from '@/lib/cn';

/**
 * Persistent banner shown whenever there are unsynced writes or a sync error.
 * Stays on screen with a Sync button until the queue flushes successfully.
 */
export function SyncBanner() {
  const { pending, error, isSyncing, flush } = useSyncStore();
  if (pending.length === 0 && !error) return null;

  return (
    <div className="fixed inset-x-0 top-0 z-50 mx-auto max-w-md px-3 pt-3">
      <div className="flex items-center gap-3 rounded-xl border border-accent/40 bg-surface px-3.5 py-2.5 shadow-soft">
        <WifiOff size={18} className="shrink-0 text-accent" />
        <div className="min-w-0 flex-1 text-sm">
          <p className="font-medium text-text">
            {pending.length} change{pending.length === 1 ? '' : 's'} not synced
          </p>
          {error && <p className="truncate text-xs text-text-muted">{error}</p>}
        </div>
        <button
          onClick={() => void flush()}
          disabled={isSyncing}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-fg disabled:opacity-60"
        >
          <RefreshCw size={15} className={cn(isSyncing && 'animate-spin')} />
          {isSyncing ? 'Syncing' : 'Sync'}
        </button>
      </div>
    </div>
  );
}
