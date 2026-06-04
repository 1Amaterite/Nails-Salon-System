import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pinoHttp from 'pino-http';
import { logger } from './utils/logger';
import { errorHandler } from './middlewares/errorHandler';

interface CustomRequest extends Request {
    user?: any;
}

dotenv.config();

logger.info({
    env: {
        NODE_ENV: process.env.NODE_ENV,
        PORT: process.env.PORT,
        HAS_JWT_SECRET: !!process.env.JWT_SECRET,
        HAS_DATABASE_URL: !!process.env.DATABASE_URL,
        HAS_DIRECT_URL: !!process.env.DIRECT_URL
    }
}, 'Starting Nails Salon Backend API...');

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 5001;
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
    logger.fatal('JWT_SECRET environment variable is not set. Refusing to start.');
    process.exit(1);
}

// ─── Middleware ───────────────────────────────────────────────────────────────

// Automatic request/response logging (method, url, status, response time)
app.use(pinoHttp({
    logger,
    // Do not log health checks to keep logs clean
    autoLogging: {
        ignore: (req) => req.url === '/api/health',
    },
    customLogLevel: (_req, res) => {
        if (res.statusCode >= 500) return 'error';
        if (res.statusCode >= 400) return 'warn';
        return 'info';
    },
}));

app.use(cors());
app.use(express.json());

// ─── Health Check ─────────────────────────────────────────────────────────────

app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ status: 'OK', message: 'Nail Salon System API is running successfully.' });
});

// ─── JWT Verification Middleware ──────────────────────────────────────────────

// Only ADMIN and OWNER roles allowed
const verifyJWT = (req: CustomRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, JWT_SECRET!) as any;
        req.user = decoded;

        if (decoded.role !== 'ADMIN' && decoded.role !== 'OWNER') {
            return res.status(403).json({ error: 'Access denied. Admins or owners only.' });
        }

        next();
    } catch (error) {
        return res.status(401).json({ error: 'Invalid or expired token.' });
    }
};

// ─── POST: Authentication Login ───────────────────────────────────────────────

app.post('/api/login', async (req: Request, res: Response, next: NextFunction) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required.' });
    }

    try {
        const employee = await prisma.employee.findUnique({
            where: { username: username.toLowerCase().trim() },
        });

        if (!employee || !employee.passwordHash) {
            return res.status(401).json({ error: 'Invalid username or password.' });
        }

        const isPasswordValid = await bcrypt.compare(password, employee.passwordHash);
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Invalid username or password.' });
        }

        const token = jwt.sign(
            {
                userId: employee.id,
                username: employee.username,
                role: employee.role,
                branchId: employee.branchId,
            },
            JWT_SECRET!,
            { expiresIn: '1d' }
        );

        res.json({
            message: 'Login successful',
            token,
            employee: {
                id: employee.id,
                name: employee.name,
                username: employee.username,
                role: employee.role,
                branchId: employee.branchId,
            },
        });
    } catch (error) {
        next(error);
    }
});

// ─── POST: Seed Initial Branch, Services, and Staff ───────────────────────────

app.post('/api/seed-initial-data', async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Force reset database if requested or if no branches exist
        const forceReset = req.query.reset === 'true' || (await prisma.branch.count()) === 0;

        if (forceReset) {
            // Delete all existing data to prevent unique constraints or foreign key violations
            await prisma.employeeSchedule.deleteMany({});
            await prisma.appointmentService.deleteMany({});
            await prisma.transactionService.deleteMany({});
            await prisma.loyaltyLedger.deleteMany({});
            await prisma.transaction.deleteMany({});
            await prisma.appointment.deleteMany({});
            await prisma.inventoryLog.deleteMany({});
            await prisma.item.deleteMany({});
            await prisma.setting.deleteMany({});
            await prisma.service.deleteMany({});
            await prisma.employee.deleteMany({});
            await prisma.branch.deleteMany({});
            await prisma.client.deleteMany({});

            // Create Default Branch
            const branch = await prisma.branch.create({
                data: {
                    name: 'Nails Salon System',
                    address: '123 Luxury Way, Suite 100',
                    phone: '(555) 0199',
                    email: 'nailsandlasheslane.2014@gmail.com',
                },
            });

            // Create Default Services
            await prisma.service.createMany({
                data: [
                    { name: 'Gel Manicure', price: 45.0, durationMinutes: 45, category: 'Hand Care', branchId: branch.id },
                    { name: 'Luxury Pedicure', price: 60.0, durationMinutes: 60, category: 'Foot Care', branchId: branch.id },
                    { name: 'Acrylic Full Set', price: 85.0, durationMinutes: 90, category: 'Nail Extensions', branchId: branch.id },
                    { name: 'Volume Lash Extensions', price: 120.0, durationMinutes: 120, category: 'Eyelash Extensions', branchId: branch.id },
                ],
            });

            // Create Default Inventory Items
            await prisma.item.createMany({
                data: [
                    { name: 'Acetone 1L', stockQuantity: 15, reorderLevel: 5, cost: 250.0, branchId: branch.id },
                    { name: 'Red Gel Polish', stockQuantity: 8, reorderLevel: 10, cost: 180.0, branchId: branch.id },
                    { name: 'Cotton Pads (Pack of 100)', stockQuantity: 3, reorderLevel: 5, cost: 95.0, branchId: branch.id },
                ],
            });

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
                    branchId: branch.id,
                    schedules: {
                        createMany: {
                            data: Array.from({ length: 7 }, (_, i) => ({
                                dayOfWeek: i,
                                startTime: '09:00',
                                endTime: '17:00',
                                isOff: i === 0,
                            })),
                        },
                    },
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
                    branchId: branch.id,
                    schedules: {
                        createMany: {
                            data: Array.from({ length: 7 }, (_, i) => ({
                                dayOfWeek: i,
                                startTime: '09:00',
                                endTime: '17:00',
                                isOff: i === 0,
                            })),
                        },
                    },
                },
            });

            await prisma.employee.create({
                data: {
                    name: 'Sara Technician',
                    role: 'STAFF',
                    phoneNumber: '01234567890',
                    specialty: 'Nail Specialist',
                    branchId: branch.id,
                    schedules: {
                        createMany: {
                            data: Array.from({ length: 7 }, (_, i) => ({
                                dayOfWeek: i,
                                startTime: '09:00',
                                endTime: '17:00',
                                isOff: i === 0,
                            })),
                        },
                    },
                },
            });

            logger.info({ branchId: branch.id }, 'Database seeded successfully');
            return res.status(201).json({ message: 'Seeding complete!', branchId: branch.id });
        }

        return res.status(200).json({ message: 'Data already populated.' });
    } catch (error) {
        next(error);
    }
});

