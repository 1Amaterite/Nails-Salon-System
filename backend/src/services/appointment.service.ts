import prisma from '../config/prisma';
import { addMinutesToTime } from '../utils/time';
import { AppointmentStatus, Prisma } from '@prisma/client';

// ─── Shared Appointment Include ───────────────────────────────────────────────
// Reused in all queries to avoid duplicating the deep-include shape.
const APPOINTMENT_INCLUDE = {
    client: true,
    employee: true,
    services: { include: { service: true } },
} as const;

// ─── Types ────────────────────────────────────────────────────────────────────

interface WaitlistEntry {
    firstName: string;
    phone: string;
    serviceId: string;
    employeeId?: string;
}

interface BookAppointmentPayload {
    firstName: string;
    lastName?: string;
    phone: string;
    serviceId: string;
    employeeId?: string;
    date: string;
    startTime: string;
}

// ─── Overlap Query Helper ─────────────────────────────────────────────────────

function buildOverlapWhere(
    employeeId: string,
    appointmentDate: Date,
    startTime: string,
    endTime: string
): Prisma.AppointmentWhereInput {
    return {
        employeeId,
        appointmentDate,
        status: { in: ['PENDING', 'CONFIRMED', 'IN_PROGRESS'] as AppointmentStatus[] },
        OR: [
            { startTime: { lte: startTime }, endTime: { gt: startTime } },
            { startTime: { lt: endTime }, endTime: { gte: endTime } },
            { startTime: { gte: startTime }, endTime: { lte: endTime } },
        ],
    };
}

// ─── Waitlist ─────────────────────────────────────────────────────────────────

/**
 * Returns today's WAITING and IN_PROGRESS queue entries for a branch.
 */
export async function getWaitlist(branchId: string) {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0); // Use UTC consistently with the rest of the service

    const waitlist = await prisma.appointment.findMany({
        where: {
            branchId,
            status: { in: ['WAITING', 'IN_PROGRESS'] },
            appointmentDate: { gte: today },
        },
        include: APPOINTMENT_INCLUDE,
        orderBy: { createdAt: 'asc' },
    });

    return waitlist.map((appt) => ({
        id: appt.id,
        firstName: appt.client?.firstName ?? 'Walk-in',
        phone: appt.client?.phoneNumber ?? '',
        service: appt.services.map((s) => s.service.name).join(', ') || 'N/A',
        stylist: appt.employee?.name ?? 'First Available Stylist',
        checkInTime: appt.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: appt.status,
    }));
}

/**
 * Registers a walk-in guest into the queue. Validates branch, service,
 * and optionally stylist before creating the appointment record.
 */
export async function addToWaitlist(branchId: string, payload: WaitlistEntry) {
    const { firstName, phone, serviceId, employeeId } = payload;

    const branchExists = await prisma.branch.findUnique({ where: { id: branchId } });
    if (!branchExists) throw Object.assign(new Error('Branch not found.'), { status: 404 });

    const serviceExists = await prisma.service.findFirst({ where: { id: serviceId, branchId } });
    if (!serviceExists) throw Object.assign(new Error('Service not found in this branch.'), { status: 404 });

    if (employeeId) {
        const emp = await prisma.employee.findFirst({
            where: {
                id: employeeId,
                branches: { some: { id: branchId } },
                isActive: true
            }
        });
        if (!emp) throw Object.assign(new Error('Stylist not found or inactive in this branch.'), { status: 404 });
    }

    return prisma.$transaction(async (tx) => {
        const cleanPhone = phone.trim();
        const client = await tx.client.upsert({
            where: { phoneNumber: cleanPhone },
            update: { firstName: firstName.trim() },
            create: { firstName: firstName.trim(), lastName: '', phoneNumber: cleanPhone },
        });

        const appointment = await tx.appointment.create({
            data: {
                branchId,
                clientId: client.id,
                employeeId: employeeId ?? null,
                appointmentDate: new Date(),
                status: 'WAITING',
                services: { create: { serviceId } },
            },
            include: APPOINTMENT_INCLUDE,
        });

        return {
            id: appointment.id,
            firstName: appointment.client.firstName,
            phone: appointment.client.phoneNumber ?? '',
            service: appointment.services.map((s) => s.service.name).join(', ') || 'N/A',
            stylist: appointment.employee?.name ?? 'First Available Stylist',
            checkInTime: appointment.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            status: appointment.status,
        };
    });
}

