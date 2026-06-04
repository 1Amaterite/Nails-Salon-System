import { Router } from 'express';
import { verifyJWT } from '../middlewares/auth.middleware';
import { list, create, update, remove } from '../controllers/inventory.controller';

const router = Router();

// Branch-scoped inventory list
router.get('/branches/:branchId/inventory', verifyJWT, list);

// Global inventory CRUD
router.post('/', verifyJWT, create);
router.put('/:id', verifyJWT, update);
router.delete('/:id', verifyJWT, remove);

export default router;
