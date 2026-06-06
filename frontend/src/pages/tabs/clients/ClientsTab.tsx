import { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNotification } from '../../../context/NotificationContext';
import { apiClient } from '../../../utils/apiClient';
import { PageWrapper, SearchBar, PaginationControls } from '../../../components/common';
import type { Client, ClientPayload } from '../../../types';
import { ClientTable } from './ClientTable';
import { ClientFormModal } from './ClientFormModal';
import { ClientHistoryModal } from './ClientHistoryModal';

function formatClientNotes(safety: string, preferences: string, general: string) {
  let notesStr = '';
  if (safety.trim()) notesStr += `[Safety] ${safety.trim()} `;
  if (preferences.trim()) notesStr += `[Preferences] ${preferences.trim()} `;
  if (general.trim()) notesStr += `[General] ${general.trim()}`;
  return notesStr.trim();
}

export function ClientsTab() {
  const { showToast, confirm } = useNotification();
  const queryClient = useQueryClient();

  // Search & Pagination State
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [historyClientId, setHistoryClientId] = useState<string | null>(null);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);

    return () => {
      clearTimeout(handler);
    };
  }, [searchQuery]);

  // Fetch Clients Query
  const {
    data: clients = [],
    isLoading,
    refetch,
  } = useQuery<Client[]>({
    queryKey: ['clients', debouncedSearchQuery],
    queryFn: () => {
      const url = debouncedSearchQuery
        ? `/api/clients?search=${encodeURIComponent(debouncedSearchQuery)}`
        : '/api/clients';
      return apiClient.get<Client[]>(url);
    },
    staleTime: 30000,
  });

  // Fetch single client history
  const { data: activeClientDetails, isLoading: isLoadingDetails } = useQuery<Client>({
    queryKey: ['clientDetails', historyClientId],
    queryFn: () => apiClient.get<Client>(`/api/clients/${historyClientId}`),
    enabled: !!historyClientId,
    staleTime: 60000,
  });

  // Filtered & Paginated items
  const itemsPerPage = 15;
  const totalPages = Math.ceil(clients.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedClients = clients.slice(startIndex, startIndex + itemsPerPage);

  const handleOpenAddModal = () => {
    setEditingClient(null);
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (client: Client) => {
    setEditingClient(client);
    setIsEditModalOpen(true);
  };

  const handleOpenHistoryModal = (clientId: string) => {
    setHistoryClientId(clientId);
    setIsHistoryModalOpen(true);
  };

  // Add Mutation
  const addMutation = useMutation({
    mutationFn: (payload: ClientPayload) => apiClient.post<Client>('/api/clients', payload),
    onSuccess: () => {
      showToast('Client added successfully.', 'success');
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      setIsAddModalOpen(false);
    },
    onError: (err: Error) => {
      showToast(err.message, 'error');
    },
  });

  // Update Mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: ClientPayload }) =>
      apiClient.put<Client>(`/api/clients/${id}`, payload),
    onSuccess: () => {
      showToast('Client profile updated.', 'success');
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      setIsEditModalOpen(false);
      setEditingClient(null);
    },
    onError: (err: Error) => {
      showToast(err.message, 'error');
    },
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/api/clients/${id}`),
    onSuccess: () => {
      showToast('Client profile deleted successfully.', 'success');
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
    onError: (err: Error) => {
      showToast(err.message, 'error');
    },
  });

  const handleAddSubmit = (data: {
    firstName: string;
    lastName: string;
    phoneNumber: string;
    birthday: string;
    safetyNotes: string;
    techPreferences: string;
    generalNotes: string;
  }) => {
    const notes = formatClientNotes(data.safetyNotes, data.techPreferences, data.generalNotes);
    addMutation.mutate({
      firstName: data.firstName,
      lastName: data.lastName,
      phoneNumber: data.phoneNumber || undefined,
      birthday: data.birthday || undefined,
      notes,
    });
  };

  const handleEditSubmit = (data: {
    firstName: string;
    lastName: string;
    phoneNumber: string;
    birthday: string;
    safetyNotes: string;
    techPreferences: string;
    generalNotes: string;
  }) => {
    if (!editingClient) return;
    const notes = formatClientNotes(data.safetyNotes, data.techPreferences, data.generalNotes);
    updateMutation.mutate({
      id: editingClient.id,
      payload: {
        firstName: data.firstName,
        lastName: data.lastName,
        phoneNumber: data.phoneNumber || undefined,
        birthday: data.birthday || undefined,
        notes,
      },
    });
  };

  const handleDeleteClient = async (id: string, name: string) => {
    const isConfirmed = await confirm({
      title: 'Delete Client Profile',
      body: `Are you sure you want to permanently delete client profile "${name}"? This action cannot be undone.`,
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
      isDestructive: true,
    });
    if (!isConfirmed) return;
    deleteMutation.mutate(id);
  };

  return (
    <>
      <PageWrapper
        title="Clients Directory"
        subtitle="Manage loyalty tier points, client specific allergies, stylist preferences, and bookings."
        action={
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              className="btn-secondary"
              title="Refresh CRM List"
              onClick={() => refetch()}
              style={{
                padding: '8px 12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <RefreshCw size={14} className={isLoading ? 'spin' : ''} />
            </button>
            <button
              className="btn-primary"
              onClick={handleOpenAddModal}
              style={{ padding: '8px 16px', fontSize: '13px' }}
            >
              + Add Client
            </button>
          </div>
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
            placeholder="Search clients by name or phone number..."
          />
        </div>

        <ClientTable
          clients={paginatedClients}
          isLoading={isLoading}
          onViewHistory={handleOpenHistoryModal}
          onEdit={handleOpenEditModal}
          onDelete={handleDeleteClient}
        />

        <PaginationControls
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </PageWrapper>

      {/* Add Client Modal */}
      <ClientFormModal
        key={isAddModalOpen ? 'add' : 'closed'}
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddSubmit}
        title="Create Client Profile"
        submitLabel="Create Client"
        isPending={addMutation.isPending}
      />

      {/* Edit Client Modal */}
      <ClientFormModal
        key={isEditModalOpen ? editingClient?.id || 'edit' : 'closed'}
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingClient(null);
        }}
        onSubmit={handleEditSubmit}
        title="Edit Client Profile"
        submitLabel="Save Changes"
        isPending={updateMutation.isPending}
        initialData={editingClient}
      />

      {/* Booking History Modal */}
      <ClientHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => {
          setIsHistoryModalOpen(false);
          setHistoryClientId(null);
        }}
        isLoadingDetails={isLoadingDetails}
        activeClientDetails={activeClientDetails}
      />
    </>
  );
}
