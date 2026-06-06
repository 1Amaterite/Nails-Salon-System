import { Edit2, Trash2 } from 'lucide-react';
import type { Employee } from '../../../../types';

interface EmployeeRowActionsProps {
  emp: Employee;
  employeeRole: string;
  onEdit: () => void;
  onDelete: () => void;
}

export function EmployeeRowActions({
  emp,
  employeeRole,
  onEdit,
  onDelete,
}: EmployeeRowActionsProps) {
  const canEdit = employeeRole === 'OWNER' || (employeeRole === 'ADMIN' && emp.role === 'STAFF');

  if (!canEdit) return null;

  return (
    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
      <button
        title="Edit Employee"
        onClick={(e) => {
          e.stopPropagation();
          onEdit();
        }}
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
        title="Delete Employee"
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
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
  );
}
