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
    <div className="modal-backdrop">
      <div className="outer-bezel modal-shell-bezel" style={{ maxWidth }}>
        {children}
      </div>
    </div>
  );
}
