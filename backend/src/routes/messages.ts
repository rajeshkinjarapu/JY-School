import { Router } from 'express';
import { authenticate } from '../middlewares/auth';
import { getConversations, getConversation, sendMessage, getUnreadCount } from '../controllers/messages.controller';

const router = Router();

router.use(authenticate);

router.get('/conversations', getConversations);
router.get('/unread-count', getUnreadCount);
router.get('/:userId', getConversation);
router.post('/', sendMessage);

export default router;
