import prisma from '../config/prisma';

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
        employees: branch.employees.map(({ passwordHash: _ph, ...safeEmp }) => safeEmp),
    }));
}

/**
 * Returns all active non-owner employees for a branch, password stripped.
 */
export async function getSchedulableStaff(branchId: string) {
    const employees = await prisma.employee.findMany({
        where: { branchId, role: { not: 'OWNER' }, isActive: true },
        include: { schedules: true },
    });

    return employees.map(({ passwordHash: _ph, ...safeEmp }) => safeEmp);
}

/**
 * Returns aggregated dashboard stats for a given branch.
 */
export async function getDashboardStats(branchId: string) {
    const todayUtc = new Date();
    todayUtc.setUTCHours(0, 0, 0, 0);
    const tomorrowUtc = new Date(todayUtc);
    tomorrowUtc.setUTCDate(todayUtc.getUTCDate() + 1);

    const [totalAppointments, waitingQueue, employeeCount, serviceCount, todayAppointments, activeWaitlist] = await Promise.all([
        prisma.appointment.count({
            where: {
                branchId,
                appointmentDate: { gte: todayUtc, lt: tomorrowUtc },
            },
        }),
        prisma.appointment.count({ where: { branchId, status: 'WAITING' } }),
        prisma.employee.count({ where: { branchId } }),
        prisma.service.count({ where: { branchId } }),
        prisma.appointment.findMany({
            where: {
                branchId,
                appointmentDate: { gte: todayUtc, lt: tomorrowUtc },
            },
            include: {
                client: true,
            },
        }),
        prisma.appointment.findMany({
            where: {
                branchId,
                status: { in: ['WAITING', 'IN_PROGRESS'] },
                appointmentDate: { gte: todayUtc },
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

    const now = new Date();
    const todayMonth = now.getMonth(); // 0-11
    const todayDay = now.getDate();    // 1-31

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
 * Retrieves the branch metadata and custom settings key-value pairs.
 */
export async function getBranchSettings(branchId: string) {
    const branch = await prisma.branch.findUnique({
        where: { id: branchId },
        include: { settings: true },
    });
    if (!branch) {
        throw Object.assign(new Error('Branch not found.'), { status: 404 });
    }

    const settingsMap = new Map(branch.settings.map((s) => [s.key, s.value]));

    return {
        name: branch.name,
        address: branch.address,
        phone: branch.phone,
        email: branch.email,
        settings: {
            loyalty_spend_per_point: settingsMap.get('loyalty_spend_per_point') ?? '10',
            loyalty_point_value: settingsMap.get('loyalty_point_value') ?? '1',
        },
    };
}

/**
 * Updates branch metadata and settings keys in a single database transaction.
 */
export async function updateBranchSettings(
    branchId: string,
    payload: {
        name: string;
        address?: string | null;
        phone?: string | null;
        email?: string | null;
        settings: {
            loyalty_spend_per_point: string;
            loyalty_point_value: string;
        };
    }
) {
    const { name, address, phone, email, settings } = payload;

    return prisma.$transaction(async (tx) => {
        // 1. Update general branch attributes
        const updatedBranch = await tx.branch.update({
            where: { id: branchId },
            data: { name, address, phone, email },
        });

        // 2. Upsert each custom setting key
        const settingsData = [
            { key: 'loyalty_spend_per_point', value: settings.loyalty_spend_per_point },
            { key: 'loyalty_point_value', value: settings.loyalty_point_value },
        ];

        for (const s of settingsData) {
            await tx.setting.upsert({
                where: {
                    branchId_key: {
                        branchId,
                        key: s.key,
                    },
                },
                update: { value: s.value },
                create: {
                    branchId,
                    key: s.key,
                    value: s.value,
                },
            });
        }

        return {
            name: updatedBranch.name,
            address: updatedBranch.address,
            phone: updatedBranch.phone,
            email: updatedBranch.email,
            settings: {
                loyalty_spend_per_point: settings.loyalty_spend_per_point,
                loyalty_point_value: settings.loyalty_point_value,
            },
        };
    });
}

