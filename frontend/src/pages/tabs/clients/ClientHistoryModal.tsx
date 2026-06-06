import { useState } from 'react';
import { ClipboardList, Award, Coins } from 'lucide-react';
import { ModalShell, EmptyState, LoadingSpinner } from '../../../components/common';
import type { Client, Appointment, LoyaltyTransaction } from '../../../types';

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
  const [activeSubTab, setActiveSubTab] = useState<'bookings' | 'loyalty'>('bookings');

  if (!isOpen) return null;

  return (
    <ModalShell maxWidth="540px">
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
            Client Profile Details
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13.5px', margin: 0 }}>
            {activeClientDetails
              ? `${activeClientDetails.firstName} ${activeClientDetails.lastName}`
              : 'Client'}
            's past appointments ledger and points record.
          </p>
        </div>

        <div style={{ padding: '24px 36px', overflowY: 'auto', flex: 1 }}>
          {isLoadingDetails ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
              <LoadingSpinner size="md" />
            </div>
          ) : (
            <>
              {/* Loyalty Points Balance Card */}
              <div
                style={{
                  marginBottom: '20px',
                  padding: '16px 20px',
                  borderRadius: '12px',
                  border: '1px solid #fbcfe8',
                  background: 'linear-gradient(135deg, #fdf2f8 0%, #ffffff 100%)',
                  boxShadow: 'var(--shadow-sm)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '1px',
                      color: 'var(--accent)',
                      display: 'block',
                    }}
                  >
                    Loyalty Points Balance
                  </span>
                  <span
                    style={{
                      fontSize: '28px',
                      fontWeight: 700,
                      color: 'var(--text-primary)',
                      fontFamily: 'monospace',
                      lineHeight: '1.2',
                      display: 'inline-block',
                      marginTop: '4px',
                    }}
                  >
                    {activeClientDetails?.loyaltyPoints ?? 0}
                  </span>
                  <span
                    style={{
                      fontSize: '12.5px',
                      color: 'var(--text-secondary)',
                      marginLeft: '6px',
                    }}
                  >
                    Points (₱{(activeClientDetails?.loyaltyPoints ?? 0).toFixed(2)} value)
                  </span>
                </div>
                <div
                  style={{
                    padding: '8px 12px',
                    borderRadius: '20px',
                    backgroundColor: 'rgba(209, 71, 119, 0.08)',
                    color: 'var(--accent)',
                    fontWeight: 600,
                    fontSize: '11px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <Award size={13} />
                  VIP Member
                </div>
              </div>

              {/* Sub-Tab Navigation Switcher */}
              <div
                style={{
                  display: 'flex',
                  borderBottom: '1px solid var(--border-color)',
                  marginBottom: '16px',
                }}
              >
                <button
                  type="button"
                  onClick={() => setActiveSubTab('bookings')}
                  style={{
                    padding: '8px 16px',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: activeSubTab === 'bookings' ? 'var(--accent)' : 'var(--text-secondary)',
                    backgroundColor: 'transparent',
                    border: 'none',
                    borderBottom: activeSubTab === 'bookings' ? '2px solid var(--accent)' : 'none',
                    cursor: 'pointer',
                  }}
                >
                  Bookings Queue
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSubTab('loyalty')}
                  style={{
                    padding: '8px 16px',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: activeSubTab === 'loyalty' ? 'var(--accent)' : 'var(--text-secondary)',
                    backgroundColor: 'transparent',
                    border: 'none',
                    borderBottom: activeSubTab === 'loyalty' ? '2px solid var(--accent)' : 'none',
                    cursor: 'pointer',
                  }}
                >
                  Points Ledger
                </button>
              </div>

              {/* Content Panel */}
              {activeSubTab === 'bookings' ? (
                activeClientDetails?.appointments && activeClientDetails.appointments.length > 0 ? (
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
                )
              ) : activeClientDetails?.loyaltyTransactions &&
                activeClientDetails.loyaltyTransactions.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {activeClientDetails.loyaltyTransactions.map((tx: LoyaltyTransaction) => {
                    const txDate = new Date(tx.createdAt).toLocaleDateString([], {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    });
                    const isPositive = tx.amount > 0;
                    return (
                      <div
                        key={tx.id}
                        style={{
                          padding: '12px 16px',
                          borderRadius: '8px',
                          border: '1px solid var(--border-color)',
                          backgroundColor: 'var(--bg-secondary)',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span
                              className="status-badge"
                              style={{
                                fontSize: '9px',
                                padding: '2px 8px',
                                backgroundColor:
                                  tx.type === 'EARNED'
                                    ? 'rgba(16, 185, 129, 0.08)'
                                    : tx.type === 'REDEEMED'
                                      ? 'rgba(239, 68, 68, 0.08)'
                                      : 'rgba(37, 99, 235, 0.08)',
                                color:
                                  tx.type === 'EARNED'
                                    ? 'var(--success-green)'
                                    : tx.type === 'REDEEMED'
                                      ? '#dc2626'
                                      : 'var(--accent-blue)',
                              }}
                            >
                              {tx.type.toLowerCase()}
                            </span>
                            <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                              {txDate}
                            </span>
                          </div>
                          <span
                            style={{
                              fontSize: '13px',
                              color: 'var(--text-primary)',
                              fontWeight: 500,
                            }}
                          >
                            {tx.description}
                          </span>
                        </div>
                        <span
                          style={{
                            fontFamily: 'monospace',
                            fontWeight: 700,
                            fontSize: '15px',
                            color: isPositive ? 'var(--success-green)' : '#dc2626',
                          }}
                        >
                          {isPositive ? `+${tx.amount}` : tx.amount} Pts
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <EmptyState
                  icon={<Coins size={32} />}
                  title="No points history"
                  description="This client hasn't earned or redeemed any loyalty points yet."
                />
              )}
            </>
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
            Close Profile
          </button>
        </div>
      </div>
    </ModalShell>
  );
}
