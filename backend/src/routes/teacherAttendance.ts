import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth';
import {
  getTeacherAttendance, markTeacherAttendance, bulkMarkTeacherAttendance,
  deleteTeacherAttendance, getTeacherAttendanceSummary,
} from '../controllers/teacherAttendance.controller';

const router = Router();
router.use(authenticate);

router.get('/', authorize('SUPER_ADMIN', 'ADMIN', 'TEACHER'), getTeacherAttendance);
router.get('/summary/me', authorize('TEACHER'), getTeacherAttendanceSummary);
router.get('/summary/:teacherId', authorize('SUPER_ADMIN', 'ADMIN'), getTeacherAttendanceSummary);
router.post('/mark', authorize('SUPER_ADMIN', 'ADMIN'), markTeacherAttendance);
router.post('/bulk-mark', authorize('SUPER_ADMIN', 'ADMIN'), bulkMarkTeacherAttendance);
router.delete('/:id', authorize('SUPER_ADMIN', 'ADMIN'), deleteTeacherAttendance);

export default router;
