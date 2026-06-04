import { useState } from 'react';
import {
  LayoutDashboard,
  Users,
  Scissors,
  Calendar,
  Shield,
  Settings,
  ShoppingBag,
  PlusCircle,
  UserCheck,
  LogOut,
  Globe,
  Clock,
} from 'lucide-react';
import type { Branch, WaitlistItem, DashboardStats } from '../types';
import { useQueryClient } from '@tanstack/react-query';
import { fetchWithTimeout } from '../utils/api';

import { DashboardTab } from './tabs/DashboardTab';
import { AppointmentsTab } from './tabs/AppointmentsTab';
import { WaitlistTab } from './tabs/WaitlistTab';
import { AdminWalkinTab } from './tabs/AdminWalkinTab';
import { EmployeesTab } from './tabs/EmployeesTab';
import { SchedulesTab, UnsavedChangesModal } from './tabs/SchedulesTab';
import { InventoryTab } from './tabs/InventoryTab';
import { ClientsTab } from './tabs/ClientsTab';
import { ServicesTab } from './tabs/ServicesTab';
import { FinancialsTab } from './tabs/FinancialsTab';
import { SettingsTab } from './tabs/SettingsTab';

import { getApiUrl } from '../utils/getApiUrl';
const API_URL = getApiUrl();

interface OwnerDashboardProps {
  activeTab: string;
  setActiveTab: (t: string) => void;
  employeeRole: string;
  branches: Branch[];
  selectedBranch: string;
  stats: DashboardStats;
  waitlist: WaitlistItem[];
  handleUpdateWaitlistStatus: (
    id: string,
    newStatus: 'WAITING' | 'IN_PROGRESS' | 'COMPLETED'
  ) => void;
  handleLogout: () => void;
  navigateTo: (path: string) => void;
  isSeeding: boolean;
  handleSeedData: () => void;
  onWalkinSubmit: (entry: {
    firstName: string;
    phone: string;
    serviceId: string;
    employeeId?: string;
  }) => void;
  onEmployeeAdded: () => void;
}

