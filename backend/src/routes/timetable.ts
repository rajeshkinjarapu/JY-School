import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth';
import { getByClass, getByTeacher, createSlot, updateSlot, deleteSlot, generateAuto, getStats, getClashes, getWorkload, assignSubstitute } from '../controllers/timetable.controller';
import { getConfigs, saveConfigs, deleteConfig } from '../controllers/timetableConfig.controller';

const router = Router();

router.use(authenticate);

// Timetable config (period definitions)
router.get('/config', getConfigs);
router.post('/config', authorize('SUPER_ADMIN', 'ADMIN'), saveConfigs);
router.delete('/config/:id', authorize('SUPER_ADMIN', 'ADMIN'), deleteConfig);

router.get('/stats', authorize('SUPER_ADMIN', 'ADMIN'), getStats);
router.get('/clashes', authorize('SUPER_ADMIN', 'ADMIN'), getClashes);
router.get('/workload', authorize('SUPER_ADMIN', 'ADMIN'), getWorkload);
router.post('/substitute', authorize('SUPER_ADMIN', 'ADMIN'), assignSubstitute);

// Timetable slots
router.get('/class', getByClass);
router.get('/teacher', authorize('SUPER_ADMIN', 'ADMIN', 'TEACHER'), getByTeacher);
router.get('/teacher/:teacherId', authorize('SUPER_ADMIN', 'ADMIN'), getByTeacher);
router.post('/generate-auto', authorize('SUPER_ADMIN', 'ADMIN'), generateAuto);
router.post('/', authorize('SUPER_ADMIN', 'ADMIN'), createSlot);
router.put('/:id', authorize('SUPER_ADMIN', 'ADMIN'), updateSlot);
router.delete('/:id', authorize('SUPER_ADMIN', 'ADMIN'), deleteSlot);

export default router;
