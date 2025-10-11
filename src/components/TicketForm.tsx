import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Send, Loader2 } from 'lucide-react';

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
  const [openaiKey, setOpenaiKey] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const classifyUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/classify-ticket`;

      const classifyResponse = await fetch(classifyUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          subject: formData.subject,
          description: formData.description,
          openaiApiKey: openaiKey,
        }),
      });

      if (!classifyResponse.ok) {
        throw new Error('Failed to classify ticket');
      }

      const classification = await classifyResponse.json();

      const slaDeadline = new Date();
      slaDeadline.setHours(slaDeadline.getHours() + classification.slaHours);

      const { error: insertError } = await supabase.from('tickets').insert({
        ticket_number: '',
        name: formData.name,
        email: formData.email,
        subject: formData.subject,
        description: formData.description,
        category: classification.category,
        urgency: classification.urgency,
        department: classification.department,
        ai_suggested_reply: classification.suggestedReply,
        sla_deadline: slaDeadline.toISOString(),
        status: 'Open',
      });

      if (insertError) throw insertError;

      setSuccess(true);
      setFormData({ name: '', email: '', subject: '', description: '' });

      if (onSuccess) {
        setTimeout(onSuccess, 1500);
      }
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
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Your Name
          </label>
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
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email Address
          </label>
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
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Subject
          </label>
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
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
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
          <label className="block text-sm font-medium text-gray-700 mb-2">
            OpenAI API Key (for AI classification)
          </label>
          <input
            type="password"
            required
            value={openaiKey}
            onChange={(e) => setOpenaiKey(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="sk-..."
          />
          <p className="mt-1 text-xs text-gray-500">
            Your API key is only used for this request and not stored
          </p>
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