/**
 * Updates the status of a waitlist entry. Enforces branch-scoped access
 * for ADMIN callers.
 */
export async function updateWaitlistStatus(
    id: string,
    status: string,
    callerRole: string,
    callerBranchId: string
) {
    const appointment = await prisma.appointment.findUnique({
        where: { id },
        include: { branch: true },
    });

    if (!appointment) throw Object.assign(new Error('Waitlist entry not found.'), { status: 404 });

    if (callerRole === 'ADMIN' && appointment.branchId !== callerBranchId) {
        throw Object.assign(
            new Error('Access denied. You cannot modify queue entries of another branch.'),
            { status: 403 }
        );
    }

    const updated = await prisma.appointment.update({
        where: { id },
        data: { status: status as AppointmentStatus },
        include: APPOINTMENT_INCLUDE,
    });

    return {
        id: updated.id,
        firstName: updated.client.firstName,
        phone: updated.client.phoneNumber ?? '',
        service: updated.services.map((s) => s.service.name).join(', ') || 'N/A',
        stylist: updated.employee?.name ?? 'First Available Stylist',
        checkInTime: updated.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: updated.status,
    };
}

// ─── Scheduled Appointments ───────────────────────────────────────────────────

/**
 * Returns all scheduled (non-walk-in) appointments for a branch,
 * with optional date and status filters.
 */
export async function getAppointments(branchId: string, date?: string, status?: string) {
    const where: Record<string, unknown> = {
        branchId,
        startTime: { not: null }, // Distinguishes scheduled from walk-ins
    };

    if (date) where.appointmentDate = new Date(`${date}T00:00:00.000Z`);
    if (status) where.status = status;

    return prisma.appointment.findMany({
        where,
        include: APPOINTMENT_INCLUDE,
        orderBy: [{ appointmentDate: 'asc' }, { startTime: 'asc' }],
    });
}

/**
 * Books a scheduled appointment with conflict validation and optional
 * auto-assignment of the first available stylist.
 *
 * Algorithm:
 *  1. Validate date is not in the past.
 *  2. Fetch service duration to compute `endTime`.
 *  3a. If `employeeId` provided: verify the stylist is active, working,
 *      and has no overlapping booking.
 *  3b. If no `employeeId`: iterate branch staff to find the first free slot.
 *  4. Upsert the client record (phone as unique key).
 *  5. Create the appointment inside a transaction.
 */
