import { useEffect, useMemo, useState } from 'react';
import { Check, Copy, ExternalLink, Save } from 'lucide-react';
import { buttonGhost, buttonPrimary } from '../styles/theme';

type Props = {
  initialText: string;
  toEmail: string;
  subject: string;
  department?: string;
  onChange?: (text: string) => void;
  onSaveDraft?: (text: string) => Promise<void> | void;
};

export function AIReplyEditor({
  initialText,
  toEmail,
  subject,
  department = 'Support',
  onChange,
  onSaveDraft,
}: Props) {
  const [text, setText] = useState(initialText);
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setText(initialText);
  }, [initialText]);

  useEffect(() => {
    if (!saved) return;
    const timeout = setTimeout(() => setSaved(false), 2000);
    return () => clearTimeout(timeout);
  }, [saved]);

  const characterCount = useMemo(() => text.length, [text]);

  const handleChange = (value: string) => {
    setText(value);
    onChange?.(value);
    if (saved) {
      setSaved(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy reply', error);
    }
  };

  const handleOpenEmail = () => {
    const params = new URLSearchParams({
      to: toEmail,
      su: subject,
      body: text,
    });

    const url = `https://mail.google.com/mail/?view=cm&fs=1&${params.toString()}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleSaveDraft = async () => {
    if (!onSaveDraft) return;
    try {
      setSaving(true);
      await onSaveDraft(text);
      setSaved(true);
    } catch (error) {
      console.error('Failed to save draft', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="card-elevated space-y-4 p-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-primary">AI Reply Editor</h3>
          <p className="text-sm text-secondary">
            Prepare a response for the {department} team before sending externally.
          </p>
        </div>
        <span className="text-xs text-muted">{characterCount} characters</span>
      </div>

      <label className="space-y-2">
        <span className="text-sm font-medium text-secondary">Reply Body</span>
        <textarea
          value={text}
          onChange={(event) => handleChange(event.target.value)}
          className="min-h-[220px] w-full resize-y rounded-xl border border-white/10 bg-elevated/70 p-3 text-sm leading-relaxed text-primary placeholder:text-muted focus:border-accent focus:outline-none"
        />
      </label>

      <div className="flex flex-wrap items-center justify-between gap-3">
        {saved && (
          <span className="inline-flex items-center gap-1 text-sm text-success">
            <Check className="h-4 w-4" /> Saved
          </span>
        )}
        <div className="ml-auto flex flex-wrap items-center gap-2">
          {onSaveDraft && (
            <button
              onClick={handleSaveDraft}
              disabled={saving}
              className={`${buttonGhost} text-sm`}
            >
              <Save className="h-4 w-4" />
              {saving ? 'Saving…' : 'Save Draft'}
            </button>
          )}
          <button onClick={handleCopy} className={`${buttonGhost} text-sm`}>
            {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
          <button onClick={handleOpenEmail} className={`${buttonPrimary} text-sm`}>
            <ExternalLink className="h-4 w-4" /> Open Email Draft
          </button>
        </div>
      </div>
    </div>
  );
}