// ─── GET: All Branches ────────────────────────────────────────────────────────

app.get('/api/branches', async (_req: Request, res: Response, next: NextFunction) => {
    try {
        const branches = await prisma.branch.findMany({
            include: {
                employees: {
                    include: { schedules: true },
                },
                services: true,
            },
        });

        const safeBranches = branches.map((branch) => ({
            ...branch,
            employees: branch.employees.map((emp) => {
                const { passwordHash, ...safeEmp } = emp as any;
                void passwordHash; // intentionally stripped
                return safeEmp;
            }),
        }));

        res.json(safeBranches);
    } catch (error) {
        next(error);
    }
});

// ─── GET: Schedulable Staff for a Branch ─────────────────────────────────────

app.get('/api/branches/:branchId/schedulable-staff', verifyJWT, async (req: CustomRequest, res: Response, next: NextFunction) => {
    const { branchId } = req.params;
    if (req.user.role === 'ADMIN' && req.user.branchId !== branchId) {
        return res.status(403).json({ error: "Access denied. You can only access your own branch's staff." });
    }
    try {
        const employees = await prisma.employee.findMany({
            where: { branchId, role: { not: 'OWNER' }, isActive: true },
            include: { schedules: true },
        });

        const safeEmployees = employees.map((emp) => {
            const { passwordHash, ...safeEmp } = emp as any;
            void passwordHash;
            return safeEmp;
        });

        res.json(safeEmployees);
    } catch (error) {
        next(error);
    }
});

// ─── GET: Dashboard Stats per Branch ─────────────────────────────────────────

app.get('/api/dashboard/:branchId', verifyJWT, async (req: CustomRequest, res: Response, next: NextFunction) => {
    const { branchId } = req.params;
    if (req.user.role === 'ADMIN' && req.user.branchId !== branchId) {
        return res.status(403).json({ error: "Access denied. You can only access your own branch's dashboard." });
    }
    try {
        const totalAppointments = await prisma.appointment.count({ where: { branchId } });
        const waitingQueue = await prisma.appointment.count({ where: { branchId, status: 'WAITING' } });
        const employeeCount = await prisma.employee.count({ where: { branchId } });
        const serviceCount = await prisma.service.count({ where: { branchId } });

        res.json({
            appointmentsToday: totalAppointments,
            waitingQueueCount: waitingQueue,
            activeStylists: employeeCount,
            totalServices: serviceCount,
        });
    } catch (error) {
        next(error);
    }
});

// ─── POST: Create Employee ────────────────────────────────────────────────────

app.post('/api/employees', verifyJWT, async (req: CustomRequest, res: Response, next: NextFunction) => {
    const { name, username, password, role, phoneNumber, specialty, branchId } = req.body;
    const creatorRole = req.user.role;
    const creatorBranchId = req.user.branchId;

    if (!name || !role || !phoneNumber) {
        return res.status(400).json({ error: 'Name, role, and phone number are required.' });
    }

    // Role-based restrictions
    if (creatorRole === 'ADMIN') {
        if (role === 'ADMIN' || role === 'OWNER') {
            return res.status(403).json({ error: 'Admins can only create employees with STAFF role.' });
        }
        if (branchId && branchId !== creatorBranchId) {
            return res.status(403).json({ error: 'Admins can only create employees in their own branch.' });
        }
    } else if (creatorRole !== 'OWNER') {
        return res.status(403).json({ error: 'Access denied. Unauthorized to create employees.' });
    }

    // Check target role specific requirements
    let passwordHash = null;
    let finalUsername = null;

    if (role === 'ADMIN' || role === 'OWNER') {
        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required for admin and owner roles.' });
        }
        finalUsername = username.toLowerCase().trim();

        try {
            const existing = await prisma.employee.findUnique({ where: { username: finalUsername } });
            if (existing) {
                return res.status(400).json({ error: 'Username already taken.' });
            }
        } catch (err) {
            return next(err);
        }

        passwordHash = await bcrypt.hash(password, 10);
    }

    try {
        const targetBranchId = branchId || creatorBranchId;
        if (!targetBranchId) {
            return res.status(400).json({ error: 'Branch ID is required.' });
        }

        const employeeData: any = {
            name,
            username: finalUsername,
            passwordHash,
            role,
            phoneNumber,
            specialty,
            branchId: targetBranchId,
        };

        if (role !== 'OWNER') {
            employeeData.schedules = {
                createMany: {
                    data: Array.from({ length: 7 }, (_, i) => ({
                        dayOfWeek: i,
                        startTime: '09:00',
                        endTime: '17:00',
                        isOff: i === 0, // Sunday off by default
                    })),
                },
            };
        }

        const newEmployee = await prisma.employee.create({
            data: employeeData,
            include: { schedules: true },
        });

        res.status(201).json({
            message: 'Employee created successfully.',
            employee: {
                id: newEmployee.id,
                name: newEmployee.name,
                username: newEmployee.username,
                role: newEmployee.role,
                phoneNumber: newEmployee.phoneNumber,
                specialty: newEmployee.specialty,
                schedules: newEmployee.schedules,
            },
        });
    } catch (error) {
        next(error);
    }
});

