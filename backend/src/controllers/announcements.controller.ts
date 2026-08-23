import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth';
import { createError } from '../middlewares/errorHandler';
import { prisma } from '../utils/prisma';
import { successResponse, paginatedResponse } from '../utils/response';
import { Role } from '../types/enums';

export const getAll = async (req: AuthRequest, res: Response): Promise<void> => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 50;
  const skip = (page - 1) * limit;
  const statusFilter = req.query.status as string | undefined;

  const userRole = req.user!.role;
  const now = new Date();

  let where: any = {};

  // Admins see all; others see only published & active
  if (userRole === Role.SUPER_ADMIN || userRole === Role.ADMIN) {
    if (statusFilter) where.status = statusFilter;
  } else {
    where = {
      isActive: true,
      status: 'PUBLISHED',
      OR: [
        { targetRoles: '' },
        { targetRoles: { contains: userRole } },
      ],
      AND: [
        { OR: [{ scheduledAt: null }, { scheduledAt: { lte: now } }] },
        { OR: [{ expiresAt: null }, { expiresAt: { gte: now } }] },
      ],
    };
  }

  const [announcements, total] = await Promise.all([
    prisma.announcement.findMany({
      where,
      skip,
      take: limit,
      orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
      include: {
        createdBy: { select: { name: true, role: true } },
        reads: { select: { userId: true } },
      },
    }),
    prisma.announcement.count({ where }),
  ]);

  // Add read count and hasRead flag for current user
  const userId = req.user!.id;
  const enriched = announcements.map((a) => ({
    ...a,
    readCount: a.reads.length,
    hasRead: a.reads.some((r) => r.userId === userId),
  }));

  paginatedResponse(res, enriched, total, page, limit, 'Announcements fetched');
};

export const getById = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const id = req.params.id as string;
  const announcement = await prisma.announcement.findUnique({
    where: { id },
    include: {
      createdBy: { select: { name: true, role: true } },
      reads: { select: { userId: true, user: { select: { name: true } }, readAt: true } },
    },
  });
  if (!announcement) return next(createError('Announcement not found', 404));
  const userId = req.user!.id;
  successResponse(res, {
    ...announcement,
    readCount: announcement.reads.length,
    hasRead: announcement.reads.some((r) => r.userId === userId),
  }, 'Announcement fetched');
};

export const create = async (req: AuthRequest, res: Response): Promise<void> => {
  const { title, content, targetRoles, targetClass, priority, status, expiresAt, scheduledAt, attachments } = req.body;

  const computedStatus = status || (scheduledAt ? 'SCHEDULED' : 'PUBLISHED');

  const announcement = await prisma.announcement.create({
    data: {
      title,
      content,
      targetRoles: Array.isArray(targetRoles) ? targetRoles.join(',') : (targetRoles || ''),
      targetClass: targetClass || null,
      priority: priority || 'NORMAL',
      status: computedStatus,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      attachments: Array.isArray(attachments) ? attachments : [],
      createdById: req.user!.id,
    },
    include: { createdBy: { select: { name: true, role: true } } },
  });

  // Send notifications only for PUBLISHED announcements
  if (computedStatus === 'PUBLISHED') {
    try {
      const rolesList = Array.isArray(targetRoles) ? targetRoles : (targetRoles ? targetRoles.split(',') : []);
      const { createSystemNotification } = await import('./notifications.controller');
      for (const r of rolesList) {
        if (r && r.trim()) {
          createSystemNotification({
            role: r.trim(),
            title: `📢 New Announcement`,
            message: `${title}`,
            type: 'ANNOUNCEMENT',
            link: '/announcements',
          });
        }
      }
    } catch (e) {
      console.error('Failed to send Announcement notification:', e);
    }
  }

  successResponse(res, announcement, 'Announcement created', 201);
};

export const update = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const id = req.params.id as string;
  const { title, content, targetRoles, targetClass, priority, status, expiresAt, scheduledAt, attachments, isPinned } = req.body;

  const existing = await prisma.announcement.findUnique({ where: { id } });
  if (!existing) return next(createError('Announcement not found', 404));

  const announcement = await prisma.announcement.update({
    where: { id },
    data: {
      title, content,
      targetRoles: Array.isArray(targetRoles) ? targetRoles.join(',') : (targetRoles || undefined),
      targetClass: targetClass !== undefined ? targetClass : undefined,
      priority: priority || undefined,
      status: status || undefined,
      isPinned: isPinned !== undefined ? isPinned : undefined,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
      attachments: Array.isArray(attachments) ? attachments : undefined,
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

export const togglePin = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const id = req.params.id as string;
  const existing = await prisma.announcement.findUnique({ where: { id } });
  if (!existing) return next(createError('Announcement not found', 404));
  const announcement = await prisma.announcement.update({
    where: { id },
    data: { isPinned: !existing.isPinned },
  });
  successResponse(res, announcement, `Announcement ${announcement.isPinned ? 'pinned' : 'unpinned'}`);
};

export const markAsRead = async (req: AuthRequest, res: Response): Promise<void> => {
  const id = req.params.id as string;
  const userId = req.user!.id;
  await prisma.announcementRead.upsert({
    where: { announcementId_userId: { announcementId: id, userId } },
    create: { announcementId: id, userId },
    update: { readAt: new Date() },
  });
  successResponse(res, null, 'Marked as read');
};

export const getReadStats = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const id = req.params.id as string;
  const existing = await prisma.announcement.findUnique({ where: { id } });
  if (!existing) return next(createError('Announcement not found', 404));
  const reads = await prisma.announcementRead.findMany({
    where: { announcementId: id },
    include: { user: { select: { name: true, role: true } } },
    orderBy: { readAt: 'desc' },
  });
  successResponse(res, { readCount: reads.length, readers: reads }, 'Read stats fetched');
};
