import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { getAllBranches, getSchedulableStaff, getDashboardStats } from '../services/branch.service';
import { getFinancialsData } from '../services/financials.service';

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

export async function getBranchFinancials(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    const { branchId } = req.params;
    const { role, branchId: callerBranchId } = req.user!;

    // 1. Role validation: Must be OWNER or ADMIN
    if (role !== 'OWNER' && role !== 'ADMIN') {
        res.status(403).json({ error: 'Access denied. Only owners and administrators can view financial metrics.' });
        return;
    }

    // 2. Scope validation: ADMINs can only access their own branch
    if (role === 'ADMIN' && branchId !== callerBranchId) {
        res.status(403).json({ error: "Access denied. You can only view financial metrics for your own branch." });
        return;
    }

    try {
        const financials = await getFinancialsData(branchId);
        res.json(financials);
    } catch (error) {
        next(error);
    }
}