export function OwnerDashboard({
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
  onWalkinSubmit,
  onEmployeeAdded,
}: OwnerDashboardProps) {
  const [isScheduleDirty, setIsScheduleDirty] = useState(false);
  const [pendingTabKey, setPendingTabKey] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const handlePrefetch = (key: string) => {
    const token = sessionStorage.getItem('adminToken') || sessionStorage.getItem('ownerToken');
    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    if (key === 'dashboard') {
      queryClient.prefetchQuery({
        queryKey: ['dashboardStats', selectedBranch, employeeRole],
        queryFn: async () => {
          const res = await fetchWithTimeout(`${API_URL}/api/dashboard/${selectedBranch}`, {
            headers,
          });
          if (!res.ok) throw new Error('Failed to fetch dashboard stats');
          return res.json();
        },
      });
    } else if (key === 'employees' || key === 'schedules') {
      queryClient.prefetchQuery({
        queryKey: ['schedulableStaff', selectedBranch, employeeRole],
        queryFn: async () => {
          const res = await fetchWithTimeout(
            `${API_URL}/api/branches/${selectedBranch}/schedulable-staff`,
            { headers }
          );
          if (!res.ok) throw new Error('Failed to fetch schedulable staff');
          return res.json();
        },
      });
    }
  };

  const handleTabClick = (key: string) => {
    if (isScheduleDirty) {
      setPendingTabKey(key);
    } else {
      setActiveTab(key);
    }
  };

  const handleConfirmDiscard = () => {
    setIsScheduleDirty(false);
    if (pendingTabKey) {
      setActiveTab(pendingTabKey);
    }
    setPendingTabKey(null);
  };

  return (
    <div className="app-container">
      <UnsavedChangesModal
        isOpen={pendingTabKey !== null}
        onConfirm={handleConfirmDiscard}
        onCancel={() => setPendingTabKey(null)}
      />
      {/* Navigation Sidebar */}
      <aside className="sidebar">
        <div>
          <div
            className="brand-title"
            onClick={() => navigateTo('/')}
            style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}
          >
            <Scissors size={24} style={{ transform: 'rotate(-45deg)', color: 'var(--accent)' }} />
            <span
              style={{ fontFamily: 'var(--font-serif)', fontSize: '20px', letterSpacing: '-0.5px' }}
            >
              Nails & Lashes Lane
            </span>
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '24px' }}>
            <span
              className="micro-badge"
              style={{
                backgroundColor: 'var(--accent-glow)',
                color: 'var(--accent)',
                border: '1px solid var(--border-color)',
                fontSize: '10px',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                fontWeight: 600,
              }}
            >
              Owner Space
            </span>
          </div>

          <div className="nav-section-title">Workspace</div>
          <nav className="nav-links">
            {[
              { key: 'dashboard', label: 'Main Dashboard', Icon: LayoutDashboard },
              { key: 'appointments', label: 'Clients Schedule', Icon: Calendar },
              { key: 'waitlist', label: 'Walk-In Queue', Icon: UserCheck },
              {
                key: 'admin-walkin',
                label: 'Add Walk-In Guest',
                Icon: PlusCircle,
                style: { borderLeft: '3px dashed var(--accent)' },
              },
              { key: 'employees', label: 'Staff Directory', Icon: Users },
              { key: 'schedules', label: 'Shift Schedules', Icon: Clock },
              { key: 'inventory', label: 'Inventory Items', Icon: ShoppingBag },
              { key: 'clients', label: 'Clients Directory', Icon: Users, soon: true },
              { key: 'services', label: 'Services Catalog', Icon: Scissors },
              {
                key: 'analytics',
                label: 'Owner Financials',
                Icon: Shield,
                style: { borderLeft: '3px solid var(--accent)' },
              },
              { key: 'settings', label: 'Settings Panel', Icon: Settings, soon: true },
            ].map(({ key, label, Icon, style, soon }) => (
              <div
                key={key}
                className={`nav-link ${activeTab === key ? 'active' : ''}`}
                onClick={() => handleTabClick(key)}
                onMouseEnter={() => handlePrefetch(key)}
                style={style}
              >
                <Icon size={18} />
                {label}
                {soon && (
                  <span
                    style={{
                      marginLeft: 'auto',
                      fontSize: '9px',
                      fontWeight: 700,
                      letterSpacing: '0.05em',
                      textTransform: 'uppercase',
                      color: 'var(--text-secondary)',
                      backgroundColor: 'var(--bg-primary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '4px',
                      padding: '1px 5px',
                    }}
                  >
                    Soon
                  </span>
                )}
              </div>
            ))}
          </nav>
        </div>

        <div
          style={{
            borderTop: '1px solid var(--border-color)',
            paddingTop: '20px',
            marginTop: '20px',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div
              onClick={handleLogout}
              style={{
                color: 'var(--accent)',
                fontSize: '13.5px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                transition: 'var(--transition)',
              }}
            >
              <LogOut size={16} />
              <span>Sign Out</span>
            </div>
            <div
              onClick={() => navigateTo('/')}
              style={{
                color: 'var(--text-secondary)',
                fontSize: '13.5px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                transition: 'var(--transition)',
              }}
            >
              <Globe size={16} />
              <span>Public Website</span>
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

        {activeTab === 'dashboard' && <DashboardTab stats={stats} waitlist={waitlist} />}
        {activeTab === 'appointments' && (
          <AppointmentsTab
            branches={branches}
            selectedBranch={selectedBranch}
            employeeRole={employeeRole}
            navigateTo={navigateTo}
          />
        )}
        {activeTab === 'waitlist' && (
          <WaitlistTab
            waitlist={waitlist}
            handleUpdateWaitlistStatus={handleUpdateWaitlistStatus}
            setActiveTab={setActiveTab}
          />
        )}
        {activeTab === 'admin-walkin' && (
          <AdminWalkinTab
            branches={branches}
            selectedBranch={selectedBranch}
            onWalkinSubmit={onWalkinSubmit}
          />
        )}
        {activeTab === 'employees' && (
          <EmployeesTab
            branches={branches}
            selectedBranch={selectedBranch}
            employeeRole={employeeRole}
            onEmployeeAdded={onEmployeeAdded}
          />
        )}
        {activeTab === 'schedules' && (
          <SchedulesTab
            branches={branches}
            selectedBranch={selectedBranch}
            onScheduleUpdated={onEmployeeAdded}
            setIsDirty={setIsScheduleDirty}
          />
        )}
        {activeTab === 'inventory' && (
          <InventoryTab selectedBranch={selectedBranch} employeeRole={employeeRole} />
        )}
        {activeTab === 'clients' && <ClientsTab />}
        {activeTab === 'services' && (
          <ServicesTab branches={branches} selectedBranch={selectedBranch} role={employeeRole} />
        )}
        {activeTab === 'analytics' && <FinancialsTab />}
        {activeTab === 'settings' && <SettingsTab />}
      </main>
    </div>
  );
}
