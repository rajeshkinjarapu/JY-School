import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth';
import { getNotifications, markAllAsRead, markAsRead, getVapidKey, subscribePush, sendCustomNotification } from '../controllers/notifications.controller';
import { Role } from '../types/enums';

const router = Router();

router.use(authenticate);

router.get('/', getNotifications);
router.get('/vapid-public-key', getVapidKey);
router.post('/subscribe', subscribePush);
router.put('/read-all', markAllAsRead);
router.put('/:id/read', markAsRead);
router.post('/send-custom', authorize(Role.SUPER_ADMIN, Role.ADMIN), sendCustomNotification);

export default router;
