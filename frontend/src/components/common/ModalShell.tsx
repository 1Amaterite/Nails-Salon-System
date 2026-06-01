import React from 'react';

export interface ModalShellProps {
  /**
   * CSS max-width for the modal container.
   * Accepts any valid CSS width value. Default: '500px'.
   */
  maxWidth?: string | number;
  /** Modal body content rendered inside the bezel. */
  children: React.ReactNode;
}

/**
 * Reusable modal chrome: blurred/frosted backdrop + outer-bezel container +
 * entrance animation.  Callers are responsible for conditional rendering
 * (e.g. `{isOpen && <ModalShell>…</ModalShell>}`).
 *
 * The inner content padding and layout are left entirely to the consumer so
 * that both form-style and informational modals can share this shell.
 */
export function ModalShell({ maxWidth = '500px', children }: ModalShellProps) {
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(255, 244, 246, 0.4)',
        backdropFilter: 'blur(12px) saturate(160%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px',
      }}
    >
      <div
        className="outer-bezel"
        style={{
          maxWidth,
          width: '100%',
          animation: 'modalFadeIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        }}
      >
        {children}
      </div>
    </div>
  );
}
