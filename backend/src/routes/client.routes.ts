import { Router } from 'express';
import { verifyJWT } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate';
import { CreateClientSchema, UpdateClientSchema } from '../validation/client.validation';
import {
    listClients,
    getClient,
    addClient,
    editClient,
    removeClient
} from '../controllers/client.controller';

const router = Router();

router.get('/clients', verifyJWT, listClients);
router.get('/clients/:id', verifyJWT, getClient);
router.post('/clients', verifyJWT, validate(CreateClientSchema), addClient);
router.put('/clients/:id', verifyJWT, validate(UpdateClientSchema), editClient);
router.delete('/clients/:id', verifyJWT, removeClient);

export default router;
