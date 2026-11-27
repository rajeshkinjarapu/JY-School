import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth';
import { createError } from '../middlewares/errorHandler';
import { prisma } from '../utils/prisma';
import { successResponse, paginatedResponse } from '../utils/response';
import { generateEmployeeId } from '../utils/helpers';
import bcrypt from 'bcryptjs';

export const saveDeviceToken = async (req: AuthRequest, res: Response): Promise<void> => {
  const { deviceToken } = req.body;
  if (!deviceToken) {
    throw createError('Device token is required', 400);
  }

  await prisma.user.update({
    where: { id: req.user?.id },
    data: { deviceToken },
  });

  successResponse(res, null, 'Device token saved successfully');
};

export const updateAppInfo = async (req: AuthRequest, res: Response): Promise<void> => {
  const { deviceModel, appVersion } = req.body;
  const ipAddress = req.ip || req.headers['x-forwarded-for']?.toString() || req.connection.remoteAddress || 'Unknown';

  await prisma.user.update({
    where: { id: req.user?.id },
    data: {
      isAppInstalled: true,
      lastAppLoginAt: new Date(),
      deviceModel: deviceModel || null,
      appVersion: appVersion || null,
      lastIpAddress: ipAddress,
    },
  });

  successResponse(res, null, 'App info updated successfully');
};

export const getAppInstalls = async (req: AuthRequest, res: Response): Promise<void> => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 50;
  const skip = (page - 1) * limit;

  const where = { isAppInstalled: true };

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { lastAppLoginAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        deviceModel: true,
        appVersion: true,
        lastAppLoginAt: true,
        student: { select: { class: { select: { name: true, section: true } } } },
      },
    }),
    prisma.user.count({ where }),
  ]);

  paginatedResponse(res, users, total, page, limit, 'App installs fetched');
};

export const getAll = async (req: AuthRequest, res: Response): Promise<void> => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const search = (req.query.search as string) || '';
  const role = (req.query.role as string) || '';
  const excludeRole = (req.query.excludeRole as string) || '';
  const isActiveParam = req.query.isActive as string | undefined;
  const skip = (page - 1) * limit;

  const where: any = {};
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
      { phone: { contains: search } },
    ];
  }
  if (role) {
    where.role = role.includes(',')
      ? { in: role.split(',').map(r => r.trim()).filter(Boolean) }
      : role;
  } else if (excludeRole) {
    where.role = excludeRole.includes(',')
      ? { notIn: excludeRole.split(',').map(r => r.trim()).filter(Boolean) }
      : { not: excludeRole };
  }
  if (isActiveParam === 'true') where.isActive = true;
  else if (isActiveParam === 'false') where.isActive = false;

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, name: true, email: true, role: true,
        phone: true, photoUrl: true, isActive: true, createdAt: true,
        plainPassword: true,
        isAppInstalled: true, lastAppLoginAt: true, deviceModel: true, appVersion: true,
        teacher: {
          select: {
            id: true,
            employeeId: true,
            qualification: true,
            specialization: true,
            canEditStudents: true,
            canUploadQuestionPapers: true,
            canViewAllStudents: true,
          },
        },
      },
    }),
    prisma.user.count({ where }),
  ]);

  const sanitizedUsers = users.map(user => {
    let avatarUrl = user.photoUrl;
    if (avatarUrl && avatarUrl.startsWith('data:image')) {
      avatarUrl = `/api/users/${user.id}/photo`;
    }
    return { ...user, photoUrl: avatarUrl };
  });

  paginatedResponse(res, sanitizedUsers, total, page, limit, 'Users fetched');
};

export const getById = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const id = req.params.id as string;
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true, name: true, email: true, role: true,
      phone: true, photoUrl: true, isActive: true, createdAt: true,
      plainPassword: true,
    },
  });
  if (!user) return next(createError('User not found', 404));
  successResponse(res, user, 'User fetched');
};

export const getUserPhoto = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const id = req.params.id as string;
  try {
    let user = await prisma.user.findUnique({
      where: { id },
      select: { photoUrl: true }
    });

    // Fallback: If not found by User ID, check if id is a Student ID
    if (!user || !user.photoUrl) {
      const student = await prisma.student.findUnique({
        where: { id },
        select: { user: { select: { photoUrl: true } } }
      });
      if (student?.user?.photoUrl) {
        user = { photoUrl: student.user.photoUrl };
      }
    }

    if (!user || !user.photoUrl) {
      return next(createError('Photo not found', 404));
    }

    const photoUrl = user.photoUrl;

    // Enable CORS for poster generation & multi-port access
    res.set('Access-Control-Allow-Origin', '*');

    if (photoUrl.startsWith('data:image')) {
      const matches = photoUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (!matches || matches.length !== 3) {
        return next(createError('Invalid photo format', 400));
      }
      const type = matches[1];
      const buffer = Buffer.from(matches[2], 'base64');
      res.set('Content-Type', type);
      res.set('Cache-Control', 'public, max-age=86400'); // Cache for 1 day
      res.send(buffer);
    } else if (photoUrl.startsWith('http')) {
      res.redirect(photoUrl);
    } else {
      res.redirect(`/${photoUrl.replace(/^\/+/, '')}`);
    }
  } catch (error) {
    next(error);
  }
};

