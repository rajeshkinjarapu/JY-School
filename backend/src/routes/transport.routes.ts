import { Router } from 'express';
import { 
  getVehicles, createVehicle, updateVehicle, deleteVehicle,
  getRoutes, createRoute, deleteRoute,
  getStudentTransports, assignStudentTransport, deleteStudentTransport,
  getTransportDashboardStats,
  getFuelLogs, createFuelLog,
  getMaintenanceLogs, createMaintenanceLog
} from '../controllers/transport.controller';
import { authenticate, authorize } from '../middlewares/auth';

const router = Router();

router.use(authenticate);

// Dashboard
router.get('/dashboard', authorize('SUPER_ADMIN', 'ADMIN'), getTransportDashboardStats);

// Vehicles
router.get('/vehicles', getVehicles);
router.post('/vehicles', authorize('SUPER_ADMIN', 'ADMIN'), createVehicle);
router.put('/vehicles/:id', authorize('SUPER_ADMIN', 'ADMIN'), updateVehicle);
router.delete('/vehicles/:id', authorize('SUPER_ADMIN', 'ADMIN'), deleteVehicle);

// Routes & Stops
router.get('/routes', getRoutes);
router.post('/routes', authorize('SUPER_ADMIN', 'ADMIN'), createRoute);
router.delete('/routes/:id', authorize('SUPER_ADMIN', 'ADMIN'), deleteRoute);

// Student Allocations
router.get('/students', authorize('SUPER_ADMIN', 'ADMIN'), getStudentTransports);
router.post('/students', authorize('SUPER_ADMIN', 'ADMIN'), assignStudentTransport);
router.delete('/students/:id', authorize('SUPER_ADMIN', 'ADMIN'), deleteStudentTransport);

// Fuel Logs
router.get('/fuel-logs', authorize('SUPER_ADMIN', 'ADMIN'), getFuelLogs);
router.post('/fuel-logs', authorize('SUPER_ADMIN', 'ADMIN'), createFuelLog);

// Maintenance Logs
router.get('/maintenance-logs', authorize('SUPER_ADMIN', 'ADMIN'), getMaintenanceLogs);
router.post('/maintenance-logs', authorize('SUPER_ADMIN', 'ADMIN'), createMaintenanceLog);

export default router;