// ─── PUT: Update Employee ─────────────────────────────────────────────────────

app.put('/api/employees/:id', verifyJWT, async (req: CustomRequest, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const { name, username, password, role, phoneNumber, specialty, isActive, schedules } = req.body;
    const creatorRole = req.user.role;

    try {
        const employee = await prisma.employee.findUnique({ where: { id } });
        if (!employee) {
            return res.status(404).json({ error: 'Employee not found.' });
        }

        // Role-based restrictions
        if (creatorRole === 'ADMIN') {
            if (employee.role !== 'STAFF') {
                return res.status(403).json({ error: 'Admins can only edit employees with STAFF role.' });
            }
            if (role && role !== 'STAFF') {
                return res.status(403).json({ error: 'Admins can only keep employees in STAFF role.' });
            }
            if (employee.branchId !== req.user.branchId) {
                return res.status(403).json({ error: 'Admins can only edit employees in their own branch.' });
            }
        } else if (creatorRole !== 'OWNER') {
            return res.status(403).json({ error: 'Access denied. Unauthorized to edit employees.' });
        }

        const updateData: any = {};
        if (name !== undefined) updateData.name = name;
        if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber;
        if (specialty !== undefined) updateData.specialty = specialty;
        if (isActive !== undefined) updateData.isActive = isActive;
        if (role !== undefined) updateData.role = role;

        // Manage credentials if updating to or keeping admin/owner
        const targetRole = role || employee.role;
        if (targetRole === 'ADMIN' || targetRole === 'OWNER') {
            if (username !== undefined) {
                const finalUsername = username.toLowerCase().trim();
                if (finalUsername !== employee.username) {
                    const existing = await prisma.employee.findUnique({ where: { username: finalUsername } });
                    if (existing) {
                        return res.status(400).json({ error: 'Username already taken.' });
                    }
                    updateData.username = finalUsername;
                }
            }
            if (password) {
                updateData.passwordHash = await bcrypt.hash(password, 10);
            }
        } else {
            // Demoted to STAFF — clear login details
            updateData.username = null;
            updateData.passwordHash = null;
        }

        if (schedules !== undefined && Array.isArray(schedules)) {
            const effectiveRole = role || employee.role;
            if (effectiveRole === 'OWNER') {
                return res.status(400).json({ error: 'Owners cannot have shift schedules assigned.' });
            }
            await prisma.employeeSchedule.deleteMany({ where: { employeeId: id } });
            await prisma.employeeSchedule.createMany({
                data: schedules.map((s: any) => ({
                    employeeId: id,
                    dayOfWeek: s.dayOfWeek,
                    startTime: s.startTime,
                    endTime: s.endTime,
                    isOff: s.isOff,
                })),
            });
        }

        const updatedEmployee = await prisma.employee.update({
            where: { id },
            data: updateData,
            include: { schedules: true },
        });

        res.json({
            message: 'Employee updated successfully.',
            employee: {
                id: updatedEmployee.id,
                name: updatedEmployee.name,
                username: updatedEmployee.username,
                role: updatedEmployee.role,
                phoneNumber: updatedEmployee.phoneNumber,
                specialty: updatedEmployee.specialty,
                isActive: updatedEmployee.isActive,
                schedules: updatedEmployee.schedules,
            },
        });
    } catch (error) {
        next(error);
    }
});

// ─── DELETE: Delete Employee ──────────────────────────────────────────────────

app.delete('/api/employees/:id', verifyJWT, async (req: CustomRequest, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const creatorRole = req.user.role;

    try {
        const employee = await prisma.employee.findUnique({ where: { id } });
        if (!employee) {
            return res.status(404).json({ error: 'Employee not found.' });
        }

        // Role-based restrictions
        if (creatorRole === 'ADMIN') {
            if (employee.role !== 'STAFF') {
                return res.status(403).json({ error: 'Admins can only delete employees with STAFF role.' });
            }
            if (employee.branchId !== req.user.branchId) {
                return res.status(403).json({ error: 'Admins can only delete employees in their own branch.' });
            }
        } else if (creatorRole !== 'OWNER') {
            return res.status(403).json({ error: 'Access denied. Unauthorized to delete employees.' });
        }

        if (employee.id === req.user.userId) {
            return res.status(400).json({ error: 'You cannot delete your own account.' });
        }

        await prisma.employee.delete({ where: { id } });
        res.json({ message: 'Employee deleted successfully.' });
    } catch (error) {
        next(error);
    }
});

