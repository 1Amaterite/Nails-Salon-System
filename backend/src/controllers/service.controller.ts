import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { createService, updateService, deleteService } from '../services/service.service';

export async function create(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    const { name, description, durationMinutes, bufferTime, price, category, branchId, isActive, imageUrl } = req.body;
    const creatorRole = req.user!.role;

    if (creatorRole !== 'ADMIN' && creatorRole !== 'OWNER') {
        res.status(403).json({ error: 'Access denied. Admins or owners only.' });
        return;
    }

    if (!name || price === undefined || !category || !durationMinutes || !branchId) {
        res.status(400).json({ error: 'Name, price, category, duration, and branchId are required.' });
        return;
    }

    try {
        const service = await createService({ name, description, durationMinutes, bufferTime, price, category, branchId, isActive, imageUrl });
        res.status(201).json(service);
    } catch (error) {
        next(error);
    }
}

export async function update(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    const { id } = req.params;
    const creatorRole = req.user!.role;

    if (creatorRole !== 'ADMIN' && creatorRole !== 'OWNER') {
        res.status(403).json({ error: 'Access denied. Admins or owners only.' });
        return;
    }

    try {
        const service = await updateService(id, req.body);
        res.json(service);
    } catch (error) {
        next(error);
    }
}

export async function remove(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    const { id } = req.params;
    const creatorRole = req.user!.role;

    if (creatorRole !== 'ADMIN' && creatorRole !== 'OWNER') {
        res.status(403).json({ error: 'Access denied. Admins or owners only.' });
        return;
    }

    try {
        await deleteService(id);
        res.json({ message: 'Service deleted successfully.' });
    } catch (error) {
        next(error);
    }
}
