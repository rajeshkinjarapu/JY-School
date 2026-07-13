import { Router } from 'express';
import { getSettings, updateSettings, getAcademicYears } from '../controllers/settings.controller';
import { authenticate, authorize } from '../middlewares/auth';
import { Role } from '../types/enums';

const router = Router();

router.use(authenticate);

router.get('/', getSettings);
router.put('/', authorize(Role.SUPER_ADMIN, Role.ADMIN), updateSettings);
router.get('/academic-years', getAcademicYears);

export default router;
