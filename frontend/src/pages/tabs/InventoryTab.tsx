import { ShoppingBag } from 'lucide-react';
import { PageHeader, EmptyState } from '../../components/common';

export function InventoryTab() {
  return (
    <div className="glass-panel">
      <PageHeader
        title="Inventory Stock & Adjustments"
        subtitle="Track product stock levels, reorder alerts, and retail item inventory."
      />
      <EmptyState
        icon={<ShoppingBag size={32} />}
        title="No retail items mapped"
        description="Track product levels, reorder levels, and inbound shipment logs in this ledger."
      />
    </div>
  );
}
