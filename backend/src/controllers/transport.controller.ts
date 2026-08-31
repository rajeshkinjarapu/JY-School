import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';

export const getVehicles = async (req: Request, res: Response) => {
  try {
    const vehicles = await prisma.vehicle.findMany({
      include: { transportStaff: { include: { user: { select: { name: true } } } } }
    });
    res.json(vehicles);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const createVehicle = async (req: Request, res: Response) => {
  try {
    const { registrationNo, make, model, capacity, status } = req.body;
    const vehicle = await prisma.vehicle.create({
      data: { registrationNo, make, model, capacity: Number(capacity), status }
    });
    res.status(201).json(vehicle);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getRoutes = async (req: Request, res: Response) => {
  try {
    const routes = await prisma.transportRoute.findMany({
      include: {
        vehicle: true,
        stops: {
          orderBy: { createdAt: 'asc' }
        },
        _count: { select: { students: true } }
      }
    });
    res.json(routes);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const createRoute = async (req: Request, res: Response) => {
  try {
    const { name, startPoint, endPoint, vehicleId, stops } = req.body;
    // stops is an array of { stopName, pickupTime, dropTime, distance, monthlyFee, latitude, longitude }
    const route = await prisma.transportRoute.create({
      data: { 
        name, startPoint, endPoint, vehicleId: vehicleId || null,
        stops: {
          create: stops || []
        }
      },
      include: { stops: true }
    });
    res.status(201).json(route);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getStudentTransports = async (req: Request, res: Response) => {
  try {
    const data = await prisma.studentTransport.findMany({
      include: {
        student: { include: { user: { select: { name: true, phone: true } }, class: true } },
        route: { include: { vehicle: true } },
        stop: true
      }
    });
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const assignStudentTransport = async (req: Request, res: Response) => {
  try {
    const { studentId, routeId, stopId } = req.body;
    // check if exists
    const existing = await prisma.studentTransport.findUnique({ where: { studentId } });
    if (existing) {
      const updated = await prisma.studentTransport.update({
        where: { studentId },
        data: { routeId, stopId }
      });
      return res.json(updated);
    }
    const created = await prisma.studentTransport.create({
      data: { studentId, routeId, stopId }
    });
    res.status(201).json(created);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

// ======================= NEW ENDPOINTS FOR PHASE 2 =======================

export const getTransportDashboardStats = async (req: Request, res: Response) => {
  try {
    const totalVehicles = await prisma.vehicle.count();
    const activeVehicles = await prisma.vehicle.count({ where: { status: 'ACTIVE' } });
    const totalRoutes = await prisma.transportRoute.count();
    const totalStudents = await prisma.studentTransport.count();

    // Get costs for the current month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const fuelLogs = await prisma.transportFuelLog.aggregate({
      where: { date: { gte: startOfMonth } },
      _sum: { totalCost: true, liters: true }
    });

    const maintenanceLogs = await prisma.transportMaintenanceLog.aggregate({
      where: { date: { gte: startOfMonth } },
      _sum: { cost: true }
    });

    res.json({
      totalVehicles,
      activeVehicles,
      totalRoutes,
      totalStudents,
      monthlyFuelCost: fuelLogs._sum.totalCost || 0,
      monthlyFuelLiters: fuelLogs._sum.liters || 0,
      monthlyMaintenanceCost: maintenanceLogs._sum.cost || 0,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getFuelLogs = async (req: Request, res: Response) => {
  try {
    const logs = await prisma.transportFuelLog.findMany({
      include: { vehicle: true },
      orderBy: { date: 'desc' }
    });
    res.json(logs);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const createFuelLog = async (req: Request, res: Response) => {
  try {
    const { vehicleId, date, liters, costPerLiter, totalCost, odometerReading, remarks } = req.body;
    const log = await prisma.transportFuelLog.create({
      data: { vehicleId, date: new Date(date), liters: Number(liters), costPerLiter: Number(costPerLiter), totalCost: Number(totalCost), odometerReading: odometerReading ? Number(odometerReading) : null, remarks }
    });
    res.status(201).json(log);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getMaintenanceLogs = async (req: Request, res: Response) => {
  try {
    const logs = await prisma.transportMaintenanceLog.findMany({
      include: { vehicle: true },
      orderBy: { date: 'desc' }
    });
    res.json(logs);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const createMaintenanceLog = async (req: Request, res: Response) => {
  try {
    const { vehicleId, date, description, cost, mechanicDetails } = req.body;
    const log = await prisma.transportMaintenanceLog.create({
      data: { vehicleId, date: new Date(date), description, cost: Number(cost), mechanicDetails }
    });
    res.status(201).json(log);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};
export const updateVehicle = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { registrationNo, make, model, capacity, status } = req.body;
    const vehicle = await prisma.vehicle.update({
      where: { id },
      data: { registrationNo, make, model, capacity: Number(capacity), status }
    });
    res.json(vehicle);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteVehicle = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.vehicle.delete({ where: { id } });
    res.json({ message: 'Deleted successfully' });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteRoute = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.transportRoute.delete({ where: { id } });
    res.json({ message: 'Deleted successfully' });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteStudentTransport = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.studentTransport.delete({ where: { id } });
    res.json({ message: 'Deleted successfully' });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};
