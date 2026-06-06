import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchWithTimeout } from '../../../utils/api';
import { getApiUrl, getAuthToken } from '../../../utils/getApiUrl';
import { ModalShell, FormErrorBanner } from '../../../components/common';
import { useNotification } from '../../../context/NotificationContext';
import type { InventoryItem, InventoryItemPayload } from '../../../types';

interface InventoryFormModalProps {
  isOpen: boolean;
  editingItem: InventoryItem | null;
  selectedBranch: string;
  existingItems: InventoryItem[];
  onClose: () => void;
}

export function InventoryFormModal({
  isOpen,
  editingItem,
  selectedBranch,
  existingItems,
  onClose,
}: InventoryFormModalProps) {
  const { showToast } = useNotification();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState(() => {
    if (editingItem) {
      return {
        name: editingItem.name,
        quantity: editingItem.stockQuantity.toString(),
        reorderLevel: editingItem.reorderLevel.toString(),
        costPrice: editingItem.cost.toString(),
      };
    }
    return {
      name: '',
      quantity: '',
      reorderLevel: '5',
      costPrice: '',
    };
  });

  const [errorMsg, setErrorMsg] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const submitMutation = useMutation({
    mutationFn: async ({ isEdit, payload }: { isEdit: boolean; payload: InventoryItemPayload }) => {
      const token = getAuthToken();
      const API_URL = getApiUrl();
      const url =
        isEdit && editingItem
          ? `${API_URL}/api/inventory/${editingItem.id}`
          : `${API_URL}/api/inventory`;
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
        throw new Error(data.error || `Failed to ${isEdit ? 'update' : 'create'} inventory item.`);
      }
      return data;
    },
    onSuccess: (_data, variables) => {
      showToast(
        `Inventory item "${formData.name}" was successfully ${variables.isEdit ? 'updated' : 'created'}.`,
        'success'
      );
      onClose();
      queryClient.invalidateQueries({ queryKey: ['inventory', selectedBranch] });
    },
    onError: (err: Error) => {
      setErrorMsg(err.message || 'An error occurred. Please try again.');
    },
  });

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Name required
    const nameTrim = formData.name.trim();
    if (!nameTrim) {
      newErrors.name = 'Item name is required.';
    } else {
      const isDuplicate = existingItems.some(
        (item) =>
          item.name.toLowerCase() === nameTrim.toLowerCase() &&
          (!editingItem || item.id !== editingItem.id)
      );
      if (isDuplicate) {
        newErrors.name = 'An item with this name already exists in this branch.';
      }
    }

    // Quantity cannot be negative
    const quantityNum = parseInt(formData.quantity, 10);
    if (isNaN(quantityNum)) {
      newErrors.quantity = 'Quantity is required.';
    } else if (quantityNum < 0) {
      newErrors.quantity = 'Quantity cannot be negative.';
    }

    // Reorder level cannot be negative
    const reorderNum = parseInt(formData.reorderLevel, 10);
    if (isNaN(reorderNum)) {
      newErrors.reorderLevel = 'Reorder level is required.';
    } else if (reorderNum < 0) {
      newErrors.reorderLevel = 'Reorder level cannot be negative.';
    }

    // Cost price cannot be negative
    const costNum = parseFloat(formData.costPrice);
    if (isNaN(costNum)) {
      newErrors.costPrice = 'Cost price is required.';
    } else if (costNum < 0) {
      newErrors.costPrice = 'Cost price cannot be negative.';
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

    const payload: InventoryItemPayload = {
      name: formData.name.trim(),
      quantity: parseInt(formData.quantity, 10),
      reorderLevel: parseInt(formData.reorderLevel, 10),
      costPrice: parseFloat(formData.costPrice),
    };

    if (!editingItem) {
      payload.branchId = selectedBranch;
    }

    submitMutation.mutate({ isEdit: !!editingItem, payload });
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
              {editingItem ? 'Edit Stock Item' : 'Add Inventory Item'}
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13.5px', margin: 0 }}>
              {editingItem
                ? 'Update item details, cost price, and active inventory count.'
                : 'Register a new physical product or chemical stock item to track.'}
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Item Name</label>
                <input
                  type="text"
                  placeholder="e.g. Acetone 1L, Red Gel Polish"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  style={{ borderColor: errors.name ? '#dc2626' : undefined }}
                  required
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
                <label className="form-label">Cost Price (₱ PHP)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={formData.costPrice}
                  onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                  style={{ borderColor: errors.costPrice ? '#dc2626' : undefined }}
                  required
                />
                {errors.costPrice && (
                  <span
                    style={{
                      color: '#dc2626',
                      fontSize: '12px',
                      marginTop: '4px',
                      display: 'block',
                    }}
                  >
                    {errors.costPrice}
                  </span>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Current Stock</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    style={{ borderColor: errors.quantity ? '#dc2626' : undefined }}
                    required
                  />
                  {errors.quantity && (
                    <span
                      style={{
                        color: '#dc2626',
                        fontSize: '12px',
                        marginTop: '4px',
                        display: 'block',
                      }}
                    >
                      {errors.quantity}
                    </span>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">Reorder Level</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="5"
                    value={formData.reorderLevel}
                    onChange={(e) => setFormData({ ...formData, reorderLevel: e.target.value })}
                    style={{ borderColor: errors.reorderLevel ? '#dc2626' : undefined }}
                    required
                  />
                  {errors.reorderLevel && (
                    <span
                      style={{
                        color: '#dc2626',
                        fontSize: '12px',
                        marginTop: '4px',
                        display: 'block',
                      }}
                    >
                      {errors.reorderLevel}
                    </span>
                  )}
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
              ) : editingItem ? (
                'Update Item'
              ) : (
                'Save Item'
              )}
            </button>
          </div>
        </form>
      </div>
    </ModalShell>
  );
}
