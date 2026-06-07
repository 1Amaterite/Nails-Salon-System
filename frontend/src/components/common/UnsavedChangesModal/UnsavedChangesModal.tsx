import { ModalShell } from '../ModalShell/ModalShell';
import styles from './UnsavedChangesModal.module.css';

interface UnsavedChangesModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function UnsavedChangesModal({ isOpen, onConfirm, onCancel }: UnsavedChangesModalProps) {
  if (!isOpen) return null;
  return (
    <ModalShell maxWidth="400px">
      <div className={`inner-core ${styles.contentCentered}`}>
        <h3 className={styles.title}>Unsaved Changes</h3>
        <p className={styles.text}>
          You have unsaved changes. If you leave this page, your edits to the schedule will be lost.
          Are you sure you want to discard them?
        </p>

        <div className={styles.actionsCenter}>
          <button type="button" className={styles.btnOutlineCancel} onClick={onCancel}>
            Keep Editing
          </button>
          <button
            type="button"
            className={`btn-primary ${styles.btnActionSmall}`}
            onClick={onConfirm}
          >
            Discard Changes
          </button>
        </div>
      </div>
    </ModalShell>
  );
}
