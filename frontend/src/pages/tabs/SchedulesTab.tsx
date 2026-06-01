import React, { useState, useEffect } from 'react';
import { Clock, Copy, Power } from 'lucide-react';
import type { Branch } from '../../types';

interface SchedulesTabProps {
  branches: Branch[];
  selectedBranch: string;
  onScheduleUpdated: () => void;
}

export function SchedulesTab({
  branches,
  selectedBranch,
  onScheduleUpdated
}: SchedulesTabProps) {
  const employees = branches.find(b => b.id === selectedBranch)?.employees || [];
  
  // Selected employee for scheduling
  const [selectedEmpId, setSelectedEmpId] = useState<string>('');
  
  // Schedule state array (7 days)
  const [schedules, setSchedules] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Sync selected employee schedules
  useEffect(() => {
    if (employees.length > 0) {
      if (!selectedEmpId || !employees.some(e => e.id === selectedEmpId)) {
        setSelectedEmpId(employees[0].id);
      }
    } else {
      setSelectedEmpId('');
      setSchedules([]);
    }
  }, [employees, selectedEmpId]);

  useEffect(() => {
    if (selectedEmpId) {
      const emp = employees.find(e => e.id === selectedEmpId);
      if (emp) {
        const initialSchedules = Array.from({ length: 7 }, (_, idx) => {
          const existing = emp.schedules?.find((s: any) => s.dayOfWeek === idx);
          return existing ? {
            dayOfWeek: idx,
            startTime: existing.startTime || '09:00',
            endTime: existing.endTime || '17:00',
            isOff: existing.isOff
          } : {
            dayOfWeek: idx,
            startTime: '09:00',
            endTime: '17:00',
            isOff: idx === 0 // default Sunday off
          };
        });
        setSchedules(initialSchedules);
      }
    }
    setError('');
    setSuccess('');
  }, [selectedEmpId, employees]);

  const selectedEmp = employees.find(e => e.id === selectedEmpId);

  const getSelectedPreset = (daySched: any) => {
    if (daySched.isOff) return 'off';
    if (daySched.startTime === '09:00' && daySched.endTime === '13:00') return 'morning';
    if (daySched.startTime === '13:00' && daySched.endTime === '17:00') return 'afternoon';
    if (daySched.startTime === '09:00' && daySched.endTime === '17:00') return 'full';
    return 'custom';
  };

  const setPreset = (dayIdx: number, preset: 'off' | 'morning' | 'afternoon' | 'full' | 'custom') => {
    const updated = [...schedules];
    const current = updated[dayIdx];
    if (preset === 'off') {
      updated[dayIdx] = { ...current, isOff: true };
    } else if (preset === 'morning') {
      updated[dayIdx] = { ...current, isOff: false, startTime: '09:00', endTime: '13:00' };
    } else if (preset === 'afternoon') {
      updated[dayIdx] = { ...current, isOff: false, startTime: '13:00', endTime: '17:00' };
    } else if (preset === 'full') {
      updated[dayIdx] = { ...current, isOff: false, startTime: '09:00', endTime: '17:00' };
    } else if (preset === 'custom') {
      updated[dayIdx] = { ...current, isOff: false };
    }
    setSchedules(updated);
  };

  // Automation: Standard Week (Mon-Fri 9-5, Sat/Sun off)
  const applyStandardWeek = () => {
    const updated = schedules.map((s, idx) => ({
      ...s,
      startTime: '09:00',
      endTime: '17:00',
      isOff: idx === 0 || idx === 6 // Sunday and Saturday off
    }));
    setSchedules(updated);
    setSuccess('Standard week template loaded. Remember to click Save.');
  };

  // Automation: Copy Monday to Weekdays (Tue-Fri)
  const applyCopyMonday = () => {
    const mondaySched = schedules[1] || { startTime: '09:00', endTime: '17:00', isOff: false };
    const updated = schedules.map((s, idx) => {
      // Apply to Tue(2), Wed(3), Thu(4), Fri(5)
      if (idx >= 2 && idx <= 5) {
        return {
          ...s,
          startTime: mondaySched.startTime,
          endTime: mondaySched.endTime,
          isOff: mondaySched.isOff
        };
      }
      return s;
    });
    setSchedules(updated);
    setSuccess('Monday schedule copied to all weekdays! Remember to click Save.');
  };

  // Automation: Set all to off-duty
  const applyAllOff = () => {
    const updated = schedules.map(s => ({
      ...s,
      isOff: true
    }));
    setSchedules(updated);
    setSuccess('All days set to Day Off. Remember to click Save.');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!selectedEmpId) return;

    const token = sessionStorage.getItem('adminToken') || sessionStorage.getItem('ownerToken');
    if (!token) {
      setError('Authentication token missing. Please re-authenticate.');
      return;
    }

    const API_URL = (import.meta.env.VITE_API_URL || 'https://nails-salon-backend.onrender.com').replace(/\/$/, '');

    try {
      const response = await fetch(`${API_URL}/api/employees/${selectedEmpId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          schedules
        })
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.error || 'Failed to update schedule.');
        return;
      }

      setSuccess('Schedules saved successfully!');
      onScheduleUpdated();
    } catch (err) {
      setError('Network error. Failed to connect to server.');
    }
  };

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  return (
    <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
      {/* Left sidebar: Employee list */}
      <div className="glass-panel" style={{ flex: '1 1 250px', padding: '24px', minWidth: '220px', maxHeight: '70vh', overflowY: 'auto' }}>
        <h3 style={{ fontFamily: 'var(--font-serif)', color: 'var(--accent)', fontSize: '18px', fontWeight: 600, marginTop: 0, marginBottom: '16px' }}>
          Select Stylist
        </h3>
        
        {employees.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)', fontSize: '13.5px' }}>No employees registered in this branch.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {employees.map(emp => {
              const isSelected = emp.id === selectedEmpId;
              return (
                <div
                  key={emp.id}
                  onClick={() => setSelectedEmpId(emp.id)}
                  style={{
                    padding: '12px 16px',
                    borderRadius: '8px',
                    backgroundColor: isSelected ? 'var(--accent)' : 'var(--bg-secondary)',
                    color: isSelected ? '#fff' : 'var(--text-primary)',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    border: `1px solid ${isSelected ? 'var(--accent)' : 'var(--border-color)'}`
                  }}
                >
                  <div style={{ fontWeight: 600, fontSize: '14.5px' }}>{emp.name}</div>
                  <div style={{ fontSize: '12px', color: isSelected ? 'rgba(255, 255, 255, 0.8)' : 'var(--text-secondary)', marginTop: '2px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
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
            {/* Header / Info bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', marginBottom: '20px' }}>
              <div>
                <h3 style={{ fontFamily: 'var(--font-serif)', color: 'var(--accent)', fontSize: '20px', fontWeight: 600, margin: 0 }}>
                  Weekly Shift Schedule
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '13.5px', marginTop: '4px' }}>
                  Define which days and times <strong>{selectedEmp.name}</strong> is available for clients.
                </p>
              </div>
              
              <button type="submit" className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px' }}>
                <Clock size={16} /> Save Weekly Schedule
              </button>
            </div>

            {/* Semi-Automation Templates panel */}
            <div style={{ backgroundColor: 'rgba(190, 24, 93, 0.04)', border: '1px dashed var(--accent)', borderRadius: '8px', padding: '16px', marginBottom: '24px' }}>
              <div style={{ fontWeight: 600, color: 'var(--accent)', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>
                ⚡ One-Click Easy Presets (No typing needed!)
              </div>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={applyStandardWeek}
                  className="btn-primary"
                  style={{
                    backgroundColor: 'transparent',
                    border: '1px solid var(--accent)',
                    color: 'var(--accent)',
                    boxShadow: 'none',
                    fontSize: '12.5px',
                    padding: '6px 12px'
                  }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(190, 24, 93, 0.08)'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  📅 Standard Week (Mon-Fri 9-5)
                </button>

                <button
                  type="button"
                  onClick={applyCopyMonday}
                  className="btn-primary"
                  style={{
                    backgroundColor: 'transparent',
                    border: '1px solid var(--accent)',
                    color: 'var(--accent)',
                    boxShadow: 'none',
                    fontSize: '12.5px',
                    padding: '6px 12px'
                  }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(190, 24, 93, 0.08)'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <Copy size={13} style={{ marginRight: '4px' }} /> Copy Mon to Weekdays (Tue-Fri)
                </button>

                <button
                  type="button"
                  onClick={applyAllOff}
                  className="btn-primary"
                  style={{
                    backgroundColor: 'transparent',
                    border: '1px solid #71717a',
                    color: '#71717a',
                    boxShadow: 'none',
                    fontSize: '12.5px',
                    padding: '6px 12px'
                  }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(113, 113, 122, 0.08)'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <Power size={13} style={{ marginRight: '4px' }} /> Set All Off-Duty
                </button>
              </div>
            </div>

            {/* Notification messages */}
            {success && (
              <div style={{ color: '#15803d', fontSize: '13.5px', backgroundColor: '#dcfce7', padding: '12px', borderRadius: '6px', border: '1px solid #bbf7d0', marginBottom: '16px' }}>
                {success}
              </div>
            )}
            {error && (
              <div style={{ color: '#b91c1c', fontSize: '13.5px', backgroundColor: '#fee2e2', padding: '12px', borderRadius: '6px', border: '1px solid #fecaca', marginBottom: '16px' }}>
                {error}
              </div>
            )}

            {/* 7 Day Grid layout */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))', gap: '20px' }}>
              {dayNames.map((dayName, idx) => {
                const daySched = schedules[idx] || { dayOfWeek: idx, startTime: '09:00', endTime: '17:00', isOff: true };
                const activePreset = getSelectedPreset(daySched);
                
                return (
                  <div
                    key={idx}
                    style={{
                      padding: '18px',
                      borderRadius: '10px',
                      backgroundColor: 'var(--bg-secondary)',
                      border: `1px solid ${daySched.isOff ? 'var(--border-color)' : 'rgba(190, 24, 93, 0.15)'}`,
                      boxShadow: daySched.isOff ? 'none' : '0 4px 12px rgba(190, 24, 93, 0.03)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px'
                    }}
                  >
                    {/* Header of day card */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                      <span style={{ fontWeight: 600, fontSize: '15px', color: 'var(--text-primary)' }}>{dayName}</span>
                      <span style={{
                        fontSize: '11px',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        color: daySched.isOff ? 'var(--text-secondary)' : 'var(--accent)',
                        backgroundColor: daySched.isOff ? 'rgba(113,113,122,0.1)' : 'rgba(190,24,93,0.1)',
                        padding: '2px 8px',
                        borderRadius: '4px'
                      }}>
                        {daySched.isOff ? 'Off-Duty' : `${daySched.startTime} - ${daySched.endTime}`}
                      </span>
                    </div>

                    {/* Big Touch-Friendly Buttons */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '4px' }}>
                      {[
                        { key: 'off', label: 'Day Off 💤', bg: 'transparent', border: 'var(--border-color)', activeBg: '#f4f4f5', activeColor: '#27272a', activeBorder: '#71717a' },
                        { key: 'morning', label: 'Morning (9-1) 🌅', bg: 'transparent', border: 'rgba(234, 179, 8, 0.15)', activeBg: 'rgba(234, 179, 8, 0.15)', activeColor: '#854d0e', activeBorder: 'rgba(234, 179, 8, 0.5)' },
                        { key: 'afternoon', label: 'Afternoon (1-5) 🌇', bg: 'transparent', border: 'rgba(249, 115, 22, 0.15)', activeBg: 'rgba(249, 115, 22, 0.15)', activeColor: '#c2410c', activeBorder: 'rgba(249, 115, 22, 0.5)' },
                        { key: 'full', label: 'Full Day (9-5) ☀️', bg: 'transparent', border: 'rgba(190, 24, 93, 0.15)', activeBg: 'rgba(190, 24, 93, 0.12)', activeColor: 'var(--accent)', activeBorder: 'rgba(190, 24, 93, 0.4)' }
                      ].map(tile => {
                        const isTileActive = activePreset === tile.key;
                        return (
                          <button
                            key={tile.key}
                            type="button"
                            onClick={() => setPreset(idx, tile.key as any)}
                            style={{
                              padding: '12px 6px',
                              borderRadius: '8px',
                              border: `2px solid ${isTileActive ? tile.activeBorder : tile.border}`,
                              backgroundColor: isTileActive ? tile.activeBg : tile.bg,
                              color: isTileActive ? tile.activeColor : 'var(--text-primary)',
                              fontSize: '12px',
                              fontWeight: isTileActive ? 'bold' : 500,
                              cursor: 'pointer',
                              textAlign: 'center',
                              transition: 'all 0.15s ease-in-out',
                            }}
                          >
                            {tile.label}
                          </button>
                        );
                      })}
                    </div>

                    {/* Custom hours section */}
                    <div style={{ borderTop: '1px dashed var(--border-color)', paddingTop: '8px', marginTop: '4px' }}>
                      <button
                        type="button"
                        onClick={() => {
                          if (activePreset === 'custom') {
                            setPreset(idx, 'off');
                          } else {
                            setPreset(idx, 'custom');
                          }
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--text-secondary)',
                          fontSize: '11px',
                          textDecoration: 'underline',
                          cursor: 'pointer',
                          padding: 0
                        }}
                      >
                        {activePreset === 'custom' ? '✕ Close Custom Hours' : '⚙️ Custom Hours...'}
                      </button>

                      {activePreset === 'custom' && (
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '8px' }}>
                          <div style={{ flex: 1 }}>
                            <span style={{ fontSize: '10px', color: 'var(--text-secondary)', display: 'block', marginBottom: '2px' }}>Start</span>
                            <input
                              type="time"
                              value={daySched.startTime || '09:00'}
                              onChange={(e) => {
                                const updated = [...schedules];
                                updated[idx] = { ...daySched, startTime: e.target.value };
                                setSchedules(updated);
                              }}
                              style={{ height: '30px', fontSize: '12px', padding: '0 6px', width: '100%', borderRadius: '4px', border: '1px solid var(--border-color)' }}
                              required
                            />
                          </div>
                          <span style={{ fontSize: '11px', color: 'var(--text-secondary)', paddingTop: '14px' }}>to</span>
                          <div style={{ flex: 1 }}>
                            <span style={{ fontSize: '10px', color: 'var(--text-secondary)', display: 'block', marginBottom: '2px' }}>End</span>
                            <input
                              type="time"
                              value={daySched.endTime || '17:00'}
                              onChange={(e) => {
                                const updated = [...schedules];
                                updated[idx] = { ...daySched, endTime: e.target.value };
                                setSchedules(updated);
                              }}
                              style={{ height: '30px', fontSize: '12px', padding: '0 6px', width: '100%', borderRadius: '4px', border: '1px solid var(--border-color)' }}
                              required
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom Save button */}
            <div style={{ borderTop: '1px solid var(--border-color)', marginTop: '24px', paddingTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 24px' }}>
                <Clock size={16} /> Save Weekly Schedule
              </button>
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
