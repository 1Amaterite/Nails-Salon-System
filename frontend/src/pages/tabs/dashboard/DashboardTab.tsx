import { Calendar, UserCheck, Users, Cake } from 'lucide-react';
import type { DashboardStats, WaitlistItem } from '../../../types';
import { PageHeader, StatCard, EmptyState } from '../../../components/common';

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
        <div className="dashboard-celebrants-banner">
          <div className="dashboard-celebrants-icon-wrapper">
            <Cake size={20} />
          </div>
          <div>
            <div className="dashboard-celebrants-title">Today's Birthday Celebrants! 🎂</div>
            <div className="dashboard-celebrants-names">
              Happy Birthday to:{' '}
              <span className="dashboard-celebrants-name-bold">{celebrants.join(', ')}</span>. Be
              sure to offer them their loyalty bonus or discount!
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
            <span className="status-badge active live-status-badge">
              <span className="live-status-dot" />
              Live Queue
            </span>
          }
        />

        {activeQueue.length > 0 ? (
          <div className="waitlist-items-container">
            {activeQueue.map((item) => (
              <div key={item.id} className="waitlist-item-row">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {item.queueNumber && (
                    <span
                      className="micro-badge"
                      style={{
                        backgroundColor: 'rgba(59, 130, 246, 0.08)',
                        color: 'var(--accent-blue)',
                        fontWeight: 'bold',
                        fontSize: '9px',
                        padding: '1px 5px',
                        borderColor: 'rgba(59, 130, 246, 0.15)',
                        height: 'fit-content',
                      }}
                    >
                      {item.queueNumber}
                    </span>
                  )}
                  <div>
                    <div className="waitlist-item-name">
                      {item.firstName} {item.lastName}
                    </div>
                    <div className="waitlist-item-service">{item.service}</div>
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
