import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  UserCheck,
  Clock,
  X,
  Filter,
  RefreshCw,
  Users,
} from 'lucide-react';
import { apiClient } from '../../../utils/apiClient';
import type { Appointment, WaitlistItem, Employee, Branch } from '../../../types';
import { PageWrapper, LoadingSpinner } from '../../../components/common';

interface CalendarTabProps {
  branches: Branch[];
  selectedBranch: string;
  employeeRole: string;
  navigateTo: (path: string) => void;
}

export function CalendarTab({ selectedBranch }: CalendarTabProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  // Toggles for filters
  const [showAppointments, setShowAppointments] = useState(true);
  const [showWalkins, setShowWalkins] = useState(true);
  const [showStaff, setShowStaff] = useState(true);

  // Detail Modal State
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  // Queries
  const {
    data: appointments = [],
    isLoading: isApptsLoading,
    refetch: refetchAppts,
  } = useQuery<Appointment[]>({
    queryKey: ['appointments', selectedBranch],
    queryFn: () => apiClient.get<Appointment[]>(`/api/branches/${selectedBranch}/appointments`),
    enabled: !!selectedBranch,
    staleTime: 30000,
  });

  const {
    data: waitlist = [],
    isLoading: isWaitlistLoading,
    refetch: refetchWaitlist,
  } = useQuery<WaitlistItem[]>({
    queryKey: ['waitlist', selectedBranch],
    queryFn: () => apiClient.get<WaitlistItem[]>(`/api/branches/${selectedBranch}/waitlist`),
    enabled: !!selectedBranch,
    staleTime: 30000,
  });

  const {
    data: employees = [],
    isLoading: isStaffLoading,
    refetch: refetchStaff,
  } = useQuery<Employee[]>({
    queryKey: ['schedulableStaff', selectedBranch],
    queryFn: () => apiClient.get<Employee[]>(`/api/branches/${selectedBranch}/schedulable-staff`),
    enabled: !!selectedBranch,
    staleTime: 30000,
  });

  const isLoading = isApptsLoading || isWaitlistLoading || isStaffLoading;

  const handleRefreshAll = () => {
    refetchAppts();
    refetchWaitlist();
    refetchStaff();
  };

  // Date utilities
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    // Day of the week for the 1st (0 = Sunday, 1 = Monday, etc.)
    const startDayOfWeek = firstDay.getDay();
    const totalDays = lastDay.getDate();

    return { startDayOfWeek, totalDays };
  };

  const { startDayOfWeek, totalDays } = getDaysInMonth(currentDate);

  // Navigate months
  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Format YYYY-MM-DD in Asia/Manila timezone from DateTime/Date
  const getUTCLocalDateString = (dateInput: string | Date) => {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return '';
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Manila',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    const parts = formatter.formatToParts(d);
    const month = parts.find((p) => p.type === 'month')!.value;
    const day = parts.find((p) => p.type === 'day')!.value;
    const year = parts.find((p) => p.type === 'year')!.value;
    return `${year}-${month}-${day}`;
  };

  // Format YYYY-MM-DD in Asia/Manila timezone from ISO string
  const getCheckInLocalDateString = (dateInput: string) => {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return '';
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Manila',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    const parts = formatter.formatToParts(d);
    const month = parts.find((p) => p.type === 'month')!.value;
    const day = parts.find((p) => p.type === 'day')!.value;
    const year = parts.find((p) => p.type === 'year')!.value;
    return `${year}-${month}-${day}`;
  };

  // Format date to local key
  const getDayKey = (year: number, month: number, day: number) => {
    const m = String(month + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    return `${year}-${m}-${d}`;
  };

  // Month rendering constants
  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Grid Cell Calculations
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Previous Month's trailing days
  const prevMonthLastDate = new Date(year, month, 0).getDate();
  const prevMonthCells = Array.from(
    { length: startDayOfWeek },
    (_, i) => prevMonthLastDate - startDayOfWeek + i + 1
  );

  // Current Month's days
  const currentMonthDays = Array.from({ length: totalDays }, (_, i) => i + 1);

  // Next Month's leading days to complete the calendar grid
  const remainingCells = 42 - (prevMonthCells.length + currentMonthDays.length);
  const nextMonthCells = Array.from({ length: remainingCells }, (_, i) => i + 1);

  // Check if a day is today
  const isToday = (dayNum: number, isCurrentMonth: boolean) => {
    if (!isCurrentMonth) return false;
    const today = new Date();
    return today.getDate() === dayNum && today.getMonth() === month && today.getFullYear() === year;
  };

  return (
    <PageWrapper
      title="Scheduling Calendar"
      subtitle="Overlay appointed bookings, walk-ins, and shift schedules in one calendar view."
      action={
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            className="btn-secondary"
            title="Refresh All Data"
            onClick={handleRefreshAll}
            style={{
              padding: '8px 12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <RefreshCw size={14} className={isLoading ? 'spin' : ''} />
          </button>
          <button
            className="btn-primary"
            onClick={handleToday}
            style={{ padding: '8px 16px', fontSize: '13px' }}
          >
            Today
          </button>
        </div>
      }
    >
      {/* Filters & Month Controller Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '20px',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          padding: '16px 24px',
          borderRadius: '12px',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        {/* Month Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            onClick={handlePrevMonth}
            style={{
              background: 'none',
              border: '1px solid var(--border-color)',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'var(--text-primary)',
              transition: 'var(--transition)',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--accent)')}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border-color)')}
          >
            <ChevronLeft size={18} />
          </button>
          <h2
            style={{
              margin: 0,
              fontFamily: 'var(--font-serif)',
              fontSize: '22px',
              fontWeight: 600,
              color: 'var(--text-primary)',
              minWidth: '160px',
              textAlign: 'center',
            }}
          >
            {monthNames[month]} {year}
          </h2>
          <button
            onClick={handleNextMonth}
            style={{
              background: 'none',
              border: '1px solid var(--border-color)',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'var(--text-primary)',
              transition: 'var(--transition)',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--accent)')}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border-color)')}
          >
            <ChevronRight size={18} />
          </button>
        </div>

        {/* Toggles / Filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '13px',
              color: 'var(--text-secondary)',
            }}
          >
            <Filter size={14} />
            <span style={{ fontWeight: 600, marginRight: '4px' }}>Filter:</span>
          </div>

          <button
            onClick={() => setShowAppointments(!showAppointments)}
            style={{
              padding: '6px 14px',
              fontSize: '12.5px',
              fontWeight: 500,
              borderRadius: '20px',
              cursor: 'pointer',
              border: `1px solid ${showAppointments ? 'var(--accent)' : 'var(--border-color)'}`,
              backgroundColor: showAppointments ? 'var(--accent-glow)' : 'var(--bg-primary)',
              color: showAppointments ? 'var(--accent)' : 'var(--text-secondary)',
              transition: 'var(--transition)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <CalendarIcon size={14} />
            Appointed Guests
          </button>

          <button
            onClick={() => setShowWalkins(!showWalkins)}
            style={{
              padding: '6px 14px',
              fontSize: '12.5px',
              fontWeight: 500,
              borderRadius: '20px',
              cursor: 'pointer',
              border: `1px solid ${showWalkins ? 'var(--accent-blue)' : 'var(--border-color)'}`,
              backgroundColor: showWalkins ? 'var(--accent-blue-glow)' : 'var(--bg-primary)',
              color: showWalkins ? 'var(--accent-blue)' : 'var(--text-secondary)',
              transition: 'var(--transition)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <UserCheck size={14} />
            Walk-in Guests
          </button>

          <button
            onClick={() => setShowStaff(!showStaff)}
            style={{
              padding: '6px 14px',
              fontSize: '12.5px',
              fontWeight: 500,
              borderRadius: '20px',
              cursor: 'pointer',
              border: `1px solid ${showStaff ? 'var(--success-green)' : 'var(--border-color)'}`,
              backgroundColor: showStaff ? 'rgba(16, 185, 129, 0.06)' : 'var(--bg-primary)',
              color: showStaff ? 'var(--success-green)' : 'var(--text-secondary)',
              transition: 'var(--transition)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Clock size={14} />
            Staff Schedules
          </button>
        </div>
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '100px 0' }}>
          <LoadingSpinner size="md" />
        </div>
      ) : (
        <div
          className="glass-panel"
          style={{
            padding: '24px',
            borderRadius: '16px',
            boxShadow: 'var(--shadow-md)',
            overflowX: 'auto',
          }}
        >
          {/* Weekday headers */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, minmax(100px, 1fr))',
              gap: '8px',
              marginBottom: '12px',
              textAlign: 'center',
            }}
          >
            {weekdays.map((day) => (
              <div
                key={day}
                style={{
                  fontWeight: 600,
                  fontSize: '14px',
                  color: 'var(--text-secondary)',
                  padding: '8px 0',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Day Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, minmax(100px, 1fr))',
              gridAutoRows: '140px',
              gap: '8px',
            }}
          >
            {/* Render previous month trailing cells */}
            {prevMonthCells.map((dayNum, i) => (
              <div
                key={`prev-${i}`}
                style={{
                  backgroundColor: 'rgba(0,0,0,0.01)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  padding: '8px',
                  opacity: 0.35,
                  pointerEvents: 'none',
                }}
              >
                <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)' }}>
                  {dayNum}
                </div>
              </div>
            ))}

            {/* Render current month days */}
            {currentMonthDays.map((dayNum) => {
              const dayKey = getDayKey(year, month, dayNum);
              const dayOfWeek = new Date(year, month, dayNum).getDay();

              // Filter appointments for this date
              const dayAppts = appointments.filter(
                (appt) => getUTCLocalDateString(appt.appointmentDate) === dayKey
              );

              // Filter walk-ins for this date
              const dayWalkins = waitlist.filter(
                (w) => getCheckInLocalDateString(w.checkInDate) === dayKey
              );

              // Filter working staff for this day of week
              const workingStaff = employees.filter((emp) => {
                const daySched = emp.schedules?.find((s) => s.dayOfWeek === dayOfWeek);
                return daySched && !daySched.isOff && daySched.startTime && daySched.endTime;
              });

              const todayFlag = isToday(dayNum, true);

              return (
                <div
                  key={`day-${dayNum}`}
                  onClick={() => setSelectedDay(new Date(year, month, dayNum))}
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    border: todayFlag ? '2px solid var(--accent)' : '1px solid var(--border-color)',
                    borderRadius: '8px',
                    padding: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease-in-out',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    boxShadow: todayFlag ? '0 0 8px rgba(209, 71, 119, 0.15)' : 'none',
                    overflow: 'hidden',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                    e.currentTarget.style.borderColor = 'var(--accent-hover)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'none';
                    e.currentTarget.style.boxShadow = todayFlag
                      ? '0 0 8px rgba(209, 71, 119, 0.15)'
                      : 'none';
                    e.currentTarget.style.borderColor = todayFlag
                      ? 'var(--accent)'
                      : 'var(--border-color)';
                  }}
                >
                  {/* Cell Header */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '4px',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '14px',
                        fontWeight: todayFlag ? 700 : 500,
                        color: todayFlag ? 'white' : 'var(--text-primary)',
                        backgroundColor: todayFlag ? 'var(--accent)' : 'transparent',
                        borderRadius: '50%',
                        width: '24px',
                        height: '24px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {dayNum}
                    </span>

                    {/* Small dot indicators */}
                    <div style={{ display: 'flex', gap: '3px' }}>
                      {showAppointments && dayAppts.length > 0 && (
                        <span
                          style={{
                            width: '5px',
                            height: '5px',
                            borderRadius: '50%',
                            backgroundColor: 'var(--accent)',
                          }}
                        ></span>
                      )}
                      {showWalkins && dayWalkins.length > 0 && (
                        <span
                          style={{
                            width: '5px',
                            height: '5px',
                            borderRadius: '50%',
                            backgroundColor: 'var(--accent-blue)',
                          }}
                        ></span>
                      )}
                      {showStaff && workingStaff.length > 0 && (
                        <span
                          style={{
                            width: '5px',
                            height: '5px',
                            borderRadius: '50%',
                            backgroundColor: 'var(--success-green)',
                          }}
                        ></span>
                      )}
                    </div>
                  </div>

                  {/* Cell Content */}
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                      flexGrow: 1,
                      overflow: 'hidden',
                    }}
                  >
                    {/* Show limited elements inside cell */}
                    {showAppointments &&
                      dayAppts.slice(0, 2).map((appt) => (
                        <div
                          key={appt.id}
                          style={{
                            fontSize: '10px',
                            fontWeight: 600,
                            backgroundColor: 'var(--accent-glow)',
                            color: 'var(--accent)',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            whiteSpace: 'nowrap',
                            textOverflow: 'ellipsis',
                            overflow: 'hidden',
                          }}
                        >
                          {appt.startTime} {appt.client?.firstName}
                        </div>
                      ))}
                    {showAppointments && dayAppts.length > 2 && (
                      <div
                        style={{
                          fontSize: '9px',
                          fontWeight: 600,
                          color: 'var(--accent)',
                          paddingLeft: '4px',
                        }}
                      >
                        +{dayAppts.length - 2} more bookings
                      </div>
                    )}

                    {showWalkins &&
                      dayWalkins.slice(0, 2).map((w) => (
                        <div
                          key={w.id}
                          style={{
                            fontSize: '10px',
                            fontWeight: 600,
                            backgroundColor: 'var(--accent-blue-glow)',
                            color: 'var(--accent-blue)',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            whiteSpace: 'nowrap',
                            textOverflow: 'ellipsis',
                            overflow: 'hidden',
                          }}
                        >
                          W: {w.firstName}
                        </div>
                      ))}
                    {showWalkins && dayWalkins.length > 2 && (
                      <div
                        style={{
                          fontSize: '9px',
                          fontWeight: 600,
                          color: 'var(--accent-blue)',
                          paddingLeft: '4px',
                        }}
                      >
                        +{dayWalkins.length - 2} walk-ins
                      </div>
                    )}
                  </div>

                  {/* Cell Footer (Working Staff count) */}
                  {showStaff && workingStaff.length > 0 && (
                    <div
                      style={{
                        fontSize: '9.5px',
                        color: 'var(--text-secondary)',
                        borderTop: '1px solid var(--border-color)',
                        paddingTop: '2px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontWeight: 500,
                      }}
                    >
                      <Users size={10} style={{ color: 'var(--success-green)' }} />
                      <span>{workingStaff.length} stylists work</span>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Render next month leading cells */}
            {nextMonthCells.map((dayNum, i) => (
              <div
                key={`next-${i}`}
                style={{
                  backgroundColor: 'rgba(0,0,0,0.01)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  padding: '8px',
                  opacity: 0.35,
                  pointerEvents: 'none',
                }}
              >
                <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)' }}>
                  {dayNum}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Daily Detail Modal Overlay */}
      {selectedDay && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.4)',
            backdropFilter: 'blur(8px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
          onClick={() => setSelectedDay(null)}
        >
          <div
            style={{
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: '16px',
              maxWidth: '850px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: 'var(--shadow-lg)',
              animation: 'modalFadeIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards',
              display: 'flex',
              flexDirection: 'column',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '20px 24px',
                borderBottom: '1px solid var(--border-color)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <h3
                  style={{
                    margin: 0,
                    fontFamily: 'var(--font-serif)',
                    fontSize: '20px',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                  }}
                >
                  Schedule Details
                </h3>
                <p
                  style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-secondary)' }}
                >
                  {selectedDay.toLocaleDateString([], {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </p>
              </div>
              <button
                onClick={() => setSelectedDay(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-secondary)',
                  padding: '8px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'var(--transition)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--border-color)';
                  e.currentTarget.style.color = 'var(--text-primary)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Columns Grid */}
            <div
              style={{
                padding: '24px',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '24px',
                backgroundColor: 'var(--bg-primary)',
              }}
            >
              {/* Column 1: Appointed Bookings */}
              <div
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  borderRadius: '12px',
                  border: '1px solid var(--border-color)',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
              >
                <h4
                  style={{
                    margin: 0,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    color: 'var(--accent)',
                    fontSize: '15px',
                    fontWeight: 600,
                  }}
                >
                  <CalendarIcon size={16} />
                  Booked Appointments
                </h4>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    overflowY: 'auto',
                    maxHeight: '350px',
                  }}
                >
                  {(() => {
                    const dayKey = getDayKey(
                      selectedDay.getFullYear(),
                      selectedDay.getMonth(),
                      selectedDay.getDate()
                    );
                    const dayAppts = appointments.filter(
                      (appt) => getUTCLocalDateString(appt.appointmentDate) === dayKey
                    );

                    if (dayAppts.length === 0) {
                      return (
                        <p
                          style={{
                            fontSize: '12.5px',
                            color: 'var(--text-secondary)',
                            margin: '12px 0',
                          }}
                        >
                          No scheduled appointments.
                        </p>
                      );
                    }

                    return dayAppts.map((appt) => {
                      const total =
                        appt.services?.reduce((sum, s) => sum + Number(s.service?.price ?? 0), 0) ||
                        0;
                      return (
                        <div
                          key={appt.id}
                          style={{
                            border: '1px solid var(--border-color)',
                            borderRadius: '8px',
                            padding: '10px 12px',
                            backgroundColor: 'var(--bg-primary)',
                          }}
                        >
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                            }}
                          >
                            <span
                              style={{
                                fontWeight: 600,
                                fontSize: '13.5px',
                                color: 'var(--text-primary)',
                              }}
                            >
                              {appt.client?.firstName} {appt.client?.lastName}
                            </span>
                            <span
                              className="status-badge active"
                              style={{
                                fontSize: '9px',
                                padding: '2px 6px',
                                backgroundColor:
                                  appt.status === 'IN_PROGRESS'
                                    ? 'rgba(59, 130, 246, 0.08)'
                                    : undefined,
                                color:
                                  appt.status === 'IN_PROGRESS' ? 'var(--accent-blue)' : undefined,
                              }}
                            >
                              {appt.status}
                            </span>
                          </div>
                          <div
                            style={{
                              fontSize: '11.5px',
                              color: 'var(--accent)',
                              marginTop: '4px',
                              fontWeight: 500,
                            }}
                          >
                            Time: {appt.startTime} - {appt.endTime}
                          </div>
                          <div
                            style={{
                              fontSize: '12px',
                              color: 'var(--text-secondary)',
                              marginTop: '2px',
                            }}
                          >
                            Service: {appt.services?.map((s) => s.service?.name).join(', ')} • ₱
                            {total.toFixed(2)}
                          </div>
                          <div
                            style={{
                              fontSize: '11.5px',
                              color: 'var(--text-secondary)',
                              marginTop: '2px',
                              fontStyle: 'italic',
                            }}
                          >
                            Stylist: {appt.employee?.name || 'Unassigned'}
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>

              {/* Column 2: Walk-In Queue */}
              <div
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  borderRadius: '12px',
                  border: '1px solid var(--border-color)',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
              >
                <h4
                  style={{
                    margin: 0,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    color: 'var(--accent-blue)',
                    fontSize: '15px',
                    fontWeight: 600,
                  }}
                >
                  <UserCheck size={16} />
                  Walk-In Queue
                </h4>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    overflowY: 'auto',
                    maxHeight: '350px',
                  }}
                >
                  {(() => {
                    const dayKey = getDayKey(
                      selectedDay.getFullYear(),
                      selectedDay.getMonth(),
                      selectedDay.getDate()
                    );
                    const dayWalkins = waitlist.filter(
                      (w) => getCheckInLocalDateString(w.checkInDate) === dayKey
                    );

                    if (dayWalkins.length === 0) {
                      return (
                        <p
                          style={{
                            fontSize: '12.5px',
                            color: 'var(--text-secondary)',
                            margin: '12px 0',
                          }}
                        >
                          No walk-ins registered.
                        </p>
                      );
                    }

                    return dayWalkins.map((w) => {
                      const timeStr = w.checkInTime;
                      return (
                        <div
                          key={w.id}
                          style={{
                            border: '1px solid var(--border-color)',
                            borderRadius: '8px',
                            padding: '10px 12px',
                            backgroundColor: 'var(--bg-primary)',
                          }}
                        >
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                            }}
                          >
                            <span
                              style={{
                                fontWeight: 600,
                                fontSize: '13.5px',
                                color: 'var(--text-primary)',
                              }}
                            >
                              {w.firstName}
                            </span>
                            <span
                              className="status-badge"
                              style={{
                                fontSize: '9px',
                                padding: '2px 6px',
                                backgroundColor:
                                  w.status === 'WAITING'
                                    ? 'rgba(209, 71, 119, 0.08)'
                                    : 'rgba(16, 185, 129, 0.08)',
                                color:
                                  w.status === 'WAITING' ? 'var(--accent)' : 'var(--success-green)',
                              }}
                            >
                              {w.status}
                            </span>
                          </div>
                          <div
                            style={{
                              fontSize: '11.5px',
                              color: 'var(--accent-blue)',
                              marginTop: '4px',
                              fontWeight: 500,
                            }}
                          >
                            Checked in: {timeStr}
                          </div>
                          <div
                            style={{
                              fontSize: '12px',
                              color: 'var(--text-secondary)',
                              marginTop: '2px',
                            }}
                          >
                            Service: {w.service}
                          </div>
                          <div
                            style={{
                              fontSize: '11.5px',
                              color: 'var(--text-secondary)',
                              marginTop: '2px',
                              fontStyle: 'italic',
                            }}
                          >
                            Stylist: {w.stylist || 'First Available'}
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>

              {/* Column 3: Stylist Shifts */}
              <div
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  borderRadius: '12px',
                  border: '1px solid var(--border-color)',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
              >
                <h4
                  style={{
                    margin: 0,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    color: 'var(--success-green)',
                    fontSize: '15px',
                    fontWeight: 600,
                  }}
                >
                  <Users size={16} />
                  Stylists on Duty
                </h4>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    overflowY: 'auto',
                    maxHeight: '350px',
                  }}
                >
                  {(() => {
                    const dayOfWeek = selectedDay.getDay();

                    // Filter working staff for this day of week
                    const dailyStaff = employees.map((emp) => {
                      const daySched = emp.schedules?.find((s) => s.dayOfWeek === dayOfWeek);
                      return { emp, daySched };
                    });

                    if (dailyStaff.length === 0) {
                      return (
                        <p
                          style={{
                            fontSize: '12.5px',
                            color: 'var(--text-secondary)',
                            margin: '12px 0',
                          }}
                        >
                          No registered staff.
                        </p>
                      );
                    }

                    return dailyStaff.map(({ emp, daySched }) => {
                      const isOff = !daySched || daySched.isOff || !daySched.startTime;
                      return (
                        <div
                          key={emp.id}
                          style={{
                            border: '1px solid var(--border-color)',
                            borderRadius: '8px',
                            padding: '10px 12px',
                            backgroundColor: isOff ? 'rgba(0,0,0,0.01)' : 'var(--bg-primary)',
                            opacity: isOff ? 0.6 : 1,
                          }}
                        >
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                            }}
                          >
                            <span
                              style={{
                                fontWeight: 600,
                                fontSize: '13.5px',
                                color: 'var(--text-primary)',
                              }}
                            >
                              {emp.name}
                            </span>
                            <span
                              style={{
                                fontSize: '10px',
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                color: isOff ? 'var(--text-secondary)' : 'var(--success-green)',
                              }}
                            >
                              {isOff ? 'OFF' : 'ON DUTY'}
                            </span>
                          </div>
                          <div
                            style={{
                              fontSize: '12px',
                              color: 'var(--text-secondary)',
                              marginTop: '4px',
                            }}
                          >
                            Role: {emp.role} • {emp.specialty || 'Generalist'}
                          </div>
                          {!isOff && daySched && (
                            <div
                              style={{
                                fontSize: '11.5px',
                                color: 'var(--success-green)',
                                marginTop: '4px',
                                fontWeight: 500,
                              }}
                            >
                              Shift: {daySched.startTime} - {daySched.endTime}
                            </div>
                          )}
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div
              style={{
                padding: '16px 24px',
                borderTop: '1px solid var(--border-color)',
                display: 'flex',
                justifyContent: 'flex-end',
                backgroundColor: 'var(--bg-secondary)',
                borderBottomLeftRadius: '16px',
                borderBottomRightRadius: '16px',
              }}
            >
              <button
                className="btn-primary"
                onClick={() => setSelectedDay(null)}
                style={{ padding: '8px 20px', fontSize: '13.5px' }}
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </PageWrapper>
  );
}
