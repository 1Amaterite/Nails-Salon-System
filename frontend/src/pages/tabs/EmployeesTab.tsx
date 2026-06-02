import React, { useState } from 'react';
import { Edit2, Trash2, Users } from 'lucide-react';
import type { Branch, Employee, EmployeeSchedule } from '../../types';
import { useNotification } from '../../context/NotificationContext';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchWithTimeout } from '../../utils/api';
import { getApiUrl, getAuthToken } from '../../utils/getApiUrl';
import {
  PageWrapper,
  DataTable,
  BaseForm,
  SearchBar,
  SegmentedControl,
  PaginationControls,
  ModalShell,
  EmptyState,
} from '../../components/common';
import type { ColumnDef } from '../../components/common';
import { useModalState } from '../../utils/hooks';

interface EmployeesTabProps {
  branches: Branch[];
  selectedBranch: string;
  employeeRole: string;
  onEmployeeAdded: () => void;
}

type RoleFilter = 'ALL' | 'OWNER' | 'ADMIN' | 'STAFF';

interface EmployeePayload {
  name: string;
  role: 'OWNER' | 'ADMIN' | 'STAFF';
  phoneNumber: string;
  specialty?: string;
  username?: string;
  password?: string;
  isActive?: boolean;
  branchId?: string;
}

const ROLE_FILTER_OPTIONS: { value: RoleFilter; label: string }[] = [
  { value: 'ALL', label: 'All' },
  { value: 'OWNER', label: 'Owners' },
  { value: 'ADMIN', label: 'Admins' },
  { value: 'STAFF', label: 'Staff' },
];

