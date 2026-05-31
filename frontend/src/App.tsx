import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Users, Scissors, Calendar, Shield, Settings, 
  MapPin, ShoppingBag, PlusCircle, Layers, CheckCircle2, UserCheck, HelpCircle 
} from 'lucide-react';

interface Branch {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  employees?: any[];
  services?: any[];
}

function App() {
  // Navigation State
  const [roleMode, setRoleMode] = useState<'owner' | 'admin' | 'public'>('admin');
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  
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
    fetch('http://localhost:5001/api/branches')
      .then((res) => res.json())
      .then((data: Branch[]) => {
        setBranches(data);
        if (data.length > 0 && !selectedBranch) {
          setSelectedBranch(data[0].id);
        }
      })
      .catch((err) => console.log("CORS/Connection warning: Run backend & seed database."));
  };

  useEffect(() => {
    fetchMetadata();
  }, []);

  // Fetch Stats when Branch changes
  useEffect(() => {
    if (selectedBranch) {
      fetch(`http://localhost:5001/api/dashboard/${selectedBranch}`)
        .then(res => res.json())
        .then(data => setStats(data))
        .catch(() => {});
    }
  }, [selectedBranch]);

  const handleSeedData = async () => {
    setIsSeeding(true);
    try {
      const res = await fetch('http://localhost:5001/api/seed-initial-data', { method: 'POST' });
      const data = await res.json();
      alert(data.message);
      fetchMetadata();
    } catch (e) {
      alert("Failed to seed initial data. Is backend server running?");
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div className="app-container">
      {/* Navigation Sidebar */}
      <aside className="sidebar">
        <div>
          <div className="brand-title">Nails Salon System</div>
          
          {/* Role Mode Swapper */}
          <div className="nav-section-title">System Role Mode</div>
          <select 
            style={{ marginBottom: '20px', padding: '8px 12px', fontSize: '13px' }}
            value={roleMode}
            onChange={(e) => {
              const role = e.target.value as 'owner' | 'admin' | 'public';
              setRoleMode(role);
              setActiveTab(role === 'public' ? 'public-booking' : 'dashboard');
            }}
          >
            <option value="owner">Owner View</option>
            <option value="admin">Admin View</option>
            <option value="public">Public Webpage</option>
          </select>

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

        <div style={{ color: 'var(--text-secondary)', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Layers size={14} /> Branch Database Online
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
              <select 
                className="branch-dropdown"
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
              >
                {branches.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
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
              <div className="stat-card">
                <div style={{ color: 'var(--text-secondary)' }}>Today's Bookings</div>
                <div className="stat-value">{stats.appointmentsToday}</div>
              </div>
              <div className="stat-card">
                <div style={{ color: 'var(--text-secondary)' }}>Walk-In Waitlist Queue</div>
                <div className="stat-value">{stats.waitingQueueCount}</div>
              </div>
              <div className="stat-card">
                <div style={{ color: 'var(--text-secondary)' }}>Stylists Assigned</div>
                <div className="stat-value">{stats.activeStylists}</div>
              </div>
            </div>

            <div className="glass-panel">
              <h3 style={{ color: 'var(--accent)', marginTop: 0 }}>Active Walk-In Waiting List</h3>
              <p style={{ color: 'var(--text-secondary)' }}>Monitor real-time client arrivals in queue.</p>
              <div style={{ border: '1px dashed var(--border-color)', borderRadius: '8px', padding: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                No active walk-in clients waiting.
              </div>
            </div>
          </div>
        )}

        {activeTab === 'appointments' && (
          <div className="glass-panel">
            <h3 style={{ color: 'var(--accent)', marginTop: 0 }}>Clients Booked Ledger</h3>
            <div style={{ border: '1px dashed var(--border-color)', borderRadius: '8px', padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              No appointments registered. Use the public booking page to schedule client slots.
            </div>
          </div>
        )}

        {activeTab === 'waitlist' && (
          <div className="glass-panel">
            <h3 style={{ color: 'var(--accent)', marginTop: 0 }}>Walk-In Queue (Live Waitlist)</h3>
            <div style={{ border: '1px dashed var(--border-color)', borderRadius: '8px', padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              Queue is empty.
            </div>
          </div>
        )}

        {activeTab === 'employees' && (
          <div className="glass-panel">
            <h3 style={{ color: 'var(--accent)', marginTop: 0 }}>Stylists shift schedule configurations</h3>
            <p>Setup specialties, active flags, and weekly schedules.</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '20px' }}>
              <div style={{ padding: '20px', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <strong>Sara Technician</strong><br />
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Specialty: Nail Technician (40% Commission)</span>
              </div>
              <div style={{ padding: '20px', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <strong>Andres Owner</strong><br />
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Specialty: Master Artist (50% Commission)</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'inventory' && (
          <div className="glass-panel">
            <h3 style={{ color: 'var(--accent)', marginTop: 0 }}>Inventory Stock & Log Adjustments</h3>
            <div style={{ border: '1px dashed var(--border-color)', borderRadius: '8px', padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              No retail items mapped. Track product levels, reorder levels, and inbound logs here.
            </div>
          </div>
        )}

        {activeTab === 'clients' && (
          <div className="glass-panel">
            <h3 style={{ color: 'var(--accent)', marginTop: 0 }}>Clients Directory</h3>
            <p>Search clients, loyalty balance history, and birthdates.</p>
            <div style={{ border: '1px dashed var(--border-color)', borderRadius: '8px', padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              Client registry empty.
            </div>
          </div>
        )}

        {activeTab === 'services' && (
          <div className="glass-panel">
            <h3 style={{ color: 'var(--accent)', marginTop: 0 }}>Services Catalog</h3>
            <p>List of offerings, buffer timings, and prices.</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '20px' }}>
              {branches[0]?.services?.map((s: any) => (
                <div key={s.id} style={{ padding: '16px', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <strong>{s.name}</strong> - ${parseFloat(s.price).toFixed(2)}<br />
                  <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Duration: {s.durationMinutes} mins (+{s.bufferTime}m buffer) | Category: {s.category}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="glass-panel" style={{ borderLeft: '4px solid var(--accent)' }}>
            <h3 style={{ color: 'var(--accent)', marginTop: 0 }}>Owner Financial Ledger</h3>
            <p>Financial breakdowns, tax collections, item profit logs, and commission payout metrics across all branches.</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '20px' }}>
              <div style={{ padding: '24px', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Gross Income Today</span>
                <h2 style={{ color: 'var(--accent)', margin: '8px 0 0 0' }}>$0.00</h2>
              </div>
              <div style={{ padding: '24px', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Accumulated Commission Liability</span>
                <h2 style={{ color: 'var(--accent)', margin: '8px 0 0 0' }}>$0.00</h2>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="glass-panel">
            <h3 style={{ color: 'var(--accent)', marginTop: 0 }}>System Rules</h3>
            <p>Define ratio rates, point exchange systems, tax configurations, and system key-values.</p>
          </div>
        )}

        {/* Public Pages */}
        {activeTab === 'public-booking' && (
          <div className="glass-panel">
            <h3 style={{ color: 'var(--accent)', marginTop: 0 }}>Schedule an Appointment</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>Book your luxury appointment at Nails Salon System.</p>
            <form onSubmit={(e) => { e.preventDefault(); alert("Appointment booked (Simulation)"); }} style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '500px' }}>
              <div>
                <label style={{ fontSize: '14px', display: 'block', marginBottom: '6px' }}>First Name</label>
                <input type="text" placeholder="First Name" required />
              </div>
              <div>
                <label style={{ fontSize: '14px', display: 'block', marginBottom: '6px' }}>Last Name</label>
                <input type="text" placeholder="Last Name" required />
              </div>
              <div>
                <label style={{ fontSize: '14px', display: 'block', marginBottom: '6px' }}>Phone Number</label>
                <input type="tel" placeholder="Phone Number" required />
              </div>
              <div>
                <label style={{ fontSize: '14px', display: 'block', marginBottom: '6px' }}>Service Category</label>
                <select>
                  <option>Hand Care (Gel Manicures)</option>
                  <option>Foot Care (Luxury Pedicures)</option>
                  <option>Nail Extensions</option>
                  <option>Eyelash Extensions</option>
                </select>
              </div>
              <button type="submit" className="btn-primary" style={{ marginTop: '10px' }}>Submit Appointment Request</button>
            </form>
          </div>
        )}

        {activeTab === 'public-services' && (
          <div className="glass-panel">
            <h3 style={{ color: 'var(--accent)', marginTop: 0 }}>Our Service Offerings</h3>
            <p>Explore our beauty treatments and pricing catalogs.</p>
          </div>
        )}

        {activeTab === 'public-walkin' && (
          <div className="glass-panel">
            <h3 style={{ color: 'var(--accent)', marginTop: 0 }}>Live Walk-In Queue Registration</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>Add yourself to the live waiting list at this branch.</p>
            <form onSubmit={(e) => { e.preventDefault(); alert("Added to waitlist queue (Simulation)"); }} style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '500px' }}>
              <div>
                <label style={{ fontSize: '14px', display: 'block', marginBottom: '6px' }}>First Name</label>
                <input type="text" placeholder="First Name" required />
              </div>
              <div>
                <label style={{ fontSize: '14px', display: 'block', marginBottom: '6px' }}>Phone Number</label>
                <input type="tel" placeholder="Phone Number" required />
              </div>
              <button type="submit" className="btn-primary" style={{ marginTop: '10px' }}>Check In Now</button>
            </form>
          </div>
        )}

        {/* Public Footer */}
        <footer className="public-footer">
          <div>Nails Salon System &copy; 2026. All rights reserved.</div>
          <div style={{ marginTop: '10px', fontSize: '12px' }}>
            Contacts: mainoffice@nailssalonsystem.com | HQ Hotline: (555) 0199 | Open Monday - Sunday: 9:00 AM - 8:00 PM
          </div>
        </footer>
      </main>
    </div>
  );
}

export default App;
