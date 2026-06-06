import prisma from '../config/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

interface LoginResult {
    token: string;
    employee: {
        id: string;
        name: string;
        username: string | null;
        role: string;
        branchId: string;
    };
}

/**
 * Validates credentials and returns a signed JWT on success.
 * Throws an error with a `status` property on failure so the
 * controller can pass it straight to the error handler.
 */
export async function loginEmployee(username: string, password: string): Promise<LoginResult> {
    const employee = await prisma.employee.findUnique({
        where: { username: username.toLowerCase().trim() },
        include: { branches: true },
    });

    if (!employee || !employee.passwordHash) {
        const err = Object.assign(new Error('Invalid username or password.'), { status: 401 });
        throw err;
    }

    const isPasswordValid = await bcrypt.compare(password, employee.passwordHash);
    if (!isPasswordValid) {
        const err = Object.assign(new Error('Invalid username or password.'), { status: 401 });
        throw err;
    }

    const branchId = employee.branches[0]?.id || '';

    const token = jwt.sign(
        {
            userId: employee.id,
            username: employee.username,
            role: employee.role,
            branchId,
        },
        process.env.JWT_SECRET!,
        { expiresIn: '1d' }
    );

    return {
        token,
        employee: {
            id: employee.id,
            name: employee.name,
            username: employee.username,
            role: employee.role,
            branchId,
        },
    };
}

/**
 * Seeds the database with a default branch, services, inventory, and
 * initial staff accounts. If data already exists and `forceReset` is
 * false the operation is a no-op.
 */
export async function seedInitialData(forceReset: boolean): Promise<{ seeded: boolean; branchId?: string }> {
    const shouldReset = forceReset || (await prisma.branch.count()) === 0;
    if (!shouldReset) {
        return { seeded: false };
    }

    // Cascade-delete all existing data in a single atomic transaction
    await prisma.$transaction([
        prisma.employeeSchedule.deleteMany({}),
        prisma.appointmentService.deleteMany({}),
        prisma.transactionService.deleteMany({}),
        prisma.loyaltyTransaction.deleteMany({}),
        prisma.transaction.deleteMany({}),
        prisma.appointment.deleteMany({}),
        prisma.inventoryLog.deleteMany({}),
        prisma.item.deleteMany({}),
        prisma.setting.deleteMany({}),
        prisma.service.deleteMany({}),
        prisma.employee.deleteMany({}),
        prisma.branch.deleteMany({}),
        prisma.client.deleteMany({}),
    ]);

    const branch = await prisma.branch.create({
        data: {
            name: 'Nails Salon System',
            address: '123 Luxury Way, Suite 100',
            phone: '(555) 0199',
            email: 'nailsandlasheslane.2014@gmail.com',
        },
    });

    await prisma.service.createMany({
        data: [
            { name: 'Gel Manicure', price: 45.0, durationMinutes: 45, category: 'Hand Care', branchId: branch.id },
            { name: 'Luxury Pedicure', price: 60.0, durationMinutes: 60, category: 'Foot Care', branchId: branch.id },
            { name: 'Acrylic Full Set', price: 85.0, durationMinutes: 90, category: 'Nail Extensions', branchId: branch.id },
            { name: 'Volume Lash Extensions', price: 120.0, durationMinutes: 120, category: 'Eyelash Extensions', branchId: branch.id },
        ],
    });

    await prisma.item.createMany({
        data: [
            { name: 'Acetone 1L', stockQuantity: 15, reorderLevel: 5, cost: 250.0, branchId: branch.id },
            { name: 'Red Gel Polish', stockQuantity: 8, reorderLevel: 10, cost: 180.0, branchId: branch.id },
            { name: 'Cotton Pads (Pack of 100)', stockQuantity: 3, reorderLevel: 5, cost: 95.0, branchId: branch.id },
        ],
    });

    const defaultSchedule = Array.from({ length: 7 }, (_, i) => ({
        branchId: branch.id,
        dayOfWeek: i,
        startTime: '09:00',
        endTime: '17:00',
        isOff: i === 0, // Sunday off by default
    }));

    const ownerPasswordHash = await bcrypt.hash('owner123', 10);
    const adminPasswordHash = await bcrypt.hash('admin123', 10);

    await prisma.employee.create({
        data: {
            name: 'Andres Owner',
            username: 'owner',
            passwordHash: ownerPasswordHash,
            role: 'OWNER',
            phoneNumber: '01234567890',
            specialty: 'Owner',
            branches: { connect: { id: branch.id } },
            schedules: { createMany: { data: defaultSchedule } },
        },
    });

    await prisma.employee.create({
        data: {
            name: 'Andres Admin',
            username: 'admin',
            passwordHash: adminPasswordHash,
            role: 'ADMIN',
            phoneNumber: '01234567890',
            specialty: 'Manager',
            branches: { connect: { id: branch.id } },
            schedules: { createMany: { data: defaultSchedule } },
        },
    });

    await prisma.employee.create({
        data: {
            name: 'Sara Technician',
            role: 'STAFF',
            phoneNumber: '01234567890',
            specialty: 'Nail Specialist',
            branches: { connect: { id: branch.id } },
            schedules: { createMany: { data: defaultSchedule } },
        },
    });

    return { seeded: true, branchId: branch.id };
}
