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
  settings: {
    loyalty_spend_per_point: string;
    loyalty_point_value: string;
  };
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

  // Update Mutation
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

      {employeeRole === 'OWNER' && (
        <BranchManagementSection
          branches={branches}
          onBranchCreated={() => queryClient.invalidateQueries({ queryKey: ['branches'] })}
        />
      )}
    </div>
  );
}
