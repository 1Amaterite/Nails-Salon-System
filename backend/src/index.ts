import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 5001;
const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-key-123';

app.use(cors());
app.use(express.json());

// API Health Check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'Nail Salon System API is running successfully.'});
});

// JWT Verification Middleware (only ADMIN and OWNER roles allowed)
const verifyJWT = (req: any, res: any, next: any) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: "Access denied. No token provided." });
    }

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        req.user = decoded;
        
        if (decoded.role !== 'ADMIN' && decoded.role !== 'OWNER') {
            return res.status(403).json({ error: "Access denied. Admins or owners only." });
        }
        
        next();
    } catch (error) {
        return res.status(401).json({ error: "Invalid or expired token." });
    }
};

// POST: Authentication login endpoint
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    
    if (!username || !password) {
        return res.status(400).json({ error: "Username and password are required." });
    }
    
    try {
        const employee = await prisma.employee.findUnique({
            where: { username: username.toLowerCase().trim() }
        });
        
        if (!employee || !employee.passwordHash) {
            return res.status(401).json({ error: "Invalid username or password." });
        }
        
        const isPasswordValid = await bcrypt.compare(password, employee.passwordHash);
        if (!isPasswordValid) {
            return res.status(401).json({ error: "Invalid username or password." });
        }
        
        const token = jwt.sign(
            { 
                userId: employee.id, 
                username: employee.username, 
                role: employee.role,
                branchId: employee.branchId
            },
            JWT_SECRET,
            { expiresIn: '1d' }
        );
        
        res.json({
            message: "Login successful",
            token,
            employee: {
                id: employee.id,
                name: employee.name,
                username: employee.username,
                role: employee.role,
                branchId: employee.branchId
            }
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Seed Initial Branch, Services, and Staff
app.post('/api/seed-initial-data', async (req, res) => {
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
                    name: "Nails Salon System",
                    address: "123 Luxury Way, Suite 100",
                    phone: "(555) 0199",
                    email: "nailsandlasheslane.2014@gmail.com"
                }
            });

            // Create Default Services
            const services = await prisma.service.createMany({
                data: [
                    { name: "Gel Manicure", price: 45.00, durationMinutes: 45, category: "Hand Care", branchId: branch.id },
                    { name: "Luxury Pedicure", price: 60.00, durationMinutes: 60, category: "Foot Care", branchId: branch.id },
                    { name: "Acrylic Full Set", price: 85.00, durationMinutes: 90, category: "Nail Extensions", branchId: branch.id },
                    { name: "Volume Lash Extensions", price: 120.00, durationMinutes: 120, category: "Eyelash Extensions", branchId: branch.id }
                ] 
            });

            const ownerPasswordHash = await bcrypt.hash("owner123", 10);
            const adminPasswordHash = await bcrypt.hash("admin123", 10);

            await prisma.employee.create({
                data: {
                    name: "Andres Owner",
                    username: "owner",
                    passwordHash: ownerPasswordHash,
                    role: "OWNER",
                    phoneNumber: "01234567890",
                    specialty: "Owner",
                    branchId: branch.id,
                    schedules: {
                        createMany: {
                            data: Array.from({ length: 7 }, (_, i) => ({
                                dayOfWeek: i,
                                startTime: "09:00",
                                endTime: "17:00",
                                isOff: i === 0
                            }))
                        }
                    }
                }
            });

            await prisma.employee.create({
                data: {
                    name: "Andres Admin",
                    username: "admin",
                    passwordHash: adminPasswordHash,
                    role: "ADMIN",
                    phoneNumber: "01234567890",
                    specialty: "Manager",
                    branchId: branch.id,
                    schedules: {
                        createMany: {
                            data: Array.from({ length: 7 }, (_, i) => ({
                                dayOfWeek: i,
                                startTime: "09:00",
                                endTime: "17:00",
                                isOff: i === 0
                            }))
                        }
                    }
                }
            });
        
            await prisma.employee.create({
                data: {
                    name: "Sara Technician",
                    role: "STAFF",
                    phoneNumber: "01234567890",
                    specialty: "Nail Specialist",
                    branchId: branch.id,
                    schedules: {
                        createMany: {
                            data: Array.from({ length: 7 }, (_, i) => ({
                                dayOfWeek: i,
                                startTime: "09:00",
                                endTime: "17:00",
                                isOff: i === 0
                            }))
                        }
                    }
                }
            });

            return res.status(201).json({ message: "Seeding complete!", branchId: branch.id });
        }

        return res.status(200).json({ message: "Data already populated." });

    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
});

