import React, { useState } from 'react';
import type { Branch } from '../../types';

interface AdminWalkinTabProps {
  branches: Branch[];
  selectedBranch: string;
  onWalkinSubmit: (entry: { firstName: string; phone: string; service: string; stylist: string }) => void;
}

export function AdminWalkinTab({
  branches,
  selectedBranch,
  onWalkinSubmit
}: AdminWalkinTabProps) {
  const [walkinName, setWalkinName] = useState('');
  const [walkinPhone, setWalkinPhone] = useState('');
  const [walkinService, setWalkinService] = useState('Gel Manicure');
  const [walkinStylist, setWalkinStylist] = useState('First Available Stylist');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onWalkinSubmit({
      firstName: walkinName,
      phone: walkinPhone,
      service: walkinService,
      stylist: walkinStylist
    });
    // Reset form states
    setWalkinName('');
    setWalkinPhone('');
    setWalkinService('Gel Manicure');
    setWalkinStylist('First Available Stylist');
  };

  return (
    <div className="glass-panel" style={{ borderLeft: '4px solid var(--accent-teal)' }}>
      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ color: 'var(--accent)', marginTop: 0, fontFamily: 'var(--font-serif)', fontSize: '20px', fontWeight: 600 }}>Receptionist Walk-In Guest Check-In</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>Add a walk-in guest to the live queue on their behalf if they are not tech-savvy.</p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '500px' }}>
        <div className="form-group">
          <label className="form-label">Client's First Name</label>
          <input
            type="text"
            placeholder="Enter guest's first name"
            value={walkinName}
            onChange={e => setWalkinName(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label className="form-label">Client's Phone Number</label>
          <input
            type="tel"
            placeholder="(555) 000-0000"
            value={walkinPhone}
            onChange={e => setWalkinPhone(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label className="form-label">Stylist Preference</label>
          <select value={walkinStylist} onChange={e => setWalkinStylist(e.target.value)}>
            <option value="First Available Stylist">First Available Stylist</option>
            {(branches.find(b => b.id === selectedBranch)?.employees || []).map(emp => (
              <option key={emp.id} value={emp.name}>{emp.name}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Requested Treatment</label>
          <select value={walkinService} onChange={e => setWalkinService(e.target.value)}>
            <option value="Gel Manicure">Gel Manicure</option>
            <option value="Gellack/Shellac/Gel polish">Gellack/Shellac/Gel polish</option>
            <option value="Gel extensions">Gel extensions</option>
            <option value="Gel on natural nails">Gel on natural nails</option>
            <option value="Luxury Pedicure">Luxury Pedicure</option>
            <option value="Volume Lash Extensions">Volume Lash Extensions</option>
          </select>
        </div>
        <button type="submit" className="btn-secondary" style={{ marginTop: '12px', alignSelf: 'flex-start', padding: '14px 32px' }}>
          Register and Queue Guest
        </button>
      </form>
    </div>
  );
}
