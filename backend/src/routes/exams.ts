import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth';
import { getAll, getById, create, update, deleteExam, getResults } from '../controllers/exams.controller';

const router = Router();

router.use(authenticate);

router.get('/', getAll);
router.get('/:id', getById);
router.get('/:id/results', getResults);
router.post('/', authorize('SUPER_ADMIN', 'ADMIN', 'TEACHER'), create);
router.put('/:id', authorize('SUPER_ADMIN', 'ADMIN', 'TEACHER'), update);
router.delete('/:id', authorize('SUPER_ADMIN', 'ADMIN'), deleteExam);

export default router;
