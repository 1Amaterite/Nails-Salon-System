import { UserCheck, Plus } from 'lucide-react';
import type { WaitlistItem } from '../../types';
import { PageHeader, EmptyState } from '../../components/common';

interface WaitlistTabProps {
  waitlist: WaitlistItem[];
  handleUpdateWaitlistStatus: (id: string, newStatus: 'WAITING' | 'IN_PROGRESS' | 'COMPLETED') => void;
  setActiveTab: (tab: string) => void;
}

export function WaitlistTab({ waitlist, handleUpdateWaitlistStatus, setActiveTab }: WaitlistTabProps) {
  const activeItems = waitlist.filter(item => item.status !== 'COMPLETED');

  return (
    <div className="glass-panel">
      <PageHeader
        title="Walk-In Queue (Live Waitlist)"
        subtitle="Real-time check-ins waiting for the next available stylist."
        action={
          <button className="btn-secondary" onClick={() => setActiveTab('admin-walkin')} style={{ padding: '8px 16px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Plus size={16} /> Register Walk-In Guest
          </button>
        }
      />

      {activeItems.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {activeItems.map(item => (
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
                    style={{ padding: '6px 12px', fontSize: '12px', backgroundColor: 'var(--accent-blue)' }}
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
        <EmptyState
          icon={<UserCheck size={32} />}
          title="No active walk-in clients"
          description="When guests check-in via the walk-in portal, they will automatically appear here."
        />
      )}
    </div>
  );
}
