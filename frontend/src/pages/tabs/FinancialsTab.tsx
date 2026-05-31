import { Shield, TrendingUp, DollarSign, BarChart3 } from 'lucide-react';

export function FinancialsTab() {
  return (
    <div className="glass-panel">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h3 style={{ color: 'var(--accent)', marginTop: 0, fontFamily: 'var(--font-serif)', fontSize: '20px', fontWeight: 600 }}>Financial Ledger & Performance</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>View revenue charts, service commissions, and client payment tallies.</p>
        </div>
        <span className="micro-badge" style={{ backgroundColor: 'var(--accent-glow)', color: 'var(--accent)', border: '1px solid var(--border-color)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>
          Owner Only
        </span>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid-3" style={{ marginBottom: '24px' }}>
        <div className="stat-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '14px', fontWeight: 500 }}>Monthly Revenue</div>
            <div className="stat-value">—</div>
          </div>
          <div style={{ backgroundColor: 'var(--accent-glow)', padding: '12px', borderRadius: '12px', color: 'var(--accent)' }}>
            <DollarSign size={24} />
          </div>
        </div>
        <div className="stat-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '14px', fontWeight: 500 }}>Commissions Paid</div>
            <div className="stat-value">—</div>
          </div>
          <div style={{ backgroundColor: 'var(--accent-glow)', padding: '12px', borderRadius: '12px', color: 'var(--accent)' }}>
            <TrendingUp size={24} />
          </div>
        </div>
        <div className="stat-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '14px', fontWeight: 500 }}>Net Profit</div>
            <div className="stat-value">—</div>
          </div>
          <div style={{ backgroundColor: 'var(--accent-glow)', padding: '12px', borderRadius: '12px', color: 'var(--accent)' }}>
            <BarChart3 size={24} />
          </div>
        </div>
      </div>

      <div className="empty-state-card">
        <div style={{ backgroundColor: 'var(--accent-glow)', padding: '16px', borderRadius: '50%', color: 'var(--accent)', marginBottom: '8px' }}>
          <Shield size={32} />
        </div>
        <div className="empty-state-title">Financial data pending</div>
        <div className="empty-state-desc">Transactions, service sub-totals, taxes, and net business commission metrics will appear in this workspace once bookings are processed.</div>
      </div>
    </div>
  );
}
