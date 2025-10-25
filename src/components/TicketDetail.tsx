import { useState } from 'react';
import { Ticket, supabase } from '../lib/supabase';
import { X, Clock, User, Mail, Calendar, AlertTriangle, Copy, Check } from 'lucide-react';

interface TicketDetailProps {
  ticket: Ticket;
  onClose: () => void;
  onUpdate: () => void;
}

export function TicketDetail({ ticket, onClose, onUpdate }: TicketDetailProps) {
  const [status, setStatus] = useState(ticket.status);
  const [assignedAgent, setAssignedAgent] = useState(ticket.assigned_agent || '');
  const [updating, setUpdating] = useState(false);
  const [copied, setCopied] = useState(false);

  const attachmentUrls = (() => {
    const raw = ticket.attachment_url;
    if (!raw) return [] as string[];
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
  })();

  const handleUpdate = async () => {
    setUpdating(true);
    try {
      const updates: any = { status, assigned_agent: assignedAgent || null };

      if (status === 'Resolved' || status === 'Closed') {
        updates.resolved_at = new Date().toISOString();
      }

      await supabase
        .from('tickets')
        .update(updates)
        .eq('id', ticket.id);

      onUpdate();
      onClose();
    } catch (error) {
      console.error('Error updating ticket:', error);
    } finally {
      setUpdating(false);
    }
  };

  const handleCopyReply = () => {
    if (ticket.ai_suggested_reply) {
      navigator.clipboard.writeText(ticket.ai_suggested_reply);
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
    if (ticket.status === 'Resolved' || ticket.status === 'Closed') return false;
    return new Date(ticket.sla_deadline) < new Date();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold mb-1">{ticket.ticket_number}</h2>
            <p className="text-blue-100 text-sm">{ticket.subject}</p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 text-gray-600 mb-2">
                <User className="w-4 h-4" />
                <span className="text-sm font-medium">Customer</span>
              </div>
              <p className="text-gray-900 font-medium">{ticket.name}</p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 text-gray-600 mb-2">
                <Mail className="w-4 h-4" />
                <span className="text-sm font-medium">Email</span>
              </div>
              <p className="text-gray-900 font-medium">{ticket.email}</p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 text-gray-600 mb-2">
                <Calendar className="w-4 h-4" />
                <span className="text-sm font-medium">Created</span>
              </div>
              <p className="text-gray-900 text-sm">{formatDate(ticket.created_at)}</p>
            </div>

            <div className={`p-4 rounded-lg ${isSLABreached() ? 'bg-red-100' : 'bg-gray-50'}`}>
              <div className="flex items-center gap-2 text-gray-600 mb-2">
                <Clock className="w-4 h-4" />
                <span className="text-sm font-medium">SLA Deadline</span>
              </div>
              <p className={`text-sm font-medium ${isSLABreached() ? 'text-red-700' : 'text-gray-900'}`}>
                {formatDate(ticket.sla_deadline)}
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
              <p className="text-blue-900 font-semibold">{ticket.category}</p>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <p className="text-xs text-gray-600 mb-1">Urgency</p>
              <p className="text-blue-900 font-semibold">{ticket.urgency}</p>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <p className="text-xs text-gray-600 mb-1">Department</p>
              <p className="text-blue-900 font-semibold">{ticket.department}</p>
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
              <p className="text-gray-700 whitespace-pre-wrap">{ticket.description}</p>
            </div>
          </div>

          {ticket.ai_suggested_reply && (
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
                  {ticket.ai_suggested_reply}
                </p>
              </div>
            </div>
          )}

          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Update Ticket</h3>
            <div className="grid grid-cols-2 gap-4">
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

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={onClose}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdate}
                disabled={updating}
                className="px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-50"
              >
                {updating ? 'Updating...' : 'Update Ticket'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
