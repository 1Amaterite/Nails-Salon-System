import { useState, useCallback } from 'react';
import {
  LayoutDashboard,
  Users,
  Scissors,
  Calendar,
  Settings,
  ShoppingBag,
  PlusCircle,
  UserCheck,
  LogOut,
  Globe,
  Clock,
  Shield,
} from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { fetchWithTimeout } from '../utils/api';
import { getApiUrl } from '../utils/getApiUrl';
import { useAuth } from '../context/AuthContext';
import { useBranch } from '../context/BranchContext';

import { DashboardTab } from './tabs/dashboard/DashboardTab';
import { AppointmentsTab } from './tabs/appointments/AppointmentsTab';
import { WaitlistTab } from './tabs/waitlist/WaitlistTab';
import { AdminWalkinTab } from './tabs/waitlist/AdminWalkinTab';
import { EmployeesTab } from './tabs/employees/EmployeesTab';
import { SchedulesTab, UnsavedChangesModal } from './tabs/employees/SchedulesTab';
import { InventoryTab } from './tabs/inventory/InventoryTab';
import { ClientsTab } from './tabs/clients/ClientsTab';
import { ServicesTab } from './tabs/services/ServicesTab';
import { FinancialsTab } from './tabs/financials/FinancialsTab';
import { SettingsTab } from './tabs/settings/SettingsTab';

export function DashboardLayout() {
  const { employeeRole, token, logout, navigateTo, currentPath } = useAuth();
  const { branches, selectedBranch, stats, waitlist, handleUpdateWaitlistStatus, onWalkinSubmit } =
    useBranch();

  const navItems = [
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
    ...(employeeRole === 'OWNER'
      ? [
          {
            key: 'analytics',
            label: 'Owner Financials',
            Icon: Shield,
            style: { borderLeft: '3px solid var(--accent)' },
          },
        ]
      : []),
    { key: 'settings', label: 'Settings Panel', Icon: Settings },
  ];

  const activeTab = (() => {
    const rawTab = currentPath.split('/')[2] || 'dashboard';
    return navItems.some((item) => item.key === rawTab) ? rawTab : 'dashboard';
  })();

  const setActiveTab = useCallback(
    (tab: string) => {
      const prefix = employeeRole === 'OWNER' ? '/owner' : '/admin';
      navigateTo(`${prefix}/${tab}`);
    },
    [employeeRole, navigateTo]
  );

  const [isScheduleDirty, setIsScheduleDirty] = useState(false);
  const [pendingTabKey, setPendingTabKey] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const handlePrefetch = (key: string) => {
    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const API_URL = getApiUrl();

    if (key === 'dashboard') {
      queryClient.prefetchQuery({
        queryKey: ['dashboardStats', selectedBranch],
        queryFn: async () => {
          const res = await fetchWithTimeout(
            `${API_URL}/api/branches/${selectedBranch}/dashboard`,
            {
              headers,
            }
          );
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
              {employeeRole === 'OWNER' ? 'Owner Space' : 'Admin Space'}
            </span>
          </div>

          <div className="nav-section-title">Workspace</div>
          <nav className="nav-links">
            {navItems.map(({ key, label, Icon, style }) => (
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
              onClick={logout}
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
            branches={branches}
            selectedBranch={selectedBranch}
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
            onEmployeeAdded={() => queryClient.invalidateQueries({ queryKey: ['branches'] })}
          />
        )}
        {activeTab === 'schedules' && (
          <SchedulesTab
            branches={branches}
            selectedBranch={selectedBranch}
            onScheduleUpdated={() => queryClient.invalidateQueries({ queryKey: ['branches'] })}
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
        {activeTab === 'analytics' && (
          <FinancialsTab selectedBranch={selectedBranch} employeeRole={employeeRole} />
        )}
        {activeTab === 'settings' && <SettingsTab selectedBranch={selectedBranch} />}
      </main>
    </div>
  );
}
