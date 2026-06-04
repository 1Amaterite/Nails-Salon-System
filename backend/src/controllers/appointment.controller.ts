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
} from '../services/appointment.service';

const VALID_WAITLIST_STATUSES = ['WAITING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'] as const;
const VALID_APPOINTMENT_STATUSES = ['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW'] as const;

// ─── Waitlist ─────────────────────────────────────────────────────────────────

export async function listWaitlist(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    const { branchId } = req.params;
    const { role, branchId: callerBranchId } = req.user!;

    if (role === 'ADMIN' && branchId !== callerBranchId) {
        res.status(403).json({ error: "Access denied. You can only access your own branch's waitlist." });
        return;
    }

    try {
        const waitlist = await getWaitlist(branchId);
        res.json(waitlist);
    } catch (error) {
        next(error);
    }
}

export async function joinWaitlist(req: Request, res: Response, next: NextFunction): Promise<void> {
    const { branchId } = req.params;
    const { firstName, phone, serviceId, employeeId } = req.body;

    if (!firstName || !phone || !serviceId) {
        res.status(400).json({ error: 'First name, phone number, and service ID are required.' });
        return;
    }

    try {
        const entry = await addToWaitlist(branchId, { firstName, phone, serviceId, employeeId });
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

    if (role === 'ADMIN' && branchId !== callerBranchId) {
        res.status(403).json({ error: "Access denied. You can only access your own branch's appointments." });
        return;
    }

    try {
        const appointments = await getAppointments(branchId, date, status);
        res.json(appointments);
    } catch (error) {
        next(error);
    }
}

export async function createAppointment(req: Request, res: Response, next: NextFunction): Promise<void> {
    const { branchId } = req.params;
    const { firstName, phone, serviceId, date, startTime } = req.body;

    if (!firstName || !phone || !serviceId || !date || !startTime) {
        res.status(400).json({ error: 'First name, phone number, service, date, and start time are required.' });
        return;
    }

    try {
        const appointment = await bookAppointment(branchId, req.body);
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
