import express from 'express';
import { 
  getMasterQuestions, 
  addMasterQuestion, 
  generateMasterQuestionsAI, 
  deleteMasterQuestion 
} from '../controllers/masterQuestions.controller';
import { authenticate, authorize } from '../middlewares/auth';

const router = express.Router();

// Only TEACHER, ADMIN, SUPER_ADMIN can manage the question bank
router.use(authenticate);
router.use(authorize('SUPER_ADMIN', 'ADMIN', 'TEACHER'));

router.get('/', getMasterQuestions);
router.post('/', addMasterQuestion);
router.post('/generate-ai', generateMasterQuestionsAI);
router.delete('/:id', deleteMasterQuestion);

export default router;
