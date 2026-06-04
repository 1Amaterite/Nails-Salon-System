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

    const [totalAppointments, waitingQueue, employeeCount, serviceCount] = await Promise.all([
        prisma.appointment.count({
            where: {
                branchId,
                appointmentDate: { gte: todayUtc, lt: tomorrowUtc },
            },
        }),
        prisma.appointment.count({ where: { branchId, status: 'WAITING' } }),
        prisma.employee.count({ where: { branchId } }),
        prisma.service.count({ where: { branchId } }),
    ]);

    return {
        appointmentsToday: totalAppointments,
        waitingQueueCount: waitingQueue,
        activeStylists: employeeCount,
        totalServices: serviceCount,
    };
}
