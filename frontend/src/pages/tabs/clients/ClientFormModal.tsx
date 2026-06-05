import React, { useState } from 'react';
import { HeartPulse, Sparkles } from 'lucide-react';
import { ModalShell } from '../../../components/common';
import type { Client } from '../../../types';

interface ClientFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    firstName: string;
    lastName: string;
    phoneNumber: string;
    birthday: string;
    safetyNotes: string;
    techPreferences: string;
    generalNotes: string;
  }) => void;
  title: string;
  submitLabel: string;
  isPending: boolean;
  initialData?: Client | null;
}

// Structured note parser utilities
function parseClientNotes(notesStr: string | null | undefined) {
  const result = {
    safety: '',
    preferences: '',
    general: '',
  };
  if (!notesStr) return result;

  const safetyMatch = notesStr.match(/\[Safety\](.*?)(?=\[|$)/s);
  const prefMatch = notesStr.match(/\[Preferences\](.*?)(?=\[|$)/s);
  const generalMatch = notesStr.match(/\[General\](.*?)(?=\[|$)/s);

  result.safety = safetyMatch ? safetyMatch[1].trim() : '';
  result.preferences = prefMatch ? prefMatch[1].trim() : '';

  if (!safetyMatch && !prefMatch && !generalMatch) {
    result.general = notesStr.trim();
  } else {
    result.general = generalMatch ? generalMatch[1].trim() : '';
  }

  return result;
}

export function ClientFormModal({
  isOpen,
  onClose,
  onSubmit,
  title,
  submitLabel,
  isPending,
  initialData,
}: ClientFormModalProps) {
  const [firstName, setFirstName] = useState(() => initialData?.firstName || '');
  const [lastName, setLastName] = useState(() => initialData?.lastName || '');
  const [phoneNumber, setPhoneNumber] = useState(() => initialData?.phoneNumber || '');
  const [birthday, setBirthday] = useState(() => {
    if (initialData?.birthday) {
      return initialData.birthday.split('T')[0];
    }
    return '';
  });
  const [safetyNotes, setSafetyNotes] = useState(() => {
    const parsed = parseClientNotes(initialData?.notes);
    return parsed.safety;
  });
  const [techPreferences, setTechPreferences] = useState(() => {
    const parsed = parseClientNotes(initialData?.notes);
    return parsed.preferences;
  });
  const [generalNotes, setGeneralNotes] = useState(() => {
    const parsed = parseClientNotes(initialData?.notes);
    return parsed.general;
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      firstName,
      lastName,
      phoneNumber,
      birthday,
      safetyNotes,
      techPreferences,
      generalNotes,
    });
  };

  return (
    <ModalShell maxWidth="500px">
      <div
        className="inner-core"
        style={{
          display: 'flex',
          flexDirection: 'column',
          maxHeight: 'calc(85vh - 20px)',
          padding: 0,
          overflow: 'hidden',
        }}
      >
        {/* Sticky Header */}
        <div
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 10,
            backgroundColor: 'var(--bg-secondary)',
            borderBottom: '1px solid var(--border-color)',
            padding: '24px 36px 16px 36px',
          }}
        >
          <h3
            style={{
              fontFamily: 'var(--font-serif)',
              color: 'var(--accent)',
              fontSize: '22px',
              fontWeight: 600,
              margin: '0 0 8px 0',
            }}
          >
            {title}
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13.5px', margin: 0 }}>
            {initialData
              ? 'Update customer information, contact details, skin alert notes, and preferences.'
              : 'Register a new customer profile. Log allergy notes, skin sensitivities, or stylist preferences.'}
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            maxHeight: '100%',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              padding: '24px 36px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">First Name *</label>
                <input
                  type="text"
                  placeholder="Enter first name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Last Name</label>
                <input
                  type="text"
                  placeholder="Enter last name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Phone Number *</label>
                <input
                  type="tel"
                  placeholder="e.g. 0912 345 6789 or 09123456789"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  pattern="^(09\d{9}|09\d{2}\s\d{3}\s\d{4})$"
                  title="Phone number must be in the format 09xx xxx xxxx or 09xxxxxxxxx"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Birthday</label>
                <input type="date" value={birthday} onChange={(e) => setBirthday(e.target.value)} />
              </div>
            </div>

            <div className="form-group">
              <label
                className="form-label"
                style={{ color: '#dc2626', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <HeartPulse size={14} /> Safety Notes & Allergies (e.g. Skin Allergies)
              </label>
              <textarea
                placeholder="Log customer allergies or skin sensitivities here..."
                value={safetyNotes}
                onChange={(e) => setSafetyNotes(e.target.value)}
                rows={2}
              />
            </div>

            <div className="form-group">
              <label
                className="form-label"
                style={{
                  color: 'var(--accent-blue)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <Sparkles size={14} /> Technician & Stylist Preferences
              </label>
              <input
                type="text"
                placeholder="e.g. Prefers Volume lashes, specific nails stylist preference"
                value={techPreferences}
                onChange={(e) => setTechPreferences(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">General Comments</label>
              <textarea
                placeholder="Add general descriptors or preferences..."
                value={generalNotes}
                onChange={(e) => setGeneralNotes(e.target.value)}
                rows={2}
              />
            </div>
          </div>

          {/* Sticky Footer */}
          <div
            style={{
              position: 'sticky',
              bottom: 0,
              zIndex: 10,
              backgroundColor: 'var(--bg-secondary)',
              borderTop: '1px solid var(--border-color)',
              padding: '16px 36px 24px 36px',
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end',
              marginTop: 'auto',
            }}
          >
            <button
              type="button"
              className="btn-primary"
              onClick={onClose}
              style={{
                background: 'transparent',
                border: '1px solid var(--border-color)',
                color: 'var(--text-secondary)',
                boxShadow: 'none',
              }}
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={isPending}>
              {isPending ? 'Saving...' : submitLabel}
            </button>
          </div>
        </form>
      </div>
    </ModalShell>
  );
}
