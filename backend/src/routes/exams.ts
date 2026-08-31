import { Router } from 'express';
import multer from 'multer';
import { authenticate, authorize } from '../middlewares/auth';
import { getAll, getById, create, update, deleteExam, getResults, updateAdmitCardSettings, publishResults, toggleFreezeClass, getAllStatus, sendMarksSMS, scanOmr } from '../controllers/exams.controller';

const upload = multer({ dest: 'uploads/temp/' });

const router = Router();

router.use(authenticate);

router.get('/status/all', authorize('SUPER_ADMIN', 'ADMIN'), getAllStatus);
router.get('/', getAll);
router.post('/scan-omr', authorize('SUPER_ADMIN', 'ADMIN', 'TEACHER'), upload.single('image'), scanOmr);
router.get('/:id', getById);
router.get('/:id/results', getResults);
router.post('/', authorize('SUPER_ADMIN', 'ADMIN'), create);
router.post('/:id/freeze', authorize('SUPER_ADMIN', 'ADMIN', 'TEACHER'), toggleFreezeClass);
router.put('/:id', authorize('SUPER_ADMIN', 'ADMIN'), update);
router.post('/:id/classes/:classId/send-sms', authorize('SUPER_ADMIN', 'ADMIN'), sendMarksSMS);
router.put('/:id/publish-results', authorize('SUPER_ADMIN', 'ADMIN'), publishResults);
router.post('/:id/admit-card-settings', authorize('SUPER_ADMIN', 'ADMIN'), updateAdmitCardSettings);
router.delete('/:id', authorize('SUPER_ADMIN', 'ADMIN'), deleteExam);

export default router;
