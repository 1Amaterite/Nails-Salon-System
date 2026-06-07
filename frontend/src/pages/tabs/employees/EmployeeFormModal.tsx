import React, { useState } from 'react';
import type { Employee } from '../../../types';
import { FormModal } from '../../../components/common';

interface EmployeeFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingEmployee: Employee | null;
  employeeRole: string;
  onSubmit: (payload: {
    name: string;
    role: 'OWNER' | 'ADMIN' | 'STAFF';
    phoneNumber: string;
    specialty?: string;
    username?: string;
    password?: string;
    isActive?: boolean;
  }) => void;
  errorMsg: string;
  isPending: boolean;
}

export function EmployeeFormModal({
  isOpen,
  onClose,
  editingEmployee,
  employeeRole,
  onSubmit,
  errorMsg,
  isPending,
}: EmployeeFormModalProps) {
  const [formData, setFormData] = useState<{
    name: string;
    username: string;
    password: string;
    role: 'OWNER' | 'ADMIN' | 'STAFF';
    phoneNumber: string;
    specialty: string;
    isActive: boolean;
  }>(() => {
    if (editingEmployee) {
      return {
        name: editingEmployee.name,
        username: editingEmployee.username || '',
        password: '',
        role: editingEmployee.role,
        phoneNumber: editingEmployee.phoneNumber,
        specialty: editingEmployee.specialty || '',
        isActive: editingEmployee.isActive,
      };
    }
    return {
      name: '',
      username: '',
      password: '',
      role: 'STAFF',
      phoneNumber: '',
      specialty: '',
      isActive: true,
    };
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name: formData.name,
      role: formData.role,
      phoneNumber: formData.phoneNumber,
      specialty: formData.specialty || undefined,
      username:
        formData.role === 'ADMIN' || formData.role === 'OWNER' ? formData.username : undefined,
      password:
        (formData.role === 'ADMIN' || formData.role === 'OWNER') && formData.password
          ? formData.password
          : undefined,
      isActive: editingEmployee ? formData.isActive : undefined,
    });
  };

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      title={editingEmployee ? 'Edit Employee Profile' : 'Add New Employee'}
      subtitle={
        editingEmployee
          ? 'Update employee credentials, role assignments, or active status details.'
          : employeeRole !== 'OWNER'
            ? 'Register a new staff technician or nail artist for this branch.'
            : 'Register a new salon employee. System accounts are created for managers and owners.'
      }
      submitLabel={editingEmployee ? 'Update Employee' : 'Save Employee'}
      isPending={isPending}
      errorMsg={errorMsg}
      onSubmit={handleSubmit}
      maxWidth="500px"
    >
      <div className="form-group">
        <label className="form-label">Full Name</label>
        <input
          type="text"
          placeholder="e.g. John Doe"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
      </div>

      <div className="form-group">
        <label className="form-label">Role</label>
        {employeeRole !== 'OWNER' ? (
          <select
            value="STAFF"
            disabled
            style={{
              cursor: 'not-allowed',
              opacity: 0.6,
              backgroundColor: 'var(--bg-secondary)',
              pointerEvents: 'none',
            }}
          >
            <option value="STAFF">Staff (Technician / Artist) — Fixed</option>
          </select>
        ) : (
          <select
            value={formData.role}
            onChange={(e) =>
              setFormData({
                ...formData,
                role: e.target.value as 'OWNER' | 'ADMIN' | 'STAFF',
              })
            }
            required
          >
            <option value="STAFF">Staff (Technician / Artist)</option>
            <option value="ADMIN">Admin (Salon Manager)</option>
            <option value="OWNER">Owner (Salon Owner)</option>
          </select>
        )}
      </div>

      <div className="form-group">
        <label className="form-label">Phone Number *</label>
        <input
          type="tel"
          placeholder="e.g. 0917 565 9890 or 09175659890"
          value={formData.phoneNumber}
          onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
          pattern="^(09\d{9}|09\d{2}\s\d{3}\s\d{4})$"
          title="Phone number must be in the format 09xx xxx xxxx or 09xxxxxxxxx"
          required
        />
      </div>

      <div className="form-group">
        <label className="form-label">Specialty</label>
        <input
          type="text"
          placeholder="e.g. Nail Artist, Eyelash Tech"
          value={formData.specialty}
          onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
        />
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '8px' }}>
          {['Nail Specialist', 'Eyelash Tech', 'Manicurist', 'Pedicurist', 'Generalist'].map(
            (spec) => (
              <button
                key={spec}
                type="button"
                onClick={() => setFormData({ ...formData, specialty: spec })}
                style={{
                  fontSize: '11px',
                  padding: '4px 10px',
                  borderRadius: '16px',
                  border: '1px solid var(--border-color)',
                  backgroundColor:
                    formData.specialty === spec ? 'rgba(209, 71, 119, 0.08)' : 'transparent',
                  color: formData.specialty === spec ? 'var(--accent)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  borderColor:
                    formData.specialty === spec ? 'var(--accent)' : 'var(--border-color)',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  if (formData.specialty !== spec) {
                    e.currentTarget.style.borderColor = 'var(--accent)';
                    e.currentTarget.style.color = 'var(--accent)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (formData.specialty !== spec) {
                    e.currentTarget.style.borderColor = 'var(--border-color)';
                    e.currentTarget.style.color = 'var(--text-secondary)';
                  }
                }}
              >
                {spec}
              </button>
            )
          )}
        </div>
      </div>

      {(formData.role === 'ADMIN' || formData.role === 'OWNER') && (
        <>
          <div className="form-group">
            <label className="form-label">Username</label>
            <input
              type="text"
              placeholder="e.g. johndoe"
              value={formData.username}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  username: e.target.value.replace(/@/g, ''),
                })
              }
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">
              {editingEmployee ? 'New Password (leave blank to keep current)' : 'Password'}
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required={!editingEmployee}
            />
          </div>
        </>
      )}

      {editingEmployee && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginTop: '8px',
            marginBottom: '8px',
          }}
        >
          <input
            id="edit-emp-active-checkbox"
            type="checkbox"
            checked={formData.isActive}
            onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
            style={{
              width: '18px',
              height: '18px',
              cursor: 'pointer',
              accentColor: 'var(--accent)',
              margin: 0,
            }}
          />
          <label
            htmlFor="edit-emp-active-checkbox"
            style={{
              fontSize: '14px',
              fontWeight: 500,
              color: 'var(--text-primary)',
              cursor: 'pointer',
              margin: 0,
              padding: 0,
            }}
          >
            Active (Authorized & Available for shifts)
          </label>
        </div>
      )}
    </FormModal>
  );
}
