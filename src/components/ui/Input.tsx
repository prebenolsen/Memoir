import { forwardRef, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

const base =
  'w-full bg-surface border border-border rounded-xl px-3.5 h-11 text-[15px] text-text placeholder:text-text-muted/70 ' +
  'focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...rest }, ref) {
    return <input ref={ref} className={cn(base, className)} {...rest} />;
  },
);

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ className, ...rest }, ref) {
    return (
      <textarea
        ref={ref}
        className={cn(base, 'h-auto min-h-[44px] py-2.5 resize-none', className)}
        {...rest}
      />
    );
  },
);

export function Field({
  label,
  hint,
  optional,
  children,
}: {
  label: string;
  hint?: string;
  optional?: boolean;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <div className="mb-1.5 flex items-baseline justify-between">
        <span className="text-sm font-medium text-text">{label}</span>
        {optional && <span className="text-xs text-text-muted">optional</span>}
      </div>
      {children}
      {hint && <p className="mt-1 text-xs text-text-muted">{hint}</p>}
    </label>
  );
}
