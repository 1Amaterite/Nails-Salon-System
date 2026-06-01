import { Users } from 'lucide-react';
import { PageHeader, EmptyState } from '../../components/common';

export function ClientsTab() {
  return (
    <div className="glass-panel">
      <PageHeader
        title="Client Directory & History"
        subtitle="Browse registered loyalty program members and past salon visits."
      />
      <EmptyState
        icon={<Users size={32} />}
        title="Directory is empty"
        description="Customer profiles, check-in loyalty points, and notes will sync here automatically."
      />
    </div>
  );
}
