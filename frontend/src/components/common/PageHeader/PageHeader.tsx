import React from 'react';
import styles from './PageHeader.module.css';

export interface PageHeaderProps {
  /** The main panel title rendered in accent serif font. */
  title: string;
  /** Subtitle/description rendered below the title in muted text. */
  subtitle?: string;
  /**
   * Optional content placed on the right side of the header (e.g. a button, badge,
   * or any inline JSX). Rendered as-is with no extra wrapping styles.
   */
  action?: React.ReactNode;
  /** Override the bottom margin (default 24px). */
  marginBottom?: string | number;
}

/**
 * Reusable section header used at the top of every glass-panel tab.
 * Renders the title + optional subtitle on the left and an optional
 * action element (button, badge, etc.) on the right.
 */
export function PageHeader({ title, subtitle, action, marginBottom = '24px' }: PageHeaderProps) {
  return (
    <div className={styles.container} style={{ marginBottom }}>
      <div>
        <h3 className={styles.title}>{title}</h3>
        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
      </div>

      {action && <div className={styles.action}>{action}</div>}
    </div>
  );
}
