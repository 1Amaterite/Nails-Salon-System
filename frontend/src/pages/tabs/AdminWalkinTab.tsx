import React, { useState } from 'react';
import type { Branch } from '../../types';
import { PageHeader } from '../../components/common';

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
  const branch = branches.find((b) => b.id === selectedBranch);
  const activeServices = (branch?.services || []).filter((s) => s.isActive);
  const activeEmployees = (branch?.employees || []).filter((e) => e.isActive && e.role !== 'OWNER');

  const [walkinName, setWalkinName] = useState('');
  const [walkinPhone, setWalkinPhone] = useState('');
  const [walkinServiceId, setWalkinServiceId] = useState('');
  const [walkinEmployeeId, setWalkinEmployeeId] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const serviceId = walkinServiceId || activeServices[0]?.id;
    if (!serviceId) return;

    onWalkinSubmit({
      firstName: walkinName,
      phone: walkinPhone,
      serviceId,
      employeeId: walkinEmployeeId || undefined,
    });

    // Reset form states
    setWalkinName('');
    setWalkinPhone('');
    setWalkinEmployeeId('');
    setWalkinServiceId('');
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
          <label className="form-label">Client's First Name</label>
          <input
            type="text"
            placeholder="Enter guest's first name"
            value={walkinName}
            onChange={(e) => setWalkinName(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label className="form-label">Client's Phone Number</label>
          <input
            type="tel"
            placeholder="(555) 000-0000"
            value={walkinPhone}
            onChange={(e) => setWalkinPhone(e.target.value)}
            required
          />
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
          style={{ marginTop: '12px', alignSelf: 'flex-start', padding: '14px 32px' }}
        >
          Register and Queue Guest
        </button>
      </form>
    </div>
  );
}
