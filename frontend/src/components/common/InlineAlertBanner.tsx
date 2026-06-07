export interface InlineAlertBannerProps {
  /** Visual variant — green for success, red for error. */
  type: 'success' | 'error';
  /** Alert message. Renders nothing when empty/falsy. */
  message?: string;
  /** Optional bottom margin. Defaults to '16px'. */
  marginBottom?: string | number;
}

/**
 * Panel-level inline notification banner used to show transient success or
 * error messages inside a content panel (not inside a form field).
 * Auto-hides when `message` is falsy.
 */
export function InlineAlertBanner({
  type,
  message,
  marginBottom = '16px',
}: InlineAlertBannerProps) {
  if (!message) return null;

  return (
    <div className={`alert-banner alert-banner-${type}`} style={{ marginBottom }}>
      {message}
    </div>
  );
}
