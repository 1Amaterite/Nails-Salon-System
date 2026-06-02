import { Scissors } from 'lucide-react';
import type { Service } from '../../types';
import { EmptyState } from '../../components/common';
import { ServiceCard } from './ServiceCard';

interface ServiceGridProps {
  services: Service[];
  isAuthorized: boolean;
  onEdit: (service: Service) => void;
  onDelete: (id: string, name: string) => void;
}

export function ServiceGrid({ services, isAuthorized, onEdit, onDelete }: ServiceGridProps) {
  if (services.length === 0) {
    return (
      <EmptyState
        icon={<Scissors size={32} />}
        title="No service catalogs initialized"
        description="Services configure pricing models and display correctly in our guest portal templates."
      />
    );
  }

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
        gap: '20px',
        marginTop: '20px',
      }}
    >
      {services.map((service) => (
        <ServiceCard
          key={service.id}
          service={service}
          isAuthorized={isAuthorized}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
