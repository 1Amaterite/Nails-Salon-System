import React from 'react';
import styles from './StatCard.module.css';

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
    <div className={`stat-card ${styles.cardLayout}`}>
      <div>
        <div className={styles.label}>{label}</div>
        <div className="stat-value">{value}</div>
      </div>
      <div className={styles.iconWrapper}>{icon}</div>
    </div>
  );
}
