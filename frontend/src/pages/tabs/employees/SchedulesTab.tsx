import { useState, useEffect } from 'react';
import type { Branch, Employee } from '../../../types';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../../utils/apiClient';
import { UnsavedChangesModal } from '../../../components/common/UnsavedChangesModal';
import { LoadingSpinner } from '../../../components/common';
import { ScheduleEditor } from './components/ScheduleEditor';

export { UnsavedChangesModal };

interface SchedulesTabProps {
  branches: Branch[];
  selectedBranch: string;
  onScheduleUpdated: () => void;
  setIsDirty?: (dirty: boolean) => void;
}

export function SchedulesTab({ selectedBranch, onScheduleUpdated, setIsDirty }: SchedulesTabProps) {
  const employeeRole = sessionStorage.getItem('employeeRole') || '';

  const { data: employeesData, isPending } = useQuery<Employee[]>({
    queryKey: ['schedulableStaff', selectedBranch, employeeRole],
    queryFn: () => apiClient.get<Employee[]>(`/api/branches/${selectedBranch}/schedulable-staff`),
    enabled: !!selectedBranch,
    staleTime: 30000,
  });

  const employees = employeesData || [];

  const [selectedEmpId, setSelectedEmpId] = useState<string>('');
  const [pendingEmpId, setPendingEmpId] = useState<string | null>(null);
  const [isScheduleDirty, setIsScheduleDirtyState] = useState(false);

  useEffect(() => {
    if (setIsDirty) setIsDirty(isScheduleDirty);
    return () => {
      if (setIsDirty) setIsDirty(false);
    };
  }, [isScheduleDirty, setIsDirty]);

  const handleSelectEmployee = (empId: string) => {
    if (isScheduleDirty) setPendingEmpId(empId);
    else setSelectedEmpId(empId);
  };

  const handleConfirmDiscard = () => {
    setIsScheduleDirtyState(false);
    if (pendingEmpId) setSelectedEmpId(pendingEmpId);
    setPendingEmpId(null);
  };

  const selectedEmp = employees.find((e) => e.id === selectedEmpId) || employees[0];

  return (
    <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
      <UnsavedChangesModal
        isOpen={pendingEmpId !== null}
        onConfirm={handleConfirmDiscard}
        onCancel={() => setPendingEmpId(null)}
      />

      {/* Left sidebar: Employee list */}
      <div
        className="glass-panel"
        style={{
          flex: '1 1 250px',
          padding: '24px',
          minWidth: '220px',
          maxHeight: '70vh',
          overflowY: 'auto',
        }}
      >
        <h3
          style={{
            fontFamily: 'var(--font-serif)',
            color: 'var(--accent)',
            fontSize: '18px',
            fontWeight: 600,
            marginTop: 0,
            marginBottom: '16px',
          }}
        >
          Select Stylist
        </h3>

        {isPending && !employeesData ? (
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              padding: '40px',
              color: 'var(--accent)',
            }}
          >
            <LoadingSpinner size="sm" />
            <span style={{ marginLeft: '12px', fontSize: '14px', fontWeight: 500 }}>
              Loading...
            </span>
          </div>
        ) : employees.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)', fontSize: '13.5px' }}>
            No employees registered in this branch.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {employees.map((emp) => {
              const isSelected = selectedEmp && emp.id === selectedEmp.id;
              return (
                <div
                  key={emp.id}
                  onClick={() => handleSelectEmployee(emp.id)}
                  style={{
                    padding: '12px 16px',
                    borderRadius: '8px',
                    backgroundColor: isSelected ? 'rgba(190, 24, 93, 0.06)' : 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    border: `1px solid ${isSelected ? 'var(--accent)' : 'var(--border-color)'}`,
                    borderLeft: isSelected
                      ? '4px solid var(--accent)'
                      : `1px solid var(--border-color)`,
                  }}
                >
                  <div
                    style={{
                      fontWeight: 600,
                      fontSize: '14.5px',
                      color: isSelected ? 'var(--accent)' : 'var(--text-primary)',
                    }}
                  >
                    {emp.name}
                  </div>
                  <div
                    style={{
                      fontSize: '12px',
                      color: 'var(--text-secondary)',
                      marginTop: '2px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}
                  >
                    {emp.role} • {emp.specialty || 'Generalist'}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Right panel: Weekly Schedule Editor */}
      <div
        className="glass-panel"
        style={{ flex: '3 3 500px', padding: '24px', minWidth: '320px' }}
      >
        {selectedEmp ? (
          <ScheduleEditor
            key={selectedEmp.id}
            selectedEmp={selectedEmp}
            selectedBranch={selectedBranch}
            employeeRole={employeeRole}
            onScheduleUpdated={onScheduleUpdated}
            setIsDirty={setIsScheduleDirtyState}
          />
        ) : (
          <div
            style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-secondary)' }}
          >
            Please select a stylist from the left sidebar to configure their schedule.
          </div>
        )}
      </div>
    </div>
  );
}
