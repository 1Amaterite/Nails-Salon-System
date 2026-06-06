import React, { createContext, useContext, useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchWithTimeout } from '../utils/api';
import { getApiUrl } from '../utils/getApiUrl';
import { useNotification } from './NotificationContext';
import { useAuth } from './AuthContext';
import type { Branch, WaitlistItem, DashboardStats } from '../types';

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
}

const BranchContext = createContext<BranchContextType | undefined>(undefined);

export function BranchProvider({ children }: { children: React.ReactNode }) {
  const { showToast } = useNotification();
  const { token, isAdminAuth, isOwnerAuth } = useAuth();
  const queryClient = useQueryClient();
  const [selectedBranchState, setSelectedBranchState] = useState('');
  const [isSeeding, setIsSeeding] = useState(false);

  const API_URL = getApiUrl();

  // 1. Fetch branches
  const { data: branchesData, isPending: isLoadingBranches } = useQuery<Branch[]>({
    queryKey: ['branches'],
    queryFn: async () => {
      const res = await fetchWithTimeout(`${API_URL}/api/branches`);
      if (!res.ok) throw new Error('Failed to fetch branches');
      return res.json();
    },
  });

  const branches = useMemo(() => branchesData || [], [branchesData]);

  // Derive selectedBranch: falls back to the first branch in the list if not explicitly selected.
  const selectedBranch = useMemo(() => {
    return selectedBranchState || (branches.length > 0 ? branches[0].id : '');
  }, [selectedBranchState, branches]);

  // 2. Fetch Stats (requires auth)
  const { data: statsData } = useQuery<DashboardStats>({
    queryKey: ['dashboardStats', selectedBranch],
    queryFn: async () => {
      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const res = await fetchWithTimeout(`${API_URL}/api/branches/${selectedBranch}/dashboard`, {
        headers,
      });
      if (!res.ok) throw new Error('Failed to fetch dashboard stats');
      return res.json();
    },
    enabled: !!selectedBranch && (isAdminAuth || isOwnerAuth),
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
    queryFn: async () => {
      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const res = await fetchWithTimeout(`${API_URL}/api/branches/${selectedBranch}/waitlist`, {
        headers,
      });
      if (!res.ok) throw new Error('Failed to fetch waitlist');
      return res.json();
    },
    enabled: !!selectedBranch && (isAdminAuth || isOwnerAuth),
    refetchInterval: 10000,
  });

  const waitlist = useMemo(() => waitlistData || [], [waitlistData]);

  // 4. Mutation to update waitlist status
  const updateWaitlistStatusMutation = useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id: string;
      status: 'WAITING' | 'IN_PROGRESS' | 'COMPLETED';
    }) => {
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const res = await fetchWithTimeout(`${API_URL}/api/waitlist/${id}/status`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to update waitlist status.');
      }
      return res.json();
    },
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
    mutationFn: async (entry: {
      firstName: string;
      phone: string;
      serviceId: string;
      employeeId?: string;
    }) => {
      const res = await fetchWithTimeout(`${API_URL}/api/branches/${selectedBranch}/waitlist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to submit walk-in.');
      }
      return res.json();
    },
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
    mutationFn: async (entry: {
      firstName: string;
      lastName: string;
      phone: string;
      serviceId: string;
      employeeId?: string;
      date: string;
      startTime: string;
    }) => {
      const res = await fetchWithTimeout(`${API_URL}/api/branches/${selectedBranch}/appointments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to book appointment.');
      }
      return res.json();
    },
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
      const res = await fetchWithTimeout(`${API_URL}/api/seed-initial-data`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message || 'Data seeded successfully.', 'success');
        queryClient.invalidateQueries({ queryKey: ['branches'] });
      } else {
        showToast(data.error || 'Failed to seed initial data.', 'error');
      }
    } catch {
      showToast('Failed to seed initial data. Is backend server running?', 'error');
    } finally {
      setIsSeeding(false);
    }
  }, [API_URL, queryClient, showToast]);

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
