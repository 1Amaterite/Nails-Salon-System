import { Router } from 'express';
import { verifyJWT } from '../middlewares/auth.middleware';
import { listBranches, listSchedulableStaff, dashboardStats } from '../controllers/branch.controller';

const router = Router();

router.get('/', listBranches);
router.get('/:branchId/schedulable-staff', verifyJWT, listSchedulableStaff);
// RESTful route (preferred)
router.get('/:branchId/dashboard', verifyJWT, dashboardStats);

export default router;
