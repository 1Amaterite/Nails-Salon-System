import { useState, useEffect, useCallback, useMemo } from 'react';
import type { Branch, WaitlistItem, DashboardStats } from './types';
import { LoginPortal } from './pages/LoginPortal';
import { PublicPortal } from './pages/PublicPortal';
import { AdminDashboard } from './pages/AdminDashboard';
import { OwnerDashboard } from './pages/OwnerDashboard';
import { useNotification } from './context/NotificationContext';
import { fetchWithTimeout } from './utils/api';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { getApiUrl } from './utils/getApiUrl';
const API_URL = getApiUrl();

function App() {
  const { showToast } = useNotification();
  const queryClient = useQueryClient();

  // Navigation State
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  const [activeTab, setActiveTabState] = useState<string>(() => {
    const saved = sessionStorage.getItem('activeTab_' + window.location.pathname);
    if (saved) return saved;
    return window.location.pathname === '/admin' || window.location.pathname === '/owner'
      ? 'dashboard'
      : 'public-home';
  });

  const setActiveTab = useCallback((tab: string) => {
    setActiveTabState(tab);
    sessionStorage.setItem('activeTab_' + window.location.pathname, tab);
  }, []);

  const roleMode =
    currentPath === '/owner' ? 'owner' : currentPath === '/admin' ? 'admin' : 'public';

  // Auth State
  const [isAdminAuth, setIsAdminAuth] = useState(
    () => sessionStorage.getItem('isAdminAuth') === 'true'
  );
  const [isOwnerAuth, setIsOwnerAuth] = useState(
    () => sessionStorage.getItem('isOwnerAuth') === 'true'
  );
  const [employeeRole, setEmployeeRole] = useState(
    () => sessionStorage.getItem('employeeRole') || ''
  );
  const [username, setUsername] = useState('');
  const [passcode, setPasscode] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      setCurrentPath(path);
      const saved = sessionStorage.getItem('activeTab_' + path);
      if (saved) {
        setActiveTabState(saved);
      } else {
        if (path === '/admin' || path === '/owner') {
          setActiveTabState('dashboard');
        } else {
          setActiveTabState('public-home');
        }
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateTo = useCallback((path: string) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
    setErrorMsg('');
    setPasscode('');
    setUsername('');

    // Update active tab for the path
    const saved = sessionStorage.getItem('activeTab_' + path);
    if (saved) {
      setActiveTabState(saved);
    } else {
      if (path === '/admin' || path === '/owner') {
        setActiveTabState('dashboard');
      } else {
        setActiveTabState('public-home');
      }
    }
  }, []);

  const handleLogin = async () => {
    try {
      const response = await fetchWithTimeout(`${API_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password: passcode }),
      });

      const data = await response.json();
      if (!response.ok) {
        setErrorMsg(data.error || 'Invalid credentials. Please try again.');
        return;
      }

      const empRole = data.employee.role;
      if (empRole === 'OWNER') {
        setIsOwnerAuth(true);
        setIsAdminAuth(true);
        sessionStorage.setItem('isOwnerAuth', 'true');
        sessionStorage.setItem('isAdminAuth', 'true');
        sessionStorage.setItem('ownerToken', data.token);
        sessionStorage.setItem('adminToken', data.token);
        sessionStorage.setItem('employeeRole', empRole);
        setEmployeeRole(empRole);
        setErrorMsg('');
        setPasscode('');
        setUsername('');
        queryClient.clear(); // Purge cache on new login
        navigateTo('/owner');
      } else if (empRole === 'ADMIN') {
        setIsAdminAuth(true);
        sessionStorage.setItem('isAdminAuth', 'true');
        sessionStorage.setItem('adminToken', data.token);
        sessionStorage.setItem('employeeRole', empRole);
        setEmployeeRole(empRole);
        setErrorMsg('');
        setPasscode('');
        setUsername('');
        queryClient.clear(); // Purge cache on new login
        navigateTo('/admin');
      } else {
        setErrorMsg('Unauthorized. You do not have permission to access the management portals.');
      }
    } catch {
      setErrorMsg('Connection error. Is the backend server running?');
    }
  };

  const handleLogout = useCallback(() => {
    setIsAdminAuth(false);
    setIsOwnerAuth(false);
    sessionStorage.removeItem('isAdminAuth');
    sessionStorage.removeItem('isOwnerAuth');
    sessionStorage.removeItem('adminToken');
    sessionStorage.removeItem('ownerToken');
    sessionStorage.removeItem('employeeRole');
    sessionStorage.removeItem('activeTab_/admin');
    sessionStorage.removeItem('activeTab_/owner');
    setEmployeeRole('');
    setErrorMsg('');
    setPasscode('');
    setUsername('');
    queryClient.clear(); // Purge cache on logout
    navigateTo('/login');
  }, [navigateTo, queryClient]);

  // Redirect and route guards
  useEffect(() => {
    if (currentPath === '/admin' && !isAdminAuth) {
      Promise.resolve().then(() => navigateTo('/login'));
    } else if (currentPath === '/owner' && !isOwnerAuth) {
      Promise.resolve().then(() => navigateTo('/login'));
    } else if (currentPath === '/login') {
      if (isOwnerAuth) {
        Promise.resolve().then(() => navigateTo('/owner'));
      } else if (isAdminAuth) {
        Promise.resolve().then(() => navigateTo('/admin'));
      }
    }
  }, [currentPath, isAdminAuth, isOwnerAuth, navigateTo]);

  // App Data State
  const [selectedBranchState] = useState<string>('');
  const [isSeeding, setIsSeeding] = useState(false);

  // Fetch branches with React Query
  const { data: branchesData } = useQuery<Branch[]>({
    queryKey: ['branches', selectedBranchState, employeeRole],
    queryFn: async () => {
      const res = await fetchWithTimeout(`${API_URL}/api/branches`);
      if (!res.ok) throw new Error('Failed to fetch branches');
      return res.json();
    },
  });

  const branches = useMemo(() => branchesData || [], [branchesData]);

  // Derive selectedBranch to avoid synchronous setState inside an effect
  const selectedBranch = selectedBranchState || (branches.length > 0 ? branches[0].id : '');

  // Fetch Stats when Branch changes with React Query
  const { data: statsData } = useQuery<DashboardStats>({
    queryKey: ['dashboardStats', selectedBranch, employeeRole],
    queryFn: async () => {
      const token = sessionStorage.getItem('adminToken') || sessionStorage.getItem('ownerToken');
      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const res = await fetchWithTimeout(`${API_URL}/api/dashboard/${selectedBranch}`, { headers });
      if (res.status === 401 || res.status === 403) {
        handleLogout();
        throw new Error('Session expired or unauthorized.');
      }
      if (!res.ok) throw new Error('Failed to fetch dashboard stats');
      return res.json();
    },
    enabled: !!selectedBranch && (isAdminAuth || isOwnerAuth),
  });

  const stats = statsData || {
    appointmentsToday: 0,
    waitingQueueCount: 0,
    activeStylists: 0,
    totalServices: 0,
  };

  // Fetch waitlist with React Query
  const { data: waitlistData } = useQuery<WaitlistItem[]>({
    queryKey: ['waitlist', selectedBranch, employeeRole],
    queryFn: async () => {
      const token = sessionStorage.getItem('adminToken') || sessionStorage.getItem('ownerToken');
      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const res = await fetchWithTimeout(`${API_URL}/api/branches/${selectedBranch}/waitlist`, {
        headers,
      });
      if (res.status === 401 || res.status === 403) {
        handleLogout();
        throw new Error('Session expired or unauthorized.');
      }
      if (!res.ok) throw new Error('Failed to fetch waitlist');
      return res.json();
    },
    enabled: !!selectedBranch && (isAdminAuth || isOwnerAuth),
    refetchInterval: 10000, // Poll every 10 seconds for real-time live queue updates
  });

  const waitlist = useMemo(() => waitlistData || [], [waitlistData]);

  // Mutation to add a walk-in
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

      if (currentPath === '/admin' || currentPath === '/owner') {
        showToast(`${data.firstName} has been added to the live waiting queue.`, 'success');
        setActiveTab('waitlist');
      } else {
        showToast(
          `Thank you, ${data.firstName}! You have been added to our live waiting queue.`,
          'success'
        );
        setActiveTab('public-home');
      }
    },
    onError: (error: Error) => {
      showToast(error.message, 'error');
    },
  });

  const handleWalkinSubmit = (entry: {
    firstName: string;
    phone: string;
    serviceId: string;
    employeeId?: string;
  }) => {
    addWalkinMutation.mutate(entry);
  };

  // Mutation to update waitlist status
  const updateWaitlistStatusMutation = useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id: string;
      status: 'WAITING' | 'IN_PROGRESS' | 'COMPLETED';
    }) => {
      const token = sessionStorage.getItem('adminToken') || sessionStorage.getItem('ownerToken');
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
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

  const handleUpdateWaitlistStatus = (
    id: string,
    newStatus: 'WAITING' | 'IN_PROGRESS' | 'COMPLETED'
  ) => {
    updateWaitlistStatusMutation.mutate({ id, status: newStatus });
  };

  // Mutation to book a scheduled appointment
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
      setActiveTab('public-home');
    },
    onError: (error: Error) => {
      showToast(error.message, 'error');
    },
  });

  const handleBookingSubmit = useCallback(
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

  const handleSeedData = async () => {
    setIsSeeding(true);
    try {
      const res = await fetchWithTimeout(`${API_URL}/api/seed-initial-data`, { method: 'POST' });
      const data = await res.json();
      showToast(data.message, 'success');
      queryClient.invalidateQueries({ queryKey: ['branches'] });
    } catch {
      showToast('Failed to seed initial data. Is backend server running?', 'error');
    } finally {
      setIsSeeding(false);
    }
  };

  // Rendering Routing Decision
  if (currentPath === '/login') {
    return (
      <LoginPortal
        currentPath={currentPath}
        username={username}
        setUsername={setUsername}
        passcode={passcode}
        setPasscode={setPasscode}
        errorMsg={errorMsg}
        handleLogin={handleLogin}
        navigateTo={navigateTo}
      />
    );
  }

  if (currentPath === '/admin' && !isAdminAuth) {
    return null;
  }

  if (currentPath === '/owner' && !isOwnerAuth) {
    return null;
  }

  if (roleMode === 'public') {
    return (
      <PublicPortal
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        branches={branches}
        navigateTo={navigateTo}
        onPublicWalkinSubmit={handleWalkinSubmit}
        onPublicBookingSubmit={handleBookingSubmit}
      />
    );
  }

  const sharedProps = {
    activeTab,
    setActiveTab,
    employeeRole,
    branches,
    selectedBranch,
    stats,
    waitlist,
    handleUpdateWaitlistStatus,
    handleLogout,
    navigateTo,
    isSeeding,
    handleSeedData,
    onWalkinSubmit: handleWalkinSubmit,
    onEmployeeAdded: () => queryClient.invalidateQueries({ queryKey: ['branches'] }),
  };

  if (roleMode === 'owner') {
    return <OwnerDashboard {...sharedProps} />;
  }

  return <AdminDashboard {...sharedProps} roleMode={roleMode} />;
}

export default App;
