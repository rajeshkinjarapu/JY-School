import { Router } from 'express';
import { authenticate } from '../middlewares/auth';
import {
  register,
  login,
  refreshToken,
  logout,
  forgotPassword,
  resetPassword,
  getMe,
  changePassword,
} from '../controllers/auth.controller';

const router = Router();

router.post('/register', authenticate, register);
router.post('/login', login);
router.post('/refresh', refreshToken);
router.post('/logout', authenticate, logout);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/me', authenticate, getMe);
router.put('/change-password', authenticate, changePassword);

export default router;