export async function bookAppointment(branchId: string, payload: BookAppointmentPayload) {
    const { firstName, lastName, phone, serviceId, employeeId, date, startTime } = payload;

    // 1. Date validation
    const parsedDate = new Date(`${date}T00:00:00.000Z`);
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    if (parsedDate < today) {
        throw Object.assign(new Error('Cannot book appointments in the past.'), { status: 400 });
    }

    // 2. Fetch service to get total slot duration
    const service = await prisma.service.findFirst({ where: { id: serviceId, branchId } });
    if (!service) throw Object.assign(new Error('Service not found in this branch.'), { status: 404 });

    const duration = service.durationMinutes + service.bufferTime;
    const endTime = addMinutesToTime(startTime, duration);
    const dayOfWeek = parsedDate.getUTCDay();
    let selectedEmployeeId = employeeId ?? null;

    // 3. Stylist validation / auto-assignment
    if (selectedEmployeeId) {
        const stylist = await prisma.employee.findFirst({
            where: {
                id: selectedEmployeeId,
                branches: { some: { id: branchId } },
                isActive: true,
                role: { not: 'OWNER' }
            },
            include: {
                schedules: {
                    where: { dayOfWeek, branchId }
                }
            },
        });
        if (!stylist) {
            throw Object.assign(
                new Error('Preferred stylist is not active or not found in this branch.'),
                { status: 400 }
            );
        }

        const schedule = stylist.schedules[0];
        if (!schedule || schedule.isOff || !schedule.startTime || !schedule.endTime) {
            throw Object.assign(
                new Error('Preferred stylist is not scheduled to work on this day.'),
                { status: 400 }
            );
        }

        if (startTime < schedule.startTime || endTime > schedule.endTime) {
            throw Object.assign(
                new Error(`Preferred stylist is only available from ${schedule.startTime} to ${schedule.endTime}.`),
                { status: 400 }
            );
        }

        const overlap = await prisma.appointment.findFirst({
            where: buildOverlapWhere(selectedEmployeeId, parsedDate, startTime, endTime),
        });
        if (overlap) {
            throw Object.assign(
                new Error('The preferred stylist has a scheduling conflict during this time slot.'),
                { status: 400 }
            );
        }
    } else {
        // Auto-assign: batch-query all conflicts for the time window,
        // then pick the first candidate with no conflict — avoids N+1 DB hits.
        const candidates = await prisma.employee.findMany({
            where: {
                branches: { some: { id: branchId } },
                isActive: true,
                role: { not: 'OWNER' }
            },
            include: {
                schedules: {
                    where: { dayOfWeek, branchId }
                }
            },
        });

        // Fetch all conflicting appointments for the entire candidate pool at once.
        const conflictingAppointments = await prisma.appointment.findMany({
            where: {
                employeeId: { in: candidates.map((e) => e.id) },
                appointmentDate: parsedDate,
                status: { in: ['PENDING', 'CONFIRMED', 'IN_PROGRESS'] as AppointmentStatus[] },
                OR: [
                    { startTime: { lte: startTime }, endTime: { gt: startTime } },
                    { startTime: { lt: endTime }, endTime: { gte: endTime } },
                    { startTime: { gte: startTime }, endTime: { lte: endTime } },
                ],
            },
            select: { employeeId: true },
        });
        const busyEmployeeIds = new Set(
            conflictingAppointments.map((a) => a.employeeId).filter(Boolean)
        );

        let assignedEmp: (typeof candidates)[number] | null = null;
        for (const emp of candidates) {
            const schedule = emp.schedules[0];
            if (!schedule || schedule.isOff || !schedule.startTime || !schedule.endTime) continue;
            if (startTime < schedule.startTime || endTime > schedule.endTime) continue;
            if (!busyEmployeeIds.has(emp.id)) {
                assignedEmp = emp;
                break;
            }
        }

        if (!assignedEmp) {
            throw Object.assign(
                new Error('No stylists are available during this time slot.'),
                { status: 400 }
            );
        }
        selectedEmployeeId = assignedEmp.id;
    }

    // 4 & 5. Upsert client + create appointment in a transaction
    return prisma.$transaction(async (tx) => {
        const cleanPhone = phone.trim();
        const client = await tx.client.upsert({
            where: { phoneNumber: cleanPhone },
            update: { firstName: firstName.trim(), lastName: (lastName ?? '').trim() },
            create: {
                firstName: firstName.trim(),
                lastName: (lastName ?? '').trim(),
                phoneNumber: cleanPhone,
            },
        });

        return tx.appointment.create({
            data: {
                branchId,
                clientId: client.id,
                employeeId: selectedEmployeeId,
                appointmentDate: parsedDate,
                startTime,
                endTime,
                status: 'CONFIRMED',
                services: { create: { serviceId } },
            },
            include: APPOINTMENT_INCLUDE,
        });
    });
}

/**
 * Updates the status of a scheduled appointment.
 * Enforces branch-scoped access for ADMIN callers.
 */
export async function updateAppointmentStatus(
    id: string,
    status: string,
    callerRole: string,
    callerBranchId: string
) {
    const appointment = await prisma.appointment.findUnique({ where: { id } });
    if (!appointment) throw Object.assign(new Error('Appointment not found.'), { status: 404 });

    if (callerRole === 'ADMIN' && appointment.branchId !== callerBranchId) {
        throw Object.assign(
            new Error('Access denied. You cannot modify appointments of another branch.'),
            { status: 403 }
        );
    }

    return prisma.appointment.update({
        where: { id },
        data: { status: status as AppointmentStatus },
        include: APPOINTMENT_INCLUDE,
    });
}

/**
 * Deletes an appointment. Enforces branch-scoped access for ADMIN callers.
 */
export async function deleteAppointment(id: string, callerRole: string, callerBranchId: string) {
    const appointment = await prisma.appointment.findUnique({ where: { id } });
    if (!appointment) throw Object.assign(new Error('Appointment not found.'), { status: 404 });

    if (callerRole === 'ADMIN' && appointment.branchId !== callerBranchId) {
        throw Object.assign(
            new Error('Access denied. You cannot delete appointments of another branch.'),
            { status: 403 }
        );
    }

    await prisma.appointment.delete({ where: { id } });
}

