import { Router } from 'express';
import {
  getVehicles,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  getRoutes,
  createRoute,
  deleteRoute,
  getStudentTransports,
  assignStudentTransport,
  deleteStudentTransport,
  getTransportDashboardStats,
  getFuelLogs,
  createFuelLog,
  getMaintenanceLogs,
  createMaintenanceLog,
  getTransportCrew,
  createTransportCrew,
  updateTransportCrew,
  deleteTransportCrew,
  getTripLogs,
  createTripLog,
  deleteTripLog,
} from '../controllers/transport.controller';
import { authenticate, authorize } from '../middlewares/auth';

const router = Router();
router.use(authenticate);

// Dashboard
router.get('/dashboard', authorize('SUPER_ADMIN', 'ADMIN', 'TRANSPORT_MANAGER'), getTransportDashboardStats);

// Vehicles & Compliance
router.get('/vehicles', getVehicles);
router.post('/vehicles', authorize('SUPER_ADMIN', 'ADMIN', 'TRANSPORT_MANAGER'), createVehicle);
router.put('/vehicles/:id', authorize('SUPER_ADMIN', 'ADMIN', 'TRANSPORT_MANAGER'), updateVehicle);
router.delete('/vehicles/:id', authorize('SUPER_ADMIN', 'ADMIN', 'TRANSPORT_MANAGER'), deleteVehicle);

// Routes & Stops
router.get('/routes', getRoutes);
router.post('/routes', authorize('SUPER_ADMIN', 'ADMIN', 'TRANSPORT_MANAGER'), createRoute);
router.delete('/routes/:id', authorize('SUPER_ADMIN', 'ADMIN', 'TRANSPORT_MANAGER'), deleteRoute);

// Student Allocations
router.get('/students', authorize('SUPER_ADMIN', 'ADMIN', 'TRANSPORT_MANAGER', 'ACCOUNTANT'), getStudentTransports);
router.post('/students', authorize('SUPER_ADMIN', 'ADMIN', 'TRANSPORT_MANAGER'), assignStudentTransport);
router.delete('/students/:id', authorize('SUPER_ADMIN', 'ADMIN', 'TRANSPORT_MANAGER'), deleteStudentTransport);

// Drivers & Transport Crew
router.get('/crew', authorize('SUPER_ADMIN', 'ADMIN', 'TRANSPORT_MANAGER'), getTransportCrew);
router.post('/crew', authorize('SUPER_ADMIN', 'ADMIN', 'TRANSPORT_MANAGER'), createTransportCrew);
router.put('/crew/:id', authorize('SUPER_ADMIN', 'ADMIN', 'TRANSPORT_MANAGER'), updateTransportCrew);
router.delete('/crew/:id', authorize('SUPER_ADMIN', 'ADMIN', 'TRANSPORT_MANAGER'), deleteTransportCrew);

// Daily Trip Dispatch Logs
router.get('/trips', authorize('SUPER_ADMIN', 'ADMIN', 'TRANSPORT_MANAGER'), getTripLogs);
router.post('/trips', authorize('SUPER_ADMIN', 'ADMIN', 'TRANSPORT_MANAGER'), createTripLog);
router.delete('/trips/:id', authorize('SUPER_ADMIN', 'ADMIN', 'TRANSPORT_MANAGER'), deleteTripLog);

// Fuel Logs
router.get('/fuel-logs', authorize('SUPER_ADMIN', 'ADMIN', 'TRANSPORT_MANAGER'), getFuelLogs);
router.post('/fuel-logs', authorize('SUPER_ADMIN', 'ADMIN', 'TRANSPORT_MANAGER'), createFuelLog);

// Maintenance Logs
router.get('/maintenance-logs', authorize('SUPER_ADMIN', 'ADMIN', 'TRANSPORT_MANAGER'), getMaintenanceLogs);
router.post('/maintenance-logs', authorize('SUPER_ADMIN', 'ADMIN', 'TRANSPORT_MANAGER'), createMaintenanceLog);

export default router;
