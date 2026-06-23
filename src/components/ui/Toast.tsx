import { create } from 'zustand';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/cn';

type ToastKind = 'success' | 'error';
interface ToastItem {
  id: number;
  message: string;
  kind: ToastKind;
}

interface ToastState {
  toasts: ToastItem[];
  show: (message: string, kind?: ToastKind) => void;
  dismiss: (id: number) => void;
}

export const useToast = create<ToastState>((set) => ({
  toasts: [],
  show: (message, kind = 'success') => {
    const id = Date.now() + Math.random();
    set((s) => ({ toasts: [...s.toasts, { id, message, kind }] }));
    setTimeout(() => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })), 2600);
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

export function toast(message: string, kind: ToastKind = 'success') {
  useToast.getState().show(message, kind);
}

export function Toaster() {
  const toasts = useToast((s) => s.toasts);
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+76px)] z-[60] flex flex-col items-center gap-2 px-4">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            'pointer-events-auto flex items-center gap-2 rounded-xl border px-3.5 py-2.5 text-sm shadow-soft animate-[fadeIn_140ms_ease-out]',
            t.kind === 'success'
              ? 'bg-surface border-border text-text'
              : 'bg-danger text-white border-danger',
          )}
        >
          {t.kind === 'success' ? (
            <CheckCircle2 size={18} className="text-primary" />
          ) : (
            <AlertCircle size={18} />
          )}
          {t.message}
        </div>
      ))}
    </div>
  );
}
