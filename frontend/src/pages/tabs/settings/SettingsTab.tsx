import React, { useState } from 'react';
import { Save, RefreshCw } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PageHeader, InlineAlertBanner } from '../../../components/common';
import { fetchWithTimeout } from '../../../utils/api';
import { getApiUrl, getAuthToken } from '../../../utils/getApiUrl';

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
