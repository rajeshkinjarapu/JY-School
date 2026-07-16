import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth';
import {
  getSalaries, getSalaryById, createSalary, updateSalary,
  markSalaryPaid, deleteSalary, getSalarySummary,
} from '../controllers/salary.controller';

const router = Router();
router.use(authenticate);

router.get('/', authorize('SUPER_ADMIN', 'ADMIN', 'TEACHER'), getSalaries);
router.get('/summary', authorize('SUPER_ADMIN', 'ADMIN'), getSalarySummary);
router.get('/:id', authorize('SUPER_ADMIN', 'ADMIN', 'TEACHER'), getSalaryById);
router.post('/', authorize('SUPER_ADMIN', 'ADMIN'), createSalary);
router.put('/:id', authorize('SUPER_ADMIN', 'ADMIN'), updateSalary);
router.patch('/:id/mark-paid', authorize('SUPER_ADMIN', 'ADMIN'), markSalaryPaid);
router.delete('/:id', authorize('SUPER_ADMIN', 'ADMIN'), deleteSalary);

export default router;
