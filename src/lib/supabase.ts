import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  // Surfaced clearly in dev; in prod the GitHub Action injects these at build.
  // eslint-disable-next-line no-console
  console.error(
    'Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY. Copy .env.example to .env.local and fill it in.',
  );
}

// Fall back to a syntactically valid placeholder so createClient never throws
// when env is unset (e.g. a preview without secrets). Auth/data calls will fail
// gracefully until real credentials are provided.
export const supabase = createClient(url || 'https://placeholder.supabase.co', anonKey || 'public-anon-placeholder', {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});
