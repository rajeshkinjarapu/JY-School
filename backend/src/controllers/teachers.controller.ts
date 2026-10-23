import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth';
import { createError } from '../middlewares/errorHandler';
import { prisma } from '../utils/prisma';
import { successResponse, paginatedResponse } from '../utils/response';
import { generateEmployeeId } from '../utils/helpers';
import bcrypt from 'bcryptjs';
import * as XLSX from 'xlsx';
import AdmZip from 'adm-zip';
import path from 'path';
import fs from 'fs';
import { cache } from '../utils/cache';
import { clearDashboardCache } from './dashboard.controller';
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

  const sanitizedTeachers = teachers.map(teacher => {
    let avatarUrl = teacher.user.photoUrl;
    if (avatarUrl && avatarUrl.startsWith('data:image')) {
      avatarUrl = `/api/users/${teacher.user.id}/photo`;
    }
    return {
      ...teacher,
      user: { ...teacher.user, photoUrl: avatarUrl }
    };
  });

  paginatedResponse(res, sanitizedTeachers, total, page, limit, 'Teachers fetched');
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
        const name = row.Name || row.name || row['Teacher Name'] || row['teacher_name'] || row['Full Name'];
        const phone = row.Phone || row.phone || row['Mobile No'] || row['mobile'] || row['Phone Number'] || row['phone_number'];
        const password = row.Password || row.password || phone; // Password is mobile no
        const specialization = row.Subject || row.subject || row['Specialization'] || row['specialization'] || null;
        const qualification = row.Qualification || row.qualification || row['Degree'] || null;

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
          data: { name: String(name).trim(), email: generatedEmail, password: hashedPassword, role: 'TEACHER', phone: String(phone).trim() },
        });

        await prisma.teacher.create({
          data: {
            userId: user.id,
            employeeId,
            qualification: qualification ? String(qualification).trim() : null,
            specialization: specialization ? String(specialization).trim() : null,
          },
        });
        success++;
      } catch (e: any) {
        failed.push({ row, reason: e.message });
      }
    }

    // Clean up uploaded file
    try {
      fs.unlinkSync(filePath);
    } catch (e) {
      console.error('File cleanup failed:', e);
    }

    try {
      cache.delPattern('teachers:*');
      clearDashboardCache();
    } catch (_) {}

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
    'Qualification': t.qualification || '',
  }));

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, ws, 'Teachers');
  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

  res.setHeader('Content-Disposition', 'attachment; filename=teachers.xlsx');
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.send(buffer);
};

export const bulkUploadPhotos = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  if (!req.file) return next(createError('ZIP file required', 400));
  
  try {
    const zipPath = req.file.path;
    const zip = new AdmZip(zipPath);
    const zipEntries = zip.getEntries();
    
    let success = 0;
    const failed: any[] = [];
    
    // Fetch all teachers with user details
    const teachers = await prisma.teacher.findMany({
      include: { user: true }
    });
    
    for (const zipEntry of zipEntries) {
      if (zipEntry.isDirectory) continue;
      
      const fileName = zipEntry.entryName.split('/').pop() || zipEntry.entryName;
      if (fileName.startsWith('.') || fileName.startsWith('__MACOSX')) continue; 
      
      const ext = path.extname(fileName).toLowerCase();
      if (!['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) {
        failed.push({ file: fileName, reason: 'Invalid image format' });
        continue;
      }
      
      const baseName = path.basename(fileName, ext).trim();
      const cleanBaseName = baseName.toLowerCase().replace(/[^a-z0-9]/g, '');
      
      // Match strategy:
      // 1. Match by employeeId: e.g. "SVJY-1140" or "SVJY1140" or "1140"
      // 2. Match by phone: e.g. "9949511604"
      // 3. Match by name: e.g. "SOMESH"
      let matchedTeacher = teachers.find(t => {
        if (!t.employeeId) return false;
        const empId = t.employeeId.trim().toLowerCase();
        const cleanEmpId = empId.replace(/[^a-z0-9]/g, '');
        
        if (baseName.toLowerCase() === empId || cleanBaseName === cleanEmpId) return true;
        if (cleanBaseName.includes(cleanEmpId)) return true;
        
        const digits = empId.match(/\d+/);
        if (digits && digits[0].length >= 3 && cleanBaseName.includes(digits[0])) return true;
        return false;
      });

      if (!matchedTeacher) {
        matchedTeacher = teachers.find(t => {
          if (!t.user?.phone) return false;
          const phone = t.user.phone.replace(/[^0-9]/g, '');
          return phone.length >= 10 && cleanBaseName.includes(phone);
        });
      }

      if (!matchedTeacher) {
        matchedTeacher = teachers.find(t => {
          if (!t.user?.name) return false;
          const name = t.user.name.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
          return name.length >= 3 && (cleanBaseName === name || cleanBaseName.includes(name) || name.includes(cleanBaseName));
        });
      }
      
      if (!matchedTeacher) {
        failed.push({ file: fileName, reason: `Teacher not found for "${baseName}"` });
        continue;
      }
      
      const fileBuffer = zipEntry.getData();
      const base64Str = fileBuffer.toString('base64');
      const mimeType = ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg';
      const dataUri = `data:${mimeType};base64,${base64Str}`;
      
      await prisma.user.update({
        where: { id: matchedTeacher.userId },
        data: { photoUrl: dataUri }
      });
      
      success++;
    }
    
    try {
      fs.unlinkSync(zipPath);
    } catch (_) {}
    
    try {
      cache.delPattern('teachers:*');
      clearDashboardCache();
    } catch (_) {}
    
    successResponse(res, { success, failed }, `Bulk photo upload complete. ${success} uploaded.`);
  } catch (error) {
    next(error);
  }
};

export const getTemplate = async (_req: AuthRequest, res: Response): Promise<void> => {
  const headers = ['Teacher Name', 'Mobile No', 'Subject', 'Qualification'];
  const sampleRows = [
    ['Somesh Kumar', '9949511604', 'Hindi', 'M.A., B.Ed.'],
    ['Arji Shyamala Rani', '7569964899', 'Physical Science', 'M.Sc., B.Ed.'],
    ['Tarra Varalakshmi', '8919853884', 'Mathematics', 'B.Sc., B.Ed.'],
  ];
  
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleRows]);
  ws['!cols'] = [{ wch: 22 }, { wch: 16 }, { wch: 20 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(wb, ws, 'Teachers');
  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

  res.setHeader('Content-Disposition', 'attachment; filename=Teacher_Import_Template.xlsx');
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.send(buffer);
};

