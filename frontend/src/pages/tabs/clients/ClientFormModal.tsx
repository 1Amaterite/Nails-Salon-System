import React, { useState } from 'react';
import { HeartPulse, Sparkles } from 'lucide-react';
import { FormModal } from '../../../components/common';
import type { Client } from '../../../types';
import { ClientFormSchema } from '../../../validation/clientForm.validation';
import { parseClientNotes } from '../../../utils/notes';
import { PHONE_PATTERN, PHONE_TITLE } from '../../../utils/validation';

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
  const [validationError, setValidationError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    const validation = ClientFormSchema.safeParse({
      firstName,
      lastName,
      phoneNumber,
      birthday,
      safetyNotes,
      techPreferences,
      generalNotes,
    });

    if (!validation.success) {
      const errorMsg = validation.error.issues.map((issue) => issue.message).join(' ');
      setValidationError(errorMsg);
      return;
    }

    onSubmit({
      firstName: validation.data.firstName,
      lastName: validation.data.lastName || '',
      phoneNumber: validation.data.phoneNumber,
      birthday: validation.data.birthday || '',
      safetyNotes: validation.data.safetyNotes || '',
      techPreferences: validation.data.techPreferences || '',
      generalNotes: validation.data.generalNotes || '',
    });
  };

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      subtitle={
        initialData
          ? 'Update customer information, contact details, skin alert notes, and preferences.'
          : 'Register a new customer profile. Log allergy notes, skin sensitivities, or stylist preferences.'
      }
      submitLabel={submitLabel}
      isPending={isPending}
      errorMsg={validationError || undefined}
      onSubmit={handleSubmit}
      maxWidth="500px"
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
            pattern={PHONE_PATTERN}
            title={PHONE_TITLE}
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
    </FormModal>
  );
}
