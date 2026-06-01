import React, { useState, useEffect, useRef } from 'react';
import { Clock, X } from 'lucide-react';
import type { Branch } from '../../types';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchWithTimeout } from '../../utils/api';
import { getApiUrl, getAuthToken } from '../../utils/getApiUrl';
import { ModalShell, InlineAlertBanner } from '../../components/common';

interface SchedulesTabProps {
  branches: Branch[];
  selectedBranch: string;
  onScheduleUpdated: () => void;
  setIsDirty?: (dirty: boolean) => void;
}

/** Keeps the exported name for any consumer that imports it from this file. */
export function UnsavedChangesModal({ isOpen, onConfirm, onCancel }: { isOpen: boolean; onConfirm: () => void; onCancel: () => void }) {
  if (!isOpen) return null;
  return (
    <ModalShell maxWidth="400px">
      <div className="inner-core" style={{ padding: '28px', textAlign: 'center' }}>
        <h3 style={{ fontFamily: 'var(--font-serif)', color: 'var(--accent)', fontSize: '20px', fontWeight: 600, margin: '0 0 12px 0' }}>
          Unsaved Changes
        </h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '13.5px', lineHeight: '1.5', margin: '0 0 24px 0' }}>
          You have unsaved changes. If you leave this page, your edits to the schedule will be lost. Are you sure you want to discard them?
        </p>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <button
            type="button"
            className="btn-primary"
            onClick={onCancel}
            style={{ background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', boxShadow: 'none', padding: '8px 16px', fontSize: '13px' }}
          >
            Keep Editing
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={onConfirm}
            style={{ backgroundColor: 'var(--accent)', color: 'white', padding: '8px 16px', fontSize: '13px' }}
          >
            Discard Changes
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

export function time12to24(time12: string): string {
  if (!time12) return '09:00';
  const [time, period] = time12.split(' ');
  let [hourStr, minStr] = time.split(':');
  let hour = parseInt(hourStr, 10);
  if (period === 'PM' && hour < 12) hour += 12;
  if (period === 'AM' && hour === 12) hour = 0;
  const hStr = hour < 10 ? `0${hour}` : `${hour}`;
  return `${hStr}:${minStr}`;
}

export function time24to12(time24: string): string {
  if (!time24) return '09:00 AM';
  const [hourStr, minStr] = time24.split(':');
  const hour = parseInt(hourStr, 10);
  const period = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  const hStr = hour12 < 10 ? `0${hour12}` : `${hour12}`;
  return `${hStr}:${minStr} ${period}`;
}

export function generateTimeOptions(): string[] {
  const options = [];
  const periods = ['AM', 'PM'];
  for (let p = 0; p < 2; p++) {
    const period = periods[p];
    for (let h = 0; h < 12; h++) {
      const hour = h === 0 ? 12 : h;
      const hourStr = hour < 10 ? `0${hour}` : `${hour}`;
      for (let m = 0; m < 60; m += 15) {
        const minStr = m < 10 ? `0${m}` : `${m}`;
        options.push(`${hourStr}:${minStr} ${period}`);
      }
    }
  }
  return options;
}

interface TimeSelect12HourProps {
  label: string;
  value24: string;
  onChange: (newValue24: string) => void;
  relativeTo24?: string;
}

export function TimeSelect12Hour({ label, value24, onChange, relativeTo24 }: TimeSelect12HourProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const timeOptions = generateTimeOptions();
  const currentValue12 = time24to12(value24);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && listRef.current) {
      const activeItem = listRef.current.querySelector('[data-active="true"]');
      if (activeItem) activeItem.scrollIntoView({ block: 'nearest' });
    }
  }, [isOpen]);

  const handleSelect = (opt: string) => {
    onChange(time12to24(opt));
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} style={{ width: '100%', position: 'relative' }}>
      <span style={{ fontSize: '10.5px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.02em' }}>
        {label}
      </span>
      <div
        onClick={() => setIsOpen(!isOpen)}
        style={{
          height: '32px', fontSize: '11.5px', padding: '0 8px', borderRadius: '6px',
          border: '1px solid rgba(190, 24, 93, 0.15)', backgroundColor: 'white',
          color: 'var(--text-primary)', cursor: 'pointer', width: '100%', fontWeight: 500,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          boxShadow: '0 1px 2px rgba(0,0,0,0.02)', userSelect: 'none', position: 'relative'
        }}
      >
        <span>{currentValue12}</span>
        <span style={{ fontSize: '9px', color: 'var(--text-secondary)', transition: 'transform 0.2s', transform: isOpen ? 'rotate(180deg)' : 'none' }}>▼</span>
      </div>

      {isOpen && (
        <div
          ref={listRef}
          style={{
            position: 'absolute', top: 'calc(100% + 4px)', left: '50%',
            transform: 'translateX(-50%)', width: '155px', maxHeight: '180px',
            overflowY: 'auto', backgroundColor: 'white',
            border: '1px solid rgba(190, 24, 93, 0.15)', borderRadius: '8px',
            boxShadow: '0 10px 25px rgba(190, 24, 93, 0.12)', zIndex: 1000,
            padding: '4px', display: 'flex', flexDirection: 'column', gap: '2px'
          }}
        >
          {timeOptions.map(opt => {
            const opt24 = time12to24(opt);
            const isSelected = opt24 === value24;

            let durationLabel = '';
            if (relativeTo24) {
              const startParts = relativeTo24.split(':').map(Number);
              const endParts = opt24.split(':').map(Number);
              const startTotal = startParts[0] * 60 + startParts[1];
              const endTotal = endParts[0] * 60 + endParts[1];
              const diff = endTotal - startTotal;
              if (diff > 0) {
                const h = Math.floor(diff / 60);
                const m = diff % 60;
                if (h > 0 && m > 0) durationLabel = `(${h}h ${m}m)`;
                else if (h > 0) durationLabel = `(${h}h)`;
                else durationLabel = `(${m}m)`;
              }
            }

            return (
              <div
                key={opt}
                data-active={isSelected}
                onClick={() => handleSelect(opt)}
                style={{
                  padding: '6px 8px', borderRadius: '4px',
                  backgroundColor: isSelected ? 'rgba(190, 24, 93, 0.08)' : 'transparent',
                  color: isSelected ? 'var(--accent)' : 'var(--text-primary)',
                  fontSize: '11px', fontWeight: isSelected ? 600 : 500,
                  cursor: 'pointer', display: 'flex', justifyContent: 'space-between',
                  alignItems: 'center', transition: 'background-color 0.1s'
                }}
                onMouseEnter={e => { if (!isSelected) e.currentTarget.style.backgroundColor = 'rgba(190, 24, 93, 0.03)'; }}
                onMouseLeave={e => { if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent'; }}
              >
                <span>{opt}</span>
                {durationLabel && (
                  <span style={{ fontSize: '9px', color: 'var(--text-secondary)', marginLeft: '4px', fontWeight: 400 }}>
                    {durationLabel}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function SchedulesTab({
  selectedBranch,
  onScheduleUpdated,
  setIsDirty
}: SchedulesTabProps) {
  const queryClient = useQueryClient();
  const employeeRole = sessionStorage.getItem('employeeRole') || '';

  const { data: employeesData, isPending } = useQuery<any[]>({
    queryKey: ['schedulableStaff', selectedBranch, employeeRole],
    queryFn: async () => {
      const token = getAuthToken();
      const API_URL = getApiUrl();
      const res = await fetchWithTimeout(`${API_URL}/api/branches/${selectedBranch}/schedulable-staff`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to fetch schedulable staff');
      }
      return res.json();
    },
    enabled: !!selectedBranch
  });

  const employees = employeesData || [];

  const [selectedEmpId, setSelectedEmpId] = useState<string>('');
  const [schedules, setSchedules] = useState<any[]>([]);
  const [originalSchedules, setOriginalSchedules] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [pendingEmpId, setPendingEmpId] = useState<string | null>(null);
  const [showTemplateDropdown, setShowTemplateDropdown] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  useEffect(() => {
    if (employees.length > 0) {
      if (!selectedEmpId || !employees.some(e => e.id === selectedEmpId)) {
        setSelectedEmpId(employees[0].id);
      }
    } else {
      setSelectedEmpId('');
      setSchedules([]);
      setOriginalSchedules([]);
    }
  }, [employees, selectedEmpId]);

  useEffect(() => {
    if (selectedEmpId) {
      const emp = employees.find(e => e.id === selectedEmpId);
      if (emp) {
        if (!emp.schedules || emp.schedules.length === 0) {
          setSchedules([]);
          setOriginalSchedules([]);
        } else {
          const initialSchedules = Array.from({ length: 7 }, (_, idx) => {
            const existing = emp.schedules?.find((s: any) => s.dayOfWeek === idx);
            return existing
              ? { dayOfWeek: idx, startTime: existing.startTime || '09:00', endTime: existing.endTime || '17:00', isOff: existing.isOff }
              : { dayOfWeek: idx, startTime: '09:00', endTime: '17:00', isOff: true };
          });
          setSchedules(initialSchedules);
          setOriginalSchedules(JSON.parse(JSON.stringify(initialSchedules)));
        }
      }
    } else {
      setSchedules([]);
      setOriginalSchedules([]);
    }
    setError('');
    setSuccess('');
  }, [selectedEmpId, employees]);

  const selectedEmp = employees.find(e => e.id === selectedEmpId);
  const isDirty = selectedEmpId ? JSON.stringify(schedules) !== JSON.stringify(originalSchedules) : false;

  useEffect(() => {
    if (setIsDirty) setIsDirty(isDirty);
    return () => { if (setIsDirty) setIsDirty(false); };
  }, [isDirty, setIsDirty]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. If you leave this page, your edits to the schedule will be lost. Are you sure you want to discard them?';
        return e.returnValue;
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  const handleSelectEmployee = (empId: string) => {
    if (isDirty) setPendingEmpId(empId);
    else setSelectedEmpId(empId);
  };

  const handleConfirmDiscard = () => {
    if (pendingEmpId) setSelectedEmpId(pendingEmpId);
    setPendingEmpId(null);
  };

  const applyStandardWeek = () => {
    setSchedules(Array.from({ length: 7 }, (_, idx) => ({
      dayOfWeek: idx, startTime: '09:00', endTime: '17:00', isOff: idx === 0 || idx === 6
    })));
    setSuccess('Standard week template loaded. Remember to click Save.');
  };

  const applyStandardWeekFromEmpty = () => {
    setSchedules(Array.from({ length: 7 }, (_, idx) => ({
      dayOfWeek: idx, startTime: '09:00', endTime: '17:00', isOff: idx === 0 || idx === 6
    })));
    setSuccess('Standard week template loaded. Remember to click Save.');
  };

  const applyAllOff = () => {
    setSchedules(Array.from({ length: 7 }, (_, idx) => {
      const existing = schedules.find((s: any) => s.dayOfWeek === idx) || schedules[idx];
      return { dayOfWeek: idx, startTime: existing?.startTime || '09:00', endTime: existing?.endTime || '17:00', isOff: true };
    }));
    setSuccess('All days set to Day Off. Remember to click Save.');
  };

  const handleClearDay = (idx: number) => {
    setSchedules(Array.from({ length: 7 }, (_, i) => {
      const existing = schedules.find((s: any) => s.dayOfWeek === i) || schedules[i];
      if (i === idx) return { dayOfWeek: i, startTime: null, endTime: null, isOff: true };
      return existing ? { ...existing } : { dayOfWeek: i, startTime: '09:00', endTime: '17:00', isOff: true };
    }));
  };

  const mutation = useMutation({
    mutationFn: async (updatedSchedules: any[]) => {
      const token = getAuthToken();
      const API_URL = getApiUrl();

      const response = await fetchWithTimeout(`${API_URL}/api/employees/${selectedEmpId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ schedules: updatedSchedules })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to update schedule.');
      return data;
    },
    onMutate: async (updatedSchedules) => {
      await queryClient.cancelQueries({ queryKey: ['schedulableStaff', selectedBranch, employeeRole] });
      const previousStaff = queryClient.getQueryData(['schedulableStaff', selectedBranch, employeeRole]);
      if (previousStaff) {
        queryClient.setQueryData(
          ['schedulableStaff', selectedBranch, employeeRole],
          (old: any[] | undefined) => {
            if (!old) return old;
            return old.map(emp => emp.id === selectedEmpId ? { ...emp, schedules: updatedSchedules } : emp);
          }
        );
      }
      return { previousStaff };
    },
    onError: (err: any, _variables, context) => {
      if (context?.previousStaff) {
        queryClient.setQueryData(['schedulableStaff', selectedBranch, employeeRole], context.previousStaff);
      }
      setError(err.message || 'Network error. Failed to connect to server.');
    },
    onSuccess: () => {
      setSuccess('Schedules saved successfully!');
      setOriginalSchedules(JSON.parse(JSON.stringify(schedules)));
      onScheduleUpdated();
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['schedulableStaff', selectedBranch, employeeRole] });
    }
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!selectedEmpId) return;
    mutation.mutate(schedules);
  };

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
      <UnsavedChangesModal
        isOpen={pendingEmpId !== null}
        onConfirm={handleConfirmDiscard}
        onCancel={() => setPendingEmpId(null)}
      />

      {/* Left sidebar: Employee list */}
      <div className="glass-panel" style={{ flex: '1 1 250px', padding: '24px', minWidth: '220px', maxHeight: '70vh', overflowY: 'auto' }}>
        <h3 style={{ fontFamily: 'var(--font-serif)', color: 'var(--accent)', fontSize: '18px', fontWeight: 600, marginTop: 0, marginBottom: '16px' }}>
          Select Stylist
        </h3>

        {isPending && !employeesData ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '40px', color: 'var(--accent)' }}>
            <div className="spinner" style={{ width: '24px', height: '24px', border: '2px solid var(--accent-glow)', borderTop: '2px solid var(--accent)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            <span style={{ marginLeft: '12px', fontSize: '14px', fontWeight: 500 }}>Loading...</span>
          </div>
        ) : employees.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)', fontSize: '13.5px' }}>No employees registered in this branch.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {employees.map(emp => {
              const isSelected = emp.id === selectedEmpId;
              return (
                <div
                  key={emp.id}
                  onClick={() => handleSelectEmployee(emp.id)}
                  style={{
                    padding: '12px 16px', borderRadius: '8px',
                    backgroundColor: isSelected ? 'rgba(190, 24, 93, 0.06)' : 'var(--bg-secondary)',
                    color: 'var(--text-primary)', cursor: 'pointer', transition: 'all 0.2s',
                    border: `1px solid ${isSelected ? 'var(--accent)' : 'var(--border-color)'}`,
                    borderLeft: isSelected ? '4px solid var(--accent)' : `1px solid var(--border-color)`
                  }}
                >
                  <div style={{ fontWeight: 600, fontSize: '14.5px', color: isSelected ? 'var(--accent)' : 'var(--text-primary)' }}>{emp.name}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {emp.role} • {emp.specialty || 'Generalist'}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Right panel: Weekly Schedule Editor */}
      <div className="glass-panel" style={{ flex: '3 3 500px', padding: '24px', minWidth: '320px' }}>
        {selectedEmp ? (
          <form onSubmit={handleSave}>
            {/* Sticky header */}
            <div style={{
              position: 'sticky', top: '-24px',
              backgroundColor: 'var(--bg-glass-panel, var(--bg-primary))',
              backdropFilter: 'blur(12px)', zIndex: 10,
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              flexWrap: 'wrap', gap: '16px', borderBottom: '1px solid var(--border-color)',
              margin: '-24px -24px 20px -24px', padding: '24px 24px 16px 24px',
              borderTopLeftRadius: '16px', borderTopRightRadius: '16px'
            }}>
              <div style={{ flex: '1 1 300px', minWidth: '200px' }}>
                <h3 style={{ fontFamily: 'var(--font-serif)', color: 'var(--accent)', fontSize: '20px', fontWeight: 600, margin: 0 }}>
                  Weekly Shift Schedule
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '13.5px', marginTop: '4px', marginBottom: 0 }}>
                  Define which days and times <strong>{selectedEmp.name}</strong> is available for clients.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexShrink: 0 }}>
                {/* Template Dropdown */}
                <div style={{ position: 'relative' }}>
                  <button
                    type="button"
                    onClick={() => setShowTemplateDropdown(!showTemplateDropdown)}
                    style={{
                      padding: '8px 16px', borderRadius: '6px', border: '1px solid var(--border-color)',
                      backgroundColor: 'white', color: 'var(--text-primary)', fontSize: '13px',
                      fontWeight: 500, cursor: 'pointer', height: '38px',
                      display: 'flex', alignItems: 'center', gap: '8px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                    }}
                  >
                    <span>Schedule Templates</span>
                    <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>▼</span>
                  </button>
                  {showTemplateDropdown && (
                    <>
                      <div onClick={() => setShowTemplateDropdown(false)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 998 }} />
                      <div style={{
                        position: 'absolute', top: '44px', right: 0,
                        backgroundColor: 'white', border: '1px solid rgba(190, 24, 93, 0.1)',
                        borderRadius: '8px', boxShadow: '0 10px 25px -5px rgba(190, 24, 93, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)',
                        width: '240px', zIndex: 999, padding: '4px',
                        display: 'flex', flexDirection: 'column', gap: '2px'
                      }}>
                        {[
                          { label: 'Standard Week (Mon-Fri 9-5)', action: applyStandardWeek },
                          { label: 'Set All Off-Duty', action: applyAllOff }
                        ].map((item, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onMouseEnter={() => setHoveredIndex(idx)}
                            onMouseLeave={() => setHoveredIndex(null)}
                            onClick={() => { item.action(); setShowTemplateDropdown(false); }}
                            style={{
                              padding: '10px 12px', border: 'none',
                              backgroundColor: hoveredIndex === idx ? 'rgba(190, 24, 93, 0.06)' : 'transparent',
                              color: hoveredIndex === idx ? 'var(--accent)' : 'var(--text-primary)',
                              fontSize: '13px', textAlign: 'left', cursor: 'pointer',
                              borderRadius: '6px', transition: 'all 0.15s', fontWeight: 500
                            }}
                          >
                            {item.label}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                <button type="submit" className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', height: '38px' }}>
                  <Clock size={16} /> Save Weekly Schedule
                </button>
              </div>
            </div>

            <InlineAlertBanner type="success" message={success} />
            <InlineAlertBanner type="error" message={error} />

            {/* Empty state: no schedule defined */}
            {schedules.length === 0 && (
              <div className="data-card" style={{
                padding: '24px', marginBottom: '24px',
                backgroundColor: 'rgba(190, 24, 93, 0.02)',
                border: '1.5px dashed var(--accent)', borderRadius: '12px',
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'center', gap: '12px', textAlign: 'center', boxShadow: 'none'
              }}>
                <div style={{ fontWeight: 600, fontSize: '15px', color: 'var(--text-primary)' }}>
                  No schedule defined for this stylist.
                </div>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={applyStandardWeekFromEmpty}
                  style={{ backgroundColor: 'var(--accent)', color: '#FFFFFF', border: 'none', padding: '10px 24px', fontSize: '13.5px', fontWeight: 600, borderRadius: '6px', cursor: 'pointer', transition: 'all 0.2s' }}
                >
                  Apply Standard Week (Mon-Fri, 9am-5pm)
                </button>
              </div>
            )}

            {/* 7-Column Calendar */}
            <div style={{ overflowX: 'auto', paddingBottom: '24px', width: '100%', borderRadius: '8px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: '12px', minWidth: '800px' }}>
                {dayNames.map((dayName, idx) => {
                  const daySched = schedules[idx] || { dayOfWeek: idx, startTime: '09:00', endTime: '17:00', isOff: true };

                  return (
                    <div
                      key={idx}
                      style={{
                        padding: '14px 10px', borderRadius: '10px',
                        backgroundColor: 'var(--bg-secondary)',
                        border: `1px solid ${daySched.isOff ? 'var(--border-color)' : 'rgba(190, 24, 93, 0.15)'}`,
                        boxShadow: daySched.isOff ? 'none' : '0 4px 12px rgba(190, 24, 93, 0.03)',
                        display: 'flex', flexDirection: 'column', gap: '14px',
                        alignItems: 'stretch', minWidth: '100px'
                      }}
                    >
                      {/* Day header */}
                      <div style={{
                        position: 'relative', display: 'flex', flexDirection: 'row',
                        alignItems: 'center', justifyContent: 'center',
                        borderBottom: '1px solid var(--border-color)',
                        paddingBottom: '8px', paddingLeft: '16px', paddingRight: '16px', width: '100%'
                      }}>
                        <span title={dayName} style={{ fontWeight: 600, fontSize: '13.5px', color: 'var(--text-primary)', maxWidth: 'calc(100% - 20px)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'inline-block' }}>
                          {dayName}
                        </span>

                        {!daySched.isOff && (
                          <button
                            type="button"
                            onClick={() => handleClearDay(idx)}
                            title="Remove hours"
                            style={{
                              position: 'absolute', right: '0px', top: '50%',
                              transform: 'translateY(-50%)', marginTop: '-4px',
                              background: 'transparent', border: 'none',
                              color: 'var(--text-secondary)', cursor: 'pointer', padding: '2px',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              borderRadius: '4px', transition: 'all 0.15s'
                            }}
                            onMouseEnter={e => { e.currentTarget.style.color = '#b91c1c'; e.currentTarget.style.backgroundColor = 'rgba(185, 28, 28, 0.08)'; }}
                            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.backgroundColor = 'transparent'; }}
                          >
                            <X size={13} />
                          </button>
                        )}
                      </div>

                      {/* Day content */}
                      {daySched.isOff ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flexGrow: 1 }}>
                          <div
                            onClick={() => {
                              const updated = Array.from({ length: 7 }, (_, i) => {
                                if (i === idx) return { dayOfWeek: i, startTime: '09:00', endTime: '17:00', isOff: false };
                                const existing = schedules.find((s: any) => s.dayOfWeek === i);
                                return existing ? { ...existing } : { dayOfWeek: i, startTime: '09:00', endTime: '17:00', isOff: true };
                              });
                              setSchedules(updated);
                            }}
                            style={{
                              border: '1.5px dashed rgba(190, 24, 93, 0.25)', borderRadius: '8px',
                              padding: '24px 8px', textAlign: 'center', cursor: 'pointer',
                              backgroundColor: 'transparent', transition: 'all 0.2s ease-in-out',
                              display: 'flex', flexDirection: 'column', alignItems: 'center',
                              justifyContent: 'center', flexGrow: 1, minHeight: '100px'
                            }}
                            onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(190, 24, 93, 0.04)'; e.currentTarget.style.borderColor = 'rgba(190, 24, 93, 0.45)'; }}
                            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.borderColor = 'rgba(190, 24, 93, 0.25)'; }}
                          >
                            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--accent)' }}>+ Add Hours</span>
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: 'auto' }}>
                            {[
                              { key: 'morning', label: 'Morning (9-1)', start: '09:00', end: '13:00' },
                              { key: 'afternoon', label: 'Afternoon (1-5)', start: '13:00', end: '17:00' },
                              { key: 'full', label: 'Full Day (9-5)', start: '09:00', end: '17:00' }
                            ].map(p => (
                              <button
                                key={p.key}
                                type="button"
                                onClick={() => {
                                  const updated = Array.from({ length: 7 }, (_, i) => {
                                    if (i === idx) return { dayOfWeek: i, startTime: p.start, endTime: p.end, isOff: false };
                                    const existing = schedules.find((s: any) => s.dayOfWeek === i);
                                    return existing ? { ...existing } : { dayOfWeek: i, startTime: '09:00', endTime: '17:00', isOff: true };
                                  });
                                  setSchedules(updated);
                                }}
                                style={{
                                  padding: '5px 2px', width: '100%', borderRadius: '4px',
                                  border: '1px solid var(--border-color)', backgroundColor: 'transparent',
                                  color: 'var(--text-secondary)', fontSize: '9px', fontWeight: 500,
                                  cursor: 'pointer', transition: 'all 0.15s', textAlign: 'center', whiteSpace: 'nowrap'
                                }}
                                onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(190, 24, 93, 0.03)'; e.currentTarget.style.borderColor = 'rgba(190, 24, 93, 0.2)'; e.currentTarget.style.color = 'var(--accent)'; }}
                                onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                              >
                                {p.label.split(' ')[0]}
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flexGrow: 1, justifyContent: 'space-between' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <TimeSelect12Hour
                              label="Start"
                              value24={daySched.startTime || '09:00'}
                              onChange={(val) => {
                                const updated = Array.from({ length: 7 }, (_, i) => {
                                  const existing = schedules.find((s: any) => s.dayOfWeek === i) || schedules[i];
                                  if (i === idx) return { ...daySched, startTime: val };
                                  return existing ? { ...existing } : { dayOfWeek: i, startTime: '09:00', endTime: '17:00', isOff: true };
                                });
                                setSchedules(updated);
                              }}
                            />
                            <TimeSelect12Hour
                              label="End"
                              value24={daySched.endTime || '17:00'}
                              relativeTo24={daySched.startTime}
                              onChange={(val) => {
                                const updated = Array.from({ length: 7 }, (_, i) => {
                                  const existing = schedules.find((s: any) => s.dayOfWeek === i) || schedules[i];
                                  if (i === idx) return { ...daySched, endTime: val };
                                  return existing ? { ...existing } : { dayOfWeek: i, startTime: '09:00', endTime: '17:00', isOff: true };
                                });
                                setSchedules(updated);
                              }}
                            />
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '10px' }}>
                            {[
                              { key: 'morning', label: 'Morning (9-1)', start: '09:00', end: '13:00' },
                              { key: 'afternoon', label: 'Afternoon (1-5)', start: '13:00', end: '17:00' },
                              { key: 'full', label: 'Full Day (9-5)', start: '09:00', end: '17:00' }
                            ].map(p => {
                              const isPresetSelected = daySched.startTime === p.start && daySched.endTime === p.end;
                              return (
                                <button
                                  key={p.key}
                                  type="button"
                                  onClick={() => {
                                    const updated = Array.from({ length: 7 }, (_, i) => {
                                      const existing = schedules.find((s: any) => s.dayOfWeek === i) || schedules[i];
                                      if (i === idx) return { ...daySched, startTime: p.start, endTime: p.end };
                                      return existing ? { ...existing } : { dayOfWeek: i, startTime: '09:00', endTime: '17:00', isOff: true };
                                    });
                                    setSchedules(updated);
                                  }}
                                  style={{
                                    padding: '5px 2px', width: '100%', borderRadius: '4px',
                                    border: '1px solid ' + (isPresetSelected ? 'rgba(190, 24, 93, 0.4)' : 'var(--border-color)'),
                                    backgroundColor: isPresetSelected ? 'rgba(190, 24, 93, 0.08)' : 'transparent',
                                    color: isPresetSelected ? 'var(--accent)' : 'var(--text-secondary)',
                                    fontSize: '9px', fontWeight: isPresetSelected ? 600 : 500,
                                    cursor: 'pointer', transition: 'all 0.15s', textAlign: 'center', whiteSpace: 'nowrap'
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
        ) : (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-secondary)' }}>
            Please select a stylist from the left sidebar to configure their schedule.
          </div>
        )}
      </div>
    </div>
  );
}
