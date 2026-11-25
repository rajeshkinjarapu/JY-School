import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth';
import { createError } from '../middlewares/errorHandler';
import { prisma } from '../utils/prisma';
import { cache } from '../utils/cache';
import { successResponse, paginatedResponse } from '../utils/response';
import { generateRollNo } from '../utils/helpers';
import bcrypt from 'bcryptjs';
import * as XLSX from 'xlsx';
import csv from 'csv-parser';
import { Readable } from 'stream';
import AdmZip from 'adm-zip';
import path from 'path';
import fs from 'fs';
import { clearDashboardCache } from './dashboard.controller';
import { createSystemNotification } from './notifications.controller';
import { sortStudentsClassWiseAndAlphabetical } from '../utils/sortClasses';

export const getAll = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = (req.query.search as string) || '';
    const classId = (req.query.classId as string) || '';
    const gender = (req.query.gender as string) || '';
    const academicYear = (req.query.academicYear as string) || '';
    const skip = (page - 1) * limit;

    const useCache = limit <= 100;
    const cacheKey = `students:list:${page}:${limit}:${search}:${classId}:${gender}:${academicYear}:class_alpha_v5`;

    if (useCache) {
      const cached = await cache.get<any>(cacheKey);
      if (cached) {
        return res.json(cached) as any;
      }
    }

    const where: any = {};
    if (academicYear) {
      if (classId) {
        where.classId = classId;
        where.class = { academicYear };
      } else {
        where.class = { academicYear };
      }
    } else if (classId) {
      where.classId = classId;
    }
    if (gender) where.gender = gender;
    if (search) {
      where.OR = [
        { user: { name: { contains: search, mode: 'insensitive' } } },
        { rollNo: { contains: search, mode: 'insensitive' } },
      ];
    }

    let students: any[] = [];
    let total = 0;
    try {
      if (!classId) {
        // When viewing all classes, fetch matching students and sort class-wise (Nursery -> 10th) + alphabetical (A-Z)
        const allStudents = await prisma.student.findMany({
          where,
          include: {
            user: { select: { id: true, name: true, email: true, phone: true, photoUrl: true, isActive: true } },
            class: { select: { id: true, name: true, section: true } },
          },
        });
        const sorted = sortStudentsClassWiseAndAlphabetical(allStudents);
        total = sorted.length;
        students = sorted.slice(skip, skip + limit);
      } else {
        [students, total] = await Promise.all([
          prisma.student.findMany({
            where,
            skip,
            take: limit,
            orderBy: [
              { user: { name: 'asc' } },
              { rollNo: 'asc' },
            ],
            include: {
              user: { select: { id: true, name: true, email: true, phone: true, photoUrl: true, isActive: true } },
              class: { select: { id: true, name: true, section: true } },
            },
          }),
          prisma.student.count({ where }),
        ]);
      }
    } catch (fetchErr: any) {
      if (fetchErr?.message?.includes('childId') || fetchErr?.message?.includes('apaarId')) {
        try {
          await prisma.$executeRawUnsafe(`
            ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "childId" TEXT;
            ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "apaarId" TEXT;
            CREATE INDEX IF NOT EXISTS "Student_childId_idx" ON "Student"("childId");
            CREATE INDEX IF NOT EXISTS "Student_apaarId_idx" ON "Student"("apaarId");
          `);
          if (!classId) {
            const allStudents = await prisma.student.findMany({
              where,
              include: {
                user: { select: { id: true, name: true, email: true, phone: true, photoUrl: true, isActive: true } },
                class: { select: { id: true, name: true, section: true } },
              },
            });
            const sorted = sortStudentsClassWiseAndAlphabetical(allStudents);
            total = sorted.length;
            students = sorted.slice(skip, skip + limit);
          } else {
            [students, total] = await Promise.all([
              prisma.student.findMany({
                where,
                skip,
                take: limit,
                orderBy: [
                  { user: { name: 'asc' } },
                  { rollNo: 'asc' },
                ],
                include: {
                  user: { select: { id: true, name: true, email: true, phone: true, photoUrl: true, isActive: true } },
                  class: { select: { id: true, name: true, section: true } },
                },
              }),
              prisma.student.count({ where }),
            ]);
          }
        } catch (retryErr) {
          throw retryErr;
        }
      } else {
        throw fetchErr;
      }
    }

    const sanitizedStudents = students.map(student => {
      let avatarUrl = student.user.photoUrl;
      if (avatarUrl && avatarUrl.startsWith('data:image')) {
        avatarUrl = `/api/users/${student.user.id}/photo`;
      }
      return {
        ...student,
        user: { ...student.user, photoUrl: avatarUrl }
      };
    });

    const responseBody = { success: true, data: sanitizedStudents, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } };
    if (useCache) {
      await cache.set(cacheKey, responseBody, 180); // 3 min cache
    }
    return res.json(responseBody) as any;
  } catch (error) {
    console.error("Error in getAll students:", error);
    return next(error);
  }
};

export const getById = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const id = req.params.id as string;
  const userRole = req.user?.role;
  const userId = req.user?.id;

  const cacheKey = `student:${id}:${userRole}:${userId}`;
  try {
    const cached = await cache.get<any>(cacheKey);
    if (cached) {
      successResponse(res, cached, 'Student fetched');
      return;
    }
  } catch (err) {
    // Cache read error ignored
  }

  const student = await prisma.student.findFirst({
    where: {
      OR: [
        { id },
        { userId: id },
        { rollNo: id }
      ]
    },
    include: {
      user: { select: { id: true, name: true, email: true, phone: true, photoUrl: true, isActive: true, createdAt: true } },
      class: true,
      marks: {
        select: {
          id: true,
          marksObtained: true,
          maxMarks: true,
          grade: true,
          remarks: true,
          createdAt: true,
          examId: true,
          subjectId: true,
          studentId: true,
          exam: { select: { id: true, name: true, term: true, examDate: true, maxMarks: true, passingMarks: true } },
          subject: { select: { id: true, name: true, code: true, classId: true } }
        },
        orderBy: { createdAt: 'desc' },
        take: 20
      },
      feePayments: { include: { feeStructure: true }, orderBy: { createdAt: 'desc' }, take: 20 },
      feeDiscounts: true,
    },
  });
  if (!student) return next(createError('Student not found', 404));
  let isClassTeacher = false;
  let canViewAllStudents = false;
  let canEditStudents = false;
  let hasFullAccess = true;

  if (userRole === 'TEACHER') {
    const teacher = await prisma.teacher.findUnique({
      where: { userId: req.user?.id },
      include: { homeRoomClass: { select: { id: true } } },
    });

    if (teacher) {
      canViewAllStudents = teacher.canViewAllStudents === true;
      canEditStudents = teacher.canEditStudents === true;
      isClassTeacher = teacher.homeRoomClass?.some(c => c.id === student.classId) || false;
      hasFullAccess = canViewAllStudents || isClassTeacher || canEditStudents;
    } else {
      hasFullAccess = false;
    }

    if (!hasFullAccess) {
      const sanitizedStudent = {
        ...student,
        isClassTeacher: false,
        canViewAllStudents: false,
        canEditStudents: false,
        hasFullAccess: false,
        address: null,
        aadharNo: null,
        childId: null,
        apaarId: null,
        fatherAadhar: null,
        motherAadhar: null,
        dob: null,
        fatherPhone: null,
        motherPhone: null,
        guardianName: null,
        guardianPhone: null,
        guardianRelation: null,
        user: {
          ...student.user,
          phone: null,
        },
        feePayments: [],
        feeDiscounts: [],
      };
      await cache.set(cacheKey, sanitizedStudent, 180);
      successResponse(res, sanitizedStudent, 'Student fetched');
      return;
    }
  }

  const responseStudent = {
    ...student,
    isClassTeacher: userRole === 'TEACHER' ? isClassTeacher : true,
    canViewAllStudents: userRole === 'TEACHER' ? canViewAllStudents : true,
    canEditStudents: userRole === 'TEACHER' ? canEditStudents : true,
    hasFullAccess: true,
  };

  await cache.set(cacheKey, responseStudent, 180);
  successResponse(res, responseStudent, 'Student fetched');
};