export const createUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { name, email, password, role, phone } = req.body;
  if (!name || !email || !password || !role) {
    return next(createError('Name, email, password and role are required', 400));
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return next(createError('Email / User ID already exists', 409));

  const hashedPassword = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      plainPassword: password,
      role,
      phone,
    },
    select: { id: true, name: true, email: true, role: true, phone: true, isActive: true, plainPassword: true }
  });

  if (role === 'TEACHER') {
    const count = await prisma.teacher.count();
    const employeeId = generateEmployeeId();
    await prisma.teacher.create({
      data: {
        userId: user.id,
        employeeId,
      }
    });
  } else if (role === 'STUDENT') {
    const count = await prisma.student.count();
    const year = new Date().getFullYear().toString().slice(-2);
    const rollNo = `JY${year}-${String(count + 1).padStart(4, '0')}`;
    await prisma.student.create({
      data: {
        userId: user.id,
        rollNo,
      }
    });
  }

  successResponse(res, user, 'User created successfully', 201);
};

export const update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const id = req.params.id as string;
  const {
    name, email, password, role, phone, photoUrl, isActive,
    canEditStudents, canUploadQuestionPapers, canViewAllStudents
  } = req.body;

  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) return next(createError('User not found', 404));

  if (email && email !== existing.email) {
    const duplicate = await prisma.user.findFirst({ where: { email, NOT: { id } } });
    if (duplicate) return next(createError('Email / User ID already in use', 409));
  }

  const updateData: any = {};
  if (name !== undefined) updateData.name = name;
  if (phone !== undefined) updateData.phone = phone;
  if (photoUrl !== undefined) updateData.photoUrl = photoUrl;
  if (typeof isActive === 'boolean') updateData.isActive = isActive;
  if (email) updateData.email = email;
  if (role) updateData.role = role;
  if (password) {
    updateData.password = await bcrypt.hash(password, 12);
    updateData.plainPassword = password;
  }

  const user = Object.keys(updateData).length > 0
    ? await prisma.user.update({
        where: { id },
        data: updateData,
        select: { id: true, name: true, email: true, role: true, phone: true, photoUrl: true, isActive: true, plainPassword: true },
      })
    : existing;

  if (role && role !== existing.role) {
    if (role === 'TEACHER') {
      const hasTeacher = await prisma.teacher.findUnique({ where: { userId: id } });
      if (!hasTeacher) {
        await prisma.teacher.create({ data: { userId: id, employeeId: generateEmployeeId() } });
      }
    } else if (role === 'STUDENT') {
      const hasStudent = await prisma.student.findUnique({ where: { userId: id } });
      if (!hasStudent) {
        const count = await prisma.student.count();
        const year = new Date().getFullYear().toString().slice(-2);
        await prisma.student.create({ data: { userId: id, rollNo: `JY${year}-${String(count + 1).padStart(4, '0')}` } });
      }
    }
  }

  const teacherUpdates: any = {};
  if (typeof canEditStudents === 'boolean') teacherUpdates.canEditStudents = canEditStudents;
  if (typeof canUploadQuestionPapers === 'boolean') teacherUpdates.canUploadQuestionPapers = canUploadQuestionPapers;
  if (typeof canViewAllStudents === 'boolean') teacherUpdates.canViewAllStudents = canViewAllStudents;
  if (Object.keys(teacherUpdates).length > 0) {
    await prisma.teacher.updateMany({ where: { userId: id }, data: teacherUpdates });
  }

  successResponse(res, user, 'User updated successfully');
};

export const deleteUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const id = req.params.id as string;
  const isHardDelete = req.query.hard === 'true';
  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) return next(createError('User not found', 404));
  
  if (isHardDelete) {
    // Delete related records manually if cascade is not fully configured on all relations
    await prisma.student.deleteMany({ where: { userId: id } }).catch(() => {});
    await prisma.teacher.deleteMany({ where: { userId: id } }).catch(() => {});
    await prisma.user.delete({ where: { id } });
    successResponse(res, null, 'User permanently deleted');
  } else {
    await prisma.user.update({ where: { id }, data: { isActive: false } });
    successResponse(res, null, 'User deactivated');
  }
};
