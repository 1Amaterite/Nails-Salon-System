import { ShoppingBag } from 'lucide-react';

export function InventoryTab() {
  return (
    <div className="glass-panel">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h3 style={{ color: 'var(--accent)', marginTop: 0, fontFamily: 'var(--font-serif)', fontSize: '20px', fontWeight: 600 }}>Inventory Stock & Adjustments</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>Track product stock levels, reorder alerts, and retail item inventory.</p>
        </div>
      </div>
      <div className="empty-state-card">
        <div style={{ backgroundColor: 'var(--accent-glow)', padding: '16px', borderRadius: '50%', color: 'var(--accent)', marginBottom: '8px' }}>
          <ShoppingBag size={32} />
        </div>
        <div className="empty-state-title">No retail items mapped</div>
        <div className="empty-state-desc">Track product levels, reorder levels, and inbound shipment logs in this ledger.</div>
      </div>
    </div>
  );
}
