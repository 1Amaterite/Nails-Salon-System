import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PageHeader, InlineAlertBanner, LoadingSpinner } from '../../../components/common';
import { useAuth } from '../../../context/AuthContext';
import { useBranch } from '../../../context/BranchContext';
import { SettingsForm } from './components/SettingsForm';
import { BranchManagementSection } from './components/BranchManagementSection';
import { apiClient } from '../../../utils/apiClient';

interface SettingsTabProps {
  selectedBranch: string;
}

interface SettingsPayload {
  name: string;
  address: string;
  phone: string;
  email: string;
}

export function SettingsTab({ selectedBranch }: SettingsTabProps) {
  const queryClient = useQueryClient();
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
    queryFn: () => apiClient.get<SettingsPayload>(`/api/branches/${selectedBranch}/settings`),
    enabled: !!selectedBranch,
    staleTime: 60000,
  });

  // Fetch global loyalty earn percentage
  const { data: loyaltyData } = useQuery<{ loyaltyEarnPercentage: number }>({
    queryKey: ['systemSettingsLoyalty'],
    queryFn: () =>
      apiClient.get<{ loyaltyEarnPercentage: number }>(
        '/api/system-settings/loyalty-earn-percentage'
      ),
    staleTime: 60000,
  });

  // Update Settings Mutation
  const updateSettingsMutation = useMutation({
    mutationFn: (payload: SettingsPayload) =>
      apiClient.put<SettingsPayload>(`/api/branches/${selectedBranch}/settings`, payload),
    onSuccess: (data) => {
      setSuccessAlert('Settings saved successfully!');
      queryClient.setQueryData(['branchSettings', selectedBranch], data);
      queryClient.invalidateQueries({ queryKey: ['branches'] });
    },
    onError: (err: Error) => {
      setErrorAlert(err.message);
    },
  });

  // Update Loyalty Percentage Mutation
  const updateLoyaltyMutation = useMutation({
    mutationFn: (percentage: number) =>
      apiClient.put<{ loyaltyEarnPercentage: number }>(
        '/api/system-settings/loyalty-earn-percentage',
        { percentage }
      ),
    onSuccess: (data) => {
      setSuccessAlert('Loyalty settings saved successfully!');
      queryClient.setQueryData(['systemSettingsLoyalty'], data);
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

  const handleLoyaltySave = (percentage: number) => {
    setErrorAlert('');
    setSuccessAlert('');
    updateLoyaltyMutation.mutate(percentage);
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
        <LoadingSpinner size="lg" />
        <p
          style={{
            color: 'var(--text-secondary)',
            fontSize: '14px',
            fontWeight: 500,
            marginTop: '16px',
          }}
        >
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

      {employeeRole === 'OWNER' && loyaltyData && (
        <LoyaltySettingsSection
          percentage={loyaltyData.loyaltyEarnPercentage}
          isPending={updateLoyaltyMutation.isPending}
          onSave={handleLoyaltySave}
        />
      )}

      {employeeRole === 'OWNER' && (
        <BranchManagementSection
          branches={branches}
          onBranchCreated={() => queryClient.invalidateQueries({ queryKey: ['branches'] })}
        />
      )}
    </div>
  );
}

function LoyaltySettingsSection({
  percentage,
  isPending,
  onSave,
}: {
  percentage: number;
  isPending: boolean;
  onSave: (pct: number) => void;
}) {
  const [selectedPercentage, setSelectedPercentage] = useState(percentage);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(selectedPercentage);
  };

  return (
    <div className="glass-card-sub" style={{ marginTop: '24px', marginBottom: '24px' }}>
      <h3
        style={{
          fontFamily: 'var(--font-serif)',
          color: 'var(--accent)',
          fontSize: '17px',
          fontWeight: 600,
          marginTop: 0,
          marginBottom: '8px',
        }}
      >
        Loyalty Program Settings (Global)
      </h3>
      <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '20px' }}>
        Configure the global customer points reward rate. Under a 1 Point = ₱1 discount model,
        clients earn points at checkout based on this percentage of their final payment total.
      </p>

      <form
        onSubmit={handleSubmit}
        style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
      >
        <div className="form-group" style={{ maxWidth: '400px' }}>
          <label className="form-label">Earning Reward Percentage (%)</label>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
            {([2, 3, 5] as const).map((pct) => (
              <button
                key={pct}
                type="button"
                className={`btn-primary ${selectedPercentage === pct ? '' : 'btn-secondary'}`}
                onClick={() => setSelectedPercentage(pct)}
                style={{
                  flex: 1,
                  padding: '8px 0',
                  fontSize: '12.5px',
                  boxShadow: 'none',
                  backgroundColor: selectedPercentage === pct ? 'var(--accent)' : 'transparent',
                  color: selectedPercentage === pct ? '#fff' : 'var(--text-secondary)',
                  borderColor: selectedPercentage === pct ? 'var(--accent)' : 'var(--border-color)',
                }}
              >
                {pct}%
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Custom Rate:</span>
            <div style={{ position: 'relative', flex: 1 }}>
              <input
                type="number"
                min="0"
                max="100"
                step="1"
                value={selectedPercentage}
                onChange={(e) => setSelectedPercentage(Number(e.target.value))}
                required
                style={{ paddingRight: '30px' }}
              />
              <span
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-secondary)',
                  fontSize: '14.5px',
                  pointerEvents: 'none',
                }}
              >
                %
              </span>
            </div>
          </div>
        </div>

        <button
          type="submit"
          className="btn-primary"
          disabled={isPending}
          style={{ width: 'fit-content', padding: '10px 20px', fontSize: '13px' }}
        >
          {isPending ? 'Updating...' : 'Save Loyalty Settings'}
        </button>
      </form>
    </div>
  );
}
