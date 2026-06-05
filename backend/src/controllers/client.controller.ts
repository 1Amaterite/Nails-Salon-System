import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import {
    getClients,
    getClientById,
    createClient,
    updateClient,
    deleteClient
} from '../services/client.service';

export async function listClients(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    const { search } = req.query as { search?: string };
    try {
        const clients = await getClients(search);
        res.json(clients);
    } catch (error) {
        next(error);
    }
}

export async function getClient(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    const { id } = req.params;
    try {
        const client = await getClientById(id);
        res.json(client);
    } catch (error) {
        next(error);
    }
}

export async function addClient(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    const { firstName, lastName, phoneNumber, birthday, notes } = req.body;

    if (!firstName) {
        res.status(400).json({ error: 'First name is required.' });
        return;
    }

    try {
        const newClient = await createClient({
            firstName,
            lastName: lastName || '',
            phoneNumber,
            birthday,
            notes
        });
        res.status(201).json(newClient);
    } catch (error) {
        next(error);
    }
}

export async function editClient(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    const { id } = req.params;
    const { firstName, lastName, phoneNumber, birthday, notes } = req.body;

    try {
        const updated = await updateClient(id, {
            firstName,
            lastName,
            phoneNumber,
            birthday,
            notes
        });
        res.json(updated);
    } catch (error) {
        next(error);
    }
}

export async function removeClient(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    const { id } = req.params;
    try {
        await deleteClient(id);
        res.json({ message: 'Client profile deleted successfully.' });
    } catch (error) {
        next(error);
    }
}
