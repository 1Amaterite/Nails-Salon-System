import prisma from '../config/prisma';

interface CreateServicePayload {
    name: string;
    description?: string;
    durationMinutes: number;
    bufferTime?: number;
    price: number;
    category: string;
    branchId: string;
    isActive?: boolean;
    imageUrl?: string;
}

interface UpdateServicePayload {
    name?: string;
    description?: string;
    durationMinutes?: number;
    bufferTime?: number;
    price?: number;
    category?: string;
    isActive?: boolean;
    imageUrl?: string;
}

/**
 * Creates a new service in a branch after checking for case-insensitive
 * name uniqueness within that branch.
 */
export async function createService(payload: CreateServicePayload) {
    const { name, description, durationMinutes, bufferTime, price, category, branchId, isActive, imageUrl } = payload;

    const existing = await prisma.service.findFirst({
        where: { name: { equals: name.trim(), mode: 'insensitive' }, branchId },
    });
    if (existing) {
        throw Object.assign(
            new Error('A service with this name already exists in this branch.'),
            { status: 400 }
        );
    }

    return prisma.service.create({
        data: {
            name: name.trim(),
            description,
            durationMinutes: Number(durationMinutes),
            bufferTime: bufferTime ? Number(bufferTime) : 5,
            price: Number(price),
            category,
            branchId,
            isActive: isActive !== undefined ? Boolean(isActive) : true,
            imageUrl: imageUrl || null,
        },
    });
}

/**
 * Updates a service by ID. Checks case-insensitive name uniqueness within
 * the same branch when the name is being changed.
 */
export async function updateService(
    id: string,
    payload: UpdateServicePayload,
    editorBranchId?: string,
    editorRole?: string
) {
    const { name, description, durationMinutes, bufferTime, price, category, isActive, imageUrl } = payload;

    const service = await prisma.service.findUnique({ where: { id } });
    if (!service) {
        throw Object.assign(new Error('Service not found.'), { status: 404 });
    }

    if (editorRole && editorRole !== 'OWNER' && service.branchId !== editorBranchId) {
        throw Object.assign(
            new Error("Access denied. You cannot edit another branch's service."),
            { status: 403 }
        );
    }

    const updateData: Record<string, unknown> = {};

    if (name !== undefined) {
        const trimmedName = name.trim();
        if (trimmedName.toLowerCase() !== service.name.toLowerCase()) {
            const duplicate = await prisma.service.findFirst({
                where: {
                    name: { equals: trimmedName, mode: 'insensitive' },
                    branchId: service.branchId,
                    id: { not: id },
                },
            });
            if (duplicate) {
                throw Object.assign(
                    new Error('A service with this name already exists in this branch.'),
                    { status: 400 }
                );
            }
        }
        updateData.name = trimmedName;
    }

    if (description !== undefined) updateData.description = description;
    if (durationMinutes !== undefined) updateData.durationMinutes = Number(durationMinutes);
    if (bufferTime !== undefined) updateData.bufferTime = Number(bufferTime);
    if (price !== undefined) updateData.price = Number(price);
    if (category !== undefined) updateData.category = category;
    if (isActive !== undefined) updateData.isActive = Boolean(isActive);
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl || null;

    return prisma.service.update({ where: { id }, data: updateData });
}

/**
 * Deletes a service by ID. Throws 404 if not found.
 */
export async function deleteService(id: string, editorBranchId?: string, editorRole?: string) {
    const service = await prisma.service.findUnique({ where: { id } });
    if (!service) {
        throw Object.assign(new Error('Service not found.'), { status: 404 });
    }

    if (editorRole && editorRole !== 'OWNER' && service.branchId !== editorBranchId) {
        throw Object.assign(
            new Error("Access denied. You cannot delete another branch's service."),
            { status: 403 }
        );
    }

    await prisma.service.delete({ where: { id } });
}
