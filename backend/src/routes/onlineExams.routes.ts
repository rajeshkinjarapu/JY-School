import express from 'express';
import { 
    createOnlineExam, 
    addQuestionToExam, 
    publishOnlineExam,
    getStudentExams,
    takeExam,
    submitExam,
    getExamResults,
    getAllExamsAdmin,
    getExamByIdAdmin,
    generateQuestionsWithAI
} from '../controllers/onlineExams.controller';
import { authenticate, authorize } from '../middlewares/auth';
import multer from 'multer';

const router = express.Router();

// File upload setup for AI generation
const upload = multer({ 
    dest: 'uploads/temp/', 
    limits: { fileSize: 10 * 1024 * 1024 } 
});

// Admin Routes
router.post('/', authenticate, authorize('SUPER_ADMIN', 'ADMIN', 'TEACHER'), createOnlineExam);
router.get('/admin', authenticate, authorize('SUPER_ADMIN', 'ADMIN', 'TEACHER'), getAllExamsAdmin);
router.get('/:id/admin', authenticate, authorize('SUPER_ADMIN', 'ADMIN', 'TEACHER'), getExamByIdAdmin);
router.post('/:id/questions', authenticate, authorize('SUPER_ADMIN', 'ADMIN', 'TEACHER'), addQuestionToExam);
router.put('/:id/publish', authenticate, authorize('SUPER_ADMIN', 'ADMIN', 'TEACHER'), publishOnlineExam);
router.get('/:id/results', authenticate, authorize('SUPER_ADMIN', 'ADMIN', 'TEACHER'), getExamResults);

// AI Generation Route (Admin)
router.post('/generate-ai', authenticate, authorize('SUPER_ADMIN', 'ADMIN', 'TEACHER'), upload.single('file'), generateQuestionsWithAI);

// Student Routes
router.get('/student', authenticate, authorize('STUDENT'), getStudentExams);
router.get('/:id/take', authenticate, authorize('STUDENT'), takeExam);
router.post('/:id/submit', authenticate, authorize('STUDENT'), submitExam);

export default router;
