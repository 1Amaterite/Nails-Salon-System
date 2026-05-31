import React from 'react';
import {
  LayoutDashboard, Users, Scissors, Calendar, Shield, Settings,
  ShoppingBag, PlusCircle, UserCheck, LogOut, Globe
} from 'lucide-react';
import type { Branch, WaitlistItem, DashboardStats } from '../types';

import { DashboardTab }    from './tabs/DashboardTab';
import { AppointmentsTab } from './tabs/AppointmentsTab';
import { WaitlistTab }     from './tabs/WaitlistTab';
import { AdminWalkinTab }  from './tabs/AdminWalkinTab';
import { EmployeesTab }    from './tabs/EmployeesTab';
import { InventoryTab }    from './tabs/InventoryTab';
import { ClientsTab }      from './tabs/ClientsTab';
import { ServicesTab }     from './tabs/ServicesTab';
import { FinancialsTab }   from './tabs/FinancialsTab';
import { SettingsTab }     from './tabs/SettingsTab';

interface OwnerDashboardProps {
  activeTab: string;
  setActiveTab: (t: string) => void;
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

export function OwnerDashboard({
  activeTab, setActiveTab, employeeRole,
  branches, selectedBranch, stats, waitlist,
  handleUpdateWaitlistStatus, handleLogout, navigateTo,
  walkinName, setWalkinName, walkinPhone, setWalkinPhone,
  walkinService, setWalkinService, walkinStylist, setWalkinStylist,
  handleAdminWalkinSubmit,
  isAddEmployeeModalOpen, setIsAddEmployeeModalOpen,
  newEmpName, setNewEmpName, newEmpUsername, setNewEmpUsername,
  newEmpPassword, setNewEmpPassword, newEmpRole, setNewEmpRole,
  newEmpPhoneNumber, setNewEmpPhoneNumber,
  newEmpSpecialty, setNewEmpSpecialty,
  newEmpError, handleAddEmployeeSubmit
}: OwnerDashboardProps) {
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
              Owner Space
            </span>
          </div>

          <div className="nav-section-title">Workspace</div>
          <nav className="nav-links">
            {[
              { key: 'dashboard',    label: 'Main Dashboard',    Icon: LayoutDashboard },
              { key: 'appointments', label: 'Clients Schedule',  Icon: Calendar },
              { key: 'waitlist',     label: 'Walk-In Queue',     Icon: UserCheck },
              { key: 'admin-walkin', label: 'Add Walk-In Guest', Icon: PlusCircle, style: { borderLeft: '3px dashed var(--accent)' } },
              { key: 'employees',    label: 'Employees & Shifts', Icon: Users },
              { key: 'inventory',    label: 'Inventory Items',   Icon: ShoppingBag },
              { key: 'clients',      label: 'Clients Directory', Icon: Users },
              { key: 'services',     label: 'Services Catalog',  Icon: Scissors },
              { key: 'analytics',    label: 'Owner Financials',  Icon: Shield, style: { borderLeft: '3px solid var(--accent)' } },
              { key: 'settings',     label: 'Settings Panel',    Icon: Settings },
            ].map(({ key, label, Icon, style }) => (
              <div
                key={key}
                className={`nav-link ${activeTab === key ? 'active' : ''}`}
                onClick={() => setActiveTab(key)}
                style={style}
              >
                <Icon size={18} />
                {label}
              </div>
            ))}
          </nav>
        </div>

        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '20px', marginTop: '20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div onClick={handleLogout} style={{ color: 'var(--accent)', fontSize: '13.5px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', transition: 'var(--transition)' }}>
              <LogOut size={16} /><span>Sign Out</span>
            </div>
            <div onClick={() => navigateTo('/')} style={{ color: 'var(--text-secondary)', fontSize: '13.5px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', transition: 'var(--transition)' }}>
              <Globe size={16} /><span>Public Website</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <header className="header-row">
          <div>
            <h1 className="page-title" style={{ textTransform: 'capitalize' }}>
              {activeTab.replace('-', ' ')}
            </h1>
          </div>
        </header>

        {activeTab === 'dashboard'    && <DashboardTab stats={stats} waitlist={waitlist} />}
        {activeTab === 'appointments' && <AppointmentsTab navigateTo={navigateTo} />}
        {activeTab === 'waitlist'     && <WaitlistTab waitlist={waitlist} handleUpdateWaitlistStatus={handleUpdateWaitlistStatus} setActiveTab={setActiveTab} />}
        {activeTab === 'admin-walkin' && (
          <AdminWalkinTab
            walkinName={walkinName} setWalkinName={setWalkinName}
            walkinPhone={walkinPhone} setWalkinPhone={setWalkinPhone}
            walkinService={walkinService} setWalkinService={setWalkinService}
            walkinStylist={walkinStylist} setWalkinStylist={setWalkinStylist}
            handleAdminWalkinSubmit={handleAdminWalkinSubmit}
            branches={branches} selectedBranch={selectedBranch}
          />
        )}
        {activeTab === 'employees' && (
          <EmployeesTab
            branches={branches} selectedBranch={selectedBranch} employeeRole={employeeRole}
            isAddEmployeeModalOpen={isAddEmployeeModalOpen} setIsAddEmployeeModalOpen={setIsAddEmployeeModalOpen}
            newEmpName={newEmpName} setNewEmpName={setNewEmpName}
            newEmpUsername={newEmpUsername} setNewEmpUsername={setNewEmpUsername}
            newEmpPassword={newEmpPassword} setNewEmpPassword={setNewEmpPassword}
            newEmpRole={newEmpRole} setNewEmpRole={setNewEmpRole}
            newEmpPhoneNumber={newEmpPhoneNumber} setNewEmpPhoneNumber={setNewEmpPhoneNumber}
            newEmpSpecialty={newEmpSpecialty} setNewEmpSpecialty={setNewEmpSpecialty}
            newEmpError={newEmpError} handleAddEmployeeSubmit={handleAddEmployeeSubmit}
          />
        )}
        {activeTab === 'inventory'  && <InventoryTab />}
        {activeTab === 'clients'    && <ClientsTab />}
        {activeTab === 'services'   && <ServicesTab branches={branches} />}
        {activeTab === 'analytics'  && <FinancialsTab />}
        {activeTab === 'settings'   && <SettingsTab />}
      </main>
    </div>
  );
}
