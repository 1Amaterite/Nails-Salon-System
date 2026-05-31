import { Settings } from 'lucide-react';

export function SettingsTab() {
  return (
    <div className="glass-panel">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h3 style={{ color: 'var(--accent)', marginTop: 0, fontFamily: 'var(--font-serif)', fontSize: '20px', fontWeight: 600 }}>System Settings Panel</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>Configure loyalty points ratios, tax rates, and basic brand descriptors.</p>
        </div>
      </div>
      <div className="empty-state-card">
        <div style={{ backgroundColor: 'var(--accent-glow)', padding: '16px', borderRadius: '50%', color: 'var(--accent)', marginBottom: '8px' }}>
          <Settings size={32} />
        </div>
        <div className="empty-state-title">Configurations locked</div>
        <div className="empty-state-desc">Loyalty point earn-ratios and global branch parameters are managed under this workspace.</div>
      </div>
    </div>
  );
}
