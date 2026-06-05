import prisma from '../config/prisma';

interface ClientPayload {
    firstName: string;
    lastName: string;
    phoneNumber?: string;
    birthday?: string | null;
    notes?: string | null;
}

/**
 * Returns a list of all clients, optionally filtered by name or phone.
 */
export async function getClients(search?: string) {
    const where: any = {};

    if (search) {
        const cleanSearch = search.trim();
        where.OR = [
            { firstName: { contains: cleanSearch, mode: 'insensitive' } },
            { lastName: { contains: cleanSearch, mode: 'insensitive' } },
            { phoneNumber: { contains: cleanSearch } }
        ];
    }

    return prisma.client.findMany({
        where,
        orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }]
    });
}

/**
 * Returns a client's details including their past appointments and services.
 */
export async function getClientById(id: string) {
    const client = await prisma.client.findUnique({
        where: { id },
        include: {
            appointments: {
                include: {
                    services: { include: { service: true } },
                    employee: true
                },
                orderBy: { appointmentDate: 'desc' }
            }
        }
    });

    if (!client) {
        throw Object.assign(new Error('Client not found.'), { status: 404 });
    }

    return client;
}

/**
 * Creates a new client. Checks that phone number is unique if provided.
 */
export async function createClient(payload: ClientPayload) {
    const { firstName, lastName, phoneNumber, birthday, notes } = payload;
    const cleanPhone = phoneNumber?.trim() || null;

    if (cleanPhone) {
        const existing = await prisma.client.findUnique({
            where: { phoneNumber: cleanPhone }
        });
        if (existing) {
            throw Object.assign(
                new Error('A client with this phone number already exists.'),
                { status: 400 }
            );
        }
    }

    const parsedBirthday = birthday ? new Date(birthday) : null;

    return prisma.client.create({
        data: {
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            phoneNumber: cleanPhone,
            birthday: parsedBirthday,
            notes: notes || null
        }
    });
}

/**
 * Updates a client's profile. Checks phone uniqueness if updated.
 */
export async function updateClient(id: string, payload: ClientPayload) {
    const { firstName, lastName, phoneNumber, birthday, notes } = payload;
    const cleanPhone = phoneNumber?.trim() || null;

    const client = await prisma.client.findUnique({ where: { id } });
    if (!client) {
        throw Object.assign(new Error('Client not found.'), { status: 404 });
    }

    if (cleanPhone && cleanPhone !== client.phoneNumber) {
        const existing = await prisma.client.findUnique({
            where: { phoneNumber: cleanPhone }
        });
        if (existing) {
            throw Object.assign(
                new Error('A client with this phone number already exists.'),
                { status: 400 }
            );
        }
    }

    const parsedBirthday = birthday ? new Date(birthday) : null;

    return prisma.client.update({
        where: { id },
        data: {
            firstName: firstName?.trim(),
            lastName: lastName?.trim(),
            phoneNumber: cleanPhone,
            birthday: parsedBirthday,
            notes: notes !== undefined ? notes : client.notes
        }
    });
}

/**
 * Deletes a client by ID.
 */
export async function deleteClient(id: string) {
    const client = await prisma.client.findUnique({ where: { id } });
    if (!client) {
        throw Object.assign(new Error('Client not found.'), { status: 404 });
    }

    return prisma.client.delete({ where: { id } });
}
