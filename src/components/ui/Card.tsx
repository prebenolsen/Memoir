import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export function Card({
  children,
  className,
  onClick,
}: {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'bg-surface border border-border rounded-2xl shadow-soft',
        onClick && 'cursor-pointer active:scale-[0.99] transition',
        className,
      )}
    >
      {children}
    </div>
  );
}

export function SectionTitle({
  icon,
  children,
  action,
}: {
  icon?: ReactNode;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="mb-2 flex items-center justify-between">
      <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-text-muted">
        {icon}
        {children}
      </h2>
      {action}
    </div>
  );
}
