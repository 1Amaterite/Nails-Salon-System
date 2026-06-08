import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { createEmployee, updateEmployee, deleteEmployee } from '../services/employee.service';

export async function create(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    const { name, username, password, role, phoneNumber, specialty, branchIds } = req.body;
    const creatorRole = req.user!.role;
    const creatorBranchId = req.user!.branchId;

    if (!name || !role || !phoneNumber) {
        res.status(400).json({ error: 'Name, role, and phone number are required.' });
        return;
    }

    const phoneRegex = /^(09\d{9}|09\d{2}\s\d{3}\s\d{4})$/;
    if (!phoneRegex.test(phoneNumber)) {
        res.status(400).json({ error: 'Phone number must be in format 09xxxxxxxxx or 09xx xxx xxxx.' });
        return;
    }

    if (creatorRole === 'ADMIN') {
        if (role === 'ADMIN' || role === 'OWNER') {
            res.status(403).json({ error: 'Admins can only create employees with STAFF role.' });
            return;
        }
        if (branchIds && (branchIds.length !== 1 || branchIds[0] !== creatorBranchId)) {
            res.status(403).json({ error: 'Admins can only create employees in their own branch.' });
            return;
        }
    } else if (creatorRole !== 'OWNER') {
        res.status(403).json({ error: 'Access denied. Unauthorized to create employees.' });
        return;
    }

    const targetBranchIds = branchIds || [creatorBranchId];
    if (!targetBranchIds || targetBranchIds.length === 0) {
        res.status(400).json({ error: 'At least one Branch ID is required.' });
        return;
    }

    try {
        const employee = await createEmployee({ name, username, password, role, phoneNumber, specialty, branchIds: targetBranchIds });
        res.status(201).json({ message: 'Employee created successfully.', employee });
    } catch (error) {
        next(error);
    }
}

export async function update(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    const { id } = req.params;
    const { role, branchId: editorBranchId } = req.user!;
    const { phoneNumber, branchIds } = req.body;

    if (phoneNumber !== undefined) {
        const phoneRegex = /^(09\d{9}|09\d{2}\s\d{3}\s\d{4})$/;
        if (!phoneRegex.test(phoneNumber)) {
            res.status(400).json({ error: 'Phone number must be in format 09xxxxxxxxx or 09xx xxx xxxx.' });
            return;
        }
    }

    if (role === 'ADMIN' && branchIds !== undefined) {
        if (branchIds.length !== 1 || branchIds[0] !== editorBranchId) {
            res.status(403).json({ error: 'Admins can only keep employees in their own branch.' });
            return;
        }
    }

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
