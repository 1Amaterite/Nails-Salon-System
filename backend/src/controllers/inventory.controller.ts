import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import {
    getInventory,
    createInventoryItem,
    updateInventoryItem,
    deleteInventoryItem,
} from '../services/inventory.service';
import { assertBranchAccess } from '../utils/assertBranchAccess';

export async function list(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    const { branchId } = req.params;
    const { role, branchId: callerBranchId } = req.user!;

    if (!assertBranchAccess(res, role, callerBranchId, branchId)) return;

    try {
        const inventory = await getInventory(branchId);
        res.json(inventory);
    } catch (error) {
        next(error);
    }
}

export async function create(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    const { name, quantity, reorderLevel, costPrice, branchId } = req.body;
    const { role, branchId: callerBranchId } = req.user!;

    if (role !== 'ADMIN' && role !== 'OWNER') {
        res.status(403).json({ error: 'Access denied. Admins or owners only.' });
        return;
    }

    const targetBranchId: string = branchId || callerBranchId;
    if (!targetBranchId) {
        res.status(400).json({ error: 'Branch ID is required.' });
        return;
    }

    if (!assertBranchAccess(res, role, callerBranchId, targetBranchId)) return;

    if (!name || quantity === undefined || reorderLevel === undefined || costPrice === undefined) {
        res.status(400).json({ error: 'Name, quantity, reorderLevel, and costPrice are required.' });
        return;
    }

    const parsedQuantity = parseInt(quantity, 10);
    const parsedReorderLevel = parseInt(reorderLevel, 10);
    const parsedCostPrice = parseFloat(costPrice);

    if (isNaN(parsedQuantity) || parsedQuantity < 0) {
        res.status(400).json({ error: 'Quantity must be a non-negative integer.' });
        return;
    }
    if (isNaN(parsedReorderLevel) || parsedReorderLevel < 0) {
        res.status(400).json({ error: 'Reorder level must be a non-negative integer.' });
        return;
    }
    if (isNaN(parsedCostPrice) || parsedCostPrice < 0) {
        res.status(400).json({ error: 'Cost price must be a non-negative number.' });
        return;
    }

    try {
        const item = await createInventoryItem({
            name,
            quantity: parsedQuantity,
            reorderLevel: parsedReorderLevel,
            costPrice: parsedCostPrice,
            branchId: targetBranchId,
        });
        res.status(201).json(item);
    } catch (error) {
        next(error);
    }
}

export async function update(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    const { id } = req.params;
    const { name, quantity, reorderLevel, costPrice } = req.body;
    const { role, branchId: callerBranchId } = req.user!;

    if (role !== 'ADMIN' && role !== 'OWNER') {
        res.status(403).json({ error: 'Access denied. Admins or owners only.' });
        return;
    }

    // Parse numeric fields when provided
    const parsedPayload: Record<string, unknown> = {};
    if (name !== undefined) parsedPayload.name = name;
    if (quantity !== undefined) {
        const v = parseInt(quantity, 10);
        if (isNaN(v) || v < 0) { res.status(400).json({ error: 'Quantity must be a non-negative integer.' }); return; }
        parsedPayload.quantity = v;
    }
    if (reorderLevel !== undefined) {
        const v = parseInt(reorderLevel, 10);
        if (isNaN(v) || v < 0) { res.status(400).json({ error: 'Reorder level must be a non-negative integer.' }); return; }
        parsedPayload.reorderLevel = v;
    }
    if (costPrice !== undefined) {
        const v = parseFloat(costPrice);
        if (isNaN(v) || v < 0) { res.status(400).json({ error: 'Cost price must be a non-negative number.' }); return; }
        parsedPayload.costPrice = v;
    }

    try {
        const item = await updateInventoryItem(id, parsedPayload, callerBranchId, role);
        res.json(item);
    } catch (error) {
        next(error);
    }
}

export async function remove(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    const { id } = req.params;
    const { role, branchId: callerBranchId } = req.user!;

    if (role !== 'ADMIN' && role !== 'OWNER') {
        res.status(403).json({ error: 'Access denied. Admins or owners only.' });
        return;
    }

    try {
        await deleteInventoryItem(id, callerBranchId, role);
        res.json({ message: 'Inventory item deleted successfully.' });
    } catch (error) {
        next(error);
    }
}
