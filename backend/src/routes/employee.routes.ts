import { Router } from 'express';
import { verifyJWT } from '../middlewares/auth.middleware';
import { create, update, remove } from '../controllers/employee.controller';

const router = Router();

router.post('/', verifyJWT, create);
router.put('/:id', verifyJWT, update);
router.delete('/:id', verifyJWT, remove);

export default router;
