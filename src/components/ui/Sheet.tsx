import { useEffect, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/cn';

interface Props {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
  /** Center the card vertically instead of anchoring it to the bottom. */
  center?: boolean;
}

/** Bottom sheet on mobile, centered card on larger screens. */
export function Sheet({ open, onClose, title, children, footer, center = false }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex justify-center',
        center ? 'items-center p-4' : 'items-end sm:items-center',
      )}
    >
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-[1px] animate-[fadeIn_120ms_ease-out]"
        onClick={onClose}
      />
      <div
        className={cn(
          'relative w-full sm:max-w-md max-h-[92vh] flex flex-col',
          'bg-bg shadow-sheet border border-border',
          center ? 'max-w-md rounded-2xl' : 'sm:max-w-md sm:rounded-2xl rounded-t-2xl',
          'animate-[sheetUp_180ms_cubic-bezier(0.16,1,0.3,1)]',
        )}
      >
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-full text-text-muted hover:bg-surface-alt"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>
        <div className="no-scrollbar flex-1 overflow-y-auto px-4 pb-4">{children}</div>
        {footer && (
          <div className="safe-bottom border-t border-border bg-surface/60 px-4 py-3">{footer}</div>
        )}
      </div>
      <style>{`
        @keyframes sheetUp { from { transform: translateY(16px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
      `}</style>
    </div>
  );
}
