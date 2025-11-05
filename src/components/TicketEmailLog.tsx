import { useCallback, useEffect, useMemo, useState } from 'react';
import { X, ChevronDown, ChevronUp } from 'lucide-react';
import Modal from './Modal';
import { supabase } from '../lib/supabase';
import { buttonGhost } from '../styles/theme';

type OutgoingMessage = {
  id: string;
  ticket_id: string;
  to_email: string | null;
  from_department: string | null;
  subject: string | null;
  body_text: string | null;
  channel: string | null;
  status: string | null;
  sent_at: string | null;
};

type TicketEmailLogProps = {
  ticketId: string | null | undefined;
  open: boolean;
  onClose: () => void;
};

const typeStyles: Record<string, { label: string; className: string }> = {
  ack: {
    label: 'System • Acknowledgement',
    className: 'bg-accent/15 text-accent',
  },
  external_email: {
    label: 'Agent • Email',
    className: 'bg-accent-strong/15 text-accent-strong',
  },
};

const formatDate = (value: string | null) => {
  if (!value) {
    return 'Not sent yet';
  }

  return new Date(value).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export function TicketEmailLog({ ticketId, open, onClose }: TicketEmailLogProps) {
  const [messages, setMessages] = useState<OutgoingMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedBodies, setExpandedBodies] = useState<Record<string, boolean>>({});

  const sortedMessages = useMemo(
    () =>
      [...messages].sort((a, b) => {
        const aTime = a.sent_at ? new Date(a.sent_at).getTime() : 0;
        const bTime = b.sent_at ? new Date(b.sent_at).getTime() : 0;
        return aTime - bTime;
      }),
    [messages]
  );

  const toggleBody = (id: string) => {
    setExpandedBodies((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const loadMessages = useCallback(async () => {
    if (!ticketId) return;
    setLoading(true);
    setError(null);

    const { data, error: fetchError } = await supabase
      .from('outgoing_messages')
      .select('*')
      .eq('ticket_id', ticketId)
      .order('sent_at', { ascending: true });

    if (fetchError) {
      console.error('Failed to load outgoing messages', fetchError);
      setError('Unable to load email history right now.');
    } else {
      setMessages(data ?? []);
    }

    setLoading(false);
  }, [ticketId]);

  useEffect(() => {
    if (!open || !ticketId) {
      return;
    }

    loadMessages();
  }, [open, ticketId, loadMessages]);

  useEffect(() => {
    if (!open || !ticketId) {
      return;
    }

    const channel = supabase
      .channel(`outgoing-messages-${ticketId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'outgoing_messages',
          filter: `ticket_id=eq.${ticketId}`,
        },
        (payload) => {
          const newMessage = payload.new as OutgoingMessage;
          setMessages((prev) => {
            const existingIndex = prev.findIndex((message) => message.id === newMessage.id);
            if (existingIndex !== -1) {
              const next = [...prev];
              next[existingIndex] = newMessage;
              return next;
            }
            return [...prev, newMessage];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [open, ticketId]);

  useEffect(() => {
    if (!open) {
      return;
    }

    setExpandedBodies({});
  }, [open, ticketId]);

  return (
    <Modal open={open} onClose={onClose}>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-primary">Emails Sent</h2>
          <p className="text-sm text-secondary">
            Outbound communication history for this ticket
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border border-white/10 bg-white/5 p-2 text-secondary transition-colors hover:border-accent/60 hover:text-primary"
          aria-label="Close email history"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-accent/20 border-t-accent" />
        </div>
      ) : error ? (
        <div className="rounded-xl border border-danger/30 bg-danger/10 p-6 text-danger">
          {error}
          <div className="mt-4">
            <button type="button" onClick={loadMessages} className={buttonGhost}>
              Try again
            </button>
          </div>
        </div>
      ) : sortedMessages.length === 0 ? (
        <div className="rounded-xl border border-white/10 bg-white/5 p-6 text-center text-secondary">
          No emails have been sent for this ticket yet.
        </div>
      ) : (
        <div className="space-y-4">
          {sortedMessages.map((message) => {
            const meta = typeStyles[message.channel ?? ''] ?? {
              label: message.channel ?? 'Message',
              className: 'bg-white/5 text-secondary',
            };
            const expanded = expandedBodies[message.id];

            return (
              <article
                key={message.id}
                className="rounded-xl border border-white/10 bg-elevated/70 p-5 shadow-glow"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className={`px-3 py-1 text-xs font-semibold uppercase tracking-wide ${meta.className}`}>
                      {meta.label}
                    </span>
                    {message.status && (
                      <span className="text-xs uppercase tracking-wide text-secondary">
                        Status: {message.status}
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleBody(message.id)}
                    className="inline-flex items-center gap-1 text-sm font-medium text-accent hover:text-accent-strong"
                  >
                    {expanded ? (
                      <>
                        Hide message
                        <ChevronUp className="h-4 w-4" />
                      </>
                    ) : (
                      <>
                        View message
                        <ChevronDown className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </div>

                <h3 className="mt-3 text-lg font-semibold text-primary">
                  {message.subject || 'No subject'}
                </h3>

                <p className="mt-1 text-xs uppercase tracking-wide text-secondary">
                  To: {message.to_email || 'Unknown'} • From: {message.from_department || 'Unknown'} • {formatDate(message.sent_at)}
                </p>

                {expanded && (
                  <div className="mt-4 rounded-lg border border-white/10 bg-white/5 p-4 text-sm leading-relaxed text-secondary">
                    {message.body_text ? (
                      <pre className="whitespace-pre-wrap font-sans">{message.body_text}</pre>
                    ) : (
                      'No message content'
                    )}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </Modal>
  );
}

