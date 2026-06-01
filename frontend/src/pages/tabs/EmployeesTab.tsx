import React, { useState } from 'react';
import { Search, Edit2, Trash2 } from 'lucide-react';
import type { Branch } from '../../types';

interface EmployeesTabProps {
  branches: Branch[];
  selectedBranch: string;
  employeeRole: string;
  onEmployeeAdded: () => void;
}

export function EmployeesTab({
  branches,
  selectedBranch,
  employeeRole,
  onEmployeeAdded
}: EmployeesTabProps) {
  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  // Consolidated Modal & Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<any>(null); // null when adding
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    password: '',
    role: 'STAFF',
    phoneNumber: '',
    specialty: '',
    isActive: true
  });
  const [errorMsg, setErrorMsg] = useState('');

  const handleOpenAddModal = () => {
    setEditingEmployee(null);
    setFormData({
      name: '',
      username: '',
      password: '',
      role: 'STAFF',
      phoneNumber: '',
      specialty: '',
      isActive: true
    });
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (emp: any) => {
    setEditingEmployee(emp);
    setFormData({
      name: emp.name,
      username: emp.username || '',
      password: '',
      role: emp.role,
      phoneNumber: emp.phoneNumber,
      specialty: emp.specialty || '',
      isActive: emp.isActive
    });
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const token = sessionStorage.getItem('adminToken') || sessionStorage.getItem('ownerToken');
    if (!token) {
      setErrorMsg('Authentication token missing. Please re-authenticate.');
      return;
    }

    const isEdit = !!editingEmployee;

    if (!isEdit && (formData.role === 'ADMIN' || formData.role === 'OWNER') && (!formData.username || !formData.password)) {
      setErrorMsg('Username and password are required for admin/owner accounts.');
      return;
    }

    const API_URL = (import.meta.env.VITE_API_URL || (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://localhost:5001' : 'https://nails-salon-backend.onrender.com')).replace(/\/$/, '');

    try {
      const url = isEdit ? `${API_URL}/api/employees/${editingEmployee.id}` : `${API_URL}/api/employees`;
      const method = isEdit ? 'PUT' : 'POST';

      const payload: any = {
        name: formData.name,
        role: formData.role,
        phoneNumber: formData.phoneNumber,
        specialty: formData.specialty || undefined,
      };

      if (formData.role === 'ADMIN' || formData.role === 'OWNER') {
        payload.username = formData.username.replace(/@/g, '');
        if (formData.password) {
          payload.password = formData.password;
        }
      }

      if (isEdit) {
        payload.isActive = formData.isActive;
      } else {
        payload.branchId = selectedBranch;
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (!response.ok) {
        setErrorMsg(data.error || `Failed to ${isEdit ? 'update' : 'create'} employee.`);
        return;
      }

      alert(`Employee ${isEdit ? 'updated' : 'created'} successfully.`);
      setIsModalOpen(false);
      onEmployeeAdded();
    } catch (err) {
      setErrorMsg('Network error. Failed to connect to server.');
    }
  };

  const handleDeleteEmployee = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete ${name}?`)) {
      return;
    }

    const token = sessionStorage.getItem('adminToken') || sessionStorage.getItem('ownerToken');
    if (!token) {
      alert('Authentication token missing. Please re-authenticate.');
      return;
    }

    const API_URL = (import.meta.env.VITE_API_URL || (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://localhost:5001' : 'https://nails-salon-backend.onrender.com')).replace(/\/$/, '');

    try {
      const response = await fetch(`${API_URL}/api/employees/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (!response.ok) {
        alert(data.error || 'Failed to delete employee.');
        return;
      }

      alert('Employee deleted successfully.');
      onEmployeeAdded();
    } catch (err) {
      alert('Network error. Failed to delete employee.');
    }
  };

  const employees = branches.find(b => b.id === selectedBranch)?.employees || [];

  // Filter employees based on search query
  const filteredEmployees = employees.filter((emp: any) => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    return (
      emp.name.toLowerCase().includes(query) ||
      emp.role.toLowerCase().includes(query) ||
      (emp.specialty && emp.specialty.toLowerCase().includes(query)) ||
      emp.phoneNumber.toLowerCase().includes(query)
    );
  });

  return (
    <>
      <div className="glass-panel">
        {/* Search Bar and Header Row */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h3 style={{ color: 'var(--accent)', marginTop: 0, fontFamily: 'var(--font-serif)', fontSize: '20px', fontWeight: 600 }}>Stylists & Shift Schedules</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>Setup specialties, active flags, and weekly schedules for your team.</p>
            </div>
            <button
              className="btn-primary"
              onClick={handleOpenAddModal}
              style={{ padding: '8px 16px', fontSize: '13px' }}
            >
              + Add Employee
            </button>
          </div>

          {/* Search bar input container */}
          <div className="input-with-icon-wrapper" style={{ maxWidth: '400px' }}>
            <Search size={18} className="input-icon" />
            <input
              type="text"
              placeholder="Search by name, role, or specialty..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '38px', height: '40px' }}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px', marginTop: '20px' }}>
          {filteredEmployees.map((emp: any) => {
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
                  
                  {/* Actions Column */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                    <span className={`status-badge ${emp.isActive ? 'active' : 'inactive'}`} style={{ padding: '4px 8px', fontSize: '10px' }}>
                      {emp.isActive ? 'Active' : 'Inactive'}
                    </span>
                    
                    {/* Action buttons */}
                    {(employeeRole === 'OWNER' || (employeeRole === 'ADMIN' && emp.role === 'STAFF')) && (
                      <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                        <button
                          title="Edit Employee"
                          onClick={() => handleOpenEditModal(emp)}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '4px',
                            color: 'var(--text-secondary)',
                            transition: 'color 0.2s',
                          }}
                          onMouseEnter={e => e.currentTarget.style.color = 'var(--accent)'}
                          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          title="Delete Employee"
                          onClick={() => handleDeleteEmployee(emp.id, emp.name)}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '4px',
                            color: 'var(--text-secondary)',
                            transition: 'color 0.2s',
                          }}
                          onMouseEnter={e => e.currentTarget.style.color = '#dc2626'}
                          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}
                  </div>
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
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Username</span>
                        <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{emp.username}</span>
                      </div>
                    );
                  })()}

                  {/* Weekly Schedules Display */}
                  <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '10px', marginTop: '10px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Weekly Shift Schedule
                    </div>
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                      {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((dayName, idx) => {
                        const sched = emp.schedules?.find((s: any) => s.dayOfWeek === idx);
                        const isOff = !sched || sched.isOff;
                        const formatTime = (t: string) => {
                          if (!t) return '';
                          const [h, m] = t.split(':');
                          const hr = parseInt(h, 10);
                          const period = hr >= 12 ? 'PM' : 'AM';
                          const hr12 = hr % 12 === 0 ? 12 : hr % 12;
                          return `${hr12 < 10 ? '0' + hr12 : hr12}:${m} ${period}`;
                        };
                        const title = sched 
                          ? `${dayName}: ${isOff ? 'Off' : `${formatTime(sched.startTime)} - ${formatTime(sched.endTime)}`}`
                          : `${dayName}: Off`;
                        return (
                          <div
                            key={idx}
                            title={title}
                            style={{
                              width: '24px',
                              height: '24px',
                              borderRadius: '4px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '10px',
                              fontWeight: 'bold',
                              backgroundColor: isOff ? 'var(--bg-secondary)' : 'rgba(190, 24, 93, 0.1)',
                              color: isOff ? 'var(--text-secondary)' : 'var(--accent)',
                              border: `1px solid ${isOff ? 'var(--border-color)' : 'rgba(190, 24, 93, 0.2)'}`,
                              cursor: 'default'
                            }}
                          >
                            {dayName}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Unified Employee Form Modal (Handles Add and Edit) */}
      {isModalOpen && (
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
                {editingEmployee ? 'Edit Employee Profile' : 'Add New Employee'}
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '13.5px', margin: '0 0 24px 0' }}>
                {editingEmployee 
                  ? 'Update employee credentials, role assignments, or active status details.' 
                  : (employeeRole !== 'OWNER'
                      ? 'Register a new staff technician or nail artist for this branch.'
                      : 'Register a new salon employee. System accounts are created for managers and owners.')
                }
              </p>

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input
                    type="text"
                    placeholder="e.g. John Doe"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
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
                      <option value="STAFF">Staff (Technician / Artist) — Fixed</option>
                    </select>
                  ) : (
                    <select
                      value={formData.role}
                      onChange={e => setFormData({ ...formData, role: e.target.value })}
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
                    value={formData.phoneNumber}
                    onChange={e => setFormData({ ...formData, phoneNumber: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Specialty</label>
                  <input
                    type="text"
                    placeholder="e.g. Nail Artist, Eyelash Tech"
                    value={formData.specialty}
                    onChange={e => setFormData({ ...formData, specialty: e.target.value })}
                  />
                </div>

                {(formData.role === 'ADMIN' || formData.role === 'OWNER') && (
                  <>
                    <div className="form-group">
                      <label className="form-label">Username</label>
                      <input
                        type="text"
                        placeholder="e.g. johndoe"
                        value={formData.username}
                        onChange={e => setFormData({ ...formData, username: e.target.value.replace(/@/g, '') })}
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
                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                        required={!editingEmployee}
                      />
                    </div>
                  </>
                )}

                {editingEmployee && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px', marginBottom: '8px' }}>
                    <input
                      id="edit-emp-active-checkbox"
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                      style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--accent)', margin: 0 }}
                    />
                    <label htmlFor="edit-emp-active-checkbox" style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)', cursor: 'pointer', margin: 0, padding: 0 }}>
                      Active (Authorized & Available for shifts)
                    </label>
                  </div>
                )}

                {errorMsg && (
                  <div style={{ color: '#b91c1c', fontSize: '13px', backgroundColor: '#fee2e2', padding: '10px', borderRadius: '6px', border: '1px solid #fecaca' }}>
                    {errorMsg}
                  </div>
                )}

                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '12px' }}>
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={() => setIsModalOpen(false)}
                    style={{ background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', boxShadow: 'none' }}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary">
                    {editingEmployee ? 'Update Employee' : 'Save Employee'}
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
