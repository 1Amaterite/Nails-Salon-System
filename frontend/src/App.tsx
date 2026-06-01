import { useState, useEffect, useCallback } from 'react';
import type { Branch, WaitlistItem, DashboardStats } from './types';
import { LoginPortal } from './pages/LoginPortal';
import { PublicPortal } from './pages/PublicPortal';
import { AdminDashboard } from './pages/AdminDashboard';
import { OwnerDashboard } from './pages/OwnerDashboard';

const API_URL = (import.meta.env.VITE_API_URL || 'https://nails-salon-backend.onrender.com').replace(/\/$/, '');

function App() {
  // Navigation State
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  const [activeTab, setActiveTab] = useState<string>(
    window.location.pathname === '/admin' || window.location.pathname === '/owner' ? 'dashboard' : 'public-home'
  );

  const roleMode = currentPath === '/owner' ? 'owner' : (currentPath === '/admin' ? 'admin' : 'public');

  // Auth State
  const [isAdminAuth, setIsAdminAuth] = useState(() => sessionStorage.getItem('isAdminAuth') === 'true');
  const [isOwnerAuth, setIsOwnerAuth] = useState(() => sessionStorage.getItem('isOwnerAuth') === 'true');
  const [employeeRole, setEmployeeRole] = useState(() => sessionStorage.getItem('employeeRole') || '');
  const [username, setUsername] = useState('');
  const [passcode, setPasscode] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Set default active tabs on route load/change
  useEffect(() => {
    if (currentPath === '/admin' || currentPath === '/owner') {
      setActiveTab('dashboard');
    } else {
      setActiveTab('public-home');
    }
  }, [currentPath]);

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
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
  }, []);

  const handleLogin = async () => {
    try {
      const response = await fetch(`${API_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password: passcode })
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
        navigateTo('/admin');
      } else {
        setErrorMsg('Unauthorized. You do not have permission to access the management portals.');
      }
    } catch (error) {
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
    setEmployeeRole('');
    setErrorMsg('');
    setPasscode('');
    setUsername('');
    navigateTo('/login');
  }, [navigateTo]);

  // Redirect and route guards
  useEffect(() => {
    if (currentPath === '/admin' && !isAdminAuth) {
      navigateTo('/login');
    } else if (currentPath === '/owner' && !isOwnerAuth) {
      navigateTo('/login');
    } else if (currentPath === '/login') {
      if (isOwnerAuth) {
        navigateTo('/owner');
      } else if (isAdminAuth) {
        navigateTo('/admin');
      }
    }
  }, [currentPath, isAdminAuth, isOwnerAuth, navigateTo]);

  // App Data State
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string>('');
  const [isSeeding, setIsSeeding] = useState(false);
  const [stats, setStats] = useState<DashboardStats>({
    appointmentsToday: 0,
    waitingQueueCount: 0,
    activeStylists: 0,
    totalServices: 0
  });

  // Live waitlist state
  const [waitlist, setWaitlist] = useState<WaitlistItem[]>([
    {
      id: '1',
      firstName: 'Emily',
      phone: '(555) 123-4567',
      service: 'Gellack/Shellac/Gel polish',
      stylist: 'Sara Technician',
      checkInTime: '02:15 PM',
      status: 'WAITING'
    },
    {
      id: '2',
      firstName: 'Sophia',
      phone: '(555) 987-6543',
      service: 'Gel extensions',
      stylist: 'First Available Stylist',
      checkInTime: '02:30 PM',
      status: 'WAITING'
    }
  ]);

  const handleUpdateWaitlistStatus = (id: string, newStatus: 'WAITING' | 'IN_PROGRESS' | 'COMPLETED') => {
    setWaitlist(prev => prev.map(item => item.id === id ? { ...item, status: newStatus } : item));
  };

  // Handle walk-in checks from either Public or Receptionist portals
  const handleWalkinSubmit = (entry: { firstName: string; phone: string; service: string; stylist?: string }) => {
    const newEntry: WaitlistItem = {
      id: Date.now().toString(),
      firstName: entry.firstName,
      phone: entry.phone,
      service: entry.service,
      stylist: entry.stylist || 'First Available Stylist',
      checkInTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'WAITING'
    };
    setWaitlist(prev => [...prev, newEntry]);
    if (currentPath === '/admin' || currentPath === '/owner') {
      alert(`${entry.firstName} has been added to the live waiting queue.`);
      setActiveTab('waitlist');
    } else {
      alert(`Thank you, ${entry.firstName}! You have been added to our live waiting queue.`);
      setActiveTab('public-home');
    }
  };

  // Fetch branches and baseline info
  const fetchMetadata = () => {
    fetch(`${API_URL}/api/branches`)
      .then((res) => res.json())
      .then((data: Branch[]) => {
        setBranches(data);
        if (data.length > 0 && !selectedBranch) {
          setSelectedBranch(data[0].id);
        }
      })
      .catch(() => console.log("CORS/Connection warning: Run backend & seed database."));
  };

  useEffect(() => {
    fetchMetadata();
  }, []);

  // Fetch Stats when Branch changes
  useEffect(() => {
    if (selectedBranch && (isAdminAuth || isOwnerAuth)) {
      const token = sessionStorage.getItem('adminToken') || sessionStorage.getItem('ownerToken');
      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      fetch(`${API_URL}/api/dashboard/${selectedBranch}`, { headers })
        .then(res => {
          if (res.status === 401 || res.status === 403) {
            handleLogout();
            throw new Error('Session expired or unauthorized.');
          }
          if (!res.ok) throw new Error('Failed to fetch dashboard stats');
          return res.json();
        })
        .then(data => setStats(data))
        .catch(() => {});
    }
  }, [selectedBranch, isAdminAuth, isOwnerAuth, handleLogout]);

  const handleSeedData = async () => {
    setIsSeeding(true);
    try {
      const res = await fetch(`${API_URL}/api/seed-initial-data`, { method: 'POST' });
      const data = await res.json();
      alert(data.message);
      fetchMetadata();
    } catch (e) {
      alert("Failed to seed initial data. Is backend server running?");
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
    activeTab, setActiveTab, employeeRole,
    branches, selectedBranch, stats, waitlist,
    handleUpdateWaitlistStatus, handleLogout, navigateTo,
    isSeeding, handleSeedData,
    onWalkinSubmit: handleWalkinSubmit,
    onEmployeeAdded: fetchMetadata
  };

  if (roleMode === 'owner') {
    return <OwnerDashboard {...sharedProps} />;
  }

  return <AdminDashboard {...sharedProps} roleMode={roleMode} />;
}

export default App;
