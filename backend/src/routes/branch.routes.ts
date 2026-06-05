import { Router } from 'express';
import { verifyJWT } from '../middlewares/auth.middleware';
import { listBranches, listSchedulableStaff, dashboardStats, getBranchFinancials } from '../controllers/branch.controller';
import { getAvailability } from '../controllers/appointment.controller';

const router = Router();

router.get('/', listBranches);
router.get('/:branchId/schedulable-staff', verifyJWT, listSchedulableStaff);
router.get('/:branchId/dashboard', verifyJWT, dashboardStats);
router.get('/:branchId/availability', getAvailability);
router.get('/:branchId/financials', verifyJWT, getBranchFinancials);

export default router;
