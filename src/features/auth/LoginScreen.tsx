import { useState } from 'react';
import { ArrowLeft, LogIn, Mail, UserPlus } from 'lucide-react';
import { useAuth } from '@/context/AuthProvider';
import { Button } from '@/components/ui/Button';
import { Field, Input } from '@/components/ui/Input';

type Mode = 'signin' | 'signup' | 'check-email';

const Logo = () => (
  <div className="mb-8 text-center">
    <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-primary text-primary-fg">
      <span className="font-serif text-3xl">M</span>
    </div>
    <h1 className="font-serif text-3xl font-semibold text-text">Memoir</h1>
    <p className="mt-1 text-sm text-text-muted">Your personal experience database</p>
  </div>
);

export function LoginScreen() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const goTo = (next: Mode) => {
    setError(null);
    setPassword('');
    setConfirmPassword('');
    setMode(next);
  };

  const submitSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { error } = await signIn(email.trim(), password);
    if (error) setError(error);
    setBusy(false);
  };

  const submitSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setBusy(true);
    setError(null);
    const { error } = await signUp(email.trim(), password);
    if (error) {
      setError(error);
    } else {
      setMode('check-email');
    }
    setBusy(false);
  };

  return (
    <div className="mx-auto flex min-h-full max-w-sm flex-col justify-center px-6 py-12">
      {mode === 'signin' && (
        <>
          <Logo />
          <form onSubmit={submitSignIn} className="space-y-4">
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
              <LogIn size={18} />
              {busy ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>

          <div className="mt-8 space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-border" />
              <span className="text-xs text-text-muted">New to Memoir?</span>
              <div className="h-px flex-1 bg-border" />
            </div>
            <Button block variant="secondary" onClick={() => goTo('signup')}>
              <UserPlus size={18} />
              Create account
            </Button>
          </div>
        </>
      )}

      {mode === 'signup' && (
        <>
          <button
            type="button"
            onClick={() => goTo('signin')}
            className="mb-6 flex items-center gap-1.5 self-start text-sm text-text-muted hover:text-text transition"
          >
            <ArrowLeft size={15} />
            Back to sign in
          </button>

          <div className="mb-8">
            <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-primary text-primary-fg">
              <span className="font-serif text-3xl">M</span>
            </div>
            <h2 className="font-serif text-3xl font-semibold text-text">Create account</h2>
            <p className="mt-1 text-sm text-text-muted">
              Start tracking your personal experiences.
            </p>
          </div>

          <form onSubmit={submitSignUp} className="space-y-4">
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
                autoComplete="new-password"
                placeholder="••••••••"
                required
              />
            </Field>
            <Field label="Confirm password">
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                placeholder="••••••••"
                required
              />
            </Field>
            {error && <p className="text-sm text-danger">{error}</p>}
            <Button type="submit" block size="lg" disabled={busy}>
              <UserPlus size={18} />
              {busy ? 'Creating account…' : 'Create account'}
            </Button>
          </form>
        </>
      )}

      {mode === 'check-email' && (
        <div className="flex flex-col items-center gap-6 text-center">
          <div className="grid h-20 w-20 place-items-center rounded-2xl bg-primary/10 text-primary">
            <Mail size={36} />
          </div>
          <div className="space-y-2">
            <h2 className="font-serif text-2xl font-semibold text-text">Check your email</h2>
            <p className="text-sm text-text-muted">
              We sent a confirmation link to{' '}
              <span className="font-medium text-text">{email}</span>.
            </p>
            <p className="text-sm text-text-muted">
              Click the link to activate your account, then come back here to sign in.
            </p>
          </div>
          <Button block variant="secondary" onClick={() => goTo('signin')}>
            <LogIn size={18} />
            Back to sign in
          </Button>
        </div>
      )}
    </div>
  );
}
