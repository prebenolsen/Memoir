import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

/**
 * Give a freshly added user a username derived from the local part of their
 * email (everything before "@"). If that's already taken, fall back to their
 * full email. Idempotent: skips users who already have a profile row.
 */
async function bootstrapProfile(user: User): Promise<void> {
  const { data: profile } = await supabase
    .from('memoir_profiles')
    .select('user_id')
    .eq('user_id', user.id)
    .maybeSingle();
  if (profile) return;

  const email = user.email ?? '';
  const localPart = email.split('@')[0];
  const candidates = [localPart, email].filter((c) => c.length > 0);

  for (const username of candidates) {
    const { error } = await supabase
      .from('memoir_profiles')
      .insert({ user_id: user.id, username });
    // 23505 = unique violation on lower(username); try the next candidate.
    if (!error) return;
    if (error.code !== '23505') return;
  }
}

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/**
 * Ensure a freshly added user has the rows the app expects:
 * a settings row and a default "Everyday" project. Idempotent.
 */
async function bootstrapUser(user: User): Promise<void> {
  const userId = user.id;
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
      .insert({ user_id: userId, name: 'Everyday Life', is_default: true });
  }

  await bootstrapProfile(user);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(async ({ data }) => {
      if (!active) return;
      setSession(data.session);
      if (data.session?.user) await bootstrapUser(data.session.user).catch(() => {});
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (newSession?.user) void bootstrapUser(newSession.user).catch(() => {});
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

  const signUp: AuthContextValue['signUp'] = async (email, password) => {
    const { error } = await supabase.auth.signUp({ email, password });
    return { error: error?.message ?? null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ session, user: session?.user ?? null, loading, signIn, signUp, signOut }}>
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
