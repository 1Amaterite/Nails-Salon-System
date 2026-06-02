import React from 'react';
import { FormErrorBanner } from './FormErrorBanner';

export interface BaseFormProps {
  /** Submit handler. */
  onSubmit: (e: React.FormEvent) => void;
  /** Global form error message to render in a FormErrorBanner. */
  errorMsg?: string;
  /** Form submission pending status for button disabled & spinner states. */
  isPending?: boolean;
  /** Text for the primary action button. Defaults to 'Save'. */
  submitLabel?: string;
  /** Text for the secondary action cancel button. Defaults to 'Cancel'. */
  cancelLabel?: string;
  /** Cancel handler. If provided, renders a Cancel button next to submit. */
  onCancel?: () => void;
  /** Form input fields. */
  children: React.ReactNode;
  /** Style override for the outer form tag. */
  style?: React.CSSProperties;
  /** Style override for the scrollable field container. */
  bodyStyle?: React.CSSProperties;
  /** Style override for the footer container. */
  footerStyle?: React.CSSProperties;
  /** Whether the footer sticks to the bottom of the container. Defaults to true. */
  stickyFooter?: boolean;
}

/**
 * BaseForm standardizes form logic and aesthetics across the salon frontend.
 * It manages consistent layout padding, scrollable sections, form error banners,
 * and submit action statuses with visual indicators.
 */
export function BaseForm({
  onSubmit,
  errorMsg,
  isPending = false,
  submitLabel = 'Save',
  cancelLabel = 'Cancel',
  onCancel,
  children,
  style,
  bodyStyle,
  footerStyle,
  stickyFooter = true,
}: BaseFormProps) {
  return (
    <form
      onSubmit={onSubmit}
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        maxHeight: '100%',
        overflow: 'hidden',
        ...style,
      }}
    >
      <div
        className="modal-scroll-body"
        style={{
          overflowY: 'auto',
          padding: '24px 36px',
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          ...bodyStyle,
        }}
      >
        {children}
        <FormErrorBanner message={errorMsg} />
      </div>

      <div
        style={{
          position: stickyFooter ? 'sticky' : 'static',
          bottom: 0,
          zIndex: 10,
          backgroundColor: 'var(--bg-secondary)',
          borderTop: '1px solid var(--border-color)',
          padding: '16px 36px 24px 36px',
          display: 'flex',
          gap: '12px',
          justifyContent: 'flex-end',
          marginTop: 'auto',
          ...footerStyle,
        }}
      >
        {onCancel && (
          <button
            type="button"
            className="btn-primary"
            onClick={onCancel}
            style={{
              background: 'transparent',
              border: '1px solid var(--border-color)',
              color: 'var(--text-secondary)',
              boxShadow: 'none',
            }}
          >
            {cancelLabel}
          </button>
        )}
        <button type="submit" className="btn-primary" disabled={isPending}>
          {isPending ? (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <span
                style={{
                  width: '12px',
                  height: '12px',
                  border: '2px solid rgba(255,255,255,0.3)',
                  borderRadius: '50%',
                  borderTopColor: '#fff',
                  animation: 'spin 1s linear infinite',
                  display: 'inline-block',
                }}
              ></span>
              Saving...
            </span>
          ) : (
            submitLabel
          )}
        </button>
      </div>
    </form>
  );
}
