import { UserCheck, Plus } from 'lucide-react';
import type { WaitlistItem, Branch } from '../../../types';
import { PageHeader, EmptyState, LoadingSpinner } from '../../../components/common';
import { CheckoutModal } from '../appointments/CheckoutModal';
import { useCheckout } from '../../../hooks/useCheckout';
import { useBranch } from '../../../context/BranchContext';

interface WaitlistTabProps {
  waitlist: WaitlistItem[];
  handleUpdateWaitlistStatus: (
    id: string,
    newStatus: 'WAITING' | 'IN_PROGRESS' | 'COMPLETED'
  ) => void;
  setActiveTab: (tab: string) => void;
  branches: Branch[];
  selectedBranch: string;
}

export function WaitlistTab({
  waitlist,
  handleUpdateWaitlistStatus,
  setActiveTab,
  branches,
  selectedBranch,
}: WaitlistTabProps) {
  const {
    isCheckoutOpen,
    checkoutAppt,
    isLoadingAppt,
    isPending,
    openCheckoutById,
    closeCheckout,
    submitCheckout,
  } = useCheckout(selectedBranch);
  const { isUpdatingWaitlistStatus, updatingWaitlistId } = useBranch();

  const activeItems = waitlist.filter((item) => item.status !== 'COMPLETED');

  return (
    <div className="glass-panel">
      <PageHeader
        title="Walk-In Queue (Live Waitlist)"
        subtitle="Real-time check-ins waiting for the next available stylist."
        action={
          <button
            className="btn-secondary btn-action-medium"
            onClick={() => setActiveTab('admin-walkin')}
          >
            <Plus size={16} /> Register Walk-In Guest
          </button>
        }
      />

      {activeItems.length > 0 ? (
        <div className="waitlist-items-container">
          {activeItems.map((item) => (
            <div key={item.id} className="schedule-item">
              <div>
                <div className="waitlist-item-header">
                  <span className="waitlist-item-name">{item.firstName}</span>
                  {item.status === 'IN_PROGRESS' && (
                    <span
                      className="status-badge active"
                      style={{ fontSize: '9px', padding: '2px 8px' }}
                    >
                      Serving
                    </span>
                  )}
                </div>
                <div className="waitlist-item-service-info">
                  {item.service} &bull; Preferring{' '}
                  <span className="waitlist-item-service-stylist">{item.stylist}</span>
                </div>
                <div className="waitlist-item-meta">
                  <span>Arrival: {item.checkInTime}</span>
                  <span>Phone: {item.phone}</span>
                </div>
              </div>

              <div className="flex-align-center" style={{ gap: '8px' }}>
                {item.status === 'WAITING' && (
                  <button
                    className="btn-primary btn-action-blue"
                    disabled={isUpdatingWaitlistStatus && updatingWaitlistId === item.id}
                    onClick={() => handleUpdateWaitlistStatus(item.id, 'IN_PROGRESS')}
                  >
                    {isUpdatingWaitlistStatus && updatingWaitlistId === item.id ? (
                      <LoadingSpinner size="sm" color="#fff" />
                    ) : (
                      'Start Session'
                    )}
                  </button>
                )}
                {item.status === 'IN_PROGRESS' && (
                  <button
                    className="btn-primary btn-action-done"
                    disabled={isLoadingAppt}
                    onClick={() => openCheckoutById(item.id)}
                  >
                    {isLoadingAppt ? <LoadingSpinner size="sm" color="#fff" /> : 'Mark Done'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<UserCheck size={32} />}
          title="No active walk-in clients"
          description="When guests check-in via the walk-in portal, they will automatically appear here."
        />
      )}

      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={closeCheckout}
        onSubmit={submitCheckout}
        appointment={checkoutAppt}
        employees={branches.find((b) => b.id === selectedBranch)?.employees || []}
        isPending={isPending}
      />
    </div>
  );
}
