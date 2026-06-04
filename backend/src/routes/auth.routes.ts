import { Router } from 'express';
import { healthCheck, login, seedData } from '../controllers/auth.controller';
import { verifyJWT } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/requireRole';

const router = Router();

router.get('/health', healthCheck);
router.post('/login', login);

// ⚠️  OWNER-only — destroys and re-seeds the entire database.
// Protected so no anonymous caller can wipe production data.
router.post('/seed-initial-data', verifyJWT, requireRole('OWNER'), seedData);

export default router;
