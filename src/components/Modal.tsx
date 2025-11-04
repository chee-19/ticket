import { type ReactNode, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

type ModalProps = {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  width?: 'default' | 'drawer';
};

export default function Modal({ open, onClose, children, width = 'default' }: ModalProps) {
  const previousOverflow = useRef<string>();

  useEffect(() => {
    if (!open) {
      return;
    }

    const prev = document.body.style.overflow;
    previousOverflow.current = prev;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow.current ?? '';
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  const contentClasses =
    width === 'drawer'
      ? 'fixed right-0 top-0 h-full w-full max-w-3xl bg-white shadow-2xl'
      : 'relative z-[101] my-10 w-full max-w-3xl rounded-2xl bg-white shadow-2xl';

  return createPortal(
    <div className="fixed inset-0 z-[100]">
      <div className="absolute inset-0 bg-slate-900/40" onClick={onClose} />
      <div className="absolute inset-0 flex items-start justify-center pointer-events-none">
        <div
          className={`${contentClasses} pointer-events-auto`}
          role="dialog"
          aria-modal="true"
        >
          <div className="max-h-[85vh] overflow-y-auto overscroll-contain p-6">{children}</div>
        </div>
      </div>
    </div>,
    document.body
  );
}
