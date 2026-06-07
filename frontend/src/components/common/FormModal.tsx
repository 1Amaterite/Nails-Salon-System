import React from 'react';
import { X } from 'lucide-react';
import { ModalShell } from './ModalShell/ModalShell';
import { FormErrorBanner } from './FormErrorBanner';
import { LoadingSpinner } from './LoadingSpinner';

export interface FormModalProps {
  /** Visibility status of the modal. */
  isOpen: boolean;
  /** Callback to trigger when the modal is requested to close. */
  onClose: () => void;
  /** Bold display title in the modal header. */
  title: string;
  /** Subtitle context text displayed under the title. */
  subtitle?: string;
  /** Text on primary submit button. Defaults to 'Save'. */
  submitLabel?: string;
  /** Text on secondary cancel button. Defaults to 'Cancel'. */
  cancelLabel?: string;
  /** Pending indicator for disabled buttons and loading spinner. */
  isPending?: boolean;
  /** Global error alert text displayed at the bottom of the form. */
  errorMsg?: string;
  /** Submit handler. */
  onSubmit: (e: React.FormEvent) => void;
  /** Input fields and markup context. */
  children: React.ReactNode;
  /** Max CSS width override for modal bezel. Defaults to '500px'. */
  maxWidth?: string | number;
}

/**
 * FormModal standardizes modal layout chrome, headers, footers, loaders,
 * cancel/action overrides, and scrolling bodies.
 */
export function FormModal({
  isOpen,
  onClose,
  title,
  subtitle,
  submitLabel = 'Save',
  cancelLabel = 'Cancel',
  isPending = false,
  errorMsg,
  onSubmit,
  children,
  maxWidth = '500px',
}: FormModalProps) {
  if (!isOpen) return null;

  return (
    <ModalShell maxWidth={maxWidth}>
      <div
        className="inner-core"
        style={{
          display: 'flex',
          flexDirection: 'column',
          maxHeight: 'calc(85vh - 20px)',
          padding: 0,
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 10,
            backgroundColor: 'var(--bg-secondary)',
            borderBottom: '1px solid var(--border-color)',
            padding: '24px 36px 16px 36px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
          }}
        >
          <div style={{ flexGrow: 1, paddingRight: '16px' }}>
            <h3
              style={{
                fontFamily: 'var(--font-serif)',
                color: 'var(--accent)',
                fontSize: '22px',
                fontWeight: 600,
                margin: '0 0 8px 0',
              }}
            >
              {title}
            </h3>
            {subtitle && (
              <p style={{ color: 'var(--text-secondary)', fontSize: '13.5px', margin: 0 }}>
                {subtitle}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-secondary)',
              padding: '4px',
              marginTop: '2px',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Container */}
        <form
          onSubmit={onSubmit}
          style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            maxHeight: '100%',
            overflow: 'hidden',
          }}
        >
          {/* Scrollable body */}
          <div
            className="modal-scroll-body"
            style={{
              overflowY: 'auto',
              padding: '24px 36px',
              flexGrow: 1,
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            {children}
            <FormErrorBanner message={errorMsg} />
          </div>

          {/* Footer controls */}
          <div
            style={{
              position: 'sticky',
              bottom: 0,
              zIndex: 10,
              backgroundColor: 'var(--bg-secondary)',
              borderTop: '1px solid var(--border-color)',
              padding: '16px 36px 24px 36px',
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end',
              marginTop: 'auto',
            }}
          >
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
              disabled={isPending}
              style={{
                background: 'transparent',
                border: '1px solid var(--border-color)',
                color: 'var(--text-secondary)',
                boxShadow: 'none',
              }}
            >
              {cancelLabel}
            </button>
            <button type="submit" className="btn-primary" disabled={isPending}>
              {isPending ? (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <LoadingSpinner size="sm" color="#ffffff" />
                  Saving...
                </span>
              ) : (
                submitLabel
              )}
            </button>
          </div>
        </form>
      </div>
    </ModalShell>
  );
}
