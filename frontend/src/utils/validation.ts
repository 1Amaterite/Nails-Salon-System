/**
 * Shared regular expression validation patterns for input fields.
 */

// Matches standard formats: 09xxxxxxxxx or 09xx xxx xxxx
export const PHONE_REGEX = /^(09\d{9}|09\d{2}\s\d{3}\s\d{4})$/;

// HTML input pattern attribute string (escaped for JSX compatibility)
export const PHONE_PATTERN = '^(09\\d{9}|09\\d{2}\\s\\d{3}\\s\\d{4})$';

// Standard error description displayed to user
export const PHONE_TITLE = 'Phone number must be in format 09xxxxxxxxx or 09xx xxx xxxx';

/**
 * Validates a standard phone string against the salon format requirements.
 */
export function isValidPhone(phone: string): boolean {
  return PHONE_REGEX.test(phone.trim());
}
