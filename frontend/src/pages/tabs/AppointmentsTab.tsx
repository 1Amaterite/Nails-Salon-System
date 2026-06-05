import { useState } from 'react';
import { Calendar, X, RefreshCw } from 'lucide-react';
import type { Branch, Appointment, AppointmentServiceRelation } from '../../types';
import { useNotification } from '../../context/NotificationContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchWithTimeout } from '../../utils/api';
import { getApiUrl, getAuthToken } from '../../utils/getApiUrl';
import {
  PageWrapper,
  DataTable,
  SearchBar,
  SegmentedControl,
  PaginationControls,
  EmptyState,
} from '../../components/common';
import type { ColumnDef } from '../../components/common';

interface AppointmentsTabProps {
  branches: Branch[];
  selectedBranch: string;
  employeeRole: string;
  navigateTo: (path: string) => void;
}

type StatusFilter = 'ALL' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

const STATUS_FILTER_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'ALL', label: 'All Scheduled' },
  { value: 'CONFIRMED', label: 'Confirmed' },
  { value: 'IN_PROGRESS', label: 'Serving' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Canceled' },
];

export function AppointmentsTab({ selectedBranch, navigateTo }: AppointmentsTabProps) {
  const { showToast, confirm } = useNotification();
  const queryClient = useQueryClient();

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [filterDate, setFilterDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch appointments
  const API_URL = getApiUrl();

  const {
    data: appointmentsData,
    isLoading,
    refetch,
  } = useQuery<Appointment[]>({
    queryKey: ['appointments', selectedBranch, filterDate, statusFilter],
    queryFn: async () => {
      const token = getAuthToken(); // resolved inside queryFn — errors caught by React Query
      let url = `${API_URL}/api/branches/${selectedBranch}/appointments`;
      const params = new URLSearchParams();
      if (filterDate) params.append('date', filterDate);
      if (statusFilter !== 'ALL') params.append('status', statusFilter);

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const res = await fetchWithTimeout(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch appointments');
      return res.json();
    },
    enabled: !!selectedBranch,
  });

  const appointments = appointmentsData || [];

  // Update Status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const token = getAuthToken();
      const res = await fetchWithTimeout(`${API_URL}/api/appointments/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to update status.');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments', selectedBranch] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats', selectedBranch] });
      showToast('Status updated successfully.', 'success');
    },
    onError: (err: Error) => {
      showToast(err.message, 'error');
    },
  });

  // Delete/Cancel mutation
  const cancelMutation = useMutation({
    mutationFn: async (id: string) => {
      const token = getAuthToken();
      const res = await fetchWithTimeout(`${API_URL}/api/appointments/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to cancel appointment.');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments', selectedBranch] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats', selectedBranch] });
      showToast('Appointment canceled successfully.', 'success');
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
      body: `Are you sure you want to cancel the appointment for ${name}?`,
      confirmLabel: 'Yes, Cancel',
      cancelLabel: 'Keep Appointment',
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
          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
            {appt.client?.firstName} {appt.client?.lastName}
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
        if (appt.status === 'IN_PROGRESS') badgeClass = 'active';
        if (appt.status === 'COMPLETED') badgeClass = 'active';

        const labelMap: Record<string, string> = {
          PENDING: 'Pending',
          CONFIRMED: 'Confirmed',
          IN_PROGRESS: 'Serving',
          COMPLETED: 'Completed',
          CANCELLED: 'Canceled',
        };

        return (
          <span
            className={`status-badge ${badgeClass}`}
            style={{
              padding: '2px 8px',
              fontSize: '10px',
              backgroundColor:
                appt.status === 'IN_PROGRESS' ? 'rgba(59, 130, 246, 0.08)' : undefined,
              color: appt.status === 'IN_PROGRESS' ? 'var(--accent-blue)' : undefined,
            }}
          >
            {labelMap[appt.status] || appt.status}
          </span>
        );
      },
    },
    {
      key: 'actions',
      header: '',
      style: { width: '180px', textAlign: 'right' },
      render: (appt) => {
        const clientName = appt.client?.firstName || 'Client';

        return (
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            {appt.status === 'CONFIRMED' && (
              <>
                <button
                  className="btn-primary"
                  title="Start Session"
                  onClick={() => handleUpdateStatus(appt.id, 'IN_PROGRESS')}
                  style={{
                    padding: '4px 10px',
                    fontSize: '11px',
                    backgroundColor: 'var(--accent-blue)',
                    borderColor: 'var(--accent-blue)',
                  }}
                >
                  Serve
                </button>
                <button
                  title="Cancel Booking"
                  onClick={() => handleCancelAppointment(appt.id, clientName)}
                  style={{
                    background: 'none',
                    border: '1px solid var(--border-color)',
                    borderRadius: '4px',
                    cursor: 'pointer',
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
              </>
            )}
            {appt.status === 'IN_PROGRESS' && (
              <button
                className="btn-primary"
                title="Mark Session Completed"
                onClick={() => handleUpdateStatus(appt.id, 'COMPLETED')}
                style={{ padding: '4px 10px', fontSize: '11px' }}
              >
                Complete
              </button>
            )}
            {(appt.status === 'COMPLETED' || appt.status === 'CANCELLED') && (
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
    </PageWrapper>
  );
}
