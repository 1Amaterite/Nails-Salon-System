import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { createService, updateService, deleteService } from '../services/service.service';
import { assertBranchAccess } from '../utils/assertBranchAccess';

export async function create(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    const { name, description, durationMinutes, bufferTime, price, category, branchId, isActive, imageUrl } = req.body;
    const { role: creatorRole, branchId: creatorBranchId } = req.user!;

    if (creatorRole !== 'ADMIN' && creatorRole !== 'OWNER') {
        res.status(403).json({ error: 'Access denied. Admins or owners only.' });
        return;
    }

    if (!assertBranchAccess(res, creatorRole, creatorBranchId, branchId)) return;

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
    const { role: creatorRole, branchId: creatorBranchId } = req.user!;

    if (creatorRole !== 'ADMIN' && creatorRole !== 'OWNER') {
        res.status(403).json({ error: 'Access denied. Admins or owners only.' });
        return;
    }

    try {
        const service = await updateService(id, req.body, creatorBranchId, creatorRole);
        res.json(service);
    } catch (error) {
        next(error);
    }
}

export async function remove(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    const { id } = req.params;
    const { role: creatorRole, branchId: creatorBranchId } = req.user!;

    if (creatorRole !== 'ADMIN' && creatorRole !== 'OWNER') {
        res.status(403).json({ error: 'Access denied. Admins or owners only.' });
        return;
    }

    try {
        await deleteService(id, creatorBranchId, creatorRole);
        res.json({ message: 'Service deleted successfully.' });
    } catch (error) {
        next(error);
    }
}
