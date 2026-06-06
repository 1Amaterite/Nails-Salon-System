import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchWithTimeout } from '../../../utils/api';
import { getApiUrl, getAuthToken } from '../../../utils/getApiUrl';
import { ModalShell, FormErrorBanner } from '../../../components/common';
import { useNotification } from '../../../context/NotificationContext';
import type { Service, ServicePayload } from '../../../types';

interface ServiceFormModalProps {
  isOpen: boolean;
  editingService: Service | null;
  categories: string[];
  selectedBranch: string;
  existingServices: Service[];
  onClose: () => void;
}

export function ServiceFormModal({
  isOpen,
  editingService,
  categories,
  selectedBranch,
  existingServices,
  onClose,
}: ServiceFormModalProps) {
  const { showToast } = useNotification();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState(() => {
    if (editingService) {
      return {
        name: editingService.name,
        description: editingService.description || '',
        price: editingService.price.toString(),
        category: editingService.category || '',
        durationMinutes: editingService.durationMinutes.toString(),
        bufferTime: (editingService.bufferTime ?? 5).toString(),
        isActive: editingService.isActive ?? true,
        imageUrl: editingService.imageUrl || '',
      };
    }
    return {
      name: '',
      description: '',
      price: '',
      category: '',
      durationMinutes: '',
      bufferTime: '5',
      isActive: true,
      imageUrl: '',
    };
  });

  const [errorMsg, setErrorMsg] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

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
      onClose();
      queryClient.invalidateQueries({ queryKey: ['branches'] });
    },
    onError: (err: Error) => {
      setErrorMsg(err.message || 'Error occurred. Please try again.');
    },
  });

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Name uniqueness & required
    const nameTrim = formData.name.trim();
    if (!nameTrim) {
      newErrors.name = 'Service Name is required.';
    } else {
      const isDuplicate = existingServices.some(
        (s: Service) =>
          s.name.toLowerCase() === nameTrim.toLowerCase() &&
          (!editingService || s.id !== editingService.id)
      );
      if (isDuplicate) {
        newErrors.name = 'A service with this name already exists.';
      }
    }

    // Category
    if (!formData.category.trim()) {
      newErrors.category = 'Category is required.';
    }

    // Price
    const priceNum = parseFloat(formData.price);
    if (isNaN(priceNum)) {
      newErrors.price = 'Price is required.';
    } else if (priceNum <= 0) {
      newErrors.price = 'Price must be a positive number.';
    }

    // Duration
    const durationNum = parseInt(formData.durationMinutes, 10);
    if (isNaN(durationNum)) {
      newErrors.durationMinutes = 'Duration is required.';
    } else if (durationNum <= 0) {
      newErrors.durationMinutes = 'Duration must be a positive integer.';
    } else if (durationNum % 5 !== 0) {
      newErrors.durationMinutes = 'Duration must be in increments of 5 minutes.';
    }

    // Buffer Time
    const bufferNum = parseInt(formData.bufferTime, 10);
    if (isNaN(bufferNum)) {
      newErrors.bufferTime = 'Buffer time must be a number.';
    } else if (bufferNum < 0) {
      newErrors.bufferTime = 'Buffer time cannot be negative.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!validateForm()) {
      return;
    }

    const priceNum = parseFloat(formData.price);
    const durationNum = parseInt(formData.durationMinutes, 10);

    const payload: ServicePayload = {
      name: formData.name.trim(),
      description: formData.description.trim() || undefined,
      price: priceNum,
      category: formData.category.trim(),
      durationMinutes: durationNum,
      bufferTime: parseInt(formData.bufferTime, 10) || 0,
      isActive: formData.isActive,
      imageUrl: formData.imageUrl.trim() || undefined,
    };

    if (!editingService) {
      payload.branchId = selectedBranch;
    }

    submitMutation.mutate({ isEdit: !!editingService, payload });
  };

  if (!isOpen) return null;

  return (
    <ModalShell maxWidth="500px">
      <div
        className="inner-core"
        style={{
          display: 'flex',
          flexDirection: 'column',
          maxHeight: 'calc(85vh - 20px)',
          padding: 0,
          overflow: 'hidden',
        }}
      >
        <form
          onSubmit={handleSubmit}
          style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            maxHeight: '100%',
            overflow: 'hidden',
          }}
        >
          {/* Sticky Header */}
          <div
            style={{
              position: 'sticky',
              top: 0,
              zIndex: 10,
              backgroundColor: 'var(--bg-secondary)',
              borderBottom: '1px solid var(--border-color)',
              padding: '24px 36px 16px 36px',
            }}
          >
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
            <p style={{ color: 'var(--text-secondary)', fontSize: '13.5px', margin: 0 }}>
              {editingService
                ? 'Modify service details, pricing, categories, and durations.'
                : 'Add a new treatment offering to your salon menu catalog.'}
            </p>
          </div>

          {/* Scrollable Content Body */}
          <div
            className="modal-scroll-body"
            style={{
              overflowY: 'auto',
              padding: '24px 36px',
              flexGrow: 1,
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
            }}
          >
            {/* Group 1: Basic Information */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <h4
                style={{
                  fontSize: '13px',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: 'var(--accent)',
                  margin: '0 0 4px 0',
                  borderBottom: '1px solid var(--border-color)',
                  paddingBottom: '6px',
                }}
              >
                Basic Information
              </h4>

              <div className="form-group">
                <label className="form-label">Service Name</label>
                <input
                  type="text"
                  placeholder="e.g. Premium Gel Overlay"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  style={{ borderColor: errors.name ? '#dc2626' : undefined }}
                />
                {errors.name && (
                  <span
                    style={{
                      color: '#dc2626',
                      fontSize: '12px',
                      marginTop: '4px',
                      display: 'block',
                    }}
                  >
                    {errors.name}
                  </span>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Category</label>
                <input
                  type="text"
                  list="services-categories-datalist"
                  placeholder="Select category or type a new one..."
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  style={{ borderColor: errors.category ? '#dc2626' : undefined }}
                />
                <datalist id="services-categories-datalist">
                  {categories.map((cat) => (
                    <option key={cat} value={cat} />
                  ))}
                </datalist>
                {errors.category && (
                  <span
                    style={{
                      color: '#dc2626',
                      fontSize: '12px',
                      marginTop: '4px',
                      display: 'block',
                    }}
                  >
                    {errors.category}
                  </span>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Description (Optional)</label>
                <textarea
                  placeholder="Short description of the treatment..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
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
            </div>

            {/* Group 2: Pricing & Duration */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <h4
                style={{
                  fontSize: '13px',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: 'var(--accent)',
                  margin: '0 0 4px 0',
                  borderBottom: '1px solid var(--border-color)',
                  paddingBottom: '6px',
                }}
              >
                Pricing & Duration
              </h4>

              <div className="form-group">
                <label className="form-label">Price (PHP ₱)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  style={{ borderColor: errors.price ? '#dc2626' : undefined }}
                />
                {errors.price && (
                  <span
                    style={{
                      color: '#dc2626',
                      fontSize: '12px',
                      marginTop: '4px',
                      display: 'block',
                    }}
                  >
                    {errors.price}
                  </span>
                )}
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
                    style={{ borderColor: errors.durationMinutes ? '#dc2626' : undefined }}
                  />
                  <span
                    style={{
                      color: 'var(--text-secondary)',
                      fontSize: '11px',
                      marginTop: '2px',
                      display: 'block',
                    }}
                  >
                    Must be in 5 or 15 minute increments.
                  </span>
                  {errors.durationMinutes && (
                    <span
                      style={{
                        color: '#dc2626',
                        fontSize: '12px',
                        marginTop: '4px',
                        display: 'block',
                      }}
                    >
                      {errors.durationMinutes}
                    </span>
                  )}
                </div>
                <div className="form-group">
                  <label className="form-label">Buffer Time (Mins)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="5"
                    value={formData.bufferTime}
                    onChange={(e) => setFormData({ ...formData, bufferTime: e.target.value })}
                    style={{ borderColor: errors.bufferTime ? '#dc2626' : undefined }}
                  />
                  <span
                    style={{
                      color: 'var(--text-secondary)',
                      fontSize: '11px',
                      marginTop: '2px',
                      display: 'block',
                    }}
                  >
                    Time automatically blocked off after the appointment for cleanup or setup.
                  </span>
                  {errors.bufferTime && (
                    <span
                      style={{
                        color: '#dc2626',
                        fontSize: '12px',
                        marginTop: '4px',
                        display: 'block',
                      }}
                    >
                      {errors.bufferTime}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Group 3: Settings & Visibility */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <h4
                style={{
                  fontSize: '13px',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: 'var(--accent)',
                  margin: '0 0 4px 0',
                  borderBottom: '1px solid var(--border-color)',
                  paddingBottom: '6px',
                }}
              >
                Settings & Visibility
              </h4>

              <div className="form-group">
                <label className="form-label">Service Image URL (Optional)</label>
                <input
                  type="url"
                  placeholder="https://example.com/image.jpg"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                />
                <span
                  style={{
                    color: 'var(--text-secondary)',
                    fontSize: '11px',
                    marginTop: '2px',
                    display: 'block',
                  }}
                >
                  Provide a link to a picture of this treatment for the booking portal.
                </span>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  marginTop: '8px',
                  padding: '12px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-color)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', height: '24px' }}>
                  <input
                    id="service-active-toggle"
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
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <label
                    htmlFor="service-active-toggle"
                    style={{
                      fontSize: '14px',
                      fontWeight: 500,
                      color: 'var(--text-primary)',
                      cursor: 'pointer',
                      margin: 0,
                    }}
                  >
                    Active (Visible on booking portal)
                  </label>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '11.5px' }}>
                    Admins can draft services privately before publishing them.
                  </span>
                </div>
              </div>
            </div>

            <FormErrorBanner message={errorMsg} />
          </div>

          {/* Sticky Footer */}
          <div
            style={{
              position: 'sticky',
              bottom: 0,
              zIndex: 10,
              backgroundColor: 'var(--bg-secondary)',
              borderTop: '1px solid var(--border-color)',
              padding: '16px 36px 24px 36px',
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end',
              marginTop: 'auto',
            }}
          >
            <button
              type="button"
              className="btn-primary"
              onClick={onClose}
              style={{
                background: 'transparent',
                border: '1px solid var(--border-color)',
                color: 'var(--text-secondary)',
                boxShadow: 'none',
              }}
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={submitMutation.isPending}>
              {submitMutation.isPending ? (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <span
                    style={{
                      width: '12px',
                      height: '12px',
                      border: '2px solid rgba(255,255,255,0.3)',
                      borderRadius: '50%',
                      borderTopColor: '#fff',
                      animation: 'spin 1s linear infinite',
                      display: 'inline-block',
                    }}
                  ></span>
                  Saving...
                </span>
              ) : editingService ? (
                'Update Service'
              ) : (
                'Save Service'
              )}
            </button>
          </div>
        </form>
      </div>
    </ModalShell>
  );
}
