import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth';
import { getAll, getById, create, update, deleteExam, getResults, updateAdmitCardSettings, publishResults } from '../controllers/exams.controller';

const router = Router();

router.use(authenticate);

router.get('/', getAll);
router.get('/:id', getById);
router.get('/:id/results', getResults);
router.post('/', authorize('SUPER_ADMIN', 'ADMIN'), create);
router.put('/:id', authorize('SUPER_ADMIN', 'ADMIN'), update);
router.put('/:id/publish-results', authorize('SUPER_ADMIN', 'ADMIN'), publishResults);
router.post('/:id/admit-card-settings', authorize('SUPER_ADMIN', 'ADMIN'), updateAdmitCardSettings);
router.delete('/:id', authorize('SUPER_ADMIN', 'ADMIN'), deleteExam);

export default router;
