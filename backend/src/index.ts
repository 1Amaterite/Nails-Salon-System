import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pinoHttp from 'pino-http';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

import { logger } from './utils/logger';
import { errorHandler } from './middlewares/errorHandler';
import prisma from './config/prisma';
import apiRouter from './routes';
import { IS_PRODUCTION, FRONTEND_URL } from './config/env';
import { Decimal } from '@prisma/client/runtime/library';

// Globally override Decimal serialization to return numbers in JSON responses
(Decimal.prototype as any).toJSON = function (this: Decimal) {
    return Number(this.toString());
};

// ─── Environment ──────────────────────────────────────────────────────────────

dotenv.config();

logger.info(
    {
        env: {
            NODE_ENV: process.env.NODE_ENV,
            PORT: process.env.PORT,
            HAS_JWT_SECRET: !!process.env.JWT_SECRET,
            HAS_DATABASE_URL: !!process.env.DATABASE_URL,
            HAS_DIRECT_URL: !!process.env.DIRECT_URL,
        },
    },
    'Starting Nails Salon Backend API...'
);

// JWT_SECRET is validated by the env.ts module at import time above.
// If it is missing the process will have already exited with an error.
logger.info({ isProduction: IS_PRODUCTION }, 'Environment validated successfully.');

// ─── App Bootstrap ────────────────────────────────────────────────────────────

const app = express();
const PORT = process.env.PORT || 5001;

// ─── Global Middlewares ───────────────────────────────────────────────────────

app.use(helmet());

app.use(
    pinoHttp({
        logger,
        autoLogging: {
            ignore: (req) => req.url === '/api/health',
        },
        customLogLevel: (_req, res) => {
            if (res.statusCode >= 500) return 'error';
            if (res.statusCode >= 400) return 'warn';
            return 'info';
        },
    })
);

const allowedOrigins = [
    'http://localhost:5173',
    'https://nails-salon-system-frontend.vercel.app'
];

if (FRONTEND_URL) {
    FRONTEND_URL.split(',').forEach(o => {
        const trimmed = o.trim();
        if (trimmed && !allowedOrigins.includes(trimmed)) {
            allowedOrigins.push(trimmed);
        }
    });
}

app.use(
    cors({
        origin: allowedOrigins,
        credentials: true,
    })
);
app.use(express.json());

// ─── Rate Limiting for Public Endpoints ────────────────────────────────────────

const publicRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: { error: 'Too many requests from this IP, please try again after 15 minutes.' },
    standardHeaders: true,
    legacyHeaders: false,
});

app.use('/api/branches/:branchId/waitlist', publicRateLimiter);
app.use('/api/branches/:branchId/appointments', publicRateLimiter);
app.use('/api/branches/:branchId/availability', publicRateLimiter);

// ─── API Routes ───────────────────────────────────────────────────────────────

app.use('/api', apiRouter);

// ─── Global Error Handler — MUST be last ─────────────────────────────────────

app.use(errorHandler);

// ─── Process-level Safety Net ─────────────────────────────────────────────────

process.on('uncaughtException', (err) => {
    logger.fatal({ err }, 'Uncaught Exception — shutting down');
    process.exit(1);
});

process.on('unhandledRejection', (reason) => {
    logger.fatal({ reason }, 'Unhandled Promise Rejection — shutting down');
    process.exit(1);
});

// ─── Startup Task: clean up orphaned OWNER schedules ─────────────────────────

async function cleanupOwnerSchedules(): Promise<void> {
    try {
        const deleted = await prisma.employeeSchedule.deleteMany({
            where: { employee: { role: 'OWNER' } },
        });
        if (deleted.count > 0) {
            logger.info({ count: deleted.count }, 'Deleted orphaned schedule records for Owner accounts');
        }
    } catch (err) {
        logger.error({ err }, 'Failed to clean up Owner schedules');
    }
}

// ─── Server Start ─────────────────────────────────────────────────────────────

app.listen(PORT, async () => {
    logger.info({ port: PORT }, 'Server is running');
    try {
        await prisma.$connect();
        logger.info('Database connection pool warmed up successfully');
    } catch (dbErr) {
        logger.error({ err: dbErr }, 'Failed to pre-warm database connection pool');
    }
    await cleanupOwnerSchedules();
});