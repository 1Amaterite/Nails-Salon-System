import React, { createContext, useContext, useState, useCallback } from 'react';
import { Check, AlertCircle } from 'lucide-react';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error';
  isExiting: boolean;
}

interface ConfirmOptions {
  title: string;
  body: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
}

interface NotificationContextType {
  showToast: (message: string, type?: 'success' | 'error') => void;
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// Monotonic counter — guaranteed unique even under rapid toast firing.
let _toastCounter = 0;

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    body: string;
    confirmLabel: string;
    cancelLabel: string;
    isDestructive: boolean;
    resolve: ((value: boolean) => void) | null;
  } | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    const id = String(++_toastCounter);
    setToasts((prev) => [...prev, { id, message, type, isExiting: false }]);

    // Trigger exit animation after 3s
    setTimeout(() => {
      setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, isExiting: true } : t)));
      // Remove completely after animation finishes (300ms)
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 300);
    }, 3000);
  }, []);

  const confirm = useCallback(
    ({
      title,
      body,
      confirmLabel = 'Confirm',
      cancelLabel = 'Cancel',
      isDestructive = false,
    }: ConfirmOptions): Promise<boolean> => {
      return new Promise<boolean>((resolve) => {
        setConfirmModal({
          isOpen: true,
          title,
          body,
          confirmLabel,
          cancelLabel,
          isDestructive,
          resolve,
        });
      });
    },
    []
  );

  const handleConfirmClose = (result: boolean) => {
    if (confirmModal?.resolve) {
      confirmModal.resolve(result);
    }
    setConfirmModal(null);
  };

  return (
    <NotificationContext.Provider value={{ showToast, confirm }}>
      {children}

      {/* Toast Notifications List */}
      {toasts.length > 0 && (
        <div className="toast-container">
          {toasts.map((toast) => (
            <div key={toast.id} className={`toast-item ${toast.isExiting ? 'exit' : ''}`}>
              <div className={`toast-icon-wrapper ${toast.type}`}>
                {toast.type === 'success' ? <Check size={14} /> : <AlertCircle size={14} />}
              </div>
              <div className="toast-content">
                <p className="toast-message">{toast.message}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmModal && confirmModal.isOpen && (
        <div className="custom-modal-overlay" onClick={() => handleConfirmClose(false)}>
          <div className="custom-modal-container outer-bezel" onClick={(e) => e.stopPropagation()}>
            <div className="inner-core" style={{ padding: '28px' }}>
              <h3
                style={{
                  fontFamily: 'var(--font-serif)',
                  color: confirmModal.isDestructive ? '#dc2626' : 'var(--accent)',
                  fontSize: '20px',
                  fontWeight: 600,
                  margin: '0 0 12px 0',
                }}
              >
                {confirmModal.title}
              </h3>

              <p
                style={{
                  color: 'var(--text-secondary)',
                  fontSize: '14.5px',
                  lineHeight: '1.5',
                  margin: '0 0 24px 0',
                }}
              >
                {confirmModal.body}
              </p>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => handleConfirmClose(false)}
                  style={{
                    background: 'transparent',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-secondary)',
                    boxShadow: 'none',
                    padding: '8px 16px',
                    fontSize: '13.5px',
                  }}
                >
                  {confirmModal.cancelLabel}
                </button>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => handleConfirmClose(true)}
                  style={{
                    backgroundColor: confirmModal.isDestructive ? '#dc2626' : 'var(--accent)',
                    color: '#FFFFFF',
                    border: 'none',
                    padding: '8px 16px',
                    fontSize: '13.5px',
                  }}
                >
                  {confirmModal.confirmLabel}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </NotificationContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
}
