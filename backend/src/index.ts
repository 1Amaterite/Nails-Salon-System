import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

// API Health Check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'Nail Salon System API is running successfully.'});
});

// Seed Initial Branch, Services, and Staff
app.post('/api/seed-initial-data', async (req, res) => {
    try {
        const branchCount = await prisma.branch.count();

        if (branchCount === 0) {
            // Create Default Branch
            const branch = await prisma.branch.create({
                data: {
                    name: "Nails Salon System",
                    address: "[LOCATION]",
                    phone: "[NUMBER]",
                    email: "[EMAIL_ADDRESS]"
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

            await prisma.employee.create({
            data: {
                name: "Andres Owner",
                email: "owner@luxenail.com",
                role: "OWNER",
                phoneNumber: "01234567890",
                specialty: "Owner",
                branchId: branch.id
                }
            });

            await prisma.employee.create({
            data: {
                name: "Andres Admin",
                email: "admin@luxenail.com",
                role: "ADMIN",
                phoneNumber: "01234567890",
                specialty: "Manager",
                branchId: branch.id
                }
            });
        
            await prisma.employee.create({
                data: {
                    name: "Sara Technician",
                    email: "sara@luxenail.com",
                    role: "STAFF",
                    phoneNumber: "01234567890",
                    specialty: "Nail Specialist",
                    branchId: branch.id
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
app.get('/branches', async (req, res) => {
    try {
        const branches = await prisma.branch.findMany({ include: { employees: true, services: true } });
        res.json(branches);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// GET: Dashboard Stats per Branch
app.get('/api/dashboard/:branchId', async (req, res) => {
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

app.listen(PORT, () => {
    console.log(`[server]: Server is running at http://localhost:${PORT}`);
    console.log('Press [Cmd+C] or [Ctrl+C] to stop the server');
});
    