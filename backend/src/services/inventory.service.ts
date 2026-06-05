import prisma from '../config/prisma';

interface CreateInventoryPayload {
    name: string;
    quantity: number;
    reorderLevel: number;
    costPrice: number;
    branchId: string;
}

interface UpdateInventoryPayload {
    name?: string;
    quantity?: number;
    reorderLevel?: number;
    costPrice?: number;
}

/**
 * Returns all inventory items for a branch, sorted alphabetically.
 */
export async function getInventory(branchId: string) {
    return prisma.item.findMany({
        where: { branchId },
        orderBy: { name: 'asc' },
    });
}

/**
 * Creates a new inventory item after validating uniqueness of the name
 * within the branch (case-insensitive).
 */
export async function createInventoryItem(payload: CreateInventoryPayload) {
    const { name, quantity, reorderLevel, costPrice, branchId } = payload;

    const existing = await prisma.item.findFirst({
        where: { name: { equals: name.trim(), mode: 'insensitive' }, branchId },
    });
    if (existing) {
        throw Object.assign(
            new Error('An inventory item with this name already exists in this branch.'),
            { status: 400 }
        );
    }

    return prisma.$transaction(async (tx) => {
        const item = await tx.item.create({
            data: {
                name: name.trim(),
                stockQuantity: quantity,
                reorderLevel,
                cost: costPrice,
                branchId,
            },
        });

        if (quantity > 0) {
            await tx.inventoryLog.create({
                data: {
                    itemId: item.id,
                    quantityChange: quantity,
                    logType: 'INBOUND',
                    notes: 'Initial stock setup upon item creation.',
                },
            });
        }

        return item;
    });
}

/**
 * Updates an existing inventory item. Validates numeric constraints and
 * name uniqueness before persisting changes.
 */
export async function updateInventoryItem(id: string, payload: UpdateInventoryPayload, editorBranchId: string, editorRole: string) {
    const { name, quantity, reorderLevel, costPrice } = payload;

    const item = await prisma.item.findUnique({ where: { id } });
    if (!item) {
        throw Object.assign(new Error('Inventory item not found.'), { status: 404 });
    }

    if (editorRole === 'ADMIN' && item.branchId !== editorBranchId) {
        throw Object.assign(
            new Error("Access denied. You cannot edit another branch's inventory item."),
            { status: 403 }
        );
    }

    const updateData: Record<string, unknown> = {};

    if (name !== undefined) {
        const trimmedName = name.trim();
        if (trimmedName.toLowerCase() !== item.name.toLowerCase()) {
            const duplicate = await prisma.item.findFirst({
                where: {
                    name: { equals: trimmedName, mode: 'insensitive' },
                    branchId: item.branchId,
                    id: { not: id },
                },
            });
            if (duplicate) {
                throw Object.assign(
                    new Error('An inventory item with this name already exists in this branch.'),
                    { status: 400 }
                );
            }
        }
        updateData.name = trimmedName;
    }

    if (quantity !== undefined) updateData.stockQuantity = quantity;
    if (reorderLevel !== undefined) updateData.reorderLevel = reorderLevel;
    if (costPrice !== undefined) updateData.cost = costPrice;

    return prisma.$transaction(async (tx) => {
        const updatedItem = await tx.item.update({ where: { id }, data: updateData });

        if (quantity !== undefined) {
            const quantityDiff = quantity - item.stockQuantity;
            if (quantityDiff !== 0) {
                await tx.inventoryLog.create({
                    data: {
                        itemId: id,
                        quantityChange: quantityDiff,
                        logType: quantityDiff > 0 ? 'INBOUND' : 'USAGE',
                        notes: `Stock count manually adjusted from ${item.stockQuantity} to ${quantity}.`,
                    },
                });
            }
        }

        return updatedItem;
    });
}

/**
 * Deletes an inventory item. Admins may only delete items in their own branch.
 */
export async function deleteInventoryItem(id: string, editorBranchId: string, editorRole: string) {
    const item = await prisma.item.findUnique({ where: { id } });
    if (!item) {
        throw Object.assign(new Error('Inventory item not found.'), { status: 404 });
    }

    if (editorRole === 'ADMIN' && item.branchId !== editorBranchId) {
        throw Object.assign(
            new Error("Access denied. You cannot delete another branch's inventory item."),
            { status: 403 }
        );
    }

    await prisma.item.delete({ where: { id } });
}
