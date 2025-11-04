import type { ReactNode } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { Headphones, LogIn } from 'lucide-react';
import { TicketForm } from './components/TicketForm';
import { Dashboard } from './components/Dashboard';
import { Analytics } from './components/Analytics';
import { TicketTable } from './components/TicketTable';
import { TicketDetail } from './components/TicketDetail';
import { ProtectedRoute } from './components/ProtectedRoute';
import Login from './pages/Login';
import { buttonGhost } from './styles/theme';

function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-app bg-app-gradient text-primary">
      <nav className="bg-surface/80 backdrop-blur border-b border-white/5">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-gradient-to-br from-accent/60 to-accent-strong/80 p-2 shadow-glow">
              <Headphones className="h-6 w-6 text-app" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-primary">Helpdesk Assistant</h1>
              <p className="text-xs text-secondary">AI-Powered Support Automation</p>
            </div>
          </div>

          <Link to="/login" className={buttonGhost}>
            <LogIn className="h-5 w-5" />
            <span className="font-medium">Staff Login</span>
          </Link>
        </div>
      </nav>

      <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">{children}</main>

      <footer className="border-t border-white/5 bg-surface/80 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 py-6 text-center text-sm text-secondary">
          Helpdesk Triage Assistant - Powered by AI | Automate Your Support
        </div>
      </footer>
    </div>
  );
}

function PublicHome() {
  return (
    <PublicLayout>
      <div className="flex justify-center">
        <TicketForm />
      </div>
    </PublicLayout>
  );
}

export default function App() {
  const location = useLocation();

  return (
    <Routes location={location}>
      <Route path="/" element={<PublicHome />} />
      <Route path="/login" element={<Login />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/tickets"
        element={
          <ProtectedRoute>
            <TicketTable />
          </ProtectedRoute>
        }
      />
      <Route
        path="/tickets/:id"
        element={
          <ProtectedRoute>
            <TicketDetail />
          </ProtectedRoute>
        }
      />
      <Route
        path="/analytics"
        element={
          <ProtectedRoute>
            <Analytics />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
