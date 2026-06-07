import React from 'react';
import styles from './EmptyState.module.css';

export interface EmptyStateProps {
  /**
   * Lucide icon element (or any ReactNode) to display inside the accent-tinted
   * circle above the text.
   */
  icon: React.ReactNode;
  /** Bold heading under the icon. */
  title: string;
  /** Muted descriptive text below the title. */
  description: string;
}

/**
 * Consistent empty / placeholder state card used when a panel has no data to show.
 * Renders a centred icon circle, a title, and a description inside the existing
 * `empty-state-card` CSS class.
 */
export function EmptyState({ icon, title, description }: EmptyStateProps) {
  return (
    <div className="empty-state-card">
      <div className={styles.iconWrapper}>{icon}</div>
      <div className="empty-state-title">{title}</div>
      <div className="empty-state-desc">{description}</div>
    </div>
  );
}