export const create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { name, password, phone, photoUrl, classId, dob, gender, address, bloodGroup, studentId, fatherName, motherName, fatherAadhar, motherAadhar, fatherPhone, motherPhone, guardianName, guardianPhone, guardianRelation, aadharNo, penNumber, childId, apaarId } = req.body;

  let rollNo = studentId?.trim();

  if (!rollNo) {
    let count = 0;

    if (classId) {
      const maxStudentInClass = await prisma.student.findFirst({
        where: { classId },
        orderBy: { rollNo: 'desc' },
      });
      if (maxStudentInClass && maxStudentInClass.rollNo) {
        const match = maxStudentInClass.rollNo.match(/\d+$/);
        if (match) {
          count = parseInt(match[0], 10);
        }
      }
    }

    if (count === 0) {
      count = await prisma.student.count();
    }

    let isUnique = false;
    while (!isUnique) {
      rollNo = generateRollNo(count + 1);
      const existingUser = await prisma.user.findUnique({ where: { email: rollNo } });
      const existingStudent = await prisma.student.findUnique({ where: { rollNo } });
      if (!existingUser && !existingStudent) {
        isUnique = true;
      } else {
        count++;
      }
    }
  } else {
    const existingUser = await prisma.user.findUnique({ where: { email: rollNo } });
    const existingStudent = await prisma.student.findUnique({ where: { rollNo } });
    if (existingUser || existingStudent) {
      return next(createError('Student ID already exists', 409));
    }
  }

  // The login ID is exactly the Student ID
  const email = rollNo;

  const plainTextPassword = password || 'Student2026';
  const hashedPassword = await bcrypt.hash(plainTextPassword, 10);

  const user = await prisma.user.create({
    data: { name, email, password: hashedPassword, plainPassword: plainTextPassword, role: 'STUDENT', phone, photoUrl },
  });

  const student = await prisma.student.create({
    data: {
      userId: user.id,
      rollNo,
      classId: classId || null,
      dob: dob ? new Date(dob) : null,
      gender: gender || null,
      address: address || null,
      bloodGroup: bloodGroup || null,
      fatherName: fatherName || null,
      motherName: motherName || null,
      fatherAadhar: fatherAadhar ? String(fatherAadhar).trim() : null,
      motherAadhar: motherAadhar ? String(motherAadhar).trim() : null,
      fatherPhone: fatherPhone ? String(fatherPhone).trim() : null,
      motherPhone: motherPhone ? String(motherPhone).trim() : null,
      guardianName: guardianName ? String(guardianName).trim() : null,
      guardianPhone: guardianPhone ? String(guardianPhone).trim() : null,
      guardianRelation: guardianRelation ? String(guardianRelation).trim() : null,
      aadharNo: aadharNo ? String(aadharNo).trim() : null,
      penNumber: penNumber || null,
      childId: childId ? String(childId).trim() : null,
      apaarId: apaarId ? String(apaarId).trim() : null,
    },
    include: {
      user: { select: { id: true, name: true, email: true, phone: true } },
      class: true,
    },
  });

  cache.delPattern('students:list:*');
  cache.delPattern('student:*');
  clearDashboardCache();

  const creatorName = (req as any).user?.name || 'System';
  createSystemNotification({
    role: 'SUPER_ADMIN',
    title: `🎓 New Student Joined`,
    message: `${creatorName} admitted new student ${name} (Class: ${student.class ? `${student.class.name}-${student.class.section}` : 'N/A'}).`,
    type: 'INFO',
    link: `/students/${student.id}`
  });
  createSystemNotification({
    role: 'ADMIN',
    title: `🎓 New Student Joined`,
    message: `${creatorName} admitted new student ${name} (Class: ${student.class ? `${student.class.name}-${student.class.section}` : 'N/A'}).`,
    type: 'INFO',
    link: `/students/${student.id}`
  });

  successResponse(res, student, 'Student created', 201);
};

