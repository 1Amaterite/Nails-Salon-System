import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { createEmployee, updateEmployee, deleteEmployee } from '../services/employee.service';

export async function create(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    const { name, username, password, role, phoneNumber, specialty, branchId } = req.body;
    const creatorRole = req.user!.role;
    const creatorBranchId = req.user!.branchId;

    if (!name || !role || !phoneNumber) {
        res.status(400).json({ error: 'Name, role, and phone number are required.' });
        return;
    }

    if (creatorRole === 'ADMIN') {
        if (role === 'ADMIN' || role === 'OWNER') {
            res.status(403).json({ error: 'Admins can only create employees with STAFF role.' });
            return;
        }
        if (branchId && branchId !== creatorBranchId) {
            res.status(403).json({ error: 'Admins can only create employees in their own branch.' });
            return;
        }
    } else if (creatorRole !== 'OWNER') {
        res.status(403).json({ error: 'Access denied. Unauthorized to create employees.' });
        return;
    }

    const targetBranchId = branchId || creatorBranchId;
    if (!targetBranchId) {
        res.status(400).json({ error: 'Branch ID is required.' });
        return;
    }

    try {
        const employee = await createEmployee({ name, username, password, role, phoneNumber, specialty, branchId: targetBranchId });
        res.status(201).json({ message: 'Employee created successfully.', employee });
    } catch (error) {
        next(error);
    }
}

export async function update(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    const { id } = req.params;
    const { role, branchId: editorBranchId } = req.user!;

    try {
        const employee = await updateEmployee(id, req.body, role, editorBranchId);
        res.json({ message: 'Employee updated successfully.', employee });
    } catch (error) {
        next(error);
    }
}

export async function remove(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    const { id } = req.params;
    const { userId, role, branchId } = req.user!;

    try {
        await deleteEmployee(id, userId, role, branchId);
        res.json({ message: 'Employee deleted successfully.' });
    } catch (error) {
        next(error);
    }
}
