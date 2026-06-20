import { createContext, useContext, useEffect, useMemo, type ReactNode } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthProvider';
import type { Settings } from '@/types/db';

interface SettingsContextValue {
  settings: Settings;
  loading: boolean;
  update: (patch: Partial<Settings>) => Promise<void>;
}

const DEFAULTS: Settings = {
  user_id: '',
  date_format: 'DD.MM.YYYY',
  currency: 'NOK',
  rating_scale: 10,
  first_day_of_week: 'monday',
  theme: 'system',
  remember_last_project: true,
  remember_last_date: true,
  confirm_before_delete: true,
  last_project_id: null,
  last_date: null,
  created_at: '',
};

const SettingsContext = createContext<SettingsContextValue | undefined>(undefined);

function applyTheme(theme: Settings['theme']) {
  const root = document.documentElement;
  const prefersDark =
    window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const dark = theme === 'dark' || (theme === 'system' && prefersDark);
  root.classList.toggle('dark', dark);
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['settings', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('memoir_settings')
        .select('*')
        .eq('user_id', user!.id)
        .maybeSingle();
      if (error) throw error;
      return (data as Settings | null) ?? { ...DEFAULTS, user_id: user!.id };
    },
  });

  const settings = data ?? DEFAULTS;

  const mutation = useMutation({
    mutationFn: async (patch: Partial<Settings>) => {
      const { error } = await supabase
        .from('memoir_settings')
        .upsert({ user_id: user!.id, ...patch }, { onConflict: 'user_id' });
      if (error) throw error;
    },
    onMutate: async (patch) => {
      await qc.cancelQueries({ queryKey: ['settings', user?.id] });
      const prev = qc.getQueryData<Settings>(['settings', user?.id]);
      qc.setQueryData<Settings>(['settings', user?.id], (old) => ({
        ...(old ?? DEFAULTS),
        ...patch,
      }));
      return { prev };
    },
    onError: (_e, _patch, ctx) => {
      if (ctx?.prev) qc.setQueryData(['settings', user?.id], ctx.prev);
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: ['settings', user?.id] });
    },
  });

  // Apply theme whenever it changes, and react to OS theme when set to system.
  useEffect(() => {
    applyTheme(settings.theme);
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => settings.theme === 'system' && applyTheme('system');
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [settings.theme]);

  const value = useMemo<SettingsContextValue>(
    () => ({
      settings,
      loading: isLoading,
      update: (patch) => mutation.mutateAsync(patch),
    }),
    [settings, isLoading, mutation],
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
}
