import { useState, useEffect } from 'react';
import { supabase, Ticket } from '../lib/supabase';
import { TicketTable } from './TicketTable';
import { TicketDetail } from './TicketDetail';
import { Filter } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import {
  DEPARTMENTS,
  shouldFilterByDepartment,
  type Department,
} from '../constants/departments';

export function Dashboard() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [filteredTickets, setFilteredTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

  const { profile } = useAuth();
  const [filters, setFilters] = useState({
    category: 'all',
    urgency: 'all',
    department: 'all',
    status: 'all',
  });

  useEffect(() => {
    if (profile?.department) {
      fetchTickets(profile.department);
    }
  }, [profile?.department]);

  useEffect(() => {
    if (profile?.department) {
      setFilters((prev) => ({
        ...prev,
        department: shouldFilterByDepartment(profile.department)
          ? profile.department
          : 'all',
      }));
    }
  }, [profile?.department]);

  useEffect(() => {
    applyFilters();
  }, [tickets, filters]);

  const fetchTickets = async (department: Department | null) => {
    try {
      setLoading(true);
      let query = supabase
        .from('tickets')
        .select('*')
        .order('created_at', { ascending: false });

      if (shouldFilterByDepartment(department)) {
        query = query.eq('department', department);
      }

      const { data, error } = await query;

      if (error) throw error;
      setTickets(data || []);
    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...tickets];

    if (filters.category !== 'all') {
      filtered = filtered.filter((t) => t.category === filters.category);
    }
    if (filters.urgency !== 'all') {
      filtered = filtered.filter((t) => t.urgency === filters.urgency);
    }
    if (filters.department !== 'all') {
      filtered = filtered.filter((t) => t.department === filters.department);
    }
    if (filters.status !== 'all') {
      filtered = filtered.filter((t) => t.status === filters.status);
    }

    setFilteredTickets(filtered);
  };

  const handleTicketClick = (ticket: Ticket) => {
    setSelectedTicket(ticket);
  };

  const handleCloseDetail = () => {
    setSelectedTicket(null);
  };

  const handleUpdateTicket = () => {
    if (profile?.department) {
      fetchTickets(profile.department);
    }
  };

  return (
    <div className="space-y-8 text-primary">
      <div className="card p-6">
        <div className="mb-4 flex items-center gap-2">
          <Filter className="h-5 w-5 text-accent" />
          <h3 className="text-lg font-semibold text-primary">Filters</h3>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-secondary">
              Category
            </label>
            <select
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value })}
              className="w-full rounded-lg border border-white/10 bg-elevated/70 px-3 py-2 text-primary placeholder:text-muted focus:border-accent focus:outline-none focus:ring-0"
            >
              <option value="all">All Categories</option>
              <option value="Billing">Billing</option>
              <option value="Bug">Bug</option>
              <option value="Feature Request">Feature Request</option>
              <option value="Abuse Report">Abuse Report</option>
              <option value="General Inquiry">General Inquiry</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-secondary">
              Urgency
            </label>
            <select
              value={filters.urgency}
              onChange={(e) => setFilters({ ...filters, urgency: e.target.value })}
              className="w-full rounded-lg border border-white/10 bg-elevated/70 px-3 py-2 text-primary placeholder:text-muted focus:border-accent focus:outline-none focus:ring-0"
            >
              <option value="all">All Urgencies</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-secondary">
              Department
            </label>
            <select
              value={filters.department}
              onChange={(e) => setFilters({ ...filters, department: e.target.value })}
              className="w-full rounded-lg border border-white/10 bg-elevated/70 px-3 py-2 text-primary placeholder:text-muted focus:border-accent focus:outline-none focus:ring-0"
            >
              <option value="all">All Departments</option>
              {DEPARTMENTS.filter((dept) => dept !== 'All Departments').map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-secondary">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full rounded-lg border border-white/10 bg-elevated/70 px-3 py-2 text-primary placeholder:text-muted focus:border-accent focus:outline-none focus:ring-0"
            >
              <option value="all">All Statuses</option>
              <option value="Open">Open</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
              <option value="Closed">Closed</option>
            </select>
          </div>
        </div>
      </div>

      <TicketTable
        tickets={filteredTickets}
        onTicketClick={handleTicketClick}
        loading={loading}
      />

      {selectedTicket && (
        <TicketDetail
          ticket={selectedTicket}
          onClose={handleCloseDetail}
          onUpdate={handleUpdateTicket}
        />
      )}
    </div>
  );
}
