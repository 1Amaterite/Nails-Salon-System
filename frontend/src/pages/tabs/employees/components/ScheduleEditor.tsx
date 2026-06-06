import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchWithTimeout } from '../../../../utils/api';
import { getApiUrl, getAuthToken } from '../../../../utils/getApiUrl';
import { InlineAlertBanner } from '../../../../components/common';
import type { Employee, EmployeeSchedule } from '../../../../types';
import { TemplateSelector } from './TemplateSelector';
import { DayScheduleCard } from './DayScheduleCard';

interface LocalSchedule {
  dayOfWeek: number;
  startTime: string | null;
  endTime: string | null;
  isOff: boolean;
}

interface ScheduleEditorProps {
  selectedEmp: Employee;
  selectedBranch: string;
  employeeRole: string;
  onScheduleUpdated: () => void;
  setIsDirty: (dirty: boolean) => void;
}

const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function ScheduleEditor({
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

  const handleDayChange = (idx: number, updatedDaySched: LocalSchedule) => {
    setSchedules(
      Array.from({ length: 7 }, (_, i) => {
        if (i === idx) return updatedDaySched;
        const existing = schedules.find((s) => s.dayOfWeek === i) || schedules[i];
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
        body: JSON.stringify({
          schedules: updatedSchedules.map((s) => ({ ...s, branchId: selectedBranch })),
        }),
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
          <TemplateSelector onApplyStandardWeek={applyStandardWeek} onApplyAllOff={applyAllOff} />

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
              <DayScheduleCard
                key={idx}
                idx={idx}
                dayName={dayName}
                daySched={daySched}
                onChange={handleDayChange}
                onClear={handleClearDay}
              />
            );
          })}
        </div>
      </div>
    </form>
  );
}
