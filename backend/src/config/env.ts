import dotenv from 'dotenv';

// Load environment variables before validation
dotenv.config();

/**
 * Centralized environment variable validation.
 *
 * Import constants from this module rather than reading
 * `process.env.*` directly — this guarantees the app
 * crashes at startup (not mid-request) if a required variable
 * is missing, and removes the need for non-null assertions (!)
 * scattered throughout the codebase.
 */

function requireEnv(name: string): string {
    const value = process.env[name];
    if (!value) {
        throw new Error(`Missing required environment variable: ${name}`);
    }
    return value;
}

export const JWT_SECRET = requireEnv('JWT_SECRET');
export const NODE_ENV = process.env.NODE_ENV || 'development';
export const IS_PRODUCTION = NODE_ENV === 'production';
export const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
