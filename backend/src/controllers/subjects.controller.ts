import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth';
import { createError } from '../middlewares/errorHandler';
import { prisma } from '../utils/prisma';
import { successResponse } from '../utils/response';

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
  const { name, code, classId } = req.body;

  const existing = await prisma.subject.findFirst({ where: { code, classId } });
  if (existing) return next(createError('Subject with this code already exists in the class', 409));

  const subject = await prisma.subject.create({
    data: { name, code, classId },
  });
  successResponse(res, subject, 'Subject created', 201);
};

export const update = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const id = req.params.id as string;
  const { name, code } = req.body;

  const existing = await prisma.subject.findUnique({ where: { id } });
  if (!existing) return next(createError('Subject not found', 404));

  const subject = await prisma.subject.update({ where: { id }, data: { name, code } });
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
