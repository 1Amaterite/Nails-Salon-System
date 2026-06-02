import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

const isProduction = process.env.NODE_ENV === 'production';

// ─── Known Prisma Error Codes ────────────────────────────────────────────────
const PRISMA_ERROR_MAP: Record<string, { status: number; message: string }> = {
    P2002: { status: 409, message: 'A record with that unique value already exists.' },
    P2003: { status: 409, message: 'Cannot complete this action due to a related record constraint.' },
    P2025: { status: 404, message: 'The requested record was not found.' },
    P2014: { status: 400, message: 'The change you are trying to make would violate a required relation.' },
};

// ─── Error Shape ─────────────────────────────────────────────────────────────
interface AppError extends Error {
    status?: number;
    code?: string;       // Prisma error code
    meta?: unknown;      // Prisma error metadata
    isOperational?: boolean;
}

/**
 * Global Express error-handling middleware.
 *
 * Must be registered LAST — after all routes — with exactly 4 arguments
 * so Express recognises it as an error handler.
 *
 * Responsibilities:
 *  1. Log the full error internally (with stack) for debugging.
 *  2. Map Prisma-specific error codes to clean HTTP responses.
 *  3. Return a sanitized JSON body — never leaking raw stacks to the client
 *     in production.
 *  4. Never crash the process for operational (expected) errors.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: AppError, req: Request, res: Response, _next: NextFunction): void {
    // ── 1. Internal logging ────────────────────────────────────────────────
    logger.error(
        {
            err: {
                message: err.message,
                code: err.code,
                stack: err.stack,
                meta: err.meta,
            },
            req: {
                method: req.method,
                url: req.url,
                ip: req.ip,
            },
        },
        'Unhandled error caught by global error handler'
    );

    // ── 2. Prisma-specific error mapping ──────────────────────────────────
    if (err.code && PRISMA_ERROR_MAP[err.code]) {
        const mapped = PRISMA_ERROR_MAP[err.code];
        res.status(mapped.status).json({ error: mapped.message });
        return;
    }

    // ── 3. Operational errors (errors thrown intentionally with a status) ──
    if (err.isOperational && err.status) {
        res.status(err.status).json({ error: err.message });
        return;
    }

    // ── 4. Unknown / programming errors ───────────────────────────────────
    const statusCode = err.status && err.status >= 400 && err.status < 600 ? err.status : 500;

    res.status(statusCode).json({
        error: isProduction
            ? 'An unexpected error occurred. Please try again later.'
            : err.message || 'Internal Server Error',
        // Only expose the stack in development — never in production
        ...(isProduction ? {} : { stack: err.stack }),
    });
}
