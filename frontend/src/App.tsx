import { useState, useEffect } from 'react';
import type { Branch, WaitlistItem, DashboardStats } from './types';
import { LoginPortal } from './pages/LoginPortal';
import { PublicPortal } from './pages/PublicPortal';
import { AdminDashboard } from './pages/AdminDashboard';
import { OwnerDashboard } from './pages/OwnerDashboard';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5001').replace(/\/$/, '');

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

  const navigateTo = (path: string) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
    setErrorMsg('');
    setPasscode('');
    setUsername('');
  };

  const handleLogin = async (role: 'admin' | 'owner') => {
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
      if (role === 'admin' && (empRole === 'ADMIN' || empRole === 'OWNER')) {
        setIsAdminAuth(true);
        sessionStorage.setItem('isAdminAuth', 'true');
        sessionStorage.setItem('adminToken', data.token);
        sessionStorage.setItem('employeeRole', empRole);
        setEmployeeRole(empRole);
        setErrorMsg('');
        setPasscode('');
        setUsername('');
      } else if (role === 'owner' && empRole === 'OWNER') {
        setIsOwnerAuth(true);
        sessionStorage.setItem('isOwnerAuth', 'true');
        sessionStorage.setItem('ownerToken', data.token);
        sessionStorage.setItem('employeeRole', empRole);
        setEmployeeRole(empRole);
        setErrorMsg('');
        setPasscode('');
        setUsername('');
      } else {
        setErrorMsg(`Unauthorized. You do not have the required ${role} role.`);
      }
    } catch (error) {
      setErrorMsg('Connection error. Is the backend server running?');
    }
  };

  const handleLogout = () => {
    if (currentPath === '/admin') {
      setIsAdminAuth(false);
      sessionStorage.removeItem('isAdminAuth');
      sessionStorage.removeItem('adminToken');
    } else if (currentPath === '/owner') {
      setIsOwnerAuth(false);
      sessionStorage.removeItem('isOwnerAuth');
      sessionStorage.removeItem('ownerToken');
    }
    sessionStorage.removeItem('employeeRole');
    setEmployeeRole('');
    setErrorMsg('');
    setPasscode('');
    setUsername('');
  };

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

  // Form states for Receptionist Walk-In
  const [walkinName, setWalkinName] = useState('');
  const [walkinPhone, setWalkinPhone] = useState('');
  const [walkinService, setWalkinService] = useState('Gellack/Shellac/Gel polish');
  const [walkinStylist, setWalkinStylist] = useState('First Available Stylist');

  // Form states for Public Walk-In
  const [publicWalkinName, setPublicWalkinName] = useState('');
  const [publicWalkinPhone, setPublicWalkinPhone] = useState('');
  const [publicWalkinService, setPublicWalkinService] = useState('Gellack/Shellac/Gel polish');

  // Form states for Add Employee Modal
  const [isAddEmployeeModalOpen, setIsAddEmployeeModalOpen] = useState(false);
  const [newEmpName, setNewEmpName] = useState('');
  const [newEmpUsername, setNewEmpUsername] = useState('');
  const [newEmpPassword, setNewEmpPassword] = useState('');
  const [newEmpRole, setNewEmpRole] = useState('STAFF');
  const [newEmpPhoneNumber, setNewEmpPhoneNumber] = useState('');
  const [newEmpSpecialty, setNewEmpSpecialty] = useState('');
  const [newEmpError, setNewEmpError] = useState('');

  const handleAddEmployeeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNewEmpError('');

    const token = sessionStorage.getItem('adminToken') || sessionStorage.getItem('ownerToken');
    if (!token) {
      setNewEmpError('Authentication token missing. Please re-authenticate.');
      return;
    }

    if ((newEmpRole === 'ADMIN' || newEmpRole === 'OWNER') && (!newEmpUsername || !newEmpPassword)) {
      setNewEmpError('Username and password are required for admin/owner accounts.');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/employees`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: newEmpName,
          username: (newEmpRole === 'ADMIN' || newEmpRole === 'OWNER') ? newEmpUsername.replace(/@/g, '') : undefined,
          password: (newEmpRole === 'ADMIN' || newEmpRole === 'OWNER') ? newEmpPassword : undefined,
          role: newEmpRole,
          phoneNumber: newEmpPhoneNumber,
          specialty: newEmpSpecialty || undefined,
          branchId: selectedBranch
        })
      });

      const data = await response.json();
      if (!response.ok) {
        setNewEmpError(data.error || 'Failed to create employee.');
        return;
      }

      alert('Employee created successfully.');
      setIsAddEmployeeModalOpen(false);
      setNewEmpName('');
      setNewEmpUsername('');
      setNewEmpPassword('');
      setNewEmpRole('STAFF');
      setNewEmpPhoneNumber('');
      setNewEmpSpecialty('');
      fetchMetadata();
    } catch (err) {
      setNewEmpError('Network error. Failed to connect to server.');
    }
  };

  const handleAdminWalkinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newEntry: WaitlistItem = {
      id: Date.now().toString(),
      firstName: walkinName,
      phone: walkinPhone,
      service: walkinService,
      stylist: walkinStylist,
      checkInTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'WAITING'
    };
    setWaitlist(prev => [...prev, newEntry]);
    alert(`${walkinName} has been added to the live waiting queue.`);
    setWalkinName('');
    setWalkinPhone('');
    setActiveTab('waitlist');
  };

  const handlePublicWalkinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newEntry: WaitlistItem = {
      id: Date.now().toString(),
      firstName: publicWalkinName,
      phone: publicWalkinPhone,
      service: publicWalkinService,
      stylist: 'First Available Stylist',
      checkInTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'WAITING'
    };
    setWaitlist(prev => [...prev, newEntry]);
    alert(`Thank you, ${publicWalkinName}! You have been added to our live waiting queue.`);
    setPublicWalkinName('');
    setPublicWalkinPhone('');
    setActiveTab('public-home');
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
    if (selectedBranch) {
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
  if (currentPath === '/admin' && !isAdminAuth) {
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

  if (currentPath === '/owner' && !isOwnerAuth) {
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

  if (roleMode === 'public') {
    return (
      <PublicPortal 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        branches={branches}
        navigateTo={navigateTo}
        publicWalkinName={publicWalkinName}
        setPublicWalkinName={setPublicWalkinName}
        publicWalkinPhone={publicWalkinPhone}
        setPublicWalkinPhone={setPublicWalkinPhone}
        publicWalkinService={publicWalkinService}
        setPublicWalkinService={setPublicWalkinService}
        handlePublicWalkinSubmit={handlePublicWalkinSubmit}
      />
    );
  }

  const sharedProps = {
    activeTab, setActiveTab, employeeRole,
    branches, selectedBranch, stats, waitlist,
    handleUpdateWaitlistStatus, handleLogout, navigateTo,
    isSeeding, handleSeedData,
    walkinName, setWalkinName, walkinPhone, setWalkinPhone,
    walkinService, setWalkinService, walkinStylist, setWalkinStylist,
    handleAdminWalkinSubmit,
    isAddEmployeeModalOpen, setIsAddEmployeeModalOpen,
    newEmpName, setNewEmpName, newEmpUsername, setNewEmpUsername,
    newEmpPassword, setNewEmpPassword, newEmpRole, setNewEmpRole,
    newEmpPhoneNumber, setNewEmpPhoneNumber,
    newEmpSpecialty, setNewEmpSpecialty,
    newEmpError, handleAddEmployeeSubmit
  };

  if (roleMode === 'owner') {
    return <OwnerDashboard {...sharedProps} />;
  }

  return <AdminDashboard {...sharedProps} roleMode={roleMode} />;
}

export default App;
