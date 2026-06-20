import type { ReactNode } from 'react';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/cn';

interface Props {
  title: ReactNode;
  subtitle?: ReactNode;
  right?: ReactNode;
  onClick?: () => void;
  chevron?: boolean;
  leading?: ReactNode;
}

export function ListRow({ title, subtitle, right, onClick, chevron, leading }: Props) {
  const Wrapper = onClick ? 'button' : 'div';
  return (
    <Wrapper
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-3 px-4 py-3 text-left',
        onClick && 'hover:bg-surface-alt active:bg-surface-alt transition',
      )}
    >
      {leading}
      <div className="min-w-0 flex-1">
        <div className="truncate text-[15px] font-medium text-text">{title}</div>
        {subtitle && <div className="truncate text-sm text-text-muted">{subtitle}</div>}
      </div>
      {right}
      {chevron && <ChevronRight size={18} className="shrink-0 text-text-muted" />}
    </Wrapper>
  );
}
