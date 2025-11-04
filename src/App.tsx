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

function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <nav className="bg-white shadow-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-2 rounded-lg">
                <Headphones className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Helpdesk Assistant</h1>
                <p className="text-xs text-gray-500">AI-Powered Support Automation</p>
              </div>
            </div>

            <Link
              to="/login"
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <LogIn className="w-5 h-5" />
              <span className="font-medium">Staff Login</span>
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">{children}</main>

      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-gray-500 text-sm">
            Helpdesk Triage Assistant - Powered by AI | Automate Your Support
          </p>
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
