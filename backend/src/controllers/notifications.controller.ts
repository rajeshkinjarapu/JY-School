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
  imageUrl?: string;
}) => {
  try {
    const encodedLink = data.imageUrl ? `${data.link || ''}|${data.imageUrl}` : (data.link || null);

    await prisma.notification.create({
      data: {
        userId: data.userId || null,
        role: data.role || null,
        title: data.title,
        message: data.message,
        type: data.type,
        link: encodedLink,
      },
    });

    // Also dispatch Web Push notification
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
    
    // --- Master FCM Push Notification Hook ---
    try {
      const { sendPushNotification } = await import('../utils/firebase');
      let usersToNotify = [];
      
      if (data.userId) {
        usersToNotify = await prisma.user.findMany({
          where: { id: data.userId, deviceToken: { not: null } },
          select: { deviceToken: true }
        });
      } else if (data.role) {
        usersToNotify = await prisma.user.findMany({
          where: { role: data.role, deviceToken: { not: null } },
          select: { deviceToken: true }
        });
      } else {
        // Broadcast to all active users with deviceToken
        usersToNotify = await prisma.user.findMany({
          where: { deviceToken: { not: null }, isActive: true },
          select: { deviceToken: true }
        });
      }

      const tokens = usersToNotify.map(u => u.deviceToken as string).filter(Boolean);
      tokens.forEach(token => {
        sendPushNotification(
          token, 
          data.title, 
          data.message.length > 100 ? data.message.substring(0, 97) + '...' : data.message,
          { route: data.link || 'announcements', type: data.type, imageUrl: data.imageUrl || '' },
          data.imageUrl
        );
      });
    } catch (fcmError) {
      console.error('Master FCM Dispatch Error:', fcmError);
    }

  } catch (e) {
    console.error('Failed to create system notification:', e);
  }
};

/**
 * Send a custom broadcast or targeted push notification with optional Big Picture image
 */
export const sendCustomNotification = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const {
      title,
      message,
      imageUrl,
      targetType = 'ALL', // 'ALL', 'ROLE', 'CLASS', 'USER'
      targetRole,         // 'STUDENT', 'TEACHER', 'ADMIN'
      targetClassId,      // class id
      targetUserId,       // user id
      route = 'announcements',
      type = 'CUSTOM',
    } = req.body;

    if (!title || !message) {
      res.status(400).json({ success: false, message: 'Title and message are required' });
      return;
    }

    let targetUsers: { id: string; role: string; deviceToken: string | null }[] = [];

    if (targetType === 'USER' && targetUserId) {
      targetUsers = await prisma.user.findMany({
        where: { id: targetUserId, isActive: true },
        select: { id: true, role: true, deviceToken: true },
      });
    } else if (targetType === 'CLASS' && targetClassId) {
      const students = await prisma.student.findMany({
        where: { classId: targetClassId },
        select: { userId: true },
      });
      const userIds = students.map(s => s.userId).filter(Boolean) as string[];
      targetUsers = await prisma.user.findMany({
        where: { id: { in: userIds }, isActive: true },
        select: { id: true, role: true, deviceToken: true },
      });
    } else if (targetType === 'ROLE' && targetRole) {
      targetUsers = await prisma.user.findMany({
        where: { role: targetRole, isActive: true },
        select: { id: true, role: true, deviceToken: true },
      });
    } else {
      // ALL
      targetUsers = await prisma.user.findMany({
        where: { isActive: true },
        select: { id: true, role: true, deviceToken: true },
      });
    }

    const encodedLink = imageUrl ? `${route}|${imageUrl}` : route;

    // 1. Create DB notification records
    if (targetType === 'ALL' || targetType === 'ROLE') {
      await prisma.notification.create({
        data: {
          role: targetType === 'ROLE' ? targetRole : null,
          title,
          message,
          type,
          link: encodedLink,
        },
      });
    } else {
      const notifData = targetUsers.slice(0, 300).map(u => ({
        userId: u.id,
        title,
        message,
        type,
        link: encodedLink,
      }));
      if (notifData.length > 0) {
        await prisma.notification.createMany({
          data: notifData,
        });
      }
    }

    // 2. Dispatch FCM Push Notifications with Image
    const tokens = targetUsers
      .map(u => u.deviceToken)
      .filter((t): t is string => Boolean(t && t.trim()));

    if (tokens.length > 0) {
      const { sendMulticastPushNotification } = await import('../utils/firebase');
      sendMulticastPushNotification(
        tokens,
        title,
        message,
        {
          route,
          type,
          imageUrl: imageUrl || '',
        },
        imageUrl
      ).catch(e => console.error('FCM Multicast error:', e));
    }

    // 3. Web Push dispatch
    const { sendWebPushNotification } = await import('../utils/push');
    sendWebPushNotification(
      {
        userIds: targetType === 'USER' && targetUserId ? [targetUserId] : (targetType === 'CLASS' ? targetUsers.map(u => u.id) : undefined),
        roles: targetType === 'ROLE' && targetRole ? [targetRole] : undefined,
      },
      {
        title,
        message,
        url: route.startsWith('/') ? route : `/${route}`,
      }
    ).catch(e => console.error('Web push error:', e));

    successResponse(res, {
      targetedUsersCount: targetUsers.length,
      devicesReachedCount: tokens.length,
    }, 'Custom notification sent successfully');
  } catch (error) {
    next(error);
  }
};