// ─── POST: Create Service ─────────────────────────────────────────────────────

app.post('/api/services', verifyJWT, async (req: CustomRequest, res: Response, next: NextFunction) => {
    const { name, description, durationMinutes, bufferTime, price, category, branchId, isActive, imageUrl } = req.body;
    const creatorRole = req.user.role;

    if (creatorRole !== 'ADMIN' && creatorRole !== 'OWNER') {
        return res.status(403).json({ error: 'Access denied. Admins or owners only.' });
    }

    if (!name || price === undefined || !category || !durationMinutes || !branchId) {
        return res.status(400).json({ error: 'Name, price, category, duration, and branchId are required.' });
    }

    try {
        // Case-insensitive uniqueness check for the service name in the branch
        const existingService = await prisma.service.findFirst({
            where: {
                name: {
                    equals: name.trim(),
                    mode: 'insensitive',
                },
                branchId,
            },
        });
        if (existingService) {
            return res.status(400).json({ error: 'A service with this name already exists in this branch.' });
        }

        const service = await prisma.service.create({
            data: {
                name: name.trim(),
                description,
                durationMinutes: parseInt(durationMinutes, 10),
                bufferTime: bufferTime ? parseInt(bufferTime, 10) : 5,
                price: parseFloat(price),
                category,
                branchId,
                isActive: isActive !== undefined ? Boolean(isActive) : true,
                imageUrl: imageUrl || null,
            },
        });
        res.status(201).json(service);
    } catch (error) {
        next(error);
    }
});

// ─── PUT: Update Service ──────────────────────────────────────────────────────

app.put('/api/services/:id', verifyJWT, async (req: CustomRequest, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const { name, description, durationMinutes, bufferTime, price, category, isActive, imageUrl } = req.body;
    const creatorRole = req.user.role;

    if (creatorRole !== 'ADMIN' && creatorRole !== 'OWNER') {
        return res.status(403).json({ error: 'Access denied. Admins or owners only.' });
    }

    try {
        const service = await prisma.service.findUnique({ where: { id } });
        if (!service) {
            return res.status(404).json({ error: 'Service not found.' });
        }

        const updateData: any = {};
        if (name !== undefined) {
            const trimmedName = name.trim();
            if (trimmedName.toLowerCase() !== service.name.toLowerCase()) {
                const existingService = await prisma.service.findFirst({
                    where: {
                        name: {
                            equals: trimmedName,
                            mode: 'insensitive',
                        },
                        branchId: service.branchId,
                        id: { not: id },
                    },
                });
                if (existingService) {
                    return res.status(400).json({ error: 'A service with this name already exists in this branch.' });
                }
            }
            updateData.name = trimmedName;
        }
        if (description !== undefined) updateData.description = description;
        if (durationMinutes !== undefined) updateData.durationMinutes = parseInt(durationMinutes, 10);
        if (bufferTime !== undefined) updateData.bufferTime = parseInt(bufferTime, 10);
        if (price !== undefined) updateData.price = parseFloat(price);
        if (category !== undefined) updateData.category = category;
        if (isActive !== undefined) updateData.isActive = Boolean(isActive);
        if (imageUrl !== undefined) updateData.imageUrl = imageUrl || null;

        const updatedService = await prisma.service.update({
            where: { id },
            data: updateData,
        });
        res.json(updatedService);
    } catch (error) {
        next(error);
    }
});

// ─── DELETE: Delete Service ───────────────────────────────────────────────────

app.delete('/api/services/:id', verifyJWT, async (req: CustomRequest, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const creatorRole = req.user.role;

    if (creatorRole !== 'ADMIN' && creatorRole !== 'OWNER') {
        return res.status(403).json({ error: 'Access denied. Admins or owners only.' });
    }

    try {
        const service = await prisma.service.findUnique({ where: { id } });
        if (!service) {
            return res.status(404).json({ error: 'Service not found.' });
        }

        await prisma.service.delete({ where: { id } });
        res.json({ message: 'Service deleted successfully.' });
    } catch (error) {
        next(error);
    }
});


// ─── GET: All Inventory Items for a Branch ────────────────────────────────────

app.get('/api/branches/:branchId/inventory', verifyJWT, async (req: CustomRequest, res: Response, next: NextFunction) => {
    const { branchId } = req.params;
    const creatorRole = req.user.role;
    const creatorBranchId = req.user.branchId;

    if (creatorRole === 'ADMIN' && branchId !== creatorBranchId) {
        return res.status(403).json({ error: "Access denied. You can only access your own branch's inventory." });
    }

    try {
        const inventory = await prisma.item.findMany({
            where: { branchId },
            orderBy: { name: 'asc' },
        });
        res.json(inventory);
    } catch (error) {
        next(error);
    }
});

// ─── POST: Create Inventory Item ──────────────────────────────────────────────

