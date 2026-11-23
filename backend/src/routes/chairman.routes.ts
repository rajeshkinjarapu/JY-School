import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth';
import { Role } from '../types/enums';
import {
  getChairmanOverview,
  getChairmanApprovals,
  updateChairmanApproval,
  createInterBranchTransfer,
  broadcastGroupCircular,
} from '../controllers/chairman.controller';

const router = Router();

router.use(authenticate);

// Accessible by Group Chairman and Super Admin
router.get('/overview', authorize(Role.GROUP_CHAIRMAN, Role.SUPER_ADMIN), getChairmanOverview);
router.get('/approvals', authorize(Role.GROUP_CHAIRMAN, Role.SUPER_ADMIN), getChairmanApprovals);
router.patch('/approvals/:id', authorize(Role.GROUP_CHAIRMAN, Role.SUPER_ADMIN), updateChairmanApproval);
router.post('/transfers', authorize(Role.GROUP_CHAIRMAN, Role.SUPER_ADMIN), createInterBranchTransfer);
router.post('/circular', authorize(Role.GROUP_CHAIRMAN, Role.SUPER_ADMIN), broadcastGroupCircular);

export default router;
