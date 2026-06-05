import { useState, useMemo, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import { fetchWithTimeout } from '../../utils/api';
import { getApiUrl } from '../../utils/getApiUrl';
import type { Client } from '../../types';

interface ClientAutocompleteProps {
  value: string;
  onChange: (val: string) => void;
  onSelect: (client: Client) => void;
  placeholder?: string;
  required?: boolean;
  inputClassName?: string;
}

export function ClientAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder = 'Type client first name...',
  required = false,
  inputClassName = '',
}: ClientAutocompleteProps) {
  const { token } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const API_URL = getApiUrl();

  // Fetch all clients only if logged in
  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ['clients'],
    queryFn: async () => {
      const res = await fetchWithTimeout(`${API_URL}/api/clients`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch clients');
      return res.json();
    },
    enabled: !!token,
  });

  // Filter clients based on query value
  const suggestions = useMemo(() => {
    const term = value.trim().toLowerCase();
    if (!term || !token) return [];

    return clients.filter(
      (c) =>
        c.firstName.toLowerCase().includes(term) ||
        c.lastName.toLowerCase().includes(term) ||
        (c.phoneNumber && c.phoneNumber.includes(term))
    );
  }, [clients, value, token]);

  // Close suggestions dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSuggestionClick = (client: Client) => {
    onSelect(client);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        required={required}
        className={inputClassName}
        autoComplete="off"
      />
      {isOpen && suggestions.length > 0 && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--border-color-hover)',
            borderRadius: '8px',
            marginTop: '4px',
            maxHeight: '200px',
            overflowY: 'auto',
            zIndex: 1000,
            boxShadow: 'var(--shadow-lg)',
            backdropFilter: 'blur(8px)',
          }}
        >
          {suggestions.map((client) => (
            <div
              key={client.id}
              onClick={() => handleSuggestionClick(client)}
              style={{
                padding: '10px 16px',
                cursor: 'pointer',
                borderBottom: '1px solid var(--border-color)',
                fontSize: '13.5px',
                transition: 'background-color 0.2s',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--accent-glow)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <div>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                  {client.firstName} {client.lastName}
                </span>
                {client.phoneNumber && (
                  <span
                    style={{ marginLeft: '8px', fontSize: '11px', color: 'var(--text-secondary)' }}
                  >
                    ({client.phoneNumber})
                  </span>
                )}
              </div>
              {client.loyaltyPoints > 0 && (
                <span className="micro-badge" style={{ padding: '2px 8px', fontSize: '8px' }}>
                  {client.loyaltyPoints} Pts
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
