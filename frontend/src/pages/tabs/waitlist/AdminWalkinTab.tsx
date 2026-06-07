import React, { useState } from 'react';
import type { Branch, Client } from '../../../types';
import { PageHeader, ClientAutocomplete, LoadingSpinner } from '../../../components/common';
import { useBranch } from '../../../context/BranchContext';

interface AdminWalkinTabProps {
  branches: Branch[];
  selectedBranch: string;
  onWalkinSubmit: (entry: {
    firstName: string;
    phone: string;
    serviceId: string;
    employeeId?: string;
  }) => void;
}

export function AdminWalkinTab({ branches, selectedBranch, onWalkinSubmit }: AdminWalkinTabProps) {
  const { isAddingWalkin } = useBranch();
  const branch = branches.find((b) => b.id === selectedBranch);
  const activeServices = (branch?.services || []).filter((s) => s.isActive);
  const activeEmployees = (branch?.employees || []).filter((e) => e.isActive && e.role !== 'OWNER');

  const [walkinName, setWalkinName] = useState('');
  const [walkinPhone, setWalkinPhone] = useState('');
  const [walkinServiceId, setWalkinServiceId] = useState('');
  const [walkinEmployeeId, setWalkinEmployeeId] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);

  const validatePhone = (phone: string): boolean => {
    const trimmed = phone.trim();
    if (!trimmed) {
      setPhoneError('Phone number is required.');
      return false;
    }
    const phoneRegex = /^(09\d{9}|09\d{2}\s\d{3}\s\d{4})$/;
    if (!phoneRegex.test(trimmed)) {
      setPhoneError('Phone number must be in format 09xxxxxxxxx or 09xx xxx xxxx.');
      return false;
    }
    setPhoneError(null);
    return true;
  };

  const handleClearSelection = () => {
    setSelectedClient(null);
    setWalkinName('');
    setWalkinPhone('');
    setPhoneError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const serviceId = walkinServiceId || activeServices[0]?.id;
    if (!serviceId) return;

    const isPhoneValid = validatePhone(walkinPhone);
    if (!isPhoneValid) return;

    onWalkinSubmit({
      firstName: selectedClient ? selectedClient.firstName : walkinName.trim(),
      phone: walkinPhone.trim(),
      serviceId,
      employeeId: walkinEmployeeId || undefined,
    });

    // Reset form states
    setWalkinName('');
    setWalkinPhone('');
    setWalkinEmployeeId('');
    setWalkinServiceId('');
    setSelectedClient(null);
    setPhoneError(null);
  };

  return (
    <div className="glass-panel" style={{ borderLeft: '4px solid var(--accent-blue)' }}>
      <PageHeader
        title="Receptionist Walk-In Guest Check-In"
        subtitle="Add a walk-in guest to the live queue on their behalf if they are not tech-savvy."
      />

      <form
        onSubmit={handleSubmit}
        style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '500px' }}
      >
        <div className="form-group">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <label className="form-label" style={{ marginBottom: 0 }}>
              Client's Name
            </label>
            {selectedClient ? (
              <span
                className="micro-badge"
                style={{
                  backgroundColor: '#10B981',
                  color: '#fff',
                  fontSize: '10px',
                  padding: '2px 8px',
                }}
              >
                Returning Client
              </span>
            ) : walkinName.trim() ? (
              <span
                className="micro-badge"
                style={{
                  backgroundColor: 'var(--border-color)',
                  color: 'var(--text-secondary)',
                  fontSize: '10px',
                  padding: '2px 8px',
                }}
              >
                New Guest
              </span>
            ) : null}
          </div>
          <ClientAutocomplete
            value={
              selectedClient
                ? `${selectedClient.firstName} ${selectedClient.lastName}`.trim()
                : walkinName
            }
            onChange={(val) => {
              setWalkinName(val);
              if (selectedClient) {
                setSelectedClient(null);
              }
            }}
            onSelect={(client) => {
              setSelectedClient(client);
              setWalkinName(`${client.firstName} ${client.lastName}`.trim());
              setWalkinPhone(client.phoneNumber || '');
              setPhoneError(null);
            }}
            isLocked={!!selectedClient}
            onClear={handleClearSelection}
            placeholder="Type client's name or phone to autofill..."
            required
          />
        </div>
        <div className="form-group">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <label className="form-label" style={{ marginBottom: 0 }}>
              Client's Phone Number
            </label>
            {selectedClient && (
              <span
                className="micro-badge"
                style={{
                  backgroundColor: '#3B82F6',
                  color: '#fff',
                  fontSize: '10px',
                  padding: '2px 8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                ✓ Verified
              </span>
            )}
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <input
              type="tel"
              placeholder="09xxxxxxxxx or 09xx xxx xxxx"
              value={walkinPhone}
              onChange={(e) => {
                const val = e.target.value;
                setWalkinPhone(val);
                if (phoneError) validatePhone(val);
              }}
              onBlur={() => validatePhone(walkinPhone)}
              disabled={!!selectedClient}
              required
              style={{
                flex: 1,
                backgroundColor: selectedClient ? 'var(--bg-secondary)' : undefined,
                cursor: selectedClient ? 'not-allowed' : undefined,
                opacity: selectedClient ? 0.8 : 1,
                borderColor: phoneError ? '#EF4444' : undefined,
              }}
            />
            {selectedClient && (
              <button
                type="button"
                className="btn-secondary"
                onClick={handleClearSelection}
                style={{
                  padding: '10px 16px',
                  fontSize: '13px',
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-primary)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                Clear
              </button>
            )}
          </div>
          {phoneError && (
            <span
              style={{ color: '#EF4444', fontSize: '12px', marginTop: '4px', display: 'block' }}
            >
              {phoneError}
            </span>
          )}
        </div>
        <div className="form-group">
          <label className="form-label">Stylist Preference</label>
          <select value={walkinEmployeeId} onChange={(e) => setWalkinEmployeeId(e.target.value)}>
            <option value="">First Available Stylist</option>
            {activeEmployees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.name}
              </option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Requested Treatment</label>
          <select
            value={walkinServiceId || activeServices[0]?.id || ''}
            onChange={(e) => setWalkinServiceId(e.target.value)}
            required
          >
            <option value="" disabled>
              Select a treatment...
            </option>
            {activeServices.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} - ₱{Number(s.price).toFixed(2)}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          className="btn-secondary"
          disabled={isAddingWalkin}
          style={{
            marginTop: '12px',
            alignSelf: 'flex-start',
            padding: '14px 32px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          {isAddingWalkin ? (
            <>
              <LoadingSpinner size="sm" color="currentColor" />
              Registering...
            </>
          ) : (
            'Register and Queue Guest'
          )}
        </button>
      </form>
    </div>
  );
}
