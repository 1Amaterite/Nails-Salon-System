import { useState, useMemo } from 'react';
import { CreditCard, ShoppingBag, X } from 'lucide-react';
import { ModalShell } from '../../../components/common';
import type { Appointment, Employee } from '../../../types';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    paymentMethod: 'CASH' | 'CARD' | 'GCASH';
    discountAmount: number;
    pointsApplied?: number;
    employeeId?: string | null;
  }) => void;
  appointment: Appointment | null;
  employees: Employee[];
  isPending: boolean;
}

export function CheckoutModal({
  isOpen,
  onClose,
  onSubmit,
  appointment,
  employees,
  isPending,
}: CheckoutModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD' | 'GCASH'>('CASH');
  const [discountInput, setDiscountInput] = useState('0');
  const [pointsAppliedInput, setPointsAppliedInput] = useState('0');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(() => appointment?.employeeId || '');

  // Filter branch stylists
  const stylists = useMemo(() => {
    return employees.filter((e) => e.isActive && e.role !== 'OWNER');
  }, [employees]);

  // Compute subtotal
  const subtotal = useMemo(() => {
    if (!appointment?.services) return 0;
    return appointment.services.reduce(
      (sum, relation) => sum + Number(relation.service?.price ?? 0),
      0
    );
  }, [appointment]);

  const availablePoints = appointment?.client?.loyaltyPoints || 0;
  const discountAmount = Number(discountInput) || 0;

  // Enforce that you cannot redeem more than subtotal - discountAmount
  const maxPointsRedeemable = Math.max(0, Math.floor(subtotal - discountAmount));
  const pointsApplied = Math.min(
    availablePoints,
    maxPointsRedeemable,
    Number(pointsAppliedInput) || 0
  );

  const totalAmount = Math.max(0, subtotal - discountAmount - pointsApplied);

  if (!isOpen || !appointment) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      paymentMethod,
      discountAmount,
      pointsApplied,
      employeeId: selectedEmployeeId || undefined,
    });
  };

  return (
    <ModalShell maxWidth="460px">
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
            padding: '20px 24px 14px 24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <h3
              style={{
                fontFamily: 'var(--font-serif)',
                color: 'var(--accent)',
                fontSize: '19px',
                fontWeight: 600,
                margin: 0,
              }}
            >
              Billing Checkout
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '12.5px', margin: '4px 0 0 0' }}>
              Verify treatment totals and record client payment.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-secondary)',
              padding: '4px',
            }}
          >
            <X size={18} />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              padding: '20px 24px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            {/* Client summary */}
            <div
              style={{
                padding: '12px 16px',
                borderRadius: '8px',
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
              }}
            >
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Client Name</div>
              <div
                style={{
                  fontWeight: 600,
                  fontSize: '15px',
                  color: 'var(--text-primary)',
                  marginTop: '2px',
                }}
              >
                {appointment.client?.firstName} {appointment.client?.lastName || ''}
              </div>
            </div>

            {/* List of services */}
            <div>
              <div
                style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  color: 'var(--text-secondary)',
                  marginBottom: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <ShoppingBag size={13} /> Selected Treatments
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {appointment.services?.map((relation, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: '13.5px',
                      padding: '4px 0',
                      borderBottom: '1px dashed var(--border-color)',
                    }}
                  >
                    <span style={{ color: 'var(--text-primary)' }}>{relation.service?.name}</span>
                    <span
                      style={{
                        fontWeight: 600,
                        color: 'var(--text-primary)',
                        fontFamily: 'monospace',
                      }}
                    >
                      ₱{Number(relation.service?.price ?? 0).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Stylist Selector */}
            <div className="form-group">
              <label className="form-label">Performing Stylist *</label>
              <select
                value={selectedEmployeeId}
                onChange={(e) => setSelectedEmployeeId(e.target.value)}
                required
              >
                <option value="" disabled>
                  Select a stylist...
                </option>
                {stylists.map((stylist) => (
                  <option key={stylist.id} value={stylist.id}>
                    {stylist.name} ({stylist.specialty || 'Stylist'})
                  </option>
                ))}
              </select>
            </div>

            {/* Payment Method Selector */}
            <div className="form-group">
              <label className="form-label">Payment Method *</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {(['CASH', 'CARD', 'GCASH'] as const).map((method) => (
                  <button
                    key={method}
                    type="button"
                    className={`btn-primary ${paymentMethod === method ? '' : 'btn-secondary'}`}
                    onClick={() => setPaymentMethod(method)}
                    style={{
                      flex: 1,
                      padding: '8px 0',
                      fontSize: '12.5px',
                      boxShadow: 'none',
                      backgroundColor: paymentMethod === method ? 'var(--accent)' : 'transparent',
                      color: paymentMethod === method ? '#fff' : 'var(--text-secondary)',
                      borderColor:
                        paymentMethod === method ? 'var(--accent)' : 'var(--border-color)',
                    }}
                  >
                    {method}
                  </button>
                ))}
              </div>
            </div>

            {/* Adjustments: Discount */}
            <div className="form-group">
              <label className="form-label">Discount Amount (₱)</label>
              <input
                type="number"
                min="0"
                max={subtotal.toString()}
                step="0.01"
                value={discountInput}
                onChange={(e) => {
                  setDiscountInput(e.target.value);
                  // Reset points to apply when discount changes to avoid exceeding total
                  setPointsAppliedInput('0');
                }}
              />
            </div>

            {/* Loyalty Points Redemption */}
            <div
              style={{
                padding: '14px 16px',
                borderRadius: '8px',
                backgroundColor: 'rgba(209, 71, 119, 0.03)',
                border: '1px solid #fbcfe8',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <div
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Redeem Loyalty Points
                </span>
                <span
                  className="micro-badge"
                  style={{
                    fontSize: '9.5px',
                    padding: '3px 8px',
                    backgroundColor: 'var(--bg-secondary)',
                    borderColor: 'var(--border-color-hover)',
                  }}
                >
                  Available: {availablePoints} Pts (₱{availablePoints.toFixed(2)})
                </span>
              </div>

              <div className="form-group" style={{ gap: '4px' }}>
                <input
                  type="number"
                  min="0"
                  max={Math.min(availablePoints, maxPointsRedeemable).toString()}
                  step="1"
                  placeholder="Enter points to redeem..."
                  value={pointsAppliedInput}
                  onChange={(e) => {
                    const val = e.target.value;
                    const numVal = parseInt(val, 10) || 0;
                    const maxVal = Math.min(availablePoints, maxPointsRedeemable);
                    if (numVal > maxVal) {
                      setPointsAppliedInput(maxVal.toString());
                    } else if (numVal < 0) {
                      setPointsAppliedInput('0');
                    } else {
                      setPointsAppliedInput(val);
                    }
                  }}
                />
                {pointsApplied > 0 && (
                  <span
                    style={{ fontSize: '11.5px', color: 'var(--success-green)', fontWeight: 500 }}
                  >
                    ✓ Applying ₱{pointsApplied.toFixed(2)} discount (1 Pt = ₱1)
                  </span>
                )}
              </div>
            </div>

            {/* Invoice Breakdown */}
            <div
              style={{
                borderTop: '1px solid var(--border-color)',
                paddingTop: '16px',
                marginTop: '8px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '13px',
                  color: 'var(--text-secondary)',
                }}
              >
                <span>Subtotal</span>
                <span>₱{subtotal.toFixed(2)}</span>
              </div>
              {discountAmount > 0 && (
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '13px',
                    color: '#dc2626',
                  }}
                >
                  <span>Discount</span>
                  <span>- ₱{discountAmount.toFixed(2)}</span>
                </div>
              )}
              {pointsApplied > 0 && (
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '13px',
                    color: 'var(--success-green)',
                  }}
                >
                  <span>Points Applied</span>
                  <span>- ₱{pointsApplied.toFixed(2)}</span>
                </div>
              )}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '15px',
                  fontWeight: 700,
                  color: 'var(--accent)',
                  borderTop: '1px dashed var(--border-color)',
                  paddingTop: '8px',
                  marginTop: '4px',
                }}
              >
                <span>Total Due</span>
                <span style={{ fontSize: '18px', fontFamily: 'monospace' }}>
                  ₱{totalAmount.toFixed(2)}
                </span>
              </div>
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
              padding: '14px 24px 20px 24px',
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
            <button
              type="submit"
              className="btn-primary"
              disabled={isPending}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <CreditCard size={14} />
              {isPending ? 'Processing...' : 'Submit Checkout'}
            </button>
          </div>
        </form>
      </div>
    </ModalShell>
  );
}
