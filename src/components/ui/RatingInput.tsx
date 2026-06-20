import { Star, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import type { RatingScale } from '@/types/db';

interface Props {
  /** Stored value on the 1-10 scale, or null. */
  value: number | null;
  onChange: (value: number | null) => void;
  scale: RatingScale;
}

/**
 * Star rating. Always optional/clearable. Internally values are stored on a
 * 1-10 scale; we render `scale` stars (5 or 10) and map back.
 */
export function RatingInput({ value, onChange, scale }: Props) {
  const stars = scale; // number of stars shown
  const selected = value == null ? 0 : Math.round((value / 10) * stars);

  const pick = (i: number) => {
    const stored = Math.round((i / stars) * 10);
    onChange(stored);
  };

  return (
    <div className="flex items-center gap-1">
      <div className="flex flex-wrap gap-0.5">
        {Array.from({ length: stars }, (_, idx) => {
          const i = idx + 1;
          const filled = i <= selected;
          return (
            <button
              key={i}
              type="button"
              onClick={() => pick(i)}
              className="p-0.5"
              aria-label={`Rate ${i} of ${stars}`}
            >
              <Star
                size={scale === 10 ? 20 : 26}
                className={cn(
                  'transition',
                  filled ? 'fill-accent text-accent' : 'text-border',
                )}
              />
            </button>
          );
        })}
      </div>
      {value != null && (
        <button
          type="button"
          onClick={() => onChange(null)}
          className="ml-1 grid h-7 w-7 place-items-center rounded-full text-text-muted hover:bg-surface-alt"
          aria-label="Clear rating"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}

/** Read-only compact rating display, e.g. in lists. */
export function RatingBadge({
  value,
  scale,
}: {
  value: number | null | undefined;
  scale: RatingScale;
}) {
  if (value == null) return null;
  const shown = scale === 5 ? Math.round((value / 10) * 5 * 10) / 10 : Math.round(value * 10) / 10;
  return (
    <span className="inline-flex items-center gap-1 text-sm font-medium text-accent">
      <Star size={14} className="fill-accent text-accent" />
      {shown}
      <span className="text-text-muted">/{scale}</span>
    </span>
  );
}
