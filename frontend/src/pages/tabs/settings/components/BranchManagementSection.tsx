import { useState } from 'react';
import { Plus, Building2, Trash2 } from 'lucide-react';
import { CreateBranchModal } from './CreateBranchModal';
import { DeleteBranchModal } from './DeleteBranchModal';
import type { Branch } from '../../../../types';

interface BranchManagementSectionProps {
  branches: Branch[];
  onBranchCreated: () => void;
}

export function BranchManagementSection({
  branches,
  onBranchCreated,
}: BranchManagementSectionProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [deletingBranch, setDeletingBranch] = useState<Branch | null>(null);

  const handleInitiateDelete = (branch: Branch) => {
    setDeletingBranch(branch);
  };

  return (
    <div
      style={{
        marginTop: '32px',
        borderTop: '1px solid var(--border-color)',
        paddingTop: '32px',
      }}
    >
      <div className="flex-between-center" style={{ marginBottom: '20px' }}>
        <div>
          <h3
            style={{
              fontFamily: 'var(--font-serif)',
              color: 'var(--accent)',
              fontSize: '20px',
              fontWeight: 600,
              margin: 0,
            }}
          >
            Salon Branches Directory
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13.5px', margin: '4px 0 0 0' }}>
            Register new locations and manage existing ones in the network.
          </p>
        </div>
        <button
          type="button"
          className="btn-primary flex-align-center"
          onClick={() => setIsCreateOpen(true)}
          style={{
            gap: '8px',
            padding: '8px 16px',
            fontSize: '13px',
          }}
        >
          <Plus size={16} /> Add New Branch
        </button>
      </div>

      <div className="grid-responsive">
        {branches.map((b) => (
          <div
            key={b.id}
            className="glass-card-sub"
            style={{
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div className="flex-between-center" style={{ marginBottom: '12px' }}>
                <div className="flex-align-center" style={{ gap: '10px' }}>
                  <Building2 size={20} style={{ color: 'var(--accent)' }} />
                  <span
                    style={{ fontWeight: 600, fontSize: '15.5px', color: 'var(--text-primary)' }}
                  >
                    {b.name}
                  </span>
                </div>
                {branches.length > 1 && (
                  <button
                    type="button"
                    title="Delete Branch"
                    onClick={() => handleInitiateDelete(b)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--text-secondary)',
                      transition: 'all 0.2s',
                      padding: '4px',
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = '#dc2626';
                      e.currentTarget.style.backgroundColor = 'rgba(220, 38, 38, 0.08)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = 'var(--text-secondary)';
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <Trash2 size={15} />
                  </button>
                )}
              </div>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  fontSize: '13px',
                  color: 'var(--text-secondary)',
                }}
              >
                {b.address && (
                  <div>
                    <strong>Address:</strong> {b.address}
                  </div>
                )}
                {b.phone && (
                  <div>
                    <strong>Phone:</strong> {b.phone}
                  </div>
                )}
                {b.email && (
                  <div>
                    <strong>Email:</strong> {b.email}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <CreateBranchModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreated={onBranchCreated}
      />

      <DeleteBranchModal
        branch={deletingBranch}
        onClose={() => setDeletingBranch(null)}
        onDeleted={onBranchCreated}
      />
    </div>
  );
}
