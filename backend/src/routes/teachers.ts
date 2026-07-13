import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth';
import { upload } from '../utils/upload';
import {
  getAll, getById, create, update, deleteTeacher,
  getMyProfile, getAssignedClasses, bulkImport, exportCsv,
} from '../controllers/teachers.controller';

const router = Router();

router.use(authenticate);

router.get('/', authorize('SUPER_ADMIN', 'ADMIN'), getAll);
router.get('/my-profile', authorize('TEACHER'), getMyProfile);
router.get('/export', authorize('SUPER_ADMIN', 'ADMIN'), exportCsv);
router.get('/:id', authorize('SUPER_ADMIN', 'ADMIN', 'TEACHER'), getById);
router.get('/:id/assigned-classes', authorize('SUPER_ADMIN', 'ADMIN', 'TEACHER'), getAssignedClasses);
router.post('/', authorize('SUPER_ADMIN', 'ADMIN'), create);
router.post('/bulk-import', authorize('SUPER_ADMIN', 'ADMIN'), upload.single('file'), bulkImport);
router.put('/:id', authorize('SUPER_ADMIN', 'ADMIN'), update);
router.delete('/:id', authorize('SUPER_ADMIN', 'ADMIN'), deleteTeacher);

export default router;
