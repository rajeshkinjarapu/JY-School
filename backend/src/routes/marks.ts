import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth';
import { getByStudent, getByExam, bulkCreate, getReportCard, downloadReportCard, clearMarks } from '../controllers/marks.controller';

const router = Router();

router.use(authenticate);

router.get('/student/:studentId', getByStudent);
router.get('/exam/:examId', getByExam);
router.get('/report-card/:studentId/:examId', getReportCard);
router.get('/report-card/:studentId/:examId/download', downloadReportCard);
router.get('/report-card/:studentId/:examId/pdf', downloadReportCard);
router.post('/bulk', authorize('SUPER_ADMIN', 'ADMIN', 'TEACHER'), bulkCreate);
router.delete('/exam/:examId/clear', authorize('SUPER_ADMIN', 'ADMIN'), clearMarks);

export default router;