export const update = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const id = req.params.id as string;
  const { name, phone, photoUrl, classId, dob, gender, address, bloodGroup, studentId, fatherName, motherName, fatherAadhar, motherAadhar, fatherPhone, motherPhone, guardianName, guardianPhone, guardianRelation, aadharNo, penNumber, childId, apaarId } = req.body;

  // Check teacher permission if the user is a teacher
  if (req.user?.role === 'TEACHER') {
    const teacher = await prisma.teacher.findUnique({ where: { userId: req.user.id } });
    if (!teacher || !teacher.canEditStudents) {
      return next(createError('You do not have permission to edit student details', 403));
    }
  }

  const student = await prisma.student.findUnique({ where: { id }, include: { user: true } });
  if (!student) return next(createError('Student not found', 404));

  let finalRollNo = student.rollNo;
  const newStudentId = studentId?.trim();

  if (newStudentId && newStudentId !== student.rollNo) {
    const existing = await prisma.student.findUnique({ where: { rollNo: newStudentId } });
    if (existing) return next(createError('Student ID already exists', 409));

    // Update User email (login ID) to the new Student ID
    await prisma.user.update({
      where: { id: student.userId },
      data: { ...(name ? { name } : {}), ...(phone !== undefined ? { phone: phone || null } : {}), ...(photoUrl !== undefined ? { photoUrl: photoUrl || null } : {}), email: newStudentId },
    });
    finalRollNo = newStudentId;
  } else {
    await prisma.user.update({
      where: { id: student.userId },
      data: { ...(name ? { name } : {}), ...(phone !== undefined ? { phone: phone || null } : {}), ...(photoUrl !== undefined ? { photoUrl: photoUrl || null } : {}) },
    });
  }

  const updated = await prisma.student.update({
    where: { id },
    data: {
      rollNo: finalRollNo,
      classId: classId !== undefined ? classId || null : undefined,
      dob: dob !== undefined ? (dob ? new Date(dob) : null) : undefined,
      gender: gender !== undefined ? gender || null : undefined,
      address: address !== undefined ? address || null : undefined,
      bloodGroup: bloodGroup !== undefined ? bloodGroup || null : undefined,
      fatherName: fatherName !== undefined ? fatherName || null : undefined,
      motherName: motherName !== undefined ? motherName || null : undefined,
      fatherAadhar: fatherAadhar !== undefined ? (fatherAadhar ? String(fatherAadhar).trim() : null) : undefined,
      motherAadhar: motherAadhar !== undefined ? (motherAadhar ? String(motherAadhar).trim() : null) : undefined,
      fatherPhone: fatherPhone !== undefined ? (fatherPhone ? String(fatherPhone).trim() : null) : undefined,
      motherPhone: motherPhone !== undefined ? (motherPhone ? String(motherPhone).trim() : null) : undefined,
      guardianName: guardianName !== undefined ? (guardianName ? String(guardianName).trim() : null) : undefined,
      guardianPhone: guardianPhone !== undefined ? (guardianPhone ? String(guardianPhone).trim() : null) : undefined,
      guardianRelation: guardianRelation !== undefined ? (guardianRelation ? String(guardianRelation).trim() : null) : undefined,
      aadharNo: aadharNo !== undefined ? (aadharNo ? String(aadharNo).trim() : null) : undefined,
      penNumber: penNumber !== undefined ? (penNumber ? String(penNumber).trim() : null) : undefined,
      childId: childId !== undefined ? (childId ? String(childId).trim() : null) : undefined,
      apaarId: apaarId !== undefined ? (apaarId ? String(apaarId).trim() : null) : undefined,
    },
    include: {
      user: { select: { id: true, name: true, email: true, phone: true, photoUrl: true } },
      class: true,
    },
  });

  cache.delPattern('students:list:*');
  cache.delPattern('student:*');
  clearDashboardCache();

  const updaterName = req.user?.name || 'System';
  createSystemNotification({
    role: 'SUPER_ADMIN',
    title: `🎓 Student Updated`,
    message: `${updaterName} updated profile of student ${name || student.user.name} (Class: ${updated.class ? `${updated.class.name}-${updated.class.section}` : 'N/A'}).`,
    type: 'INFO',
    link: `/students/${student.id}`
  });
  createSystemNotification({
    role: 'ADMIN',
    title: `🎓 Student Updated`,
    message: `${updaterName} updated profile of student ${name || student.user.name} (Class: ${updated.class ? `${updated.class.name}-${updated.class.section}` : 'N/A'}).`,
    type: 'INFO',
    link: `/students/${student.id}`
  });

  successResponse(res, updated, 'Student updated');
};

export const changeName = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const id = req.params.id as string;
  const { name } = req.body;

  if (!name) {
    return next(createError('Name is required', 400));
  }

  const student = await prisma.student.findUnique({ where: { id }, include: { user: true } });
  if (!student) return next(createError('Student not found', 404));

  const updatedUser = await prisma.user.update({
    where: { id: student.userId },
    data: { name },
  });

  const updatedStudent = await prisma.student.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, email: true, phone: true, photoUrl: true } },
      class: true,
    },
  });

  createSystemNotification({
    role: 'SUPER_ADMIN',
    title: `🎓 Student Name Changed`,
    message: `${student.user.name} changed name to ${name}.`,
    type: 'INFO',
    link: `/students/${student.id}`
  });

  cache.delPattern('student:*');
  cache.delPattern('students:list:*');
  successResponse(res, updatedStudent, 'Student name updated');
};

export const changeClass = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const id = req.params.id as string;
  const { classId } = req.body;

  if (!classId) {
    return next(createError('classId is required', 400));
  }

  const student = await prisma.student.findUnique({ where: { id } });
  if (!student) return next(createError('Student not found', 404));

  const updated = await prisma.student.update({
    where: { id },
    data: { classId },
    include: {
      user: { select: { id: true, name: true, email: true, phone: true, photoUrl: true } },
      class: true,
    },
  });

  createSystemNotification({
    role: 'SUPER_ADMIN',
    title: `🎓 Student Class Changed`,
    message: `${updated.user?.name || 'A student'}'s section was updated.`,
    type: 'INFO',
    link: `/students/${student.id}`
  });

  cache.delPattern('student:*');
  cache.delPattern('students:list:*');
  successResponse(res, updated, 'Student section/class updated');
};

export const deleteStudent = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const id = req.params.id as string;
  const student = await prisma.student.findUnique({ where: { id } });
  if (!student) return next(createError('Student not found', 404));

  try {
    await prisma.$transaction([
      prisma.attendance.deleteMany({ where: { studentId: id } }),
      prisma.mark.deleteMany({ where: { studentId: id } }),
      prisma.feePayment.deleteMany({ where: { studentId: id } }),
      prisma.student.deleteMany({ where: { id } }),
      prisma.user.deleteMany({ where: { id: student.userId } }),
    ]);
    cache.delPattern('students:list:*');
    clearDashboardCache();
    successResponse(res, null, 'Student deleted');
  } catch (err) {
    next(err);
  }
};