app.post('/api/inventory', verifyJWT, async (req: CustomRequest, res: Response, next: NextFunction) => {
    const { name, quantity, reorderLevel, costPrice, branchId } = req.body;
    const creatorRole = req.user.role;
    const creatorBranchId = req.user.branchId;

    if (creatorRole !== 'ADMIN' && creatorRole !== 'OWNER') {
        return res.status(403).json({ error: 'Access denied. Admins or owners only.' });
    }

    const targetBranchId = branchId || creatorBranchId;
    if (!targetBranchId) {
        return res.status(400).json({ error: 'Branch ID is required.' });
    }

    if (creatorRole === 'ADMIN' && targetBranchId !== creatorBranchId) {
        return res.status(403).json({ error: 'Access denied. You can only add inventory to your own branch.' });
    }

    if (!name || quantity === undefined || reorderLevel === undefined || costPrice === undefined) {
        return res.status(400).json({ error: 'Name, quantity, reorderLevel, and costPrice are required.' });
    }

    const parsedQuantity = parseInt(quantity, 10);
    const parsedReorderLevel = parseInt(reorderLevel, 10);
    const parsedCostPrice = parseFloat(costPrice);

    if (isNaN(parsedQuantity) || parsedQuantity < 0) {
        return res.status(400).json({ error: 'Quantity must be a non-negative integer.' });
    }
    if (isNaN(parsedReorderLevel) || parsedReorderLevel < 0) {
        return res.status(400).json({ error: 'Reorder level must be a non-negative integer.' });
    }
    if (isNaN(parsedCostPrice) || parsedCostPrice < 0) {
        return res.status(400).json({ error: 'Cost price must be a non-negative number.' });
    }

    try {
        // Case-insensitive uniqueness check for the item name in the branch
        const existingItem = await prisma.item.findFirst({
            where: {
                name: {
                    equals: name.trim(),
                    mode: 'insensitive',
                },
                branchId: targetBranchId,
            },
        });
        if (existingItem) {
            return res.status(400).json({ error: 'An inventory item with this name already exists in this branch.' });
        }

        const newItem = await prisma.item.create({
            data: {
                name: name.trim(),
                stockQuantity: parsedQuantity,
                reorderLevel: parsedReorderLevel,
                cost: parsedCostPrice,
                branchId: targetBranchId,
            },
        });
        res.status(201).json(newItem);
    } catch (error) {
        next(error);
    }
});

// ─── PUT: Update Inventory Item ───────────────────────────────────────────────

app.put('/api/inventory/:id', verifyJWT, async (req: CustomRequest, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const { name, quantity, reorderLevel, costPrice } = req.body;
    const creatorRole = req.user.role;
    const creatorBranchId = req.user.branchId;

    if (creatorRole !== 'ADMIN' && creatorRole !== 'OWNER') {
        return res.status(403).json({ error: 'Access denied. Admins or owners only.' });
    }

    try {
        const item = await prisma.item.findUnique({ where: { id } });
        if (!item) {
            return res.status(404).json({ error: 'Inventory item not found.' });
        }

        if (creatorRole === 'ADMIN' && item.branchId !== creatorBranchId) {
            return res.status(403).json({ error: "Access denied. You cannot edit another branch's inventory item." });
        }

        const updateData: any = {};
        
        if (name !== undefined) {
            const trimmedName = name.trim();
            if (trimmedName.toLowerCase() !== item.name.toLowerCase()) {
                const existingItem = await prisma.item.findFirst({
                    where: {
                        name: {
                            equals: trimmedName,
                            mode: 'insensitive',
                        },
                        branchId: item.branchId,
                        id: { not: id },
                    },
                });
                if (existingItem) {
                    return res.status(400).json({ error: 'An inventory item with this name already exists in this branch.' });
                }
            }
            updateData.name = trimmedName;
        }

        if (quantity !== undefined) {
            const parsedQuantity = parseInt(quantity, 10);
            if (isNaN(parsedQuantity) || parsedQuantity < 0) {
                return res.status(400).json({ error: 'Quantity must be a non-negative integer.' });
            }
            updateData.stockQuantity = parsedQuantity;
        }

        if (reorderLevel !== undefined) {
            const parsedReorderLevel = parseInt(reorderLevel, 10);
            if (isNaN(parsedReorderLevel) || parsedReorderLevel < 0) {
                return res.status(400).json({ error: 'Reorder level must be a non-negative integer.' });
            }
            updateData.reorderLevel = parsedReorderLevel;
        }

        if (costPrice !== undefined) {
            const parsedCostPrice = parseFloat(costPrice);
            if (isNaN(parsedCostPrice) || parsedCostPrice < 0) {
                return res.status(400).json({ error: 'Cost price must be a non-negative number.' });
            }
            updateData.cost = parsedCostPrice;
        }

        const updatedItem = await prisma.item.update({
            where: { id },
            data: updateData,
        });
        res.json(updatedItem);
    } catch (error) {
        next(error);
    }
});

// ─── DELETE: Delete Inventory Item ────────────────────────────────────────────

