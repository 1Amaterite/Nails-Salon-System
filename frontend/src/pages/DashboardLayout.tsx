import { useState, useCallback, lazy, Suspense } from 'react';
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
  BookOpen,
} from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { useBranch } from '../context/BranchContext';
import { apiClient } from '../utils/apiClient';
import { ErrorBoundary, TabSkeleton, UnsavedChangesModal } from '../components/common';

// Dynamic lazy loaded tabs for bundle splitting and faster initial load
const DashboardTab = lazy(() =>
  import('./tabs/dashboard/DashboardTab').then((m) => ({ default: m.DashboardTab }))
);
const CalendarTab = lazy(() =>
  import('./tabs/appointments/CalendarTab').then((m) => ({ default: m.CalendarTab }))
);
const AppointmentsTab = lazy(() =>
  import('./tabs/appointments/AppointmentsTab').then((m) => ({ default: m.AppointmentsTab }))
);
const WaitlistTab = lazy(() =>
  import('./tabs/waitlist/WaitlistTab').then((m) => ({ default: m.WaitlistTab }))
);
const AdminWalkinTab = lazy(() =>
  import('./tabs/waitlist/AdminWalkinTab').then((m) => ({ default: m.AdminWalkinTab }))
);
const EmployeesTab = lazy(() =>
  import('./tabs/employees/EmployeesTab').then((m) => ({ default: m.EmployeesTab }))
);
const SchedulesTab = lazy(() =>
  import('./tabs/employees/SchedulesTab').then((m) => ({ default: m.SchedulesTab }))
);
const InventoryTab = lazy(() =>
  import('./tabs/inventory/InventoryTab').then((m) => ({ default: m.InventoryTab }))
);
const ClientsTab = lazy(() =>
  import('./tabs/clients/ClientsTab').then((m) => ({ default: m.ClientsTab }))
);
const ServicesTab = lazy(() =>
  import('./tabs/services/ServicesTab').then((m) => ({ default: m.ServicesTab }))
);
const FinancialsTab = lazy(() =>
  import('./tabs/financials/FinancialsTab').then((m) => ({ default: m.FinancialsTab }))
);
const SettingsTab = lazy(() =>
  import('./tabs/settings/SettingsTab').then((m) => ({ default: m.SettingsTab }))
);

export function DashboardLayout() {
  const { employeeRole, logout, navigateTo, currentPath } = useAuth();
  const {
    branches,
    selectedBranch,
    setSelectedBranch,
    stats,
    waitlist,
    handleUpdateWaitlistStatus,
    onWalkinSubmit,
  } = useBranch();

  const navItems = [
    { key: 'dashboard', label: 'Main Dashboard', Icon: LayoutDashboard },
    { key: 'calendar', label: 'Unified Calendar', Icon: Calendar },
    { key: 'appointments', label: 'Bookings Ledger', Icon: BookOpen },
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
    if (key === 'dashboard') {
      queryClient.prefetchQuery({
        queryKey: ['dashboardStats', selectedBranch],
        queryFn: () => apiClient.get(`/api/branches/${selectedBranch}/dashboard`),
      });
    } else if (key === 'employees' || key === 'schedules') {
      queryClient.prefetchQuery({
        queryKey: ['schedulableStaff', selectedBranch, employeeRole],
        queryFn: () => apiClient.get(`/api/branches/${selectedBranch}/schedulable-staff`),
      });
    } else if (key === 'calendar') {
      queryClient.prefetchQuery({
        queryKey: ['appointments', selectedBranch],
        queryFn: () => apiClient.get(`/api/branches/${selectedBranch}/appointments`),
      });
      queryClient.prefetchQuery({
        queryKey: ['waitlist', selectedBranch],
        queryFn: () => apiClient.get(`/api/branches/${selectedBranch}/waitlist`),
      });
      queryClient.prefetchQuery({
        queryKey: ['schedulableStaff', selectedBranch],
        queryFn: () => apiClient.get(`/api/branches/${selectedBranch}/schedulable-staff`),
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

          {/* Branch Switcher */}
          {branches.length > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', zIndex: 50 }}>
              <span style={{ fontSize: '13.5px', color: 'var(--text-secondary)', fontWeight: 500 }}>
                Active Branch:
              </span>
              {employeeRole === 'OWNER' ? (
                <select
                  value={selectedBranch}
                  onChange={(e) => setSelectedBranch(e.target.value)}
                  style={{
                    padding: '6px 36px 6px 12px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'white',
                    color: 'var(--text-primary)',
                    fontSize: '13.5px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    width: 'auto',
                    boxShadow: 'var(--shadow-sm)',
                  }}
                >
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              ) : (
                <span className="branch-static-badge">
                  {branches.find((b) => b.id === selectedBranch)?.name || 'N/A'}
                </span>
              )}
            </div>
          )}
        </header>

        <ErrorBoundary>
          <Suspense fallback={<TabSkeleton />}>
            {activeTab === 'dashboard' && <DashboardTab stats={stats} waitlist={waitlist} />}
            {activeTab === 'calendar' && (
              <CalendarTab
                branches={branches}
                selectedBranch={selectedBranch}
                employeeRole={employeeRole}
                navigateTo={navigateTo}
              />
            )}
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
              <ServicesTab
                branches={branches}
                selectedBranch={selectedBranch}
                role={employeeRole}
              />
            )}
            {activeTab === 'analytics' && (
              <FinancialsTab selectedBranch={selectedBranch} employeeRole={employeeRole} />
            )}
            {activeTab === 'settings' && <SettingsTab selectedBranch={selectedBranch} />}
          </Suspense>
        </ErrorBoundary>
      </main>
    </div>
  );
}
