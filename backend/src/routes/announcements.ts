import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth';
import { getAll, getById, create, update, deleteAnnouncement, toggleActive } from '../controllers/announcements.controller';

const router = Router();

router.use(authenticate);

router.get('/', getAll);
router.get('/:id', getById);
router.post('/', authorize('SUPER_ADMIN', 'ADMIN'), create);
router.put('/:id', authorize('SUPER_ADMIN', 'ADMIN'), update);
router.delete('/:id', authorize('SUPER_ADMIN', 'ADMIN'), deleteAnnouncement);
router.patch('/:id/toggle', authorize('SUPER_ADMIN', 'ADMIN'), toggleActive);

export default router;
