import { useState } from 'react';
import { Send, Loader2, XCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface TicketFormProps {
  onSuccess?: () => void;
}

export function TicketForm({ onSuccess }: TicketFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    description: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);

  const [attachmentInputKey, setAttachmentInputKey] = useState(() =>
    Math.random().toString(36)
  );

  const notifyN8n = (payload: unknown) => {
    const url = import.meta.env.VITE_N8N_WEBHOOK_URL as string | undefined;
    if (!url) return;
    try {
      const controller = new AbortController();
      setTimeout(() => controller.abort(), 5000);
      fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      }).catch(() => {});
    } catch {
      // swallow webhook errors; background automation logs them separately
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const uploadedAttachmentUrls: string[] = [];

      if (attachments.length > 0) {
        const bucket =
          (import.meta.env.VITE_SUPABASE_ATTACHMENTS_BUCKET as string | undefined) ??
          'ticket-attachments';
        for (const file of attachments) {
          const fileExt = file.name.split('.').pop()?.toLowerCase() ?? 'bin';
          const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;
          const filePath = `${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from(bucket)
            .upload(filePath, file, {
              contentType: file.type,
              upsert: false,
            });

          if (uploadError) throw uploadError;

          const {
            data: { publicUrl },
          } = supabase.storage.from(bucket).getPublicUrl(filePath);

          uploadedAttachmentUrls.push(publicUrl);
        }
      }

      // 1) Insert a new ticket (return the new row so we have its id)
      const { data: inserted, error: insertError } = await supabase
        .from('tickets')
        .insert([
          {
            name: formData.name,
            email: formData.email,
            subject: formData.subject,
            description: formData.description,
            attachment_url:
              uploadedAttachmentUrls.length > 0
                ? JSON.stringify(uploadedAttachmentUrls)
                : null,
            // let DB defaults handle category/urgency/department if you set defaults,
            // otherwise keep placeholders. n8n will overwrite these.
            status: 'CLASSIFYING',
            // schema requires NOT NULL sla_deadline; use placeholder now,
            // n8n will compute real SLA after classification
            sla_deadline: new Date().toISOString(),
          },
        ])
        .select('id, name, email, subject, description, attachment_url')
        .single();

      if (insertError) throw insertError;
      if (!inserted) throw new Error('Insert returned no data');

      // 2) Kick n8n to classify THIS ticket now
      notifyN8n({
        ticket_id: inserted.id,
        id: inserted.id,
        name: inserted.name,
        email: inserted.email,
        subject: inserted.subject,
        description: inserted.description,
        attachments: uploadedAttachmentUrls,
        attachment_url:
          uploadedAttachmentUrls.length > 0
            ? JSON.stringify(uploadedAttachmentUrls)
            : inserted.attachment_url,
      });

      // 3) Reset UI
      setSuccess(true);
      setFormData({ name: '', email: '', subject: '', description: '' });
      setAttachments([]);
      setAttachmentInputKey(Math.random().toString(36));
      onSuccess && setTimeout(onSuccess, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit ticket');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-8 max-w-2xl w-full">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Submit a Support Ticket</h2>

      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">
          Ticket submitted successfully! Our team will get back to you soon.
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Your Name</label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="John Doe"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
          <input
            type="email"
            required
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="john@example.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
          <input
            type="text"
            required
            value={formData.subject}
            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Brief description of your issue"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
          <textarea
            required
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={5}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            placeholder="Please provide detailed information about your issue..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Attachments (PDF, JPG, PNG)</label>
          <input
            key={attachmentInputKey}
            type="file"
            accept="application/pdf,image/jpeg,image/png"
            multiple
            onChange={(event) => {
              const files = Array.from(event.target.files ?? []);
              const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
              const unsupportedMessage =
                'Unsupported file type. Please upload only PDF, JPG, or PNG files.';

              if (files.length === 0) {
                return;
              }

              const hasUnsupported = files.some(
                (file) => !allowedTypes.includes(file.type)
              );

              if (hasUnsupported) {
                setError(unsupportedMessage);
                setAttachmentInputKey(Math.random().toString(36));
                return;
              }

              if (error === unsupportedMessage) {
                setError('');
              }

              setAttachments((prev) => {
                const existing = new Set(
                  prev.map((file) => `${file.name}-${file.size}-${file.lastModified}`)
                );
                const deduped = files.filter(
                  (file) =>
                    !existing.has(`${file.name}-${file.size}-${file.lastModified}`)
                );
                return [...prev, ...deduped];
              });
              setAttachmentInputKey(Math.random().toString(36));
            }}
            className="w-full cursor-pointer text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          {attachments.length > 0 && (
            <ul className="mt-3 space-y-2">
              {attachments.map((file, index) => (
                <li
                  key={`${file.name}-${index}`}
                  className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700"
                >
                  <span className="truncate pr-3" title={file.name}>
                    {file.name}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setAttachments((prev) => prev.filter((_, i) => i !== index))
                    }
                    className="inline-flex items-center text-red-600 hover:text-red-700"
                    aria-label={`Remove ${file.name}`}
                  >
                    <XCircle className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <Send className="w-5 h-5" />
              Submit Ticket
            </>
          )}
        </button>
      </form>
    </div>
  );
}