export const bulkImport = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  if (!req.file) return next(createError('Excel or CSV file required', 400));

  try {
    const filePath = req.file.path;
    const workbook = XLSX.readFile(filePath, { cellDates: true });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rawResults = XLSX.utils.sheet_to_json<any>(sheet);

    // Ensure childId and apaarId columns exist in database before executing queries
    try {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "childId" TEXT;
        ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "apaarId" TEXT;
        CREATE INDEX IF NOT EXISTS "Student_childId_idx" ON "Student"("childId");
        CREATE INDEX IF NOT EXISTS "Student_apaarId_idx" ON "Student"("apaarId");
      `);
    } catch (dbColErr: any) {
      console.warn('DB Column check notice in bulkImport:', dbColErr?.message);
    }

    if (rawResults.length > 5000) {
      return next(createError('Please upload maximum 5000 students at a time', 400));
    }

    let created = 0;
    let updated = 0;
    const failed: any[] = [];

    // Helper: Normalize string keys
    const normalizeRow = (r: any) => {
      const norm: any = {};
      for (const k of Object.keys(r)) {
        const val = r[k];
        norm[k] = val;
        // lowercase and remove spaces, underscores, hyphens, periods
        const cleanKey = k.toLowerCase().replace(/[\s_\-\.]+/g, '');
        norm[cleanKey] = val;
      }
      return norm;
    };

    // Helper: Clean numeric digits (removes dashes, spaces, and safely handles large numbers/scientific notation)
    const cleanDigits = (val: any): string | null => {
      if (val === undefined || val === null) return null;
      if (typeof val === 'number') {
        try {
          return BigInt(Math.trunc(val)).toString();
        } catch {
          return String(Math.round(val));
        }
      }
      let s = String(val).trim();
      if (/^[+-]?\d+(\.\d+)?[eE][+-]?\d+$/.test(s)) {
        try {
          const num = Number(s);
          if (!isNaN(num)) {
            return BigInt(Math.trunc(num)).toString();
          }
        } catch {}
      }
      s = s.replace(/[\s\-]+/g, '').trim();
      return s.length > 0 ? s : null;
    };

    // Helper: Clean string
    const cleanStr = (val: any): string | null => {
      if (val === undefined || val === null) return null;
      const s = String(val).trim();
      return (s.length > 0 && s !== 'null' && s !== 'undefined' && s !== 'N/A') ? s : null;
    };

    // Helper: Parse Date of Birth flexibly
    const parseDate = (val: any): Date | null => {
      if (!val) return null;

      // 1. If already Date object (from XLSX cellDates: true)
      if (val instanceof Date) {
        return isNaN(val.getTime()) ? null : val;
      }

      // 2. Excel numeric serial number (e.g. 42567 or "42567")
      if (typeof val === 'number' || (typeof val === 'string' && /^\d{4,6}(\.\d+)?$/.test(val.trim()))) {
        const num = typeof val === 'number' ? val : parseFloat(val.trim());
        if (num > 1000 && num < 100000) {
          const epoch = new Date(Date.UTC(1899, 11, 30));
          const d = new Date(epoch.getTime() + num * 86400000);
          if (!isNaN(d.getTime())) return d;
        }
      }

      let str = String(val).trim();
      if (!str || str.toLowerCase() === 'null' || str.toLowerCase() === 'undefined' || str === 'N/A') {
        return null;
      }

      // Strip time suffix if present (e.g. "16/07/2016 00:00:00" or "2016-07-16T00:00:00")
      str = str.replace(/[T\s].*$/, '').trim();

      // 3. DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY (supports 2 or 4 digit year)
      const dmy = str.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})$/);
      if (dmy) {
        const day = parseInt(dmy[1], 10);
        const month = parseInt(dmy[2], 10) - 1;
        let year = parseInt(dmy[3], 10);
        if (year < 100) {
          year = year > 40 ? 1900 + year : 2000 + year;
        }
        const d = new Date(Date.UTC(year, month, day));
        if (!isNaN(d.getTime())) return d;
      }

      // 4. YYYY-MM-DD or YYYY/MM/DD or YYYY.MM.DD
      const ymd = str.match(/^(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})$/);
      if (ymd) {
        const year = parseInt(ymd[1], 10);
        const month = parseInt(ymd[2], 10) - 1;
        const day = parseInt(ymd[3], 10);
        const d = new Date(Date.UTC(year, month, day));
        if (!isNaN(d.getTime())) return d;
      }

      // 5. DD-Mon-YYYY (e.g. "16-Jul-2016", "16 Jul 2016")
      const monthNames: Record<string, number> = {
        jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
        jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11
      };
      const dMonthY = str.match(/^(\d{1,2})[\s\-\/]+([a-zA-Z]{3,9})[\s\-\/]+(\d{2,4})$/);
      if (dMonthY) {
        const day = parseInt(dMonthY[1], 10);
        const mKey = dMonthY[2].toLowerCase().substring(0, 3);
        const month = monthNames[mKey];
        let year = parseInt(dMonthY[3], 10);
        if (year < 100) {
          year = year > 40 ? 1900 + year : 2000 + year;
        }
        if (month !== undefined) {
          const d = new Date(Date.UTC(year, month, day));
          if (!isNaN(d.getTime())) return d;
        }
      }

      const d = new Date(str);
      return isNaN(d.getTime()) ? null : d;
    };

    // Helper: Clean gender
    const cleanGender = (val: any): string | null => {
      if (!val) return null;
      const g = String(val).trim().toUpperCase();
      if (g.startsWith('M') || g.includes('BOY')) return 'MALE';
      if (g.startsWith('F') || g.includes('GIRL')) return 'FEMALE';
      return g;
    };

    let currentStudentCount = await prisma.student.count();

    for (let i = 0; i < rawResults.length; i++) {
      const rawRow = rawResults[i];
      const row = normalizeRow(rawRow);

      const name = cleanStr(
        row.studentname || row.name || row.fullname || row.studentfullname || row.firstname ||
        row.student || row.candidatename || row.pupilname || row.nameofstudent || row.nameofthestudent
      );
      const rawStudentId = cleanStr(
        row.studentid || row.rollno || row.roll || row.rollnumber || row.admissionno ||
        row.admissionnumber || row.admno || row.admnno || row.regno || row.registrationno ||
        row.regnumber || row.studentcode || row.studentno || row.studentnumber || row.id || row.htno
      );

      if (!name && !rawStudentId) {
        continue;
      }

      try {
        let classId: string | null = cleanStr(row.classid);
        const className = cleanStr(row.classname || row.class || row.grade || row.standard);
        const section = cleanStr(row.sectionname || row.section || row.sec);

        if (!classId && className) {
          const clsName = className;
          const clsSec = section || 'A';
          let cls = await prisma.class.findFirst({
            where: { name: clsName, section: clsSec }
          });
          if (!cls) {
            cls = await prisma.class.create({
              data: {
                name: clsName,
                section: clsSec,
                academicYear: `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
                capacity: 40
              }
            });
          }
          classId = cls.id;
        }

        const rawDob = row.dateofbirth || row.dob || row.birthdate || row.birth_date ||
          row.studentdob || row.dateofbirthddmmyyyy || row.dobddmmyyyy || row.dateof_birth ||
          Object.keys(rawRow).filter(k => {
            const lk = k.toLowerCase().replace(/[^a-z]/g, '');
            return lk.includes('dob') || lk.includes('birth');
          }).map(k => rawRow[k])[0];
        const dob = parseDate(rawDob);
        const gender = cleanGender(row.gender || row.sex);
        const childId = cleanDigits(
          row.childid || row.child_id || row.childinfoid || row.childinfo || row.child || row.studentchildid
        );
        const apaarId = cleanDigits(
          row.apaarid || row.apaar_id || row.apaar || row.apaarnumber || row.apaarno || row.aparid || row.apar
        );
        const penNumber = cleanDigits(
          row.pennumber || row.pen_number || row.pen || row.penno || row.permanenteducationnumber || row.pen_no
        );
        const aadharNo = cleanDigits(
          row.studentaadhar || row.studentaadhaar || row.aadharno || row.aadhaarno ||
          row.aadhar || row.aadhaar || row.studentuid || row.uid || row.aadharnumber || row.studentaadharno
        );
        const fatherName = cleanStr(
          row.fathername || row.father || row.fathersname || row.fatherfullname || row.parentname
        );
        const fatherAadhar = cleanDigits(
          row.fatheraadhar || row.fatheraadhaar || row.fatheraadharno || row.fatheruid || row.father_aadhar
        );
        const fatherPhone = cleanDigits(
          row.fatherphone || row.fathermobile || row.fathercontact || row.fathercontactno || row.father_phone
        );
        const motherName = cleanStr(
          row.mothername || row.mother || row.mothersname || row.motherfullname
        );
        const motherAadhar = cleanDigits(
          row.motheraadhar || row.motheraadhaar || row.motheraadharno || row.motheruid || row.mother_aadhar
        );
        const motherPhone = cleanDigits(
          row.motherphone || row.mothermobile || row.mothercontact || row.mothercontactno || row.mother_phone
        );
        const primaryPhone = cleanDigits(
          row.mobileno || row.phone || row.mobile || row.phoneno || row.contact || row.contactno || row.cell || fatherPhone || motherPhone
        );
        const address = cleanStr(
          row.address || row.fulladdress || row.residentialaddress || row.village || row.city
        );
        const bloodGroup = cleanStr(row.bloodgroup || row.blood || row.bg);

        // Check if student exists by Student ID (rollNo or User email)
        let existingStudent = null;
        let matchedByRollNo = false;
        if (rawStudentId) {
          existingStudent = await prisma.student.findFirst({
            where: {
              OR: [
                { rollNo: { equals: rawStudentId, mode: 'insensitive' } },
                { user: { email: { equals: rawStudentId, mode: 'insensitive' } } }
              ]
            },
            include: { user: true }
          });
          if (existingStudent) matchedByRollNo = true;
        }

        // If not matched by rollNo, try matching by Child ID, APAAR ID, or Aadhaar No
        // NOTE: Only match by government IDs if rawStudentId was NOT provided (prevents cross-student collisions!)
        if (!existingStudent && !rawStudentId) {
          if (childId) {
            existingStudent = await prisma.student.findFirst({
              where: { childId },
              include: { user: true }
            });
          }
          if (!existingStudent && apaarId) {
            existingStudent = await prisma.student.findFirst({
              where: { apaarId },
              include: { user: true }
            });
          }
          if (!existingStudent && aadharNo) {
            existingStudent = await prisma.student.findFirst({
              where: { aadharNo },
              include: { user: true }
            });
          }
        }

        if (existingStudent) {
          // ── BULLETPROOF ROW-SHIFT & SILENT OVERWRITE SAFEGUARDS ──
          const existingName = (existingStudent.user?.name || '').trim();

          // Check for high-confidence row-shift or mistaken ID collision:
          if (existingName && name && name.toUpperCase() !== existingName.toUpperCase()) {
            const oldWords = existingName.toUpperCase().split(/[\s.]+/).filter(w => w.length > 1);
            const newWords = name.toUpperCase().split(/[\s.]+/).filter(w => w.length > 1);
            const sharesWord = oldWords.some(w => newWords.includes(w));

            const existingFather = (existingStudent.fatherName || '').trim().toUpperCase();
            const newFather = (fatherName || '').trim().toUpperCase();
            const fatherMismatch = existingFather && newFather && existingFather !== newFather &&
              !existingFather.split(/[\s.]+/).some(w => w.length > 2 && newFather.includes(w));

            if (!sharesWord && fatherMismatch) {
              // High-confidence ROW SHIFT detected: Both Student Name and Father Name are completely different!
              failed.push({
                row: rawRow,
                reason: `భద్రతా తిరస్కరణ (Row Shift Detected): Student ID "${rawStudentId}" ఇప్పటికే "${existingName}" (తండ్రి: ${existingStudent.fatherName}) పేరుతో రిజిస్టర్ అయి ఉంది. కానీ ఎక్సెల్ వరుసలో పూర్తి భిన్నమైన పేరు "${name}" (తండ్రి: ${fatherName}) ఉంది. ఎక్సెల్ షీట్ లో వరుసలు పక్కకు జరగడం (Row Shift) వల్ల డేటా పాడవ్వకుండా ఈ అప్‌డేట్ ఆపబడింది.`
              });
              continue;
            }
          }

          // ── PARTIAL SELECTIVE UPDATE (ONLY UPDATES WHAT WAS GIVEN IN EXCEL!) ──
          const userDataToUpdate: any = {};
          
          if (name && (matchedByRollNo || !existingStudent.user?.name)) {
            // Only update name if it shares at least one name part (spelling fix/expansion) or existing name was empty
            if (!existingName) {
              userDataToUpdate.name = name;
            } else if (name.toUpperCase() !== existingName.toUpperCase()) {
              const oldWords = existingName.toUpperCase().split(/[\s.]+/).filter(w => w.length > 1);
              const newWords = name.toUpperCase().split(/[\s.]+/).filter(w => w.length > 1);
              const sharesWord = oldWords.some(w => newWords.includes(w));
              if (sharesWord) {
                userDataToUpdate.name = name;
              } else {
                console.warn(`[BulkImport Safety] Preserving registered name "${existingName}" for roll "${existingStudent.rollNo}". Ignored mismatched name "${name}".`);
              }
            }
          }
          if (primaryPhone) userDataToUpdate.phone = primaryPhone;

          if (Object.keys(userDataToUpdate).length > 0) {
            await prisma.user.update({
              where: { id: existingStudent.userId },
              data: userDataToUpdate
            });
          }

          const studentDataToUpdate: any = {};
          if (classId) studentDataToUpdate.classId = classId;
          if (dob) studentDataToUpdate.dob = dob;
          if (gender) studentDataToUpdate.gender = gender;
          if (childId) studentDataToUpdate.childId = childId;
          if (apaarId) studentDataToUpdate.apaarId = apaarId;
          if (penNumber) studentDataToUpdate.penNumber = penNumber;
          if (aadharNo) studentDataToUpdate.aadharNo = aadharNo;
          if (fatherName) studentDataToUpdate.fatherName = fatherName;
          if (fatherAadhar) studentDataToUpdate.fatherAadhar = fatherAadhar;
          if (fatherPhone) studentDataToUpdate.fatherPhone = fatherPhone;
          if (motherName) studentDataToUpdate.motherName = motherName;
          if (motherAadhar) studentDataToUpdate.motherAadhar = motherAadhar;
          if (motherPhone) studentDataToUpdate.motherPhone = motherPhone;
          if (address) studentDataToUpdate.address = address;
          if (bloodGroup) studentDataToUpdate.bloodGroup = bloodGroup;

          if (Object.keys(studentDataToUpdate).length > 0) {
            await prisma.student.update({
              where: { id: existingStudent.id },
              data: studentDataToUpdate
            });
          }

          updated++;
        } else {
          // ── CREATE NEW STUDENT ──
          if (!name) {
            failed.push({
              row: rawRow,
              reason: `Student ID "${rawStudentId || 'N/A'}" డేటాబేస్‌లో కనుగొనబడలేదు మరియు కొత్త విద్యార్థిని సృష్టించడానికి "Student Name" లేదు.`
            });
            continue;
          }

          const rollNo = rawStudentId || generateRollNo(currentStudentCount + 1);
          const email = rollNo;
          const plainTextPassword = cleanStr(row.password) || 'Student2026';
          const hashedPassword = await bcrypt.hash(plainTextPassword, 10);

          const newUser = await prisma.user.create({
            data: {
              name,
              email,
              password: hashedPassword,
              plainPassword: plainTextPassword,
              role: 'STUDENT',
              phone: primaryPhone,
            }
          });

          const newStudent = await prisma.student.create({
            data: {
              userId: newUser.id,
              rollNo,
              classId,
              dob,
              gender,
              childId,
              apaarId,
              penNumber,
              aadharNo,
              fatherName,
              fatherAadhar,
              fatherPhone,
              motherName,
              motherAadhar,
              motherPhone,
              address,
              bloodGroup,
            }
          });

          // Fee components creation if present
          const admissionFee = parseFloat(row.admissionfee);
          const tuitionFee = parseFloat(row.tuitionfee || row.tutionfee);
          const booksFee = parseFloat(row.booksfee);
          const feeStructuresToCreate = [];
          const dueDate = new Date();

          if (!isNaN(admissionFee) && admissionFee > 0) {
            feeStructuresToCreate.push({
              studentId: newStudent.id,
              term: 'Term 1',
              name: 'Admission Fee',
              amount: admissionFee,
              dueDate
            });
          }
          if (!isNaN(tuitionFee) && tuitionFee > 0) {
            feeStructuresToCreate.push({
              studentId: newStudent.id,
              term: 'Term 1',
              name: 'Tuition Fee',
              amount: tuitionFee,
              dueDate
            });
          }
          if (!isNaN(booksFee) && booksFee > 0) {
            feeStructuresToCreate.push({
              studentId: newStudent.id,
              term: 'Term 1',
              name: 'Books Fee',
              amount: booksFee,
              dueDate
            });
          }

          if (feeStructuresToCreate.length > 0) {
            await prisma.feeStructure.createMany({ data: feeStructuresToCreate });
          }

          currentStudentCount++;
          created++;
        }
      } catch (err: any) {
        failed.push({ row: rawRow, reason: err.message || 'Processing error' });
      }
    }

    try {
      require('fs').unlinkSync(filePath);
    } catch (_) {}

    clearDashboardCache();
    cache.delPattern('students:list:*');
    cache.delPattern('student:*');

    successResponse(res, {
      success: created + updated,
      created,
      updated,
      failed,
      total: created + updated + failed.length
    }, `Bulk import complete: ${created} created, ${updated} updated`);
  } catch (error) {
    next(error);
  }
};

