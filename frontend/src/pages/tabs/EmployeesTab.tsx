import React, { useState } from 'react';
import { Edit2, Trash2 } from 'lucide-react';
import type { Branch, Employee, EmployeeSchedule } from '../../types';
import { useNotification } from '../../context/NotificationContext';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchWithTimeout } from '../../utils/api';
import { getApiUrl, getAuthToken } from '../../utils/getApiUrl';
import {
  PageHeader,
  SearchBar,
  SegmentedControl,
  PaginationControls,
  ModalShell,
  FormErrorBanner,
} from '../../components/common';

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

  // Search & filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('ALL');
  const [showInactive, setShowInactive] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  // Consolidated Modal & Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
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
    setIsModalOpen(true);
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
    setIsModalOpen(true);
  };

  const queryClient = useQueryClient();

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
      setIsModalOpen(false);
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
      name: formData.name,
      role: formData.role as 'OWNER' | 'ADMIN' | 'STAFF',
      phoneNumber: formData.phoneNumber,
      specialty: formData.specialty || undefined,
    };

    if (formData.role === 'ADMIN' || formData.role === 'OWNER') {
      payload.username = formData.username.replace(/@/g, '');
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

  return (
    <>
      <div className="glass-panel">
        {/* Search Bar and Header Row */}
        <div
          style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}
        >
          <PageHeader
            title="Stylists & Shift Schedules"
            subtitle="Setup specialties, active flags, and weekly schedules for your team."
            action={
              <button
                className="btn-primary"
                onClick={handleOpenAddModal}
                style={{ padding: '8px 16px', fontSize: '13px' }}
              >
                + Add Employee
              </button>
            }
            marginBottom={0}
          />

          <SearchBar
            value={searchQuery}
            onChange={(v) => {
              setSearchQuery(v);
              setCurrentPage(1);
            }}
            placeholder="Search by name, role, or specialty..."
          />

          {/* Filter Segmented Control & Show Inactive Switch */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '16px',
              borderTop: '1px solid var(--border-color)',
              paddingTop: '16px',
              marginTop: '4px',
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

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '20px',
            marginTop: '20px',
            alignItems: 'start',
          }}
        >
          {(() => {
            return paginatedEmployees.map((emp: Employee, index: number) => {
              const initials = emp.name
                .split(' ')
                .map((n: string) => n[0])
                .join('')
                .toUpperCase()
                .substring(0, 2);
              const roleNormalized = emp.role?.toUpperCase() || 'STAFF';

              let dividerHeader: string | null = null;
              if (roleFilter === 'ALL') {
                const prevEmp = index > 0 ? paginatedEmployees[index - 1] : null;
                const prevRole = prevEmp
                  ? prevEmp.isActive
                    ? prevEmp.role?.toUpperCase() || 'STAFF'
                    : 'INACTIVE'
                  : null;
                const currentRole = emp.isActive ? roleNormalized : 'INACTIVE';
                if (currentRole !== prevRole) {
                  if (currentRole === 'INACTIVE') {
                    dividerHeader = 'Inactive Accounts';
                  } else {
                    dividerHeader =
                      currentRole === 'OWNER'
                        ? 'Owners'
                        : currentRole === 'ADMIN'
                          ? 'Admins'
                          : 'Staff';
                  }
                }
              }

              return (
                <React.Fragment key={emp.id}>
                  {dividerHeader && (
                    <div
                      style={{
                        gridColumn: '1 / -1',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px',
                        marginTop: '24px',
                        marginBottom: '12px',
                        width: '100%',
                      }}
                    >
                      <h4
                        style={{
                          margin: 0,
                          fontSize: '14px',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          color: 'var(--text-secondary)',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {dividerHeader}
                      </h4>
                      <div
                        style={{
                          flexGrow: 1,
                          height: '1px',
                          backgroundColor: 'var(--border-color)',
                        }}
                      />
                    </div>
                  )}
                  <div
                    className="data-card"
                    style={{
                      padding: '16px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      alignSelf: 'start',
                      opacity: emp.isActive ? 1 : 0.65,
                      backgroundColor: emp.isActive ? 'var(--bg-secondary)' : '#F9FAFB',
                      color: emp.isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                      border: emp.isActive ? '1px solid var(--border-color)' : '1px solid #E5E7EB',
                    }}
                  >
                    <div>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          marginBottom: '12px',
                        }}
                      >
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                          <div
                            style={{
                              width: '40px',
                              height: '40px',
                              borderRadius: '50%',
                              backgroundColor: emp.isActive ? 'rgba(190, 24, 93, 0.08)' : '#E5E7EB',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 'bold',
                              color: emp.isActive ? 'var(--accent)' : '#9CA3AF',
                              fontSize: '14px',
                              fontFamily: 'var(--font-serif)',
                            }}
                          >
                            {initials}
                          </div>
                          <div>
                            <h4
                              style={{
                                fontWeight: 600,
                                fontSize: '15px',
                                color: emp.isActive ? 'var(--text-primary)' : '#6B7280',
                                margin: 0,
                              }}
                            >
                              {emp.name}
                            </h4>
                            <div style={{ display: 'flex', gap: '4px', marginTop: '2px' }}>
                              <span
                                className="micro-badge"
                                style={{
                                  fontSize: '8.5px',
                                  padding: '2px 8px',
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.05em',
                                  backgroundColor: emp.isActive
                                    ? 'rgba(190, 24, 93, 0.06)'
                                    : '#E5E7EB',
                                  color: emp.isActive ? 'var(--accent)' : '#6B7280',
                                  borderColor: emp.isActive ? 'rgba(190, 24, 93, 0.1)' : '#D1D5DB',
                                }}
                              >
                                {emp.role}
                              </span>
                              {emp.isActive && (
                                <span
                                  className="status-badge active"
                                  style={{ padding: '2px 6px', fontSize: '8.5px' }}
                                >
                                  On Shift
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Actions Column */}
                        <div
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'flex-end',
                            gap: '4px',
                          }}
                        >
                          <span
                            className={`status-badge ${emp.isActive ? 'active' : 'inactive'}`}
                            style={{ padding: '3px 6px', fontSize: '9px' }}
                          >
                            {emp.isActive ? 'Active' : 'Inactive'}
                          </span>
                          {(employeeRole === 'OWNER' ||
                            (employeeRole === 'ADMIN' && emp.role === 'STAFF')) && (
                            <div style={{ display: 'flex', gap: '6px', marginTop: '2px' }}>
                              <button
                                title="Edit Employee"
                                onClick={() => handleOpenEditModal(emp)}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  cursor: 'pointer',
                                  padding: '2px',
                                  color: 'var(--text-secondary)',
                                  transition: 'color 0.2s',
                                }}
                                onMouseEnter={(e) =>
                                  (e.currentTarget.style.color = 'var(--accent)')
                                }
                                onMouseLeave={(e) =>
                                  (e.currentTarget.style.color = 'var(--text-secondary)')
                                }
                              >
                                <Edit2 size={13} />
                              </button>
                              <button
                                title="Delete Employee"
                                onClick={() => handleDeleteEmployee(emp.id, emp.name)}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  cursor: 'pointer',
                                  padding: '2px',
                                  color: 'var(--text-secondary)',
                                  transition: 'color 0.2s',
                                }}
                                onMouseEnter={(e) => (e.currentTarget.style.color = '#dc2626')}
                                onMouseLeave={(e) =>
                                  (e.currentTarget.style.color = 'var(--text-secondary)')
                                }
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      <div
                        style={{
                          borderTop: emp.isActive
                            ? '1px solid var(--border-color)'
                            : '1px solid #E5E7EB',
                          paddingTop: '8px',
                          marginTop: '2px',
                        }}
                      >
                        {emp.role?.toUpperCase() !== 'OWNER' && (
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              fontSize: '12.5px',
                              marginBottom: '4px',
                            }}
                          >
                            <span
                              style={{ color: emp.isActive ? 'var(--text-secondary)' : '#9CA3AF' }}
                            >
                              Specialty
                            </span>
                            <strong
                              style={{ color: emp.isActive ? 'var(--text-primary)' : '#6B7280' }}
                            >
                              {emp.specialty || 'Generalist'}
                            </strong>
                          </div>
                        )}
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            fontSize: '12.5px',
                            marginBottom: '4px',
                          }}
                        >
                          <span
                            style={{ color: emp.isActive ? 'var(--text-secondary)' : '#9CA3AF' }}
                          >
                            Phone
                          </span>
                          <span
                            style={{
                              color: emp.isActive ? 'var(--text-primary)' : '#6B7280',
                              fontWeight: 500,
                            }}
                          >
                            {emp.phoneNumber}
                          </span>
                        </div>
                        {(() => {
                          const showUsername =
                            emp.username &&
                            ((employeeRole === 'ADMIN' && emp.role === 'ADMIN') ||
                              (employeeRole === 'OWNER' &&
                                (emp.role === 'OWNER' || emp.role === 'ADMIN')));
                          if (!showUsername) return null;
                          return (
                            <div
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                fontSize: '12.5px',
                                marginBottom: '4px',
                              }}
                            >
                              <span
                                style={{
                                  color: emp.isActive ? 'var(--text-secondary)' : '#9CA3AF',
                                }}
                              >
                                Username
                              </span>
                              <span
                                style={{
                                  color: emp.isActive ? 'var(--text-primary)' : '#6B7280',
                                  fontWeight: 500,
                                }}
                              >
                                {emp.username}
                              </span>
                            </div>
                          );
                        })()}
                      </div>
                    </div>

                    {emp.role?.toUpperCase() !== 'OWNER' && emp.isActive ? (
                      <div
                        style={{
                          borderTop: '1px solid var(--border-color)',
                          paddingTop: '8px',
                          marginTop: '8px',
                        }}
                      >
                        <div
                          style={{
                            fontSize: '10px',
                            fontWeight: 600,
                            color: 'var(--text-primary)',
                            marginBottom: '4px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                          }}
                        >
                          Weekly Shift Schedule
                        </div>
                        <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap' }}>
                          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((dayName, idx) => {
                            const sched = emp.schedules?.find(
                              (s: EmployeeSchedule) => s.dayOfWeek === idx
                            );
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
                                  width: '22px',
                                  height: '22px',
                                  borderRadius: '3px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '9.5px',
                                  fontWeight: 'bold',
                                  backgroundColor: isOff
                                    ? 'var(--bg-secondary)'
                                    : 'rgba(190, 24, 93, 0.1)',
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
                      </div>
                    ) : null}
                  </div>
                </React.Fragment>
              );
            });
          })()}
        </div>

        <PaginationControls
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>

      {/* Unified Employee Form Modal (Handles Add and Edit) */}
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

              {/* Scrollable Content Body */}
              <div
                className="modal-scroll-body"
                style={{
                  overflowY: 'auto',
                  padding: '24px 36px',
                  flexGrow: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                }}
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
                        {editingEmployee
                          ? 'New Password (leave blank to keep current)'
                          : 'Password'}
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

                <FormErrorBanner message={errorMsg} />
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
                  onClick={() => setIsModalOpen(false)}
                  style={{
                    background: 'transparent',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-secondary)',
                    boxShadow: 'none',
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={submitMutation.isPending}>
                  {submitMutation.isPending ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      <span
                        style={{
                          width: '12px',
                          height: '12px',
                          border: '2px solid rgba(255,255,255,0.3)',
                          borderRadius: '50%',
                          borderTopColor: '#fff',
                          animation: 'spin 1s linear infinite',
                          display: 'inline-block',
                        }}
                      ></span>
                      Saving...
                    </span>
                  ) : editingEmployee ? (
                    'Update Employee'
                  ) : (
                    'Save Employee'
                  )}
                </button>
              </div>
            </form>
          </div>
        </ModalShell>
      )}
    </>
  );
}
