import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Branch, Service } from '../../../types';
import { useNotification } from '../../../context/NotificationContext';
import { apiClient } from '../../../utils/apiClient';
import { PageHeader } from '../../../components/common';
import { ServiceGrid } from './ServiceGrid';
import { ServiceFormModal } from './ServiceFormModal';

interface ServicesTabProps {
  branches: Branch[];
  selectedBranch: string;
  role?: string;
}

export function ServicesTab({ branches, selectedBranch, role }: ServicesTabProps) {
  const { showToast, confirm } = useNotification();
  const queryClient = useQueryClient();

  const isAuthorized = role === 'OWNER' || role === 'ADMIN';
  const branchData = branches.find((b) => b.id === selectedBranch) || branches[0];
  const activeBranchId = branchData?.id || '';
  const services = branchData?.services || [];

  // Get unique list of existing categories for combobox suggestion
  const categories = Array.from(
    new Set(services.map((s: Service) => s.category).filter(Boolean))
  ) as string[];

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);

  const handleOpenAddModal = () => {
    setEditingService(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (s: Service) => {
    setEditingService(s);
    setIsModalOpen(true);
  };

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/api/services/${id}`),
    onSuccess: () => {
      showToast('Service deleted successfully.', 'success');
      queryClient.invalidateQueries({ queryKey: ['branches'] });
    },
    onError: (err: Error) => {
      showToast(err.message || 'Error occurred while deleting service.', 'error');
    },
  });

  const handleDeleteService = async (id: string, name: string) => {
    const isConfirmed = await confirm({
      title: 'Delete Service Catalog Item',
      body: `Are you sure you want to permanently delete "${name}" from the catalog? This action cannot be undone.`,
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
      isDestructive: true,
    });
    if (!isConfirmed) return;
    deleteMutation.mutate(id);
  };

  return (
    <>
      <div className="glass-panel">
        <PageHeader
          title="Service Pricing & Catalog Setup"
          subtitle="Configure nail treatments, buffer durations, and custom technician categories."
          action={
            isAuthorized ? (
              <button
                className="btn-primary"
                onClick={handleOpenAddModal}
                style={{ padding: '8px 16px', fontSize: '13px' }}
              >
                + Create Service
              </button>
            ) : undefined
          }
        />

        <ServiceGrid
          services={services}
          isAuthorized={isAuthorized}
          onEdit={handleOpenEditModal}
          onDelete={handleDeleteService}
        />
      </div>

      {isModalOpen && (
        <ServiceFormModal
          isOpen={isModalOpen}
          key={editingService?.id || 'new'}
          editingService={editingService}
          categories={categories}
          selectedBranch={activeBranchId}
          existingServices={services}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </>
  );
}
