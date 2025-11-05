import { FormEvent, useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { LogIn, Mail, Lock, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { buttonPrimary } from '../styles/theme';

export default function Login() {
  const { signIn, session, loading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!loading && session) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setFormError(null);

    const { error } = await signIn(email.trim(), password);

    if (error) {
      setFormError(error.message);
      setSubmitting(false);
      return;
    }

    navigate('/dashboard', { replace: true });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-app bg-app-gradient px-4 text-primary">
      <div className="w-full max-w-md space-y-6">
        <div className="card p-8">
          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-xl bg-gradient-to-br from-accent/60 to-accent-strong/80 p-3 shadow-glow">
              <LogIn className="h-7 w-7 text-app" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-primary">Staff Login</h1>
              <p className="text-sm text-secondary">Access your department workspace</p>
            </div>
          </div>

          {formError && (
            <div className="mb-4 flex items-start gap-2 rounded-lg border border-danger/30 bg-danger/10 p-3 text-sm text-danger">
              <AlertCircle className="mt-0.5 h-4 w-4" />
              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-medium text-secondary" htmlFor="email">
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-secondary" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  autoComplete="email"
                  className="w-full rounded-lg border border-white/10 bg-elevated/70 py-2 pl-10 pr-4 text-primary placeholder:text-muted focus:border-accent focus:outline-none focus:ring-0"
                  placeholder="agent@example.com"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-secondary" htmlFor="password">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-secondary" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  autoComplete="current-password"
                  className="w-full rounded-lg border border-white/10 bg-elevated/70 py-2 pl-10 pr-4 text-primary placeholder:text-muted focus:border-accent focus:outline-none focus:ring-0"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button type="submit" disabled={submitting} className={`${buttonPrimary} flex w-full`}>
              <span>{submitting ? 'Signing in...' : 'Sign in'}</span>
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-secondary">
          Need access? Contact your administrator to be added to the correct department.
        </p>

        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => navigate('/', { replace: true })}
            className={buttonPrimary}
          >
            ← Back to Support Ticket
          </button>
        </div>
      </div>
    </div>
  );
}
