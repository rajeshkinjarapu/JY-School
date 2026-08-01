import { Router } from 'express';
import { getVehicles, createVehicle, getRoutes, createRoute, getStudentTransports, assignStudentTransport } from '../controllers/transport.controller';
import { authenticate } from '../middlewares/auth';
import { requireRoles } from '../middlewares/requireRoles';

const router = Router();

router.use(authenticate);

// Super admin & admin only
router.use(requireRoles('SUPER_ADMIN', 'ADMIN'));

router.get('/vehicles', getVehicles);
router.post('/vehicles', createVehicle);

router.get('/routes', getRoutes);
router.post('/routes', createRoute);

router.get('/students', getStudentTransports);
router.post('/students', assignStudentTransport);

export default router;