export const exportCsv = async (_req: AuthRequest, res: Response): Promise<void> => {
  const students = await prisma.student.findMany({
    include: {
      user: { select: { name: true, email: true, phone: true } },
      class: { select: { name: true, section: true } },
    },
    orderBy: { rollNo: 'asc' },
  });

  const rows = students.map((s) => ({
    'Student ID': s.rollNo,
    'Student Name': s.user.name,
    'Class Name': s.class ? s.class.name : '',
    'Section Name': s.class ? s.class.section : '',
    'Date of Birth': s.dob ? s.dob.toISOString().split('T')[0] : '',
    'Gender': s.gender || '',
    'Child ID': s.childId || '',
    'APAAR ID': s.apaarId || '',
    'PEN Number': s.penNumber || '',
    'Student Aadhar': s.aadharNo || '',
    'Father Name': s.fatherName || '',
    'Father Aadhar': s.fatherAadhar || '',
    'Father Phone': s.fatherPhone || '',
    'Mother Name': s.motherName || '',
    'Mother Aadhar': s.motherAadhar || '',
    'Mother Phone': s.motherPhone || '',
    'Address': s.address || '',
    'Blood Group': s.bloodGroup || '',
    'Admission Date': s.admissionDate ? s.admissionDate.toISOString().split('T')[0] : '',
  }));

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, ws, 'Students');
  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

  res.setHeader('Content-Disposition', 'attachment; filename=Students_Master_Export.xlsx');
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.send(buffer);
};

