import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth';
import { prisma } from '../utils/prisma';
import { successResponse } from '../utils/response';

let lastPendingExamsCheckTime = 0;
const PENDING_EXAMS_CHECK_INTERVAL = 10 * 60 * 1000; // Only check once every 10 minutes

export const getNotifications = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;
    const now = Date.now();

    // Check pending exam notifications only once every 10 minutes asynchronously
    if ((userRole === 'SUPER_ADMIN' || userRole === 'ADMIN') && (now - lastPendingExamsCheckTime > PENDING_EXAMS_CHECK_INTERVAL)) {
      lastPendingExamsCheckTime = now;
      (async () => {
        try {
          const activeExams = await prisma.exam.findMany({
            take: 5,
            orderBy: { createdAt: 'desc' },
            include: { classes: { select: { id: true, name: true, section: true } } }
          });

          for (const exam of activeExams) {
            let frozenClasses: string[] = [];
            if (exam.frozenClasses) {
              try {
                frozenClasses = Array.isArray(exam.frozenClasses) 
                  ? (exam.frozenClasses as string[]) 
                  : typeof exam.frozenClasses === 'string' ? JSON.parse(exam.frozenClasses) : [];
              } catch(e) {}
            }
            
            for (const cls of exam.classes) {
              if (!frozenClasses.includes(cls.id)) {
                const title = `Pending Marks: ${exam.name}`;
                const message = `Marks entry is pending for Class ${cls.name}-${cls.section} (${exam.name}).`;
                
                const existing = await prisma.notification.findFirst({
                  where: { title, message, role: userRole }
                });

                if (!existing) {
                  await prisma.notification.create({
                    data: {
                      role: userRole,
                      title,
                      message,
                      type: 'WARNING',
                      link: '/exams?tab=status',
                      isRead: false
                    }
                  });
                }
              }
            }
          }
        } catch (err) {
          console.error('Error generating pending marks notifications:', err);
        }
      })();
    }

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
export const getVapidKey = async (_req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { getVapidPublicKey } = await import('../utils/push');
    successResponse(res, { publicKey: getVapidPublicKey() });
  } catch (error) {
    next(error);
  }
};

export const subscribePush = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const { endpoint, keys } = req.body;
    if (!endpoint || !keys || !keys.p256dh || !keys.auth) {
      res.status(400).json({ message: 'Invalid subscription payload' });
      return;
    }

    await prisma.pushSubscription.upsert({
      where: { endpoint },
      update: {
        userId,
        p256dh: keys.p256dh,
        auth: keys.auth,
      },
      create: {
        userId,
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
      },
    });

    successResponse(res, null, 'Push subscription saved successfully');
  } catch (error) {
    next(error);
  }
};

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

    // Also dispatch Web Push notification to user or role devices (for lock screen / screen-off mobile alerts)
    const { sendWebPushNotification } = await import('../utils/push');
    sendWebPushNotification(
      {
        userIds: data.userId ? [data.userId] : undefined,
        roles: data.role ? [data.role] : undefined,
      },
      {
        title: data.title,
        message: data.message,
        url: data.link || '/dashboard',
      }
    ).catch(e => console.error('Web push dispatch error:', e));
  } catch (e) {
    console.error('Failed to create system notification:', e);
  }
};
