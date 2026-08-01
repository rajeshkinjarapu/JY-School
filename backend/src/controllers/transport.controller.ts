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
        stops: true,
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
    const { name, startPoint, endPoint, vehicleId } = req.body;
    const route = await prisma.transportRoute.create({
      data: { name, startPoint, endPoint, vehicleId: vehicleId || null }
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
        student: { include: { user: { select: { name: true } }, class: true } },
        route: true,
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
