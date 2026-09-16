import { Router } from 'express';
import { 
  getWebsiteData, updateSettings, 
  createStat, updateStat, deleteStat,
  createProgram, updateProgram, deleteProgram,
  createTestimonial, updateTestimonial, deleteTestimonial,
  createNews, updateNews, deleteNews 
} from '../controllers/website.controller';
import { protect, restrictTo } from '../middlewares/auth';

const router = Router();

// Public route for Vercel website
router.get('/data', getWebsiteData);

// Protected Admin Routes
router.use(protect);
router.use(restrictTo('SUPER_ADMIN', 'ADMIN'));

router.put('/settings', updateSettings);

router.post('/stats', createStat);
router.put('/stats/:id', updateStat);
router.delete('/stats/:id', deleteStat);

router.post('/programs', createProgram);
router.put('/programs/:id', updateProgram);
router.delete('/programs/:id', deleteProgram);

router.post('/testimonials', createTestimonial);
router.put('/testimonials/:id', updateTestimonial);
router.delete('/testimonials/:id', deleteTestimonial);

router.post('/news', createNews);
router.put('/news/:id', updateNews);
router.delete('/news/:id', deleteNews);

export default router;
