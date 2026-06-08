import { Edit2, Trash2, Cake, Users } from 'lucide-react';
import { DataTable, EmptyState } from '../../../components/common';
import type { ColumnDef } from '../../../components/common';
import type { Client } from '../../../types';
import { parseClientNotes } from '../../../utils/notes';
import { formatManilaDate } from '../../../utils/time';

interface ClientTableProps {
  clients: Client[];
  isLoading: boolean;
  onViewHistory: (id: string) => void;
  onEdit: (client: Client) => void;
  onDelete: (id: string, name: string) => void;
}

export function ClientTable({
  clients,
  isLoading,
  onViewHistory,
  onEdit,
  onDelete,
}: ClientTableProps) {
  const columns: ColumnDef<Client>[] = [
    {
      key: 'name',
      header: 'Client Name',
      render: (client) => (
        <div>
          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
            {client.firstName} {client.lastName}
          </span>
        </div>
      ),
    },
    {
      key: 'phone',
      header: 'Phone Number',
      render: (client) => (
        <span style={{ fontSize: '13.5px', color: 'var(--text-secondary)' }}>
          {client.phoneNumber || 'N/A'}
        </span>
      ),
    },
    {
      key: 'loyaltyPoints',
      header: 'Loyalty Points',
      render: (client) => (
        <span className="micro-badge" style={{ padding: '4px 10px', fontSize: '9px' }}>
          {client.loyaltyPoints} Points
        </span>
      ),
    },
    {
      key: 'birthday',
      header: 'Birthday',
      render: (client) => {
        if (!client.birthday) return <span style={{ color: 'var(--text-secondary)' }}>—</span>;
        const bFormatted = formatManilaDate(client.birthday, {
          month: 'long',
          day: 'numeric',
        });
        return (
          <span
            style={{
              fontSize: '13.5px',
              color: 'var(--text-primary)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Cake size={13} style={{ color: 'var(--accent)' }} />
            {bFormatted}
          </span>
        );
      },
    },
    {
      key: 'notes',
      header: 'Safety Alerts & Notes',
      render: (client) => {
        const parsed = parseClientNotes(client.notes);
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxWidth: '300px' }}>
            {parsed.safety && (
              <span
                style={{
                  fontSize: '11px',
                  color: '#dc2626',
                  backgroundColor: 'rgba(220, 38, 38, 0.05)',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  border: '1px solid rgba(220, 38, 38, 0.1)',
                  width: 'fit-content',
                  fontWeight: 500,
                }}
              >
                ⚠️ {parsed.safety}
              </span>
            )}
            {parsed.preferences && (
              <span
                style={{
                  fontSize: '11px',
                  color: 'var(--accent-blue)',
                  backgroundColor: 'var(--accent-blue-glow)',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  border: '1px solid rgba(37, 99, 235, 0.1)',
                  width: 'fit-content',
                  fontWeight: 500,
                }}
              >
                💇 {parsed.preferences}
              </span>
            )}
            {!parsed.safety && !parsed.preferences && !parsed.general && (
              <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>—</span>
            )}
          </div>
        );
      },
    },
    {
      key: 'actions',
      header: '',
      style: { width: '150px', textAlign: 'right' },
      render: (client) => (
        <div
          style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center' }}
        >
          <button
            title="View Booking History"
            className="btn-primary"
            onClick={() => onViewHistory(client.id)}
            style={{
              padding: '6px 12px',
              fontSize: '11.5px',
              backgroundColor: 'transparent',
              border: '1px solid var(--border-color-hover)',
              color: 'var(--text-secondary)',
              boxShadow: 'none',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--accent-blue)';
              e.currentTarget.style.backgroundColor = 'var(--accent-blue-glow)';
              e.currentTarget.style.borderColor = 'var(--accent-blue)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--text-secondary)';
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.borderColor = 'var(--border-color-hover)';
            }}
          >
            History
          </button>
          <button
            title="Edit Client"
            onClick={() => onEdit(client)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
              color: 'var(--text-secondary)',
              transition: 'color 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--accent)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
          >
            <Edit2 size={13} />
          </button>
          <button
            title="Delete Client"
            onClick={() => onDelete(client.id, `${client.firstName} ${client.lastName}`)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
              color: 'var(--text-secondary)',
              transition: 'color 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#dc2626')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
          >
            <Trash2 size={13} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={clients}
      keyExtractor={(c) => c.id}
      emptyState={
        <EmptyState
          icon={<Users size={32} />}
          title={isLoading ? 'Loading client database...' : 'Client directory is empty'}
          description={
            isLoading
              ? 'Accessing client data records from ledger...'
              : 'Add customer loyalty slots manually or check-in new walk-ins to build history.'
          }
        />
      }
    />
  );
}
