import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth';
import {
  getAll, getById, create, update, deleteAnnouncement,
  toggleActive, togglePin, markAsRead, getReadStats
} from '../controllers/announcements.controller';

const router = Router();

router.use(authenticate);

router.get('/', getAll);
router.get('/:id', getById);
router.post('/', authorize('SUPER_ADMIN', 'ADMIN', 'TEACHER'), create);
router.put('/:id', authorize('SUPER_ADMIN', 'ADMIN', 'TEACHER'), update);
router.delete('/:id', authorize('SUPER_ADMIN', 'ADMIN'), deleteAnnouncement);
router.patch('/:id/toggle', authorize('SUPER_ADMIN', 'ADMIN'), toggleActive);
router.patch('/:id/pin', authorize('SUPER_ADMIN', 'ADMIN'), togglePin);
router.post('/:id/read', markAsRead);
router.get('/:id/read-stats', authorize('SUPER_ADMIN', 'ADMIN', 'TEACHER'), getReadStats);

export default router;
