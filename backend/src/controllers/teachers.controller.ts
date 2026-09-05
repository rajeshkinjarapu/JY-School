import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth';
import { createError } from '../middlewares/errorHandler';
import { prisma } from '../utils/prisma';
import { successResponse, paginatedResponse } from '../utils/response';
import { generateEmployeeId } from '../utils/helpers';
import bcrypt from 'bcryptjs';
import * as XLSX from 'xlsx';
import { createSystemNotification } from './notifications.controller';

export const getAll = async (req: AuthRequest, res: Response): Promise<void> => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const search = (req.query.search as string) || '';
  const skip = (page - 1) * limit;

  const where: any = {};
  if (search) {
    where.OR = [
      { user: { name: { contains: search } } },
      { user: { email: { contains: search } } },
      { employeeId: { contains: search } },
    ];
  }

  const [teachers, total] = await Promise.all([
    prisma.teacher.findMany({
      where,
      skip,
      take: limit,
      orderBy: { employeeId: 'asc' },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true, photoUrl: true, isActive: true } },
        _count: { select: { classSubjectTeachers: true } },
        homeRoomClass: { select: { id: true, name: true, section: true } },
      },
    }),
    prisma.teacher.count({ where }),
  ]);

  paginatedResponse(res, teachers, total, page, limit, 'Teachers fetched');
};

export const getById = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const id = req.params.id as string;
  const teacher = await prisma.teacher.findFirst({
    where: {
      OR: [
        { id },
        { userId: id },
        { employeeId: id }
      ]
    },
    include: {
      user: { select: { id: true, name: true, email: true, phone: true, photoUrl: true, isActive: true, createdAt: true } },
      classSubjectTeachers: {
        include: {
          class: { select: { name: true, section: true } },
          subject: { select: { name: true, code: true } },
        },
      },
      homeRoomClass: { select: { id: true, name: true, section: true } },
    },
  });
  if (!teacher) return next(createError('Teacher not found', 404));
  successResponse(res, teacher, 'Teacher fetched');
};

export const create = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const { name, email, password, phone, photoUrl, qualification, specialization, canEditStudents } = req.body;

  if (!email) {
    return next(createError('Email address is required', 400));
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    const [existingTeacher, existingStudent] = await Promise.all([
      prisma.teacher.findUnique({ where: { userId: existing.id } }),
      prisma.student.findUnique({ where: { userId: existing.id } }),
    ]);

    if (!existingTeacher && !existingStudent && existing.role !== 'SUPER_ADMIN' && existing.role !== 'ADMIN') {
      // Clean up orphan user record from a previously incomplete or deleted record
      await prisma.user.delete({ where: { id: existing.id } });
    } else if (existingTeacher) {
      return next(createError(`Teacher profile with email '${email}' already exists in the faculty.`, 409));
    } else if (existingStudent) {
      return next(createError(`A student is already registered with email '${email}'.`, 409));
    } else {
      return next(createError(`Email '${email}' is already registered in the system.`, 409));
    }
  }

  const hashedPassword = await bcrypt.hash(password || 'Teacher@123', 12);
  const count = await prisma.teacher.count();
  const employeeId = generateEmployeeId(count + 1);

  const user = await prisma.user.create({
    data: { name, email, password: hashedPassword, role: 'TEACHER', phone, photoUrl },
  });

  const teacher = await prisma.teacher.create({
    data: { userId: user.id, employeeId, qualification, specialization, canEditStudents: canEditStudents || false },
    include: { user: { select: { id: true, name: true, email: true } } },
  });

  const creatorName = req.user?.name || 'System';
  createSystemNotification({
    role: 'SUPER_ADMIN',
    title: `👨‍🏫 New Teacher Added`,
    message: `${creatorName} added ${name} to the faculty (Subject: ${specialization || 'N/A'}).`,
    type: 'INFO',
    link: `/teachers/${teacher.id}`
  });
  createSystemNotification({
    role: 'ADMIN',
    title: `👨‍🏫 New Teacher Added`,
    message: `${creatorName} added ${name} to the faculty (Subject: ${specialization || 'N/A'}).`,
    type: 'INFO',
    link: `/teachers/${teacher.id}`
  });

  successResponse(res, teacher, 'Teacher created', 201);
};

