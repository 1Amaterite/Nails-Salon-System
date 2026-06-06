import React, { createContext, useContext, useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../utils/apiClient';
import { useNotification } from './NotificationContext';
import { useAuth } from './AuthContext';
import type { Branch, WaitlistItem, DashboardStats, Appointment } from '../types';

interface BranchContextType {
  branches: Branch[];
  selectedBranch: string;
  setSelectedBranch: (id: string) => void;
  isSeeding: boolean;
  handleSeedData: () => Promise<void>;
  isLoadingBranches: boolean;
  stats: DashboardStats;
  waitlist: WaitlistItem[];
  handleUpdateWaitlistStatus: (id: string, status: 'WAITING' | 'IN_PROGRESS' | 'COMPLETED') => void;
  onWalkinSubmit: (entry: {
    firstName: string;
    phone: string;
    serviceId: string;
    employeeId?: string;
  }) => void;
  onBookingSubmit: (entry: {
    firstName: string;
    lastName: string;
    phone: string;
    serviceId: string;
    employeeId?: string;
    date: string;
    startTime: string;
  }) => void;
  isUpdatingWaitlistStatus: boolean;
  updatingWaitlistId: string | undefined;
  isAddingWalkin: boolean;
  isBookingAppointment: boolean;
}

const BranchContext = createContext<BranchContextType | undefined>(undefined);

export function BranchProvider({ children }: { children: React.ReactNode }) {
  const { showToast } = useNotification();
  const { isAdminAuth, isOwnerAuth } = useAuth();
  const queryClient = useQueryClient();
  const [selectedBranchState, setSelectedBranchState] = useState('');
  const [isSeeding, setIsSeeding] = useState(false);

  // 1. Fetch branches
  const { data: branchesData, isPending: isLoadingBranches } = useQuery<Branch[]>({
    queryKey: ['branches'],
    queryFn: () => apiClient.get<Branch[]>('/api/branches', { skipAuth: true }),
    staleTime: 60000,
  });

  const branches = useMemo(() => branchesData || [], [branchesData]);

  // Derive selectedBranch: falls back to the first branch in the list if not explicitly selected.
  const selectedBranch = useMemo(() => {
    return selectedBranchState || (branches.length > 0 ? branches[0].id : '');
  }, [selectedBranchState, branches]);

  // 2. Fetch Stats (requires auth)
  const { data: statsData } = useQuery<DashboardStats>({
    queryKey: ['dashboardStats', selectedBranch],
    queryFn: () => apiClient.get<DashboardStats>(`/api/branches/${selectedBranch}/dashboard`),
    enabled: !!selectedBranch && (isAdminAuth || isOwnerAuth),
    staleTime: 30000,
  });

  const stats = useMemo(() => {
    return (
      statsData || {
        appointmentsToday: 0,
        waitingQueueCount: 0,
        activeStylists: 0,
        totalServices: 0,
      }
    );
  }, [statsData]);

  // 3. Fetch Waitlist (requires auth, poll every 10s)
  const { data: waitlistData } = useQuery<WaitlistItem[]>({
    queryKey: ['waitlist', selectedBranch],
    queryFn: () => apiClient.get<WaitlistItem[]>(`/api/branches/${selectedBranch}/waitlist`),
    enabled: !!selectedBranch && (isAdminAuth || isOwnerAuth),
    refetchInterval: 10000,
    staleTime: 10000,
  });

  const waitlist = useMemo(() => waitlistData || [], [waitlistData]);

  // 4. Mutation to update waitlist status
  const updateWaitlistStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'WAITING' | 'IN_PROGRESS' | 'COMPLETED' }) =>
      apiClient.put<WaitlistItem>(`/api/waitlist/${id}/status`, { status }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['waitlist', selectedBranch] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats', selectedBranch] });
      showToast(`Status updated successfully to ${data.status.replace('_', ' ')}.`, 'success');
    },
    onError: (error: Error) => {
      showToast(error.message, 'error');
    },
  });

  const handleUpdateWaitlistStatus = useCallback(
    (id: string, status: 'WAITING' | 'IN_PROGRESS' | 'COMPLETED') => {
      updateWaitlistStatusMutation.mutate({ id, status });
    },
    [updateWaitlistStatusMutation]
  );

  // 5. Mutation to add a walk-in guest
  const addWalkinMutation = useMutation({
    mutationFn: (entry: {
      firstName: string;
      phone: string;
      serviceId: string;
      employeeId?: string;
    }) => apiClient.post<WaitlistItem>(`/api/branches/${selectedBranch}/waitlist`, entry),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['waitlist', selectedBranch] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats', selectedBranch] });
      showToast(`${data.firstName} has been added to the live waiting queue.`, 'success');
    },
    onError: (error: Error) => {
      showToast(error.message, 'error');
    },
  });

  const onWalkinSubmit = useCallback(
    (entry: { firstName: string; phone: string; serviceId: string; employeeId?: string }) => {
      addWalkinMutation.mutate(entry);
    },
    [addWalkinMutation]
  );

  // 6. Mutation to book a scheduled appointment
  const bookAppointmentMutation = useMutation({
    mutationFn: (entry: {
      firstName: string;
      lastName: string;
      phone: string;
      serviceId: string;
      employeeId?: string;
      date: string;
      startTime: string;
    }) => apiClient.post<Appointment>(`/api/branches/${selectedBranch}/appointments`, entry),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments', selectedBranch] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats', selectedBranch] });
      showToast('Appointment booked successfully!', 'success');
    },
    onError: (error: Error) => {
      showToast(error.message, 'error');
    },
  });

  const onBookingSubmit = useCallback(
    (entry: {
      firstName: string;
      lastName: string;
      phone: string;
      serviceId: string;
      employeeId?: string;
      date: string;
      startTime: string;
    }) => {
      bookAppointmentMutation.mutate(entry);
    },
    [bookAppointmentMutation]
  );

  const handleSeedData = useCallback(async () => {
    setIsSeeding(true);
    try {
      const data = await apiClient.post<{ message?: string }>('/api/seed-initial-data', undefined, {
        skipAuth: true,
      });
      showToast(data.message || 'Data seeded successfully.', 'success');
      queryClient.invalidateQueries({ queryKey: ['branches'] });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to seed initial data.';
      showToast(msg, 'error');
    } finally {
      setIsSeeding(false);
    }
  }, [queryClient, showToast]);

  return (
    <BranchContext.Provider
      value={{
        branches,
        selectedBranch,
        setSelectedBranch: setSelectedBranchState,
        isSeeding,
        handleSeedData,
        isLoadingBranches,
        stats,
        waitlist,
        handleUpdateWaitlistStatus,
        onWalkinSubmit,
        onBookingSubmit,
        isUpdatingWaitlistStatus: updateWaitlistStatusMutation.isPending,
        updatingWaitlistId: updateWaitlistStatusMutation.variables?.id,
        isAddingWalkin: addWalkinMutation.isPending,
        isBookingAppointment: bookAppointmentMutation.isPending,
      }}
    >
      {children}
    </BranchContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useBranch() {
  const context = useContext(BranchContext);
  if (!context) {
    throw new Error('useBranch must be used within a BranchProvider');
  }
  return context;
}
