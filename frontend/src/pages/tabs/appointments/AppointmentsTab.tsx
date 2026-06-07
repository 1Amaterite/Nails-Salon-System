import { useState } from 'react';
import { Calendar, X, RefreshCw, UserX, Undo, Trash2 } from 'lucide-react';
import type { Branch, Appointment, AppointmentServiceRelation } from '../../../types';
import { useNotification } from '../../../context/NotificationContext';
import { CheckoutModal } from './CheckoutModal';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../../utils/apiClient';
import { useCheckout } from '../../../hooks/useCheckout';
import {
  PageWrapper,
  DataTable,
  SearchBar,
  SegmentedControl,
  PaginationControls,
  EmptyState,
  LoadingSpinner,
} from '../../../components/common';
import type { ColumnDef } from '../../../components/common';

interface AppointmentsTabProps {
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

export function AppointmentsTab({ branches, selectedBranch, navigateTo }: AppointmentsTabProps) {
  const { showToast, confirm } = useNotification();
  const queryClient = useQueryClient();

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [filterDate, setFilterDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const {
    data: appointmentsData,
    isLoading,
    refetch,
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

  // Update Status mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiClient.put(`/api/appointments/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments', selectedBranch] });
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
    isPending: isCheckoutPending,
    openCheckout,
    closeCheckout,
    submitCheckout,
  } = useCheckout(selectedBranch);

  // Delete/Cancel mutation
  const cancelMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/api/appointments/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments', selectedBranch] });
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

  // Local Search filtering
  const filteredAppointments = appointments.filter((appt) => {
    const clientName =
      `${appt.client?.firstName || ''} ${appt.client?.lastName || ''}`.toLowerCase();
    const phone = (appt.client?.phoneNumber || '').toLowerCase();
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    return clientName.includes(query) || phone.includes(query);
  });

  const itemsPerPage = 15;
  const totalPages = Math.ceil(filteredAppointments.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedAppointments = filteredAppointments.slice(startIndex, startIndex + itemsPerPage);

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
          timeZone: 'UTC',
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

        const apptDate = new Date(appt.appointmentDate);
        const apptYear = apptDate.getUTCFullYear();
        const apptMonth = String(apptDate.getUTCMonth() + 1).padStart(2, '0');
        const apptDay = String(apptDate.getUTCDate()).padStart(2, '0');
        const apptDateStr = `${apptYear}-${apptMonth}-${apptDay}`;

        const now = new Date();
        const nowYear = now.getFullYear();
        const nowMonth = String(now.getMonth() + 1).padStart(2, '0');
        const nowDay = String(now.getDate()).padStart(2, '0');
        const todayStr = `${nowYear}-${nowMonth}-${nowDay}`;

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

        const apptDate = new Date(appt.appointmentDate);
        const apptYear = apptDate.getUTCFullYear();
        const apptMonth = String(apptDate.getUTCMonth() + 1).padStart(2, '0');
        const apptDay = String(apptDate.getUTCDate()).padStart(2, '0');
        const apptDateStr = `${apptYear}-${apptMonth}-${apptDay}`;

        const now = new Date();
        const nowYear = now.getFullYear();
        const nowMonth = String(now.getMonth() + 1).padStart(2, '0');
        const nowDay = String(now.getDate()).padStart(2, '0');
        const todayStr = `${nowYear}-${nowMonth}-${nowDay}`;

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

                {/* Cancel Booking sets status to CANCELLED in DB */}
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
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = '#dc2626';
                    e.currentTarget.style.borderColor = '#fca5a5';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = 'var(--text-secondary)';
                    e.currentTarget.style.borderColor = 'var(--border-color)';
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
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = '#dc2626';
                    e.currentTarget.style.borderColor = '#fca5a5';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = 'var(--text-secondary)';
                    e.currentTarget.style.borderColor = 'var(--border-color)';
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

                {/* Cancel Booking sets status to CANCELLED in DB */}
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
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = '#dc2626';
                    e.currentTarget.style.borderColor = '#fca5a5';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = 'var(--text-secondary)';
                    e.currentTarget.style.borderColor = 'var(--border-color)';
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
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = '#dc2626';
                    e.currentTarget.style.borderColor = '#fca5a5';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = 'var(--text-secondary)';
                    e.currentTarget.style.borderColor = 'var(--border-color)';
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
                {/* Cancel Booking sets status to CANCELLED in DB */}
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
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = '#dc2626';
                    e.currentTarget.style.borderColor = '#fca5a5';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = 'var(--text-secondary)';
                    e.currentTarget.style.borderColor = 'var(--border-color)';
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
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = '#dc2626';
                    e.currentTarget.style.borderColor = '#fca5a5';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = 'var(--text-secondary)';
                    e.currentTarget.style.borderColor = 'var(--border-color)';
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
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = '#dc2626';
                    e.currentTarget.style.borderColor = '#fca5a5';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = 'var(--text-secondary)';
                    e.currentTarget.style.borderColor = 'var(--border-color)';
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

  return (
    <PageWrapper
      title="Clients Booked Ledger"
      subtitle="Browse and manage scheduled client reservations."
      action={
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            className="btn-secondary"
            title="Refresh List"
            onClick={() => refetch()}
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
            onClick={() => navigateTo('/')}
            style={{ padding: '8px 16px', fontSize: '13px' }}
          >
            + Book New Slot
          </button>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '20px' }}>
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
            placeholder="Search by client name or phone number..."
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)' }}>
              Filter Date:
            </label>
            <input
              type="date"
              value={filterDate}
              onChange={(e) => {
                setFilterDate(e.target.value);
                setCurrentPage(1);
              }}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: '1px solid var(--border-color)',
                fontSize: '13px',
                backgroundColor: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
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
            paddingTop: '16px',
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

      <DataTable
        columns={columns}
        data={paginatedAppointments}
        keyExtractor={(appt) => appt.id}
        emptyState={
          <EmptyState
            icon={<Calendar size={32} />}
            title={isLoading ? 'Loading bookings...' : 'No appointments scheduled'}
            description={
              isLoading
                ? 'Retrieving booking records from server...'
                : 'Adjust your search queries or use the public homepage to register a new slot.'
            }
          />
        }
      />

      <PaginationControls
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />

      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={closeCheckout}
        onSubmit={submitCheckout}
        appointment={checkoutAppt}
        employees={branches.find((b) => b.id === selectedBranch)?.employees || []}
        isPending={isCheckoutPending}
      />
    </PageWrapper>
  );
}
