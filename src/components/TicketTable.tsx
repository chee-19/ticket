import { type ReactElement, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, AlertCircle, CheckCircle2 } from 'lucide-react';
import { supabase, Ticket } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { shouldFilterByDepartment } from '../constants/departments';
import { statusBadge, urgencyBadge } from '../styles/theme';

interface TicketTableProps {
  tickets?: Ticket[];
  onTicketClick?: (ticket: Ticket) => void;
  loading?: boolean;
}

export function TicketTable({ tickets, onTicketClick, loading }: TicketTableProps) {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [internalTickets, setInternalTickets] = useState<Ticket[]>([]);
  const [internalLoading, setInternalLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const standalone = tickets === undefined;
  const displayTickets = tickets ?? internalTickets;
  const isLoading = loading ?? internalLoading;

  const wrapStandalone = (content: ReactElement) =>
    standalone ? (
      <div className="space-y-6 text-primary">
        <div>
          <h2 className="text-2xl font-semibold text-primary">Open Tickets</h2>
          <p className="text-sm text-secondary">
            Showing active tickets scoped to your department
          </p>
        </div>
        {content}
      </div>
    ) : (
      content
    );

  useEffect(() => {
    if (!standalone || !profile?.department) return;

    let isMounted = true;

    const fetchTickets = async () => {
      setInternalLoading(true);
      setError(null);
      let query = supabase
        .from('tickets')
        .select('*')
        .order('created_at', { ascending: false })
        .in('status', ['Open', 'In Progress']);

      if (shouldFilterByDepartment(profile.department)) {
        query = query.eq('department', profile.department);
      }

      const { data, error: fetchError } = await query;

      if (!isMounted) return;

      if (fetchError) {
        console.error('Error fetching tickets', fetchError);
        setError('Unable to load tickets for your department.');
        setInternalTickets([]);
      } else {
        setInternalTickets(data ?? []);
      }

      setInternalLoading(false);
    };

    fetchTickets();

    return () => {
      isMounted = false;
    };
  }, [standalone, profile?.department]);

  const handleRowClick = (ticket: Ticket) => {
    if (onTicketClick) {
      onTicketClick(ticket);
      return;
    }

    navigate(`/tickets/${ticket.id}`);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Open':
        return <AlertCircle className="h-4 w-4 text-accent" />;
      case 'In Progress':
        return <Clock className="h-4 w-4 text-warning" />;
      case 'Resolved':
      case 'Closed':
        return <CheckCircle2 className="h-4 w-4 text-success" />;
      default:
        return null;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isSLABreached = (deadline: string, status: string) => {
    if (status === 'Resolved' || status === 'Closed') return false;
    return new Date(deadline) < new Date();
  };

  if (isLoading) {
    return wrapStandalone(
      <div className="card p-8 text-center text-secondary">
        <div className="animate-pulse space-y-4">
          <div className="mx-auto h-4 w-3/4 rounded bg-white/10"></div>
          <div className="mx-auto h-4 w-1/2 rounded bg-white/10"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return wrapStandalone(
      <div className="card p-8 text-center text-danger">
        {error}
      </div>
    );
  }

  if (displayTickets.length === 0) {
    return wrapStandalone(
      <div className="card p-8 text-center text-secondary">
        No tickets found
      </div>
    );
  }

  const tableContent = (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-white/5 text-secondary">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">
                Ticket ID
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">
                Subject
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">
                Category
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">
                Urgency
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">
                Department
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">
                Created
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {displayTickets.map((ticket) => (
              <tr
                key={ticket.id}
                onClick={() => handleRowClick(ticket)}
                className={`cursor-pointer transition-colors hover:bg-white/5 ${
                  isSLABreached(ticket.sla_deadline, ticket.status) ? 'bg-danger/10' : ''
                }`}
              >
                <td className="whitespace-nowrap px-6 py-4">
                  <span className="text-sm font-semibold text-accent">
                    {ticket.ticket_number}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="max-w-xs truncate text-sm font-medium text-primary">
                    {ticket.subject}
                  </div>
                  <div className="text-xs text-secondary">{ticket.name}</div>
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  <span className="text-sm text-secondary">{ticket.category}</span>
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  <span className={urgencyBadge(ticket.urgency)}>{ticket.urgency}</span>
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  <span className="text-sm text-secondary">{ticket.department ?? 'Unassigned'}</span>
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(ticket.status)}
                    <span className={statusBadge(ticket.status)}>{ticket.status}</span>
                  </div>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-secondary">
                  {formatDate(ticket.created_at)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return wrapStandalone(tableContent);
}
