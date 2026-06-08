import { Edit2, Trash2 } from 'lucide-react';
import type { Service } from '../../../types';
import { formatCurrency } from '../../../utils/currency';

interface ServiceCardProps {
  service: Service;
  isAuthorized: boolean;
  onEdit: (service: Service) => void;
  onDelete: (id: string, name: string) => void;
}

export function ServiceCard({ service, isAuthorized, onEdit, onDelete }: ServiceCardProps) {
  return (
    <div className="data-card" style={{ padding: '24px' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '12px',
        }}
      >
        <div style={{ maxWidth: '70%' }}>
          <h4
            style={{
              fontWeight: 600,
              fontSize: '16px',
              color: 'var(--text-primary)',
              margin: 0,
            }}
          >
            {service.name}
          </h4>
          {service.description && (
            <p
              style={{
                fontSize: '12px',
                color: 'var(--text-secondary)',
                marginTop: '4px',
                marginRight: 0,
                marginBottom: 0,
                lineHeight: '1.4',
              }}
            >
              {service.description}
            </p>
          )}
        </div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            gap: '8px',
          }}
        >
          <span
            style={{
              fontSize: '18px',
              fontWeight: 700,
              color: 'var(--accent)',
              fontFamily: 'var(--font-serif)',
            }}
          >
            {formatCurrency(service.price)}
          </span>
          {isAuthorized && (
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                title="Edit Service"
                onClick={() => onEdit(service)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '2px',
                  color: 'var(--text-secondary)',
                  transition: 'color 0.2s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--accent)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
              >
                <Edit2 size={13} />
              </button>
              <button
                title="Delete Service"
                onClick={() => onDelete(service.id, service.name)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '2px',
                  color: 'var(--text-secondary)',
                  transition: 'color 0.2s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#dc2626')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
              >
                <Trash2 size={13} />
              </button>
            </div>
          )}
        </div>
      </div>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <span className="micro-badge" style={{ fontSize: '9px', padding: '4px 10px' }}>
          {service.category || 'Nails'}
        </span>
        <span
          className="micro-badge"
          style={{
            fontSize: '9px',
            padding: '4px 10px',
            backgroundColor: 'rgba(190, 24, 93, 0.04)',
            color: 'var(--text-secondary)',
          }}
        >
          {service.durationMinutes} mins
        </span>
        {service.bufferTime > 0 && (
          <span
            className="micro-badge"
            style={{
              fontSize: '9px',
              padding: '4px 10px',
              backgroundColor: 'rgba(59, 130, 246, 0.04)',
              color: 'var(--text-secondary)',
            }}
          >
            +{service.bufferTime}m buffer
          </span>
        )}
      </div>
    </div>
  );
}
