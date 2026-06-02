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
import { SchedulesTab } from './tabs/SchedulesTab';
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
    service: string;
    stylist: string;
  }) => void;
  onEmployeeAdded: () => void;
}

export function UnsavedChangesModal({
  isOpen,
  onConfirm,
  onCancel,
}: {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!isOpen) return null;
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(255, 244, 246, 0.4)',
        backdropFilter: 'blur(12px) saturate(160%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
        padding: '20px',
      }}
    >
      <div
        className="outer-bezel"
        style={{
          maxWidth: '400px',
          width: '100%',
          animation: 'modalFadeIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        }}
      >
        <div className="inner-core" style={{ padding: '28px', textAlign: 'center' }}>
          <h3
            style={{
              fontFamily: 'var(--font-serif)',
              color: 'var(--accent)',
              fontSize: '20px',
              fontWeight: 600,
              margin: '0 0 12px 0',
            }}
          >
            Unsaved Changes
          </h3>
          <p
            style={{
              color: 'var(--text-secondary)',
              fontSize: '13.5px',
              lineHeight: '1.5',
              margin: '0 0 24px 0',
            }}
          >
            You have unsaved changes. If you leave this page, your edits to the schedule will be
            lost. Are you sure you want to discard them?
          </p>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button
              type="button"
              className="btn-primary"
              onClick={onCancel}
              style={{
                background: 'transparent',
                border: '1px solid var(--border-color)',
                color: 'var(--text-secondary)',
                boxShadow: 'none',
                padding: '8px 16px',
                fontSize: '13px',
              }}
            >
              Keep Editing
            </button>
            <button
              type="button"
              className="btn-primary"
              onClick={onConfirm}
              style={{
                backgroundColor: 'var(--accent)',
                color: 'white',
                padding: '8px 16px',
                fontSize: '13px',
              }}
            >
              Discard Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
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
            `${API_URL}/api/branches/${selectedBranch}/schedulable-staff`
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
              { key: 'clients', label: 'Clients Directory', Icon: Users },
              { key: 'services', label: 'Services Catalog', Icon: Scissors },
              {
                key: 'analytics',
                label: 'Owner Financials',
                Icon: Shield,
                style: { borderLeft: '3px solid var(--accent)' },
              },
              { key: 'settings', label: 'Settings Panel', Icon: Settings },
            ].map(({ key, label, Icon, style }) => (
              <div
                key={key}
                className={`nav-link ${activeTab === key ? 'active' : ''}`}
                onClick={() => handleTabClick(key)}
                onMouseEnter={() => handlePrefetch(key)}
                style={style}
              >
                <Icon size={18} />
                {label}
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
        {activeTab === 'appointments' && <AppointmentsTab navigateTo={navigateTo} />}
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
        {activeTab === 'services' && <ServicesTab branches={branches} role={employeeRole} />}
        {activeTab === 'analytics' && <FinancialsTab />}
        {activeTab === 'settings' && <SettingsTab />}
      </main>
    </div>
  );
}
