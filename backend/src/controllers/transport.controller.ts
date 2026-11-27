import { Request, Response } from 'express';
import { randomUUID } from 'crypto';
import { prisma } from '../utils/prisma';

let transportTablesEnsured = false;

const TRANSPORT_DDL_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS "VehicleCompliance" (
    "vehicleId" TEXT PRIMARY KEY,
    "insuranceExpiry" TIMESTAMP(3),
    "fitnessExpiry" TIMESTAMP(3),
    "permitExpiry" TIMESTAMP(3),
    "pucExpiry" TIMESTAMP(3),
    "gpsDeviceId" TEXT,
    "hasCctv" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS "TransportCrew" (
    "id" TEXT PRIMARY KEY,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "role" TEXT NOT NULL DEFAULT 'DRIVER',
    "vehicleId" TEXT,
    "licenseNo" TEXT,
    "licenseExpiry" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS "TransportTripLog" (
    "id" TEXT PRIMARY KEY,
    "routeId" TEXT NOT NULL,
    "vehicleId" TEXT,
    "tripDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "shift" TEXT NOT NULL DEFAULT 'MORNING_PICKUP',
    "status" TEXT NOT NULL DEFAULT 'ON_TIME',
    "studentsBoarded" INTEGER NOT NULL DEFAULT 0,
    "delayMinutes" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
];

const ensureTransportTables = async () => {
  if (transportTablesEnsured) return;
  let allOk = true;
  for (const sql of TRANSPORT_DDL_STATEMENTS) {
    try {
      await prisma.$executeRawUnsafe(sql);
    } catch (err: any) {
      allOk = false;
      console.warn('Notice ensuring Transport DDL:', err?.message);
    }
  }
  if (allOk) transportTablesEnsured = true;
};

const toDateOrNull = (val: any): Date | null => {
  if (!val) return null;
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
};

const daysUntil = (d: Date | string | null | undefined): number | null => {
  if (!d) return null;
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return null;
  return Math.ceil((dt.getTime() - Date.now()) / 86400000);
};

// ─────────────────────────────────────────────────────────────────────────────
// VEHICLES & COMPLIANCE
// ─────────────────────────────────────────────────────────────────────────────
export const getVehicles = async (_req: Request, res: Response) => {
  try {
    await ensureTransportTables();
    const vehicles = await prisma.vehicle.findMany({
      orderBy: { registrationNo: 'asc' },
      include: {
        routes: { select: { id: true, name: true } },
        _count: { select: { fuelLogs: true, maintenanceLogs: true } },
      },
    });

    const complianceRows = await prisma.$queryRaw<any[]>`
      SELECT "vehicleId", "insuranceExpiry", "fitnessExpiry", "permitExpiry", "pucExpiry", "gpsDeviceId", "hasCctv"
      FROM "VehicleCompliance"
    `.catch(() => [] as any[]);

    const crewRows = await prisma.$queryRaw<any[]>`
      SELECT "id", "name", "phone", "role", "vehicleId"
      FROM "TransportCrew"
      WHERE "status" = 'ACTIVE'
    `.catch(() => [] as any[]);

    const compMap = new Map(complianceRows.map(c => [c.vehicleId, c]));
    const crewMap = new Map<string, any[]>();
    for (const c of crewRows) {
      if (!c.vehicleId) continue;
      if (!crewMap.has(c.vehicleId)) crewMap.set(c.vehicleId, []);
      crewMap.get(c.vehicleId)!.push(c);
    }

    const enriched = vehicles.map(v => ({
      ...v,
      compliance: compMap.get(v.id) || null,
      crew: crewMap.get(v.id) || [],
    }));

    res.json(enriched);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const createVehicle = async (req: Request, res: Response) => {
  try {
    await ensureTransportTables();
    const {
      registrationNo,
      make,
      model,
      capacity,
      status,
      insuranceExpiry,
      fitnessExpiry,
      permitExpiry,
      pucExpiry,
      gpsDeviceId,
      hasCctv,
    } = req.body;

    const vehicle = await prisma.vehicle.create({
      data: {
        registrationNo,
        make: make || null,
        model: model || null,
        capacity: Number(capacity) || 40,
        status: status || 'ACTIVE',
      },
    });

    await prisma.$executeRaw`
      INSERT INTO "VehicleCompliance" ("vehicleId", "insuranceExpiry", "fitnessExpiry", "permitExpiry", "pucExpiry", "gpsDeviceId", "hasCctv", "updatedAt")
      VALUES (${vehicle.id}, ${toDateOrNull(insuranceExpiry)}, ${toDateOrNull(fitnessExpiry)}, ${toDateOrNull(permitExpiry)}, ${toDateOrNull(pucExpiry)}, ${gpsDeviceId || null}, ${Boolean(hasCctv)}, NOW())
      ON CONFLICT ("vehicleId") DO UPDATE SET
        "insuranceExpiry" = EXCLUDED."insuranceExpiry",
        "fitnessExpiry" = EXCLUDED."fitnessExpiry",
        "permitExpiry" = EXCLUDED."permitExpiry",
        "pucExpiry" = EXCLUDED."pucExpiry",
        "gpsDeviceId" = EXCLUDED."gpsDeviceId",
        "hasCctv" = EXCLUDED."hasCctv",
        "updatedAt" = NOW()
    `.catch(() => {});

    res.status(201).json(vehicle);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const updateVehicle = async (req: Request, res: Response) => {
  try {
    await ensureTransportTables();
    const { id } = req.params;
    const {
      registrationNo,
      make,
      model,
      capacity,
      status,
      insuranceExpiry,
      fitnessExpiry,
      permitExpiry,
      pucExpiry,
      gpsDeviceId,
      hasCctv,
    } = req.body;

    const vehicle = await prisma.vehicle.update({
      where: { id },
      data: {
        registrationNo,
        make: make || null,
        model: model || null,
        capacity: Number(capacity) || 40,
        status,
      },
    });

    await prisma.$executeRaw`
      INSERT INTO "VehicleCompliance" ("vehicleId", "insuranceExpiry", "fitnessExpiry", "permitExpiry", "pucExpiry", "gpsDeviceId", "hasCctv", "updatedAt")
      VALUES (${id}, ${toDateOrNull(insuranceExpiry)}, ${toDateOrNull(fitnessExpiry)}, ${toDateOrNull(permitExpiry)}, ${toDateOrNull(pucExpiry)}, ${gpsDeviceId || null}, ${Boolean(hasCctv)}, NOW())
      ON CONFLICT ("vehicleId") DO UPDATE SET
        "insuranceExpiry" = EXCLUDED."insuranceExpiry",
        "fitnessExpiry" = EXCLUDED."fitnessExpiry",
        "permitExpiry" = EXCLUDED."permitExpiry",
        "pucExpiry" = EXCLUDED."pucExpiry",
        "gpsDeviceId" = EXCLUDED."gpsDeviceId",
        "hasCctv" = EXCLUDED."hasCctv",
        "updatedAt" = NOW()
    `.catch(() => {});

    res.json(vehicle);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteVehicle = async (req: Request, res: Response) => {
  try {
    await ensureTransportTables();
    const { id } = req.params;
    await prisma.$executeRaw`DELETE FROM "VehicleCompliance" WHERE "vehicleId" = ${id}`.catch(() => {});
    await prisma.$executeRaw`UPDATE "TransportCrew" SET "vehicleId" = NULL WHERE "vehicleId" = ${id}`.catch(() => {});
    await prisma.transportRoute.updateMany({ where: { vehicleId: id }, data: { vehicleId: null } });
    await prisma.vehicle.delete({ where: { id } });
    res.json({ message: 'Deleted successfully' });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// ROUTES & STOPS
// ─────────────────────────────────────────────────────────────────────────────
export const getRoutes = async (_req: Request, res: Response) => {
  try {
    const routes = await prisma.transportRoute.findMany({
      include: {
        vehicle: true,
        stops: { orderBy: { createdAt: 'asc' } },
        _count: { select: { students: true } },
      },
      orderBy: { name: 'asc' },
    });
    res.json(routes);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const createRoute = async (req: Request, res: Response) => {
  try {
    const { name, startPoint, endPoint, vehicleId, stops } = req.body;
    const route = await prisma.transportRoute.create({
      data: {
        name,
        startPoint,
        endPoint,
        vehicleId: vehicleId || null,
        stops: { create: stops || [] },
      },
      include: { stops: true },
    });
    res.status(201).json(route);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteRoute = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.studentTransport.deleteMany({ where: { routeId: id } });
    await prisma.transportRoute.delete({ where: { id } });
    res.json({ message: 'Deleted successfully' });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// STUDENT ALLOCATIONS
// ─────────────────────────────────────────────────────────────────────────────
export const getStudentTransports = async (_req: Request, res: Response) => {
  try {
    const data = await prisma.studentTransport.findMany({
      include: {
        student: {
          include: {
            user: { select: { name: true, phone: true, photoUrl: true } },
            class: true,
          },
        },
        route: { include: { vehicle: true } },
        stop: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const assignStudentTransport = async (req: Request, res: Response) => {
  try {
    const { studentId, routeId, stopId } = req.body;
    const existing = await prisma.studentTransport.findUnique({ where: { studentId } });
    if (existing) {
      const updated = await prisma.studentTransport.update({
        where: { studentId },
        data: { routeId, stopId },
      });
      return res.json(updated);
    }
    const created = await prisma.studentTransport.create({
      data: { studentId, routeId, stopId },
    });
    res.status(201).json(created);
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

// ─────────────────────────────────────────────────────────────────────────────
// DRIVERS & TRANSPORT CREW
// ─────────────────────────────────────────────────────────────────────────────
export const getTransportCrew = async (_req: Request, res: Response) => {
  try {
    await ensureTransportTables();
    const crewRows = await prisma.$queryRaw<any[]>`
      SELECT "id", "name", "phone", "role", "vehicleId", "licenseNo", "licenseExpiry", "status", "createdAt"
      FROM "TransportCrew"
      ORDER BY "createdAt" DESC
    `;
    const vehicles = await prisma.vehicle.findMany({ select: { id: true, registrationNo: true, make: true, model: true } });
    const vMap = new Map(vehicles.map(v => [v.id, v]));

    res.json(
      crewRows.map(c => ({
        ...c,
        vehicle: c.vehicleId ? vMap.get(c.vehicleId) || null : null,
      }))
    );
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const createTransportCrew = async (req: Request, res: Response) => {
  try {
    await ensureTransportTables();
    const { name, phone, role, vehicleId, licenseNo, licenseExpiry, status } = req.body;
    if (!name?.trim()) return res.status(400).json({ message: 'Crew member name is required' });

    const id = randomUUID();
    await prisma.$executeRaw`
      INSERT INTO "TransportCrew" ("id", "name", "phone", "role", "vehicleId", "licenseNo", "licenseExpiry", "status", "createdAt")
      VALUES (${id}, ${name.trim()}, ${phone || null}, ${role || 'DRIVER'}, ${vehicleId || null}, ${licenseNo || null}, ${toDateOrNull(licenseExpiry)}, ${status || 'ACTIVE'}, NOW())
    `;
    res.status(201).json({ id, name: name.trim(), role: role || 'DRIVER' });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const updateTransportCrew = async (req: Request, res: Response) => {
  try {
    await ensureTransportTables();
    const { id } = req.params;
    const { name, phone, role, vehicleId, licenseNo, licenseExpiry, status } = req.body;

    await prisma.$executeRaw`
      UPDATE "TransportCrew" SET
        "name" = ${name?.trim() || 'Driver'},
        "phone" = ${phone || null},
        "role" = ${role || 'DRIVER'},
        "vehicleId" = ${vehicleId || null},
        "licenseNo" = ${licenseNo || null},
        "licenseExpiry" = ${toDateOrNull(licenseExpiry)},
        "status" = ${status || 'ACTIVE'}
      WHERE "id" = ${id}
    `;
    res.json({ id, message: 'Crew member updated' });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteTransportCrew = async (req: Request, res: Response) => {
  try {
    await ensureTransportTables();
    await prisma.$executeRaw`DELETE FROM "TransportCrew" WHERE "id" = ${req.params.id}`;
    res.json({ message: 'Crew member deleted' });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// DAILY TRIP DISPATCH LOGS
// ─────────────────────────────────────────────────────────────────────────────
export const getTripLogs = async (_req: Request, res: Response) => {
  try {
    await ensureTransportTables();
    const trips = await prisma.$queryRaw<any[]>`
      SELECT "id", "routeId", "vehicleId", "tripDate", "shift", "status", "studentsBoarded", "delayMinutes", "notes", "createdAt"
      FROM "TransportTripLog"
      ORDER BY "tripDate" DESC, "createdAt" DESC
      LIMIT 100
    `;
    const [routes, vehicles] = await Promise.all([
      prisma.transportRoute.findMany({ select: { id: true, name: true, startPoint: true, endPoint: true } }),
      prisma.vehicle.findMany({ select: { id: true, registrationNo: true } }),
    ]);
    const rMap = new Map(routes.map(r => [r.id, r]));
    const vMap = new Map(vehicles.map(v => [v.id, v]));

    res.json(
      trips.map(t => ({
        ...t,
        route: rMap.get(t.routeId) || null,
        vehicle: t.vehicleId ? vMap.get(t.vehicleId) || null : null,
      }))
    );
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const createTripLog = async (req: Request, res: Response) => {
  try {
    await ensureTransportTables();
    const { routeId, vehicleId, tripDate, shift, status, studentsBoarded, delayMinutes, notes } = req.body;
    if (!routeId) return res.status(400).json({ message: 'Route is required' });

    const id = randomUUID();
    const dt = toDateOrNull(tripDate) || new Date();
    await prisma.$executeRaw`
      INSERT INTO "TransportTripLog" ("id", "routeId", "vehicleId", "tripDate", "shift", "status", "studentsBoarded", "delayMinutes", "notes", "createdAt")
      VALUES (${id}, ${routeId}, ${vehicleId || null}, ${dt}, ${shift || 'MORNING_PICKUP'}, ${status || 'ON_TIME'}, ${Number(studentsBoarded) || 0}, ${Number(delayMinutes) || 0}, ${notes || null}, NOW())
    `;
    res.status(201).json({ id, message: 'Trip logged' });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteTripLog = async (req: Request, res: Response) => {
  try {
    await ensureTransportTables();
    await prisma.$executeRaw`DELETE FROM "TransportTripLog" WHERE "id" = ${req.params.id}`;
    res.json({ message: 'Trip log deleted' });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// EXECUTIVE REAL-TIME TRANSPORT COMMAND CENTER STATS
// ─────────────────────────────────────────────────────────────────────────────
export const getTransportDashboardStats = async (_req: Request, res: Response) => {
  try {
    await ensureTransportTables();

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [
      vehicles,
      routes,
      studentAllocations,
      fuelMonth,
      maintMonth,
      recentFuelLogs,
      recentMaintenanceLogs,
      allFuel6M,
      allMaint6M,
      complianceRows,
      crewRows,
      todayTrips,
    ] = await Promise.all([
      prisma.vehicle.findMany({ orderBy: { registrationNo: 'asc' } }),
      prisma.transportRoute.findMany({
        include: {
          vehicle: true,
          stops: true,
          students: { include: { stop: true } },
        },
        orderBy: { name: 'asc' },
      }),
      prisma.studentTransport.findMany({ include: { stop: true } }),
      prisma.transportFuelLog.aggregate({
        where: { date: { gte: startOfMonth } },
        _sum: { totalCost: true, liters: true },
      }),
      prisma.transportMaintenanceLog.aggregate({
        where: { date: { gte: startOfMonth } },
        _sum: { cost: true },
      }),
      prisma.transportFuelLog.findMany({
        take: 5,
        orderBy: { date: 'desc' },
        include: { vehicle: { select: { registrationNo: true, make: true } } },
      }),
      prisma.transportMaintenanceLog.findMany({
        take: 5,
        orderBy: { date: 'desc' },
        include: { vehicle: { select: { registrationNo: true, make: true } } },
      }),
      prisma.transportFuelLog.findMany({
        where: { date: { gte: sixMonthsAgo } },
        select: { date: true, totalCost: true },
      }),
      prisma.transportMaintenanceLog.findMany({
        where: { date: { gte: sixMonthsAgo } },
        select: { date: true, cost: true },
      }),
      prisma.$queryRaw<any[]>`SELECT * FROM "VehicleCompliance"`.catch(() => [] as any[]),
      prisma.$queryRaw<any[]>`SELECT * FROM "TransportCrew"`.catch(() => [] as any[]),
      prisma.$queryRaw<any[]>`
        SELECT * FROM "TransportTripLog" WHERE "tripDate" >= ${todayStart} ORDER BY "createdAt" DESC
      `.catch(() => [] as any[]),
    ]);

    const totalVehicles = vehicles.length;
    const activeVehicles = vehicles.filter(v => v.status === 'ACTIVE').length;
    const maintenanceVehicles = vehicles.filter(v => v.status === 'MAINTENANCE').length;
    const totalCapacity = vehicles.reduce((sum, v) => sum + (Number(v.capacity) || 0), 0);

    const totalRoutes = routes.length;
    const totalStops = routes.reduce((sum, r) => sum + (r.stops?.length || 0), 0);
    const totalStudents = studentAllocations.length;
    const seatOccupancyPct = totalCapacity > 0 ? Math.min(100, Math.round((totalStudents / totalCapacity) * 100)) : 0;

    const expectedMonthlyRevenue = studentAllocations.reduce(
      (sum, a) => sum + (Number(a.stop?.monthlyFee) || 0),
      0
    );

    const monthlyFuelCost = fuelMonth._sum.totalCost || 0;
    const monthlyFuelLiters = fuelMonth._sum.liters || 0;
    const avgFuelRate = monthlyFuelLiters > 0 ? Number((monthlyFuelCost / monthlyFuelLiters).toFixed(2)) : 0;
    const monthlyMaintenanceCost = maintMonth._sum.cost || 0;

    // Driver map by vehicleId
    const driverByVehicle = new Map<string, any>();
    for (const c of crewRows) {
      if (c.vehicleId && c.role === 'DRIVER' && !driverByVehicle.has(c.vehicleId)) {
        driverByVehicle.set(c.vehicleId, c);
      }
    }

    // Bus/Route Occupancy Cards
    const busOccupancy = routes.map(r => {
      const assigned = r.students.length;
      const cap = r.vehicle?.capacity || 40;
      const pct = cap > 0 ? Math.round((assigned / cap) * 100) : 0;
      const revenue = r.students.reduce((s, st) => s + (Number(st.stop?.monthlyFee) || 0), 0);
      const driver = r.vehicleId ? driverByVehicle.get(r.vehicleId) : null;
      return {
        routeId: r.id,
        routeName: r.name,
        startPoint: r.startPoint,
        endPoint: r.endPoint,
        stopsCount: r.stops.length,
        vehicleId: r.vehicle?.id || null,
        vehicleNo: r.vehicle?.registrationNo || 'Unassigned',
        vehicleStatus: r.vehicle?.status || 'NONE',
        capacity: cap,
        assignedStudents: assigned,
        occupancyPct: pct,
        overloaded: assigned > cap && Boolean(r.vehicle),
        expectedRevenue: revenue,
        driverName: driver?.name || null,
        driverPhone: driver?.phone || null,
      };
    });

    // 6-Month Spend Chart
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const chartBuckets: Record<string, { month: string; fuel: number; maintenance: number }> = {};
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      chartBuckets[key] = { month: `${months[d.getMonth()]}`, fuel: 0, maintenance: 0 };
    }
    for (const f of allFuel6M) {
      const d = new Date(f.date);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      if (chartBuckets[key]) chartBuckets[key].fuel += Number(f.totalCost) || 0;
    }
    for (const m of allMaint6M) {
      const d = new Date(m.date);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      if (chartBuckets[key]) chartBuckets[key].maintenance += Number(m.cost) || 0;
    }

    // Compliance & Expiry Alerts (Expiring within 30 days or expired)
    const vMap = new Map(vehicles.map(v => [v.id, v]));
    const complianceAlerts: { id: string; title: string; docType: string; daysLeft: number; expiryDate: string }[] = [];

    for (const comp of complianceRows) {
      const v = vMap.get(comp.vehicleId);
      if (!v) continue;
      const checks: [string, any][] = [
        ['Insurance', comp.insuranceExpiry],
        ['Fitness (FC)', comp.fitnessExpiry],
        ['Road Permit', comp.permitExpiry],
        ['Pollution (PUC)', comp.pucExpiry],
      ];
      for (const [docType, dt] of checks) {
        const left = daysUntil(dt);
        if (left !== null && left <= 30) {
          complianceAlerts.push({
            id: `${v.id}-${docType}`,
            title: v.registrationNo,
            docType,
            daysLeft: left,
            expiryDate: dt,
          });
        }
      }
    }
    for (const c of crewRows) {
      const left = daysUntil(c.licenseExpiry);
      if (left !== null && left <= 30) {
        complianceAlerts.push({
          id: `crew-${c.id}`,
          title: `${c.name} (${c.role})`,
          docType: 'Driving License',
          daysLeft: left,
          expiryDate: c.licenseExpiry,
        });
      }
    }
    complianceAlerts.sort((a, b) => a.daysLeft - b.daysLeft);

    res.json({
      totalVehicles,
      activeVehicles,
      maintenanceVehicles,
      totalCapacity,
      totalRoutes,
      totalStops,
      totalStudents,
      seatOccupancyPct,
      expectedMonthlyRevenue,
      monthlyFuelCost,
      monthlyFuelLiters,
      avgFuelRate,
      monthlyMaintenanceCost,
      crewCount: crewRows.length,
      todayTripsCount: todayTrips.length,
      expiringDocsCount: complianceAlerts.length,
      busOccupancy,
      monthlySpendChart: Object.values(chartBuckets),
      complianceAlerts,
      recentFuelLogs,
      recentMaintenanceLogs,
      todayTrips,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// FUEL & MAINTENANCE LOGS
// ─────────────────────────────────────────────────────────────────────────────
export const getFuelLogs = async (_req: Request, res: Response) => {
  try {
    const logs = await prisma.transportFuelLog.findMany({
      include: { vehicle: true },
      orderBy: { date: 'desc' },
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
      data: {
        vehicleId,
        date: new Date(date),
        liters: Number(liters),
        costPerLiter: Number(costPerLiter),
        totalCost: Number(totalCost),
        odometerReading: odometerReading ? Number(odometerReading) : null,
        remarks,
      },
    });
    res.status(201).json(log);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getMaintenanceLogs = async (_req: Request, res: Response) => {
  try {
    const logs = await prisma.transportMaintenanceLog.findMany({
      include: { vehicle: true },
      orderBy: { date: 'desc' },
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
      data: {
        vehicleId,
        date: new Date(date),
        description,
        cost: Number(cost),
        mechanicDetails,
      },
    });
    res.status(201).json(log);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};
