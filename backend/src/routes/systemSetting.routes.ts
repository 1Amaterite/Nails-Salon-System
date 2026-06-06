import { Router } from 'express';
import { verifyJWT } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/requireRole';
import {
    getLoyaltyEarnPercentage,
    updateLoyaltyEarnPercentage,
} from '../controllers/systemSetting.controller';

const router = Router();

// Retrieve is accessible to all logged-in users (so receptionist/staff can fetch it for checkout)
router.get('/system-settings/loyalty-earn-percentage', verifyJWT, getLoyaltyEarnPercentage);

// Updating the rate is strictly restricted to users with the OWNER role
router.put(
    '/system-settings/loyalty-earn-percentage',
    verifyJWT,
    requireRole('OWNER'),
    updateLoyaltyEarnPercentage
);

export default router;
