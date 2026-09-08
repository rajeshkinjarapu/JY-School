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
    generateQuestionsWithAI
} from '../controllers/onlineExams.controller';
import { protect, authorize } from '../middlewares/auth';
import multer from 'multer';

const router = express.Router();

// File upload setup for AI generation
const upload = multer({ 
    dest: 'uploads/temp/', 
    limits: { fileSize: 10 * 1024 * 1024 } 
});

// Admin Routes
router.post('/', protect, authorize('SUPER_ADMIN', 'ADMIN', 'TEACHER'), createOnlineExam);
router.get('/admin', protect, authorize('SUPER_ADMIN', 'ADMIN', 'TEACHER'), getAllExamsAdmin);
router.post('/:id/questions', protect, authorize('SUPER_ADMIN', 'ADMIN', 'TEACHER'), addQuestionToExam);
router.put('/:id/publish', protect, authorize('SUPER_ADMIN', 'ADMIN', 'TEACHER'), publishOnlineExam);
router.get('/:id/results', protect, authorize('SUPER_ADMIN', 'ADMIN', 'TEACHER'), getExamResults);

// AI Generation Route (Admin)
router.post('/generate-ai', protect, authorize('SUPER_ADMIN', 'ADMIN', 'TEACHER'), upload.single('file'), generateQuestionsWithAI);

// Student Routes
router.get('/student', protect, authorize('STUDENT'), getStudentExams);
router.get('/:id/take', protect, authorize('STUDENT'), takeExam);
router.post('/:id/submit', protect, authorize('STUDENT'), submitExam);

export default router;
