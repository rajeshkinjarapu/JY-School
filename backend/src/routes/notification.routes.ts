import { Router } from 'express';
import { authenticate } from '../middlewares/auth';
import { getNotifications, markAllAsRead, markAsRead, getVapidKey, subscribePush } from '../controllers/notifications.controller';

const router = Router();

router.use(authenticate);

router.get('/', getNotifications);
router.get('/vapid-public-key', getVapidKey);
router.post('/subscribe', subscribePush);
router.put('/read-all', markAllAsRead);
router.put('/:id/read', markAsRead);

export default router;
