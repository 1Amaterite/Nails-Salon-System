import React from 'react';

export interface StatCardProps {
  /** Short text label above the value (e.g. "Today's Bookings"). */
  label: string;
  /**
   * The primary metric value. Accepts a ReactNode so callers can pass
   * numbers, formatted strings, dashes, etc.
   */
  value: React.ReactNode;
  /**
   * Icon element rendered inside the accent-tinted pill on the right.
   * Typically a Lucide icon at size={24}.
   */
  icon: React.ReactNode;
}

/**
 * KPI / statistic card used on dashboard and financial overview panels.
 * Renders a label + large value on the left, and an icon pill on the right,
 * matching the existing `stat-card` CSS class layout.
 */
export function StatCard({ label, value, icon }: StatCardProps) {
  return (
    <div
      className="stat-card"
      style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
    >
      <div>
        <div style={{ color: 'var(--text-secondary)', fontSize: '14px', fontWeight: 500 }}>
          {label}
        </div>
        <div className="stat-value">{value}</div>
      </div>
      <div
        style={{
          backgroundColor: 'var(--accent-glow)',
          padding: '12px',
          borderRadius: '12px',
          color: 'var(--accent)',
        }}
      >
        {icon}
      </div>
    </div>
  );
}
