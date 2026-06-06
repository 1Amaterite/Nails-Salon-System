import { useState } from 'react';
import { X } from 'lucide-react';
import { ModalShell } from '../../../../components/common/ModalShell';
import { InlineAlertBanner } from '../../../../components/common';
import { apiClient } from '../../../../utils/apiClient';

interface CreateBranchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export function CreateBranchModal({ isOpen, onClose, onCreated }: CreateBranchModalProps) {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isPending, setIsPending] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsPending(true);

    try {
      await apiClient.post(`/api/branches`, {
        name: name.trim(),
        address: address.trim() || undefined,
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
      });

      setName('');
      setAddress('');
      setPhone('');
      setEmail('');
      onCreated();
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error occurred while creating branch.';
      setErrorMsg(msg);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <ModalShell maxWidth="550px">
      <div className="modal-container" style={{ padding: '24px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px',
          }}
        >
          <h3
            style={{
              fontFamily: 'var(--font-serif)',
              color: 'var(--accent)',
              fontSize: '19px',
              fontWeight: 600,
              margin: 0,
            }}
          >
            Register New Branch
          </h3>
          <button
            type="button"
            onClick={() => {
              onClose();
              setErrorMsg('');
            }}
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

        {errorMsg && <InlineAlertBanner type="error" message={errorMsg} />}

        <form
          onSubmit={handleSubmit}
          style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
        >
          <div className="form-group">
            <label className="form-label">Branch Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="e.g. Nails & Lashes Lane East"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Address</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. 456 Parkway Ave, Suite B"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Phone</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. (555) 0210"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. east@nailssalon.com"
              />
            </div>
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
              onClick={() => {
                onClose();
                setErrorMsg('');
              }}
              disabled={isPending}
              style={{ padding: '10px 16px' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={isPending}
              style={{ padding: '10px 20px' }}
            >
              {isPending ? 'Creating...' : 'Create Location'}
            </button>
          </div>
        </form>
      </div>
    </ModalShell>
  );
}
