import React from 'react';

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
export function PageHeader({
  title,
  subtitle,
  action,
  marginBottom = '24px',
}: PageHeaderProps) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom,
        flexWrap: 'wrap',
        gap: '12px',
      }}
    >
      <div>
        <h3
          style={{
            color: 'var(--accent)',
            marginTop: 0,
            marginBottom: 0,
            fontFamily: 'var(--font-serif)',
            fontSize: '20px',
            fontWeight: 600,
          }}
        >
          {title}
        </h3>
        {subtitle && (
          <p
            style={{
              color: 'var(--text-secondary)',
              fontSize: '14px',
              marginTop: '4px',
              marginBottom: 0,
            }}
          >
            {subtitle}
          </p>
        )}
      </div>

      {action && <div style={{ flexShrink: 0 }}>{action}</div>}
    </div>
  );
}
