import { Router } from 'express';
import { applyLeave, getMyLeaves, getAllLeaves, approveRejectLeave } from '../controllers/leave.controller';
import { authenticate } from '../middlewares/auth';

const router = Router();

// Staff and Students
router.post('/apply', authenticate, applyLeave);
router.get('/my-leaves', authenticate, getMyLeaves);

// Admins, Principals, HODs
router.get('/', authenticate, getAllLeaves); // Add role check middleware if applicable
router.patch('/:id/approve', authenticate, approveRejectLeave);

export default router;