// GET: All Branches
app.get('/api/branches', async (req, res) => {
    try {
        const branches = await prisma.branch.findMany({
            include: {
                employees: {
                    include: {
                        schedules: true
                    }
                },
                services: true
            }
        });
        const safeBranches = branches.map(branch => ({
            ...branch,
            employees: branch.employees.map(emp => {
                const { passwordHash, ...safeEmp } = emp as any;
                return safeEmp;
            })
        }));
        res.json(safeBranches);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// GET: Schedulable Staff for a Branch (non-Owners, active)
app.get('/api/branches/:branchId/schedulable-staff', async (req, res) => {
    const { branchId } = req.params;
    try {
        const employees = await prisma.employee.findMany({
            where: {
                branchId,
                role: { not: 'OWNER' },
                isActive: true
            },
            include: {
                schedules: true
            }
        });
        const safeEmployees = employees.map(emp => {
            const { passwordHash, ...safeEmp } = emp as any;
            return safeEmp;
        });
        res.json(safeEmployees);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});


// GET: Dashboard Stats per Branch (protected by verifyJWT)
app.get('/api/dashboard/:branchId', verifyJWT, async (req: any, res: any) => {
    const { branchId } = req.params;
    try {
        const totalAppointments = await prisma.appointment.count({ where: { branchId } });
        const waitingQueue = await prisma.appointment.count({ where: { branchId, status: "WAITING" } });
        const employeeCount = await prisma.employee.count({ where: { branchId } });
        const serviceCount = await prisma.service.count({ where: { branchId } });
        res.json({
            appointmentsToday: totalAppointments,
            waitingQueueCount: waitingQueue,
            activeStylists: employeeCount,
            totalServices: serviceCount
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// POST: Create a new employee (protected by verifyJWT)
app.post('/api/employees', verifyJWT, async (req: any, res: any) => {
    const { name, username, password, role, phoneNumber, specialty, branchId } = req.body;
    const creatorRole = req.user.role;
    const creatorBranchId = req.user.branchId;

    if (!name || !role || !phoneNumber) {
        return res.status(400).json({ error: "Name, role, and phone number are required." });
    }

    // Role-based restrictions
    if (creatorRole === 'ADMIN') {
        if (role === 'ADMIN' || role === 'OWNER') {
            return res.status(403).json({ error: "Admins can only create employees with STAFF role." });
        }
        if (branchId && branchId !== creatorBranchId) {
            return res.status(403).json({ error: "Admins can only create employees in their own branch." });
        }
    } else if (creatorRole !== 'OWNER') {
        return res.status(403).json({ error: "Access denied. Unauthorized to create employees." });
    }

    // Check target role specific requirements
    let passwordHash = null;
    let finalUsername = null;

    if (role === 'ADMIN' || role === 'OWNER') {
        if (!username || !password) {
            return res.status(400).json({ error: "Username and password are required for admin and owner roles." });
        }
        finalUsername = username.toLowerCase().trim();

        try {
            const existing = await prisma.employee.findUnique({
                where: { username: finalUsername }
            });
            if (existing) {
                return res.status(400).json({ error: "Username already taken." });
            }
        } catch (err: any) {
            return res.status(500).json({ error: err.message });
        }

        passwordHash = await bcrypt.hash(password, 10);
    }

    try {
        const targetBranchId = branchId || creatorBranchId;
        if (!targetBranchId) {
            return res.status(400).json({ error: "Branch ID is required." });
        }

        const employeeData: any = {
            name,
            username: finalUsername,
            passwordHash,
            role,
            phoneNumber,
            specialty,
            branchId: targetBranchId
        };

        if (role !== 'OWNER') {
            employeeData.schedules = {
                createMany: {
                    data: Array.from({ length: 7 }, (_, i) => ({
                        dayOfWeek: i,
                        startTime: "09:00",
                        endTime: "17:00",
                        isOff: i === 0 // Sunday off by default
                    }))
                }
            };
        }

        const newEmployee = await prisma.employee.create({
            data: employeeData,
            include: {
                schedules: true
            }
        });

        res.status(201).json({
            message: "Employee created successfully.",
            employee: {
                id: newEmployee.id,
                name: newEmployee.name,
                username: newEmployee.username,
                role: newEmployee.role,
                phoneNumber: newEmployee.phoneNumber,
                specialty: newEmployee.specialty,
                schedules: newEmployee.schedules
            }
        });
    } catch (error: any) {
        if (error.code === 'P2002') {
            return res.status(400).json({ error: "Username is already in use by another account." });
        }
        res.status(500).json({ error: error.message });
    }
});

// PUT: Update an employee (protected by verifyJWT)
app.put('/api/employees/:id', verifyJWT, async (req: any, res: any) => {
    const { id } = req.params;
    const { name, username, password, role, phoneNumber, specialty, isActive, schedules } = req.body;
    const creatorRole = req.user.role;

    try {
        const employee = await prisma.employee.findUnique({ where: { id } });
        if (!employee) {
            return res.status(404).json({ error: "Employee not found." });
        }

        // Role-based restrictions
        if (creatorRole === 'ADMIN') {
            // Admins can only edit STAFF
            if (employee.role !== 'STAFF') {
                return res.status(403).json({ error: "Admins can only edit employees with STAFF role." });
            }
            // Admins cannot elevate a STAFF to ADMIN/OWNER
            if (role && role !== 'STAFF') {
                return res.status(403).json({ error: "Admins can only keep employees in STAFF role." });
            }
            // Enforce branch restriction
            if (employee.branchId !== req.user.branchId) {
                return res.status(403).json({ error: "Admins can only edit employees in their own branch." });
            }
        } else if (creatorRole !== 'OWNER') {
            return res.status(403).json({ error: "Access denied. Unauthorized to edit employees." });
        }

        const updateData: any = {};
        if (name !== undefined) updateData.name = name;
        if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber;
        if (specialty !== undefined) updateData.specialty = specialty;
        if (isActive !== undefined) updateData.isActive = isActive;
        if (role !== undefined) updateData.role = role;

        // Manage credentials if they are updating to or keeping admin/owner
        const targetRole = role || employee.role;
        if (targetRole === 'ADMIN' || targetRole === 'OWNER') {
            if (username !== undefined) {
                const finalUsername = username.toLowerCase().trim();
                if (finalUsername !== employee.username) {
                    const existing = await prisma.employee.findUnique({ where: { username: finalUsername } });
                    if (existing) {
                        return res.status(400).json({ error: "Username already taken." });
                    }
                    updateData.username = finalUsername;
                }
            }
            if (password) {
                updateData.passwordHash = await bcrypt.hash(password, 10);
            }
        } else {
            // If they are demoted to STAFF, clear their login details
            updateData.username = null;
            updateData.passwordHash = null;
        }

        if (schedules !== undefined && Array.isArray(schedules)) {
            const targetRole = role || employee.role;
            if (targetRole === 'OWNER') {
                return res.status(400).json({ error: "Owners cannot have shift schedules assigned." });
            }
            await prisma.employeeSchedule.deleteMany({
                where: { employeeId: id }
            });
            await prisma.employeeSchedule.createMany({
                data: schedules.map((s: any) => ({
                    employeeId: id,
                    dayOfWeek: s.dayOfWeek,
                    startTime: s.startTime,
                    endTime: s.endTime,
                    isOff: s.isOff
                }))
            });
        }

        const updatedEmployee = await prisma.employee.update({
            where: { id },
            data: updateData,
            include: {
                schedules: true
            }
        });

        res.json({
            message: "Employee updated successfully.",
            employee: {
                id: updatedEmployee.id,
                name: updatedEmployee.name,
                username: updatedEmployee.username,
                role: updatedEmployee.role,
                phoneNumber: updatedEmployee.phoneNumber,
                specialty: updatedEmployee.specialty,
                isActive: updatedEmployee.isActive,
                schedules: updatedEmployee.schedules
            }
        });
    } catch (error: any) {
        if (error.code === 'P2002') {
            return res.status(400).json({ error: "Username is already in use by another account." });
        }
        res.status(500).json({ error: error.message });
    }
});

// DELETE: Delete an employee (protected by verifyJWT)
app.delete('/api/employees/:id', verifyJWT, async (req: any, res: any) => {
    const { id } = req.params;
    const creatorRole = req.user.role;

    try {
        const employee = await prisma.employee.findUnique({ where: { id } });
        if (!employee) {
            return res.status(404).json({ error: "Employee not found." });
        }

        // Role-based restrictions
        if (creatorRole === 'ADMIN') {
            // Admins can only delete STAFF
            if (employee.role !== 'STAFF') {
                return res.status(403).json({ error: "Admins can only delete employees with STAFF role." });
            }
            if (employee.branchId !== req.user.branchId) {
                return res.status(403).json({ error: "Admins can only delete employees in their own branch." });
            }
        } else if (creatorRole !== 'OWNER') {
            return res.status(403).json({ error: "Access denied. Unauthorized to delete employees." });
        }

        // Don't let an owner delete themselves
        if (employee.id === req.user.userId) {
            return res.status(400).json({ error: "You cannot delete your own account." });
        }

        await prisma.employee.delete({ where: { id } });

        res.json({ message: "Employee deleted successfully." });
    } catch (error: any) {
        if (error.code === 'P2003' || error.message.includes('Foreign key constraint')) {
            return res.status(400).json({ error: "Cannot delete this employee because they have transaction or appointment records. Please set them to inactive instead." });
        }
        res.status(500).json({ error: error.message });
    }
});

// Clean up any existing schedule records for Owners on start
async function cleanupOwnerSchedules() {
    try {
        const deleted = await prisma.employeeSchedule.deleteMany({
            where: {
                employee: {
                    role: 'OWNER'
                }
            }
        });
        if (deleted.count > 0) {
            console.log(`[cleanup]: Deleted ${deleted.count} orphaned schedule records for Owner accounts.`);
        }
    } catch (err: any) {
        console.error("[cleanup]: Failed to clean up Owner schedules:", err.message);
    }
}

app.listen(PORT, async () => {
    console.log(`[server]: Server is running at http://localhost:${PORT}`);
    console.log('Press [Cmd+C] or [Ctrl+C] to stop the server');
    await cleanupOwnerSchedules();
});
    