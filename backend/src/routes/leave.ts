import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth';
import {
  requestLeave,
  getMyLeaves,
  getAllLeaves,
  updateLeaveStatus
} from '../controllers/leave.controller';

const router = Router();

router.use(authenticate);

// Teacher creates leave or permission
router.post('/', authorize('TEACHER', 'SUPER_ADMIN', 'ADMIN'), requestLeave);

// Get my leaves
router.get('/my', authorize('TEACHER', 'SUPER_ADMIN', 'ADMIN'), getMyLeaves);

// Admin gets all leaves
router.get('/', authorize('SUPER_ADMIN', 'ADMIN'), getAllLeaves);

// Admin updates status
router.put('/:id/status', authorize('SUPER_ADMIN', 'ADMIN'), updateLeaveStatus);

export default router;
