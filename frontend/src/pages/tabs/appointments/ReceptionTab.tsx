import React, { useState, useMemo } from 'react';
import { Calendar, X, RefreshCw, UserX, Undo, Trash2, UserCheck, Plus } from 'lucide-react';
import type { Branch, Appointment, AppointmentServiceRelation, Client } from '../../../types';
import { useNotification } from '../../../context/NotificationContext';
import { CheckoutModal } from './CheckoutModal';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../../utils/apiClient';
import { useCheckout } from '../../../hooks/useCheckout';
import { useBranch } from '../../../context/BranchContext';
import {
  PageWrapper,
  DataTable,
  SearchBar,
  SegmentedControl,
  PaginationControls,
  EmptyState,
  LoadingSpinner,
  ClientAutocomplete,
  FormModal,
} from '../../../components/common';
import type { ColumnDef } from '../../../components/common';

interface ReceptionTabProps {
  branches: Branch[];
  selectedBranch: string;
  employeeRole: string;
  navigateTo: (path: string) => void;
}

type StatusFilter =
  | 'ALL'
  | 'CONFIRMED'
  | 'WAITING'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'NO_SHOW';

const STATUS_FILTER_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'ALL', label: 'All Scheduled' },
  { value: 'CONFIRMED', label: 'Confirmed' },
  { value: 'WAITING', label: 'Checked In' },
  { value: 'IN_PROGRESS', label: 'Serving' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Canceled' },
  { value: 'NO_SHOW', label: 'No Show' },
];

