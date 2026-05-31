import React from 'react';
import type { Branch } from '../../types';

interface EmployeesTabProps {
  branches: Branch[];
  selectedBranch: string;
  employeeRole: string;
  // Add Employee Modal
  isAddEmployeeModalOpen: boolean;
  setIsAddEmployeeModalOpen: (b: boolean) => void;
  newEmpName: string;
  setNewEmpName: (n: string) => void;
  newEmpUsername: string;
  setNewEmpUsername: (u: string) => void;
  newEmpPassword: string;
  setNewEmpPassword: (p: string) => void;
  newEmpRole: string;
  setNewEmpRole: (r: string) => void;
  newEmpPhoneNumber: string;
  setNewEmpPhoneNumber: (p: string) => void;
  newEmpSpecialty: string;
  setNewEmpSpecialty: (s: string) => void;
  newEmpError: string;
  handleAddEmployeeSubmit: (e: React.FormEvent) => void;
}

export function EmployeesTab({
  branches, selectedBranch, employeeRole,
  isAddEmployeeModalOpen, setIsAddEmployeeModalOpen,
  newEmpName, setNewEmpName,
  newEmpUsername, setNewEmpUsername,
  newEmpPassword, setNewEmpPassword,
  newEmpRole, setNewEmpRole,
  newEmpPhoneNumber, setNewEmpPhoneNumber,
  newEmpSpecialty, setNewEmpSpecialty,
  newEmpError, handleAddEmployeeSubmit
}: EmployeesTabProps) {
  const employees = branches.find(b => b.id === selectedBranch)?.employees || [];

  return (
    <>
      <div className="glass-panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h3 style={{ color: 'var(--accent)', marginTop: 0, fontFamily: 'var(--font-serif)', fontSize: '20px', fontWeight: 600 }}>Stylists & Shift Schedules</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>Setup specialties, active flags, and weekly schedules for your team.</p>
          </div>
          <button
            className="btn-primary"
            onClick={() => {
              setIsAddEmployeeModalOpen(true);
              setNewEmpRole('STAFF');
            }}
            style={{ padding: '8px 16px', fontSize: '13px' }}
          >
            + Add Employee
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px', marginTop: '20px' }}>
          {employees.map((emp: any) => {
            const initials = emp.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2);
            return (
              <div key={emp.id} className="data-card" style={{ padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <div style={{ width: '44px', height: '44px', borderRadius: '50%', backgroundColor: 'rgba(190, 24, 93, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: 'var(--accent)', fontSize: '16px', fontFamily: 'var(--font-serif)' }}>
                      {initials}
                    </div>
                    <div>
                      <h4 style={{ fontWeight: 600, fontSize: '16px', color: 'var(--text-primary)', margin: 0 }}>{emp.name}</h4>
                      <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
                        <span className="micro-badge" style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          {emp.role}
                        </span>
                        {emp.isActive && <span className="status-badge active" style={{ padding: '2px 6px', fontSize: '9px' }}>On Shift</span>}
                      </div>
                    </div>
                  </div>
                  <span className={`status-badge ${emp.isActive ? 'active' : 'inactive'}`} style={{ padding: '4px 8px', fontSize: '10px' }}>
                    {emp.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px', marginTop: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Specialty</span>
                    <strong style={{ color: 'var(--text-primary)' }}>{emp.specialty || 'Generalist'}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Phone</span>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{emp.phoneNumber}</span>
                  </div>
                  {(() => {
                    const showUsername = emp.username && (
                      (employeeRole === 'ADMIN' && emp.role === 'ADMIN') ||
                      (employeeRole === 'OWNER' && (emp.role === 'OWNER' || emp.role === 'ADMIN'))
                    );
                    if (!showUsername) return null;
                    return (
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Username</span>
                        <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{emp.username}</span>
                      </div>
                    );
                  })()}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add Employee Modal — at component root for correct viewport centering */}
      {isAddEmployeeModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(255, 244, 246, 0.4)',
          backdropFilter: 'blur(12px) saturate(160%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div className="outer-bezel" style={{
            maxWidth: '500px',
            width: '100%',
            animation: 'modalFadeIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards'
          }}>
            <div className="inner-core" style={{ padding: '32px' }}>
              <h3 style={{ fontFamily: 'var(--font-serif)', color: 'var(--accent)', fontSize: '22px', fontWeight: 600, margin: '0 0 8px 0' }}>
                Add New Employee
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '13.5px', margin: '0 0 24px 0' }}>
                {employeeRole !== 'OWNER'
                  ? 'Register a new staff technician or nail artist for this branch.'
                  : 'Register a new salon employee. System accounts are created for managers and owners.'}
              </p>

              <form onSubmit={handleAddEmployeeSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input
                    type="text"
                    placeholder="e.g. John Doe"
                    value={newEmpName}
                    onChange={e => setNewEmpName(e.target.value)}
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
                        pointerEvents: 'none'
                      }}
                    >
                      <option value="STAFF">🔒 Staff (Technician / Artist) — Fixed</option>
                    </select>
                  ) : (
                    <select
                      value={newEmpRole}
                      onChange={e => setNewEmpRole(e.target.value)}
                      required
                    >
                      <option value="STAFF">Staff (Technician / Artist)</option>
                      <option value="ADMIN">Admin (Salon Manager)</option>
                      <option value="OWNER">Owner (Salon Owner)</option>
                    </select>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <input
                    type="tel"
                    placeholder="e.g. 01234567890"
                    value={newEmpPhoneNumber}
                    onChange={e => setNewEmpPhoneNumber(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Specialty</label>
                  <input
                    type="text"
                    placeholder="e.g. Nail Artist, Eyelash Tech"
                    value={newEmpSpecialty}
                    onChange={e => setNewEmpSpecialty(e.target.value)}
                  />
                </div>

                {(newEmpRole === 'ADMIN' || newEmpRole === 'OWNER') && (
                  <>
                    <div className="form-group">
                      <label className="form-label">Username</label>
                      <input
                        type="text"
                        placeholder="e.g. johndoe"
                        value={newEmpUsername}
                        onChange={e => setNewEmpUsername(e.target.value.replace(/@/g, ''))}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Password</label>
                      <input
                        type="password"
                        placeholder="••••••••"
                        value={newEmpPassword}
                        onChange={e => setNewEmpPassword(e.target.value)}
                        required
                      />
                    </div>
                  </>
                )}

                {newEmpError && (
                  <div style={{ color: '#b91c1c', fontSize: '13px', backgroundColor: '#fee2e2', padding: '10px', borderRadius: '6px', border: '1px solid #fecaca' }}>
                    {newEmpError}
                  </div>
                )}

                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '12px' }}>
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={() => setIsAddEmployeeModalOpen(false)}
                    style={{ background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', boxShadow: 'none' }}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary">
                    Save Employee
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
