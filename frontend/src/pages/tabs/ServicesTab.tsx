import React, { useState } from 'react';
import { Scissors, Edit2, Trash2 } from 'lucide-react';
import type { Branch, Service } from '../../types';
import { useNotification } from '../../context/NotificationContext';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchWithTimeout } from '../../utils/api';
import { getApiUrl, getAuthToken } from '../../utils/getApiUrl';
import { PageHeader, EmptyState, ModalShell, FormErrorBanner } from '../../components/common';

interface ServicesTabProps {
  branches: Branch[];
  role?: string;
}

interface ServicePayload {
  name: string;
  price: number;
  category: string;
  durationMinutes: number;
  bufferTime: number;
  description?: string;
  isActive?: boolean;
  branchId?: string;
}

export function ServicesTab({ branches, role }: ServicesTabProps) {
  const { showToast, confirm } = useNotification();
  const queryClient = useQueryClient();

  const isAuthorized = role === 'OWNER' || role === 'ADMIN';
  const selectedBranch = branches[0]?.id || '';
  const services = branches[0]?.services || [];

  // Get unique list of existing categories for combobox suggestion
  const categories = Array.from(
    new Set(services.map((s: Service) => s.category).filter(Boolean))
  ) as string[];

  // Modal & Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    durationMinutes: '',
    bufferTime: '5',
    isActive: true,
  });
  const [errorMsg, setErrorMsg] = useState('');

  const handleOpenAddModal = () => {
    setEditingService(null);
    setFormData({
      name: '',
      description: '',
      price: '',
      category: '',
      durationMinutes: '',
      bufferTime: '5',
      isActive: true,
    });
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (s: Service) => {
    setEditingService(s);
    setFormData({
      name: s.name,
      description: s.description || '',
      price: parseFloat(s.price).toString(),
      category: s.category || '',
      durationMinutes: s.durationMinutes.toString(),
      bufferTime: (s.bufferTime ?? 5).toString(),
      isActive: s.isActive ?? true,
    });
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const submitMutation = useMutation({
    mutationFn: async ({ isEdit, payload }: { isEdit: boolean; payload: ServicePayload }) => {
      const token = getAuthToken();
      const API_URL = getApiUrl();
      const url = isEdit
        ? `${API_URL}/api/services/${editingService?.id}`
        : `${API_URL}/api/services`;
      const method = isEdit ? 'PUT' : 'POST';

      const response = await fetchWithTimeout(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || `Failed to ${isEdit ? 'update' : 'create'} service.`);
      }
      return data;
    },
    onSuccess: (_data, variables) => {
      showToast(
        `Service "${formData.name}" was successfully ${variables.isEdit ? 'updated' : 'created'}.`,
        'success'
      );
      setIsModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['branches'] });
    },
    onError: (err: Error) => {
      setErrorMsg(err.message || 'Error occurred. Please try again.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const token = getAuthToken();
      const API_URL = getApiUrl();

      const response = await fetchWithTimeout(`${API_URL}/api/services/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete service.');
      }
      return data;
    },
    onSuccess: () => {
      showToast('Service deleted successfully.', 'success');
      queryClient.invalidateQueries({ queryKey: ['branches'] });
    },
    onError: (err: Error) => {
      showToast(err.message || 'Error occurred while deleting service.', 'error');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const priceNum = parseFloat(formData.price);
    if (isNaN(priceNum) || priceNum < 0) {
      setErrorMsg('Price must be a valid non-negative number.');
      return;
    }

    const durationNum = parseInt(formData.durationMinutes, 10);
    if (isNaN(durationNum) || durationNum <= 0) {
      setErrorMsg('Duration must be a positive integer.');
      return;
    }

    const payload: ServicePayload = {
      name: formData.name.trim(),
      description: formData.description.trim() || undefined,
      price: priceNum,
      category: formData.category.trim(),
      durationMinutes: durationNum,
      bufferTime: parseInt(formData.bufferTime, 10) || 5,
    };

    if (editingService) {
      payload.isActive = formData.isActive;
    } else {
      payload.branchId = selectedBranch;
    }

    submitMutation.mutate({ isEdit: !!editingService, payload });
  };

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

        {services.length > 0 ? (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: '20px',
              marginTop: '20px',
            }}
          >
            {services.map((s: Service) => (
              <div key={s.id} className="data-card" style={{ padding: '24px' }}>
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
                      {s.name}
                    </h4>
                    {s.description && (
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
                        {s.description}
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
                      ₱{parseFloat(s.price).toFixed(2)}
                    </span>
                    {isAuthorized && (
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          title="Edit Service"
                          onClick={() => handleOpenEditModal(s)}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '2px',
                            color: 'var(--text-secondary)',
                            transition: 'color 0.2s',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--accent)')}
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.color = 'var(--text-secondary)')
                          }
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          title="Delete Service"
                          onClick={() => handleDeleteService(s.id, s.name)}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '2px',
                            color: 'var(--text-secondary)',
                            transition: 'color 0.2s',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.color = '#dc2626')}
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.color = 'var(--text-secondary)')
                          }
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <span className="micro-badge" style={{ fontSize: '9px', padding: '4px 10px' }}>
                    {s.category || 'Nails'}
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
                    {s.durationMinutes} mins
                  </span>
                  {s.bufferTime > 0 && (
                    <span
                      className="micro-badge"
                      style={{
                        fontSize: '9px',
                        padding: '4px 10px',
                        backgroundColor: 'rgba(59, 130, 246, 0.04)',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      +{s.bufferTime}m buffer
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<Scissors size={32} />}
            title="No service catalogs initialized"
            description="Services configure pricing models and display correctly in our guest portal templates."
          />
        )}
      </div>

      {isModalOpen && (
        <ModalShell maxWidth="500px">
          <div className="inner-core" style={{ padding: '32px' }}>
            <h3
              style={{
                fontFamily: 'var(--font-serif)',
                color: 'var(--accent)',
                fontSize: '22px',
                fontWeight: 600,
                margin: '0 0 8px 0',
              }}
            >
              {editingService ? 'Edit Service' : 'Create Service'}
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13.5px', margin: '0 0 24px 0' }}>
              {editingService
                ? 'Modify service details, pricing, categories, and durations.'
                : 'Add a new treatment offering to your salon menu catalog.'}
            </p>

            <form
              onSubmit={handleSubmit}
              style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
            >
              <div className="form-group">
                <label className="form-label">Service Name</label>
                <input
                  type="text"
                  placeholder="e.g. Premium Gel Overlay"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Price (PHP ₱)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Category</label>
                <input
                  type="text"
                  list="services-categories-datalist"
                  placeholder="Select category or type a new one..."
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  required
                />
                <datalist id="services-categories-datalist">
                  {categories.map((cat) => (
                    <option key={cat} value={cat} />
                  ))}
                </datalist>
              </div>

              <div
                className="form-grid"
                style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}
              >
                <div className="form-group">
                  <label className="form-label">Duration (Mins)</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="45"
                    value={formData.durationMinutes}
                    onChange={(e) => setFormData({ ...formData, durationMinutes: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Buffer Time (Mins)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="5"
                    value={formData.bufferTime}
                    onChange={(e) => setFormData({ ...formData, bufferTime: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Description (Optional)</label>
                <textarea
                  placeholder="Short description of the treatment..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    fontFamily: 'inherit',
                    fontSize: '14px',
                    backgroundColor: 'transparent',
                    color: 'var(--text-primary)',
                    outline: 'none',
                    resize: 'vertical',
                  }}
                />
              </div>

              {editingService && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginTop: '8px',
                    marginBottom: '8px',
                  }}
                >
                  <input
                    id="edit-service-active-checkbox"
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    style={{
                      width: '18px',
                      height: '18px',
                      cursor: 'pointer',
                      accentColor: 'var(--accent)',
                      margin: 0,
                    }}
                  />
                  <label
                    htmlFor="edit-service-active-checkbox"
                    style={{
                      fontSize: '14px',
                      fontWeight: 500,
                      color: 'var(--text-primary)',
                      cursor: 'pointer',
                      margin: 0,
                      padding: 0,
                    }}
                  >
                    Active (Visible on public guest portal)
                  </label>
                </div>
              )}

              <FormErrorBanner message={errorMsg} />

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
                  className="btn-primary"
                  onClick={() => setIsModalOpen(false)}
                  style={{
                    background: 'transparent',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-secondary)',
                    boxShadow: 'none',
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editingService ? 'Update Service' : 'Save Service'}
                </button>
              </div>
            </form>
          </div>
        </ModalShell>
      )}
    </>
  );
}
