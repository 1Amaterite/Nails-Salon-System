import React, { useState } from 'react';
import { Save, RefreshCw } from 'lucide-react';

interface SettingsPayload {
  name: string;
  address: string;
  phone: string;
  email: string;
}

interface SettingsFormProps {
  settingsData: SettingsPayload;
  onSubmit: (payload: SettingsPayload) => void;
  onReset: () => void;
  isPending: boolean;
}

export function SettingsForm({ settingsData, onSubmit, onReset, isPending }: SettingsFormProps) {
  const [name, setName] = useState(() => settingsData.name || '');
  const [address, setAddress] = useState(() => settingsData.address || '');
  const [phone, setPhone] = useState(() => settingsData.phone || '');
  const [email, setEmail] = useState(() => settingsData.email || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name: name.trim(),
      address: address.trim(),
      phone: phone.trim(),
      email: email.trim(),
    });
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Section: Branch Details */}
      <div className="glass-card-sub">
        <h3
          style={{
            fontFamily: 'var(--font-serif)',
            color: 'var(--accent)',
            fontSize: '17px',
            fontWeight: 600,
            marginTop: 0,
            marginBottom: '20px',
          }}
        >
          Branch Profile &amp; Information
        </h3>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '16px',
            marginBottom: '16px',
          }}
        >
          <div className="form-group">
            <label className="form-label">Branch Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="e.g. Nails &amp; Lashes Lane Branch"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Contact Phone</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. 0917 565 9890"
              pattern="^(09\d{9}|09\d{2}\s\d{3}\s\d{4})$"
              title="Phone number must be in the format 09xx xxx xxxx or 09xxxxxxxxx"
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div className="form-group">
            <label className="form-label">Address</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. 123 Luxury Way"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Contact Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. info@nailssalon.com"
            />
          </div>
        </div>
      </div>

      {/* Form Action Buttons */}
      <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
        <button
          type="button"
          className="btn-secondary"
          onClick={onReset}
          disabled={isPending}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '10px 16px',
          }}
        >
          <RefreshCw size={14} className={isPending ? 'spin' : ''} />
          Reset
        </button>
        <button
          type="submit"
          className="btn-primary"
          disabled={isPending}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '10px 20px',
          }}
        >
          <Save size={14} />
          {isPending ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </form>
  );
}
