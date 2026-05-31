import React from 'react';
import { 
  LayoutDashboard, Users, Scissors, Calendar, Shield, Settings, 
  ShoppingBag, PlusCircle, UserCheck, MapPin, Plus, LogOut, Globe
} from 'lucide-react';
import type { Branch, WaitlistItem, DashboardStats } from '../types';

interface AdminDashboardProps {
  activeTab: string;
  setActiveTab: (t: string) => void;
  roleMode: 'admin' | 'owner' | 'public';
  employeeRole: string;
  branches: Branch[];
  selectedBranch: string;
  stats: DashboardStats;
  waitlist: WaitlistItem[];
  handleUpdateWaitlistStatus: (id: string, newStatus: 'WAITING' | 'IN_PROGRESS' | 'COMPLETED') => void;
  handleLogout: () => void;
  navigateTo: (path: string) => void;
  isSeeding: boolean;
  handleSeedData: () => void;
  
  // Receptionist Walk-in
  walkinName: string;
  setWalkinName: (n: string) => void;
  walkinPhone: string;
  setWalkinPhone: (p: string) => void;
  walkinService: string;
  setWalkinService: (s: string) => void;
  walkinStylist: string;
  setWalkinStylist: (s: string) => void;
  handleAdminWalkinSubmit: (e: React.FormEvent) => void;

  // Add Employee Modal
  isAddEmployeeModalOpen: boolean;
  setIsAddEmployeeModalOpen: (b: boolean) => void;
  newEmpName: string;
  setNewEmpName: (n: string) => void;
  newEmpUsername: string;
  setNewEmpUsername: (u: string) => void;
  newEmpPassword: string;
  setNewEmpPassword: (p: string) => void;
  newEmpRole: string;
  setNewEmpRole: (r: string) => void;
  newEmpPhoneNumber: string;
  setNewEmpPhoneNumber: (p: string) => void;
  newEmpSpecialty: string;
  setNewEmpSpecialty: (s: string) => void;
  newEmpError: string;
  handleAddEmployeeSubmit: (e: React.FormEvent) => void;
}

