import { Router } from 'express';
import { verifyJWT } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/requireRole';
import {
    listBranches,
    listSchedulableStaff,
    dashboardStats,
    getBranchFinancials,
    getBranchSettings,
    updateBranchSettings,
    create,
} from '../controllers/branch.controller';
import { getAvailability } from '../controllers/appointment.controller';

const router = Router();

router.get('/', listBranches);
router.post('/', verifyJWT, requireRole('OWNER'), create);
router.get('/:branchId/schedulable-staff', verifyJWT, listSchedulableStaff);
router.get('/:branchId/dashboard', verifyJWT, dashboardStats);
router.get('/:branchId/availability', getAvailability);
router.get('/:branchId/financials', verifyJWT, getBranchFinancials);
router.get('/:branchId/settings', verifyJWT, getBranchSettings);
router.put('/:branchId/settings', verifyJWT, updateBranchSettings);

export default router;
