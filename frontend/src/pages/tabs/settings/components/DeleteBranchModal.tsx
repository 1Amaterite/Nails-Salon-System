import { useState } from 'react';
import { X } from 'lucide-react';
import { ModalShell, InlineAlertBanner } from '../../../../components/common';
import { apiClient } from '../../../../utils/apiClient';
import type { Branch } from '../../../../types';

interface DeleteBranchModalProps {
  branch: Branch | null;
  onClose: () => void;
  onDeleted: () => void;
}

export function DeleteBranchModal({ branch, onClose, onDeleted }: DeleteBranchModalProps) {
  const [deleteConfirmName, setDeleteConfirmName] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  if (!branch) return null;

  const handleConfirmDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    setDeleteError('');

    if (deleteConfirmName.trim() !== branch.name) {
      setDeleteError('Confirmed branch name does not match.');
      return;
    }

    setIsDeleting(true);

    try {
      await apiClient.delete(`/api/branches/${branch.id}`);

      setDeleteConfirmName('');
      onDeleted();
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error occurred while deleting branch.';
      setDeleteError(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <ModalShell maxWidth="500px">
      <div className="modal-container" style={{ padding: '24px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px',
          }}
        >
          <h3
            style={{
              fontFamily: 'var(--font-serif)',
              color: '#dc2626',
              fontSize: '18px',
              fontWeight: 600,
              margin: 0,
            }}
          >
            Double-Secured Deletion
          </h3>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-secondary)',
            }}
          >
            <X size={20} />
          </button>
        </div>

        <div className="modal-warning-banner">
          <strong>Warning:</strong> Deleting <strong>{branch.name}</strong> is a destructive action.
          All associated services, appointments, schedules, and settings for this branch will be
          permanently deleted.
        </div>

        {deleteError && <InlineAlertBanner type="error" message={deleteError} />}

        <form
          onSubmit={handleConfirmDelete}
          style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
        >
          <div className="form-group">
            <label className="form-label" style={{ fontSize: '13.5px' }}>
              Please type the name of the branch <strong>{branch.name}</strong> to confirm:
            </label>
            <input
              type="text"
              value={deleteConfirmName}
              onChange={(e) => setDeleteConfirmName(e.target.value)}
              required
              placeholder={branch.name}
              autoComplete="off"
            />
          </div>

          <div
            style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end',
              marginTop: '12px',
            }}
          >
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
              disabled={isDeleting}
              style={{ padding: '10px 16px' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={isDeleting || deleteConfirmName.trim() !== branch.name}
              style={{
                padding: '10px 20px',
                backgroundColor:
                  deleteConfirmName.trim() === branch.name ? '#dc2626' : 'var(--border-color)',
                color:
                  deleteConfirmName.trim() === branch.name ? '#ffffff' : 'var(--text-secondary)',
                cursor: deleteConfirmName.trim() === branch.name ? 'pointer' : 'not-allowed',
              }}
            >
              {isDeleting ? 'Deleting...' : 'Permanently Delete'}
            </button>
          </div>
        </form>
      </div>
    </ModalShell>
  );
}
