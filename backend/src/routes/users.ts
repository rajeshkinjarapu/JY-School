import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth';
import { getAll, getById, createUser, update, deleteUser, saveDeviceToken, updateAppInfo, getAppInstalls, getUserPhoto } from '../controllers/users.controller';

const router = Router();

// Public route for photos (does not need authentication if we want it to load easily in standard img tags, but let's see. Better to keep it public for easy caching)
router.get('/:id/photo', getUserPhoto);

router.use(authenticate);

router.post('/device-token', saveDeviceToken);
router.post('/app-info', updateAppInfo);

router.get('/app-installs', authorize('SUPER_ADMIN', 'ADMIN'), getAppInstalls);
router.get('/', authorize('SUPER_ADMIN', 'ADMIN'), getAll);
router.get('/:id', authorize('SUPER_ADMIN', 'ADMIN'), getById);
router.post('/', authorize('SUPER_ADMIN', 'ADMIN'), createUser);
router.put('/:id', authorize('SUPER_ADMIN', 'ADMIN'), update);
router.delete('/:id', authorize('SUPER_ADMIN', 'ADMIN'), deleteUser);

export default router;
