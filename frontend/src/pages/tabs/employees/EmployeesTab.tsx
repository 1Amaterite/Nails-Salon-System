import { useState } from 'react';
import { Users } from 'lucide-react';
import type { Branch, Employee, EmployeeSchedule } from '../../../types';
import { useNotification } from '../../../context/NotificationContext';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../../utils/apiClient';
import {
  PageWrapper,
  DataTable,
  SearchBar,
  SegmentedControl,
  PaginationControls,
  EmptyState,
} from '../../../components/common';
import type { ColumnDef } from '../../../components/common';
import { useModalState } from '../../../utils/hooks';
import { EmployeeFormModal } from './EmployeeFormModal';
import { EmployeeRowActions } from './components/EmployeeRowActions';

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
  const [errorMsg, setErrorMsg] = useState('');

  const handleOpenAddModal = () => {
    setEditingEmployee(null);
    setErrorMsg('');
    openModal();
  };

  const handleOpenEditModal = (emp: Employee) => {
    setEditingEmployee(emp);
    setErrorMsg('');
    openModal();
  };

  const submitMutation = useMutation({
    mutationFn: ({ isEdit, payload }: { isEdit: boolean; payload: EmployeePayload }) => {
      const endpoint =
        isEdit && editingEmployee ? `/api/employees/${editingEmployee.id}` : `/api/employees`;
      return isEdit ? apiClient.put(endpoint, payload) : apiClient.post(endpoint, payload);
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
    mutationFn: (id: string) => apiClient.delete(`/api/employees/${id}`),
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

  const handleFormSubmit = (payload: EmployeePayload) => {
    const isEdit = !!editingEmployee;
    const finalPayload = { ...payload };
    if (!isEdit) {
      finalPayload.branchId = selectedBranch;
    }
    submitMutation.mutate({ isEdit, payload: finalPayload });
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
      render: (emp) => (
        <EmployeeRowActions
          emp={emp}
          employeeRole={employeeRole}
          onEdit={() => handleOpenEditModal(emp)}
          onDelete={() => handleDeleteEmployee(emp.id, emp.name)}
        />
      ),
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

      <EmployeeFormModal
        key={isModalOpen ? editingEmployee?.id || 'new' : 'closed'}
        isOpen={isModalOpen}
        onClose={closeModal}
        editingEmployee={editingEmployee}
        employeeRole={employeeRole}
        onSubmit={handleFormSubmit}
        errorMsg={errorMsg}
        isPending={submitMutation.isPending}
      />
    </PageWrapper>
  );
}
