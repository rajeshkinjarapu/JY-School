import express from 'express';
import multer from 'multer';
import path from 'path';
import {
  getMasterQuestions,
  addMasterQuestion,
  bulkAddMasterQuestions,
  parseMasterTextAI,
  updateMasterQuestion,
  generateMasterQuestionsAI,
  deleteMasterQuestion,
} from '../controllers/masterQuestions.controller';
import { authenticate, authorize } from '../middlewares/auth';

const router = express.Router();

const upload = multer({
  dest: path.join(__dirname, '../../uploads/tmp/'),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB max
});

// Only TEACHER, ADMIN, SUPER_ADMIN can manage the question bank
router.use(authenticate);
router.use(authorize('SUPER_ADMIN', 'ADMIN', 'TEACHER'));

router.get('/', getMasterQuestions);
router.post('/', addMasterQuestion);
router.post('/bulk', bulkAddMasterQuestions);
router.post('/ai-parse-text', parseMasterTextAI);
router.post('/generate-ai', upload.single('file'), generateMasterQuestionsAI);
router.put('/:id', updateMasterQuestion);
router.delete('/:id', deleteMasterQuestion);

export default router;
