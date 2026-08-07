import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthRequest } from './auth';
import { createSystemNotification } from '../controllers/notifications.controller';

const getActionSummary = (method: string, url: string): string => {
  const path = url.toLowerCase();
  
  if (path.includes('/api/attendance')) return 'Marked Class Attendance';
  if (path.includes('/api/marks')) return 'Entered / Updated Exam Marks';
  if (path.includes('/api/slip-tests')) return 'Created / Updated Slip Test';
  if (path.includes('/api/homework')) return 'Assigned / Updated Homework';
  if (path.includes('/api/students')) return method === 'POST' ? 'Added New Student' : 'Updated Student Profile';
  if (path.includes('/api/teachers')) return method === 'POST' ? 'Added New Teacher' : 'Updated Teacher Info';
  if (path.includes('/api/fees')) return 'Updated Fee Ledger / Payment Record';
  if (path.includes('/api/leave')) return 'Submitted / Updated Leave Request';
  if (path.includes('/api/gate-pass')) return 'Created / Updated Gate Pass';
  if (path.includes('/api/announcements')) return 'Posted New Announcement';
  if (path.includes('/api/events')) return 'Created / Updated Event';
  if (path.includes('/api/question-papers')) return 'Generated Question Paper';
  if (path.includes('/api/profile')) return 'Updated Profile Settings';

  if (method === 'POST') return 'Created a New Record';
  if (method === 'PUT' || method === 'PATCH') return 'Updated System Record';
  if (method === 'DELETE') return 'Deleted a Record';
  
  return 'Performed System Action';
};

export const auditNotificationMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  const method = req.method;

  // We only track mutating actions (POST, PUT, PATCH, DELETE)
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    res.on('finish', () => {
      // Extract user from req.user or decode Bearer token
      let user = req.user;
      if (!user && req.headers.authorization?.startsWith('Bearer ')) {
        try {
          const token = req.headers.authorization.split(' ')[1];
          user = jwt.verify(token, process.env.JWT_SECRET || 'RajeshSecretKey_12345!@#') as any;
        } catch {}
      }

      // Only notify if response was successful (2xx or 3xx)
      if (res.statusCode >= 200 && res.statusCode < 400 && user) {
        const role = user.role;
        const userName = user.name || 'User';
        const actionSummary = getActionSummary(method, req.originalUrl || req.url);

        // Don't track notification read/mark actions to avoid infinite loop
        if (req.originalUrl.includes('/api/notifications')) {
          return;
        }

        // 1. Teacher Action -> Notify ADMIN & SUPER_ADMIN
        if (role === 'TEACHER') {
          createSystemNotification({
            role: 'ADMIN',
            title: '👩‍🏫 Teacher Activity',
            message: `Teacher ${userName} ${actionSummary.toLowerCase()}`,
            type: 'ACTIVITY',
            link: req.originalUrl,
          });

          createSystemNotification({
            role: 'SUPER_ADMIN',
            title: '👩‍🏫 Teacher Activity',
            message: `Teacher ${userName} ${actionSummary.toLowerCase()}`,
            type: 'ACTIVITY',
            link: req.originalUrl,
          });
        }

        // 2. Admin Action -> Notify SUPER_ADMIN
        if (role === 'ADMIN') {
          createSystemNotification({
            role: 'SUPER_ADMIN',
            title: '🛡️ Admin Activity',
            message: `Admin ${userName} ${actionSummary.toLowerCase()}`,
            type: 'ACTIVITY',
            link: req.originalUrl,
          });
        }
      }
    });
  }

  next();
};