app.delete('/api/inventory/:id', verifyJWT, async (req: CustomRequest, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const creatorRole = req.user.role;
    const creatorBranchId = req.user.branchId;

    if (creatorRole !== 'ADMIN' && creatorRole !== 'OWNER') {
        return res.status(403).json({ error: 'Access denied. Admins or owners only.' });
    }

    try {
        const item = await prisma.item.findUnique({ where: { id } });
        if (!item) {
            return res.status(404).json({ error: 'Inventory item not found.' });
        }

        if (creatorRole === 'ADMIN' && item.branchId !== creatorBranchId) {
            return res.status(403).json({ error: "Access denied. You cannot delete another branch's inventory item." });
        }

        await prisma.item.delete({ where: { id } });
        res.json({ message: 'Inventory item deleted successfully.' });
    } catch (error) {
        next(error);
    }
});


// ─── GET: Live Waitlist Queue for a Branch ────────────────────────────────────

app.get('/api/branches/:branchId/waitlist', verifyJWT, async (req: CustomRequest, res: Response, next: NextFunction) => {
    const { branchId } = req.params;
    const creatorRole = req.user.role;
    const creatorBranchId = req.user.branchId;

    if (creatorRole === 'ADMIN' && branchId !== creatorBranchId) {
        return res.status(403).json({ error: "Access denied. You can only access your own branch's waitlist." });
    }

    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const waitlist = await prisma.appointment.findMany({
            where: {
                branchId,
                status: { in: ['WAITING', 'IN_PROGRESS'] },
                appointmentDate: {
                    gte: today
                }
            },
            include: {
                client: true,
                employee: true,
                services: {
                    include: {
                        service: true
                    }
                }
            },
            orderBy: {
                createdAt: 'asc'
            }
        });

        const mappedWaitlist = waitlist.map((appt) => {
            const serviceNames = appt.services.map((s) => s.service.name).join(', ') || 'N/A';
            return {
                id: appt.id,
                firstName: appt.client?.firstName || 'Walk-in',
                phone: appt.client?.phoneNumber || '',
                service: serviceNames,
                stylist: appt.employee?.name || 'First Available Stylist',
                checkInTime: appt.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                status: appt.status,
            };
        });

        res.json(mappedWaitlist);
    } catch (error) {
        next(error);
    }
});

// ─── POST: Register Walk-In Guest in Queue ────────────────────────────────────

app.post('/api/branches/:branchId/waitlist', async (req: Request, res: Response, next: NextFunction) => {
    const { branchId } = req.params;
    const { firstName, phone, serviceId, employeeId } = req.body;

    if (!firstName || !phone || !serviceId) {
        return res.status(400).json({ error: 'First name, phone number, and service ID are required.' });
    }

    try {
        // Ensure branch exists
        const branchExists = await prisma.branch.findUnique({ where: { id: branchId } });
        if (!branchExists) {
            return res.status(404).json({ error: 'Branch not found.' });
        }

        // Ensure service exists
        const serviceExists = await prisma.service.findFirst({
            where: { id: serviceId, branchId }
        });
        if (!serviceExists) {
            return res.status(404).json({ error: 'Service not found in this branch.' });
        }

        // Ensure employee exists if specified
        if (employeeId) {
            const employeeExists = await prisma.employee.findFirst({
                where: { id: employeeId, branchId, isActive: true }
            });
            if (!employeeExists) {
                return res.status(404).json({ error: 'Stylist not found or inactive in this branch.' });
            }
        }

        // Database transaction to create client and appointment
        const result = await prisma.$transaction(async (tx) => {
            const cleanPhone = phone.trim();
            const client = await tx.client.upsert({
                where: { phoneNumber: cleanPhone },
                update: { firstName: firstName.trim() },
                create: {
                    firstName: firstName.trim(),
                    lastName: '',
                    phoneNumber: cleanPhone
                }
            });

            const appointment = await tx.appointment.create({
                data: {
                    branchId,
                    clientId: client.id,
                    employeeId: employeeId || null,
                    appointmentDate: new Date(),
                    status: 'WAITING',
                    services: {
                        create: {
                            serviceId: serviceId
                        }
                    }
                },
                include: {
                    client: true,
                    employee: true,
                    services: {
                        include: {
                            service: true
                        }
                    }
                }
            });

            return appointment;
        });

        const serviceNames = result.services.map((s) => s.service.name).join(', ') || 'N/A';
        const responseData = {
            id: result.id,
            firstName: result.client.firstName,
            phone: result.client.phoneNumber || '',
            service: serviceNames,
            stylist: result.employee ? result.employee.name : 'First Available Stylist',
            checkInTime: result.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            status: result.status,
        };

        res.status(201).json(responseData);
    } catch (error) {
        next(error);
    }
});

// ─── PUT: Update Waitlist Status ──────────────────────────────────────────────

app.put('/api/waitlist/:id/status', verifyJWT, async (req: CustomRequest, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const { status } = req.body;
    const creatorRole = req.user.role;
    const creatorBranchId = req.user.branchId;

    if (!status || !['WAITING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'].includes(status)) {
        return res.status(400).json({ error: 'Valid status is required.' });
    }

    try {
        const appointment = await prisma.appointment.findUnique({
            where: { id },
            include: { branch: true }
        });

        if (!appointment) {
            return res.status(404).json({ error: 'Waitlist entry not found.' });
        }

        if (creatorRole === 'ADMIN' && appointment.branchId !== creatorBranchId) {
            return res.status(403).json({ error: 'Access denied. You cannot modify queue entries of another branch.' });
        }

        const updated = await prisma.appointment.update({
            where: { id },
            data: { status },
            include: {
                client: true,
                employee: true,
                services: {
                    include: {
                        service: true
                    }
                }
            }
        });

        const serviceNames = updated.services.map((s) => s.service.name).join(', ') || 'N/A';
        const responseData = {
            id: updated.id,
            firstName: updated.client.firstName,
            phone: updated.client.phoneNumber || '',
            service: serviceNames,
            stylist: updated.employee ? updated.employee.name : 'First Available Stylist',
            checkInTime: updated.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            status: updated.status,
        };

        res.json(responseData);
    } catch (error) {
        next(error);
    }
});


