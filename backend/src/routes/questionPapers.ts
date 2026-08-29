import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth';
import { 
  getAllQuestionPapers, 
  createQuestionPaper, 
  deleteQuestionPaper, 
  updateAnswerKey,
  approveQuestionPaper,
  rejectQuestionPaper,
  publishQuestionPaper,
  getQuestionPaperDashboardStats,
  toggleTeacherPermission
} from '../controllers/questionPapers.controller';

const router = Router();

router.use(authenticate);

router.get('/', getAllQuestionPapers);
router.post('/', authorize('SUPER_ADMIN', 'ADMIN', 'TEACHER'), createQuestionPaper);
router.put('/:id/answer-key', authorize('SUPER_ADMIN', 'ADMIN', 'TEACHER'), updateAnswerKey);
router.delete('/:id', authorize('SUPER_ADMIN', 'ADMIN'), deleteQuestionPaper);

// New workflow routes
router.get('/dashboard-stats', authorize('SUPER_ADMIN', 'ADMIN'), getQuestionPaperDashboardStats);
router.put('/:id/approve', authorize('SUPER_ADMIN', 'ADMIN'), approveQuestionPaper);
router.put('/:id/reject', authorize('SUPER_ADMIN', 'ADMIN'), rejectQuestionPaper);
router.put('/:id/publish', authorize('SUPER_ADMIN', 'ADMIN'), publishQuestionPaper);
router.post('/toggle-permission', authorize('SUPER_ADMIN', 'ADMIN'), toggleTeacherPermission);

export default router;
