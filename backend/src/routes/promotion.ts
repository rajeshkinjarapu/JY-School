import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth';
import {
  getAcademicYears,
  getClassesByYear,
  getStudentsForPromotion,
  executeBulkPromotion,
  cloneClasses,
  getPromotionHistory
} from '../controllers/promotion.controller';

const router = Router();

router.use(authenticate);

// Super Admin and Admin can access promotion features
router.use(authorize('SUPER_ADMIN', 'ADMIN'));

router.get('/years', getAcademicYears);
router.get('/classes', getClassesByYear);
router.get('/students', getStudentsForPromotion);
router.get('/history', getPromotionHistory);
router.post('/execute', executeBulkPromotion);
router.post('/clone-classes', cloneClasses);

export default router;
