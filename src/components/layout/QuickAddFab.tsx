import { useState } from 'react';
import { Plus, UtensilsCrossed, Wine, Ticket, ShoppingBag, ScanLine, X } from 'lucide-react';
import { useQuickAdd, type AddKind } from '@/lib/quickAdd';
import { cn } from '@/lib/cn';

const actions: { kind: AddKind; label: string; icon: typeof Plus }[] = [
  { kind: 'food', label: 'Add food', icon: UtensilsCrossed },
  { kind: 'drink', label: 'Add drink', icon: Wine },
  { kind: 'activity', label: 'Add activity', icon: Ticket },
  { kind: 'purchase', label: 'Add purchase', icon: ShoppingBag },
];

export function QuickAddFab() {
  const [open, setOpen] = useState(false);
  const openSheet = useQuickAdd((s) => s.open);
  const openScanner = useQuickAdd((s) => s.openScanner);

  const trigger = (kind: AddKind) => {
    setOpen(false);
    openSheet(kind);
  };

  const triggerScanner = () => {
    setOpen(false);
    openScanner();
  };

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 mx-auto max-w-md">
      <div className="safe-bottom relative">
        {open && (
          <div
            className="pointer-events-auto fixed inset-0 -z-10 bg-black/20"
            onClick={() => setOpen(false)}
          />
        )}

        <div className="absolute bottom-[160px] right-4 flex flex-col items-end gap-2">
          {open && (
            <>
              {actions.map(({ kind, label, icon: Icon }, i) => (
                <button
                  key={kind}
                  onClick={() => trigger(kind)}
                  style={{ animationDelay: `${i * 30}ms` }}
                  className="pointer-events-auto flex items-center gap-2 rounded-full border border-border bg-surface py-2 pl-3 pr-4 text-sm font-medium text-text shadow-soft animate-[fadeIn_140ms_ease-out]"
                >
                  <Icon size={18} className="text-primary" />
                  {label}
                </button>
              ))}
              <button
                onClick={triggerScanner}
                style={{ animationDelay: `${actions.length * 30}ms` }}
                className="pointer-events-auto flex items-center gap-2 rounded-full border border-border bg-surface py-2 pl-3 pr-4 text-sm font-medium text-text shadow-soft animate-[fadeIn_140ms_ease-out]"
              >
                <ScanLine size={18} className="text-primary" />
                Scan barcode
              </button>
            </>
          )}
        </div>

        <button
          onClick={() => setOpen((v) => !v)}
          className={cn(
            'pointer-events-auto absolute bottom-[88px] right-4 grid h-14 w-14 place-items-center rounded-full bg-primary text-primary-fg shadow-soft transition active:scale-95',
            open && 'rotate-45',
          )}
          aria-label="Quick add"
        >
          {open ? <X size={26} /> : <Plus size={28} />}
        </button>
      </div>
    </div>
  );
}
