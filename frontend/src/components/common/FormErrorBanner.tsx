export interface FormErrorBannerProps {
  /** Error message string. Renders nothing when empty/falsy. */
  message?: string;
}

/**
 * Inline error banner displayed inside a form when a submission fails.
 * Matches the existing red-tinted error box style used throughout the codebase.
 * Renders `null` when `message` is falsy so callers can always mount it
 * without extra conditionals.
 */
export function FormErrorBanner({ message }: FormErrorBannerProps) {
  if (!message) return null;

  return <div className="form-error-banner">{message}</div>;
}
