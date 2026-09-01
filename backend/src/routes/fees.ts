import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth';
import {
  getStructures, createStructure, updateStructure, deleteStructure,
  getPayments, createPayment, updateFeePayment, getStudentFeeStatus, getOverdue,
  downloadInvoice, deleteFeePayment, applyFeeDiscount,
  bulkImportFees, bulkImportPayments, getPendingBalances,
  getFeeGroups, createFeeGroup, deleteFeeGroup,
  getFeeHeads, createFeeHead, deleteFeeHead,
  getFeeConcessions, createFeeConcession, deleteFeeConcession,
  studentPayFee, getPendingApprovals, approveFeePayment
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

// Fee Groups
router.get('/groups', getFeeGroups);
router.post('/groups', authorize('SUPER_ADMIN', 'ADMIN'), createFeeGroup);
router.delete('/groups/:id', authorize('SUPER_ADMIN', 'ADMIN'), deleteFeeGroup);

// Fee Heads
router.get('/heads', getFeeHeads);
router.post('/heads', authorize('SUPER_ADMIN', 'ADMIN'), createFeeHead);
router.delete('/heads/:id', authorize('SUPER_ADMIN', 'ADMIN'), deleteFeeHead);

// Fee Concessions
router.get('/concessions', getFeeConcessions);
router.post('/concessions', authorize('SUPER_ADMIN', 'ADMIN'), createFeeConcession);
router.delete('/concessions/:id', authorize('SUPER_ADMIN', 'ADMIN'), deleteFeeConcession);

// Payments — static routes MUST come before parameterised routes
router.get('/payments', authorize('SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT', 'TEACHER', 'STUDENT'), getPayments);
router.post('/payments/bulk-import', authorize('SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT'), upload.single('file'), bulkImportPayments);
router.post('/payments', authorize('SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT', 'TEACHER'), createPayment);
router.put('/payments/:id', authorize('SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT', 'TEACHER'), updateFeePayment);
router.delete('/payments/:id', authorize('SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT', 'TEACHER'), deleteFeePayment);
router.get('/payments/:paymentId/invoice', downloadInvoice);

router.get('/fix-1970-dates', async (req, res) => {
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();
  const invalidDate = new Date(1970, 0, 1);
  const now = new Date();
  
  try {
    const payments = await prisma.feePayment.findMany();
    let updated = 0;
    for (const p of payments) {
      if (p.paymentDate && p.paymentDate.getFullYear() === 1970) {
        await prisma.feePayment.update({
          where: { id: p.id },
          data: { paymentDate: p.createdAt }
        });
        updated++;
      }
    }
    res.json({ success: true, message: `Fixed ${updated} 1970 dates` });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/discounts', authorize('SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT', 'TEACHER'), applyFeeDiscount);

// Student fee status & payments
router.get('/student/:studentId', getStudentFeeStatus);
router.post('/student/pay', authorize('STUDENT', 'SUPER_ADMIN', 'ADMIN'), upload.single('screenshot'), studentPayFee);

// Admin fee approvals
router.get('/admin/pending', authorize('SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT'), getPendingApprovals);
router.put('/admin/approve/:paymentId', authorize('SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT'), approveFeePayment);

router.get('/overdue', authorize('SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT', 'TEACHER'), getOverdue);
router.get('/pending-balances', authorize('SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT'), getPendingBalances);

export default router;
