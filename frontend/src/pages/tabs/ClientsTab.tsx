import { useState } from 'react';
import {
  Users,
  Edit2,
  Trash2,
  ClipboardList,
  RefreshCw,
  HeartPulse,
  Sparkles,
  Cake,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNotification } from '../../context/NotificationContext';
import { fetchWithTimeout } from '../../utils/api';
import { getApiUrl, getAuthToken } from '../../utils/getApiUrl';
import {
  PageWrapper,
  DataTable,
  SearchBar,
  PaginationControls,
  EmptyState,
  ModalShell,
} from '../../components/common';
import type { ColumnDef } from '../../components/common';
import type { Client, Appointment, ClientPayload } from '../../types';

// Structured note parser utilities
function parseClientNotes(notesStr: string | null | undefined) {
  const result = {
    safety: '',
    preferences: '',
    general: '',
  };
  if (!notesStr) return result;

  const safetyMatch = notesStr.match(/\[Safety\](.*?)(?=\[|$)/s);
  const prefMatch = notesStr.match(/\[Preferences\](.*?)(?=\[|$)/s);
  const generalMatch = notesStr.match(/\[General\](.*?)(?=\[|$)/s);

  result.safety = safetyMatch ? safetyMatch[1].trim() : '';
  result.preferences = prefMatch ? prefMatch[1].trim() : '';

  if (!safetyMatch && !prefMatch && !generalMatch) {
    result.general = notesStr.trim();
  } else {
    result.general = generalMatch ? generalMatch[1].trim() : '';
  }

  return result;
}

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
  const [currentPage, setCurrentPage] = useState(1);

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [historyClientId, setHistoryClientId] = useState<string | null>(null);

  // Form states
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [birthday, setBirthday] = useState('');
  const [safetyNotes, setSafetyNotes] = useState('');
  const [techPreferences, setTechPreferences] = useState('');
  const [generalNotes, setGeneralNotes] = useState('');

  const API_URL = getApiUrl();

  // Fetch Clients Query
  const {
    data: clients = [],
    isLoading,
    refetch,
  } = useQuery<Client[]>({
    queryKey: ['clients', searchQuery],
    queryFn: async () => {
      const token = getAuthToken();
      const url = searchQuery
        ? `${API_URL}/api/clients?search=${encodeURIComponent(searchQuery)}`
        : `${API_URL}/api/clients`;
      const res = await fetchWithTimeout(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch clients');
      return res.json();
    },
  });

  // Fetch single client history
  const { data: activeClientDetails, isLoading: isLoadingDetails } = useQuery<Client>({
    queryKey: ['clientDetails', historyClientId],
    queryFn: async () => {
      const token = getAuthToken();
      const res = await fetchWithTimeout(`${API_URL}/api/clients/${historyClientId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch client history');
      return res.json();
    },
    enabled: !!historyClientId,
  });

  // Filtered & Paginated items
  const itemsPerPage = 15;
  const totalPages = Math.ceil(clients.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedClients = clients.slice(startIndex, startIndex + itemsPerPage);

  const resetForm = () => {
    setFirstName('');
    setLastName('');
    setPhoneNumber('');
    setBirthday('');
    setSafetyNotes('');
    setTechPreferences('');
    setGeneralNotes('');
  };

  const handleOpenAddModal = () => {
    resetForm();
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (client: Client) => {
    resetForm();
    setEditingClient(client);
    setFirstName(client.firstName);
    setLastName(client.lastName);
    setPhoneNumber(client.phoneNumber || '');
    if (client.birthday) {
      // Format DateTime from DB to YYYY-MM-DD for input element
      const dateOnly = client.birthday.split('T')[0];
      setBirthday(dateOnly);
    }
    const parsedNotes = parseClientNotes(client.notes);
    setSafetyNotes(parsedNotes.safety);
    setTechPreferences(parsedNotes.preferences);
    setGeneralNotes(parsedNotes.general);

    setIsEditModalOpen(true);
  };

  const handleOpenHistoryModal = (clientId: string) => {
    setHistoryClientId(clientId);
    setIsHistoryModalOpen(true);
  };

  // Add Mutation
  const addMutation = useMutation({
    mutationFn: async (payload: ClientPayload) => {
      const token = getAuthToken();
      const res = await fetchWithTimeout(`${API_URL}/api/clients`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add client.');
      return data;
    },
    onSuccess: () => {
      showToast('Client added successfully.', 'success');
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      setIsAddModalOpen(false);
      resetForm();
    },
    onError: (err: Error) => {
      showToast(err.message, 'error');
    },
  });

  // Update Mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: ClientPayload }) => {
      const token = getAuthToken();
      const res = await fetchWithTimeout(`${API_URL}/api/clients/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update client.');
      return data;
    },
    onSuccess: () => {
      showToast('Client profile updated.', 'success');
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      setIsEditModalOpen(false);
      resetForm();
    },
    onError: (err: Error) => {
      showToast(err.message, 'error');
    },
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const token = getAuthToken();
      const res = await fetchWithTimeout(`${API_URL}/api/clients/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete client.');
      return data;
    },
    onSuccess: () => {
      showToast('Client profile deleted successfully.', 'success');
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
    onError: (err: Error) => {
      showToast(err.message, 'error');
    },
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName) return;

    const notes = formatClientNotes(safetyNotes, techPreferences, generalNotes);
    addMutation.mutate({
      firstName,
      lastName,
      phoneNumber: phoneNumber || undefined,
      birthday: birthday || undefined,
      notes,
    });
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClient) return;

    const notes = formatClientNotes(safetyNotes, techPreferences, generalNotes);
    updateMutation.mutate({
      id: editingClient.id,
      payload: {
        firstName,
        lastName,
        phoneNumber: phoneNumber || undefined,
        birthday: birthday || undefined,
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

  const columns: ColumnDef<Client>[] = [
    {
      key: 'name',
      header: 'Client Name',
      render: (client) => (
        <div>
          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
            {client.firstName} {client.lastName}
          </span>
        </div>
      ),
    },
    {
      key: 'phone',
      header: 'Phone Number',
      render: (client) => (
        <span style={{ fontSize: '13.5px', color: 'var(--text-secondary)' }}>
          {client.phoneNumber || 'N/A'}
        </span>
      ),
    },
    {
      key: 'loyaltyPoints',
      header: 'Loyalty Points',
      render: (client) => (
        <span className="micro-badge" style={{ padding: '4px 10px', fontSize: '9px' }}>
          {client.loyaltyPoints} Points
        </span>
      ),
    },
    {
      key: 'birthday',
      header: 'Birthday',
      render: (client) => {
        if (!client.birthday) return <span style={{ color: 'var(--text-secondary)' }}>—</span>;
        const bDate = new Date(client.birthday);
        const bFormatted = bDate.toLocaleDateString([], {
          month: 'long',
          day: 'numeric',
          timeZone: 'UTC',
        });
        return (
          <span
            style={{
              fontSize: '13.5px',
              color: 'var(--text-primary)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Cake size={13} style={{ color: 'var(--accent)' }} />
            {bFormatted}
          </span>
        );
      },
    },
    {
      key: 'notes',
      header: 'Safety Alerts & Notes',
      render: (client) => {
        const parsed = parseClientNotes(client.notes);
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxWidth: '300px' }}>
            {parsed.safety && (
              <span
                style={{
                  fontSize: '11px',
                  color: '#dc2626',
                  backgroundColor: 'rgba(220, 38, 38, 0.05)',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  border: '1px solid rgba(220, 38, 38, 0.1)',
                  width: 'fit-content',
                  fontWeight: 500,
                }}
              >
                ⚠️ {parsed.safety}
              </span>
            )}
            {parsed.preferences && (
              <span
                style={{
                  fontSize: '11px',
                  color: 'var(--accent-blue)',
                  backgroundColor: 'var(--accent-blue-glow)',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  border: '1px solid rgba(37, 99, 235, 0.1)',
                  width: 'fit-content',
                  fontWeight: 500,
                }}
              >
                💇 {parsed.preferences}
              </span>
            )}
            {!parsed.safety && !parsed.preferences && !parsed.general && (
              <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>—</span>
            )}
          </div>
        );
      },
    },
    {
      key: 'actions',
      header: '',
      style: { width: '150px', textAlign: 'right' },
      render: (client) => (
        <div
          style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center' }}
        >
          <button
            title="View Booking History"
            className="btn-primary"
            onClick={() => handleOpenHistoryModal(client.id)}
            style={{
              padding: '6px 12px',
              fontSize: '11.5px',
              backgroundColor: 'transparent',
              border: '1px solid var(--border-color-hover)',
              color: 'var(--text-secondary)',
              boxShadow: 'none',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--accent-blue)';
              e.currentTarget.style.backgroundColor = 'var(--accent-blue-glow)';
              e.currentTarget.style.borderColor = 'var(--accent-blue)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--text-secondary)';
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.borderColor = 'var(--border-color-hover)';
            }}
          >
            History
          </button>
          <button
            title="Edit Client"
            onClick={() => handleOpenEditModal(client)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
              color: 'var(--text-secondary)',
              transition: 'color 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--accent)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
          >
            <Edit2 size={13} />
          </button>
          <button
            title="Delete Client"
            onClick={() => handleDeleteClient(client.id, `${client.firstName} ${client.lastName}`)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
              color: 'var(--text-secondary)',
              transition: 'color 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#dc2626')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
          >
            <Trash2 size={13} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <>
      <PageWrapper
        title="Client Database & CRM"
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

        <DataTable
          columns={columns}
          data={paginatedClients}
          keyExtractor={(c) => c.id}
          emptyState={
            <EmptyState
              icon={<Users size={32} />}
              title={isLoading ? 'Loading client database...' : 'Client directory is empty'}
              description={
                isLoading
                  ? 'Accessing client data records from ledger...'
                  : 'Add customer loyalty slots manually or check-in new walk-ins to build history.'
              }
            />
          }
        />

        <PaginationControls
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </PageWrapper>

      {/* Add Client Modal */}
      {isAddModalOpen && (
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
                Create Client Profile
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '13.5px', margin: 0 }}>
                Register a new customer profile. Log allergy notes, skin sensitivities, or stylist
                preferences.
              </p>
            </div>

            <form
              onSubmit={handleAddSubmit}
              style={{
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                maxHeight: '100%',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  padding: '24px 36px',
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                }}
              >
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">First Name *</label>
                    <input
                      type="text"
                      placeholder="Enter first name"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Last Name</label>
                    <input
                      type="text"
                      placeholder="Enter last name"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Phone Number</label>
                    <input
                      type="tel"
                      placeholder="Enter phone number"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Birthday</label>
                    <input
                      type="date"
                      value={birthday}
                      onChange={(e) => setBirthday(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label
                    className="form-label"
                    style={{ color: '#dc2626', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    <HeartPulse size={14} /> Safety Notes & Allergies (e.g. Skin Allergies)
                  </label>
                  <textarea
                    placeholder="Log customer allergies or skin sensitivities here..."
                    value={safetyNotes}
                    onChange={(e) => setSafetyNotes(e.target.value)}
                    rows={2}
                  />
                </div>

                <div className="form-group">
                  <label
                    className="form-label"
                    style={{
                      color: 'var(--accent-blue)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <Sparkles size={14} /> Technician & Stylist Preferences
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Prefers Volume lashes, specific nails stylist preference"
                    value={techPreferences}
                    onChange={(e) => setTechPreferences(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">General Comments</label>
                  <textarea
                    placeholder="Add general descriptors or preferences..."
                    value={generalNotes}
                    onChange={(e) => setGeneralNotes(e.target.value)}
                    rows={2}
                  />
                </div>
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
                  onClick={() => setIsAddModalOpen(false)}
                  style={{
                    background: 'transparent',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-secondary)',
                    boxShadow: 'none',
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={addMutation.isPending}>
                  {addMutation.isPending ? 'Saving...' : 'Create Client'}
                </button>
              </div>
            </form>
          </div>
        </ModalShell>
      )}

      {/* Edit Client Modal */}
      {isEditModalOpen && (
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
                Edit Client Profile
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '13.5px', margin: 0 }}>
                Update customer information, contact details, skin alert notes, and preferences.
              </p>
            </div>

            <form
              onSubmit={handleEditSubmit}
              style={{
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                maxHeight: '100%',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  padding: '24px 36px',
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                }}
              >
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">First Name *</label>
                    <input
                      type="text"
                      placeholder="Enter first name"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Last Name</label>
                    <input
                      type="text"
                      placeholder="Enter last name"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Phone Number</label>
                    <input
                      type="tel"
                      placeholder="Enter phone number"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Birthday</label>
                    <input
                      type="date"
                      value={birthday}
                      onChange={(e) => setBirthday(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label
                    className="form-label"
                    style={{ color: '#dc2626', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    <HeartPulse size={14} /> Safety Notes & Allergies (e.g. Skin Allergies)
                  </label>
                  <textarea
                    placeholder="Log customer allergies or skin sensitivities here..."
                    value={safetyNotes}
                    onChange={(e) => setSafetyNotes(e.target.value)}
                    rows={2}
                  />
                </div>

                <div className="form-group">
                  <label
                    className="form-label"
                    style={{
                      color: 'var(--accent-blue)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <Sparkles size={14} /> Technician & Stylist Preferences
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Prefers Volume lashes, specific nails stylist preference"
                    value={techPreferences}
                    onChange={(e) => setTechPreferences(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">General Comments</label>
                  <textarea
                    placeholder="Add general descriptors or preferences..."
                    value={generalNotes}
                    onChange={(e) => setGeneralNotes(e.target.value)}
                    rows={2}
                  />
                </div>
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
                  onClick={() => setIsEditModalOpen(false)}
                  style={{
                    background: 'transparent',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-secondary)',
                    boxShadow: 'none',
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </ModalShell>
      )}

      {/* Booking History Modal */}
      {isHistoryModalOpen && (
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
                Booking History
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '13.5px', margin: 0 }}>
                {activeClientDetails
                  ? `${activeClientDetails.firstName} ${activeClientDetails.lastName}`
                  : 'Client'}
                's past appointments ledger and logs.
              </p>
            </div>

            <div style={{ padding: '24px 36px', overflowY: 'auto' }}>
              {isLoadingDetails ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
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
              ) : activeClientDetails?.appointments &&
                activeClientDetails.appointments.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {activeClientDetails.appointments.map((appt: Appointment) => {
                    const apptDate = new Date(appt.appointmentDate).toLocaleDateString([], {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      timeZone: 'UTC',
                    });
                    const serviceNames =
                      appt.services?.map((rel) => rel.service?.name).join(', ') || 'N/A';
                    return (
                      <div
                        key={appt.id}
                        style={{
                          padding: '16px',
                          borderRadius: '8px',
                          border: '1px solid var(--border-color)',
                          backgroundColor: 'var(--bg-secondary)',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span
                              style={{
                                fontWeight: 600,
                                color: 'var(--text-primary)',
                                fontSize: '14px',
                              }}
                            >
                              {apptDate}
                            </span>
                            {appt.startTime && (
                              <span
                                style={{
                                  fontSize: '12.5px',
                                  color: 'var(--accent)',
                                  fontWeight: 500,
                                }}
                              >
                                {appt.startTime}
                              </span>
                            )}
                          </div>
                          <div
                            style={{
                              fontSize: '13px',
                              color: 'var(--text-secondary)',
                              marginTop: '4px',
                            }}
                          >
                            Treatment:{' '}
                            <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                              {serviceNames}
                            </span>
                          </div>
                          <div
                            style={{
                              fontSize: '12.5px',
                              color: 'var(--text-secondary)',
                              marginTop: '2px',
                            }}
                          >
                            Stylist: {appt.employee?.name || 'First Available'}
                          </div>
                        </div>
                        <span
                          className="status-badge"
                          style={{
                            fontSize: '9.5px',
                            backgroundColor:
                              appt.status === 'COMPLETED'
                                ? 'rgba(16, 185, 129, 0.08)'
                                : appt.status === 'CONFIRMED'
                                  ? 'rgba(37, 99, 235, 0.08)'
                                  : undefined,
                            color:
                              appt.status === 'COMPLETED'
                                ? 'var(--success-green)'
                                : appt.status === 'CONFIRMED'
                                  ? 'var(--accent-blue)'
                                  : undefined,
                          }}
                        >
                          {appt.status.toLowerCase()}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <EmptyState
                  icon={<ClipboardList size={32} />}
                  title="No appointments logged"
                  description="This client hasn't registered any scheduled slots or walk-ins yet."
                />
              )}
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
                onClick={() => {
                  setIsHistoryModalOpen(false);
                  setHistoryClientId(null);
                }}
                style={{
                  background: 'transparent',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-secondary)',
                  boxShadow: 'none',
                }}
              >
                Close History
              </button>
            </div>
          </div>
        </ModalShell>
      )}
    </>
  );
}
