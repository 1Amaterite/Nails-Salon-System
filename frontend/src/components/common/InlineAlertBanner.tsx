

export interface InlineAlertBannerProps {
  /** Visual variant — green for success, red for error. */
  type: 'success' | 'error';
  /** Alert message. Renders nothing when empty/falsy. */
  message?: string;
  /** Optional bottom margin. Defaults to '16px'. */
  marginBottom?: string | number;
}

const STYLES = {
  success: {
    color: '#15803d',
    backgroundColor: '#dcfce7',
    borderColor: '#bbf7d0',
  },
  error: {
    color: '#b91c1c',
    backgroundColor: '#fee2e2',
    borderColor: '#fecaca',
  },
} as const;

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

  const { color, backgroundColor, borderColor } = STYLES[type];

  return (
    <div
      style={{
        color,
        fontSize: '13.5px',
        backgroundColor,
        padding: '12px',
        borderRadius: '6px',
        border: `1px solid ${borderColor}`,
        marginBottom,
      }}
    >
      {message}
    </div>
  );
}
