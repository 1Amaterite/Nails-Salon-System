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
      <div className="inner-core modal-content-centered">
        <h3 className="modal-title">Unsaved Changes</h3>
        <p className="modal-text">
          You have unsaved changes. If you leave this page, your edits to the schedule will be lost.
          Are you sure you want to discard them?
        </p>

        <div className="modal-actions-center">
          <button type="button" className="btn-primary btn-outline-cancel" onClick={onCancel}>
            Keep Editing
          </button>
          <button type="button" className="btn-primary btn-action-small" onClick={onConfirm}>
            Discard Changes
          </button>
        </div>
      </div>
    </ModalShell>
  );
}
