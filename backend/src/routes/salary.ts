import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth';
import {
  getSalaries, getSalaryById, createSalary, updateSalary,
  markSalaryPaid, deleteSalary, getSalarySummary,
  getSalaryAnalytics, processPayroll, bulkMarkPaid,
} from '../controllers/salary.controller';

const router = Router();
router.use(authenticate);

router.get('/analytics', authorize('SUPER_ADMIN', 'ADMIN'), getSalaryAnalytics);
router.post('/process-payroll', authorize('SUPER_ADMIN', 'ADMIN'), processPayroll);
router.post('/bulk-pay', authorize('SUPER_ADMIN', 'ADMIN'), bulkMarkPaid);

router.get('/', authorize('SUPER_ADMIN', 'ADMIN', 'TEACHER'), getSalaries);
router.get('/summary', authorize('SUPER_ADMIN', 'ADMIN'), getSalarySummary);
router.get('/:id', authorize('SUPER_ADMIN', 'ADMIN', 'TEACHER'), getSalaryById);
router.post('/', authorize('SUPER_ADMIN', 'ADMIN'), createSalary);
router.put('/:id', authorize('SUPER_ADMIN', 'ADMIN'), updateSalary);
router.patch('/:id/mark-paid', authorize('SUPER_ADMIN', 'ADMIN'), markSalaryPaid);
router.delete('/:id', authorize('SUPER_ADMIN', 'ADMIN'), deleteSalary);

export default router;
