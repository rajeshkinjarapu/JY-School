import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth';
import { getAll, getById, createUser, update, deleteUser } from '../controllers/users.controller';

const router = Router();

router.use(authenticate);

router.get('/', authorize('SUPER_ADMIN', 'ADMIN'), getAll);
router.get('/:id', authorize('SUPER_ADMIN', 'ADMIN'), getById);
router.post('/', authorize('SUPER_ADMIN', 'ADMIN'), createUser);
router.put('/:id', authorize('SUPER_ADMIN', 'ADMIN'), update);
router.delete('/:id', authorize('SUPER_ADMIN', 'ADMIN'), deleteUser);

export default router;
