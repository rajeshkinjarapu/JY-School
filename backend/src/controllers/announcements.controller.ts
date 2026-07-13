import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth';
import { createError } from '../middlewares/errorHandler';
import { prisma } from '../utils/prisma';
import { successResponse, paginatedResponse } from '../utils/response';
import { Role } from '../types/enums';

export const getAll = async (req: AuthRequest, res: Response): Promise<void> => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const skip = (page - 1) * limit;

  const userRole = req.user!.role;

  const where: any = {
    isActive: true,
    OR: [
      { targetRoles: '' },
      { targetRoles: { contains: userRole } },
    ],
  };

  // Admins see all
  if (userRole === Role.SUPER_ADMIN || userRole === Role.ADMIN) {
    delete where.isActive;
    delete where.OR;
  }

  const [announcements, total] = await Promise.all([
    prisma.announcement.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: { createdBy: { select: { name: true, role: true } } },
    }),
    prisma.announcement.count({ where }),
  ]);

  paginatedResponse(res, announcements, total, page, limit, 'Announcements fetched');
};

export const getById = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const id = req.params.id as string;
  const announcement = await prisma.announcement.findUnique({
    where: { id },
    include: { createdBy: { select: { name: true, role: true } } },
  });
  if (!announcement) return next(createError('Announcement not found', 404));
  successResponse(res, announcement, 'Announcement fetched');
};

export const create = async (req: AuthRequest, res: Response): Promise<void> => {
  const { title, content, targetRoles, expiresAt } = req.body;
  const announcement = await prisma.announcement.create({
    data: {
      title,
      content,
      targetRoles: Array.isArray(targetRoles) ? targetRoles.join(',') : (targetRoles || ''),
      createdById: req.user!.id,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
    },
    include: { createdBy: { select: { name: true, role: true } } },
  });
  successResponse(res, announcement, 'Announcement created', 201);
};

export const update = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const id = req.params.id as string;
  const { title, content, targetRoles, expiresAt } = req.body;

  const existing = await prisma.announcement.findUnique({ where: { id } });
  if (!existing) return next(createError('Announcement not found', 404));

  const announcement = await prisma.announcement.update({
    where: { id },
    data: {
      title, content,
      targetRoles: Array.isArray(targetRoles) ? targetRoles.join(',') : (targetRoles || undefined),
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
    },
  });
  successResponse(res, announcement, 'Announcement updated');
};

export const deleteAnnouncement = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const id = req.params.id as string;
  const existing = await prisma.announcement.findUnique({ where: { id } });
  if (!existing) return next(createError('Announcement not found', 404));
  await prisma.announcement.delete({ where: { id } });
  successResponse(res, null, 'Announcement deleted');
};

export const toggleActive = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const id = req.params.id as string;
  const existing = await prisma.announcement.findUnique({ where: { id } });
  if (!existing) return next(createError('Announcement not found', 404));
  const announcement = await prisma.announcement.update({
    where: { id },
    data: { isActive: !existing.isActive },
  });
  successResponse(res, announcement, `Announcement ${announcement.isActive ? 'activated' : 'deactivated'}`);
};