const STANDARD_TIME_SLOTS = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30',
    '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
    '17:00', '17:30', '18:00', '18:30'
];

/**
 * Returns list of standard timeslots that are free for booking based on date, service duration, and preferred stylist.
 */
export async function getAvailableSlots(
    branchId: string,
    date: string,
    serviceId: string,
    employeeId?: string
) {
    const parsedDate = new Date(`${date}T00:00:00.000Z`);
    const dayOfWeek = parsedDate.getUTCDay();

    // 1. Fetch service to get duration
    const service = await prisma.service.findFirst({ where: { id: serviceId, branchId } });
    if (!service) throw Object.assign(new Error('Service not found in this branch.'), { status: 404 });
    const duration = service.durationMinutes + service.bufferTime;

    // 2. Fetch candidates (stylists)
    const candidates = await prisma.employee.findMany({
        where: {
            branches: { some: { id: branchId } },
            isActive: true,
            role: { not: 'OWNER' },
            ...(employeeId ? { id: employeeId } : {})
        },
        include: {
            schedules: {
                where: { dayOfWeek, branchId }
            }
        }
    });

    if (candidates.length === 0) {
        return [];
    }

    // 3. Fetch all active appointments for these candidates on this date to check overlaps
    const activeAppointments = await prisma.appointment.findMany({
        where: {
            employeeId: { in: candidates.map((c) => c.id) },
            appointmentDate: parsedDate,
            status: { in: ['PENDING', 'CONFIRMED', 'IN_PROGRESS'] as AppointmentStatus[] }
        },
        select: {
            employeeId: true,
            startTime: true,
            endTime: true
        }
    });

    const availableSlots: string[] = [];

    // Helper check conflict
    const hasConflict = (empId: string, start: string, end: string) => {
        return activeAppointments.some(
            (appt) =>
                appt.employeeId === empId &&
                appt.startTime &&
                appt.endTime &&
                ((appt.startTime <= start && appt.endTime > start) ||
                    (appt.startTime < end && appt.endTime >= end) ||
                    (appt.startTime >= start && appt.endTime <= end))
        );
    };

    // 4. Test each standard time slot
    for (const slotTime of STANDARD_TIME_SLOTS) {
        const slotEndTime = addMinutesToTime(slotTime, duration);

        const isFree = candidates.some((stylist) => {
            const schedule = stylist.schedules[0];
            if (!schedule || schedule.isOff || !schedule.startTime || !schedule.endTime) return false;
            if (slotTime < schedule.startTime || slotEndTime > schedule.endTime) return false;

            return !hasConflict(stylist.id, slotTime, slotEndTime);
        });

        if (isFree) {
            availableSlots.push(slotTime);
        }
    }

    return availableSlots;
}

interface CheckoutPayload {
    paymentMethod: 'CASH' | 'CARD' | 'GCASH';
    discountAmount: number;
    pointsApplied?: number;
    employeeId?: string | null;
}

/**
 * Checks out a completed appointment: calculates subtotal/total, marks appointment
 * status as COMPLETED, and creates corresponding Transaction and TransactionService records.
 */
