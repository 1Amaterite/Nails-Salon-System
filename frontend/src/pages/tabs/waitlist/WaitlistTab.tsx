import { useState } from 'react';
import { UserCheck, Plus, RefreshCw } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { WaitlistItem, Branch, Appointment } from '../../../types';
import { PageHeader, EmptyState } from '../../../components/common';
import { useNotification } from '../../../context/NotificationContext';
import { fetchWithTimeout } from '../../../utils/api';
import { getApiUrl, getAuthToken } from '../../../utils/getApiUrl';
import { CheckoutModal } from '../appointments/CheckoutModal';

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
  const { showToast } = useNotification();
  const queryClient = useQueryClient();

  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutAppt, setCheckoutAppt] = useState<Appointment | null>(null);
  const [isLoadingAppt, setIsLoadingAppt] = useState(false);

  const API_URL = getApiUrl();

  // Checkout Mutation
  const checkoutMutation = useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: string;
      payload: {
        paymentMethod: 'CASH' | 'CARD' | 'GCASH';
        discountAmount: number;
        employeeId?: string | null;
      };
    }) => {
      const token = getAuthToken();
      const res = await fetchWithTimeout(`${API_URL}/api/appointments/${id}/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to process checkout.');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['waitlist', selectedBranch] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats', selectedBranch] });
      queryClient.invalidateQueries({ queryKey: ['financials', selectedBranch] });
      showToast('Checkout completed and transaction recorded successfully.', 'success');
      setIsCheckoutOpen(false);
      setCheckoutAppt(null);
    },
    onError: (err: Error) => {
      showToast(err.message, 'error');
    },
  });

  const handleCheckoutSubmit = (payload: {
    paymentMethod: 'CASH' | 'CARD' | 'GCASH';
    discountAmount: number;
    employeeId?: string | null;
  }) => {
    if (!checkoutAppt) return;
    checkoutMutation.mutate({ id: checkoutAppt.id, payload });
  };

  const handleCompleteClick = async (itemId: string) => {
    setIsLoadingAppt(true);
    try {
      const token = getAuthToken();
      const res = await fetchWithTimeout(`${API_URL}/api/appointments/${itemId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to retrieve waitlist details.');
      const data = await res.json();
      setCheckoutAppt(data);
      setIsCheckoutOpen(true);
    } catch (err) {
      const error = err as Error;
      showToast(error.message || 'Error occurred while loading checkout details.', 'error');
    } finally {
      setIsLoadingAppt(false);
    }
  };

  const activeItems = waitlist.filter((item) => item.status !== 'COMPLETED');

  return (
    <div className="glass-panel">
      <PageHeader
        title="Walk-In Queue (Live Waitlist)"
        subtitle="Real-time check-ins waiting for the next available stylist."
        action={
          <button
            className="btn-secondary"
            onClick={() => setActiveTab('admin-walkin')}
            style={{
              padding: '8px 16px',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Plus size={16} /> Register Walk-In Guest
          </button>
        }
      />

      {activeItems.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {activeItems.map((item) => (
            <div key={item.id} className="schedule-item">
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontWeight: 600, fontSize: '15px', color: 'var(--text-primary)' }}>
                    {item.firstName}
                  </span>
                  {item.status === 'IN_PROGRESS' && (
                    <span
                      className="status-badge active"
                      style={{ fontSize: '9px', padding: '2px 8px' }}
                    >
                      Serving
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  {item.service} &bull; Preferring{' '}
                  <span style={{ fontWeight: 500, color: 'var(--accent)' }}>{item.stylist}</span>
                </div>
                <div
                  style={{
                    fontSize: '12.5px',
                    color: 'var(--text-secondary)',
                    marginTop: '8px',
                    display: 'flex',
                    gap: '12px',
                  }}
                >
                  <span>Arrival: {item.checkInTime}</span>
                  <span>Phone: {item.phone}</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                {item.status === 'WAITING' && (
                  <button
                    className="btn-primary"
                    style={{
                      padding: '6px 12px',
                      fontSize: '12px',
                      backgroundColor: 'var(--accent-blue)',
                    }}
                    onClick={() => handleUpdateWaitlistStatus(item.id, 'IN_PROGRESS')}
                  >
                    Start Session
                  </button>
                )}
                {item.status === 'IN_PROGRESS' && (
                  <button
                    className="btn-primary"
                    disabled={isLoadingAppt}
                    style={{
                      padding: '6px 12px',
                      fontSize: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                    onClick={() => handleCompleteClick(item.id)}
                  >
                    {isLoadingAppt && <RefreshCw size={12} className="spin" />}
                    Mark Done
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
        onClose={() => {
          setIsCheckoutOpen(false);
          setCheckoutAppt(null);
        }}
        onSubmit={handleCheckoutSubmit}
        appointment={checkoutAppt}
        employees={branches.find((b) => b.id === selectedBranch)?.employees || []}
        isPending={checkoutMutation.isPending}
      />
    </div>
  );
}
