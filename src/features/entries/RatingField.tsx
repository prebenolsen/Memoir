import { useSettings } from '@/context/SettingsProvider';
import { RatingInput } from '@/components/ui/RatingInput';
import { cn } from '@/lib/cn';
import type { RatingScale } from '@/types/db';

const SCALES: RatingScale[] = [5, 10];

/**
 * Star rating with an optional inline scale switch (1–5 / 1–10). Switching the
 * scale writes the global setting, so it stays in sync with Profile and across
 * every entry. Pass `showScale={false}` where the toggle already lives on a
 * nearby rating (e.g. the venue rating, which shares the drink rating's scale).
 */
export function RatingField({
  value,
  onChange,
  showScale = true,
}: {
  value: number | null;
  onChange: (value: number | null) => void;
  showScale?: boolean;
}) {
  const { settings, update } = useSettings();
  const scale = settings.rating_scale;

  return (
    <div className="flex items-center justify-between gap-3">
      <RatingInput value={value} onChange={onChange} scale={scale} />
      {showScale && (
        <div className="flex shrink-0 self-start rounded-full bg-surface-alt p-0.5 text-xs font-medium">
          {SCALES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => update({ rating_scale: s })}
              aria-pressed={scale === s}
              className={cn(
                'rounded-full px-2.5 py-1 transition',
                scale === s ? 'bg-primary text-primary-fg' : 'text-text-muted',
              )}
            >
              1–{s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
