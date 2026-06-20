import { useState } from 'react';
import { LogIn } from 'lucide-react';
import { useAuth } from '@/context/AuthProvider';
import { Button } from '@/components/ui/Button';
import { Field, Input } from '@/components/ui/Input';

export function LoginScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { error } = await signIn(email.trim(), password);
    if (error) setError(error);
    setBusy(false);
  };

  return (
    <div className="mx-auto flex min-h-full max-w-sm flex-col justify-center px-6 py-12">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-primary text-primary-fg">
          <span className="font-serif text-3xl">M</span>
        </div>
        <h1 className="font-serif text-3xl font-semibold text-text">Memoir</h1>
        <p className="mt-1 text-sm text-text-muted">Your personal experience database</p>
      </div>

      <form onSubmit={submit} className="space-y-4">
        <Field label="Email">
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            placeholder="you@example.com"
            required
          />
        </Field>
        <Field label="Password">
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            placeholder="••••••••"
            required
          />
        </Field>
        {error && <p className="text-sm text-danger">{error}</p>}
        <Button type="submit" block size="lg" disabled={busy}>
          <LogIn size={18} /> {busy ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>

      <p className="mt-6 text-center text-xs text-text-muted">
        Accounts are created by the administrator. Contact them if you need access.
      </p>
    </div>
  );
}