export function AdminDashboard({
  activeTab,
  setActiveTab,
  roleMode,
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
  
  walkinName,
  setWalkinName,
  walkinPhone,
  setWalkinPhone,
  walkinService,
  setWalkinService,
  walkinStylist,
  setWalkinStylist,
  handleAdminWalkinSubmit,

  isAddEmployeeModalOpen,
  setIsAddEmployeeModalOpen,
  newEmpName,
  setNewEmpName,
  newEmpUsername,
  setNewEmpUsername,
  newEmpPassword,
  setNewEmpPassword,
  newEmpRole,
  setNewEmpRole,
  newEmpPhoneNumber,
  setNewEmpPhoneNumber,
  newEmpSpecialty,
  setNewEmpSpecialty,
  newEmpError,
  handleAddEmployeeSubmit
}: AdminDashboardProps) {
  return (
    <div className="app-container">
      {/* Navigation Sidebar */}
      <aside className="sidebar">
        <div>
          <div className="brand-title" onClick={() => navigateTo('/')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Scissors size={24} style={{ transform: 'rotate(-45deg)', color: 'var(--accent)' }} />
            <span style={{ fontFamily: 'var(--font-serif)', fontSize: '20px', letterSpacing: '-0.5px' }}>Nails & Lashes Lane</span>
          </div>
          
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '24px' }}>
            <span className="micro-badge" style={{ backgroundColor: 'var(--accent-glow)', color: 'var(--accent)', border: '1px solid var(--border-color)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>
              {roleMode === 'owner' ? 'Owner Space' : 'Admin Space'}
            </span>
          </div>

          <div className="nav-section-title">Workspace</div>
          <nav className="nav-links">
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
              className={`nav-link ${activeTab === 'admin-walkin' ? 'active' : ''}`}
              onClick={() => setActiveTab('admin-walkin')}
              style={{ borderLeft: '3px dashed var(--accent)' }}
            >
              <PlusCircle size={18} />
              Add Walk-In Guest
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
          </nav>
        </div>

        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '20px', marginTop: '20px' }}>
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
                  <div className="stat-value">{waitlist.filter(item => item.status === 'WAITING').length}</div>
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
              
              {waitlist.filter(item => item.status !== 'COMPLETED').length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {waitlist.filter(item => item.status !== 'COMPLETED').map(item => (
                    <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)' }}>{item.firstName}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{item.service}</div>
                      </div>
                      <span className="micro-badge" style={{ fontSize: '9px', padding: '3px 8px' }}>
                        {item.status === 'IN_PROGRESS' ? 'Serving' : 'Waiting'}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state-card">
                  <div style={{ backgroundColor: 'var(--accent-glow)', padding: '16px', borderRadius: '50%', color: 'var(--accent)', marginBottom: '8px' }}>
                    <UserCheck size={32} />
                  </div>
                  <div className="empty-state-title">No active walk-in clients</div>
                  <div className="empty-state-desc">When guests check-in via the walk-in portal, they will automatically appear here.</div>
                </div>
              )}
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
              <button className="btn-secondary" onClick={() => setActiveTab('admin-walkin')} style={{ padding: '8px 16px', fontSize: '13px' }}>
                <Plus size={16} /> Register Walk-In Guest
              </button>
            </div>
            {waitlist.filter(item => item.status !== 'COMPLETED').length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {waitlist.filter(item => item.status !== 'COMPLETED').map(item => (
                  <div key={item.id} className="schedule-item">
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 600, fontSize: '15px', color: 'var(--text-primary)' }}>{item.firstName}</span>
                        {item.status === 'IN_PROGRESS' && (
                          <span className="status-badge active" style={{ fontSize: '9px', padding: '2px 8px' }}>Serving</span>
                        )}
                      </div>
                      <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                        {item.service} &bull; Preferring <span style={{ fontWeight: 500, color: 'var(--accent)' }}>{item.stylist}</span>
                      </div>
                      <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginTop: '8px', display: 'flex', gap: '12px' }}>
                        <span>Arrival: {item.checkInTime}</span>
                        <span>Phone: {item.phone}</span>
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {item.status === 'WAITING' && (
                        <button 
                          className="btn-primary" 
                          style={{ padding: '6px 12px', fontSize: '12px', backgroundColor: 'var(--accent-teal)' }}
                          onClick={() => handleUpdateWaitlistStatus(item.id, 'IN_PROGRESS')}
                        >
                          Start Session
                        </button>
                      )}
                      {item.status === 'IN_PROGRESS' && (
                        <button 
                          className="btn-primary" 
                          style={{ padding: '6px 12px', fontSize: '12px' }}
                          onClick={() => handleUpdateWaitlistStatus(item.id, 'COMPLETED')}
                        >
                          Mark Done
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state-card">
                <div style={{ backgroundColor: 'var(--accent-glow)', padding: '16px', borderRadius: '50%', color: 'var(--accent)', marginBottom: '8px' }}>
                  <UserCheck size={32} />
                </div>
                <div className="empty-state-title">No active walk-in clients</div>
                <div className="empty-state-desc">When guests check-in via the walk-in portal, they will automatically appear here.</div>
              </div>
            )}
          </div>
        )}

        {/* Receptionist check-in portal */}
        {activeTab === 'admin-walkin' && (
          <div className="glass-panel" style={{ borderLeft: '4px solid var(--accent-teal)' }}>
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ color: 'var(--accent)', marginTop: 0, fontFamily: 'var(--font-serif)', fontSize: '20px', fontWeight: 600 }}>Receptionist Walk-In Guest Check-In</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>Add a walk-in guest to the live queue on their behalf if they are not tech-savvy.</p>
            </div>
            
            <form onSubmit={handleAdminWalkinSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '500px' }}>
              <div className="form-group">
                <label className="form-label">Client's First Name</label>
                <input 
                  type="text" 
                  placeholder="Enter guest's first name" 
                  value={walkinName}
                  onChange={e => setWalkinName(e.target.value)}
                  required 
                />
              </div>
              <div className="form-group">
                <label className="form-label">Client's Phone Number</label>
                <input 
                  type="tel" 
                  placeholder="(555) 000-0000" 
                  value={walkinPhone}
                  onChange={e => setWalkinPhone(e.target.value)}
                  required 
                />
              </div>
              <div className="form-group">
                <label className="form-label">Stylist Preference</label>
                <select 
                  value={walkinStylist}
                  onChange={e => setWalkinStylist(e.target.value)}
                >
                  <option value="First Available Stylist">First Available Stylist</option>
                  {(branches.find(b => b.id === selectedBranch)?.employees || []).map(emp => (
                    <option key={emp.id} value={emp.name}>{emp.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Requested Treatment</label>
                <select 
                  value={walkinService}
                  onChange={e => setWalkinService(e.target.value)}
                >
                  <option value="Gel Manicure">Gel Manicure</option>
                  <option value="Gellack/Shellac/Gel polish">Gellack/Shellac/Gel polish</option>
                  <option value="Gel extensions">Gel extensions</option>
                  <option value="Gel on natural nails">Gel on natural nails</option>
                  <option value="Luxury Pedicure">Luxury Pedicure</option>
                  <option value="Volume Lash Extensions">Volume Lash Extensions</option>
                </select>
              </div>
              <button type="submit" className="btn-secondary" style={{ marginTop: '12px', alignSelf: 'flex-start', padding: '14px 32px' }}>
                Register and Queue Guest
              </button>
            </form>
          </div>
        )}

        {/* Employees & Shifts */}
        {activeTab === 'employees' && (
          <div className="glass-panel">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div>
                <h3 style={{ color: 'var(--accent)', marginTop: 0, fontFamily: 'var(--font-serif)', fontSize: '20px', fontWeight: 600 }}>Stylists & Shift Schedules</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>Setup specialties, active flags, and weekly schedules for your team.</p>
              </div>
              <button 
                className="btn-primary" 
                onClick={() => {
                  setIsAddEmployeeModalOpen(true);
                  setNewEmpRole('STAFF');
                }}
                style={{ padding: '8px 16px', fontSize: '13px' }}
              >
                + Add Employee
              </button>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px', marginTop: '20px' }}>
              {(branches.find(b => b.id === selectedBranch)?.employees || []).map((emp: any) => {
                const initials = emp.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2);
                return (
                  <div key={emp.id} className="data-card" style={{ padding: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <div style={{ width: '44px', height: '44px', borderRadius: '50%', backgroundColor: 'rgba(190, 24, 93, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: 'var(--accent)', fontSize: '16px', fontFamily: 'var(--font-serif)' }}>
                          {initials}
                        </div>
                        <div>
                          <h4 style={{ fontWeight: 600, fontSize: '16px', color: 'var(--text-primary)', margin: 0 }}>{emp.name}</h4>
                          <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
                            <span className="micro-badge" style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                              {emp.role}
                            </span>
                            {emp.isActive && <span className="status-badge active" style={{ padding: '2px 6px', fontSize: '9px' }}>On Shift</span>}
                          </div>
                        </div>
                      </div>
                      <span className={`status-badge ${emp.isActive ? 'active' : 'inactive'}`} style={{ padding: '4px 8px', fontSize: '10px' }}>
                        {emp.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    
                    <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px', marginTop: '4px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Specialty</span>
                        <strong style={{ color: 'var(--text-primary)' }}>{emp.specialty || 'Generalist'}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Phone</span>
                        <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{emp.phoneNumber}</span>
                      </div>
                      {emp.username && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                          <span style={{ color: 'var(--text-secondary)' }}>Username</span>
                          <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>@{emp.username}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Add Employee Modal Overlay */}
            {isAddEmployeeModalOpen && (
              <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(15, 23, 42, 0.6)',
                backdropFilter: 'blur(4px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000,
                padding: '20px'
              }}>
                <div className="outer-bezel" style={{ maxWidth: '500px', width: '100%' }}>
                  <div className="inner-core" style={{ padding: '32px' }}>
                    <h3 style={{ fontFamily: 'var(--font-serif)', color: 'var(--accent)', fontSize: '22px', fontWeight: 600, margin: '0 0 8px 0' }}>
                      Add New Employee
                    </h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '13.5px', margin: '0 0 24px 0' }}>
                      Register a new salon employee. System accounts are created for managers and owners.
                    </p>

                    <form onSubmit={handleAddEmployeeSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div className="form-group">
                        <label className="form-label">Full Name</label>
                        <input 
                          type="text" 
                          placeholder="e.g. John Doe" 
                          value={newEmpName}
                          onChange={e => setNewEmpName(e.target.value)}
                          required 
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">System Role</label>
                        {employeeRole === 'ADMIN' ? (
                          <select 
                            value={newEmpRole} 
                            onChange={e => setNewEmpRole(e.target.value)}
                            required
                          >
                            <option value="STAFF">Staff (Technician / Artist)</option>
                          </select>
                        ) : (
                          <select 
                            value={newEmpRole} 
                            onChange={e => setNewEmpRole(e.target.value)}
                            required
                          >
                            <option value="STAFF">Staff (Technician / Artist)</option>
                            <option value="ADMIN">Admin (Salon Manager)</option>
                            <option value="OWNER">Owner (Salon Owner)</option>
                          </select>
                        )}
                      </div>

                      <div className="form-group">
                        <label className="form-label">Phone Number</label>
                        <input 
                          type="tel" 
                          placeholder="e.g. 01234567890" 
                          value={newEmpPhoneNumber}
                          onChange={e => setNewEmpPhoneNumber(e.target.value)}
                          required 
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Specialty</label>
                        <input 
                          type="text" 
                          placeholder="e.g. Nail Artist, Eyelash Tech" 
                          value={newEmpSpecialty}
                          onChange={e => setNewEmpSpecialty(e.target.value)}
                        />
                      </div>

                      {(newEmpRole === 'ADMIN' || newEmpRole === 'OWNER') && (
                        <>
                          <div className="form-group">
                            <label className="form-label">Username</label>
                            <input 
                              type="text" 
                              placeholder="e.g. johndoe" 
                              value={newEmpUsername}
                              onChange={e => setNewEmpUsername(e.target.value)}
                              required 
                            />
                          </div>
                          <div className="form-group">
                            <label className="form-label">Password</label>
                            <input 
                              type="password" 
                              placeholder="••••••••" 
                              value={newEmpPassword}
                              onChange={e => setNewEmpPassword(e.target.value)}
                              required 
                            />
                          </div>
                        </>
                      )}

                      {newEmpError && (
                        <div style={{ color: '#b91c1c', fontSize: '13px', backgroundColor: '#fee2e2', padding: '10px', borderRadius: '6px', border: '1px solid #fecaca' }}>
                          {newEmpError}
                        </div>
                      )}

                      <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '12px' }}>
                        <button 
                          type="button" 
                          className="btn-primary" 
                          onClick={() => {
                            setIsAddEmployeeModalOpen(false);
                          }}
                          style={{ background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', boxShadow: 'none' }}
                        >
                          Cancel
                        </button>
                        <button type="submit" className="btn-primary">
                          Save Employee
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            )}
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div>
                <h3 style={{ color: 'var(--accent)', marginTop: 0, fontFamily: 'var(--font-serif)', fontSize: '20px', fontWeight: 600 }}>Client Directory & History</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>Browse registered loyalty program members and past salon visits.</p>
              </div>
            </div>
            <div className="empty-state-card">
              <div style={{ backgroundColor: 'var(--accent-glow)', padding: '16px', borderRadius: '50%', color: 'var(--accent)', marginBottom: '8px' }}>
                <Users size={32} />
              </div>
              <div className="empty-state-title">Directory is empty</div>
              <div className="empty-state-desc">Customer profiles, check-in loyalty points, and notes will sync here automatically.</div>
            </div>
          </div>
        )}

        {activeTab === 'services' && (
          <div className="glass-panel">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div>
                <h3 style={{ color: 'var(--accent)', marginTop: 0, fontFamily: 'var(--font-serif)', fontSize: '20px', fontWeight: 600 }}>Service Pricing & Catalog Setup</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>Configure nail treatments, buffer durations, and custom technician categories.</p>
              </div>
            </div>
            
            {branches[0]?.services && branches[0].services.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px', marginTop: '20px' }}>
                {branches[0].services.map((s: any) => (
                  <div key={s.id} className="data-card" style={{ padding: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                      <h4 style={{ fontWeight: 600, fontSize: '16px', color: 'var(--text-primary)', margin: 0 }}>{s.name}</h4>
                      <span style={{ fontSize: '18px', fontWeight: 700, color: 'var(--accent)', fontFamily: 'var(--font-serif)' }}>
                        ${parseFloat(s.price).toFixed(2)}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <span className="micro-badge" style={{ fontSize: '9px', padding: '4px 10px' }}>{s.category || 'Nails'}</span>
                      <span className="micro-badge" style={{ fontSize: '9px', padding: '4px 10px', backgroundColor: 'rgba(190, 24, 93, 0.04)', color: 'var(--text-secondary)' }}>
                        {s.durationMinutes} mins
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state-card">
                <div style={{ backgroundColor: 'var(--accent-glow)', padding: '16px', borderRadius: '50%', color: 'var(--accent)', marginBottom: '8px' }}>
                  <Scissors size={32} />
                </div>
                <div className="empty-state-title">No service catalogs initialized</div>
                <div className="empty-state-desc">Services configure pricing models and display correctly in our guest portal templates.</div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'analytics' && roleMode === 'owner' && (
          <div className="glass-panel">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div>
                <h3 style={{ color: 'var(--accent)', marginTop: 0, fontFamily: 'var(--font-serif)', fontSize: '20px', fontWeight: 600 }}>Financial Ledger & Performance</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>View revenue charts, service commissions, and client payment tallies.</p>
              </div>
            </div>
            <div className="empty-state-card">
              <div style={{ backgroundColor: 'var(--accent-glow)', padding: '16px', borderRadius: '50%', color: 'var(--accent)', marginBottom: '8px' }}>
                <Shield size={32} />
              </div>
              <div className="empty-state-title">Owner financials locked</div>
              <div className="empty-state-desc">Transactions, service sub-totals, taxes, and net business commission metrics will appear in this workspace.</div>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="glass-panel">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div>
                <h3 style={{ color: 'var(--accent)', marginTop: 0, fontFamily: 'var(--font-serif)', fontSize: '20px', fontWeight: 600 }}>System Settings Panel</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>Configure loyalty points ratios, tax rates, and basic brand descriptors.</p>
              </div>
            </div>
            <div className="empty-state-card">
              <div style={{ backgroundColor: 'var(--accent-glow)', padding: '16px', borderRadius: '50%', color: 'var(--accent)', marginBottom: '8px' }}>
                <Settings size={32} />
              </div>
              <div className="empty-state-title">Configurations locked</div>
              <div className="empty-state-desc">Loyalty point earn-ratios and global branch parameters are managed under this workspace.</div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