export function EmployeesTab({
  branches,
  selectedBranch,
  employeeRole,
  onEmployeeAdded,
}: EmployeesTabProps) {
  const { showToast, confirm } = useNotification();
  const queryClient = useQueryClient();

  // Search & filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('ALL');
  const [showInactive, setShowInactive] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  // Modal & Form State
  const { isOpen: isModalOpen, open: openModal, close: closeModal } = useModalState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    password: '',
    role: 'STAFF',
    phoneNumber: '',
    specialty: '',
    isActive: true,
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
      isActive: true,
    });
    setErrorMsg('');
    openModal();
  };

  const handleOpenEditModal = (emp: Employee) => {
    setEditingEmployee(emp);
    setFormData({
      name: emp.name,
      username: emp.username || '',
      password: '',
      role: emp.role,
      phoneNumber: emp.phoneNumber,
      specialty: emp.specialty || '',
      isActive: emp.isActive,
    });
    setErrorMsg('');
    openModal();
  };

  const submitMutation = useMutation({
    mutationFn: async ({ isEdit, payload }: { isEdit: boolean; payload: EmployeePayload }) => {
      const token = getAuthToken();
      const API_URL = getApiUrl();
      const url =
        isEdit && editingEmployee
          ? `${API_URL}/api/employees/${editingEmployee.id}`
          : `${API_URL}/api/employees`;
      const method = isEdit ? 'PUT' : 'POST';

      const response = await fetchWithTimeout(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || `Failed to ${isEdit ? 'update' : 'create'} employee.`);
      }
      return data;
    },
    onMutate: async ({ isEdit, payload }) => {
      await queryClient.cancelQueries({ queryKey: ['branches', selectedBranch, employeeRole] });
      const previousBranches = queryClient.getQueryData(['branches', selectedBranch, employeeRole]);

      if (previousBranches) {
        queryClient.setQueryData(
          ['branches', selectedBranch, employeeRole],
          (old: Branch[] | undefined) => {
            if (!old) return old;
            return old.map((b) => {
              if (b.id !== selectedBranch) return b;
              let newEmployees = [...(b.employees || [])];
              if (isEdit && editingEmployee) {
                newEmployees = newEmployees.map((emp) =>
                  emp.id === editingEmployee.id ? { ...emp, ...payload } : emp
                );
              } else {
                const newEmp = {
                  id: 'temp-' + Date.now(),
                  isActive: true,
                  branchId: payload.branchId || selectedBranch,
                  schedules: Array.from({ length: 7 }, (_, i) => ({
                    dayOfWeek: i,
                    startTime: '09:00',
                    endTime: '17:00',
                    isOff: i === 0,
                  })),
                  ...payload,
                } as Employee;
                newEmployees.push(newEmp);
              }
              return { ...b, employees: newEmployees };
            });
          }
        );
      }

      return { previousBranches };
    },
    onError: (err: Error, _variables, context) => {
      if (context?.previousBranches) {
        queryClient.setQueryData(
          ['branches', selectedBranch, employeeRole],
          context.previousBranches
        );
      }
      setErrorMsg(err.message || 'Network error. Failed to connect to server.');
    },
    onSuccess: (_data, variables) => {
      showToast(`Employee ${variables.isEdit ? 'updated' : 'created'} successfully.`, 'success');
      closeModal();
      onEmployeeAdded();
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['branches', selectedBranch, employeeRole] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const token = getAuthToken();
      const API_URL = getApiUrl();

      const response = await fetchWithTimeout(`${API_URL}/api/employees/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete employee.');
      }
      return data;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['branches', selectedBranch, employeeRole] });
      const previousBranches = queryClient.getQueryData(['branches', selectedBranch, employeeRole]);

      if (previousBranches) {
        queryClient.setQueryData(
          ['branches', selectedBranch, employeeRole],
          (old: Branch[] | undefined) => {
            if (!old) return old;
            return old.map((b) => {
              if (b.id !== selectedBranch) return b;
              return { ...b, employees: (b.employees || []).filter((emp) => emp.id !== id) };
            });
          }
        );
      }

      return { previousBranches };
    },
    onError: (err: Error, _variables, context) => {
      if (context?.previousBranches) {
        queryClient.setQueryData(
          ['branches', selectedBranch, employeeRole],
          context.previousBranches
        );
      }
      showToast(err.message || 'Network error. Failed to delete employee.', 'error');
    },
    onSuccess: () => {
      showToast('Employee deleted successfully.', 'success');
      onEmployeeAdded();
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['branches', selectedBranch, employeeRole] });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const isEdit = !!editingEmployee;

    if (
      !isEdit &&
      (formData.role === 'ADMIN' || formData.role === 'OWNER') &&
      (!formData.username || !formData.password)
    ) {
      setErrorMsg('Username and password are required for admin/owner accounts.');
      return;
    }

    const payload: EmployeePayload = {
      name: formData.name.trim(),
      role: formData.role as 'OWNER' | 'ADMIN' | 'STAFF',
      phoneNumber: formData.phoneNumber.trim(),
      specialty: formData.specialty.trim() || undefined,
    };

    if (formData.role === 'ADMIN' || formData.role === 'OWNER') {
      payload.username = formData.username.replace(/@/g, '').trim();
      if (formData.password) payload.password = formData.password;
    }

    if (isEdit) {
      payload.isActive = formData.isActive;
    } else {
      payload.branchId = selectedBranch;
    }

    submitMutation.mutate({ isEdit, payload });
  };

  const handleDeleteEmployee = async (id: string, name: string) => {
    const isConfirmed = await confirm({
      title: 'Confirm Deletion',
      body: `Are you sure you want to delete ${name}? This action cannot be undone.`,
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
      isDestructive: true,
    });
    if (!isConfirmed) return;
    deleteMutation.mutate(id);
  };

  const employees = branches.find((b) => b.id === selectedBranch)?.employees || [];

  const filteredEmployees = employees.filter((emp: Employee) => {
    if (roleFilter !== 'ALL' && emp.role?.toUpperCase() !== roleFilter) return false;
    if (!showInactive && !emp.isActive) return false;
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    return (
      emp.name.toLowerCase().includes(query) ||
      emp.role.toLowerCase().includes(query) ||
      (emp.specialty && emp.specialty.toLowerCase().includes(query)) ||
      emp.phoneNumber.toLowerCase().includes(query)
    );
  });

  const roleWeights: Record<string, number> = { OWNER: 1, ADMIN: 2, STAFF: 3 };

  const sortedEmployees = [...filteredEmployees].sort((a: Employee, b: Employee) => {
    if (a.isActive !== b.isActive) return a.isActive ? -1 : 1;
    const weightA = roleWeights[a.role?.toUpperCase()] || 3;
    const weightB = roleWeights[b.role?.toUpperCase()] || 3;
    if (weightA !== weightB) return weightA - weightB;
    return a.name.localeCompare(b.name);
  });

  const itemsPerPage = 15;
  const totalPages = Math.ceil(sortedEmployees.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedEmployees = sortedEmployees.slice(startIndex, startIndex + itemsPerPage);

  const columns: ColumnDef<Employee>[] = [
    {
      key: 'name',
      header: 'Employee',
      render: (emp) => {
        const initials = emp.name
          .split(' ')
          .map((n: string) => n[0])
          .join('')
          .toUpperCase()
          .substring(0, 2);
        const showUsername =
          emp.username &&
          ((employeeRole === 'ADMIN' && emp.role === 'ADMIN') ||
            (employeeRole === 'OWNER' && (emp.role === 'OWNER' || emp.role === 'ADMIN')));
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                backgroundColor: emp.isActive ? 'rgba(190, 24, 93, 0.08)' : '#E5E7EB',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold',
                color: emp.isActive ? 'var(--accent)' : '#9CA3AF',
                fontSize: '13px',
                fontFamily: 'var(--font-serif)',
              }}
            >
              {initials}
            </div>
            <div>
              <div
                style={{
                  fontWeight: 600,
                  color: emp.isActive ? 'var(--text-primary)' : '#6B7280',
                }}
              >
                {emp.name}
              </div>
              {showUsername && (
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                  @{emp.username}
                </div>
              )}
            </div>
          </div>
        );
      },
    },
    {
      key: 'role',
      header: 'Role',
      render: (emp) => (
        <span
          className="micro-badge"
          style={{
            fontSize: '9px',
            padding: '2px 8px',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            backgroundColor: emp.isActive ? 'rgba(190, 24, 93, 0.06)' : '#E5E7EB',
            color: emp.isActive ? 'var(--accent)' : '#6B7280',
            borderColor: emp.isActive ? 'rgba(190, 24, 93, 0.1)' : '#D1D5DB',
          }}
        >
          {emp.role}
        </span>
      ),
    },
    {
      key: 'specialty',
      header: 'Specialty',
      render: (emp) => (
        <span style={{ color: emp.isActive ? 'var(--text-primary)' : '#6B7280' }}>
          {emp.role?.toUpperCase() === 'OWNER' ? '—' : (emp.specialty ?? 'Generalist')}
        </span>
      ),
    },
    {
      key: 'phone',
      header: 'Phone Number',
      render: (emp) => (
        <span style={{ fontSize: '13px', color: emp.isActive ? 'var(--text-primary)' : '#6B7280' }}>
          {emp.phoneNumber}
        </span>
      ),
    },
    {
      key: 'schedule',
      header: 'Weekly Shift Schedule',
      render: (emp) => {
        if (emp.role?.toUpperCase() === 'OWNER') {
          return <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>—</span>;
        }
        return (
          <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap' }}>
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((dayName, idx) => {
              const sched = emp.schedules?.find((s: EmployeeSchedule) => s.dayOfWeek === idx);
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
                ? `${dayName}: ${isOff ? 'Off' : `${formatTime(sched.startTime || '')} - ${formatTime(sched.endTime || '')}`}`
                : `${dayName}: Off`;
              return (
                <div
                  key={idx}
                  title={title}
                  style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '3px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '9px',
                    fontWeight: 'bold',
                    backgroundColor: isOff ? 'var(--bg-primary)' : 'rgba(190, 24, 93, 0.1)',
                    color: isOff ? 'var(--text-secondary)' : 'var(--accent)',
                    border: `1px solid ${isOff ? 'var(--border-color)' : 'rgba(190, 24, 93, 0.2)'}`,
                    cursor: 'default',
                  }}
                >
                  {dayName}
                </div>
              );
            })}
          </div>
        );
      },
    },
    {
      key: 'status',
      header: 'Status',
      render: (emp) => (
        <span
          className={`status-badge ${emp.isActive ? 'active' : 'inactive'}`}
          style={{ padding: '2px 6px', fontSize: '9px' }}
        >
          {emp.isActive ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      style: { width: '80px', textAlign: 'right' },
      render: (emp) => {
        const canEdit =
          employeeRole === 'OWNER' || (employeeRole === 'ADMIN' && emp.role === 'STAFF');
        if (!canEdit) return null;
        return (
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button
              title="Edit Employee"
              onClick={(e) => {
                e.stopPropagation();
                handleOpenEditModal(emp);
              }}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '2px',
                color: 'var(--text-secondary)',
                transition: 'color 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--accent)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
            >
              <Edit2 size={13} />
            </button>
            <button
              title="Delete Employee"
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteEmployee(emp.id, emp.name);
              }}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '2px',
                color: 'var(--text-secondary)',
                transition: 'color 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#dc2626')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
            >
              <Trash2 size={13} />
            </button>
          </div>
        );
      },
    },
  ];

  return (
    <PageWrapper
      title="Stylists & Shift Directory"
      subtitle="Setup specialties, active flags, and view weekly schedules for your team."
      action={
        <button
          className="btn-primary"
          onClick={handleOpenAddModal}
          style={{ padding: '8px 16px', fontSize: '13px' }}
        >
          + Add Employee
        </button>
      }
    >
      {/* Search & Filter section */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '20px' }}>
        <SearchBar
          value={searchQuery}
          onChange={(v) => {
            setSearchQuery(v);
            setCurrentPage(1);
          }}
          placeholder="Search by name, role, or specialty..."
        />

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px',
            borderTop: '1px solid var(--border-color)',
            paddingTop: '16px',
          }}
        >
          <SegmentedControl
            options={ROLE_FILTER_OPTIONS}
            value={roleFilter}
            onChange={(v) => {
              setRoleFilter(v);
              setCurrentPage(1);
            }}
          />

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              id="show-inactive-checkbox"
              type="checkbox"
              checked={showInactive}
              onChange={(e) => {
                setShowInactive(e.target.checked);
                setCurrentPage(1);
              }}
              style={{
                width: '16px',
                height: '16px',
                accentColor: 'var(--accent)',
                cursor: 'pointer',
              }}
            />
            <label
              htmlFor="show-inactive-checkbox"
              style={{
                fontSize: '13px',
                fontWeight: 500,
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                userSelect: 'none',
              }}
            >
              Show Inactive
            </label>
          </div>
        </div>
      </div>

      {/* Styled Data Table */}
      <DataTable
        columns={columns}
        data={paginatedEmployees}
        keyExtractor={(emp) => emp.id}
        emptyState={
          <EmptyState
            icon={<Users size={32} />}
            title="No stylists matching filters"
            description="Adjust your search terms or add a new team member to get started."
          />
        }
      />

      <PaginationControls
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />

      {/* Unified Employee Form Modal */}
      {isModalOpen && (
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
            {/* Modal Header */}
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
                {editingEmployee ? 'Edit Employee Profile' : 'Add New Employee'}
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '13.5px', margin: 0 }}>
                {editingEmployee
                  ? 'Update employee credentials, role assignments, or active status details.'
                  : employeeRole !== 'OWNER'
                    ? 'Register a new staff technician or nail artist for this branch.'
                    : 'Register a new salon employee. System accounts are created for managers and owners.'}
              </p>
            </div>

            <BaseForm
              onSubmit={handleSubmit}
              errorMsg={errorMsg}
              isPending={submitMutation.isPending}
              submitLabel={editingEmployee ? 'Update Employee' : 'Save Employee'}
              cancelLabel="Cancel"
              onCancel={closeModal}
              bodyStyle={{ padding: '24px 36px' }}
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
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
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
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
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
            </BaseForm>
          </div>
        </ModalShell>
      )}
    </PageWrapper>
  );
}
