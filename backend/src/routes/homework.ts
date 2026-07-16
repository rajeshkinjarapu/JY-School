import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth';
import { getHomework, getHomeworkById, createHomework, updateHomework, deleteHomework } from '../controllers/homework.controller';

const router = Router();
router.use(authenticate);

router.get('/', authorize('SUPER_ADMIN', 'ADMIN', 'TEACHER', 'STUDENT'), getHomework);
router.get('/:id', authorize('SUPER_ADMIN', 'ADMIN', 'TEACHER', 'STUDENT'), getHomeworkById);
router.post('/', authorize('SUPER_ADMIN', 'ADMIN', 'TEACHER'), createHomework);
router.put('/:id', authorize('SUPER_ADMIN', 'ADMIN', 'TEACHER'), updateHomework);
router.delete('/:id', authorize('SUPER_ADMIN', 'ADMIN', 'TEACHER'), deleteHomework);

export default router;
