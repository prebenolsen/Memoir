import { Minus, Plus } from 'lucide-react';

interface Props {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  label?: string;
}

export function Stepper({ value, onChange, min = 0, max = 99, label }: Props) {
  const set = (v: number) => onChange(Math.max(min, Math.min(max, v)));
  return (
    <div className="flex items-center justify-between gap-3">
      {label && <span className="text-[15px] text-text">{label}</span>}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => set(value - 1)}
          className="grid h-9 w-9 place-items-center rounded-full border border-border bg-surface text-text disabled:opacity-40"
          disabled={value <= min}
          aria-label="Decrease"
        >
          <Minus size={18} />
        </button>
        <span className="w-7 text-center text-lg font-semibold tabular-nums">{value}</span>
        <button
          type="button"
          onClick={() => set(value + 1)}
          className="grid h-9 w-9 place-items-center rounded-full bg-primary text-primary-fg disabled:opacity-40"
          disabled={value >= max}
          aria-label="Increase"
        >
          <Plus size={18} />
        </button>
      </div>
    </div>
  );
}
