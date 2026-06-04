import { Request, Response, NextFunction } from 'express';
import { loginEmployee, seedInitialData } from '../services/auth.service';
import { logger } from '../utils/logger';

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
    const { username, password } = req.body;

    if (!username || !password) {
        res.status(400).json({ error: 'Username and password are required.' });
        return;
    }

    try {
        const result = await loginEmployee(username, password);
        res.json({ message: 'Login successful', ...result });
    } catch (error) {
        next(error);
    }
}

export async function seedData(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const forceReset = req.query.reset === 'true';
        const result = await seedInitialData(forceReset);

        if (result.seeded) {
            logger.info({ branchId: result.branchId }, 'Database seeded successfully');
            res.status(201).json({ message: 'Seeding complete!', branchId: result.branchId });
        } else {
            res.status(200).json({ message: 'Data already populated.' });
        }
    } catch (error) {
        next(error);
    }
}

export function healthCheck(_req: Request, res: Response): void {
    res.json({ status: 'OK', message: 'Nail Salon System API is running successfully.' });
}
