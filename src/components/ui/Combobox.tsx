import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Check, Plus, Search } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/cn';

export interface ComboValue {
  /** Existing item id, or null when this is a new (not-yet-created) name. */
  id: string | null;
  name: string;
}

interface Props {
  /** Item table to search, e.g. 'memoir_food_items'. */
  table: string;
  value: ComboValue | null;
  onChange: (value: ComboValue | null) => void;
  placeholder?: string;
  /** Allow offering "create new". Defaults to true. */
  allowCreate?: boolean;
  autoFocus?: boolean;
}

interface Row {
  id: string;
  name: string;
}

/**
 * Autocomplete over a reusable item table with create-on-the-fly.
 * Selecting a suggestion sets {id, name}. Typing a fresh name yields
 * {id: null, name}; the consuming form resolves/creates the item at save time
 * (see resolveItem in hooks/useItems), keeping data entry to a single tap.
 */
export function Combobox({
  table,
  value,
  onChange,
  placeholder,
  allowCreate = true,
  autoFocus,
}: Props) {
  const [text, setText] = useState(value?.name ?? '');
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setText(value?.name ?? '');
  }, [value?.name]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const q = text.trim();
  const { data: results = [] } = useQuery({
    queryKey: ['combo', table, q],
    enabled: open,
    staleTime: 10_000,
    queryFn: async () => {
      let query = supabase.from(table).select('id, name').order('name').limit(8);
      if (q) query = query.ilike('name', `%${q}%`);
      const { data, error } = await query;
      if (error) throw error;
      return data as Row[];
    },
  });

  const exactExists = results.some((r) => r.name.toLowerCase() === q.toLowerCase());
  const showCreate = allowCreate && q.length > 0 && !exactExists;

  const choose = (row: Row) => {
    onChange({ id: row.id, name: row.name });
    setText(row.name);
    setOpen(false);
  };

  const handleType = (v: string) => {
    setText(v);
    setOpen(true);
    // Typing detaches from any selected id; resolved at save time.
    onChange(v.trim() ? { id: null, name: v } : null);
  };

  return (
    <div className="relative" ref={ref}>
      <div className="relative">
        <Search
          size={16}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
        />
        <input
          value={text}
          autoFocus={autoFocus}
          onChange={(e) => handleType(e.target.value)}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          className="w-full rounded-xl border border-border bg-surface h-11 pl-9 pr-3 text-[15px] text-text placeholder:text-text-muted/70 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
        />
      </div>

      {open && (results.length > 0 || showCreate) && (
        <div className="absolute z-30 mt-1 w-full overflow-hidden rounded-xl border border-border bg-surface shadow-soft">
          {results.map((row) => (
            <button
              key={row.id}
              type="button"
              onClick={() => choose(row)}
              className="flex w-full items-center justify-between px-3.5 py-2.5 text-left text-[15px] hover:bg-surface-alt"
            >
              <span className="truncate">{row.name}</span>
              {value?.id === row.id && <Check size={16} className="text-primary" />}
            </button>
          ))}
          {showCreate && (
            <button
              type="button"
              onClick={() => {
                onChange({ id: null, name: q });
                setText(q);
                setOpen(false);
              }}
              className={cn(
                'flex w-full items-center gap-2 px-3.5 py-2.5 text-left text-[15px] text-primary hover:bg-surface-alt',
                results.length > 0 && 'border-t border-border',
              )}
            >
              <Plus size={16} />
              Create &ldquo;{q}&rdquo;
            </button>
          )}
        </div>
      )}
    </div>
  );
}
