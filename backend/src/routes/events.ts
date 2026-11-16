import { Router } from 'express';
import { getAll, create, update, deleteEvent, populateDefaults } from '../controllers/events.controller';
import { authenticate, authorize } from '../middlewares/auth';
import { Role } from '../types/enums';

const router = Router();

router.use(authenticate);

router.get('/', getAll);
router.post('/populate-defaults', authorize(Role.SUPER_ADMIN, Role.ADMIN), populateDefaults);
router.post('/', authorize(Role.SUPER_ADMIN, Role.ADMIN), create);
router.put('/:id', authorize(Role.SUPER_ADMIN, Role.ADMIN), update);
router.delete('/:id', authorize(Role.SUPER_ADMIN, Role.ADMIN), deleteEvent);

export default router;
