import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { getAllBranches, getSchedulableStaff, getDashboardStats } from '../services/branch.service';

export async function listBranches(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const branches = await getAllBranches();
        res.json(branches);
    } catch (error) {
        next(error);
    }
}

export async function listSchedulableStaff(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    const { branchId } = req.params;

    if (req.user?.role === 'ADMIN' && req.user.branchId !== branchId) {
        res.status(403).json({ error: "Access denied. You can only access your own branch's staff." });
        return;
    }

    try {
        const staff = await getSchedulableStaff(branchId);
        res.json(staff);
    } catch (error) {
        next(error);
    }
}

export async function dashboardStats(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    const { branchId } = req.params;

    if (req.user?.role === 'ADMIN' && req.user.branchId !== branchId) {
        res.status(403).json({ error: "Access denied. You can only access your own branch's dashboard." });
        return;
    }

    try {
        const stats = await getDashboardStats(branchId);
        res.json(stats);
    } catch (error) {
        next(error);
    }
}
