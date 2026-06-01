import { Calendar, UserCheck, Users } from 'lucide-react';
import type { DashboardStats, WaitlistItem } from '../../types';
import { PageHeader, StatCard, EmptyState } from '../../components/common';

interface DashboardTabProps {
  stats: DashboardStats;
  waitlist: WaitlistItem[];
}

export function DashboardTab({ stats, waitlist }: DashboardTabProps) {
  const activeQueue = waitlist.filter(item => item.status !== 'COMPLETED');

  return (
    <div>
      <div className="grid-3">
        <StatCard label="Today's Bookings" value={stats.appointmentsToday} icon={<Calendar size={24} />} />
        <StatCard label="Walk-In Waitlist" value={waitlist.filter(item => item.status === 'WAITING').length} icon={<UserCheck size={24} />} />
        <StatCard label="Stylists Assigned" value={stats.activeStylists} icon={<Users size={24} />} />
      </div>

      <div className="glass-panel">
        <PageHeader
          title="Active Walk-In Waiting List"
          subtitle="Monitor real-time client arrivals in queue."
          action={
            <span className="status-badge active" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '6px', height: '6px', backgroundColor: 'var(--accent)', borderRadius: '50%', display: 'inline-block' }} />
              Live Queue
            </span>
          }
        />

        {activeQueue.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {activeQueue.map(item => (
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
          <EmptyState
            icon={<UserCheck size={32} />}
            title="No active walk-in clients"
            description="When guests check-in via the walk-in portal, they will automatically appear here."
          />
        )}
      </div>
    </div>
  );
}
