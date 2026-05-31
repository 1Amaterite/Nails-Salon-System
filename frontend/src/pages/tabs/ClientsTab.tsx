import { Users } from 'lucide-react';

export function ClientsTab() {
  return (
    <div className="glass-panel">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h3 style={{ color: 'var(--accent)', marginTop: 0, fontFamily: 'var(--font-serif)', fontSize: '20px', fontWeight: 600 }}>Client Directory & History</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>Browse registered loyalty program members and past salon visits.</p>
        </div>
      </div>
      <div className="empty-state-card">
        <div style={{ backgroundColor: 'var(--accent-glow)', padding: '16px', borderRadius: '50%', color: 'var(--accent)', marginBottom: '8px' }}>
          <Users size={32} />
        </div>
        <div className="empty-state-title">Directory is empty</div>
        <div className="empty-state-desc">Customer profiles, check-in loyalty points, and notes will sync here automatically.</div>
      </div>
    </div>
  );
}
