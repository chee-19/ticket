import { FormEvent, useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { LogIn, Mail, Lock, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white shadow-xl rounded-2xl p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-3 rounded-xl">
              <LogIn className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Staff Login</h1>
              <p className="text-sm text-gray-500">Access your department workspace</p>
            </div>
          </div>

          {formError && (
            <div className="flex items-start gap-2 mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <AlertCircle className="w-4 h-4 mt-0.5" />
              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="email">
                Email address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  autoComplete="email"
                  className="w-full rounded-lg border border-gray-300 pl-10 pr-4 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                  placeholder="agent@example.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="password">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  autoComplete="current-password"
                  className="w-full rounded-lg border border-gray-300 pl-10 pr-4 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full flex justify-center items-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 py-2.5 text-white font-semibold shadow-lg hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-50"
            >
              <span>{submitting ? 'Signing in...' : 'Sign in'}</span>
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          Need access? Contact your administrator to be added to the correct department.
        </p>
      </div>
    </div>
  );
}