export const getMyProfile = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const student = await prisma.student.findFirst({
    where: { userId: req.user!.id },
    include: {
      user: { select: { id: true, name: true, email: true, phone: true, photoUrl: true } },
      class: true,
      transport: {
        include: {
          route: true,
          stop: true,
        }
      },
    },
  });
  if (!student) return next(createError('Student profile not found', 404));
  const { medicalInfo, ...studentWithoutMedical } = student;
  successResponse(res, studentWithoutMedical, 'Profile fetched');
};

export const bulkUploadPhotos = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  if (!req.file) return next(createError('ZIP file required', 400));

  try {
    const zipPath = req.file.path;
    const zip = new AdmZip(zipPath);
    const zipEntries = zip.getEntries();

    let success = 0;
    const failed: any[] = [];

    const uploadDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    for (const zipEntry of zipEntries) {
      if (zipEntry.isDirectory) continue;

      const fileName = zipEntry.entryName.split('/').pop() || zipEntry.entryName;
      if (fileName.startsWith('.') || fileName.startsWith('__MACOSX')) continue;

      const ext = path.extname(fileName).toLowerCase();
      if (!['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) {
        failed.push({ file: fileName, reason: 'Invalid image format' });
        continue;
      }

      // Extract Roll No using regex (e.g. JY26-0047) to allow names like "JY26-0047 Charan.jpg"
      const rollMatch = fileName.match(/(JY\d{2}-\d+)/i);
      const rollNo = rollMatch ? rollMatch[1].toUpperCase() : path.basename(fileName, ext).trim();

      const student = await prisma.student.findUnique({
        where: { rollNo },
        include: { user: true }
      });

      if (!student) {
        failed.push({ file: fileName, reason: `Student ID ${rollNo} not found` });
        continue;
      }

      const fileBuffer = zipEntry.getData();
      const base64Str = fileBuffer.toString('base64');
      const mimeType = ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg';
      const dataUri = `data:${mimeType};base64,${base64Str}`;

      await prisma.user.update({
        where: { id: student.userId },
        data: { photoUrl: dataUri }
      });

      success++;
    }

    fs.unlinkSync(zipPath);

    cache.delPattern('students:list:*');
    clearDashboardCache();

    successResponse(res, { success, failed }, `Bulk photo upload complete. ${success} uploaded.`);
  } catch (error) {
    next(error);
  }
};

