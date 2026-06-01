/**
 * Resolves the backend API base URL from the environment variable VITE_API_URL,
 * falling back to localhost in development or the production Render URL.
 * Trailing slashes are always stripped.
 */
export function getApiUrl(): string {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl) return envUrl.replace(/\/$/, '');

  const isLocal =
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1';

  return isLocal
    ? 'http://localhost:5001'
    : 'https://nails-salon-backend.onrender.com';
}

/**
 * Retrieves the stored auth token from sessionStorage.
 * Throws if no token is found (forces callers to handle auth errors uniformly).
 */
export function getAuthToken(): string {
  const token =
    sessionStorage.getItem('adminToken') || sessionStorage.getItem('ownerToken');
  if (!token) throw new Error('Authentication token missing. Please re-authenticate.');
  return token;
}
