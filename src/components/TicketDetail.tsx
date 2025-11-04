import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Ticket, supabase } from '../lib/supabase';
import {
  X,
  Clock,
  User,
  Mail,
  Calendar,
  AlertTriangle,
  Copy,
  Check,
  ArrowLeft,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { shouldFilterByDepartment } from '../constants/departments';
import Modal from './Modal';

interface TicketDetailProps {
  ticket?: Ticket;
  onClose?: () => void;
  onUpdate?: () => void;
}

export function TicketDetail({ ticket, onClose, onUpdate }: TicketDetailProps) {
  const params = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();

  const [currentTicket, setCurrentTicket] = useState<Ticket | null>(ticket ?? null);
  const [status, setStatus] = useState(ticket?.status ?? 'Open');
  const [assignedAgent, setAssignedAgent] = useState(ticket?.assigned_agent ?? '');
  const [updating, setUpdating] = useState(false);
  const [updated, setUpdated] = useState(false);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(!ticket);
  const [error, setError] = useState<string | null>(null);

  const standalone = !ticket;
  const isModal = typeof onClose === 'function';
  const handleReturn = () => {
    if (isModal) {
      onClose?.();
    } else {
      navigate('/tickets');
    }
  };

  useEffect(() => {
    if (!ticket) return;
    setCurrentTicket(ticket);
    setStatus(ticket.status);
    setAssignedAgent(ticket.assigned_agent ?? '');
    setUpdated(false);
    setLoading(false);
  }, [ticket]);

  useEffect(() => {
    setUpdated(false);
  }, [status, assignedAgent]);

  useEffect(() => {
    if (!standalone || !params.id || !profile?.department) return;

    let isMounted = true;

    const fetchTicket = async () => {
      setLoading(true);
      setError(null);
      let query = supabase
        .from('tickets')
        .select('*')
        .eq('id', params.id);

      if (shouldFilterByDepartment(profile.department)) {
        query = query.eq('department', profile.department);
      }

      const { data, error: fetchError } = await query.maybeSingle();

      if (!isMounted) return;

      if (fetchError || !data) {
        console.error('Error fetching ticket', fetchError);
        setCurrentTicket(null);
        setError('Ticket not found or you do not have access.');
      } else {
        setCurrentTicket(data);
        setStatus(data.status);
        setAssignedAgent(data.assigned_agent ?? '');
        setUpdated(false);
      }

      setLoading(false);
    };

    fetchTicket();

    return () => {
      isMounted = false;
    };
  }, [standalone, params.id, profile?.department]);

  const attachmentUrls = useMemo(() => {
    if (!currentTicket?.attachment_url) return [] as string[];
    const raw = currentTicket.attachment_url;
    if (Array.isArray(raw)) return raw;

    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.filter((value): value is string => typeof value === 'string');
      }
    } catch (error) {
      console.warn('Failed to parse attachment_url, falling back to raw string', error);
    }

    return [raw];
  }, [currentTicket?.attachment_url]);

  const handleUpdate = async () => {
    if (!currentTicket) return;
    setUpdating(true);
    setUpdated(false);
    try {
      const updates: Partial<Ticket> & { resolved_at?: string | null } = {
        status,
        assigned_agent: assignedAgent || null,
      };

      if (status === 'Resolved' || status === 'Closed') {
        updates.resolved_at = new Date().toISOString();
      } else if (currentTicket.resolved_at) {
        updates.resolved_at = null;
      }

      const { error: updateError } = await supabase
        .from('tickets')
        .update(updates)
        .eq('id', currentTicket.id);

      if (updateError) throw updateError;

      onUpdate?.();

      setCurrentTicket((prev) =>
        prev
          ? {
              ...prev,
              status,
              assigned_agent: assignedAgent || null,
              resolved_at:
                status === 'Resolved' || status === 'Closed'
                  ? updates.resolved_at ?? prev.resolved_at
                  : null,
            }
          : prev
      );

      setUpdated(true);
    } catch (error) {
      console.error('Error updating ticket:', error);
    } finally {
      setUpdating(false);
    }
  };

  const handleCopyReply = () => {
    if (currentTicket?.ai_suggested_reply) {
      navigator.clipboard.writeText(currentTicket.ai_suggested_reply);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isSLABreached = () => {
    if (!currentTicket) return false;
    if (currentTicket.status === 'Resolved' || currentTicket.status === 'Closed') return false;
    return new Date(currentTicket.sla_deadline) < new Date();
  };

  const loadingContent = (
    <div className="min-h-[50vh] flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
    </div>
  );

  const errorContent = (
    <div className="bg-white rounded-xl shadow-lg p-8 text-center text-red-600">
      {error}
      <div className="mt-4">
        <button
          onClick={handleReturn}
          className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          Return to tickets
        </button>
      </div>
    </div>
  );

  const detailContent = currentTicket ? (
    <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full">
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 flex justify-between items-start rounded-t-xl">
        <div>
          <h2 className="text-2xl font-bold mb-1">{currentTicket.ticket_number}</h2>
          <p className="text-blue-100 text-sm">{currentTicket.subject}</p>
        </div>
        {isModal ? (
          <button
            onClick={onClose}
            className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        ) : (
          <button
            onClick={() => navigate('/tickets')}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to tickets
          </button>
        )}
      </div>

      <div className="p-6 space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 text-gray-600 mb-2">
              <User className="w-4 h-4" />
              <span className="text-sm font-medium">Customer</span>
            </div>
            <p className="text-gray-900 font-medium">{currentTicket.name}</p>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 text-gray-600 mb-2">
              <Mail className="w-4 h-4" />
              <span className="text-sm font-medium">Email</span>
            </div>
            <p className="text-gray-900 font-medium">{currentTicket.email}</p>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 text-gray-600 mb-2">
              <Calendar className="w-4 h-4" />
              <span className="text-sm font-medium">Created</span>
            </div>
            <p className="text-gray-900 text-sm">{formatDate(currentTicket.created_at)}</p>
          </div>

          <div className={`p-4 rounded-lg ${isSLABreached() ? 'bg-red-100' : 'bg-gray-50'}`}>
            <div className="flex items-center gap-2 text-gray-600 mb-2">
              <Clock className="w-4 h-4" />
              <span className="text-sm font-medium">SLA Deadline</span>
            </div>
            <p className={`text-sm font-medium ${isSLABreached() ? 'text-red-700' : 'text-gray-900'}`}>
              {formatDate(currentTicket.sla_deadline)}
            </p>
            {isSLABreached() && (
              <div className="flex items-center gap-1 mt-1 text-red-700">
                <AlertTriangle className="w-3 h-3" />
                <span className="text-xs font-medium">SLA Breached</span>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <p className="text-xs text-gray-600 mb-1">Category</p>
            <p className="text-blue-900 font-semibold">{currentTicket.category}</p>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <p className="text-xs text-gray-600 mb-1">Urgency</p>
            <p className="text-blue-900 font-semibold">{currentTicket.urgency}</p>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <p className="text-xs text-gray-600 mb-1">Department</p>
            <p className="text-blue-900 font-semibold">{currentTicket.department ?? 'Unassigned'}</p>
          </div>
        </div>

        {attachmentUrls.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Attachments</h3>
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              {attachmentUrls.map((url, index) => {
                const cleanUrl = typeof url === 'string' ? url : String(url);
                const fileName = cleanUrl
                  .split('?')[0]
                  .split('/')
                  .filter(Boolean)
                  .pop() || `Attachment ${index + 1}`;

                return (
                  <a
                    key={`${cleanUrl}-${index}`}
                    href={cleanUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-blue-600 transition-colors hover:bg-blue-50 hover:text-blue-700 break-all"
                  >
                    {fileName}
                  </a>
                );
              })}
            </div>
          </div>
        )}

        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Description</h3>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-gray-700 whitespace-pre-wrap">{currentTicket.description}</p>
          </div>
        </div>

        {currentTicket.ai_suggested_reply && (
          <div>
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-semibold text-gray-900">AI-Suggested Reply</h3>
              <button
                onClick={handleCopyReply}
                className="flex items-center gap-2 px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-sm"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-green-600" />
                    <span className="text-green-600">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
              <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">
                {currentTicket.ai_suggested_reply}
              </p>
            </div>
          </div>
        )}

        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Update Ticket</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="Open">Open</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
                <option value="Closed">Closed</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Assigned Agent
              </label>
              <input
                type="text"
                value={assignedAgent}
                onChange={(e) => setAssignedAgent(e.target.value)}
                placeholder="Agent name"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-end gap-4">
            {isModal && (
              <button
                onClick={onClose}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            )}
            {!updated ? (
              <button
                onClick={handleUpdate}
                disabled={updating}
                className="px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-50"
              >
                {updating ? 'Updating…' : 'Update Ticket'}
              </button>
            ) : (
              <>
                <span className="text-sm text-green-600">Successfully Updated</span>
                <button
                  onClick={() => navigate('/dashboard', { replace: true })}
                  className="px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all"
                >
                  View Dashboard
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  ) : null;

  if (isModal) {
    return (
      <Modal open onClose={onClose ?? (() => navigate('/tickets'))}>
        {loading
          ? loadingContent
          : error
          ? errorContent
          : detailContent}
      </Modal>
    );
  }

  if (loading) {
    return loadingContent;
  }

  if (error) {
    return errorContent;
  }

  if (!detailContent) {
    return null;
  }

  return <div className="max-w-5xl mx-auto py-8">{detailContent}</div>;
}
