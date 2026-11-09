import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { Button } from './NotebookPrimitives';

/**
 * Accessible in-app confirmation & alert modal conforming to WCAG AA
 * and perfectly matching the portal's notebook design system.
 *
 * Props:
 * - isOpen: boolean
 * - title: string
 * - message: React.ReactNode | string
 * - confirmLabel: string (default: 'Confirm')
 * - cancelLabel: string (default: 'Cancel')
 * - variant: 'primary' | 'danger' (default: 'primary')
 * - loading: boolean (default: false)
 * - loadingLabel: string (default: 'Processing…')
 * - onConfirm: () => void | Promise<void>
 * - onCancel: () => void
 * - isAlert: boolean (default: false)
 */
export function ConfirmModal({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'primary',
  loading = false,
  loadingLabel = 'Processing…',
  onConfirm,
  onCancel,
  isAlert = false,
}) {
  const modalRef = useRef(null);
  const cancelBtnRef = useRef(null);
  const confirmBtnRef = useRef(null);
  const triggerElementRef = useRef(null);

  // Store trigger element on open and restore focus on close
  useEffect(() => {
    if (isOpen) {
      triggerElementRef.current = document.activeElement;
      // Focus cancel button by default for safety (or confirm if alert-only)
      const timer = setTimeout(() => {
        if (isAlert) {
          confirmBtnRef.current?.focus();
        } else {
          cancelBtnRef.current?.focus();
        }
      }, 30);
      return () => clearTimeout(timer);
    } else if (triggerElementRef.current && typeof triggerElementRef.current.focus === 'function') {
      triggerElementRef.current.focus();
      triggerElementRef.current = null;
    }
  }, [isOpen, isAlert]);

  // Keyboard navigation: Escape to close, Tab / Shift-Tab focus trapping
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (!loading && onCancel) {
          e.preventDefault();
          onCancel();
        }
        return;
      }

      if (e.key === 'Tab' && modalRef.current) {
        const focusableElements = modalRef.current.querySelectorAll(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (focusableElements.length === 0) {
          e.preventDefault();
          return;
        }

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, loading, onCancel]);

  if (!isOpen) return null;

  const isDanger = variant === 'danger';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 dark:bg-black/60 backdrop-blur-xs"
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading && onCancel) {
          onCancel();
        }
      }}
    >
      <div
        ref={modalRef}
        role={isDanger ? 'alertdialog' : 'dialog'}
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
        aria-describedby="confirm-modal-description"
        className="w-full max-w-md rounded-2xl bg-paper-card dark:bg-chalkboard-card border-2 border-ink dark:border-chalkboard-border p-6 shadow-notebook-lg space-y-4"
      >
        {/* Header with Title & matching X close button */}
        <div className="flex items-start justify-between gap-3">
          <h3
            id="confirm-modal-title"
            className="text-lg font-bold text-ink dark:text-chalkboard-chalk"
          >
            {title}
          </h3>
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="p-1 rounded-lg hover:bg-paper-warm dark:hover:bg-chalkboard-surface text-ink-muted hover:text-ink dark:text-chalkboard-muted dark:hover:text-chalkboard-chalk cursor-pointer disabled:opacity-50"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Message / Description */}
        <div
          id="confirm-modal-description"
          className="text-xs sm:text-sm text-ink-muted dark:text-chalkboard-muted leading-relaxed"
        >
          {typeof message === 'string' ? <p>{message}</p> : message}
        </div>

        {/* Footer Actions */}
        <div className="pt-3 border-t border-ink/10 dark:border-chalkboard-borderSubtle flex items-center justify-end gap-3">
          {!isAlert && (
            <Button
              ref={cancelBtnRef}
              type="button"
              variant="secondary"
              size="md"
              onClick={onCancel}
              disabled={loading}
            >
              {cancelLabel}
            </Button>
          )}

          <Button
            ref={confirmBtnRef}
            type="button"
            variant={isDanger ? 'danger' : 'primary'}
            size="md"
            onClick={onConfirm}
            disabled={loading}
            className={isDanger ? '' : 'shadow-notebook'}
          >
            {loading ? loadingLabel : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmModal;