// ─── GET: All Scheduled Appointments for a Branch ──────────────────────────────

app.get('/api/branches/:branchId/appointments', verifyJWT, async (req: CustomRequest, res: Response, next: NextFunction) => {
    const { branchId } = req.params;
    const { date, status } = req.query;
    const creatorRole = req.user.role;
    const creatorBranchId = req.user.branchId;

    if (creatorRole === 'ADMIN' && branchId !== creatorBranchId) {
        return res.status(403).json({ error: "Access denied. You can only access your own branch's appointments." });
    }

    try {
        const whereClause: any = {
            branchId,
            startTime: { not: null } // Only scheduled appointments (exclude walk-ins)
        };

        if (date) {
            whereClause.appointmentDate = new Date(`${date}T00:00:00.000Z`);
        }

        if (status) {
            whereClause.status = status;
        }

        const appointments = await prisma.appointment.findMany({
            where: whereClause,
            include: {
                client: true,
                employee: true,
                services: {
                    include: {
                        service: true
                    }
                }
            },
            orderBy: [
                { appointmentDate: 'asc' },
                { startTime: 'asc' }
            ]
        });

        res.json(appointments);
    } catch (error) {
        next(error);
    }
});

// ─── POST: Book a Scheduled Appointment with Conflict Validation ─────────────────

function addMinutesToTime(timeStr: string, minutes: number): string {
    const [hours, mins] = timeStr.split(':').map(Number);
    const totalMins = hours * 60 + mins + minutes;
    const newHours = Math.floor(totalMins / 60) % 24;
    const newMins = totalMins % 60;
    return `${String(newHours).padStart(2, '0')}:${String(newMins).padStart(2, '0')}`;
}

app.post('/api/branches/:branchId/appointments', async (req: Request, res: Response, next: NextFunction) => {
    const { branchId } = req.params;
    const { firstName, lastName, phone, serviceId, employeeId, date, startTime } = req.body;

    if (!firstName || !phone || !serviceId || !date || !startTime) {
        return res.status(400).json({ error: 'First name, phone number, service, date, and start time are required.' });
    }

    try {
        // Parse date
        const parsedDate = new Date(`${date}T00:00:00.000Z`);
        
        // Ensure date is not in the past
        const today = new Date();
        today.setUTCHours(0, 0, 0, 0);
        if (parsedDate < today) {
            return res.status(400).json({ error: 'Cannot book appointments in the past.' });
        }

        // Get service duration
        const service = await prisma.service.findFirst({
            where: { id: serviceId, branchId }
        });
        if (!service) {
            return res.status(404).json({ error: 'Service not found in this branch.' });
        }

        const duration = service.durationMinutes + service.bufferTime;
        const endTime = addMinutesToTime(startTime, duration);

        const dayOfWeek = parsedDate.getUTCDay();
        let selectedEmployeeId = employeeId || null;

        if (selectedEmployeeId) {
            // 1. Verify stylist active
            const stylist = await prisma.employee.findFirst({
                where: { id: selectedEmployeeId, branchId, isActive: true, role: { not: 'OWNER' } },
                include: {
                    schedules: {
                        where: { dayOfWeek }
                    }
                }
            });
            if (!stylist) {
                return res.status(400).json({ error: 'Preferred stylist is not active or not found in this branch.' });
            }

            // 2. Verify schedule working hours
            const schedule = stylist.schedules[0];
            if (!schedule || schedule.isOff || !schedule.startTime || !schedule.endTime) {
                return res.status(400).json({ error: 'Preferred stylist is not scheduled to work on this day.' });
            }

            if (startTime < schedule.startTime || endTime > schedule.endTime) {
                return res.status(400).json({ error: `Preferred stylist is only available from ${schedule.startTime} to ${schedule.endTime}.` });
            }

            // 3. Check overlaps
            const overlap = await prisma.appointment.findFirst({
                where: {
                    employeeId: selectedEmployeeId,
                    appointmentDate: parsedDate,
                    status: { in: ['PENDING', 'CONFIRMED', 'IN_PROGRESS'] },
                    OR: [
                        { startTime: { lte: startTime }, endTime: { gt: startTime } },
                        { startTime: { lt: endTime }, endTime: { gte: endTime } },
                        { startTime: { gte: startTime }, endTime: { lte: endTime } }
                    ]
                }
            });

            if (overlap) {
                return res.status(400).json({ error: 'The preferred stylist has a scheduling conflict during this time slot.' });
            }
        } else {
            // Auto-assign first available stylist
            const branchEmployees = await prisma.employee.findMany({
                where: { branchId, isActive: true, role: { not: 'OWNER' } },
                include: {
                    schedules: {
                        where: { dayOfWeek }
                    }
                }
            });

            let assignedEmp = null;
            for (const emp of branchEmployees) {
                const schedule = emp.schedules[0];
                if (!schedule || schedule.isOff || !schedule.startTime || !schedule.endTime) continue;
                if (startTime < schedule.startTime || endTime > schedule.endTime) continue;

                const overlap = await prisma.appointment.findFirst({
                    where: {
                        employeeId: emp.id,
                        appointmentDate: parsedDate,
                        status: { in: ['PENDING', 'CONFIRMED', 'IN_PROGRESS'] },
                        OR: [
                            { startTime: { lte: startTime }, endTime: { gt: startTime } },
                            { startTime: { lt: endTime }, endTime: { gte: endTime } },
                            { startTime: { gte: startTime }, endTime: { lte: endTime } }
                        ]
                    }
                });

                if (!overlap) {
                    assignedEmp = emp;
                    break;
                }
            }

            if (!assignedEmp) {
                return res.status(400).json({ error: 'No stylists are available during this time slot.' });
            }
            selectedEmployeeId = assignedEmp.id;
        }

        // Database transaction to upsert client and insert appointment
        const result = await prisma.$transaction(async (tx) => {
            const cleanPhone = phone.trim();
            const client = await tx.client.upsert({
                where: { phoneNumber: cleanPhone },
                update: {
                    firstName: firstName.trim(),
                    lastName: (lastName || '').trim()
                },
                create: {
                    firstName: firstName.trim(),
                    lastName: (lastName || '').trim(),
                    phoneNumber: cleanPhone
                }
            });

            const appointment = await tx.appointment.create({
                data: {
                    branchId,
                    clientId: client.id,
                    employeeId: selectedEmployeeId,
                    appointmentDate: parsedDate,
                    startTime,
                    endTime,
                    status: 'CONFIRMED',
                    services: {
                        create: {
                            serviceId: serviceId
                        }
                    }
                },
                include: {
                    client: true,
                    employee: true,
                    services: {
                        include: {
                            service: true
                        }
                    }
                }
            });

            return appointment;
        });

        res.status(201).json(result);
    } catch (error) {
        next(error);
    }
});

