import { useState } from 'react';
import { FormModal } from '../../../../components/common';
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

  const handleClose = () => {
    onClose();
    setErrorMsg('');
  };

  return (
    <FormModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Register New Branch"
      submitLabel="Create Location"
      isPending={isPending}
      errorMsg={errorMsg}
      onSubmit={handleSubmit}
      maxWidth="550px"
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
    </FormModal>
  );
}
