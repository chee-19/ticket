import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, AlertCircle, CheckCircle2 } from 'lucide-react';
import { supabase, Ticket } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { shouldFilterByDepartment } from '../constants/departments';

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

  useEffect(() => {
    if (!standalone || !profile?.department) return;

    let isMounted = true;

    const fetchTickets = async () => {
      setInternalLoading(true);
      setError(null);
      let query = supabase
        .from('tickets')
        .select('*')
        .order('created_at', { ascending: false });

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

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'High':
        return 'bg-red-100 text-red-800';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'Low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Open':
        return <AlertCircle className="w-4 h-4 text-blue-600" />;
      case 'In Progress':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'Resolved':
      case 'Closed':
        return <CheckCircle2 className="w-4 h-4 text-green-600" />;
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
    return (
      <div className="bg-white rounded-xl shadow-lg p-8 text-center">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-8 text-center text-red-600">
        {error}
      </div>
    );
  }

  if (displayTickets.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-8 text-center text-gray-500">
        No tickets found
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gradient-to-r from-blue-50 to-blue-100">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Ticket ID
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Subject
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Category
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Urgency
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Department
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Created
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {displayTickets.map((ticket) => (
              <tr
                key={ticket.id}
                onClick={() => handleRowClick(ticket)}
                className={`hover:bg-blue-50 cursor-pointer transition-colors ${
                  isSLABreached(ticket.sla_deadline, ticket.status) ? 'bg-red-50' : ''
                }`}
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm font-medium text-blue-600">
                    {ticket.ticket_number}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900 font-medium truncate max-w-xs">
                    {ticket.subject}
                  </div>
                  <div className="text-xs text-gray-500">{ticket.name}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm text-gray-700">{ticket.category}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getUrgencyColor(
                      ticket.urgency
                    )}`}
                  >
                    {ticket.urgency}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm text-gray-700">{ticket.department ?? 'Unassigned'}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(ticket.status)}
                    <span className="text-sm text-gray-700">{ticket.status}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDate(ticket.created_at)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
