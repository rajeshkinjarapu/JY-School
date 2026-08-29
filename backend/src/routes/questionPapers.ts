import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth';
import { getAllQuestionPapers, createQuestionPaper, deleteQuestionPaper, updateAnswerKey } from '../controllers/questionPapers.controller';

const router = Router();

router.use(authenticate);

router.get('/', getAllQuestionPapers);
router.post('/', authorize('SUPER_ADMIN', 'ADMIN', 'TEACHER'), createQuestionPaper);
router.put('/:id/answer-key', authorize('SUPER_ADMIN', 'ADMIN', 'TEACHER'), updateAnswerKey);
router.delete('/:id', authorize('SUPER_ADMIN', 'ADMIN'), deleteQuestionPaper);

export default router;
