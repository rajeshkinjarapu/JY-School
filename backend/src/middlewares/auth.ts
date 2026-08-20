import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { createError } from './errorHandler';
import { Role } from '../types/enums';

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

export const authorize = (...roles: Role[]) => {
  return (req: AuthRequest, _res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(createError('You do not have permission to perform this action', 403));
    }
    next();
  };
};
