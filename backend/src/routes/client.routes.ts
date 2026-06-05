import { Router } from 'express';
import { verifyJWT } from '../middlewares/auth.middleware';
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
router.post('/clients', verifyJWT, addClient);
router.put('/clients/:id', verifyJWT, editClient);
router.delete('/clients/:id', verifyJWT, removeClient);

export default router;
