import React from 'react';
import { PageHeader } from './PageHeader/PageHeader';

export interface PageWrapperProps {
  /** The main panel title rendered in accent serif font. */
  title: string;
  /** Subtitle/description rendered below the title in muted text. */
  subtitle?: string;
  /** Optional content placed on the right side of the header. */
  action?: React.ReactNode;
  /** The child elements to render below the header. */
  children: React.ReactNode;
  /** Whether to wrap the content in a glass-panel styled container (defaults to true). */
  glass?: boolean;
}

/**
 * PageWrapper standardizes page layouts across dashboard tabs.
 * It manages padding, margins, alignment, headers, and panel styling.
 */
export function PageWrapper({ title, subtitle, action, children, glass = true }: PageWrapperProps) {
  return (
    <div className={glass ? 'glass-panel' : ''}>
      <PageHeader title={title} subtitle={subtitle} action={action} />
      {children}
    </div>
  );
}
