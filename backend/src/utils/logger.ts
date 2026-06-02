import pino from 'pino';

const isProduction = process.env.NODE_ENV === 'production';

/**
 * Application-wide logger.
 *
 * - Development : colorized, human-readable output via pino-pretty
 * - Production  : newline-delimited JSON — structured and ready for
 *                 Render / Datadog / any log aggregator pipeline.
 *
 * Usage:
 *   import { logger } from './utils/logger';
 *   logger.info('Server started');
 *   logger.error({ err }, 'Database connection failed');
 */
const logger = pino(
    {
        level: process.env.LOG_LEVEL || 'info',
        // Redact fields that must never appear in logs
        redact: {
            paths: ['*.passwordHash', '*.password', '*.token', 'req.headers.authorization'],
            censor: '[REDACTED]',
        },
        // Attach base metadata to every log line
        base: {
            service: 'nails-salon-backend',
            env: process.env.NODE_ENV || 'development',
        },
        timestamp: pino.stdTimeFunctions.isoTime,
    },
    isProduction
        ? pino.destination({ sync: false }) // async write → non-blocking in prod
        : pino.transport({
              target: 'pino-pretty',
              options: {
                  colorize: true,
                  translateTime: 'SYS:HH:MM:ss',
                  ignore: 'pid,hostname,service,env',
              },
          })
);

export { logger };
