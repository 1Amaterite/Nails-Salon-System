/**
 * Formats a numeric value (or numeric string) as Philippine Peso (PHP ₱).
 * By default, uses local string formatting with 2 decimal places.
 */
export function formatCurrency(amount: number | string, includeDecimals = true): string {
  const value = typeof amount === 'number' ? amount : Number(amount);
  if (isNaN(value)) return includeDecimals ? '₱0.00' : '₱0';

  if (!includeDecimals) {
    return `₱${Math.floor(value).toLocaleString('en-US')}`;
  }

  return `₱${value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
