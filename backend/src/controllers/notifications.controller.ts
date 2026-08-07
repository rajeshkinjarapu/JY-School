import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth';
import { prisma } from '../utils/prisma';
import { successResponse } from '../utils/response';

export const getNotifications = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;

    const notifications = await prisma.notification.findMany({
      where: {
        OR: [
          { userId },
          { role: userRole },
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: 30,
    });

    const unreadCount = notifications.filter(n => !n.isRead).length;

    successResponse(res, { notifications, unreadCount }, 'Notifications fetched');
  } catch (error) {
    next(error);
  }
};

export const markAllAsRead = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;

    await prisma.notification.updateMany({
      where: {
        OR: [
          { userId },
          { role: userRole },
        ],
        isRead: false,
      },
      data: { isRead: true },
    });

    successResponse(res, null, 'All notifications marked as read');
  } catch (error) {
    next(error);
  }
};

export const markAsRead = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    await prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });

    successResponse(res, null, 'Notification marked as read');
  } catch (error) {
    next(error);
  }
};

/**
 * Helper utility to create notifications from any backend controller
 */
export const createSystemNotification = async (data: {
  userId?: string;
  role?: string;
  title: string;
  message: string;
  type: string;
  link?: string;
}) => {
  try {
    await prisma.notification.create({
      data: {
        userId: data.userId || null,
        role: data.role || null,
        title: data.title,
        message: data.message,
        type: data.type,
        link: data.link || null,
      },
    });
  } catch (e) {
    console.error('Failed to create system notification:', e);
  }
};
