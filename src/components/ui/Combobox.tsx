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
  /**
   * Built-in name suggestions shown alongside the user's saved items (e.g. common
   * cocktails). Picking one behaves like typing it: the item is resolved/created
   * at save time, so users are never restricted to this list.
   */
  suggestions?: string[];
  /**
   * When true, the built-in `suggestions` are pinned to the top of the list,
   * above the user's saved items (used for the beer/wine default names). When
   * false (default) they appear after saved items (used for cocktails).
   */
  pinSuggestions?: boolean;
  /**
   * Column equality filters applied to the saved-item query, e.g.
   * `{ drink_type: 'beer' }` so only beers are suggested. Each entry is matched
   * with `.eq`; null values are ignored.
   */
  match?: Record<string, string | null>;
}

interface Row {
  id: string | null;
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
  suggestions,
  pinSuggestions = false,
  match,
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
  // Stable filter entries (ignoring null values) used in the query and its key.
  const matchEntries = Object.entries(match ?? {}).filter(
    (e): e is [string, string] => e[1] != null,
  );
  const { data: results = [] } = useQuery({
    queryKey: ['combo', table, q, matchEntries],
    enabled: open,
    staleTime: 10_000,
    queryFn: async () => {
      let query = supabase.from(table).select('id, name').order('name').limit(8);
      if (q) query = query.ilike('name', `%${q}%`);
      for (const [col, val] of matchEntries) query = query.eq(col, val);
      const { data, error } = await query;
      if (error) throw error;
      return data as Row[];
    },
  });

  // Merge saved items with built-in suggestions (deduped by name); seeds carry a
  // null id so they resolve/create at save time like any freshly typed name.
  const ql = q.toLowerCase();
  const savedNames = new Set(results.map((r) => r.name.toLowerCase()));
  const seedRows: Row[] = (suggestions ?? [])
    .filter((s) => !savedNames.has(s.toLowerCase()) && (!q || s.toLowerCase().includes(ql)))
    .map((s) => ({ id: null, name: s }));
  // Pinned seeds lead the list (beer/wine defaults); otherwise they trail it.
  const options: Row[] = (
    pinSuggestions ? [...seedRows, ...results] : [...results, ...seedRows]
  ).slice(0, 8);

  const exactExists = options.some((r) => r.name.toLowerCase() === ql);
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

      {open && (options.length > 0 || showCreate) && (
        <div className="absolute z-30 mt-1 w-full overflow-hidden rounded-xl border border-border bg-surface shadow-soft">
          {options.map((row) => (
            <button
              key={row.id ?? `seed:${row.name}`}
              type="button"
              onClick={() => choose(row)}
              className="flex w-full items-center justify-between px-3.5 py-2.5 text-left text-[15px] hover:bg-surface-alt"
            >
              <span className="truncate">{row.name}</span>
              {value?.name.toLowerCase() === row.name.toLowerCase() && (
                <Check size={16} className="text-primary" />
              )}
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
                options.length > 0 && 'border-t border-border',
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
