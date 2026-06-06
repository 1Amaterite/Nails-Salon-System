import { Settings } from 'lucide-react';
import { PageHeader, EmptyState } from '../../../components/common';

export function SettingsTab() {
  return (
    <div className="glass-panel">
      <PageHeader
        title="System Settings Panel"
        subtitle="Configure loyalty points ratios, tax rates, and basic brand descriptors."
      />
      <EmptyState
        icon={<Settings size={32} />}
        title="Configurations locked"
        description="Loyalty point earn-ratios and global branch parameters are managed under this workspace."
      />
    </div>
  );
}
