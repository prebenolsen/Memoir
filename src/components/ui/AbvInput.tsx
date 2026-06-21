import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronsUpDown, X } from 'lucide-react';
import { formatAbv, parseDecimal } from '@/lib/format';

interface Props {
  value: number | null;
  onChange: (value: number | null) => void;
  /** Where the wheel starts when no value is set yet (e.g. 12.5 wine, 4.7 beer). */
  defaultValue: number;
  min?: number;
  max?: number;
}

const STEP = 0.1;
const ITEM_H = 40; // px, must match the rendered row height
const PAD_ROWS = 2; // spacer rows so the first/last value can sit centred

const round1 = (v: number) => Math.round(v * 10) / 10;

/**
 * Optional ABV (%) entry with two interchangeable modes:
 *  - "type": a numeric-keyboard text field accepting both "," and "." decimals.
 *  - "wheel": an iOS-style scroll wheel for dialing the percentage in 0.1 steps.
 * The value is always held as a JS number, so it serialises to the DB with ".".
 */
export function AbvInput({ value, onChange, defaultValue, min = 0, max = 70 }: Props) {
  const [mode, setMode] = useState<'type' | 'wheel'>('type');
  const [text, setText] = useState(value == null ? '' : formatAbv(value));

  useEffect(() => {
    setText(value == null ? '' : formatAbv(value));
  }, [value]);

  const handleText = (raw: string) => {
    setText(raw);
    onChange(parseDecimal(raw));
  };

  const openWheel = () => {
    // Entering the wheel: seed it at the type's default when empty.
    if (value == null) onChange(round1(defaultValue));
    setMode('wheel');
  };

  const clear = () => {
    onChange(null);
    setText('');
  };

  return (
    <div className="rounded-xl border border-border bg-surface-alt/50 p-3.5">
      <div className="flex items-center gap-2">
        {mode === 'type' ? (
          <div className="relative flex-1">
            <input
              inputMode="decimal"
              value={text}
              onChange={(e) => handleText(e.target.value)}
              placeholder={formatAbv(defaultValue)}
              aria-label="ABV percent"
              className="w-full rounded-xl border border-border bg-surface h-11 pl-3 pr-8 text-[15px] text-text placeholder:text-text-muted/70 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition tabular-nums"
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-text-muted">
              %
            </span>
          </div>
        ) : (
          <div className="flex-1 text-center text-lg font-semibold tabular-nums text-text">
            {formatAbv(value ?? defaultValue)}
            <span className="ml-0.5 text-text-muted">%</span>
          </div>
        )}

        {mode === 'wheel' ? (
          <button
            type="button"
            onClick={() => setMode('type')}
            aria-label="Confirm ABV"
            className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary text-primary-fg shadow-sm"
          >
            <Check size={18} />
          </button>
        ) : (
          <>
            {value != null && (
              <button
                type="button"
                onClick={clear}
                aria-label="Clear ABV"
                className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-border bg-surface text-text-muted hover:text-text"
              >
                <X size={18} />
              </button>
            )}
            <button
              type="button"
              onClick={openWheel}
              aria-label="Use scroll wheel"
              className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-border bg-surface text-text-muted hover:text-text"
            >
              <ChevronsUpDown size={18} />
            </button>
          </>
        )}
      </div>

      {mode === 'wheel' && (
        <Wheel value={value ?? defaultValue} onChange={(v) => onChange(v)} min={min} max={max} />
      )}
    </div>
  );
}

function Wheel({
  value,
  onChange,
  min,
  max,
}: {
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const count = Math.round((max - min) / STEP) + 1;

  const items = useMemo(
    () => Array.from({ length: count }, (_, i) => round1(min + i * STEP)),
    [count, min],
  );

  const indexFor = (v: number) => Math.max(0, Math.min(count - 1, Math.round((v - min) / STEP)));

  // Centre the current value when the wheel first appears.
  useEffect(() => {
    if (ref.current) ref.current.scrollTop = indexFor(value) * ITEM_H;
    // Only on mount; subsequent updates come from the user scrolling.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleScroll = () => {
    if (!ref.current) return;
    const idx = Math.round(ref.current.scrollTop / ITEM_H);
    const v = round1(items[Math.max(0, Math.min(count - 1, idx))]);
    if (v !== value) onChange(v);
  };

  return (
    <div className="relative mt-3" style={{ height: ITEM_H * 5 }}>
      {/* Centre selection band */}
      <div
        className="pointer-events-none absolute inset-x-2 z-10 rounded-lg border-y border-primary/40 bg-primary/5"
        style={{ top: ITEM_H * 2, height: ITEM_H }}
      />
      <div
        ref={ref}
        onScroll={handleScroll}
        className="h-full overflow-y-auto no-scrollbar snap-y snap-mandatory"
      >
        <div style={{ height: ITEM_H * PAD_ROWS }} />
        {items.map((v) => (
          <div
            key={v}
            className="snap-center flex items-center justify-center text-[15px] tabular-nums text-text"
            style={{ height: ITEM_H }}
          >
            {formatAbv(v)}%
          </div>
        ))}
        <div style={{ height: ITEM_H * PAD_ROWS }} />
      </div>
    </div>
  );
}
