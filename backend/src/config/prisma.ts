import { PrismaClient } from '@prisma/client';

/**
 * Singleton Prisma client instance.
 * Importing from this module guarantees that a single connection pool
 * is shared across the entire application, preventing pool exhaustion.
 */
const prisma = new PrismaClient();

export default prisma;
