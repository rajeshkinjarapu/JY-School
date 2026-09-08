import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  createCompetitiveExam,
  getCompetitiveExamsByClass,
  addCompetitiveQuestion,
  generateCompetitiveQuestionsAI,
  getStudentCompetitiveExams,
  getCompetitiveExamDetails,
  submitCompetitiveExam
} from '../controllers/competitiveExams.controller';

const router = Router();

// Student Routes
router.get('/student', authenticate, getStudentCompetitiveExams);
router.get('/:id/student', authenticate, getCompetitiveExamDetails);
router.post('/:id/submit', authenticate, submitCompetitiveExam);

// Admin/Teacher Routes
router.post('/', authenticate, createCompetitiveExam);
router.get('/class/:classId', authenticate, getCompetitiveExamsByClass);
router.post('/:examId/questions', authenticate, addCompetitiveQuestion);
router.post('/:examId/questions/generate-ai', authenticate, generateCompetitiveQuestionsAI);

export default router;
