import { Shield, TrendingUp, DollarSign, BarChart3 } from 'lucide-react';
import { PageHeader, StatCard, EmptyState } from '../../components/common';

export function FinancialsTab() {
  return (
    <div className="glass-panel">
      <PageHeader
        title="Financial Ledger & Performance"
        subtitle="View revenue charts, service commissions, and client payment tallies."
        action={
          <span
            className="micro-badge"
            style={{
              backgroundColor: 'var(--accent-glow)',
              color: 'var(--accent)',
              border: '1px solid var(--border-color)',
              fontSize: '10px',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              fontWeight: 600,
            }}
          >
            Owner Only
          </span>
        }
      />

      {/* Summary KPI Cards */}
      <div className="grid-3" style={{ marginBottom: '24px' }}>
        <StatCard label="Monthly Revenue"   value="—" icon={<DollarSign size={24} />} />
        <StatCard label="Commissions Paid"  value="—" icon={<TrendingUp size={24} />} />
        <StatCard label="Net Profit"        value="—" icon={<BarChart3  size={24} />} />
      </div>

      <EmptyState
        icon={<Shield size={32} />}
        title="Financial data pending"
        description="Transactions, service sub-totals, taxes, and net business commission metrics will appear in this workspace once bookings are processed."
      />
    </div>
  );
}
