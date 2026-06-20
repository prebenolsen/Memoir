import type { LucideIcon } from 'lucide-react';

export function EmptyState({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
      <div className="grid h-14 w-14 place-items-center rounded-2xl bg-surface-alt text-text-muted">
        <Icon size={26} />
      </div>
      <p className="font-medium text-text">{title}</p>
      {subtitle && <p className="max-w-[18rem] text-sm text-text-muted">{subtitle}</p>}
    </div>
  );
}
