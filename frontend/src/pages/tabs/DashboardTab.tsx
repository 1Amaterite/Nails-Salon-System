import { Calendar, UserCheck, Users, Cake } from 'lucide-react';
import type { DashboardStats, WaitlistItem } from '../../types';
import { PageHeader, StatCard, EmptyState } from '../../components/common';

interface DashboardTabProps {
  stats: DashboardStats;
  waitlist: WaitlistItem[];
}

export function DashboardTab({ stats, waitlist }: DashboardTabProps) {
  const activeQueue = waitlist.filter((item) => item.status !== 'COMPLETED');
  const celebrants = stats.birthdayCelebrants || [];

  return (
    <div>
      {celebrants.length > 0 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            padding: '16px 24px',
            borderRadius: '12px',
            backgroundColor: 'rgba(209, 71, 119, 0.05)',
            border: '1px dashed var(--accent)',
            marginBottom: '28px',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: 'var(--accent-glow)',
              color: 'var(--accent)',
            }}
          >
            <Cake size={20} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--accent)' }}>
              Today's Birthday Celebrants! 🎂
            </div>
            <div style={{ fontSize: '13.5px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Happy Birthday to:{' '}
              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                {celebrants.join(', ')}
              </span>
              . Be sure to offer them their loyalty bonus or discount!
            </div>
          </div>
        </div>
      )}
      <div className="grid-3">
        <StatCard
          label="Today's Bookings"
          value={stats.appointmentsToday}
          icon={<Calendar size={24} />}
        />
        <StatCard
          label="Walk-In Waitlist"
          value={waitlist.filter((item) => item.status === 'WAITING').length}
          icon={<UserCheck size={24} />}
        />
        <StatCard
          label="Stylists Assigned"
          value={stats.activeStylists}
          icon={<Users size={24} />}
        />
      </div>

      <div className="glass-panel">
        <PageHeader
          title="Active Walk-In Waiting List"
          subtitle="Monitor real-time client arrivals in queue."
          action={
            <span
              className="status-badge active"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
            >
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  backgroundColor: 'var(--accent)',
                  borderRadius: '50%',
                  display: 'inline-block',
                }}
              />
              Live Queue
            </span>
          }
        />

        {activeQueue.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {activeQueue.map((item) => (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-secondary)',
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)' }}>
                    {item.firstName}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    {item.service}
                  </div>
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
