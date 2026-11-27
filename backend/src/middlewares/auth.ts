import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { createError } from './errorHandler';
import { Role } from '../types/enums';
import { getRbacMatrix, resolveModuleFromBaseUrl, RbacRole } from '../utils/rbac';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: Role;
    name: string;
  };
}

export const authenticate = (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): void => {
  let token = '';
  const authHeader = req.headers.authorization;
  
  if (authHeader?.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.query.token && typeof req.query.token === 'string') {
    token = req.query.token;
  }

  if (!token) {
    return next(createError('No token provided', 401));
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'RajeshSecretKey_12345!@#') as {
      id: string;
      email: string;
      role: Role;
      name: string;
    };

    // JWT token itself is trusted — no extra DB round-trip per request
    req.user = { id: decoded.id, email: decoded.email, role: decoded.role, name: decoded.name };
    next();
  } catch {
    return next(createError('Invalid or expired token', 401));
  }
};

const MANAGED_STAFF_ROLES: RbacRole[] = ['ADMIN', 'ACCOUNTANT', 'TEACHER', 'TRANSPORT_MANAGER', 'SECURITY'];

export const authorize = (...roles: Role[]) => {
  return (req: AuthRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(createError('You do not have permission to perform this action', 403));
    }

    const userRole = req.user.role;
    if (userRole === 'SUPER_ADMIN') {
      next();
      return;
    }

    const moduleKey = resolveModuleFromBaseUrl(req.baseUrl);
    if (moduleKey && MANAGED_STAFF_ROLES.includes(userRole as RbacRole)) {
      getRbacMatrix()
        .then((matrix) => {
          const level = matrix[moduleKey]?.[userRole as RbacRole];
          if (level === 'Full' || level === 'Manage') {
            next();
            return;
          }
          if (level === 'View') {
            if (req.method === 'GET' || req.method === 'HEAD') {
              next();
              return;
            }
            return next(createError(`Read-only permission configured for ${userRole} in this module`, 403));
          }
          if (level === 'None') {
            return next(createError('Access to this module has been disabled for your role', 403));
          }
          if (!roles.includes(userRole)) {
            return next(createError('You do not have permission to perform this action', 403));
          }
          next();
        })
        .catch(() => {
          if (!roles.includes(userRole)) {
            return next(createError('You do not have permission to perform this action', 403));
          }
          next();
        });
      return;
    }

    if (!roles.includes(userRole)) {
      return next(createError('You do not have permission to perform this action', 403));
    }
    next();
  };
};
