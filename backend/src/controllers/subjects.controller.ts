import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth';
import { createError } from '../middlewares/errorHandler';
import { prisma } from '../utils/prisma';
import { successResponse } from '../utils/response';
import { sortClasses } from '../utils/sortClasses';
import * as XLSX from 'xlsx';

export const getAll = async (req: AuthRequest, res: Response): Promise<void> => {
  const classId = (req.query.classId as string) || '';
  const where: any = {};
  if (classId) where.classId = classId;

  const subjects = await prisma.subject.findMany({
    where,
    include: {
      class: { select: { name: true, section: true } },
      classSubjectTeachers: {
        include: { teacher: { include: { user: { select: { name: true } } } } },
      },
    },
    orderBy: { name: 'asc' },
  });
  successResponse(res, subjects, 'Subjects fetched');
};

export const create = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const { name, code, classId, teacherId } = req.body;

  if (!name || !name.trim()) {
    return next(createError('Subject name is required', 400));
  }

  const baseName = name.trim().toUpperCase();
  const baseCode = code || baseName.replace(/\s+/g, '_');

  if (classId) {
    const existing = await prisma.subject.findFirst({ where: { name: { equals: baseName, mode: 'insensitive' }, classId } });
    if (existing) {
      return next(createError('Subject already exists in this class', 409));
    }

    const subject = await prisma.subject.create({
      data: { name: baseName, code: baseCode, classId },
    });

    if (teacherId) {
      await prisma.classSubjectTeacher.create({
        data: { classId, subjectId: subject.id, teacherId },
      }).catch(() => {});
    }

    successResponse(res, subject, 'Subject created', 201);
    return;
  }

  // If no classId provided, create subject across all classes
  const allClasses = await prisma.class.findMany().then(sortClasses);
  if (allClasses.length === 0) {
    return next(createError('No classes found in the system.', 400));
  }

  const createdSubjects = [];
  let lastFoundSubject = null;

  for (const cls of allClasses) {
    const existing = await prisma.subject.findFirst({ where: { name: { equals: baseName, mode: 'insensitive' }, classId: cls.id } });
    if (!existing) {
      const subCode = `${baseCode}_${cls.id.slice(-4)}`;
      const sub = await prisma.subject.create({
        data: { name: baseName, code: subCode, classId: cls.id },
      });
      createdSubjects.push(sub);

      if (teacherId) {
        await prisma.classSubjectTeacher.create({
          data: { classId: cls.id, subjectId: sub.id, teacherId },
        }).catch(() => {});
      }
    } else {
      lastFoundSubject = existing;
    }
  }

  successResponse(
    res, 
    createdSubjects[0] || lastFoundSubject || { name: baseName }, 
    createdSubjects.length > 0 ? 'Subject created successfully across classes' : 'Subject already exists in all classes', 
    200
  );
  return;
};

export const update = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const id = req.params.id as string;
  const { name, code } = req.body;
  const newName = name ? name.trim().toUpperCase() : undefined;

  const existing = await prisma.subject.findUnique({ where: { id } });
  if (!existing) return next(createError('Subject not found', 404));

  const subject = await prisma.subject.update({ where: { id }, data: { name: newName, code } });
  successResponse(res, subject, 'Subject updated');
};

export const deleteSubject = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const id = req.params.id as string;
  const existing = await prisma.subject.findUnique({ where: { id } });
  if (!existing) return next(createError('Subject not found', 404));

  try {
    await prisma.$transaction(async (tx) => {
      await tx.classSubjectTeacher.deleteMany({ where: { subjectId: id } });
      await tx.timetable.deleteMany({ where: { subjectId: id } });
      await tx.mark.deleteMany({ where: { subjectId: id } });
      await tx.subject.delete({ where: { id } });
    });
    successResponse(res, null, 'Subject deleted successfully');
  } catch (error) {
    next(error);
  }
};

export const assignTeacher = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const { classId, subjectId, teacherId } = req.body;

  const cls = await prisma.class.findUnique({ where: { id: classId } });
  if (!cls) return next(createError('Class not found', 404));

  const subject = await prisma.subject.findUnique({ where: { id: subjectId } });
  if (!subject) return next(createError('Subject not found', 404));

  const teacher = await prisma.teacher.findUnique({ where: { id: teacherId } });
  if (!teacher) return next(createError('Teacher not found', 404));

  const assignment = await prisma.classSubjectTeacher.upsert({
    where: { classId_subjectId: { classId, subjectId } },
    update: { teacherId },
    create: { classId, subjectId, teacherId },
    include: {
      class: { select: { name: true, section: true } },
      subject: { select: { name: true, code: true } },
      teacher: { include: { user: { select: { name: true } } } },
    },
  });
  successResponse(res, assignment, 'Teacher assigned to subject');
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
        const name = row.Name || row.name || String(row.Subject || row.subject);
        const code = row.Code || row.code || '';
        const className = row.Class || row.class;
        const section = row.Section || row.section || '';

        if (!name || !code || !className) {
          failed.push({ row, reason: 'Name, Code, and Class are required' });
          continue;
        }

        const cls = await prisma.class.findFirst({ where: { name: String(className), section: String(section) } });
        if (!cls) {
          failed.push({ row, reason: `Class ${className} ${section} not found` });
          continue;
        }

        const existing = await prisma.subject.findFirst({ where: { code: String(code), classId: cls.id } });
        if (existing) {
          failed.push({ row, reason: 'Subject with this code already exists in this class' });
          continue;
        }

        // Also check by name (case-insensitive) to prevent name duplicates
        const existingByName = await prisma.subject.findFirst({
          where: { name: { equals: String(name).trim().toUpperCase(), mode: 'insensitive' }, classId: cls.id }
        });
        if (existingByName) {
          failed.push({ row, reason: 'Subject with this name already exists in this class' });
          continue;
        }

        await prisma.subject.create({
          data: { name: String(name), code: String(code), classId: cls.id },
        });
        success++;
      } catch (e: any) {
        failed.push({ row, reason: e.message });
      }
    }

    try {
      require('fs').unlinkSync(filePath);
    } catch (e) {
      console.error('Failed to delete uploaded file', e);
    }

    successResponse(res, { success, failed, total: results.length }, 'Bulk import completed');
  } catch (error) {
    next(createError('Failed to process file', 500));
  }
};
