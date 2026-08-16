import { Router } from 'express';
import { getVehicles, createVehicle, getRoutes, createRoute, getStudentTransports, assignStudentTransport } from '../controllers/transport.controller';
import { authenticate, authorize } from '../middlewares/auth';

const router = Router();

router.use(authenticate);

router.get('/vehicles', getVehicles);
router.post('/vehicles', authorize('SUPER_ADMIN', 'ADMIN'), createVehicle);

router.get('/routes', getRoutes);
router.post('/routes', authorize('SUPER_ADMIN', 'ADMIN'), createRoute);

router.get('/students', authorize('SUPER_ADMIN', 'ADMIN'), getStudentTransports);
router.post('/students', authorize('SUPER_ADMIN', 'ADMIN'), assignStudentTransport);

export default router;
