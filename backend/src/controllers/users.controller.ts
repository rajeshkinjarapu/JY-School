import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth';
import { createError } from '../middlewares/errorHandler';
import { prisma } from '../utils/prisma';
import { successResponse, paginatedResponse } from '../utils/response';
import { generateEmployeeId } from '../utils/helpers';
import bcrypt from 'bcryptjs';
import { getRbacMatrix, saveRbacMatrix, resetRbacMatrix, RBAC_MODULES } from '../utils/rbac';

export const fetchRbacMatrix = async (_req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const matrix = await getRbacMatrix();
    successResponse(res, { modules: RBAC_MODULES, matrix }, 'RBAC permission matrix fetched');
  } catch (err) {
    next(err);
  }
};

export const updateRbacMatrixHandler = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const matrix = await saveRbacMatrix(req.body?.matrix || req.body || {});
    successResponse(res, { modules: RBAC_MODULES, matrix }, 'RBAC permissions saved & enforced');
  } catch (err) {
    next(err);
  }
};

export const resetRbacMatrixHandler = async (_req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const matrix = await resetRbacMatrix();
    successResponse(res, { modules: RBAC_MODULES, matrix }, 'RBAC permissions reset to defaults');
  } catch (err) {
    next(err);
  }
};

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

export const deleteUser = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const id = req.params.id as string;
  const isHardDelete = req.query.hard === 'true';
  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) return next(createError('User not found', 404));

  const actorId = req.user?.id;
  if (actorId && actorId === id) {
    return next(createError('You cannot delete your own active account', 400));
  }
  if (existing.role === 'SUPER_ADMIN' && req.user?.role !== 'SUPER_ADMIN') {
    return next(createError('Only Super Admin can delete a Super Admin account', 403));
  }

  if (isHardDelete) {
    const fallbackAdminId = actorId && actorId !== id ? actorId : null;

    await prisma.$transaction(async (tx) => {
      // 1. Clean up Teacher relations if this user has a Teacher profile
      const teacher = await tx.teacher.findUnique({ where: { userId: id } });
      if (teacher) {
        await tx.class.updateMany({ where: { classTeacherId: teacher.id }, data: { classTeacherId: null } });
        await tx.classSubjectTeacher.deleteMany({ where: { teacherId: teacher.id } });
        await tx.timetable.deleteMany({ where: { teacherId: teacher.id } });
        await tx.timetable.updateMany({ where: { originalTeacherId: teacher.id }, data: { originalTeacherId: null } });
        await tx.substitute.deleteMany({
          where: { OR: [{ absentTeacherId: teacher.id }, { substituteTeacherId: teacher.id }] },
        });
        await tx.attendance.updateMany({ where: { teacherId: teacher.id }, data: { teacherId: null } });
        await tx.competitiveExam.updateMany({ where: { teacherId: teacher.id }, data: { teacherId: null } });
        await tx.studentAddressCollection.updateMany({
          where: { referenceTeacherId: teacher.id },
          data: { referenceTeacherId: null },
        });
        await tx.homework.deleteMany({ where: { teacherId: teacher.id } });
        await tx.teacherAttendance.deleteMany({ where: { teacherId: teacher.id } });
        await tx.salary.deleteMany({ where: { teacherId: teacher.id } });
        await tx.teacher.delete({ where: { id: teacher.id } });
      }

      // 2. Clean up Student relations if this user has a Student profile
      const student = await tx.student.findUnique({ where: { userId: id } });
      if (student) {
        await tx.attendance.deleteMany({ where: { studentId: student.id } });
        await tx.mark.deleteMany({ where: { studentId: student.id } });
        await tx.slipTestMark.deleteMany({ where: { studentId: student.id } });
        await tx.feePayment.deleteMany({ where: { studentId: student.id } });
        await tx.feeDiscount.deleteMany({ where: { studentId: student.id } });
        await tx.feeStructure.deleteMany({ where: { studentId: student.id } });
        await tx.onlineExamSubmission.deleteMany({ where: { studentId: student.id } });
        await tx.competitiveExamSubmission.deleteMany({ where: { studentId: student.id } });
        await tx.gatePass.deleteMany({ where: { studentId: student.id } });
        await tx.studentTransport.deleteMany({ where: { studentId: student.id } });
        await tx.student.delete({ where: { id: student.id } });
      }

      // 3. Reassign school-wide authored records (or clean up if no fallback admin)
      if (fallbackAdminId) {
        await tx.announcement.updateMany({ where: { createdById: id }, data: { createdById: fallbackAdminId } });
        await tx.attendance.updateMany({ where: { markedById: id }, data: { markedById: fallbackAdminId } });
        await tx.paper.updateMany({ where: { createdById: id }, data: { createdById: fallbackAdminId } });
        await tx.timetableHistory.updateMany({ where: { changedById: id }, data: { changedById: fallbackAdminId } });
      } else {
        await tx.announcement.deleteMany({ where: { createdById: id } });
        await tx.attendance.deleteMany({ where: { markedById: id } });
        await tx.paper.deleteMany({ where: { createdById: id } });
        await tx.timetableHistory.deleteMany({ where: { changedById: id } });
      }

      await tx.question.updateMany({ where: { createdById: id }, data: { createdById: null } });

      // 4. Clean up personal User relations (including Messages, GatePasses, Leaves, Logs)
      await tx.message.deleteMany({ where: { OR: [{ senderId: id }, { receiverId: id }] } });
      await tx.gatePass.updateMany({ where: { approvedById: id }, data: { approvedById: null } });
      await tx.gatePass.deleteMany({ where: { requesterId: id } });
      await tx.leaveRequest.updateMany({ where: { approvedById: id }, data: { approvedById: null } });
      await tx.leaveRequest.deleteMany({ where: { userId: id } });
      await tx.leaveBalance.deleteMany({ where: { userId: id } });
      await tx.auditLog.deleteMany({ where: { userId: id } });
      await tx.pushSubscription.deleteMany({ where: { userId: id } });
      await tx.notification.deleteMany({ where: { userId: id } });
      await tx.transportStaff.deleteMany({ where: { userId: id } });
      await tx.announcementRead.deleteMany({ where: { userId: id } });

      // 5. Finally delete User
      await tx.user.delete({ where: { id } });
    }, { timeout: 15000 });

    successResponse(res, null, 'User permanently deleted');
  } else {
    await prisma.user.update({ where: { id }, data: { isActive: false } });
    successResponse(res, null, 'User deactivated');
  }
};
