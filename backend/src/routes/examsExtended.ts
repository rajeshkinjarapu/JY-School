import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth';
import {
  getExamPlans,
  createExamPlan,
  updateExamPlan,
  deleteExamPlan,
  getQuestionGroups,
  createQuestionGroup,
  deleteQuestionGroup,
  getQuestions,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  getOnlineExams,
  createOnlineExam,
  deleteOnlineExam,
  getOnlineExamForTake,
  submitOnlineExam,
  getOnlineExamSubmissions
} from '../controllers/examsExtended.controller';

const router = Router();

router.use(authenticate);

// Exam Plans
router.get('/plans', getExamPlans);
router.post('/plans', authorize('SUPER_ADMIN', 'ADMIN'), createExamPlan);
router.put('/plans/:id', authorize('SUPER_ADMIN', 'ADMIN'), updateExamPlan);
router.delete('/plans/:id', authorize('SUPER_ADMIN', 'ADMIN'), deleteExamPlan);

// Question Groups
router.get('/question-groups', getQuestionGroups);
router.post('/question-groups', authorize('SUPER_ADMIN', 'ADMIN', 'TEACHER'), createQuestionGroup);
router.delete('/question-groups/:id', authorize('SUPER_ADMIN', 'ADMIN', 'TEACHER'), deleteQuestionGroup);

// Question Bank
router.get('/questions', getQuestions);
router.post('/questions', authorize('SUPER_ADMIN', 'ADMIN', 'TEACHER'), createQuestion);
router.put('/questions/:id', authorize('SUPER_ADMIN', 'ADMIN', 'TEACHER'), updateQuestion);
router.delete('/questions/:id', authorize('SUPER_ADMIN', 'ADMIN', 'TEACHER'), deleteQuestion);

// Online Exams
router.get('/online-exams', getOnlineExams);
router.post('/online-exams', authorize('SUPER_ADMIN', 'ADMIN', 'TEACHER'), createOnlineExam);
router.delete('/online-exams/:id', authorize('SUPER_ADMIN', 'ADMIN', 'TEACHER'), deleteOnlineExam);
router.get('/online-exams/:id', getOnlineExamForTake);
router.post('/online-exams/:id/submit', submitOnlineExam);
router.get('/online-exams/:id/submissions', authorize('SUPER_ADMIN', 'ADMIN', 'TEACHER'), getOnlineExamSubmissions);

export default router;
