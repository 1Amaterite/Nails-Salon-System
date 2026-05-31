import { Calendar, Plus } from 'lucide-react';

interface AppointmentsTabProps {
  navigateTo: (path: string) => void;
}

export function AppointmentsTab({ navigateTo }: AppointmentsTabProps) {
  return (
    <div className="glass-panel">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h3 style={{ color: 'var(--accent)', marginTop: 0, fontFamily: 'var(--font-serif)', fontSize: '20px', fontWeight: 600 }}>Clients Booked Ledger</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>All scheduled client reservations for this branch.</p>
        </div>
        <button className="btn-primary" onClick={() => navigateTo('/')} style={{ padding: '8px 16px', fontSize: '13px' }}>
          <Plus size={16} /> Book New Slot
        </button>
      </div>
      <div className="empty-state-card">
        <div style={{ backgroundColor: 'var(--accent-glow)', padding: '16px', borderRadius: '50%', color: 'var(--accent)', marginBottom: '8px' }}>
          <Calendar size={32} />
        </div>
        <div className="empty-state-title">No appointments registered</div>
        <div className="empty-state-desc">Use the public booking page to schedule client slots and view details here.</div>
      </div>
    </div>
  );
}
