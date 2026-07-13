import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth';
import { createError } from '../middlewares/errorHandler';
import { prisma } from '../utils/prisma';
import { successResponse } from '../utils/response';

// Get all configs (optionally filtered by category)
export const getConfigs = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const { category } = req.query as { category?: string };
  const where = category ? { category } : {};

  const configs = await prisma.timetableConfig.findMany({
    where,
    orderBy: [{ category: 'asc' }, { periodNumber: 'asc' }],
  });

  successResponse(res, configs, 'Timetable configs fetched');
};

// Bulk upsert configs for a category
export const saveConfigs = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const { category, periods } = req.body as {
    category: string;
    periods: Array<{
      periodNumber: number;
      startTime: string;
      endTime: string;
      label: string;
      isBreak: boolean;
    }>;
  };

  if (!category || !periods || !Array.isArray(periods)) {
    return next(createError('category and periods array are required', 400));
  }

  // Delete old configs for this category, then create new ones
  await prisma.timetableConfig.deleteMany({ where: { category } });

  const created = await prisma.timetableConfig.createMany({
    data: periods.map((p) => ({
      category,
      periodNumber: p.periodNumber,
      startTime: p.startTime,
      endTime: p.endTime,
      label: p.label,
      isBreak: p.isBreak || false,
    })),
  });

  const configs = await prisma.timetableConfig.findMany({
    where: { category },
    orderBy: { periodNumber: 'asc' },
  });

  successResponse(res, configs, `${category} timetable config saved`, 201);
};

// Delete a single config
export const deleteConfig = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const id = req.params.id as string;
  const existing = await prisma.timetableConfig.findUnique({ where: { id } });
  if (!existing) return next(createError('Config not found', 404));

  await prisma.timetableConfig.delete({ where: { id } });
  successResponse(res, null, 'Config deleted');
};
