import { useState } from 'react';
import { Plus, UtensilsCrossed, Wine, Ticket, ShoppingBag, ScanLine, X } from 'lucide-react';
import { useQuickAdd, type AddKind } from '@/lib/quickAdd';
import { useRecentEntries, type RecentEntry } from '@/hooks/useRecentEntries';
import { useEntryMutations } from '@/hooks/useEntryMutations';
import { useProject } from '@/context/ProjectProvider';
import { newId } from '@/lib/format';

const KIND_ICON: Record<AddKind, typeof Plus> = {
  food: UtensilsCrossed,
  drink: Wine,
  activity: Ticket,
  purchase: ShoppingBag,
};

const actions: { kind: AddKind; label: string }[] = [
  { kind: 'food', label: 'Add food' },
  { kind: 'drink', label: 'Add drink' },
  { kind: 'activity', label: 'Add activity' },
  { kind: 'purchase', label: 'Add purchase' },
];

/** A clock-face emoji for the current part of the day. */
function timeEmoji(): string {
  const h = new Date().getHours();
  if (h < 6) return '🌙'; // night
  if (h < 12) return '🌅'; // morning
  if (h < 18) return '☀️'; // afternoon
  if (h < 22) return '🌆'; // evening
  return '🌙'; // night
}

export function QuickAddFab() {
  const [open, setOpen] = useState(false);
  const [recent, setRecent] = useState(false);
  const openSheet = useQuickAdd((s) => s.open);
  const openScanner = useQuickAdd((s) => s.openScanner);
  const { activeProject, date } = useProject();
  const { save } = useEntryMutations();
  const { data: recentEntries = [], isLoading } = useRecentEntries(open && recent);

  const closeAll = () => {
    setOpen(false);
    setRecent(false);
  };

  const trigger = (kind: AddKind) => {
    closeAll();
    openSheet(kind);
  };

  // Re-log a past entry as a fresh row on the current day/project — one tap, no
  // sheet, no extra steps.
  const pickRecent = (entry: RecentEntry) => {
    if (!activeProject) return;
    closeAll();
    void save(entry.table, newId(), {
      ...entry.payload,
      project_id: activeProject.id,
      entry_date: date,
    });
  };

  // The FAB cycles through the flow: closed → menu → (barcode | recent list).
  // In recent mode it becomes a back/cancel button that returns to the menu.
  const handleFab = () => {
    if (!open) {
      setOpen(true);
    } else if (recent) {
      setRecent(false);
    } else {
      setOpen(false);
      openScanner();
    }
  };

  const fabIcon = !open ? <Plus size={28} /> : recent ? <X size={26} /> : <ScanLine size={26} />;
  const fabLabel = !open ? 'Quick add' : recent ? 'Go back' : 'Scan barcode';

  const pillClass =
    'pointer-events-auto flex items-center gap-2 rounded-full border border-border bg-surface py-2 pl-3 pr-4 text-sm font-medium text-text shadow-soft animate-[fadeIn_140ms_ease-out]';

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 mx-auto max-w-md">
      <div className="safe-bottom relative">
        {open && (
          <div
            className="pointer-events-auto fixed inset-0 -z-10 bg-black/20"
            onClick={closeAll}
          />
        )}

        {/* "Add recent" stands alone on the far left, ignoring the action stack. */}
        {open && !recent && (
          <button
            onClick={() => setRecent(true)}
            className={`${pillClass} absolute bottom-[88px] left-4`}
          >
            <span aria-hidden className="text-base leading-none">
              {timeEmoji()}
            </span>
            Add recent
          </button>
        )}

        <div className="absolute bottom-[160px] right-4 flex flex-col items-end gap-2">
          {open && !recent &&
            actions.map(({ kind, label }, i) => {
              const Icon = KIND_ICON[kind];
              return (
                <button
                  key={kind}
                  onClick={() => trigger(kind)}
                  style={{ animationDelay: `${i * 30}ms` }}
                  className={pillClass}
                >
                  <Icon size={18} className="text-primary" />
                  {label}
                </button>
              );
            })}

          {open && recent &&
            (isLoading ? (
              <div className={pillClass}>Loading…</div>
            ) : recentEntries.length === 0 ? (
              <div className={pillClass}>No recent entries yet.</div>
            ) : (
              recentEntries.map((entry, i) => {
                const Icon = KIND_ICON[entry.kind];
                return (
                  <button
                    key={entry.id}
                    onClick={() => pickRecent(entry)}
                    style={{ animationDelay: `${i * 30}ms` }}
                    className={`${pillClass} max-w-[16rem]`}
                  >
                    <Icon size={18} className="shrink-0 text-primary" />
                    <span className="truncate">{entry.label}</span>
                  </button>
                );
              })
            ))}
        </div>

        <button
          onClick={handleFab}
          className="pointer-events-auto absolute bottom-[88px] right-4 grid h-14 w-14 place-items-center rounded-full bg-primary text-primary-fg shadow-soft transition active:scale-95"
          aria-label={fabLabel}
        >
          {fabIcon}
        </button>
      </div>
    </div>
  );
}
