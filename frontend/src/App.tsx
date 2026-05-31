import { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Users, Scissors, Calendar, Shield, Settings, 
  ShoppingBag, PlusCircle, Layers, UserCheck, MapPin, Lock, User,
  Clock, Plus, LogOut, Globe, Home, Award
} from 'lucide-react';
import heroImg from './assets/hero.png';

interface Branch {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  employees?: any[];
  services?: any[];
}

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

  const handleLogin = (role: 'admin' | 'owner') => {
    const userLower = username.toLowerCase().trim();
    if (role === 'admin' && userLower === 'admin' && passcode === '1234') {
      setIsAdminAuth(true);
      sessionStorage.setItem('isAdminAuth', 'true');
      setErrorMsg('');
      setPasscode('');
      setUsername('');
    } else if (role === 'owner' && userLower === 'owner' && passcode === '8888') {
      setIsOwnerAuth(true);
      sessionStorage.setItem('isOwnerAuth', 'true');
      setErrorMsg('');
      setPasscode('');
      setUsername('');
    } else {
      setErrorMsg('Invalid Username or Passcode. Please try again.');
    }
  };

  const handleLogout = () => {
    if (currentPath === '/admin') {
      setIsAdminAuth(false);
      sessionStorage.removeItem('isAdminAuth');
    } else if (currentPath === '/owner') {
      setIsOwnerAuth(false);
      sessionStorage.removeItem('isOwnerAuth');
    }
    setErrorMsg('');
    setPasscode('');
    setUsername('');
  };

  // App Data State
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string>('');
  const [isSeeding, setIsSeeding] = useState(false);
  const [stats, setStats] = useState({
    appointmentsToday: 0,
    waitingQueueCount: 0,
    activeStylists: 0,
    totalServices: 0
  });

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
      fetch(`${API_URL}/api/dashboard/${selectedBranch}`)
        .then(res => res.json())
        .then(data => setStats(data))
        .catch(() => {});
    }
  }, [selectedBranch]);

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

  if (currentPath === '/admin' && !isAdminAuth) {
    return (
      <div className="login-container">
        <div className="outer-bezel login-card" style={{ maxWidth: '440px', width: '100%', margin: '40px auto' }}>
          <div className="inner-core">
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
              <span className="micro-badge">Secure Gateway</span>
            </div>
            
            <h2 style={{ fontFamily: 'var(--font-serif)', color: 'var(--accent)', textAlign: 'center', fontSize: '28px', fontWeight: 700, margin: '0 0 8px 0', letterSpacing: '-0.3px' }}>
              Admin Workspace
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13.5px', textAlign: 'center', margin: '0 0 28px 0', lineHeight: 1.5 }}>
              Verify administrative credentials to open the salon panel.
            </p>

            <form onSubmit={(e) => { e.preventDefault(); handleLogin('admin'); }} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '6px', fontWeight: 600, color: 'var(--text-secondary)' }}>Username</label>
                <div className="input-with-icon-wrapper">
                  <User size={16} className="input-icon" />
                  <input 
                    type="text" 
                    placeholder="e.g. admin" 
                    value={username} 
                    onChange={e => setUsername(e.target.value)} 
                    required 
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '6px', fontWeight: 600, color: 'var(--text-secondary)' }}>Passcode</label>
                <div className="input-with-icon-wrapper">
                  <Lock size={16} className="input-icon" />
                  <input 
                    type="password" 
                    placeholder="••••" 
                    value={passcode} 
                    onChange={e => setPasscode(e.target.value)} 
                    required 
                    style={{ letterSpacing: '4px' }}
                  />
                </div>
              </div>

              {errorMsg && (
                <div style={{ color: '#b91c1c', fontSize: '13px', textAlign: 'center', backgroundColor: '#fee2e2', padding: '10px', borderRadius: '6px', border: '1px solid #fecaca' }}>
                  {errorMsg}
                </div>
              )}

              <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '8px' }}>
                Authenticate
              </button>

              <button type="button" onClick={() => navigateTo('/')} style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: '13.5px', textDecoration: 'underline', marginTop: '4px', textAlign: 'center', display: 'block', margin: '0 auto' }}>
                ← Back to Public Website
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  if (currentPath === '/owner' && !isOwnerAuth) {
    return (
      <div className="login-container">
        <div className="outer-bezel login-card" style={{ maxWidth: '440px', width: '100%', margin: '40px auto' }}>
          <div className="inner-core">
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
              <span className="micro-badge">Secure Gateway</span>
            </div>
            
            <h2 style={{ fontFamily: 'var(--font-serif)', color: 'var(--accent)', textAlign: 'center', fontSize: '28px', fontWeight: 700, margin: '0 0 8px 0', letterSpacing: '-0.3px' }}>
              Owner Headquarters
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13.5px', textAlign: 'center', margin: '0 0 28px 0', lineHeight: 1.5 }}>
              Access requires verified business owner credentials.
            </p>

            <form onSubmit={(e) => { e.preventDefault(); handleLogin('owner'); }} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '6px', fontWeight: 600, color: 'var(--text-secondary)' }}>Username</label>
                <div className="input-with-icon-wrapper">
                  <User size={16} className="input-icon" />
                  <input 
                    type="text" 
                    placeholder="e.g. owner" 
                    value={username} 
                    onChange={e => setUsername(e.target.value)} 
                    required 
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '6px', fontWeight: 600, color: 'var(--text-secondary)' }}>Passcode</label>
                <div className="input-with-icon-wrapper">
                  <Lock size={16} className="input-icon" />
                  <input 
                    type="password" 
                    placeholder="••••" 
                    value={passcode} 
                    onChange={e => setPasscode(e.target.value)} 
                    required 
                    style={{ letterSpacing: '4px' }}
                  />
                </div>
              </div>

              {errorMsg && (
                <div style={{ color: '#b91c1c', fontSize: '13px', textAlign: 'center', backgroundColor: '#fee2e2', padding: '10px', borderRadius: '6px', border: '1px solid #fecaca' }}>
                  {errorMsg}
                </div>
              )}

              <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '8px' }}>
                Authenticate
              </button>

              <button type="button" onClick={() => navigateTo('/')} style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: '13.5px', textDecoration: 'underline', marginTop: '4px', textAlign: 'center', display: 'block', margin: '0 auto' }}>
                ← Back to Public Website
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Navigation Sidebar */}
      <aside className="sidebar">
        <div>
          <div className="brand-title" onClick={() => navigateTo('/')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Scissors size={24} style={{ transform: 'rotate(-45deg)', color: 'var(--accent)' }} />
            <span style={{ fontFamily: 'var(--font-serif)', fontSize: '22px', letterSpacing: '-0.5px' }}>Nails Salon</span>
          </div>
          
          {/* Role Mode Label */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '24px' }}>
            <span className="micro-badge" style={{ backgroundColor: 'var(--accent-glow)', color: 'var(--accent)', border: '1px solid rgba(6, 95, 70, 0.12)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>
              {roleMode === 'owner' ? 'Owner Space' : (roleMode === 'admin' ? 'Admin Space' : 'Public Guest')}
            </span>
          </div>

          {/* Navigation Links depending on active mode */}
          <div className="nav-section-title">Workspace</div>
          <nav className="nav-links">
            {roleMode !== 'public' ? (
              <>
                <div 
                  className={`nav-link ${activeTab === 'dashboard' ? 'active' : ''}`}
                  onClick={() => setActiveTab('dashboard')}
                >
                  <LayoutDashboard size={18} />
                  Main Dashboard
                </div>
                <div 
                  className={`nav-link ${activeTab === 'appointments' ? 'active' : ''}`}
                  onClick={() => setActiveTab('appointments')}
                >
                  <Calendar size={18} />
                  Clients Schedule
                </div>
                <div 
                  className={`nav-link ${activeTab === 'waitlist' ? 'active' : ''}`}
                  onClick={() => setActiveTab('waitlist')}
                >
                  <UserCheck size={18} />
                  Walk-In Queue
                </div>
                <div 
                  className={`nav-link ${activeTab === 'employees' ? 'active' : ''}`}
                  onClick={() => setActiveTab('employees')}
                >
                  <Users size={18} />
                  Employees & Shifts
                </div>
                <div 
                  className={`nav-link ${activeTab === 'inventory' ? 'active' : ''}`}
                  onClick={() => setActiveTab('inventory')}
                >
                  <ShoppingBag size={18} />
                  Inventory Items
                </div>
                <div 
                  className={`nav-link ${activeTab === 'clients' ? 'active' : ''}`}
                  onClick={() => setActiveTab('clients')}
                >
                  <Users size={18} />
                  Clients Directory
                </div>
                <div 
                  className={`nav-link ${activeTab === 'services' ? 'active' : ''}`}
                  onClick={() => setActiveTab('services')}
                >
                  <Scissors size={18} />
                  Services Catalog
                </div>
                {roleMode === 'owner' && (
                  <div 
                    className={`nav-link ${activeTab === 'analytics' ? 'active' : ''}`}
                    onClick={() => setActiveTab('analytics')}
                    style={{ borderLeft: '3px solid var(--accent)' }}
                  >
                    <Shield size={18} />
                    Owner Financials
                  </div>
                )}
                <div 
                  className={`nav-link ${activeTab === 'settings' ? 'active' : ''}`}
                  onClick={() => setActiveTab('settings')}
                >
                  <Settings size={18} />
                  Settings Panel
                </div>
              </>
            ) : (
              <>
                <div 
                  className={`nav-link ${activeTab === 'public-home' ? 'active' : ''}`}
                  onClick={() => setActiveTab('public-home')}
                >
                  <Home size={18} />
                  Salon Home
                </div>
                <div 
                  className={`nav-link ${activeTab === 'public-booking' ? 'active' : ''}`}
                  onClick={() => setActiveTab('public-booking')}
                >
                  <PlusCircle size={18} />
                  Book Appointment
                </div>
                <div 
                  className={`nav-link ${activeTab === 'public-services' ? 'active' : ''}`}
                  onClick={() => setActiveTab('public-services')}
                >
                  <Scissors size={18} />
                  Salon Services
                </div>
                <div 
                  className={`nav-link ${activeTab === 'public-walkin' ? 'active' : ''}`}
                  onClick={() => setActiveTab('public-walkin')}
                >
                  <UserCheck size={18} />
                  Walk-In Check-In
                </div>
              </>
            )}
          </nav>
        </div>

        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '20px', marginTop: '20px' }}>
          {roleMode !== 'public' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div 
                onClick={handleLogout}
                style={{ color: 'var(--accent)', fontSize: '13.5px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', transition: 'var(--transition)' }}
              >
                <LogOut size={16} />
                <span>Sign Out</span>
              </div>
              <div 
                onClick={() => navigateTo('/')}
                style={{ color: 'var(--text-secondary)', fontSize: '13.5px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', transition: 'var(--transition)' }}
              >
                <Globe size={16} />
                <span>Public Website</span>
              </div>
            </div>
          ) : (
            <div style={{ color: 'var(--text-secondary)', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 500 }}>
              <Layers size={16} style={{ color: 'var(--accent)' }} /> 
              <span>Database Status: Online</span>
            </div>
          )}
        </div>
      </aside>

      {/* Main Workspace Dashboard Content */}
      <main className="main-content">
        <header className="header-row">
          <div>
            <h1 className="page-title" style={{ textTransform: 'capitalize' }}>
              {activeTab.replace('-', ' ')}
            </h1>
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            {branches.length > 0 ? (
              <div className="branch-static-badge">
                <MapPin size={14} style={{ marginRight: '6px', color: 'var(--accent)' }} />
                <span>{branches.find(b => b.id === selectedBranch)?.name || branches[0].name}</span>
              </div>
            ) : (
              <button 
                className="btn-primary" 
                onClick={handleSeedData} 
                disabled={isSeeding}
                style={{ padding: '8px 16px', fontSize: '13px' }}
              >
                {isSeeding ? "Seeding..." : "Seed Default Salon System"}
              </button>
            )}
          </div>
        </header>

        {/* Dashboard Panels */}
        {activeTab === 'dashboard' && (
          <div>
            {/* Top Stat Cards */}
            <div className="grid-3">
              <div className="stat-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '14px', fontWeight: 500 }}>Today's Bookings</div>
                  <div className="stat-value">{stats.appointmentsToday}</div>
                </div>
                <div style={{ backgroundColor: 'var(--accent-glow)', padding: '12px', borderRadius: '12px', color: 'var(--accent)' }}>
                  <Calendar size={24} />
                </div>
              </div>
              <div className="stat-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '14px', fontWeight: 500 }}>Walk-In Waitlist</div>
                  <div className="stat-value">{stats.waitingQueueCount}</div>
                </div>
                <div style={{ backgroundColor: 'var(--accent-glow)', padding: '12px', borderRadius: '12px', color: 'var(--accent)' }}>
                  <UserCheck size={24} />
                </div>
              </div>
              <div className="stat-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '14px', fontWeight: 500 }}>Stylists Assigned</div>
                  <div className="stat-value">{stats.activeStylists}</div>
                </div>
                <div style={{ backgroundColor: 'var(--accent-glow)', padding: '12px', borderRadius: '12px', color: 'var(--accent)' }}>
                  <Users size={24} />
                </div>
              </div>
            </div>

            <div className="glass-panel">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                  <h3 style={{ color: 'var(--accent)', marginTop: 0, fontFamily: 'var(--font-serif)', fontSize: '20px', fontWeight: 600 }}>Active Walk-In Waiting List</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>Monitor real-time client arrivals in queue.</p>
                </div>
                <span className="status-badge active" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: '6px', height: '6px', backgroundColor: 'var(--accent)', borderRadius: '50%', display: 'inline-block' }}></span>
                  Live Queue
                </span>
              </div>
              
              <div className="empty-state-card">
                <div style={{ backgroundColor: 'var(--accent-glow)', padding: '16px', borderRadius: '50%', color: 'var(--accent)', marginBottom: '8px' }}>
                  <UserCheck size={32} />
                </div>
                <div className="empty-state-title">No active walk-in clients</div>
                <div className="empty-state-desc">When guests check-in via the walk-in portal, they will automatically appear here.</div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'appointments' && (
          <div className="glass-panel">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div>
                <h3 style={{ color: 'var(--accent)', marginTop: 0, fontFamily: 'var(--font-serif)', fontSize: '20px', fontWeight: 600 }}>Clients Booked Ledger</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>All scheduled client reservations for this branch.</p>
              </div>
              <button className="btn-primary" onClick={() => navigateTo('/')} style={{ padding: '8px 16px', fontSize: '13px' }}>
                <Plus size={16} /> Book New Slot
              </button>
            </div>
            <div className="empty-state-card">
              <div style={{ backgroundColor: 'var(--accent-glow)', padding: '16px', borderRadius: '50%', color: 'var(--accent)', marginBottom: '8px' }}>
                <Calendar size={32} />
              </div>
              <div className="empty-state-title">No appointments registered</div>
              <div className="empty-state-desc">Use the public booking page to schedule client slots and view details here.</div>
            </div>
          </div>
        )}

        {activeTab === 'waitlist' && (
          <div className="glass-panel">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div>
                <h3 style={{ color: 'var(--accent)', marginTop: 0, fontFamily: 'var(--font-serif)', fontSize: '20px', fontWeight: 600 }}>Walk-In Queue (Live Waitlist)</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>Real-time check-ins waiting for the next available stylist.</p>
              </div>
            </div>
            <div className="empty-state-card">
              <div style={{ backgroundColor: 'var(--accent-glow)', padding: '16px', borderRadius: '50%', color: 'var(--accent)', marginBottom: '8px' }}>
                <Clock size={32} />
              </div>
              <div className="empty-state-title">Queue is empty</div>
              <div className="empty-state-desc">Guests will populate here as they check-in online or on the walk-in tablet.</div>
            </div>
          </div>
        )}

        {activeTab === 'employees' && (
          <div className="glass-panel">
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ color: 'var(--accent)', marginTop: 0, fontFamily: 'var(--font-serif)', fontSize: '20px', fontWeight: 600 }}>Stylists & Shift Schedules</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>Setup specialties, active flags, and weekly schedules for your team.</p>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px', marginTop: '20px' }}>
              <div className="data-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <div style={{ width: '44px', height: '44px', borderRadius: '50%', backgroundColor: 'rgba(6, 95, 70, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: 'var(--accent)', fontSize: '16px', fontFamily: 'var(--font-serif)' }}>
                      ST
                    </div>
                    <div>
                      <h4 style={{ fontWeight: 600, fontSize: '16px', color: 'var(--text-primary)' }}>Sara Technician</h4>
                      <span className="micro-badge" style={{ marginTop: '4px', fontSize: '9px' }}>40% Commission</span>
                    </div>
                  </div>
                  <span className="status-badge active">On Shift</span>
                </div>
                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px', marginTop: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Role</span>
                    <strong style={{ color: 'var(--text-primary)' }}>Nail Technician</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Weekly Hours</span>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>Mon - Fri (9am - 5pm)</span>
                  </div>
                </div>
              </div>

              <div className="data-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <div style={{ width: '44px', height: '44px', borderRadius: '50%', backgroundColor: 'rgba(6, 95, 70, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: 'var(--accent)', fontSize: '16px', fontFamily: 'var(--font-serif)' }}>
                      AO
                    </div>
                    <div>
                      <h4 style={{ fontWeight: 600, fontSize: '16px', color: 'var(--text-primary)' }}>Andres Owner</h4>
                      <span className="micro-badge" style={{ marginTop: '4px', fontSize: '9px' }}>50% Commission</span>
                    </div>
                  </div>
                  <span className="status-badge active">On Shift</span>
                </div>
                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px', marginTop: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Role</span>
                    <strong style={{ color: 'var(--text-primary)' }}>Master Artist</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Weekly Hours</span>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>Daily (On-Call / Management)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'inventory' && (
          <div className="glass-panel">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div>
                <h3 style={{ color: 'var(--accent)', marginTop: 0, fontFamily: 'var(--font-serif)', fontSize: '20px', fontWeight: 600 }}>Inventory Stock & Adjustments</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>Track product stock levels, reorder alerts, and retail item inventory.</p>
              </div>
            </div>
            <div className="empty-state-card">
              <div style={{ backgroundColor: 'var(--accent-glow)', padding: '16px', borderRadius: '50%', color: 'var(--accent)', marginBottom: '8px' }}>
                <ShoppingBag size={32} />
              </div>
              <div className="empty-state-title">No retail items mapped</div>
              <div className="empty-state-desc">Track product levels, reorder levels, and inbound shipment logs in this ledger.</div>
            </div>
          </div>
        )}

        {activeTab === 'clients' && (
          <div className="glass-panel">
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ color: 'var(--accent)', marginTop: 0, fontFamily: 'var(--font-serif)', fontSize: '20px', fontWeight: 600 }}>Clients Directory</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>Manage loyalty program history, customer lifetime values, and visit frequencies.</p>
            </div>
            <div className="empty-state-card">
              <div style={{ backgroundColor: 'var(--accent-glow)', padding: '16px', borderRadius: '50%', color: 'var(--accent)', marginBottom: '8px' }}>
                <Users size={32} />
              </div>
              <div className="empty-state-title">Client registry is empty</div>
              <div className="empty-state-desc">Customers who book appointments or register on the walk-in check-in will appear here.</div>
            </div>
          </div>
        )}

        {activeTab === 'services' && (
          <div className="glass-panel">
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ color: 'var(--accent)', marginTop: 0, fontFamily: 'var(--font-serif)', fontSize: '20px', fontWeight: 600 }}>Services Catalog</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>List of offerings, buffer timings, and prices mapped to this branch.</p>
            </div>
            {branches[0]?.services && branches[0].services.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px', marginTop: '20px' }}>
                {branches[0].services.map((s: any) => (
                  <div key={s.id} className="data-card" style={{ padding: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                      <h4 style={{ fontWeight: 600, fontSize: '16px', color: 'var(--text-primary)', margin: 0, maxWidth: '70%' }}>{s.name}</h4>
                      <span style={{ fontSize: '18px', fontWeight: 700, color: 'var(--accent)', fontFamily: 'var(--font-serif)' }}>
                        ${parseFloat(s.price).toFixed(2)}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
                      <span className="micro-badge" style={{ fontSize: '9px', padding: '4px 10px' }}>{s.category || 'Nails'}</span>
                      <span className="micro-badge" style={{ fontSize: '9px', padding: '4px 10px', backgroundColor: 'rgba(6, 95, 70, 0.04)', color: 'var(--text-secondary)' }}>
                        {s.durationMinutes} mins duration
                      </span>
                    </div>
                    <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px', fontSize: '13px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={12} />
                      <span>+{s.bufferTime || 0} mins cleanup buffer</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state-card">
                <div style={{ backgroundColor: 'var(--accent-glow)', padding: '16px', borderRadius: '50%', color: 'var(--accent)', marginBottom: '8px' }}>
                  <Scissors size={32} />
                </div>
                <div className="empty-state-title">No services loaded</div>
                <div className="empty-state-desc">Click "Seed Default Salon System" in the header to populate the catalog with our premium treatments.</div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="glass-panel" style={{ borderLeft: '4px solid var(--accent)' }}>
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ color: 'var(--accent)', marginTop: 0, fontFamily: 'var(--font-serif)', fontSize: '20px', fontWeight: 600 }}>Owner Financial Ledger</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>Real-time revenue stream tracking, tax collection estimates, and stylist payouts.</p>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginTop: '20px', marginBottom: '24px' }}>
              <div className="stat-card" style={{ textAlign: 'center', padding: '32px' }}>
                <span style={{ fontSize: '13.5px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>Gross Income Today</span>
                <h2 style={{ color: 'var(--accent)', margin: '12px 0 6px 0', fontSize: '40px', fontFamily: 'var(--font-serif)', fontWeight: 700 }}>$0.00</h2>
                <span className="status-badge active" style={{ fontSize: '10px' }}>Up to date</span>
              </div>
              <div className="stat-card" style={{ textAlign: 'center', padding: '32px' }}>
                <span style={{ fontSize: '13.5px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>Commission Liability</span>
                <h2 style={{ color: '#D97706', margin: '12px 0 6px 0', fontSize: '40px', fontFamily: 'var(--font-serif)', fontWeight: 700 }}>$0.00</h2>
                <span className="status-badge pending" style={{ fontSize: '10px' }}>Pending Settlement</span>
              </div>
            </div>
            
            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '24px', marginTop: '24px' }}>
              <h4 style={{ color: 'var(--text-primary)', marginBottom: '16px', fontWeight: 600 }}>Monthly Financial Statement Summary</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', paddingBottom: '12px', borderBottom: '1px solid rgba(6, 95, 70, 0.06)' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Service Revenue (Estimated)</span>
                  <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>$0.00</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', paddingBottom: '12px', borderBottom: '1px solid rgba(6, 95, 70, 0.06)' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Product Retail Sales</span>
                  <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>$0.00</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Taxes Collected (GST/HST)</span>
                  <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>$0.00</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="glass-panel">
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ color: 'var(--accent)', marginTop: 0, fontFamily: 'var(--font-serif)', fontSize: '20px', fontWeight: 600 }}>System Control Panel</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>Configure booking ratios, loyalty program tier rewards, taxation rules, and metadata parameters.</p>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div>
                  <label className="form-label" style={{ marginBottom: '6px', display: 'block' }}>Tax Mode Configuration</label>
                  <select defaultValue="enabled">
                    <option value="enabled">Standard GST/HST Tax (13%)</option>
                    <option value="reduced">Reduced Sales Tax (5%)</option>
                    <option value="disabled">Tax Exempted</option>
                  </select>
                </div>
                <div>
                  <label className="form-label" style={{ marginBottom: '6px', display: 'block' }}>Loyalty Points Multiplier</label>
                  <select defaultValue="1x">
                    <option value="1x">Standard Rate (1 Pt / $1 Spent)</option>
                    <option value="2x">Double Points Promotion (2 Pt / $1 Spent)</option>
                    <option value="disabled">Loyalty System Off</option>
                  </select>
                </div>
              </div>
              <div style={{ padding: '16px', backgroundColor: 'rgba(6, 95, 70, 0.02)', border: '1px solid var(--border-color)', borderRadius: '8px', fontSize: '13.5px', color: 'var(--text-secondary)', display: 'flex', gap: '8px', alignItems: 'center' }}>
                <Shield size={16} style={{ color: 'var(--accent)' }} />
                <span>System rules set here immediately update pricing calculations and receipt generation.</span>
              </div>
            </div>
          </div>
        )}

        {/* Public Pages */}
        {activeTab === 'public-home' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
            <div className="glass-panel" style={{ padding: '40px', overflow: 'hidden' }}>
              <div className="hero-grid">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <span className="micro-badge" style={{ alignSelf: 'flex-start' }}>Welcome to Premium Care</span>
                  <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '38px', fontWeight: 700, color: 'var(--accent)', margin: 0, lineHeight: 1.2 }}>
                    Experience Luxury Nail Artistry
                  </h2>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '15px', lineHeight: 1.6, margin: 0 }}>
                    Nails Salon System welcomes you to a premium retreat of styling, hand-crafted art, and rejuvenation. Book your exclusive session or register directly to our live walk-in waiting queue.
                  </p>
                  <div style={{ display: 'flex', gap: '16px', marginTop: '10px' }}>
                    <button className="btn-primary" onClick={() => setActiveTab('public-booking')}>
                      <Calendar size={16} /> Book Appointment
                    </button>
                    <button className="btn-primary" onClick={() => setActiveTab('public-walkin')} style={{ border: '1px solid var(--accent)', background: 'transparent', color: 'var(--accent)', boxShadow: 'none' }} onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--accent-glow)'; }} onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}>
                      <UserCheck size={16} /> Live Walk-In Check-In
                    </button>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <div className="outer-bezel" style={{ padding: '6px', width: '100%', maxWidth: '340px' }}>
                    <img 
                      src={heroImg} 
                      alt="Luxury Nails Salon" 
                      style={{ 
                        width: '100%', 
                        height: 'auto', 
                        borderRadius: '20px', 
                        display: 'block',
                        boxShadow: 'var(--shadow-md)'
                      }} 
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Why Choose Us features */}
            <div>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '24px', fontWeight: 600, color: 'var(--text-primary)', textAlign: 'center', marginBottom: '24px' }}>
                Why Choose Our Salon
              </h3>
              <div className="grid-3">
                <div className="data-card" style={{ padding: '24px', textAlign: 'center', alignItems: 'center' }}>
                  <div style={{ backgroundColor: 'var(--accent-glow)', padding: '16px', borderRadius: '50%', color: 'var(--accent)', marginBottom: '16px', display: 'inline-flex' }}>
                    <Award size={28} />
                  </div>
                  <h4 style={{ fontWeight: 600, fontSize: '17px', color: 'var(--text-primary)', marginBottom: '8px' }}>Licensed Artists</h4>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '13.5px', lineHeight: 1.5, margin: 0 }}>
                    Our master technicians specialize in high-end customized gel work, extensions, and intricate nail art.
                  </p>
                </div>

                <div className="data-card" style={{ padding: '24px', textAlign: 'center', alignItems: 'center' }}>
                  <div style={{ backgroundColor: 'var(--accent-glow)', padding: '16px', borderRadius: '50%', color: 'var(--accent)', marginBottom: '16px', display: 'inline-flex' }}>
                    <Layers size={28} />
                  </div>
                  <h4 style={{ fontWeight: 600, fontSize: '17px', color: 'var(--text-primary)', marginBottom: '8px' }}>Organic Products</h4>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '13.5px', lineHeight: 1.5, margin: 0 }}>
                    We use botanical treatments, organic creams, and non-toxic high-shine gel lacquers for safety.
                  </p>
                </div>

                <div className="data-card" style={{ padding: '24px', textAlign: 'center', alignItems: 'center' }}>
                  <div style={{ backgroundColor: 'var(--accent-glow)', padding: '16px', borderRadius: '50%', color: 'var(--accent)', marginBottom: '16px', display: 'inline-flex' }}>
                    <Shield size={28} />
                  </div>
                  <h4 style={{ fontWeight: 600, fontSize: '17px', color: 'var(--text-primary)', marginBottom: '8px' }}>Sanitized Tools</h4>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '13.5px', lineHeight: 1.5, margin: 0 }}>
                    Medical-grade sterilization processes ensure complete customer health and peace of mind.
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Status Banner */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', borderTop: '1px solid var(--border-color)', paddingTop: '32px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <MapPin size={20} style={{ color: 'var(--accent)' }} />
                <div>
                  <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)' }}>Find Us</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>123 Luxury Way, Suite 100</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <Clock size={20} style={{ color: 'var(--accent)' }} />
                <div>
                  <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)' }}>Salon Hours</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Mon - Sun (9:00 AM - 8:00 PM)</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <Globe size={20} style={{ color: 'var(--accent)' }} />
                <div>
                  <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)' }}>Contact Hotline</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>(555) 0199 | support@nails.com</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'public-booking' && (
          <div className="glass-panel">
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ color: 'var(--accent)', marginTop: 0, fontFamily: 'var(--font-serif)', fontSize: '20px', fontWeight: 600 }}>Schedule an Appointment</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>Book your luxury appointment at Nails Salon System.</p>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); alert("Appointment booked (Simulation)"); }} style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '560px' }}>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">First Name</label>
                  <input type="text" placeholder="First Name" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Last Name</label>
                  <input type="text" placeholder="Last Name" required />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input type="tel" placeholder="Phone Number" required />
              </div>
              <div className="form-group">
                <label className="form-label">Service Category</label>
                <select>
                  <option>Hand Care (Gel Manicures)</option>
                  <option>Foot Care (Luxury Pedicures)</option>
                  <option>Nail Extensions</option>
                  <option>Eyelash Extensions</option>
                </select>
              </div>
              <button type="submit" className="btn-primary" style={{ marginTop: '12px', alignSelf: 'flex-start', padding: '14px 32px' }}>
                Submit Appointment Request
              </button>
            </form>
          </div>
        )}

        {activeTab === 'public-services' && (
          <div className="glass-panel">
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ color: 'var(--accent)', marginTop: 0, fontFamily: 'var(--font-serif)', fontSize: '20px', fontWeight: 600 }}>Our Service Offerings</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>Explore our hand-crafted beauty treatments and pricing catalogs.</p>
            </div>
            
            {branches[0]?.services && branches[0].services.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px', marginTop: '20px' }}>
                {branches[0].services.map((s: any) => (
                  <div key={s.id} className="data-card" style={{ padding: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                      <h4 style={{ fontWeight: 600, fontSize: '16px', color: 'var(--text-primary)', margin: 0, maxWidth: '70%' }}>{s.name}</h4>
                      <span style={{ fontSize: '18px', fontWeight: 700, color: 'var(--accent)', fontFamily: 'var(--font-serif)' }}>
                        ${parseFloat(s.price).toFixed(2)}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
                      <span className="micro-badge" style={{ fontSize: '9px', padding: '4px 10px' }}>{s.category || 'Nails'}</span>
                      <span className="micro-badge" style={{ fontSize: '9px', padding: '4px 10px', backgroundColor: 'rgba(6, 95, 70, 0.04)', color: 'var(--text-secondary)' }}>
                        {s.durationMinutes} mins
                      </span>
                    </div>
                    <button className="btn-primary" onClick={() => setActiveTab('public-booking')} style={{ width: '100%', fontSize: '13px', padding: '8px 16px', border: '1px solid var(--accent)', background: 'transparent', color: 'var(--accent)', boxShadow: 'none' }} onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--accent-glow)'; }} onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}>
                      Book Treatment
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px', marginTop: '20px' }}>
                <div className="data-card" style={{ padding: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <h4 style={{ fontWeight: 600, fontSize: '16px', color: 'var(--text-primary)', margin: 0 }}>Classic Gel Manicure</h4>
                    <span style={{ fontSize: '18px', fontWeight: 700, color: 'var(--accent)', fontFamily: 'var(--font-serif)' }}>$45.00</span>
                  </div>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: '1.4' }}>Long-lasting classic gel polish application includes nail shaping and cuticle care.</p>
                  <button className="btn-primary" onClick={() => setActiveTab('public-booking')} style={{ width: '100%', fontSize: '13px', padding: '8px 16px', border: '1px solid var(--accent)', background: 'transparent', color: 'var(--accent)', boxShadow: 'none' }} onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--accent-glow)'; }} onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}>
                    Book Treatment
                  </button>
                </div>
                <div className="data-card" style={{ padding: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <h4 style={{ fontWeight: 600, fontSize: '16px', color: 'var(--text-primary)', margin: 0 }}>Luxury Paraffin Pedicure</h4>
                    <span style={{ fontSize: '18px', fontWeight: 700, color: 'var(--accent)', fontFamily: 'var(--font-serif)' }}>$65.00</span>
                  </div>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: '1.4' }}>Spa pedicure treatment concluding with a relaxing warm paraffin wax wrap.</p>
                  <button className="btn-primary" onClick={() => setActiveTab('public-booking')} style={{ width: '100%', fontSize: '13px', padding: '8px 16px', border: '1px solid var(--accent)', background: 'transparent', color: 'var(--accent)', boxShadow: 'none' }} onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--accent-glow)'; }} onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}>
                    Book Treatment
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'public-walkin' && (
          <div className="glass-panel">
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ color: 'var(--accent)', marginTop: 0, fontFamily: 'var(--font-serif)', fontSize: '20px', fontWeight: 600 }}>Live Walk-In Queue Registration</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>No booking? No worries. Add yourself directly to our live daily waitlist at this branch.</p>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); alert("Added to waitlist queue (Simulation)"); }} style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '500px' }}>
              <div className="form-group">
                <label className="form-label">First Name</label>
                <input type="text" placeholder="Enter your first name" required />
              </div>
              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input type="tel" placeholder="(555) 000-0000" required />
              </div>
              <button type="submit" className="btn-primary" style={{ marginTop: '12px', alignSelf: 'flex-start', padding: '14px 32px' }}>
                Check In Now
              </button>
            </form>
          </div>
        )}

        {/* Public Footer */}
        <footer className="public-footer">
          <div>Nails Salon System &copy; 2026. All rights reserved.</div>
          <div style={{ marginTop: '10px', fontSize: '12.5px' }}>
            Contacts: mainoffice@nailssalonsystem.com | HQ Hotline: (555) 0199 | Open Monday - Sunday: 9:00 AM - 8:00 PM
          </div>
          {roleMode === 'public' && (
            <div className="portal-links-row">
              <span className="portal-link" onClick={() => navigateTo('/admin')}>Admin Login</span>
              <span style={{ color: 'var(--border-color)' }}>•</span>
              <span className="portal-link" onClick={() => navigateTo('/owner')}>Owner Login</span>
            </div>
          )}
        </footer>
      </main>
    </div>
  );
}

export default App;
