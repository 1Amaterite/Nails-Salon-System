import { Calendar, Plus } from 'lucide-react';
import { PageHeader, EmptyState } from '../../components/common';

interface AppointmentsTabProps {
  navigateTo: (path: string) => void;
}

export function AppointmentsTab({ navigateTo }: AppointmentsTabProps) {
  return (
    <div className="glass-panel">
      <PageHeader
        title="Clients Booked Ledger"
        subtitle="All scheduled client reservations for this branch."
        action={
          <button className="btn-primary" onClick={() => navigateTo('/')} style={{ padding: '8px 16px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Plus size={16} /> Book New Slot
          </button>
        }
      />
      <EmptyState
        icon={<Calendar size={32} />}
        title="No appointments registered"
        description="Use the public booking page to schedule client slots and view details here."
      />
    </div>
  );
}
