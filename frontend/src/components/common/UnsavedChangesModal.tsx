import { ModalShell } from './ModalShell';

interface UnsavedChangesModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function UnsavedChangesModal({ isOpen, onConfirm, onCancel }: UnsavedChangesModalProps) {
  if (!isOpen) return null;
  return (
    <ModalShell maxWidth="400px">
      <div className="inner-core" style={{ padding: '28px', textAlign: 'center' }}>
        <h3
          style={{
            fontFamily: 'var(--font-serif)',
            color: 'var(--accent)',
            fontSize: '20px',
            fontWeight: 600,
            margin: '0 0 12px 0',
          }}
        >
          Unsaved Changes
        </h3>
        <p
          style={{
            color: 'var(--text-secondary)',
            fontSize: '13.5px',
            lineHeight: '1.5',
            margin: '0 0 24px 0',
          }}
        >
          You have unsaved changes. If you leave this page, your edits to the schedule will be lost.
          Are you sure you want to discard them?
        </p>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <button
            type="button"
            className="btn-primary"
            onClick={onCancel}
            style={{
              background: 'transparent',
              border: '1px solid var(--border-color)',
              color: 'var(--text-secondary)',
              boxShadow: 'none',
              padding: '8px 16px',
              fontSize: '13px',
            }}
          >
            Keep Editing
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={onConfirm}
            style={{
              backgroundColor: 'var(--accent)',
              color: 'white',
              padding: '8px 16px',
              fontSize: '13px',
            }}
          >
            Discard Changes
          </button>
        </div>
      </div>
    </ModalShell>
  );
}