export async function checkoutAppointment(
    id: string,
    payload: CheckoutPayload,
    callerRole: string,
    callerBranchId: string
) {
    const appointment = await prisma.appointment.findUnique({
        where: { id },
        include: {
            services: { include: { service: true } },
        },
    });

    if (!appointment) throw Object.assign(new Error('Appointment not found.'), { status: 404 });

    if (callerRole === 'ADMIN' && appointment.branchId !== callerBranchId) {
        throw Object.assign(
            new Error('Access denied. You cannot modify appointments of another branch.'),
            { status: 403 }
        );
    }

    if (appointment.status === 'COMPLETED') {
        throw Object.assign(new Error('This appointment has already been checked out.'), { status: 400 });
    }

    // Resolve employeeId to assign to transaction service details
    const chosenEmployeeId = payload.employeeId || appointment.employeeId;
    if (!chosenEmployeeId) {
        throw Object.assign(
            new Error('A stylist must be assigned to complete checkout.'),
            { status: 400 }
        );
    }

    // Verify the stylist exists and belongs to the same branch
    const stylist = await prisma.employee.findFirst({
        where: {
            id: chosenEmployeeId,
            branches: { some: { id: appointment.branchId } },
            isActive: true
        },
    });
    if (!stylist) {
        throw Object.assign(
            new Error('Assigned stylist is not active or not found in this branch.'),
            { status: 400 }
        );
    }

    // Fetch the current loyaltyEarnPercentage from the database
    const systemSetting = await prisma.systemSetting.findUnique({
        where: { key: 'loyaltyEarnPercentage' },
    });
    const earnPercentage = systemSetting ? parseInt(systemSetting.value, 10) : 5;

    // Compute totals
    const subtotal = appointment.services.reduce((sum, relation) => sum + Number(relation.service.price), 0);
    const pointsApplied = payload.pointsApplied || 0;
    const discount = payload.discountAmount;
    const tax = 0;

    // Total spent is the subtotal minus discount and points applied
    const total = Math.max(0, subtotal - discount - pointsApplied + tax);

    // Execute database operations inside a single transaction to guarantee consistency
    return prisma.$transaction(async (tx) => {
        // Retrieve client to check/update points
        const client = await tx.client.findFirst({
            where: { id: appointment.clientId, deletedAt: null },
        });

        if (!client) {
            throw Object.assign(new Error('Client not found or deleted.'), { status: 404 });
        }

        if (pointsApplied > 0) {
            if (client.loyaltyPoints < pointsApplied) {
                throw Object.assign(
                    new Error(`Insufficient loyalty points. Balance: ${client.loyaltyPoints}, Attempted to redeem: ${pointsApplied}`),
                    { status: 400 }
                );
            }
        }

        // 1. Update appointment status to COMPLETED and save employeeId if it changed/was assigned
        await tx.appointment.update({
            where: { id },
            data: {
                status: 'COMPLETED',
                employeeId: chosenEmployeeId,
            },
        });

        // 2. Create Transaction record (discountAmount stores total discount including points)
        const transaction = await tx.transaction.create({
            data: {
                branchId: appointment.branchId,
                appointmentId: appointment.id,
                clientId: appointment.clientId,
                subtotalAmount: subtotal,
                discountAmount: discount + pointsApplied,
                taxAmount: tax,
                totalAmount: total,
                paymentMethod: payload.paymentMethod,
                paymentStatus: 'PAID',
            },
        });

        // 3. Create TransactionService records
        for (const apptService of appointment.services) {
            await tx.transactionService.create({
                data: {
                    transactionId: transaction.id,
                    serviceId: apptService.serviceId,
                    employeeId: chosenEmployeeId,
                    priceCharged: apptService.service.price,
                },
            });
        }

        // Calculate points earned from the transaction's final total amount
        const pointsEarned = Math.floor(total * (earnPercentage / 100));
        const updatedPoints = client.loyaltyPoints - pointsApplied + pointsEarned;

        // 4. Update Client points
        await tx.client.update({
            where: { id: client.id },
            data: { loyaltyPoints: updatedPoints },
        });

        // 5. Log Loyalty Transactions
        if (pointsApplied > 0) {
            await tx.loyaltyTransaction.create({
                data: {
                    clientId: client.id,
                    amount: -pointsApplied,
                    type: 'REDEEMED',
                    description: `Redeemed ${pointsApplied} points (₱${pointsApplied}.00 discount) on checkout for appointment #${appointment.id}`,
                },
            });
        }

        if (pointsEarned > 0) {
            await tx.loyaltyTransaction.create({
                data: {
                    clientId: client.id,
                    amount: pointsEarned,
                    type: 'EARNED',
                    description: `Earned ${pointsEarned} points on payment for appointment #${appointment.id}`,
                },
            });
        }

        return transaction;
    });
}

/**
 * Returns a single appointment by ID with full details (services, client, employee).
 * Enforces branch-scoping logic for ADMINs.
 */
export async function getAppointmentById(id: string, callerRole: string, callerBranchId: string) {
    const appointment = await prisma.appointment.findUnique({
        where: { id },
        include: APPOINTMENT_INCLUDE,
    });

    if (!appointment) throw Object.assign(new Error('Appointment not found.'), { status: 404 });

    if (callerRole === 'ADMIN' && appointment.branchId !== callerBranchId) {
        throw Object.assign(
            new Error('Access denied. You cannot view appointments of another branch.'),
            { status: 403 }
        );
    }

    return appointment;
}
