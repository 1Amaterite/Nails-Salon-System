import { Router } from 'express';
import { verifyJWT } from '../middlewares/auth.middleware';
import { dashboardStats } from '../controllers/branch.controller';
import authRoutes from './auth.routes';
import branchRoutes from './branch.routes';
import employeeRoutes from './employee.routes';
import serviceRoutes from './service.routes';
import inventoryRoutes from './inventory.routes';
import appointmentRoutes from './appointment.routes';

/**
 * Root API router.
 *
 * All routes are prefixed with `/api` by the Express app in `index.ts`.
 * Sub-routers are mounted here so that `index.ts` stays a clean bootstrap file.
 */
const router = Router();

router.use('/', authRoutes);
router.use('/branches', branchRoutes);
router.use('/employees', employeeRoutes);
router.use('/services', serviceRoutes);
router.use('/', inventoryRoutes);       // /inventory and /branches/:id/inventory
router.use('/', appointmentRoutes);     // /branches/:id/waitlist, /appointments, etc.

// ─── Legacy route aliases — keep frontend backward-compatible ─────────────────
// Old: GET /api/dashboard/:branchId  →  New: GET /api/branches/:branchId/dashboard
router.get('/dashboard/:branchId', verifyJWT, dashboardStats);

export default router;
