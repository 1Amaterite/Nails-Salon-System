import { Router, Request, Response, NextFunction } from 'express';
import { healthCheck, login, seedData } from '../controllers/auth.controller';
import { verifyJWT } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/requireRole';
import prisma from '../config/prisma';

const router = Router();

router.get('/health', healthCheck);
router.post('/login', login);

// ⚠️ OWNER-only if database is already populated.
// If database is empty, anonymous calls are allowed to perform initial setup.
const seedMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const branchCount = await prisma.branch.count();
        if (branchCount === 0) {
            return next();
        }
        verifyJWT(req as any, res, () => {
            requireRole('OWNER')(req as any, res, next);
        });
    } catch (error) {
        next(error);
    }
};

router.post('/seed-initial-data', seedMiddleware, seedData);

export default router;
