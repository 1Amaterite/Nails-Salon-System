import { ClipboardList } from 'lucide-react';
import { ModalShell, EmptyState } from '../../../components/common';
import type { Client, Appointment } from '../../../types';

interface ClientHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  isLoadingDetails: boolean;
  activeClientDetails?: Client | null;
}

export function ClientHistoryModal({
  isOpen,
  onClose,
  isLoadingDetails,
  activeClientDetails,
}: ClientHistoryModalProps) {
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
          ) : activeClientDetails?.appointments && activeClientDetails.appointments.length > 0 ? (
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
                            style={{ fontSize: '12.5px', color: 'var(--accent)', fontWeight: 500 }}
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
            onClick={onClose}
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
  );
}
