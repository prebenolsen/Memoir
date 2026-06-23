import { useEffect, useRef, useState } from 'react';
import { Plus, UtensilsCrossed, Wine, Ticket, ShoppingBag, ScanLine, X, Clock } from 'lucide-react';
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

type Side = 'left' | 'right';

const SIDE_KEY = 'memoir.fabSide';
/** Hold the FAB this long (ms) before it becomes draggable. */
const LONG_PRESS_MS = 500;
/** How close (px) the FAB must get to the target before it snaps into place. */
const MAGNET_RADIUS = 72;
/** Half the FAB's width/height (h-14 / w-14 → 56px). */
const FAB_HALF = 28;
/** The FAB's resting offset from the screen edge / container bottom. */
const EDGE = 16; // right-4 / left-4
const BOTTOM = 88; // bottom-[88px]

export function QuickAddFab() {
  const [open, setOpen] = useState(false);
  const [recent, setRecent] = useState(false);
  const openSheet = useQuickAdd((s) => s.open);
  const openScanner = useQuickAdd((s) => s.openScanner);
  const { activeProject, date } = useProject();
  const { save } = useEntryMutations();
  const { data: recentEntries = [], isLoading } = useRecentEntries(open && recent);

  // Which corner the FAB lives in. Persisted so the user's choice sticks.
  const [side, setSide] = useState<Side>(
    () => ((localStorage.getItem(SIDE_KEY) as Side) ?? 'right'),
  );
  useEffect(() => {
    localStorage.setItem(SIDE_KEY, side);
  }, [side]);
  const isLeft = side === 'left';

  // Drag state for the long-press "move the FAB" gesture.
  const [dragging, setDragging] = useState(false);
  const [snapped, setSnapped] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const rootRef = useRef<HTMLDivElement>(null);
  const pressTimer = useRef<number | null>(null);
  const didDrag = useRef(false);

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

  // --- Long-press drag ----------------------------------------------------
  // Press and hold for half a second to pick the FAB up, then drag it toward
  // the opposite corner. A ghost target there pulls the FAB in magnetically;
  // let go close enough and the FAB (and its whole menu) flips sides. Let go
  // too far away and it springs back to where it was.
  const cornerCenters = () => {
    const rect = rootRef.current!.getBoundingClientRect();
    const y = rect.bottom - BOTTOM - FAB_HALF;
    const rest = isLeft ? rect.left + EDGE + FAB_HALF : rect.right - EDGE - FAB_HALF;
    const target = isLeft ? rect.right - EDGE - FAB_HALF : rect.left + EDGE + FAB_HALF;
    return { rest: { x: rest, y }, target: { x: target, y } };
  };

  const onPointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    e.currentTarget.setPointerCapture?.(e.pointerId);
    didDrag.current = false;
    pressTimer.current = window.setTimeout(() => {
      setDragging(true);
      closeAll();
    }, LONG_PRESS_MS);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!dragging) return;
    const { rest, target } = cornerCenters();
    const dist = Math.hypot(e.clientX - target.x, e.clientY - target.y);
    if (dist < MAGNET_RADIUS) {
      setSnapped(true);
      setOffset({ x: target.x - rest.x, y: target.y - rest.y });
    } else {
      setSnapped(false);
      setOffset({ x: e.clientX - rest.x, y: e.clientY - rest.y });
    }
  };

  const endPress = () => {
    if (pressTimer.current !== null) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
    if (dragging) {
      didDrag.current = true; // swallow the click that follows a drag
      if (snapped) setSide((s) => (s === 'right' ? 'left' : 'right'));
      setDragging(false);
      setSnapped(false);
      setOffset({ x: 0, y: 0 });
    }
  };

  const fabIcon = !open ? <Plus size={28} /> : recent ? <X size={26} /> : <ScanLine size={26} />;
  const fabLabel = !open ? 'Quick add' : recent ? 'Go back' : 'Scan barcode';

  // Pills mirror with the FAB: anchored to the active side, and their contents
  // (icon ↔ text) flip so the text always starts away from the screen edge.
  const pillClass = `pointer-events-auto flex items-center gap-2 rounded-full border border-border bg-surface py-2 text-sm font-medium text-text shadow-soft animate-[fadeIn_140ms_ease-out] ${
    isLeft ? 'flex-row-reverse pl-4 pr-3' : 'pl-3 pr-4'
  }`;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 mx-auto max-w-md">
      <div ref={rootRef} className="safe-bottom relative">
        {open && (
          <div
            className="pointer-events-auto fixed inset-0 -z-10 bg-black/20"
            onClick={closeAll}
          />
        )}

        <div
          className={`absolute bottom-[160px] flex flex-col gap-2 ${
            isLeft ? 'left-4 items-start' : 'right-4 items-end'
          }`}
        >
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

        {/* Magnetic drop target shown on the opposite corner while dragging. */}
        {dragging && (
          <div
            className={`pointer-events-none absolute bottom-[88px] grid h-14 w-14 place-items-center rounded-full border-2 border-dashed transition-colors ${
              isLeft ? 'right-4' : 'left-4'
            } ${snapped ? 'border-primary bg-primary/20' : 'border-border bg-black/5'}`}
          >
            <Plus size={24} className={snapped ? 'text-primary' : 'text-text/30'} />
          </div>
        )}

        {/* "Add recent" (beverages only) sits attached to the FAB, on the edge
            side away from the screen border, vertically centered with it. */}
        <div
          className={`absolute bottom-[88px] flex items-center gap-3 ${
            isLeft ? 'left-4 flex-row-reverse' : 'right-4'
          }`}
        >
          {open && !recent && (
            <button onClick={() => setRecent(true)} className={pillClass}>
              <Clock size={18} className="text-primary" />
              Add recent
            </button>
          )}

          <button
            onClick={() => {
              if (didDrag.current) {
                didDrag.current = false;
                return;
              }
              handleFab();
            }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={endPress}
            onPointerCancel={endPress}
            style={{
              touchAction: 'none',
              transform: `translate(${offset.x}px, ${offset.y}px) scale(${dragging ? 1.08 : 1})`,
              transition: dragging
                ? snapped
                  ? 'transform 120ms ease-out'
                  : 'none'
                : 'transform 200ms ease-out',
            }}
            className={`pointer-events-auto relative z-10 grid h-14 w-14 place-items-center rounded-full bg-primary text-primary-fg shadow-soft active:scale-95 ${
              dragging ? 'ring-4 ring-primary/30' : ''
            }`}
            aria-label={fabLabel}
          >
            {fabIcon}
          </button>
        </div>
      </div>
    </div>
  );
}
