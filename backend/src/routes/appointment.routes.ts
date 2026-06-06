import { Router } from 'express';
import { verifyJWT } from '../middlewares/auth.middleware';
import {
    listWaitlist,
    joinWaitlist,
    patchWaitlistStatus,
    listAppointments,
    createAppointment,
    patchAppointmentStatus,
    removeAppointment,
    checkoutAppointment,
    getAppointment,
} from '../controllers/appointment.controller';

const router = Router();

// ─── Waitlist ─────────────────────────────────────────────────────────────────
router.get('/branches/:branchId/waitlist', verifyJWT, listWaitlist);
router.post('/branches/:branchId/waitlist', joinWaitlist);               // Public — walk-ins self-register
router.put('/waitlist/:id/status', verifyJWT, patchWaitlistStatus);

// ─── Scheduled Appointments ───────────────────────────────────────────────────
router.get('/branches/:branchId/appointments', verifyJWT, listAppointments);
router.post('/branches/:branchId/appointments', createAppointment);      // Public — clients book online
router.put('/appointments/:id/status', verifyJWT, patchAppointmentStatus);
router.delete('/appointments/:id', verifyJWT, removeAppointment);
router.post('/appointments/:id/checkout', verifyJWT, checkoutAppointment);
router.get('/appointments/:id', verifyJWT, getAppointment);

export default router;
