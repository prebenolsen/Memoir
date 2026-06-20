import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/**
 * Ensure a freshly added user has the rows the app expects:
 * a settings row and a default "Everyday" project. Idempotent.
 */
async function bootstrapUser(userId: string): Promise<void> {
  const { data: settings } = await supabase
    .from('memoir_settings')
    .select('user_id')
    .eq('user_id', userId)
    .maybeSingle();
  if (!settings) {
    await supabase.from('memoir_settings').insert({ user_id: userId });
  }

  const { data: projects } = await supabase
    .from('memoir_projects')
    .select('id')
    .eq('user_id', userId)
    .limit(1);
  if (!projects || projects.length === 0) {
    await supabase
      .from('memoir_projects')
      .insert({ user_id: userId, name: 'Everyday', is_default: true });
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(async ({ data }) => {
      if (!active) return;
      setSession(data.session);
      if (data.session?.user) await bootstrapUser(data.session.user.id).catch(() => {});
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (newSession?.user) void bootstrapUser(newSession.user.id).catch(() => {});
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const signIn: AuthContextValue['signIn'] = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ session, user: session?.user ?? null, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
