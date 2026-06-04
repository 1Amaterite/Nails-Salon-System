import React, { useState, useEffect } from 'react';
import { Clock, X } from 'lucide-react';
import type { Branch, Employee, EmployeeSchedule } from '../../types';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchWithTimeout } from '../../utils/api';
import { getApiUrl, getAuthToken } from '../../utils/getApiUrl';
import { InlineAlertBanner } from '../../components/common';
import { UnsavedChangesModal } from '../../components/common/UnsavedChangesModal';
import { TimeSelect12Hour } from '../../components/common/TimeSelect12Hour';

export { UnsavedChangesModal };

interface SchedulesTabProps {
  branches: Branch[];
  selectedBranch: string;
  onScheduleUpdated: () => void;
  setIsDirty?: (dirty: boolean) => void;
}

interface LocalSchedule {
  dayOfWeek: number;
  startTime: string | null;
  endTime: string | null;
  isOff: boolean;
}

export function SchedulesTab({ selectedBranch, onScheduleUpdated, setIsDirty }: SchedulesTabProps) {
  const employeeRole = sessionStorage.getItem('employeeRole') || '';

  const { data: employeesData, isPending } = useQuery<Employee[]>({
    queryKey: ['schedulableStaff', selectedBranch, employeeRole],
    queryFn: async () => {
      const token = getAuthToken();
      const API_URL = getApiUrl();
      const res = await fetchWithTimeout(
        `${API_URL}/api/branches/${selectedBranch}/schedulable-staff`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to fetch schedulable staff');
      }
      return res.json();
    },
    enabled: !!selectedBranch,
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
            <div
              className="spinner"
              style={{
                width: '24px',
                height: '24px',
                border: '2px solid var(--accent-glow)',
                borderTop: '2px solid var(--accent)',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
              }}
            />
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

interface ScheduleEditorProps {
  selectedEmp: Employee;
  selectedBranch: string;
  employeeRole: string;
  onScheduleUpdated: () => void;
  setIsDirty: (dirty: boolean) => void;
}

function ScheduleEditor({
  selectedEmp,
  selectedBranch,
  employeeRole,
  onScheduleUpdated,
  setIsDirty,
}: ScheduleEditorProps) {
  const queryClient = useQueryClient();

  const [schedules, setSchedules] = useState<LocalSchedule[]>(() => {
    if (!selectedEmp.schedules || selectedEmp.schedules.length === 0) {
      return [];
    }
    return Array.from({ length: 7 }, (_, idx) => {
      const existing = selectedEmp.schedules?.find((s) => s.dayOfWeek === idx);
      return existing
        ? {
            dayOfWeek: idx,
            startTime: existing.startTime || '09:00',
            endTime: existing.endTime || '17:00',
            isOff: existing.isOff,
          }
        : { dayOfWeek: idx, startTime: '09:00', endTime: '17:00', isOff: true };
    });
  });

  const [originalSchedules, setOriginalSchedules] = useState<LocalSchedule[]>(() => {
    if (!selectedEmp.schedules || selectedEmp.schedules.length === 0) {
      return [];
    }
    return Array.from({ length: 7 }, (_, idx) => {
      const existing = selectedEmp.schedules?.find((s) => s.dayOfWeek === idx);
      return existing
        ? {
            dayOfWeek: idx,
            startTime: existing.startTime || '09:00',
            endTime: existing.endTime || '17:00',
            isOff: existing.isOff,
          }
        : { dayOfWeek: idx, startTime: '09:00', endTime: '17:00', isOff: true };
    });
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showTemplateDropdown, setShowTemplateDropdown] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const isDirty = JSON.stringify(schedules) !== JSON.stringify(originalSchedules);

  useEffect(() => {
    setIsDirty(isDirty);
    return () => {
      setIsDirty(false);
    };
  }, [isDirty, setIsDirty]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue =
          'You have unsaved changes. If you leave this page, your edits to the schedule will be lost. Are you sure you want to discard them?';
        return e.returnValue;
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  const applyStandardWeek = () => {
    setSchedules(
      Array.from({ length: 7 }, (_, idx) => ({
        dayOfWeek: idx,
        startTime: '09:00',
        endTime: '17:00',
        isOff: idx === 0 || idx === 6,
      }))
    );
    setSuccess('Standard week template loaded. Remember to click Save.');
  };

  const applyStandardWeekFromEmpty = () => {
    setSchedules(
      Array.from({ length: 7 }, (_, idx) => ({
        dayOfWeek: idx,
        startTime: '09:00',
        endTime: '17:00',
        isOff: idx === 0 || idx === 6,
      }))
    );
    setSuccess('Standard week template loaded. Remember to click Save.');
  };

  const applyAllOff = () => {
    setSchedules(
      Array.from({ length: 7 }, (_, idx) => {
        const existing = schedules.find((s) => s.dayOfWeek === idx) || schedules[idx];
        return {
          dayOfWeek: idx,
          startTime: existing?.startTime || '09:00',
          endTime: existing?.endTime || '17:00',
          isOff: true,
        };
      })
    );
    setSuccess('All days set to Day Off. Remember to click Save.');
  };

  const handleClearDay = (idx: number) => {
    setSchedules(
      Array.from({ length: 7 }, (_, i) => {
        const existing = schedules.find((s) => s.dayOfWeek === i) || schedules[i];
        if (i === idx) return { dayOfWeek: i, startTime: null, endTime: null, isOff: true };
        return existing
          ? { ...existing }
          : { dayOfWeek: i, startTime: '09:00', endTime: '17:00', isOff: true };
      })
    );
  };

  const mutation = useMutation({
    mutationFn: async (updatedSchedules: LocalSchedule[]) => {
      const token = getAuthToken();
      const API_URL = getApiUrl();

      const response = await fetchWithTimeout(`${API_URL}/api/employees/${selectedEmp.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ schedules: updatedSchedules }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to update schedule.');
      return data;
    },
    onMutate: async (updatedSchedules) => {
      await queryClient.cancelQueries({
        queryKey: ['schedulableStaff', selectedBranch, employeeRole],
      });
      const previousStaff = queryClient.getQueryData([
        'schedulableStaff',
        selectedBranch,
        employeeRole,
      ]);
      if (previousStaff) {
        queryClient.setQueryData(
          ['schedulableStaff', selectedBranch, employeeRole],
          (old: Employee[] | undefined) => {
            if (!old) return old;
            return old.map((emp) =>
              emp.id === selectedEmp.id
                ? { ...emp, schedules: updatedSchedules as EmployeeSchedule[] }
                : emp
            );
          }
        );
      }
      return { previousStaff };
    },
    onError: (err: Error, _variables, context) => {
      if (context?.previousStaff) {
        queryClient.setQueryData(
          ['schedulableStaff', selectedBranch, employeeRole],
          context.previousStaff
        );
      }
      setError(err.message || 'Network error. Failed to connect to server.');
    },
    onSuccess: () => {
      setSuccess('Schedules saved successfully!');
      setOriginalSchedules(JSON.parse(JSON.stringify(schedules)));
      onScheduleUpdated();
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ['schedulableStaff', selectedBranch, employeeRole],
      });
    },
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    mutation.mutate(schedules);
  };

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <form onSubmit={handleSave}>
      {/* Sticky header */}
      <div
        style={{
          position: 'sticky',
          top: '-24px',
          backgroundColor: 'var(--bg-glass-panel, var(--bg-primary))',
          backdropFilter: 'blur(12px)',
          zIndex: 10,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          borderBottom: '1px solid var(--border-color)',
          margin: '-24px -24px 20px -24px',
          padding: '24px 24px 16px 24px',
          borderTopLeftRadius: '16px',
          borderTopRightRadius: '16px',
        }}
      >
        <div style={{ flex: '1 1 300px', minWidth: '200px' }}>
          <h3
            style={{
              fontFamily: 'var(--font-serif)',
              color: 'var(--accent)',
              fontSize: '20px',
              fontWeight: 600,
              margin: 0,
            }}
          >
            Weekly Shift Schedule
          </h3>
          <p
            style={{
              color: 'var(--text-secondary)',
              fontSize: '13.5px',
              marginTop: '4px',
              marginBottom: 0,
            }}
          >
            Define which days and times <strong>{selectedEmp.name}</strong> is available for
            clients.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexShrink: 0 }}>
          {/* Template Dropdown */}
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              onClick={() => setShowTemplateDropdown(!showTemplateDropdown)}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                border: '1px solid var(--border-color)',
                backgroundColor: 'white',
                color: 'var(--text-primary)',
                fontSize: '13px',
                fontWeight: 500,
                cursor: 'pointer',
                height: '38px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              }}
            >
              <span>Schedule Templates</span>
              <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>▼</span>
            </button>
            {showTemplateDropdown && (
              <>
                <div
                  onClick={() => setShowTemplateDropdown(false)}
                  style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 998 }}
                />
                <div
                  style={{
                    position: 'absolute',
                    top: '44px',
                    right: 0,
                    backgroundColor: 'white',
                    border: '1px solid rgba(190, 24, 93, 0.1)',
                    borderRadius: '8px',
                    boxShadow:
                      '0 10px 25px -5px rgba(190, 24, 93, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)',
                    width: '240px',
                    zIndex: 999,
                    padding: '4px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2px',
                  }}
                >
                  {[
                    { label: 'Standard Week (Mon-Fri 9-5)', action: applyStandardWeek },
                    { label: 'Set All Off-Duty', action: applyAllOff },
                  ].map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onMouseEnter={() => setHoveredIndex(idx)}
                      onMouseLeave={() => setHoveredIndex(null)}
                      onClick={() => {
                        item.action();
                        setShowTemplateDropdown(false);
                      }}
                      style={{
                        padding: '10px 12px',
                        border: 'none',
                        backgroundColor:
                          hoveredIndex === idx ? 'rgba(190, 24, 93, 0.06)' : 'transparent',
                        color: hoveredIndex === idx ? 'var(--accent)' : 'var(--text-primary)',
                        fontSize: '13px',
                        textAlign: 'left',
                        cursor: 'pointer',
                        borderRadius: '6px',
                        transition: 'all 0.15s',
                        fontWeight: 500,
                      }}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          <button
            type="submit"
            className="btn-primary"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              height: '38px',
            }}
          >
            <Clock size={16} /> Save Weekly Schedule
          </button>
        </div>
      </div>

      <InlineAlertBanner type="success" message={success} />
      <InlineAlertBanner type="error" message={error} />

      {/* Empty state: no schedule defined */}
      {schedules.length === 0 && (
        <div
          className="data-card"
          style={{
            padding: '24px',
            marginBottom: '24px',
            backgroundColor: 'rgba(190, 24, 93, 0.02)',
            border: '1.5px dashed var(--accent)',
            borderRadius: '12px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            textAlign: 'center',
            boxShadow: 'none',
          }}
        >
          <div style={{ fontWeight: 600, fontSize: '15px', color: 'var(--text-primary)' }}>
            No schedule defined for this stylist.
          </div>
          <button
            type="button"
            className="btn-primary"
            onClick={applyStandardWeekFromEmpty}
            style={{
              backgroundColor: 'var(--accent)',
              color: '#FFFFFF',
              border: 'none',
              padding: '10px 24px',
              fontSize: '13.5px',
              fontWeight: 600,
              borderRadius: '6px',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            Apply Standard Week (Mon-Fri, 9am-5pm)
          </button>
        </div>
      )}

      {/* 7-Column Calendar */}
      <div style={{ overflowX: 'auto', paddingBottom: '24px', width: '100%', borderRadius: '8px' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
            gap: '12px',
            minWidth: '800px',
          }}
        >
          {dayNames.map((dayName, idx) => {
            const daySched = schedules[idx] || {
              dayOfWeek: idx,
              startTime: '09:00',
              endTime: '17:00',
              isOff: true,
            };

            return (
              <div
                key={idx}
                style={{
                  padding: '14px 10px',
                  borderRadius: '10px',
                  backgroundColor: 'var(--bg-secondary)',
                  border: `1px solid ${daySched.isOff ? 'var(--border-color)' : 'rgba(190, 24, 93, 0.15)'}`,
                  boxShadow: daySched.isOff ? 'none' : '0 4px 12px rgba(190, 24, 93, 0.03)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                  alignItems: 'stretch',
                  minWidth: '100px',
                }}
              >
                {/* Day header */}
                <div
                  style={{
                    position: 'relative',
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderBottom: '1px solid var(--border-color)',
                    paddingBottom: '8px',
                    paddingLeft: '16px',
                    paddingRight: '16px',
                    width: '100%',
                  }}
                >
                  <span
                    title={dayName}
                    style={{
                      fontWeight: 600,
                      fontSize: '13.5px',
                      color: 'var(--text-primary)',
                      maxWidth: 'calc(100% - 20px)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: 'inline-block',
                    }}
                  >
                    {dayName}
                  </span>

                  {!daySched.isOff && (
                    <button
                      type="button"
                      onClick={() => handleClearDay(idx)}
                      title="Remove hours"
                      style={{
                        position: 'absolute',
                        right: '0px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        marginTop: '-4px',
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-secondary)',
                        cursor: 'pointer',
                        padding: '2px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '4px',
                        transition: 'all 0.15s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = '#b91c1c';
                        e.currentTarget.style.backgroundColor = 'rgba(185, 28, 28, 0.08)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = 'var(--text-secondary)';
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>

                {/* Day content */}
                {daySched.isOff ? (
                  <div
                    style={{ display: 'flex', flexDirection: 'column', gap: '12px', flexGrow: 1 }}
                  >
                    <div
                      onClick={() => {
                        const updated = Array.from({ length: 7 }, (_, i) => {
                          if (i === idx)
                            return {
                              dayOfWeek: i,
                              startTime: '09:00',
                              endTime: '17:00',
                              isOff: false,
                            };
                          const existing = schedules.find((s) => s.dayOfWeek === i);
                          return existing
                            ? { ...existing }
                            : { dayOfWeek: i, startTime: '09:00', endTime: '17:00', isOff: true };
                        });
                        setSchedules(updated);
                      }}
                      style={{
                        border: '1.5px dashed rgba(190, 24, 93, 0.25)',
                        borderRadius: '8px',
                        padding: '24px 8px',
                        textAlign: 'center',
                        cursor: 'pointer',
                        backgroundColor: 'transparent',
                        transition: 'all 0.2s ease-in-out',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexGrow: 1,
                        minHeight: '100px',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(190, 24, 93, 0.04)';
                        e.currentTarget.style.borderColor = 'rgba(190, 24, 93, 0.45)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.borderColor = 'rgba(190, 24, 93, 0.25)';
                      }}
                    >
                      <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--accent)' }}>
                        + Add Hours
                      </span>
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px',
                        marginTop: 'auto',
                      }}
                    >
                      {[
                        { key: 'morning', label: 'Morning (9-1)', start: '09:00', end: '13:00' },
                        {
                          key: 'afternoon',
                          label: 'Afternoon (1-5)',
                          start: '13:00',
                          end: '17:00',
                        },
                        { key: 'full', label: 'Full Day (9-5)', start: '09:00', end: '17:00' },
                      ].map((p) => (
                        <button
                          key={p.key}
                          type="button"
                          onClick={() => {
                            const updated = Array.from({ length: 7 }, (_, i) => {
                              if (i === idx)
                                return {
                                  dayOfWeek: i,
                                  startTime: p.start,
                                  endTime: p.end,
                                  isOff: false,
                                };
                              const existing = schedules.find((s) => s.dayOfWeek === i);
                              return existing
                                ? { ...existing }
                                : {
                                    dayOfWeek: i,
                                    startTime: '09:00',
                                    endTime: '17:00',
                                    isOff: true,
                                  };
                            });
                            setSchedules(updated);
                          }}
                          style={{
                            padding: '5px 2px',
                            width: '100%',
                            borderRadius: '4px',
                            border: '1px solid var(--border-color)',
                            backgroundColor: 'transparent',
                            color: 'var(--text-secondary)',
                            fontSize: '9px',
                            fontWeight: 500,
                            cursor: 'pointer',
                            transition: 'all 0.15s',
                            textAlign: 'center',
                            whiteSpace: 'nowrap',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'rgba(190, 24, 93, 0.03)';
                            e.currentTarget.style.borderColor = 'rgba(190, 24, 93, 0.2)';
                            e.currentTarget.style.color = 'var(--accent)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                            e.currentTarget.style.borderColor = 'var(--border-color)';
                            e.currentTarget.style.color = 'var(--text-secondary)';
                          }}
                        >
                          {p.label.split(' ')[0]}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                      flexGrow: 1,
                      justifyContent: 'space-between',
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <TimeSelect12Hour
                        label="Start"
                        value24={daySched.startTime || '09:00'}
                        onChange={(val) => {
                          const updated = Array.from({ length: 7 }, (_, i) => {
                            const existing =
                              schedules.find((s) => s.dayOfWeek === i) || schedules[i];
                            if (i === idx) return { ...daySched, startTime: val };
                            return existing
                              ? { ...existing }
                              : { dayOfWeek: i, startTime: '09:00', endTime: '17:00', isOff: true };
                          });
                          setSchedules(updated);
                        }}
                      />
                      <TimeSelect12Hour
                        label="End"
                        value24={daySched.endTime || '17:00'}
                        relativeTo24={daySched.startTime || undefined}
                        onChange={(val) => {
                          const updated = Array.from({ length: 7 }, (_, i) => {
                            const existing =
                              schedules.find((s) => s.dayOfWeek === i) || schedules[i];
                            if (i === idx) return { ...daySched, endTime: val };
                            return existing
                              ? { ...existing }
                              : { dayOfWeek: i, startTime: '09:00', endTime: '17:00', isOff: true };
                          });
                          setSchedules(updated);
                        }}
                      />
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px',
                        marginTop: '10px',
                      }}
                    >
                      {[
                        { key: 'morning', label: 'Morning (9-1)', start: '09:00', end: '13:00' },
                        {
                          key: 'afternoon',
                          label: 'Afternoon (1-5)',
                          start: '13:00',
                          end: '17:00',
                        },
                        { key: 'full', label: 'Full Day (9-5)', start: '09:00', end: '17:00' },
                      ].map((p) => {
                        const isPresetSelected =
                          daySched.startTime === p.start && daySched.endTime === p.end;
                        return (
                          <button
                            key={p.key}
                            type="button"
                            onClick={() => {
                              const updated = Array.from({ length: 7 }, (_, i) => {
                                const existing =
                                  schedules.find((s) => s.dayOfWeek === i) || schedules[i];
                                if (i === idx)
                                  return { ...daySched, startTime: p.start, endTime: p.end };
                                return existing
                                  ? { ...existing }
                                  : {
                                      dayOfWeek: i,
                                      startTime: '09:00',
                                      endTime: '17:00',
                                      isOff: true,
                                    };
                              });
                              setSchedules(updated);
                            }}
                            style={{
                              padding: '5px 2px',
                              width: '100%',
                              borderRadius: '4px',
                              border:
                                '1px solid ' +
                                (isPresetSelected
                                  ? 'rgba(190, 24, 93, 0.4)'
                                  : 'var(--border-color)'),
                              backgroundColor: isPresetSelected
                                ? 'rgba(190, 24, 93, 0.08)'
                                : 'transparent',
                              color: isPresetSelected ? 'var(--accent)' : 'var(--text-secondary)',
                              fontSize: '9px',
                              fontWeight: isPresetSelected ? 600 : 500,
                              cursor: 'pointer',
                              transition: 'all 0.15s',
                              textAlign: 'center',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {p.label.split(' ')[0]}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </form>
  );
}
