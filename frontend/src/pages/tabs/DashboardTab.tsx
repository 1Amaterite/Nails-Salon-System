import { Calendar, UserCheck, Users } from 'lucide-react';
import type { DashboardStats, WaitlistItem } from '../../types';

interface DashboardTabProps {
  stats: DashboardStats;
  waitlist: WaitlistItem[];
}

export function DashboardTab({ stats, waitlist }: DashboardTabProps) {
  return (
    <div>
      <div className="grid-3">
        <div className="stat-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '14px', fontWeight: 500 }}>Today's Bookings</div>
            <div className="stat-value">{stats.appointmentsToday}</div>
          </div>
          <div style={{ backgroundColor: 'var(--accent-glow)', padding: '12px', borderRadius: '12px', color: 'var(--accent)' }}>
            <Calendar size={24} />
          </div>
        </div>
        <div className="stat-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '14px', fontWeight: 500 }}>Walk-In Waitlist</div>
            <div className="stat-value">{waitlist.filter(item => item.status === 'WAITING').length}</div>
          </div>
          <div style={{ backgroundColor: 'var(--accent-glow)', padding: '12px', borderRadius: '12px', color: 'var(--accent)' }}>
            <UserCheck size={24} />
          </div>
        </div>
        <div className="stat-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '14px', fontWeight: 500 }}>Stylists Assigned</div>
            <div className="stat-value">{stats.activeStylists}</div>
          </div>
          <div style={{ backgroundColor: 'var(--accent-glow)', padding: '12px', borderRadius: '12px', color: 'var(--accent)' }}>
            <Users size={24} />
          </div>
        </div>
      </div>

      <div className="glass-panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h3 style={{ color: 'var(--accent)', marginTop: 0, fontFamily: 'var(--font-serif)', fontSize: '20px', fontWeight: 600 }}>Active Walk-In Waiting List</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>Monitor real-time client arrivals in queue.</p>
          </div>
          <span className="status-badge active" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '6px', height: '6px', backgroundColor: 'var(--accent)', borderRadius: '50%', display: 'inline-block' }}></span>
            Live Queue
          </span>
        </div>

        {waitlist.filter(item => item.status !== 'COMPLETED').length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {waitlist.filter(item => item.status !== 'COMPLETED').map(item => (
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
          <div className="empty-state-card">
            <div style={{ backgroundColor: 'var(--accent-glow)', padding: '16px', borderRadius: '50%', color: 'var(--accent)', marginBottom: '8px' }}>
              <UserCheck size={32} />
            </div>
            <div className="empty-state-title">No active walk-in clients</div>
            <div className="empty-state-desc">When guests check-in via the walk-in portal, they will automatically appear here.</div>
          </div>
        )}
      </div>
    </div>
  );
}