export const update = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const id = req.params.id as string;
  const { name, phone, photoUrl, qualification, specialization, canEditStudents } = req.body;

  const teacher = await prisma.teacher.findUnique({ where: { id } });
  if (!teacher) return next(createError('Teacher not found', 404));

  await prisma.user.update({ where: { id: teacher.userId }, data: { name, phone, photoUrl } });
  const updated = await prisma.teacher.update({
    where: { id },
    data: { qualification, specialization, canEditStudents: canEditStudents !== undefined ? canEditStudents : undefined },
    include: { user: { select: { id: true, name: true, email: true, phone: true, photoUrl: true } } },
  });

  const updaterName = req.user?.name || 'System';
  createSystemNotification({
    role: 'SUPER_ADMIN',
    title: `👨‍🏫 Teacher Updated`,
    message: `${updaterName} updated profile of teacher ${name || teacher.employeeId}.`,
    type: 'INFO',
    link: `/teachers/${teacher.id}`
  });
  createSystemNotification({
    role: 'ADMIN',
    title: `👨‍🏫 Teacher Updated`,
    message: `${updaterName} updated profile of teacher ${name || teacher.employeeId}.`,
    type: 'INFO',
    link: `/teachers/${teacher.id}`
  });

  successResponse(res, updated, 'Teacher updated');
};

export const deleteTeacher = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const id = req.params.id as string;
  const teacher = await prisma.teacher.findUnique({ where: { id } });
  if (!teacher) return next(createError('Teacher not found', 404));

  try {
    await prisma.$transaction([
      prisma.classSubjectTeacher.deleteMany({ where: { teacherId: id } }),
      prisma.teacher.deleteMany({ where: { id } }),
      prisma.user.deleteMany({ where: { id: teacher.userId } }),
    ]);
    successResponse(res, null, 'Teacher deleted');
  } catch (err) {
    next(err);
  }
};

export const getMyProfile = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const teacher = await prisma.teacher.findFirst({
    where: { userId: req.user!.id },
    include: {
      user: { select: { id: true, name: true, email: true, phone: true, photoUrl: true } },
      homeRoomClass: true,
      classSubjectTeachers: {
        include: {
          class: { select: { name: true, section: true } },
          subject: { select: { name: true, code: true } },
        },
      },
    },
  });
  if (!teacher) return next(createError('Teacher profile not found', 404));
  successResponse(res, teacher, 'Profile fetched');
};

export const getAssignedClasses = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const id = req.params.id as string;
  const teacher = await prisma.teacher.findUnique({ where: { id } });
  if (!teacher) return next(createError('Teacher not found', 404));

  const assignments = await prisma.classSubjectTeacher.findMany({
    where: { teacherId: id },
    include: {
      class: { select: { id: true, name: true, section: true, academicYear: true } },
      subject: { select: { id: true, name: true, code: true } },
    },
  });
  successResponse(res, assignments, 'Assigned classes fetched');
};

export const bulkImport = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  if (!req.file) return next(createError('Excel or CSV file required', 400));

  try {
    const filePath = req.file.path;
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const results = XLSX.utils.sheet_to_json<any>(sheet);

    let success = 0;
    const failed: any[] = [];

    for (const row of results) {
      try {
        const name = row.Name || row.name;
        const phone = row.Phone || row.phone;
        const password = phone; // Password is mobile no
        const specialization = row.Subject || row.subject || null;

        if (!name || !phone) {
          failed.push({ row, reason: 'Name and Phone are required' });
          continue;
        }

        // Auto-generate email based on phone since email is unique and required by Prisma
        const generatedEmail = `${phone}@jyschool.com`;

        const existing = await prisma.user.findFirst({ 
          where: { 
            OR: [
              { email: generatedEmail },
              { phone: String(phone), role: { not: 'STUDENT' } }
            ]
          } 
        });
        
        if (existing) {
          failed.push({ row, reason: 'Phone number already registered' });
          continue;
        }

        const hashedPassword = await bcrypt.hash(String(password), 12);
        const count = await prisma.teacher.count();
        const employeeId = generateEmployeeId(count + 1);

        const user = await prisma.user.create({
          data: { name, email: generatedEmail, password: hashedPassword, role: 'TEACHER', phone: String(phone) },
        });

        await prisma.teacher.create({
          data: {
            userId: user.id,
            employeeId,
            qualification: null,
            specialization: specialization ? String(specialization) : null,
          },
        });
        success++;
      } catch (e: any) {
        failed.push({ row, reason: e.message });
      }
    }

    // Clean up uploaded file
    try {
      require('fs').unlinkSync(filePath);
    } catch (e) {
      console.error('File cleanup failed:', e);
    }

    successResponse(res, { success, failed, total: results.length }, 'Bulk import complete');
  } catch (error) {
    next(error);
  }
};

export const exportCsv = async (_req: AuthRequest, res: Response): Promise<void> => {
  const teachers = await prisma.teacher.findMany({
    include: {
      user: { select: { name: true, email: true, phone: true } },
    },
    orderBy: { employeeId: 'asc' },
  });

  const rows = teachers.map((t) => ({
    'Employee ID': t.employeeId,
    'Name': t.user.name,
    'Phone': t.user.phone || '',
    'Subject': t.specialization || '',
  }));

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, ws, 'Teachers');
  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

  res.setHeader('Content-Disposition', 'attachment; filename=teachers.xlsx');
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.send(buffer);
};

