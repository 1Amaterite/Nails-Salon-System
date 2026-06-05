import { Router } from 'express';
import { verifyJWT } from '../middlewares/auth.middleware';
import { listBranches, listSchedulableStaff, dashboardStats } from '../controllers/branch.controller';
import { getAvailability } from '../controllers/appointment.controller';
import { getBranchFinancials } from '../controllers/financials.controller';

const router = Router();

router.get('/', listBranches);
router.get('/:branchId/schedulable-staff', verifyJWT, listSchedulableStaff);
router.get('/:branchId/dashboard', verifyJWT, dashboardStats);
router.get('/:branchId/availability', getAvailability);
router.get('/:branchId/financials', verifyJWT, getBranchFinancials);

export default router;
