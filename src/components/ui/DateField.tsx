import { cn } from '@/lib/cn';

interface Props {
  /** Date as YYYY-MM-DD. */
  date: string;
  onDateChange: (iso: string) => void;
  /** Time as HH:mm. Omit (with onTimeChange) to show only the date. */
  time?: string;
  onTimeChange?: (time: string) => void;
  className?: string;
}

const fieldClass =
  'w-full rounded-xl border border-border bg-surface h-11 px-3.5 text-[15px] text-text ' +
  'focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition';

export function DateField({ date, onDateChange, time, onTimeChange, className }: Props) {
  const showTime = time !== undefined && onTimeChange !== undefined;
  return (
    <div className={cn('space-y-2', className)}>
      <input
        type="date"
        value={date}
        onChange={(e) => e.target.value && onDateChange(e.target.value)}
        className={fieldClass}
      />
      {showTime && (
        <input
          type="time"
          value={time}
          onChange={(e) => e.target.value && onTimeChange(e.target.value)}
          className={fieldClass}
          aria-label="Time"
        />
      )}
    </div>
  );
}
