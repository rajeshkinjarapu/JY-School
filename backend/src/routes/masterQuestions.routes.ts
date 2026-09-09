import express from 'express';
import { 
  getMasterQuestions, 
  addMasterQuestion, 
  generateMasterQuestionsAI, 
  deleteMasterQuestion 
} from '../controllers/masterQuestions.controller';
import { protect } from '../middleware/auth.middleware';
import { checkRole } from '../middleware/role.middleware';

const router = express.Router();

// Only TEACHER, ADMIN, SUPER_ADMIN can manage the question bank
router.use(protect);
router.use(checkRole(['SUPER_ADMIN', 'ADMIN', 'TEACHER']));

router.get('/', getMasterQuestions);
router.post('/', addMasterQuestion);
router.post('/generate-ai', generateMasterQuestionsAI);
router.delete('/:id', deleteMasterQuestion);

export default router;