const getManilaDateStr = (dateInput: string | Date) => {
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

export function ReceptionTab({ branches, selectedBranch, navigateTo }: ReceptionTabProps) {
  const { showToast, confirm } = useNotification();
  const queryClient = useQueryClient();
  const {
    waitlist,
    handleUpdateWaitlistStatus,
    onWalkinSubmit,
    isUpdatingWaitlistStatus,
    updatingWaitlistId,
    isAddingWalkin,
  } = useBranch();

  // Search & Filter state for Scheduled Bookings
  const todayStr = getManilaDateStr(new Date());
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [filterDate, setFilterDate] = useState(todayStr); // Defaults to today!
  const [currentPage, setCurrentPage] = useState(1);

  // Walk-in Registration Modal state
  const [isWalkinModalOpen, setIsWalkinModalOpen] = useState(false);
  const [walkinName, setWalkinName] = useState('');
  const [walkinPhone, setWalkinPhone] = useState('');
  const [walkinServiceId, setWalkinServiceId] = useState('');
  const [walkinEmployeeId, setWalkinEmployeeId] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);

  const branch = useMemo(
    () => branches.find((b) => b.id === selectedBranch),
    [branches, selectedBranch]
  );
  const activeServices = useMemo(
    () => (branch?.services || []).filter((s) => s.isActive),
    [branch]
  );
  const activeEmployees = useMemo(
    () => (branch?.employees || []).filter((e) => e.isActive && e.role !== 'OWNER'),
    [branch]
  );

  // Fetch Scheduled Bookings Query
  const {
    data: appointmentsData,
    isLoading: isAppointmentsLoading,
    refetch: refetchAppointments,
  } = useQuery<Appointment[]>({
    queryKey: ['appointments', selectedBranch, filterDate, statusFilter],
    queryFn: () => {
      let endpoint = `/api/branches/${selectedBranch}/appointments`;
      const params = new URLSearchParams();
      if (filterDate) params.append('date', filterDate);
      if (statusFilter !== 'ALL') params.append('status', statusFilter);

      if (params.toString()) {
        endpoint += `?${params.toString()}`;
      }

      return apiClient.get<Appointment[]>(endpoint);
    },
    enabled: !!selectedBranch,
    staleTime: 15000,
  });

  const appointments = appointmentsData || [];

  // Update Status mutation for scheduled bookings
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiClient.put(`/api/appointments/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments', selectedBranch] });
      queryClient.invalidateQueries({ queryKey: ['waitlist', selectedBranch] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats', selectedBranch] });
      showToast('Status updated successfully.', 'success');
    },
    onError: (err: Error) => {
      showToast(err.message, 'error');
    },
  });

  const {
    isCheckoutOpen,
    checkoutAppt,
    isLoadingAppt,
    isPending: isCheckoutPending,
    openCheckout,
    openCheckoutById,
    closeCheckout,
    submitCheckout,
  } = useCheckout(selectedBranch);

  // Delete/Cancel mutation for scheduled bookings
  const cancelMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/api/appointments/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments', selectedBranch] });
      queryClient.invalidateQueries({ queryKey: ['waitlist', selectedBranch] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats', selectedBranch] });
      showToast('Appointment deleted permanently.', 'success');
    },
    onError: (err: Error) => {
      showToast(err.message, 'error');
    },
  });

  const handleUpdateStatus = (id: string, status: string) => {
    updateStatusMutation.mutate({ id, status });
  };

  const handleCancelAppointment = async (id: string, name: string) => {
    const isConfirmed = await confirm({
      title: 'Cancel Booking',
      body: `Are you sure you want to mark the appointment for ${name} as Canceled?`,
      confirmLabel: 'Yes, Cancel',
      cancelLabel: 'Keep Booking',
      isDestructive: true,
    });
    if (!isConfirmed) return;
    handleUpdateStatus(id, 'CANCELLED');
  };

  const handleDeletePermanently = async (id: string, name: string) => {
    const isConfirmed = await confirm({
      title: 'Delete Appointment Permanently',
      body: `Are you sure you want to permanently DELETE the appointment for ${name}? This action is irreversible and will remove the booking from all ledger records.`,
      confirmLabel: 'Yes, Delete Permanently',
      cancelLabel: 'Keep Record',
      isDestructive: true,
    });
    if (!isConfirmed) return;
    cancelMutation.mutate(id);
  };

  // Local Search filtering for bookings
  const filteredAppointments = appointments.filter((appt) => {
    const clientName =
      `${appt.client?.firstName || ''} ${appt.client?.lastName || ''}`.toLowerCase();
    const phone = (appt.client?.phoneNumber || '').toLowerCase();
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    return clientName.includes(query) || phone.includes(query);
  });

  const itemsPerPage = 8;
  const totalPages = Math.ceil(filteredAppointments.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedAppointments = filteredAppointments.slice(startIndex, startIndex + itemsPerPage);

  // Walk-In Form validation & submission
  const validateName = (name: string): boolean => {
    const trimmed = name.trim();
    if (!trimmed) {
      setNameError('Client name is required.');
      return false;
    }
    if (!selectedClient) {
      const parts = trimmed.split(/\s+/);
      if (parts.length < 2) {
        setNameError('Please enter both first and last name (e.g. John Doe).');
        return false;
      }
    }
    setNameError(null);
    return true;
  };

  const validatePhone = (phone: string): boolean => {
    const trimmed = phone.trim();
    if (!trimmed) {
      setPhoneError('Phone number is required.');
      return false;
    }
    const phoneRegex = /^(09\d{9}|09\d{2}\s\d{3}\s\d{4})$/;
    if (!phoneRegex.test(trimmed)) {
      setPhoneError('Phone number must be in format 09xxxxxxxxx or 09xx xxx xxxx.');
      return false;
    }
    setPhoneError(null);
    return true;
  };

  const handleClearSelection = () => {
    setSelectedClient(null);
    setWalkinName('');
    setWalkinPhone('');
    setPhoneError(null);
    setNameError(null);
  };

  const handleWalkinFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const serviceId = walkinServiceId || activeServices[0]?.id;
    if (!serviceId) return;

    const isNameValid = validateName(walkinName);
    const isPhoneValid = validatePhone(walkinPhone);
    if (!isNameValid || !isPhoneValid) return;

    let firstName: string;
    let lastName: string;
    if (selectedClient) {
      firstName = selectedClient.firstName;
      lastName = selectedClient.lastName;
    } else {
      const nameParts = walkinName.trim().split(/\s+/);
      firstName = nameParts[0] || '';
      lastName = nameParts.slice(1).join(' ') || '';
    }

    onWalkinSubmit({
      firstName,
      lastName,
      phone: walkinPhone.trim(),
      serviceId,
      employeeId: walkinEmployeeId || undefined,
    });

    // Reset and close
    setWalkinName('');
    setWalkinPhone('');
    setWalkinEmployeeId('');
    setWalkinServiceId('');
    setSelectedClient(null);
    setPhoneError(null);
    setNameError(null);
    setIsWalkinModalOpen(false);
  };

  const columns: ColumnDef<Appointment>[] = [
    {
      key: 'client',
      header: 'Client Details',
      render: (appt) => (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {appt.queueNumber && (
              <span
                className="micro-badge"
                style={{
                  backgroundColor: 'rgba(59, 130, 246, 0.08)',
                  color: 'var(--accent-blue)',
                  fontWeight: 'bold',
                  fontSize: '9px',
                  padding: '1px 5px',
                  borderColor: 'rgba(59, 130, 246, 0.15)',
                }}
              >
                {appt.queueNumber}
              </span>
            )}
            <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
              {appt.client?.firstName} {appt.client?.lastName}
            </div>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            {appt.client?.phoneNumber}
          </div>
        </div>
      ),
    },
    {
      key: 'dateTime',
      header: 'Booking Schedule',
      render: (appt) => {
        const dateStr = new Date(appt.appointmentDate).toLocaleDateString([], {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          timeZone: 'Asia/Manila',
        });
        return (
          <div>
            <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{dateStr}</div>
            <div style={{ fontSize: '12px', color: 'var(--accent)' }}>
              {appt.startTime} - {appt.endTime}
            </div>
          </div>
        );
      },
    },
    {
      key: 'services',
      header: 'Requested Treatment',
      render: (appt) => {
        const serviceNames =
          appt.services?.map((s: AppointmentServiceRelation) => s.service?.name).join(', ') ||
          'N/A';
        const total =
          appt.services?.reduce(
            (sum: number, s: AppointmentServiceRelation) => sum + Number(s.service?.price ?? 0),
            0
          ) || 0;
        return (
          <div>
            <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{serviceNames}</div>
            <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
              Total: ₱{total.toFixed(2)}
            </div>
          </div>
        );
      },
    },
    {
      key: 'employee',
      header: 'Assigned Stylist',
      render: (appt) => (
        <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>
          {appt.employee?.name || 'Unassigned'}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (appt) => {
        let badgeClass = 'inactive';
        if (appt.status === 'CONFIRMED') badgeClass = 'active';
        if (appt.status === 'WAITING') badgeClass = 'active';
        if (appt.status === 'IN_PROGRESS') badgeClass = 'active';
        if (appt.status === 'COMPLETED') badgeClass = 'active';

        const labelMap: Record<string, string> = {
          PENDING: 'Pending',
          CONFIRMED: 'Confirmed',
          WAITING: 'Checked In',
          IN_PROGRESS: 'Serving',
          COMPLETED: 'Completed',
          CANCELLED: 'Canceled',
          NO_SHOW: 'No Show',
        };

        const apptDateStr = getManilaDateStr(new Date(appt.appointmentDate));
        const todayStr = getManilaDateStr(new Date());

        const isPast = apptDateStr < todayStr;

        let displayLabel = labelMap[appt.status] || appt.status;
        let styleObj: React.CSSProperties = {};

        if (
          appt.status === 'NO_SHOW' ||
          (isPast && (appt.status === 'CONFIRMED' || appt.status === 'WAITING'))
        ) {
          displayLabel = 'No Show';
          badgeClass = 'inactive';
          styleObj = {
            backgroundColor: 'rgba(239, 68, 68, 0.08)',
            color: '#EF4444',
          };
        } else if (appt.status === 'CANCELLED') {
          styleObj = {
            backgroundColor: 'rgba(107, 114, 128, 0.08)',
            color: '#6B7280',
          };
        } else if (appt.status === 'IN_PROGRESS') {
          styleObj = {
            backgroundColor: 'rgba(59, 130, 246, 0.08)',
            color: 'var(--accent-blue)',
          };
        } else if (appt.status === 'WAITING') {
          styleObj = {
            backgroundColor: 'rgba(16, 185, 129, 0.08)',
            color: '#10B981',
          };
        }

        return (
          <span
            className={`status-badge ${badgeClass}`}
            style={{
              padding: '2px 8px',
              fontSize: '10px',
              ...styleObj,
            }}
          >
            {displayLabel}
          </span>
        );
      },
    },
    {
      key: 'actions',
      header: '',
      style: { width: '220px', textAlign: 'right' },
      render: (appt) => {
        const clientName =
          `${appt.client?.firstName || 'Guest'} ${appt.client?.lastName || ''}`.trim();

        const apptDateStr = getManilaDateStr(new Date(appt.appointmentDate));
        const todayStr = getManilaDateStr(new Date());

        const isToday = apptDateStr === todayStr;
        const isPast = apptDateStr < todayStr;

        const isUpdating =
          updateStatusMutation.isPending && updateStatusMutation.variables?.id === appt.id;
        const isDeleting = cancelMutation.isPending && cancelMutation.variables === appt.id;

        return (
          <div
            style={{
              display: 'flex',
              gap: '6px',
              justifyContent: 'flex-end',
              flexWrap: 'wrap',
              alignItems: 'center',
            }}
          >
            {appt.status === 'CONFIRMED' && (
              <>
                {isToday ? (
                  <>
                    <button
                      className="btn-primary"
                      title="Check In Guest"
                      disabled={isUpdating}
                      onClick={() => handleUpdateStatus(appt.id, 'WAITING')}
                      style={{
                        padding: '4px 10px',
                        fontSize: '11px',
                        backgroundColor: '#10B981',
                        borderColor: '#10B981',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      {isUpdating && updateStatusMutation.variables?.status === 'WAITING' ? (
                        <LoadingSpinner size="sm" color="#fff" />
                      ) : (
                        'Check In'
                      )}
                    </button>
                    <button
                      className="btn-primary"
                      title="Start Session Directly"
                      disabled={isUpdating}
                      onClick={() => handleUpdateStatus(appt.id, 'IN_PROGRESS')}
                      style={{
                        padding: '4px 10px',
                        fontSize: '11px',
                        backgroundColor: 'var(--accent-blue)',
                        borderColor: 'var(--accent-blue)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      {isUpdating && updateStatusMutation.variables?.status === 'IN_PROGRESS' ? (
                        <LoadingSpinner size="sm" color="#fff" />
                      ) : (
                        'Serve'
                      )}
                    </button>
                  </>
                ) : isPast ? (
                  <>
                    <button
                      className="btn-secondary"
                      title="Mark No Show in Database"
                      disabled={isUpdating}
                      onClick={() => handleUpdateStatus(appt.id, 'NO_SHOW')}
                      style={{
                        padding: '4px 10px',
                        fontSize: '11px',
                        backgroundColor: 'rgba(239, 68, 68, 0.08)',
                        borderColor: '#EF4444',
                        color: '#EF4444',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      {isUpdating && updateStatusMutation.variables?.status === 'NO_SHOW' ? (
                        <LoadingSpinner size="sm" color="#EF4444" />
                      ) : (
                        'Mark No Show'
                      )}
                    </button>
                  </>
                ) : (
                  <span
                    style={{
                      fontSize: '11px',
                      color: 'var(--text-secondary)',
                      fontStyle: 'italic',
                      paddingRight: '8px',
                    }}
                  >
                    Upcoming
                  </span>
                )}

                {/* No Show button for active bookings on their date */}
                {isToday && (
                  <button
                    className="btn-secondary"
                    title="Mark No Show"
                    disabled={isUpdating}
                    onClick={() => handleUpdateStatus(appt.id, 'NO_SHOW')}
                    style={{
                      padding: '4px 6px',
                      fontSize: '11px',
                      backgroundColor: 'rgba(239, 68, 68, 0.05)',
                      borderColor: 'rgba(239, 68, 68, 0.3)',
                      color: '#EF4444',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <UserX size={12} />
                  </button>
                )}

                {/* Cancel Booking */}
                <button
                  className="btn-secondary"
                  title="Cancel Booking"
                  disabled={isUpdating}
                  onClick={() => handleCancelAppointment(appt.id, clientName)}
                  style={{
                    padding: '4px 6px',
                    color: 'var(--text-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <X size={12} />
                </button>

                {/* Permanent Delete */}
                <button
                  className="btn-secondary"
                  title="Delete Permanently"
                  disabled={isDeleting}
                  onClick={() => handleDeletePermanently(appt.id, clientName)}
                  style={{
                    padding: '4px 6px',
                    color: 'var(--text-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {isDeleting ? (
                    <LoadingSpinner size="sm" color="var(--accent)" />
                  ) : (
                    <Trash2 size={12} />
                  )}
                </button>
              </>
            )}

            {appt.status === 'WAITING' && (
              <>
                {isToday ? (
                  <button
                    className="btn-primary"
                    title="Start Session"
                    disabled={isUpdating}
                    onClick={() => handleUpdateStatus(appt.id, 'IN_PROGRESS')}
                    style={{
                      padding: '4px 10px',
                      fontSize: '11px',
                      backgroundColor: 'var(--accent-blue)',
                      borderColor: 'var(--accent-blue)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    {isUpdating && updateStatusMutation.variables?.status === 'IN_PROGRESS' ? (
                      <LoadingSpinner size="sm" color="#fff" />
                    ) : (
                      'Serve'
                    )}
                  </button>
                ) : isPast ? (
                  <>
                    <button
                      className="btn-secondary"
                      title="Mark No Show in Database"
                      disabled={isUpdating}
                      onClick={() => handleUpdateStatus(appt.id, 'NO_SHOW')}
                      style={{
                        padding: '4px 10px',
                        fontSize: '11px',
                        backgroundColor: 'rgba(239, 68, 68, 0.08)',
                        borderColor: '#EF4444',
                        color: '#EF4444',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      {isUpdating && updateStatusMutation.variables?.status === 'NO_SHOW' ? (
                        <LoadingSpinner size="sm" color="#EF4444" />
                      ) : (
                        'Mark No Show'
                      )}
                    </button>
                  </>
                ) : null}

                {/* No Show button for checked-in bookings today */}
                {isToday && (
                  <button
                    className="btn-secondary"
                    title="Mark No Show"
                    disabled={isUpdating}
                    onClick={() => handleUpdateStatus(appt.id, 'NO_SHOW')}
                    style={{
                      padding: '4px 6px',
                      fontSize: '11px',
                      backgroundColor: 'rgba(239, 68, 68, 0.05)',
                      borderColor: 'rgba(239, 68, 68, 0.3)',
                      color: '#EF4444',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <UserX size={12} />
                  </button>
                )}

                {/* Cancel Booking */}
                <button
                  className="btn-secondary"
                  title="Cancel Booking"
                  disabled={isUpdating}
                  onClick={() => handleCancelAppointment(appt.id, clientName)}
                  style={{
                    padding: '4px 6px',
                    color: 'var(--text-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <X size={12} />
                </button>

                {/* Permanent Delete */}
                <button
                  className="btn-secondary"
                  title="Delete Permanently"
                  disabled={isDeleting}
                  onClick={() => handleDeletePermanently(appt.id, clientName)}
                  style={{
                    padding: '4px 6px',
                    color: 'var(--text-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {isDeleting ? (
                    <LoadingSpinner size="sm" color="var(--accent)" />
                  ) : (
                    <Trash2 size={12} />
                  )}
                </button>
              </>
            )}

            {appt.status === 'IN_PROGRESS' && (
              <>
                <button
                  className="btn-primary"
                  title="Mark Session Completed"
                  onClick={() => openCheckout(appt)}
                  style={{ padding: '4px 10px', fontSize: '11px' }}
                >
                  Complete
                </button>
                {/* Cancel Booking */}
                <button
                  className="btn-secondary"
                  title="Cancel Booking"
                  disabled={isUpdating}
                  onClick={() => handleCancelAppointment(appt.id, clientName)}
                  style={{
                    padding: '4px 6px',
                    color: 'var(--text-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <X size={12} />
                </button>
                {/* Permanent Delete */}
                <button
                  className="btn-secondary"
                  title="Delete Permanently"
                  disabled={isDeleting}
                  onClick={() => handleDeletePermanently(appt.id, clientName)}
                  style={{
                    padding: '4px 6px',
                    color: 'var(--text-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {isDeleting ? (
                    <LoadingSpinner size="sm" color="var(--accent)" />
                  ) : (
                    <Trash2 size={12} />
                  )}
                </button>
              </>
            )}

            {(appt.status === 'CANCELLED' || appt.status === 'NO_SHOW') && (
              <>
                <button
                  className="btn-secondary"
                  title="Revert Status to Confirmed"
                  disabled={isUpdating}
                  onClick={() => handleUpdateStatus(appt.id, 'CONFIRMED')}
                  style={{
                    padding: '4px 8px',
                    fontSize: '11px',
                    backgroundColor: 'rgba(59, 130, 246, 0.05)',
                    borderColor: 'rgba(59, 130, 246, 0.3)',
                    color: 'var(--accent-blue)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  {isUpdating && updateStatusMutation.variables?.status === 'CONFIRMED' ? (
                    <LoadingSpinner size="sm" color="var(--accent-blue)" />
                  ) : (
                    <>
                      <Undo size={12} /> Revert
                    </>
                  )}
                </button>
                {/* Permanent Delete */}
                <button
                  className="btn-secondary"
                  title="Delete Permanently"
                  disabled={isDeleting}
                  onClick={() => handleDeletePermanently(appt.id, clientName)}
                  style={{
                    padding: '4px 6px',
                    color: 'var(--text-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {isDeleting ? (
                    <LoadingSpinner size="sm" color="var(--accent)" />
                  ) : (
                    <Trash2 size={12} />
                  )}
                </button>
              </>
            )}

            {appt.status === 'COMPLETED' && (
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>—</span>
            )}
          </div>
        );
      },
    },
  ];

  const waitlistActiveItems = useMemo(
    () => waitlist.filter((item) => item.status !== 'COMPLETED'),
    [waitlist]
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <PageWrapper
        title="Reception Desk"
        subtitle="Manage daily walk-in queues and client reservations side by side."
        action={
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              className="btn-secondary"
              title="Refresh All Lists"
              onClick={() => {
                refetchAppointments();
                queryClient.invalidateQueries({ queryKey: ['waitlist', selectedBranch] });
              }}
              style={{
                padding: '8px 12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <RefreshCw size={14} className={isAppointmentsLoading ? 'spin' : ''} />
            </button>
            <button
              className="btn-primary"
              onClick={() => navigateTo('/')}
              style={{ padding: '8px 16px', fontSize: '13px' }}
            >
              + Book Scheduled Slot
            </button>
          </div>
        }
      >
        <div
          className="reception-split-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))',
            gap: '24px',
            alignItems: 'start',
          }}
        >
          {/* =========================================
              LEFT COLUMN: LIVE WAITLIST (QUEUE)
              ========================================= */}
          <div className="glass-panel" style={{ margin: 0, height: '100%' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px',
                borderBottom: '1px solid var(--border-color)',
                paddingBottom: '16px',
              }}
            >
              <div>
                <h2
                  style={{
                    fontSize: '20px',
                    fontWeight: 600,
                    color: 'var(--accent)',
                    fontFamily: 'var(--font-sans)',
                  }}
                >
                  Live Queue (Walk-In & Check-Ins)
                </h2>
                <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  Real-time checked-in clients waiting to be served.
                </p>
              </div>
              <button
                className="btn-primary btn-action-medium"
                onClick={() => setIsWalkinModalOpen(true)}
                style={{ padding: '6px 12px', fontSize: '12.5px' }}
              >
                <Plus size={14} /> Register Walk-In
              </button>
            </div>

            {waitlistActiveItems.length > 0 ? (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  maxHeight: '600px',
                  overflowY: 'auto',
                  paddingRight: '4px',
                }}
              >
                {waitlistActiveItems.map((item) => (
                  <div key={item.id} className="schedule-item" style={{ margin: 0 }}>
                    <div>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          marginBottom: '4px',
                        }}
                      >
                        {item.queueNumber && (
                          <span
                            className="micro-badge"
                            style={{
                              backgroundColor: 'rgba(59, 130, 246, 0.08)',
                              color: 'var(--accent-blue)',
                              fontWeight: 'bold',
                              fontSize: '10px',
                              padding: '2px 6px',
                              borderColor: 'rgba(59, 130, 246, 0.15)',
                            }}
                          >
                            {item.queueNumber}
                          </span>
                        )}
                        <span
                          style={{
                            fontWeight: 600,
                            color: 'var(--text-primary)',
                            fontSize: '14.5px',
                          }}
                        >
                          {item.firstName} {item.lastName}
                        </span>
                        {item.status === 'IN_PROGRESS' && (
                          <span
                            className="status-badge active"
                            style={{ fontSize: '9px', padding: '2px 8px' }}
                          >
                            Serving
                          </span>
                        )}
                      </div>
                      <div
                        style={{
                          fontSize: '13px',
                          color: 'var(--text-secondary)',
                          marginBottom: '4px',
                        }}
                      >
                        {item.service} &bull; Preferring{' '}
                        <span style={{ fontWeight: 500, color: 'var(--accent)' }}>
                          {item.stylist}
                        </span>
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          gap: '12px',
                          fontSize: '11px',
                          color: 'var(--text-secondary)',
                        }}
                      >
                        <span>Arrival: {item.checkInTime}</span>
                        <span>Phone: {item.phone}</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {item.status === 'WAITING' && (
                        <button
                          className="btn-primary btn-action-blue"
                          disabled={isUpdatingWaitlistStatus && updatingWaitlistId === item.id}
                          onClick={() => handleUpdateWaitlistStatus(item.id, 'IN_PROGRESS')}
                          style={{
                            padding: '6px 12px',
                            fontSize: '12px',
                            backgroundColor: 'var(--accent-blue)',
                            borderColor: 'var(--accent-blue)',
                          }}
                        >
                          {isUpdatingWaitlistStatus && updatingWaitlistId === item.id ? (
                            <LoadingSpinner size="sm" color="#fff" />
                          ) : (
                            'Serve'
                          )}
                        </button>
                      )}
                      {item.status === 'IN_PROGRESS' && (
                        <button
                          className="btn-primary btn-action-done"
                          disabled={isLoadingAppt}
                          onClick={() => openCheckoutById(item.id)}
                          style={{
                            padding: '6px 12px',
                            fontSize: '12px',
                            backgroundColor: 'var(--success-green)',
                            borderColor: 'var(--success-green)',
                          }}
                        >
                          {isLoadingAppt ? <LoadingSpinner size="sm" color="#fff" /> : 'Complete'}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={<UserCheck size={32} />}
                title="Queue is empty"
                description="When guests check-in or receptionist registers a walk-in, they will appear here."
              />
            )}
          </div>

          {/* =========================================
              RIGHT COLUMN: SCHEDULED BOOKINGS LEDGER
              ========================================= */}
          <div className="glass-panel" style={{ margin: 0, height: '100%' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '16px',
                borderBottom: '1px solid var(--border-color)',
                paddingBottom: '16px',
              }}
            >
              <div>
                <h2
                  style={{
                    fontSize: '20px',
                    fontWeight: 600,
                    color: 'var(--accent)',
                    fontFamily: 'var(--font-sans)',
                  }}
                >
                  Scheduled Bookings Ledger
                </h2>
                <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  Locate and check-in pre-booked appointments.
                </p>
              </div>
            </div>

            {/* Filter controls */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                marginBottom: '16px',
              }}
            >
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr auto',
                  gap: '12px',
                  alignItems: 'center',
                }}
              >
                <SearchBar
                  value={searchQuery}
                  onChange={(v) => {
                    setSearchQuery(v);
                    setCurrentPage(1);
                  }}
                  placeholder="Search bookings by name or phone..."
                />
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <label
                    style={{
                      fontSize: '12.5px',
                      fontWeight: 500,
                      color: 'var(--text-secondary)',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    Date:
                  </label>
                  <input
                    type="date"
                    value={filterDate}
                    onChange={(e) => {
                      setFilterDate(e.target.value);
                      setCurrentPage(1);
                    }}
                    style={{
                      padding: '5px 10px',
                      borderRadius: '6px',
                      border: '1px solid var(--border-color)',
                      fontSize: '12.5px',
                      backgroundColor: 'var(--bg-secondary)',
                      color: 'var(--text-primary)',
                      width: '130px',
                    }}
                  />
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderTop: '1px solid var(--border-color)',
                  paddingTop: '12px',
                }}
              >
                <SegmentedControl
                  options={STATUS_FILTER_OPTIONS}
                  value={statusFilter}
                  onChange={(v) => {
                    setStatusFilter(v);
                    setCurrentPage(1);
                  }}
                />
              </div>
            </div>

            {/* Bookings Data Table */}
            <div className="data-table-container">
              <DataTable
                columns={columns}
                data={paginatedAppointments}
                keyExtractor={(appt) => appt.id}
                emptyState={
                  <EmptyState
                    icon={<Calendar size={32} />}
                    title={
                      isAppointmentsLoading ? 'Loading bookings...' : 'No appointments scheduled'
                    }
                    description={
                      isAppointmentsLoading
                        ? 'Retrieving booking records from server...'
                        : 'Adjust filters or search queries above.'
                    }
                  />
                }
              />
            </div>

            <PaginationControls
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        </div>
      </PageWrapper>

      {/* =========================================
          WALK-IN REGISTRATION FORM MODAL
          ========================================= */}
      <FormModal
        isOpen={isWalkinModalOpen}
        onClose={() => {
          setIsWalkinModalOpen(false);
          handleClearSelection();
        }}
        title="Register Walk-In Guest"
        subtitle="Add a guest to the live queue. Search name to autofill returning clients."
        submitLabel="Queue Guest"
        cancelLabel="Cancel"
        isPending={isAddingWalkin}
        onSubmit={handleWalkinFormSubmit}
        maxWidth="500px"
      >
        <div className="form-group">
          <div className="flex-align-center" style={{ gap: '8px', marginBottom: '4px' }}>
            <label className="form-label" style={{ marginBottom: 0 }}>
              Client Name *
            </label>
            {selectedClient ? (
              <span
                className="micro-badge"
                style={{ backgroundColor: '#ecfdf5', color: '#10b981', borderColor: '#a7f3d0' }}
              >
                Returning Client
              </span>
            ) : walkinName.trim() ? (
              <span className="micro-badge">New Guest</span>
            ) : null}
          </div>
          <ClientAutocomplete
            value={
              selectedClient
                ? `${selectedClient.firstName} ${selectedClient.lastName}`.trim()
                : walkinName
            }
            onChange={(val) => {
              setWalkinName(val);
              if (selectedClient) {
                setSelectedClient(null);
              }
              if (nameError) validateName(val);
            }}
            onSelect={(client) => {
              setSelectedClient(client);
              setWalkinName(`${client.firstName} ${client.lastName}`.trim());
              setWalkinPhone(client.phoneNumber || '');
              setPhoneError(null);
              setNameError(null);
            }}
            isLocked={!!selectedClient}
            onClear={handleClearSelection}
            placeholder="Type name or phone to search..."
            required
          />
          {nameError && (
            <span
              className="form-error-text"
              style={{ marginTop: '4px', display: 'block', color: '#EF4444', fontSize: '12px' }}
            >
              {nameError}
            </span>
          )}
        </div>

        <div className="form-group">
          <div className="flex-align-center" style={{ gap: '8px', marginBottom: '4px' }}>
            <label className="form-label" style={{ marginBottom: 0 }}>
              Phone Number *
            </label>
            {selectedClient && (
              <span
                className="micro-badge"
                style={{
                  backgroundColor: 'rgba(59, 130, 246, 0.05)',
                  color: 'var(--accent-blue)',
                  borderColor: 'rgba(59, 130, 246, 0.15)',
                }}
              >
                ✓ Verified
              </span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="tel"
              placeholder="e.g. 09xxxxxxxxx"
              value={walkinPhone}
              onChange={(e) => {
                const val = e.target.value;
                setWalkinPhone(val);
                if (phoneError) validatePhone(val);
              }}
              onBlur={() => validatePhone(walkinPhone)}
              disabled={!!selectedClient}
              required
              style={{
                flex: 1,
                backgroundColor: selectedClient ? 'var(--bg-secondary)' : undefined,
                cursor: selectedClient ? 'not-allowed' : undefined,
                opacity: selectedClient ? 0.8 : 1,
                borderColor: phoneError ? '#EF4444' : undefined,
              }}
            />
            {selectedClient && (
              <button
                type="button"
                className="btn-secondary"
                onClick={handleClearSelection}
                style={{
                  padding: '10px 16px',
                  fontSize: '13px',
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-primary)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                Clear
              </button>
            )}
          </div>
          {phoneError && (
            <span
              className="form-error-text"
              style={{ marginTop: '4px', display: 'block', color: '#EF4444', fontSize: '12px' }}
            >
              {phoneError}
            </span>
          )}
        </div>

        <div className="form-group">
          <label className="form-label">Stylist Preference</label>
          <select value={walkinEmployeeId} onChange={(e) => setWalkinEmployeeId(e.target.value)}>
            <option value="">First Available Stylist</option>
            {activeEmployees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.name}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Requested Treatment *</label>
          <select
            value={walkinServiceId || activeServices[0]?.id || ''}
            onChange={(e) => setWalkinServiceId(e.target.value)}
            required
          >
            <option value="" disabled>
              Select a service...
            </option>
            {activeServices.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} - ₱{Number(s.price).toFixed(2)}
              </option>
            ))}
          </select>
        </div>
      </FormModal>

      {/* =========================================
          UNIFIED CHECKOUT MODAL
          ========================================= */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={closeCheckout}
        onSubmit={submitCheckout}
        appointment={checkoutAppt}
        employees={branch?.employees || []}
        isPending={isCheckoutPending}
      />
    </div>
  );
}
