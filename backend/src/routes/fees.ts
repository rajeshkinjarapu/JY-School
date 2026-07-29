import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth';
import {
  getStructures, createStructure, updateStructure, deleteStructure,
  getPayments, createPayment, updateFeePayment, getStudentFeeStatus, getOverdue,
  downloadInvoice, deleteFeePayment, applyFeeDiscount,
  bulkImportFees, bulkImportPayments, getPendingBalances
} from '../controllers/fees.controller';
import { upload } from '../utils/upload';

const router = Router();

router.use(authenticate);

// Fee Structures
router.get('/structures', getStructures);
router.post('/structures/bulk-import', authorize('SUPER_ADMIN', 'ADMIN'), upload.single('file'), bulkImportFees);
router.post('/structures', authorize('SUPER_ADMIN', 'ADMIN'), createStructure);
router.put('/structures/:id', authorize('SUPER_ADMIN', 'ADMIN'), updateStructure);
router.delete('/structures/:id', authorize('SUPER_ADMIN', 'ADMIN'), deleteStructure);

// Payments — static routes MUST come before parameterised routes
router.get('/payments', authorize('SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT', 'TEACHER', 'STUDENT'), getPayments);
router.post('/payments/bulk-import', authorize('SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT'), upload.single('file'), bulkImportPayments);
router.post('/payments', authorize('SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT', 'TEACHER'), createPayment);
router.put('/payments/:id', authorize('SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT', 'TEACHER'), updateFeePayment);
router.delete('/payments/:id', authorize('SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT', 'TEACHER'), deleteFeePayment);
router.get('/payments/:paymentId/invoice', downloadInvoice);

router.post('/discounts', authorize('SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT', 'TEACHER'), applyFeeDiscount);

// Student fee status
router.get('/student/:studentId', getStudentFeeStatus);
router.get('/overdue', authorize('SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT', 'TEACHER'), getOverdue);
router.get('/pending-balances', authorize('SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT'), getPendingBalances);

export default router;
