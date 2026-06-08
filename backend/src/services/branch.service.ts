import prisma from '../config/prisma';
import { getStartOfTodayInPH } from '../utils/time';

/**
 * Returns all branches with their employees (passwords stripped)
 * and associated services.
 */
export async function getAllBranches() {
    const branches = await prisma.branch.findMany({
        include: {
            employees: { include: { schedules: true } },
            services: true,
        },
    });

    return branches.map((branch) => ({
        ...branch,
        employees: branch.employees.map(({ passwordHash: _ph, schedules, ...safeEmp }) => ({
            ...safeEmp,
            schedules: schedules.filter((s) => s.branchId === branch.id),
        })),
    }));
}

/**
 * Returns all active non-owner employees for a branch, password stripped.
 */
export async function getSchedulableStaff(branchId: string) {
    const employees = await prisma.employee.findMany({
        where: {
            branches: { some: { id: branchId } },
            role: { not: 'OWNER' },
            isActive: true,
        },
        include: {
            schedules: {
                where: { branchId },
            },
        },
    });

    return employees.map(({ passwordHash: _ph, ...safeEmp }) => safeEmp);
}

/**
 * Returns aggregated dashboard stats for a given branch.
 */
export async function getDashboardStats(branchId: string) {
    const todayPh = getStartOfTodayInPH();
    const tomorrowPh = new Date(todayPh.getTime() + 24 * 60 * 60 * 1000);

    const [totalAppointments, waitingQueue, employeeCount, serviceCount, todayAppointments, activeWaitlist] = await Promise.all([
        prisma.appointment.count({
            where: {
                branchId,
                appointmentDate: { gte: todayPh, lt: tomorrowPh },
            },
        }),
        prisma.appointment.count({ where: { branchId, status: 'WAITING' } }),
        prisma.employee.count({
            where: {
                branches: { some: { id: branchId } },
            },
        }),
        prisma.service.count({ where: { branchId } }),
        prisma.appointment.findMany({
            where: {
                branchId,
                appointmentDate: { gte: todayPh, lt: tomorrowPh },
            },
            include: {
                client: true,
            },
        }),
        prisma.appointment.findMany({
            where: {
                branchId,
                status: { in: ['WAITING', 'IN_PROGRESS'] },
                appointmentDate: { gte: todayPh },
            },
            include: {
                client: true,
            },
        }),
    ]);

    // Find unique clients checked in or booked today
    const clientsTodayMap = new Map<string, any>();
    for (const appt of [...todayAppointments, ...activeWaitlist]) {
        if (appt.client) {
            clientsTodayMap.set(appt.client.id, appt.client);
        }
    }

    const nowManila = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Manila' }));
    const todayMonth = nowManila.getMonth(); // 0-11
    const todayDay = nowManila.getDate();    // 1-31

    const birthdayCelebrants: string[] = [];
    for (const client of clientsTodayMap.values()) {
        if (client.birthday) {
            const bDate = new Date(client.birthday);
            if (bDate.getUTCMonth() === todayMonth && bDate.getUTCDate() === todayDay) {
                birthdayCelebrants.push(`${client.firstName} ${client.lastName || ''}`.trim());
            }
        }
    }

    return {
        appointmentsToday: totalAppointments,
        waitingQueueCount: waitingQueue,
        activeStylists: employeeCount,
        totalServices: serviceCount,
        birthdayCelebrants,
    };
}

/**
 * Retrieves the branch metadata (name, address, phone, email).
 */
export async function getBranchSettings(branchId: string) {
    const branch = await prisma.branch.findUnique({
        where: { id: branchId },
    });
    if (!branch) {
        throw Object.assign(new Error('Branch not found.'), { status: 404 });
    }

    return {
        name: branch.name,
        address: branch.address,
        phone: branch.phone,
        email: branch.email,
    };
}

/**
 * Updates branch metadata in a single database transaction.
 */
export async function updateBranchSettings(
    branchId: string,
    payload: {
        name: string;
        address?: string | null;
        phone?: string | null;
        email?: string | null;
    }
) {
    const { name, address, phone, email } = payload;

    const updatedBranch = await prisma.branch.update({
        where: { id: branchId },
        data: { name, address, phone, email },
    });

    return {
        name: updatedBranch.name,
        address: updatedBranch.address,
        phone: updatedBranch.phone,
        email: updatedBranch.email,
    };
}

/**
 * Creates a new branch.
 */
export async function createBranch(payload: {
    name: string;
    address?: string | null;
    phone?: string | null;
    email?: string | null;
}) {
    const { name, address, phone, email } = payload;

    return prisma.branch.create({
        data: {
            name,
            address: address || null,
            phone: phone || null,
            email: email || null,
        },
    });
}

/**
 * Deletes a branch. Prevents deleting the last remaining branch.
 */
export async function deleteBranch(id: string) {
    const branchCount = await prisma.branch.count();
    if (branchCount <= 1) {
        throw Object.assign(new Error('Cannot delete the last remaining branch.'), { status: 400 });
    }
    const branch = await prisma.branch.findUnique({ where: { id } });
    if (!branch) {
        throw Object.assign(new Error('Branch not found.'), { status: 404 });
    }
    await prisma.branch.delete({ where: { id } });
}
