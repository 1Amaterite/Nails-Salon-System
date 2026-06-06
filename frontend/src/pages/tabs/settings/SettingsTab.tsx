import React, { useState } from 'react';
import { Save, RefreshCw, X, Plus, Building2, Trash2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PageHeader, InlineAlertBanner } from '../../../components/common';
import { fetchWithTimeout } from '../../../utils/api';
import { getApiUrl, getAuthToken } from '../../../utils/getApiUrl';
import { useAuth } from '../../../context/AuthContext';
import { useBranch } from '../../../context/BranchContext';
import { ModalShell } from '../../../components/common/ModalShell';
import type { Branch } from '../../../types';

interface SettingsTabProps {
  selectedBranch: string;
}

interface SettingsPayload {
  name: string;
  address: string;
  phone: string;
  email: string;
  settings: {
    loyalty_spend_per_point: string;
    loyalty_point_value: string;
  };
}

export function SettingsTab({ selectedBranch }: SettingsTabProps) {
  const queryClient = useQueryClient();
  const API_URL = getApiUrl();
  const { employeeRole } = useAuth();
  const { branches } = useBranch();

  const [errorAlert, setErrorAlert] = useState('');
  const [successAlert, setSuccessAlert] = useState('');

  // Fetch settings
  const {
    data: settingsData,
    isPending,
    isError,
    refetch,
  } = useQuery<SettingsPayload>({
    queryKey: ['branchSettings', selectedBranch],
    queryFn: async () => {
      const token = getAuthToken();
      const res = await fetchWithTimeout(`${API_URL}/api/branches/${selectedBranch}/settings`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to fetch branch settings.');
      }
      return res.json();
    },
    enabled: !!selectedBranch,
  });

  // Update Mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (payload: SettingsPayload) => {
      const token = getAuthToken();
      const res = await fetchWithTimeout(`${API_URL}/api/branches/${selectedBranch}/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to save settings.');
      }
      return res.json();
    },
    onSuccess: (data) => {
      setSuccessAlert('Settings saved successfully!');
      queryClient.setQueryData(['branchSettings', selectedBranch], data);
      queryClient.invalidateQueries({ queryKey: ['branches'] });
    },
    onError: (err: Error) => {
      setErrorAlert(err.message);
    },
  });

  const handleFormSubmit = (payload: SettingsPayload) => {
    setErrorAlert('');
    setSuccessAlert('');
    updateSettingsMutation.mutate(payload);
  };

  if (isPending) {
    return (
      <div
        className="glass-panel"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '80px 40px',
        }}
      >
        <div
          style={{
            width: '40px',
            height: '40px',
            border: '4px solid var(--accent)',
            borderTopColor: 'transparent',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            marginBottom: '16px',
          }}
        />
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', fontWeight: 500 }}>
          Retrieving branch configuration details...
        </p>
      </div>
    );
  }

  if (isError || !settingsData) {
    return (
      <div className="glass-panel" style={{ textAlign: 'center', padding: '60px 40px' }}>
        <h2 style={{ color: 'var(--text-primary)', marginBottom: '12px' }}>
          Failed to load settings
        </h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
          An error occurred while connecting to the server.
        </p>
        <button className="btn-primary" onClick={() => refetch()}>
          Retry Request
        </button>
      </div>
    );
  }

  return (
    <div className="glass-panel">
      <PageHeader
        title="System Settings Panel"
        subtitle="Configure loyalty points ratios and basic brand descriptors."
      />

      <InlineAlertBanner type="success" message={successAlert} />
      <InlineAlertBanner type="error" message={errorAlert} />

      <SettingsForm
        key={JSON.stringify(settingsData)}
        settingsData={settingsData}
        onSubmit={handleFormSubmit}
        onReset={refetch}
        isPending={updateSettingsMutation.isPending}
      />

      {employeeRole === 'OWNER' && (
        <BranchManagementSection
          branches={branches}
          onBranchCreated={() => queryClient.invalidateQueries({ queryKey: ['branches'] })}
        />
      )}
    </div>
  );
}

interface SettingsFormProps {
  settingsData: SettingsPayload;
  onSubmit: (payload: SettingsPayload) => void;
  onReset: () => void;
  isPending: boolean;
}

function SettingsForm({ settingsData, onSubmit, onReset, isPending }: SettingsFormProps) {
  const [name, setName] = useState(() => settingsData.name || '');
  const [address, setAddress] = useState(() => settingsData.address || '');
  const [phone, setPhone] = useState(() => settingsData.phone || '');
  const [email, setEmail] = useState(() => settingsData.email || '');
  const [spendPerPoint, setSpendPerPoint] = useState(
    () => settingsData.settings?.loyalty_spend_per_point || '10'
  );
  const [pointValue, setPointValue] = useState(
    () => settingsData.settings?.loyalty_point_value || '1'
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name: name.trim(),
      address: address.trim(),
      phone: phone.trim(),
      email: email.trim(),
      settings: {
        loyalty_spend_per_point: spendPerPoint,
        loyalty_point_value: pointValue,
      },
    });
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Section: Branch Details */}
      <div
        style={{
          background: 'rgba(255, 255, 255, 0.4)',
          border: '1px solid var(--border-color)',
          borderRadius: '16px',
          padding: '24px',
        }}
      >
        <h3
          style={{
            fontFamily: 'var(--font-serif)',
            color: 'var(--accent)',
            fontSize: '17px',
            fontWeight: 600,
            marginTop: 0,
            marginBottom: '20px',
          }}
        >
          Branch Profile & Information
        </h3>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '16px',
            marginBottom: '16px',
          }}
        >
          <div className="form-group">
            <label className="form-label">Branch Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="e.g. Nails & Lashes Lane Branch"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Contact Phone</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. (555) 0199"
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div className="form-group">
            <label className="form-label">Address</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. 123 Luxury Way"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Contact Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. info@nailssalon.com"
            />
          </div>
        </div>
      </div>

      {/* Section: Loyalty Points Config */}
      <div
        style={{
          background: 'rgba(255, 255, 255, 0.4)',
          border: '1px solid var(--border-color)',
          borderRadius: '16px',
          padding: '24px',
        }}
      >
        <h3
          style={{
            fontFamily: 'var(--font-serif)',
            color: 'var(--accent)',
            fontSize: '17px',
            fontWeight: 600,
            marginTop: 0,
            marginBottom: '20px',
          }}
        >
          Loyalty Points Program
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div className="form-group">
            <label className="form-label">Spend Required to Earn 1 Point (₱)</label>
            <input
              type="number"
              min="1"
              step="1"
              value={spendPerPoint}
              onChange={(e) => setSpendPerPoint(e.target.value)}
              required
            />
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
              How much a client must spend to accrue one loyalty point.
            </span>
          </div>

          <div className="form-group">
            <label className="form-label">Monetary Value of 1 Point (₱)</label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={pointValue}
              onChange={(e) => setPointValue(e.target.value)}
              required
            />
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
              The discount value applied when redeeming a single point.
            </span>
          </div>
        </div>
      </div>

      {/* Form Action Buttons */}
      <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
        <button
          type="button"
          className="btn-secondary"
          onClick={onReset}
          disabled={isPending}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '10px 16px',
          }}
        >
          <RefreshCw size={14} className={isPending ? 'spin' : ''} />
          Reset
        </button>
        <button
          type="submit"
          className="btn-primary"
          disabled={isPending}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '10px 20px',
          }}
        >
          <Save size={14} />
          {isPending ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </form>
  );
}

interface BranchManagementSectionProps {
  branches: Branch[];
  onBranchCreated: () => void;
}

function BranchManagementSection({ branches, onBranchCreated }: BranchManagementSectionProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isPending, setIsPending] = useState(false);

  // Deletion state
  const [deletingBranch, setDeletingBranch] = useState<Branch | null>(null);
  const [deleteConfirmName, setDeleteConfirmName] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const API_URL = getApiUrl();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsPending(true);

    try {
      const token = getAuthToken();
      const res = await fetchWithTimeout(`${API_URL}/api/branches`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: name.trim(),
          address: address.trim() || undefined,
          phone: phone.trim() || undefined,
          email: email.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create branch.');
      }

      setName('');
      setAddress('');
      setPhone('');
      setEmail('');
      setIsModalOpen(false);
      onBranchCreated();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error occurred while creating branch.';
      setErrorMsg(msg);
    } finally {
      setIsPending(false);
    }
  };

  const handleInitiateDelete = (branch: Branch) => {
    setDeletingBranch(branch);
    setDeleteConfirmName('');
    setDeleteError('');
  };

  const handleConfirmDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    setDeleteError('');

    if (!deletingBranch) return;

    if (deleteConfirmName.trim() !== deletingBranch.name) {
      setDeleteError('Confirmed branch name does not match.');
      return;
    }

    setIsDeleting(true);

    try {
      const token = getAuthToken();
      const res = await fetchWithTimeout(`${API_URL}/api/branches/${deletingBranch.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete branch.');
      }

      setDeletingBranch(null);
      setDeleteConfirmName('');
      onBranchCreated();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error occurred while deleting branch.';
      setDeleteError(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div
      style={{
        marginTop: '32px',
        borderTop: '1px solid var(--border-color)',
        paddingTop: '32px',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
        }}
      >
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
          className="btn-primary"
          onClick={() => setIsModalOpen(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            fontSize: '13px',
          }}
        >
          <Plus size={16} /> Add New Branch
        </button>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '16px',
        }}
      >
        {branches.map((b) => (
          <div
            key={b.id}
            style={{
              background: 'rgba(255, 255, 255, 0.4)',
              border: '1px solid var(--border-color)',
              borderRadius: '16px',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '12px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
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

      {isModalOpen && (
        <ModalShell maxWidth="550px">
          <div className="modal-container" style={{ padding: '24px' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px',
              }}
            >
              <h3
                style={{
                  fontFamily: 'var(--font-serif)',
                  color: 'var(--accent)',
                  fontSize: '19px',
                  fontWeight: 600,
                  margin: 0,
                }}
              >
                Register New Branch
              </h3>
              <button
                type="button"
                onClick={() => {
                  setIsModalOpen(false);
                  setErrorMsg('');
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-secondary)',
                }}
              >
                <X size={20} />
              </button>
            </div>

            {errorMsg && <InlineAlertBanner type="error" message={errorMsg} />}

            <form
              onSubmit={handleSubmit}
              style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
            >
              <div className="form-group">
                <label className="form-label">Branch Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="e.g. Nails & Lashes Lane East"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. 456 Parkway Ave, Suite B"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. (555) 0210"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. east@nailssalon.com"
                  />
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  gap: '12px',
                  justifyContent: 'flex-end',
                  marginTop: '12px',
                }}
              >
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    setIsModalOpen(false);
                    setErrorMsg('');
                  }}
                  disabled={isPending}
                  style={{ padding: '10px 16px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={isPending}
                  style={{ padding: '10px 20px' }}
                >
                  {isPending ? 'Creating...' : 'Create Location'}
                </button>
              </div>
            </form>
          </div>
        </ModalShell>
      )}

      {deletingBranch && (
        <ModalShell maxWidth="500px">
          <div className="modal-container" style={{ padding: '24px' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '16px',
              }}
            >
              <h3
                style={{
                  fontFamily: 'var(--font-serif)',
                  color: '#dc2626',
                  fontSize: '18px',
                  fontWeight: 600,
                  margin: 0,
                }}
              >
                Double-Secured Deletion
              </h3>
              <button
                type="button"
                onClick={() => setDeletingBranch(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-secondary)',
                }}
              >
                <X size={20} />
              </button>
            </div>

            <div
              style={{
                backgroundColor: 'rgba(220, 38, 38, 0.05)',
                border: '1px solid rgba(220, 38, 38, 0.1)',
                borderRadius: '8px',
                padding: '14px',
                marginBottom: '16px',
                fontSize: '13.5px',
                color: '#b91c1c',
                lineHeight: 1.5,
              }}
            >
              <strong>Warning:</strong> Deleting <strong>{deletingBranch.name}</strong> is a
              destructive action. All associated services, appointments, schedules, and settings for
              this branch will be permanently deleted.
            </div>

            {deleteError && <InlineAlertBanner type="error" message={deleteError} />}

            <form
              onSubmit={handleConfirmDelete}
              style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
            >
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '13.5px' }}>
                  Please type the name of the branch <strong>{deletingBranch.name}</strong> to
                  confirm:
                </label>
                <input
                  type="text"
                  value={deleteConfirmName}
                  onChange={(e) => setDeleteConfirmName(e.target.value)}
                  required
                  placeholder={deletingBranch.name}
                  autoComplete="off"
                />
              </div>

              <div
                style={{
                  display: 'flex',
                  gap: '12px',
                  justifyContent: 'flex-end',
                  marginTop: '12px',
                }}
              >
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setDeletingBranch(null)}
                  disabled={isDeleting}
                  style={{ padding: '10px 16px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={isDeleting || deleteConfirmName.trim() !== deletingBranch.name}
                  style={{
                    padding: '10px 20px',
                    backgroundColor:
                      deleteConfirmName.trim() === deletingBranch.name
                        ? '#dc2626'
                        : 'var(--border-color)',
                    color:
                      deleteConfirmName.trim() === deletingBranch.name
                        ? '#ffffff'
                        : 'var(--text-secondary)',
                    cursor:
                      deleteConfirmName.trim() === deletingBranch.name ? 'pointer' : 'not-allowed',
                  }}
                >
                  {isDeleting ? 'Deleting...' : 'Permanently Delete'}
                </button>
              </div>
            </form>
          </div>
        </ModalShell>
      )}
    </div>
  );
}
