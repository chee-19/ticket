import { ReactNode } from 'react';
import { Navigate, useLocation, useNavigate, Link } from 'react-router-dom';
import { LogOut, LayoutDashboard, Table2, BarChart3, Headphones } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { buttonGhost } from '../styles/theme';

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { loading, session, profile } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-app bg-app-gradient text-secondary">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-accent/30 border-t-accent" />
          <p className="text-sm">Loading secure workspace...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  if (!profile?.department) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-app bg-app-gradient text-secondary">
        <div className="card max-w-md p-8 text-center">
          <h2 className="mb-3 text-xl font-semibold text-primary">Access Restricted</h2>
          <p className="text-secondary">
            No department assigned. Ask an admin to set your department in Supabase → profiles.
          </p>
        </div>
      </div>
    );
  }

  return <StaffLayout>{children}</StaffLayout>;
}

function StaffLayout({ children }: { children: ReactNode }) {
  const { profile, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
    { label: 'Open Tickets', to: '/tickets', icon: Table2 },
    { label: 'Analytics', to: '/analytics', icon: BarChart3 },
  ];

  const handleLogout = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  const departmentLabel = profile?.department
    ? profile.department === 'All Departments'
      ? 'All Departments Workspace'
      : `${profile.department} Department Workspace`
    : 'Department Workspace';

  return (
    <div className="min-h-screen bg-app bg-app-gradient text-primary">
      <nav className="border-b border-white/5 bg-surface/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-gradient-to-br from-accent/60 to-accent-strong/80 p-2 shadow-glow">
              <Headphones className="h-6 w-6 text-app" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-primary">Helpdesk Assistant</h1>
              <p className="text-xs text-secondary">{departmentLabel}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {navItems.map(({ label, to, icon: Icon }) => {
              const active = location.pathname.startsWith(to);
              return (
                <Link
                  key={to}
                  to={to}
                  className={`flex items-center gap-2 rounded-lg px-4 py-2 transition-colors ${
                    active
                      ? 'bg-elevated text-primary shadow-glow'
                      : 'text-secondary hover:bg-white/5 hover:text-primary'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{label}</span>
                </Link>
              );
            })}

            <button onClick={handleLogout} className={buttonGhost}>
              <LogOut className="h-5 w-5" />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">{children}</main>

      <footer className="border-t border-white/5 bg-surface/80 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 py-6 text-center text-sm text-secondary">
          Helpdesk Triage Assistant - Secure Staff Workspace
        </div>
      </footer>
    </div>
  );
}
