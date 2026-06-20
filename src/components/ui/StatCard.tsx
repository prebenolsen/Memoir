import type { ReactNode } from 'react';
import { Card } from './Card';

export function StatCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: ReactNode;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <Card className="p-3.5">
      <p className="text-xs font-medium uppercase tracking-wide text-text-muted">{label}</p>
      <p className={`mt-1 text-2xl font-serif font-semibold ${accent ? 'text-accent' : 'text-text'}`}>
        {value}
      </p>
      {sub && <p className="mt-0.5 text-xs text-text-muted">{sub}</p>}
    </Card>
  );
}
