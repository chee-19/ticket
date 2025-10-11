import { useState } from 'react';
import { TicketForm } from './components/TicketForm';
import { Dashboard } from './components/Dashboard';
import { Analytics } from './components/Analytics';
import { LayoutDashboard, PlusCircle, BarChart3, Headphones } from 'lucide-react';

type View = 'submit' | 'dashboard' | 'analytics';

function App() {
  const [currentView, setCurrentView] = useState<View>('submit');

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
                <h1 className="text-xl font-bold text-gray-900">Helpdesk Triage Assistant</h1>
                <p className="text-xs text-gray-500">AI-Powered Support Automation</p>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setCurrentView('submit')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                  currentView === 'submit'
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <PlusCircle className="w-5 h-5" />
                <span className="font-medium">Submit Ticket</span>
              </button>

              <button
                onClick={() => setCurrentView('dashboard')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                  currentView === 'dashboard'
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <LayoutDashboard className="w-5 h-5" />
                <span className="font-medium">Dashboard</span>
              </button>

              <button
                onClick={() => setCurrentView('analytics')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                  currentView === 'analytics'
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <BarChart3 className="w-5 h-5" />
                <span className="font-medium">Analytics</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentView === 'submit' && (
          <div className="flex justify-center">
            <TicketForm onSuccess={() => setCurrentView('dashboard')} />
          </div>
        )}

        {currentView === 'dashboard' && <Dashboard />}

        {currentView === 'analytics' && <Analytics />}
      </main>

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

export default App;
