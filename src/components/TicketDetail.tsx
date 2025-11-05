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
  ArrowLeft,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { shouldFilterByDepartment } from '../constants/departments';
import Modal from './Modal';
import { TicketEmailLog } from './TicketEmailLog';
import { buttonGhost, urgencyBadge } from '../styles/theme';
import { AIReplyEditor } from './AIReplyEditor';

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
  const [loading, setLoading] = useState(!ticket);
  const [error, setError] = useState<string | null>(null);
  const [openEmailLog, setOpenEmailLog] = useState(false);
  const [replyText, setReplyText] = useState(currentTicket?.ai_suggested_reply ?? '');

  const standalone = !ticket;
  const isModal = typeof onClose === 'function';
  const handleCloseModal = () => {
    setOpenEmailLog(false);
    onClose?.();
  };
  const handleReturn = () => {
    setOpenEmailLog(false);
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
    setOpenEmailLog(false);
  }, [currentTicket?.id]);

  useEffect(() => {
    setReplyText(currentTicket?.ai_suggested_reply ?? '');
  }, [currentTicket?.id, currentTicket?.ai_suggested_reply]);

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

  const openGmailDraft = (to: string, subject: string, body: string) => {
    const normalized = (body ?? '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    const gmailUrl =
      `https://mail.google.com/mail/?view=cm&fs=1` +
      `&to=${encodeURIComponent(to || '')}` +
      `&su=${encodeURIComponent(subject || '')}` +
      `&body=${encodeURIComponent(normalized)}`;
    const win = window.open(gmailUrl, '_blank', 'noopener,noreferrer');
    if (!win) {
      window.location.href =
        `mailto:${encodeURIComponent(to || '')}` +
        `?subject=${encodeURIComponent(subject || '')}` +
        `&body=${encodeURIComponent(normalized)}`;
    }
  };

  const loadingContent = (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-accent/30 border-t-accent" />
    </div>
  );

  const errorContent = (
    <div className="card-elevated p-8 text-center text-danger">
      {error}
      <div className="mt-4">
        <button
          onClick={handleReturn}
          className={`${buttonGhost} text-sm`}
        >
          Return to tickets
        </button>
      </div>
    </div>
  );

  const ticketIdForLog = currentTicket?.id ?? params.id ?? null;

  const detailContent = currentTicket ? (
    <div className="card-elevated w-full max-w-4xl overflow-hidden">
      <div className="flex items-start justify-between bg-gradient-to-r from-[#1c3d8a] to-[#1a4fb7] p-6 text-primary">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold">{currentTicket.ticket_number}</h2>
          <p className="text-sm text-primary/70">{currentTicket.subject}</p>
          <span className="inline-flex items-center rounded-full bg-white/15 px-3 py-1 text-xs font-medium uppercase tracking-wide text-primary">
            {currentTicket.status}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setOpenEmailLog(true)}
            className="rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-sm font-medium text-primary/80 transition-colors hover:border-accent/60 hover:text-primary"
          >
            View Emails Sent
          </button>
          {isModal ? (
            <button
              onClick={handleCloseModal}
              className="rounded-lg bg-white/10 p-2 text-primary transition-colors hover:bg-white/20"
            >
              <X className="h-6 w-6" />
            </button>
          ) : (
            <button
              onClick={handleReturn}
              className="flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-sm text-primary transition-colors hover:bg-white/20"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to tickets
            </button>
          )}
        </div>
      </div>

      <div className="space-y-6 p-6 text-primary">
        {/* Top info grid */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-lg border border-white/5 bg-white/5 p-4">
            <div className="mb-2 flex items-center gap-2 text-secondary">
              <User className="h-4 w-4" />
              <span className="text-sm font-medium">Customer</span>
            </div>
            <p className="font-medium text-primary">{currentTicket.name}</p>
          </div>

          <div className="rounded-lg border border-white/5 bg-white/5 p-4">
            <div className="mb-2 flex items-center gap-2 text-secondary">
              <Mail className="h-4 w-4" />
              <span className="text-sm font-medium">Email</span>
            </div>
            <p className="font-medium text-primary">{currentTicket.email}</p>
          </div>

          <div className="rounded-lg border border-white/5 bg-white/5 p-4">
            <div className="mb-2 flex items-center gap-2 text-secondary">
              <Calendar className="h-4 w-4" />
              <span className="text-sm font-medium">Created</span>
            </div>
            <p className="text-sm text-primary/80">{formatDate(currentTicket.created_at)}</p>
          </div>
        </div>

        {/* SLA box */}
        <div
          className={`rounded-lg border p-4 ${
            isSLABreached() ? 'border-danger/40 bg-danger/10' : 'border-white/5 bg-white/5'
          }`}
        >
          <div className="mb-2 flex items-center gap-2 text-secondary">
            <Clock className="h-4 w-4" />
            <span className="text-sm font-medium">SLA Deadline</span>
          </div>
          <p
            className={`text-sm font-medium ${
              isSLABreached() ? 'text-danger' : 'text-primary'
            }`}
          >
            {formatDate(currentTicket.sla_deadline)}
          </p>
          {isSLABreached() && (
            <div className="mt-1 flex items-center gap-1 text-danger">
              <AlertTriangle className="h-3 w-3" />
              <span className="text-xs font-medium">SLA Breached</span>
            </div>
          )}
        </div>

        {/* Category / Urgency / Department grid */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-lg border border-white/5 bg-elevated/60 p-4">
            <p className="mb-1 text-xs uppercase tracking-wide text-secondary">Category</p>
            <p className="text-sm font-semibold text-primary">{currentTicket.category}</p>
          </div>

          <div className="rounded-lg border border-white/5 bg-elevated/60 p-4">
            <p className="mb-1 text-xs uppercase tracking-wide text-secondary">Urgency</p>
            <span className={urgencyBadge(currentTicket.urgency)}>{currentTicket.urgency}</span>
          </div>
          <p className="text-sm text-primary/80">{formatDate(currentTicket.created_at)}</p>
        </div>
      </div>

          <div className="rounded-lg border border-white/5 bg-elevated/60 p-4">
            <p className="mb-1 text-xs uppercase tracking-wide text-secondary">Department</p>
            <p className="text-sm font-semibold text-primary">
              {currentTicket.department ?? 'Unassigned'}
            </p>
          </div>
        </div>

        {/* Attachments */}
        {attachmentUrls.length > 0 && (
          <div>
            <h3 className="mb-3 text-lg font-semibold text-primary">Attachments</h3>
            <div className="space-y-2 rounded-lg border border-white/5 bg-white/5 p-4">
              {attachmentUrls.map((url, index) => {
                const cleanUrl = typeof url === 'string' ? url : String(url);
                const fileName =
                  cleanUrl.split('?')[0].split('/').filter(Boolean).pop() ||
                  `Attachment ${index + 1}`;

                return (
                  <a
                    key={`${cleanUrl}-${index}`}
                    href={cleanUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block break-all rounded-lg border border-white/10 bg-elevated/60 px-3 py-2 text-sm font-medium text-accent transition-colors hover:bg-elevated/80 hover:text-accent-strong"
                  >
                    {fileName}
                  </a>
                );
              })}
            </div>
          </div>
        )}

        {/* Description */}
        <div>
          <h3 className="mb-3 text-lg font-semibold text-primary">Description</h3>
          <div className="rounded-lg border border-white/5 bg-white/5 p-4">
            <p className="whitespace-pre-wrap text-secondary">{currentTicket.description}</p>
          </div>
        </div>

        {/* Editable AI reply */}
        <AIReplyEditor
          initialText={replyText}
          toEmail={currentTicket.email}
          subject={currentTicket.subject}
          department={currentTicket.department ?? undefined}
          onChange={(value) => setReplyText(value)}
        />

        {/* Footer actions (restored) */}
        <div className="mt-8 flex flex-col items-stretch gap-3 border-t border-white/10 pt-4 md:flex-row md:items-center md:justify-between">
          {/* Left-side: reply actions */}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => navigator.clipboard.writeText(replyText || '')}
              className="rounded-lg border border-white/15 bg-white/10 px-4 py-2 text-sm text-primary hover:bg-white/20"
            >
              Copy Reply
            </button>
            <button
              type="button"
              onClick={() => openGmailDraft(currentTicket.email, currentTicket.subject, replyText)}
              className="rounded-lg bg-gradient-to-r from-[#3b82f6] to-[#22d3ee] px-4 py-2 text-sm font-medium text-white shadow hover:opacity-95"
            >
              Open Email Draft
            </button>
            <button
              type="button"
              onClick={() => {}}
              className="rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm text-primary hover:bg-white/10"
            >
              Save Draft
            </button>
          </div>

          {/* Right-side: ticket actions */}
          <div className="flex flex-wrap items-center gap-3">
            {isModal && (
              <button
                type="button"
                onClick={handleCloseModal}
                className="rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm text-primary hover:bg-white/10"
              >
                Cancel
              </button>
            )}

            {!updated ? (
              <button
                type="button"
                onClick={handleUpdate}
                disabled={updating}
                className="rounded-lg bg-gradient-to-r from-[#2563eb] to-[#06b6d4] px-5 py-2 text-sm font-medium text-white shadow hover:opacity-95 disabled:opacity-60"
              >
                {updating ? 'Updating…' : 'Update Ticket'}
              </button>
            ) : (
              <>
                <span className="text-sm text-green-400">Successfully Updated</span>
                <button
                  type="button"
                  onClick={() => navigate('/dashboard', { replace: true })}
                  className="rounded-lg bg-gradient-to-r from-[#2563eb] to-[#06b6d4] px-5 py-2 text-sm font-medium text-white shadow hover:opacity-95"
                >
                  View Dashboard
                </button>
              </>
            )}
          </div>
        </div>

        <div className="border-t border-white/5 pt-6">
          <h3 className="mb-4 text-lg font-semibold text-primary">Update Ticket</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-secondary">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-elevated/70 px-4 py-2 text-primary focus:border-accent focus:outline-none focus:ring-0"
              >
                <option value="Open">Open</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
                <option value="Closed">Closed</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-secondary">
                Assigned Agent
              </label>
              <input
                type="text"
                value={assignedAgent}
                onChange={(e) => setAssignedAgent(e.target.value)}
                placeholder="Agent name"
                className="w-full rounded-lg border border-white/10 bg-elevated/70 px-4 py-2 text-primary placeholder:text-muted focus:border-accent focus:outline-none focus:ring-0"
              />
            </div>
          </div>

        </div>
      )}

      {/* Description */}
      <div>
        <h3 className="mb-3 text-lg font-semibold text-primary">Description</h3>
        <div className="rounded-lg border border-white/5 bg-white/5 p-4">
          <p className="whitespace-pre-wrap text-secondary">{currentTicket.description}</p>
        </div>
      </div>

      {/* Editable AI reply */}
      <AIReplyEditor
        initialText={currentTicket.ai_suggested_reply ?? ''}
        toEmail={currentTicket.email}
        subject={currentTicket.subject}
        department={currentTicket.department ?? undefined}
      />
    </div>
  ) : null;

  if (isModal) {
    return (
      <>
        <Modal open onClose={onClose ? handleCloseModal : () => navigate('/tickets')}>
          {loading
            ? loadingContent
            : error
            ? errorContent
            : detailContent}
        </Modal>

        {/* Email activity modal */}
        <TicketEmailLog
          ticketId={ticketIdForLog}
          open={openEmailLog}
          onClose={() => setOpenEmailLog(false)}
        />
      </>
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

  return (
    <div className="mx-auto max-w-5xl py-8 text-primary">
      {detailContent}
      <TicketEmailLog
        ticketId={ticketIdForLog}
        open={openEmailLog}
        onClose={() => setOpenEmailLog(false)}
      />
    </div>
  );
}

// non-modal branch
if (loading) return loadingContent;
if (error) return errorContent;
if (!detailContent) return null;

return (
  <div className="mx-auto max-w-5xl py-8 text-primary">
    {detailContent}
    <TicketEmailLog
      ticketId={ticketIdForLog}
      open={openEmailLog}
      onClose={() => setOpenEmailLog(false)}
    />
  </div>
);

}
