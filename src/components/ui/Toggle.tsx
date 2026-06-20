import { cn } from '@/lib/cn';

export function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative h-7 w-12 shrink-0 rounded-full transition',
        checked ? 'bg-primary' : 'bg-border',
      )}
    >
      <span
        className={cn(
          'absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition',
          checked ? 'left-[22px]' : 'left-0.5',
        )}
      />
    </button>
  );
}
