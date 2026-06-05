import { useState } from 'react';
import { ShoppingBag, Edit2, Trash2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { InventoryItem } from '../../types';
import { useNotification } from '../../context/NotificationContext';
import { fetchWithTimeout } from '../../utils/api';
import { getApiUrl, getAuthToken } from '../../utils/getApiUrl';
import {
  PageWrapper,
  DataTable,
  SearchBar,
  PaginationControls,
  EmptyState,
} from '../../components/common';
import type { ColumnDef } from '../../components/common';
import { InventoryFormModal } from './InventoryFormModal';

interface InventoryTabProps {
  selectedBranch: string;
  employeeRole: string;
}

export function InventoryTab({ selectedBranch, employeeRole }: InventoryTabProps) {
  const { showToast, confirm } = useNotification();
  const queryClient = useQueryClient();

  const isAuthorized = employeeRole === 'OWNER' || employeeRole === 'ADMIN';

  // Search & Pagination State
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);

  const API_URL = getApiUrl();

  // Fetch Inventory Query
  const {
    data: inventoryData,
    isLoading,
    isError,
  } = useQuery<InventoryItem[]>({
    queryKey: ['inventory', selectedBranch],
    queryFn: async () => {
      const token = getAuthToken();
      const res = await fetchWithTimeout(`${API_URL}/api/branches/${selectedBranch}/inventory`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch inventory items');
      return res.json();
    },
    enabled: !!selectedBranch,
  });

  const items = inventoryData || [];

  // Filtered & Paginated items
  const filteredItems = items.filter((item) => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    return item.name.toLowerCase().includes(query);
  });

  const itemsPerPage = 15;
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedItems = filteredItems.slice(startIndex, startIndex + itemsPerPage);

  const handleOpenAddModal = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: InventoryItem) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const token = getAuthToken();
      const res = await fetchWithTimeout(`${API_URL}/api/inventory/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete inventory item.');
      return data;
    },
    onSuccess: () => {
      showToast('Inventory item deleted successfully.', 'success');
      queryClient.invalidateQueries({ queryKey: ['inventory', selectedBranch] });
    },
    onError: (err: Error) => {
      showToast(err.message || 'Error occurred while deleting item.', 'error');
    },
  });

  const handleDeleteItem = async (id: string, name: string) => {
    const isConfirmed = await confirm({
      title: 'Delete Inventory Item',
      body: `Are you sure you want to permanently delete "${name}" from inventory? This action cannot be undone.`,
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
      isDestructive: true,
    });
    if (!isConfirmed) return;
    deleteMutation.mutate(id);
  };

  // Helper to format currency
  const formatPHP = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const columns: ColumnDef<InventoryItem>[] = [
    {
      key: 'name',
      header: 'Item Name',
      render: (item) => (
        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{item.name}</span>
      ),
    },
    {
      key: 'quantity',
      header: 'Current Stock',
      render: (item) => (
        <span style={{ fontSize: '13.5px', color: 'var(--text-primary)' }}>
          {item.stockQuantity}
        </span>
      ),
    },
    {
      key: 'reorderLevel',
      header: 'Reorder Level',
      render: (item) => (
        <span style={{ fontSize: '13.5px', color: 'var(--text-secondary)' }}>
          {item.reorderLevel}
        </span>
      ),
    },
    {
      key: 'costPrice',
      header: 'Cost Price',
      render: (item) => (
        <span style={{ fontSize: '13.5px', color: 'var(--text-primary)', fontFamily: 'monospace' }}>
          {formatPHP(Number(item.cost))}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (item) => {
        const isLowStock = item.stockQuantity <= item.reorderLevel;
        return (
          <span
            className={`status-badge ${isLowStock ? 'inactive' : 'active'}`}
            style={{
              padding: '2px 8px',
              fontSize: '10px',
              fontWeight: 600,
              backgroundColor: isLowStock ? 'rgba(220, 38, 38, 0.08)' : 'rgba(16, 185, 129, 0.08)',
              color: isLowStock ? '#ef4444' : '#10b981',
              borderColor: isLowStock ? 'rgba(220, 38, 38, 0.15)' : 'rgba(16, 185, 129, 0.15)',
            }}
          >
            {isLowStock ? 'Low Stock' : 'In Stock'}
          </span>
        );
      },
    },
    {
      key: 'actions',
      header: '',
      style: { width: '80px', textAlign: 'right' },
      render: (item) => {
        if (!isAuthorized) return null;
        return (
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button
              title="Edit Item"
              onClick={() => handleOpenEditModal(item)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '2px',
                color: 'var(--text-secondary)',
                transition: 'color 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--accent)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
            >
              <Edit2 size={13} />
            </button>
            <button
              title="Delete Item"
              onClick={() => handleDeleteItem(item.id, item.name)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '2px',
                color: 'var(--text-secondary)',
                transition: 'color 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#dc2626')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
            >
              <Trash2 size={13} />
            </button>
          </div>
        );
      },
    },
  ];

  if (isLoading) {
    return (
      <div
        className="glass-panel"
        style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}
      >
        <div
          style={{
            width: '24px',
            height: '24px',
            border: '3px solid var(--accent)',
            borderTopColor: 'transparent',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
          }}
        />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="glass-panel" style={{ padding: '24px', textAlign: 'center' }}>
        <p style={{ color: '#dc2626' }}>
          Error loading inventory items. Please verify if backend server is online.
        </p>
      </div>
    );
  }

  return (
    <>
      <PageWrapper
        title="Inventory Stock & Adjustments"
        subtitle="Track product stock levels, reorder alerts, and retail item inventory."
        action={
          isAuthorized ? (
            <button
              className="btn-primary"
              onClick={handleOpenAddModal}
              style={{ padding: '8px 16px', fontSize: '13px' }}
            >
              + Add Item
            </button>
          ) : undefined
        }
      >
        <div
          style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '20px' }}
        >
          <SearchBar
            value={searchQuery}
            onChange={(v) => {
              setSearchQuery(v);
              setCurrentPage(1);
            }}
            placeholder="Search by stock item name..."
          />
        </div>

        <DataTable
          columns={columns}
          data={paginatedItems}
          keyExtractor={(item) => item.id}
          emptyState={
            <EmptyState
              icon={<ShoppingBag size={32} />}
              title="No retail items mapped"
              description="Track product levels, reorder levels, and inbound shipment logs in this ledger."
            />
          }
        />

        <PaginationControls
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </PageWrapper>

      {isModalOpen && (
        <InventoryFormModal
          isOpen={isModalOpen}
          key={editingItem?.id || 'new'}
          editingItem={editingItem}
          selectedBranch={selectedBranch}
          existingItems={items}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </>
  );
}
