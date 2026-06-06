import prisma from '../config/prisma';
import bcrypt from 'bcryptjs';
import { Prisma, EmployeeRole } from '@prisma/client';

interface CreateEmployeePayload {
    name: string;
    username?: string;
    password?: string;
    role: EmployeeRole;
    phoneNumber: string;
    specialty?: string;
    branchId: string;
}

interface UpdateEmployeePayload {
    name?: string;
    username?: string;
    password?: string;
    role?: EmployeeRole;
    phoneNumber?: string;
    specialty?: string;
    isActive?: boolean;
    branchId?: string;
    schedules?: Array<{
        dayOfWeek: number;
        startTime: string;
        endTime: string;
        isOff: boolean;
        branchId?: string;
    }>;
}

/**
 * Creates a new employee with optional credentials (for ADMIN/OWNER roles)
 * and a default 7-day schedule.
 */
export async function createEmployee(payload: CreateEmployeePayload) {
    const { name, username, password, role, phoneNumber, specialty, branchId } = payload;

    let passwordHash: string | null = null;
    let finalUsername: string | null = null;

    if (role === 'ADMIN' || role === 'OWNER') {
        if (!username || !password) {
            throw Object.assign(
                new Error('Username and password are required for admin and owner roles.'),
                { status: 400 }
            );
        }
        finalUsername = username.toLowerCase().trim();
        const existing = await prisma.employee.findUnique({ where: { username: finalUsername } });
        if (existing) {
            throw Object.assign(new Error('Username already taken.'), { status: 400 });
        }
        passwordHash = await bcrypt.hash(password, 10);
    }

    const employeeData: Prisma.EmployeeCreateInput = {
        name,
        username: finalUsername,
        passwordHash,
        role,
        phoneNumber,
        specialty,
        branches: { connect: { id: branchId } },
    };

    if (role !== 'OWNER') {
        employeeData.schedules = {
            createMany: {
                data: Array.from({ length: 7 }, (_, i) => ({
                    branchId,
                    dayOfWeek: i,
                    startTime: '09:00',
                    endTime: '17:00',
                    isOff: i === 0,
                })),
            },
        };
    }

    const newEmployee = await prisma.employee.create({
        data: employeeData,
        include: { schedules: true },
    });

    return {
        id: newEmployee.id,
        name: newEmployee.name,
        username: newEmployee.username,
        role: newEmployee.role,
        phoneNumber: newEmployee.phoneNumber,
        specialty: newEmployee.specialty,
        schedules: newEmployee.schedules,
    };
}

/**
 * Updates an existing employee. Handles credential management (hash new
 * passwords, clear credentials on demotion to STAFF) and schedule replacement.
 */
export async function updateEmployee(id: string, payload: UpdateEmployeePayload, editorRole: string, editorBranchId?: string) {
    const { name, username, password, role, phoneNumber, specialty, isActive, branchId, schedules } = payload;

    const employee = await prisma.employee.findUnique({
        where: { id },
        include: { branches: true },
    });
    if (!employee) {
        throw Object.assign(new Error('Employee not found.'), { status: 404 });
    }

    if (editorRole === 'ADMIN') {
        const hasBranch = employee.branches.some((b) => b.id === editorBranchId);
        if (!hasBranch) {
            throw Object.assign(new Error('Admins can only edit employees in their own branch.'), { status: 403 });
        }
        if (employee.role !== 'STAFF') {
            throw Object.assign(new Error('Admins can only edit employees with STAFF role.'), { status: 403 });
        }
        if (role && role !== 'STAFF') {
            throw Object.assign(new Error('Admins can only keep employees in STAFF role.'), { status: 403 });
        }
    }

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber;
    if (specialty !== undefined) updateData.specialty = specialty;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (role !== undefined) updateData.role = role;
    if (branchId !== undefined) {
        updateData.branches = {
            connect: { id: branchId }
        };
    }

    const targetRole = role || employee.role;
    if (targetRole === 'ADMIN' || targetRole === 'OWNER') {
        if (username !== undefined) {
            const finalUsername = username.toLowerCase().trim();
            if (finalUsername !== employee.username) {
                const existing = await prisma.employee.findUnique({ where: { username: finalUsername } });
                if (existing) {
                    throw Object.assign(new Error('Username already taken.'), { status: 400 });
                }
                updateData.username = finalUsername;
            }
        }
        if (password) {
            updateData.passwordHash = await bcrypt.hash(password, 10);
        }
    } else {
        // Demoted to STAFF — clear login credentials
        updateData.username = null;
        updateData.passwordHash = null;
    }

    if (schedules !== undefined && Array.isArray(schedules)) {
        const effectiveRole = role || employee.role;
        if (effectiveRole === 'OWNER') {
            throw Object.assign(new Error('Owners cannot have shift schedules assigned.'), { status: 400 });
        }

        const targetSchedBranchId = schedules[0]?.branchId || branchId || editorBranchId || employee.branches[0]?.id;
        if (!targetSchedBranchId) {
            throw Object.assign(new Error('Branch ID is required for schedule updates.'), { status: 400 });
        }

        // Atomically replace the schedule: delete old rows then insert new ones.
        // Wrapping in a transaction ensures we never end up with zero schedules
        // if the createMany fails.
        await prisma.$transaction([
            prisma.employeeSchedule.deleteMany({
                where: { employeeId: id, branchId: targetSchedBranchId },
            }),
            prisma.employeeSchedule.createMany({
                data: schedules.map((s) => ({
                    employeeId: id,
                    branchId: targetSchedBranchId,
                    dayOfWeek: s.dayOfWeek,
                    startTime: s.startTime,
                    endTime: s.endTime,
                    isOff: s.isOff,
                })),
            }),
        ]);
    }

    const updatedEmployee = await prisma.employee.update({
        where: { id },
        data: updateData as Prisma.EmployeeUpdateInput,
        include: { schedules: true },
    });

    return {
        id: updatedEmployee.id,
        name: updatedEmployee.name,
        username: updatedEmployee.username,
        role: updatedEmployee.role,
        phoneNumber: updatedEmployee.phoneNumber,
        specialty: updatedEmployee.specialty,
        isActive: updatedEmployee.isActive,
        schedules: updatedEmployee.schedules,
    };
}

/**
 * Deletes an employee. Admins can only delete STAFF in their own branch.
 * Prevents self-deletion.
 */
export async function deleteEmployee(id: string, requesterId: string, requesterRole: string, requesterBranchId: string) {
    const employee = await prisma.employee.findUnique({
        where: { id },
        include: { branches: true },
    });
    if (!employee) {
        throw Object.assign(new Error('Employee not found.'), { status: 404 });
    }

    if (requesterRole === 'ADMIN') {
        if (employee.role !== 'STAFF') {
            throw Object.assign(new Error('Admins can only delete employees with STAFF role.'), { status: 403 });
        }
        const hasBranch = employee.branches.some((b) => b.id === requesterBranchId);
        if (!hasBranch) {
            throw Object.assign(new Error('Admins can only delete employees in their own branch.'), { status: 403 });
        }
    }

    if (employee.id === requesterId) {
        throw Object.assign(new Error('You cannot delete your own account.'), { status: 400 });
    }

    await prisma.employee.delete({ where: { id } });
}
