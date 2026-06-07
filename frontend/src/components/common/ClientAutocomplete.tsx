import { useState, useMemo, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import { apiClient } from '../../utils/apiClient';
import type { Client } from '../../types';
import styles from './ClientAutocomplete.module.css';

interface ClientAutocompleteProps {
  value: string;
  onChange: (val: string) => void;
  onSelect: (client: Client) => void;
  placeholder?: string;
  required?: boolean;
  inputClassName?: string;
  isLocked?: boolean;
  onClear?: () => void;
}

const highlightMatch = (text: string, term: string) => {
  if (!term.trim()) return <span>{text}</span>;
  const safeTerm = term.trim().replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
  const parts = text.split(new RegExp(`(${safeTerm})`, 'gi'));
  return (
    <span>
      {parts.map((part, index) =>
        part.toLowerCase() === term.trim().toLowerCase() ? (
          <mark key={index} className={styles.matchHighlight}>
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </span>
  );
};

export function ClientAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder = 'Type client first name...',
  required = false,
  inputClassName = '',
  isLocked = false,
  onClear,
}: ClientAutocompleteProps) {
  const { token } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch all clients only if logged in
  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ['clients'],
    queryFn: () => apiClient.get<Client[]>('/api/clients'),
    enabled: !!token,
    staleTime: 60000,
  });

  // Filter clients based on query value
  const suggestions = useMemo(() => {
    const term = value.trim().toLowerCase();
    if (!term || !token) return [];

    return clients.filter((c) => {
      const fullName = `${c.firstName} ${c.lastName}`.toLowerCase();
      const phone = c.phoneNumber || '';
      return fullName.includes(term) || phone.includes(term);
    });
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

  if (isLocked) {
    return (
      <div ref={containerRef} className="flex-align-center" style={{ gap: '8px', width: '100%' }}>
        <div className={styles.lockedBadge}>
          <span style={{ fontSize: '16px' }}>👤</span>
          <span style={{ fontWeight: 600 }}>{value}</span>
        </div>
        {onClear && (
          <button type="button" onClick={onClear} className="btn-secondary">
            Change
          </button>
        )}
      </div>
    );
  }

  return (
    <div ref={containerRef} className={styles.container}>
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
      {isOpen && (suggestions.length > 0 || value.trim().length > 1) && (
        <div className={styles.dropdown}>
          {suggestions.length > 0 ? (
            suggestions.map((client) => (
              <div
                key={client.id}
                onClick={() => handleSuggestionClick(client)}
                className={styles.row}
              >
                <div>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                    {highlightMatch(`${client.firstName} ${client.lastName}`, value)}
                  </span>
                  {client.phoneNumber && (
                    <span className={styles.phoneSecondary}>
                      ({highlightMatch(client.phoneNumber, value)})
                    </span>
                  )}
                </div>
                {client.loyaltyPoints > 0 && (
                  <span className="micro-badge" style={{ padding: '2px 8px', fontSize: '8px' }}>
                    {client.loyaltyPoints} Pts
                  </span>
                )}
              </div>
            ))
          ) : (
            <div className={styles.emptyText}>
              No existing clients found — will register as new guest
            </div>
          )}
        </div>
      )}
    </div>
  );
}