export const getTemplate = async (_req: AuthRequest, res: Response): Promise<void> => {
  const headers = [
    'Student ID', 'Student Name', 'Class Name', 'Section Name', 'Date of Birth',
    'Gender', 'Child ID', 'APAAR ID', 'PEN Number', 'Student Aadhar',
    'Father Name', 'Father Aadhar', 'Father Phone',
    'Mother Name', 'Mother Aadhar', 'Mother Phone',
    'Address', 'Blood Group',
    'Admission Fee', 'Tuition Fee', 'Books Fee'
  ];

  const sampleRow1 = [
    'JY26-0001', 'K. Rajesh', '10th', 'A', '2010-05-14',
    'MALE', '1083920194', '928172938471', '20204049266', '457721363532',
    'K. Ramana', '987654321012', '9848012345',
    'K. Lakshmi', '876543210987', '9848054321',
    'Narasannapeta, Srikakulam', 'O+',
    '5000', '25000', '2000'
  ];

  const sampleRow2 = [
    '', 'S. Grishma', '8th', 'B', '2012-08-20',
    'FEMALE', '1083920205', '928172938482', '20204049288', '568832474643',
    'S. Apparao', '987654322033', '9502924437',
    'S. Parvathi', '876543211099', '9502924438',
    'Palakonda Road, Srikakulam', 'B+',
    '4000', '20000', '2000'
  ];

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([headers, sampleRow1, sampleRow2]);

  ws['!cols'] = [
    { wch: 14 }, // Student ID
    { wch: 22 }, // Student Name
    { wch: 12 }, // Class Name
    { wch: 12 }, // Section Name
    { wch: 14 }, // Date of Birth
    { wch: 10 }, // Gender
    { wch: 14 }, // Child ID
    { wch: 16 }, // APAAR ID
    { wch: 16 }, // PEN Number
    { wch: 16 }, // Student Aadhar
    { wch: 20 }, // Father Name
    { wch: 16 }, // Father Aadhar
    { wch: 15 }, // Father Phone
    { wch: 20 }, // Mother Name
    { wch: 16 }, // Mother Aadhar
    { wch: 15 }, // Mother Phone
    { wch: 30 }, // Address
    { wch: 12 }, // Blood Group
    { wch: 14 }, // Admission Fee
    { wch: 14 }, // Tuition Fee
    { wch: 12 }, // Books Fee
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Students_Template');
  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

  res.setHeader('Content-Disposition', 'attachment; filename=Student_Import_Template.xlsx');
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.send(buffer);
};

export const getStudentsCredentialsForExport = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const students = await prisma.student.findMany({
      include: {
        user: { select: { name: true, email: true, plainPassword: true, phone: true } },
        class: { select: { name: true, section: true } },
      },
      orderBy: [
        { class: { name: 'asc' } },
        { class: { section: 'asc' } },
        { rollNo: 'asc' },
      ],
    });

    const data = students.map((s, idx) => ({
      sNo: idx + 1,
      name: s.user.name,
      loginId: s.rollNo || s.user.email,
      password: s.user.plainPassword || 'Student2026',
      className: s.class ? `${s.class.name} ${s.class.section ? '-' + s.class.section : ''}` : 'Unassigned',
      phone: s.user.phone || 'N/A',
    }));

    successResponse(res, data, 'Students credentials fetched successfully');
  } catch (error) {
    next(error);
  }
};

const postersFilePath = path.join(__dirname, '../../uploads/birthday_posters.json');

const getPosterMap = (): Record<string, { posterUrl: string; updatedAt: string }> => {
  try {
    if (fs.existsSync(postersFilePath)) {
      const data = fs.readFileSync(postersFilePath, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error reading birthday_posters.json:', err);
  }
  return {};
};

const savePosterMap = (map: Record<string, { posterUrl: string; updatedAt: string }>) => {
  try {
    const dir = path.dirname(postersFilePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(postersFilePath, JSON.stringify(map, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing birthday_posters.json:', err);
  }
};

export const getBirthdays = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { classId, search } = req.query;

    const where: any = {
      dob: { not: null },
      user: { isActive: true },
    };
    if (classId) where.classId = String(classId);

    const students = await prisma.student.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, phone: true, photoUrl: true } },
        class: { select: { id: true, name: true, section: true } },
      },
    });

    // Indian Standard Time (Asia/Kolkata, UTC+05:30) date evaluation
    const istNow = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
    const currentMonthIST = istNow.getMonth(); // 0-indexed (0 = Jan)
    const currentDayIST = istNow.getDate();
    const currentYear = istNow.getFullYear();

    const todayBirthdays: any[] = [];
    const upcomingBirthdays: any[] = [];
    const thisMonthBirthdays: any[] = [];
    const allBirthdays: any[] = [];

    let tomorrowCount = 0;
    let upcomingWeekCount = 0;

    students.forEach((s: any) => {
      if (!s.dob) return;
      const bDate = new Date(s.dob);
      if (isNaN(bDate.getTime())) return;

      const bDateIST = new Date(bDate.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
      const bMonthIST = bDateIST.getMonth();
      const bDayIST = bDateIST.getDate();
      const bYear = bDate.getFullYear();

      const bMonthUTC = bDate.getUTCMonth();
      const bDayUTC = bDate.getUTCDate();

      // Age turning calculation
      const ageTurning = currentYear - bYear;

      const targetUserId = s.user?.id || s.userId || s.id;
      let avatarUrl = s.user?.photoUrl;
      if (avatarUrl && avatarUrl.startsWith('data:image')) {
        avatarUrl = `/api/users/${targetUserId}/photo`;
      }

      const posterInfo = getPosterMap()[s.id];
      const item = {
        id: s.id,
        rollNo: s.rollNo,
        name: s.user?.name || 'Student',
        phone: s.user?.phone || s.fatherPhone || s.motherPhone || null,
        fatherName: s.fatherName || null,
        motherName: s.motherName || null,
        fatherPhone: s.fatherPhone || null,
        motherPhone: s.motherPhone || null,
        photoUrl: avatarUrl,
        birthdayPosterUrl: posterInfo?.posterUrl || (s as any).birthdayPosterUrl || null,
        gender: s.gender || 'N/A',
        bloodGroup: s.bloodGroup || null,
        dob: s.dob,
        birthMonth: bMonthIST + 1,
        birthDay: bDayIST,
        birthYear: bYear,
        ageTurning: ageTurning > 0 ? ageTurning : 0,
        classId: s.classId,
        className: s.class ? `${s.class.name}${s.class.section ? ' - ' + s.class.section : ''}` : 'N/A',
      };

      if (search) {
        const sLower = String(search).toLowerCase();
        const nameMatch = item.name.toLowerCase().includes(sLower);
        const rollMatch = item.rollNo.toLowerCase().includes(sLower);
        if (!nameMatch && !rollMatch) return;
      }

      allBirthdays.push(item);

      // Match today's birthday in IST or UTC
      const isToday =
        (bMonthIST === currentMonthIST && bDayIST === currentDayIST) ||
        (bMonthUTC === currentMonthIST && bDayUTC === currentDayIST);

      if (isToday) {
        todayBirthdays.push(item);
      } else {
        const thisYearBirthday = new Date(currentYear, bMonthIST, bDayIST);
        let diffMs = thisYearBirthday.getTime() - istNow.getTime();
        if (diffMs < 0) {
          const nextYearBirthday = new Date(currentYear + 1, bMonthIST, bDayIST);
          diffMs = nextYearBirthday.getTime() - istNow.getTime();
        }
        const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

        if (daysLeft === 1) tomorrowCount++;
        if (daysLeft > 0 && daysLeft <= 7) upcomingWeekCount++;

        if (daysLeft > 0 && daysLeft <= 30) {
          upcomingBirthdays.push({ ...item, daysLeft });
        }

        if (bMonthIST === currentMonthIST) {
          thisMonthBirthdays.push({ ...item, day: bDayIST });
        }
      }
    });

    upcomingBirthdays.sort((a, b) => a.daysLeft - b.daysLeft);
    thisMonthBirthdays.sort((a, b) => a.day - b.day);
    allBirthdays.sort((a, b) => a.birthMonth - b.birthMonth || a.birthDay - b.birthDay);

    successResponse(res, {
      stats: {
        todayCount: todayBirthdays.length,
        tomorrowCount,
        upcomingWeekCount,
        monthCount: thisMonthBirthdays.length + todayBirthdays.length,
        totalRegistered: students.length,
      },
      today: todayBirthdays,
      upcoming: upcomingBirthdays,
      thisMonth: thisMonthBirthdays,
      all: allBirthdays,
    }, 'Birthdays fetched successfully');
  } catch (error) {
    next(error);
  }
};

