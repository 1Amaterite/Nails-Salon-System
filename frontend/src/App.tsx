import { useState, useEffect, useCallback, useMemo } from 'react';
import type { Branch, WaitlistItem, DashboardStats } from './types';
import { LoginPortal } from './pages/LoginPortal';
import { PublicPortal } from './pages/PublicPortal';
import { AdminDashboard } from './pages/AdminDashboard';
import { OwnerDashboard } from './pages/OwnerDashboard';
import { useNotification } from './context/NotificationContext';
import { fetchWithTimeout } from './utils/api';

import { useQuery, useQueryClient } from '@tanstack/react-query';

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

  // Purge/clear cache when branch changes
  useEffect(() => {
    if (selectedBranch) {
      queryClient.clear();
    }
  }, [selectedBranch, queryClient]);

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

  // Live waitlist state
  const [waitlist, setWaitlist] = useState<WaitlistItem[]>([
    {
      id: '1',
      firstName: 'Emily',
      phone: '(555) 123-4567',
      service: 'Gellack/Shellac/Gel polish',
      stylist: 'Sara Technician',
      checkInTime: '02:15 PM',
      status: 'WAITING',
    },
    {
      id: '2',
      firstName: 'Sophia',
      phone: '(555) 987-6543',
      service: 'Gel extensions',
      stylist: 'First Available Stylist',
      checkInTime: '02:30 PM',
      status: 'WAITING',
    },
  ]);

  const handleUpdateWaitlistStatus = (
    id: string,
    newStatus: 'WAITING' | 'IN_PROGRESS' | 'COMPLETED'
  ) => {
    setWaitlist((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: newStatus } : item))
    );
  };

  // Handle walk-in checks from either Public or Receptionist portals
  const handleWalkinSubmit = (entry: {
    firstName: string;
    phone: string;
    service: string;
    stylist?: string;
  }) => {
    const newEntry: WaitlistItem = {
      id: Date.now().toString(),
      firstName: entry.firstName,
      phone: entry.phone,
      service: entry.service,
      stylist: entry.stylist || 'First Available Stylist',
      checkInTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'WAITING',
    };
    setWaitlist((prev) => [...prev, newEntry]);
    if (currentPath === '/admin' || currentPath === '/owner') {
      showToast(`${entry.firstName} has been added to the live waiting queue.`, 'success');
      setActiveTab('waitlist');
    } else {
      showToast(
        `Thank you, ${entry.firstName}! You have been added to our live waiting queue.`,
        'success'
      );
      setActiveTab('public-home');
    }
  };

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
