import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

/** A current row from the `memoir_currencies_current` view. */
export interface CurrencyRow {
  code: string;
  name: string;
  symbol: string;
  symbol_before: boolean;
  /** How many NOK = 1 unit of this currency (NOK itself = 1). */
  rate_to_nok: number;
}

/**
 * Fallback list used before the currencies table is provisioned (mirrors the
 * seed in supabase/migrations/0002_currencies.sql) so the picker always works,
 * even on a database that hasn't run that migration yet.
 */
const FALLBACK: CurrencyRow[] = [
  { code: 'NOK', name: 'Norwegian krone', symbol: 'kr', symbol_before: false, rate_to_nok: 1 },
  { code: 'EUR', name: 'Euro', symbol: '€', symbol_before: true, rate_to_nok: 11.5 },
  { code: 'USD', name: 'US dollar', symbol: '$', symbol_before: true, rate_to_nok: 10.5 },
];

/**
 * The currencies offered when creating a project. Reads the current rates from
 * the shared reference table; falls back to the built-in three if that table
 * isn't available yet. Rates change rarely, so this is cached for an hour.
 */
export function useCurrencies() {
  const query = useQuery({
    queryKey: ['currencies'],
    staleTime: 1000 * 60 * 60,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('memoir_currencies_current')
        .select('code, name, symbol, symbol_before, rate_to_nok')
        .order('code');
      if (error) throw error;
      return data as CurrencyRow[];
    },
  });

  const currencies = query.data && query.data.length > 0 ? query.data : FALLBACK;
  return { currencies, loading: query.isLoading };
}