export const uploadBirthdayPoster = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const studentId = req.params.id;
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: { user: { select: { name: true } }, class: true }
    });

    if (!student) {
      return next(createError('Student not found', 404));
    }

    let posterUrl = '';

    if (req.file) {
      posterUrl = `/uploads/${req.file.filename}`;
    } else if (req.body.posterBase64) {
      const base64Data = req.body.posterBase64.replace(/^data:image\/\w+;base64,/, '');
      const ext = req.body.mimeType?.includes('png') ? 'png' : 'jpg';
      const filename = `birthday-poster-${studentId}-${Date.now()}.${ext}`;
      const uploadDir = path.join(__dirname, '../../uploads');
      if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
      fs.writeFileSync(path.join(uploadDir, filename), Buffer.from(base64Data, 'base64'));
      posterUrl = `/uploads/${filename}`;
    } else if (req.body.posterUrl) {
      posterUrl = req.body.posterUrl;
    } else {
      return next(createError('No poster file or base64 image provided', 400));
    }

    // Save in file map
    const posterMap = getPosterMap();
    posterMap[studentId] = {
      posterUrl,
      updatedAt: new Date().toISOString()
    };
    savePosterMap(posterMap);

    // Save in DB if column exists or try to add it
    try {
      await prisma.$executeRawUnsafe(`ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "birthdayPosterUrl" TEXT;`);
      await prisma.$executeRawUnsafe(`UPDATE "Student" SET "birthdayPosterUrl" = $1 WHERE "id" = $2;`, posterUrl, studentId);
    } catch (dbErr) {
      console.warn('DB birthdayPosterUrl update notice:', dbErr);
    }

    successResponse(res, {
      studentId,
      studentName: student.user.name,
      posterUrl,
    }, 'Birthday poster uploaded successfully');
  } catch (error) {
    next(error);
  }
};

export const deleteBirthdayPoster = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const studentId = req.params.id;
    const posterMap = getPosterMap();
    if (posterMap[studentId]) {
      const oldUrl = posterMap[studentId].posterUrl;
      try {
        const oldFile = path.join(__dirname, '../../', oldUrl);
        if (fs.existsSync(oldFile)) fs.unlinkSync(oldFile);
      } catch {}
      delete posterMap[studentId];
      savePosterMap(posterMap);
    }

    try {
      await prisma.$executeRawUnsafe(`UPDATE "Student" SET "birthdayPosterUrl" = NULL WHERE "id" = $1;`, studentId);
    } catch {}

    successResponse(res, null, 'Birthday poster deleted successfully');
  } catch (error) {
    next(error);
  }
};

export const getTodayBirthdayPosters = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const now = new Date();
    const istTime = new Date(now.getTime() + (5.5 * 60 * 60 * 1000));
    const currentMonthIST = istTime.getUTCMonth();
    const currentDayIST = istTime.getUTCDate();
    const currentYear = istTime.getUTCFullYear();

    const students = await prisma.student.findMany({
      where: {
        dob: { not: null },
      },
      select: {
        id: true,
        rollNo: true,
        dob: true,
        user: { select: { name: true, photoUrl: true } },
        class: { select: { name: true, section: true } },
      }
    });

    const posterMap = getPosterMap();
    const activeTodayPosters: any[] = [];

    students.forEach((s) => {
      if (!s.dob) return;
      const bDate = new Date(s.dob);
      const bDateIST = new Date(bDate.getTime() + (5.5 * 60 * 60 * 1000));
      const bMonthIST = bDateIST.getUTCMonth();
      const bDayIST = bDateIST.getUTCDate();

      const bMonthUTC = bDate.getUTCMonth();
      const bDayUTC = bDate.getUTCDate();

      const isToday =
        (bMonthIST === currentMonthIST && bDayIST === currentDayIST) ||
        (bMonthUTC === currentMonthIST && bDayUTC === currentDayIST);

      if (isToday) {
        const posterInfo = posterMap[s.id];
        const posterUrl = posterInfo?.posterUrl || (s as any).birthdayPosterUrl;
        if (posterUrl) {
          const bYear = bDate.getFullYear();
          const ageTurning = currentYear - bYear;
          activeTodayPosters.push({
            studentId: s.id,
            rollNo: s.rollNo,
            studentName: s.user?.name || 'Student',
            className: s.class ? `${s.class.name}${s.class.section ? ' - ' + s.class.section : ''}` : '',
            posterUrl,
            ageTurning: ageTurning > 0 ? ageTurning : 0,
          });
        }
      }
    });

    successResponse(res, {
      hasPosters: activeTodayPosters.length > 0,
      posters: activeTodayPosters,
    }, 'Today birthday posters fetched successfully');
  } catch (error) {
    next(error);
  }
};

