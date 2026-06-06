import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import {
    getWaitlist,
    addToWaitlist,
    updateWaitlistStatus,
    getAppointments,
    bookAppointment,
    updateAppointmentStatus,
    deleteAppointment,
    getAvailableSlots,
    checkoutAppointment as checkoutAppointmentService,
    getAppointmentById,
} from '../services/appointment.service';
import {
    CheckoutAppointmentSchema,
    CreateAppointmentSchema,
    CreateWaitlistEntrySchema,
} from '../validation/appointment.validation';
import { assertBranchAccess } from '../utils/assertBranchAccess';

const VALID_WAITLIST_STATUSES = ['WAITING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'] as const;
const VALID_APPOINTMENT_STATUSES = ['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW'] as const;

// ─── Waitlist ─────────────────────────────────────────────────────────────────

export async function listWaitlist(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    const { branchId } = req.params;
    const { role, branchId: callerBranchId } = req.user!;

    if (!assertBranchAccess(res, role, callerBranchId, branchId)) return;

    try {
        const waitlist = await getWaitlist(branchId);
        res.json(waitlist);
    } catch (error) {
        next(error);
    }
}

export async function joinWaitlist(req: Request, res: Response, next: NextFunction): Promise<void> {
    const { branchId } = req.params;

    const parsed = CreateWaitlistEntrySchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: parsed.error.issues[0].message });
        return;
    }

    try {
        const entry = await addToWaitlist(branchId, parsed.data);
        res.status(201).json(entry);
    } catch (error) {
        next(error);
    }
}

export async function patchWaitlistStatus(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    const { id } = req.params;
    const { status } = req.body;
    const { role, branchId: callerBranchId } = req.user!;

    if (!status || !(VALID_WAITLIST_STATUSES as readonly string[]).includes(status)) {
        res.status(400).json({ error: 'Valid status is required.' });
        return;
    }

    try {
        const entry = await updateWaitlistStatus(id, status, role, callerBranchId);
        res.json(entry);
    } catch (error) {
        next(error);
    }
}

// ─── Scheduled Appointments ───────────────────────────────────────────────────

export async function listAppointments(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    const { branchId } = req.params;
    const { date, status } = req.query as { date?: string; status?: string };
    const { role, branchId: callerBranchId } = req.user!;

    if (!assertBranchAccess(res, role, callerBranchId, branchId)) return;

    try {
        const appointments = await getAppointments(branchId, date, status);
        res.json(appointments);
    } catch (error) {
        next(error);
    }
}

export async function createAppointment(req: Request, res: Response, next: NextFunction): Promise<void> {
    const { branchId } = req.params;

    const parsed = CreateAppointmentSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: parsed.error.issues[0].message });
        return;
    }

    try {
        const appointment = await bookAppointment(branchId, parsed.data);
        res.status(201).json(appointment);
    } catch (error) {
        next(error);
    }
}

export async function patchAppointmentStatus(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    const { id } = req.params;
    const { status } = req.body;
    const { role, branchId: callerBranchId } = req.user!;

    if (!status || !(VALID_APPOINTMENT_STATUSES as readonly string[]).includes(status)) {
        res.status(400).json({ error: 'Valid status is required.' });
        return;
    }

    try {
        const appointment = await updateAppointmentStatus(id, status, role, callerBranchId);
        res.json(appointment);
    } catch (error) {
        next(error);
    }
}

export async function removeAppointment(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    const { id } = req.params;
    const { role, branchId: callerBranchId } = req.user!;

    try {
        await deleteAppointment(id, role, callerBranchId);
        res.json({ message: 'Appointment deleted successfully.' });
    } catch (error) {
        next(error);
    }
}

export async function getAvailability(req: Request, res: Response, next: NextFunction): Promise<void> {
    const { branchId } = req.params;
    const { date, serviceId, employeeId } = req.query as { date?: string; serviceId?: string; employeeId?: string };

    if (!date || !serviceId) {
        res.status(400).json({ error: 'Date and service ID query parameters are required.' });
        return;
    }

    try {
        const slots = await getAvailableSlots(branchId, date, serviceId, employeeId);
        res.json(slots);
    } catch (error) {
        next(error);
    }
}

export async function checkoutAppointment(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    const { id } = req.params;
    const { role, branchId: callerBranchId } = req.user!;

    const parsed = CheckoutAppointmentSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: parsed.error.issues[0].message });
        return;
    }

    try {
        const transaction = await checkoutAppointmentService(id, parsed.data, role, callerBranchId);
        res.status(200).json({ message: 'Checkout completed successfully.', transaction });
    } catch (error) {
        next(error);
    }
}

export async function getAppointment(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    const { id } = req.params;
    const { role, branchId } = req.user!;

    try {
        const appointment = await getAppointmentById(id, role, branchId);
        res.json(appointment);
    } catch (error) {
        next(error);
    }
}
