import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { getAllBranches, getSchedulableStaff, getDashboardStats, getBranchSettings as getBranchSettingsService, updateBranchSettings as updateBranchSettingsService, createBranch, deleteBranch } from '../services/branch.service';
import { getFinancialsData } from '../services/financials.service';
import { assertBranchAccess } from '../utils/assertBranchAccess';

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
    const { role, branchId: callerBranchId } = req.user!;

    if (!assertBranchAccess(res, role, callerBranchId, branchId)) return;

    try {
        const staff = await getSchedulableStaff(branchId);
        res.json(staff);
    } catch (error) {
        next(error);
    }
}

export async function dashboardStats(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    const { branchId } = req.params;
    const { role, branchId: callerBranchId } = req.user!;

    if (!assertBranchAccess(res, role, callerBranchId, branchId)) return;

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

    // Role validation: Must be OWNER or ADMIN
    if (role !== 'OWNER' && role !== 'ADMIN') {
        res.status(403).json({ error: 'Access denied. Only owners and administrators can view financial metrics.' });
        return;
    }

    // Scope validation: ADMINs can only access their own branch
    if (!assertBranchAccess(res, role, callerBranchId, branchId)) return;

    try {
        const financials = await getFinancialsData(branchId);
        res.json(financials);
    } catch (error) {
        next(error);
    }
}

export async function getBranchSettings(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    const { branchId } = req.params;
    const { role, branchId: callerBranchId } = req.user!;

    if (!assertBranchAccess(res, role, callerBranchId, branchId)) return;

    try {
        const settings = await getBranchSettingsService(branchId);
        res.json(settings);
    } catch (error) {
        next(error);
    }
}

export async function updateBranchSettings(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    const { branchId } = req.params;
    const { role, branchId: callerBranchId } = req.user!;

    if (!assertBranchAccess(res, role, callerBranchId, branchId)) return;

    try {
        const updated = await updateBranchSettingsService(branchId, req.body);
        res.json(updated);
    } catch (error) {
        next(error);
    }
}

export async function create(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    const { name, address, phone, email } = req.body;

    if (!name || !name.trim()) {
        res.status(400).json({ error: 'Branch name is required.' });
        return;
    }

    try {
        const branch = await createBranch({ name, address, phone, email });
        res.status(201).json({ message: 'Branch created successfully.', branch });
    } catch (error) {
        next(error);
    }
}

export async function remove(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    const { branchId } = req.params;

    try {
        await deleteBranch(branchId);
        res.json({ message: 'Branch deleted successfully.' });
    } catch (error) {
        next(error);
    }
}