// ─── PUT: Update Appointment Status ───────────────────────────────────────────

app.put('/api/appointments/:id/status', verifyJWT, async (req: CustomRequest, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const { status } = req.body;
    const creatorRole = req.user.role;
    const creatorBranchId = req.user.branchId;

    if (!status || !['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW'].includes(status)) {
        return res.status(400).json({ error: 'Valid status is required.' });
    }

    try {
        const appointment = await prisma.appointment.findUnique({
            where: { id }
        });

        if (!appointment) {
            return res.status(404).json({ error: 'Appointment not found.' });
        }

        if (creatorRole === 'ADMIN' && appointment.branchId !== creatorBranchId) {
            return res.status(403).json({ error: 'Access denied. You cannot modify appointments of another branch.' });
        }

        const updated = await prisma.appointment.update({
            where: { id },
            data: { status },
            include: {
                client: true,
                employee: true,
                services: {
                    include: {
                        service: true
                    }
                }
            }
        });

        res.json(updated);
    } catch (error) {
        next(error);
    }
});

// ─── DELETE: Cancel / Delete Appointment ──────────────────────────────────────

app.delete('/api/appointments/:id', verifyJWT, async (req: CustomRequest, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const creatorRole = req.user.role;
    const creatorBranchId = req.user.branchId;

    try {
        const appointment = await prisma.appointment.findUnique({
            where: { id }
        });

        if (!appointment) {
            return res.status(404).json({ error: 'Appointment not found.' });
        }

        if (creatorRole === 'ADMIN' && appointment.branchId !== creatorBranchId) {
            return res.status(403).json({ error: 'Access denied. You cannot delete appointments of another branch.' });
        }

        await prisma.appointment.delete({
            where: { id }
        });

        res.json({ message: 'Appointment deleted successfully.' });
    } catch (error) {
        next(error);
    }
});


// ─── Startup Helpers ──────────────────────────────────────────────────────────

async function cleanupOwnerSchedules() {
    try {
        const deleted = await prisma.employeeSchedule.deleteMany({
            where: { employee: { role: 'OWNER' } },
        });
        if (deleted.count > 0) {
            logger.info({ count: deleted.count }, 'Deleted orphaned schedule records for Owner accounts');
        }
    } catch (err) {
        logger.error({ err }, 'Failed to clean up Owner schedules');
    }
}

// ─── Global Error Handler — MUST be last ─────────────────────────────────────

app.use(errorHandler);

// ─── Process-level Safety Net ────────────────────────────────────────────────

process.on('uncaughtException', (err) => {
    logger.fatal({ err }, 'Uncaught Exception — shutting down');
    process.exit(1);
});

process.on('unhandledRejection', (reason) => {
    logger.fatal({ reason }, 'Unhandled Promise Rejection — shutting down');
    process.exit(1);
});

// ─── Server Bootstrap ─────────────────────────────────────────────────────────

app.listen(PORT, async () => {
    logger.info({ port: PORT }, 'Server is running');
    try {
        await prisma.$connect();
        logger.info('Database connection pool warmed up successfully');
    } catch (dbErr) {
        logger.error({ err: dbErr }, 'Failed to pre-warm database connection pool');
    }
    await cleanupOwnerSchedules();
});