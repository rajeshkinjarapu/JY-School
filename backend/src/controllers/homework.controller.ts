import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth';
import { prisma } from '../utils/prisma';
import { successResponse } from '../utils/response';
import { createError } from '../middlewares/errorHandler';

/* ── GET all homework (teacher sees own, admin sees all, student sees class) ── */
export const getHomework = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { classId, subjectId } = req.query;
    const role = req.user!.role;
    const userId = req.user!.id;
    let where: any = {};

    if (role === 'TEACHER') {
      const teacher = await prisma.teacher.findUnique({ where: { userId } });
      if (!teacher) return next(createError('Teacher not found', 404));
      where.teacherId = teacher.id;
    } else if (role === 'STUDENT') {
      const student = await prisma.student.findUnique({ where: { userId } });
      if (!student) return next(createError('Student not found', 404));
      where.classId = student.classId || undefined;
    }

    if (classId) where.classId = classId as string;
    if (subjectId) where.subjectId = subjectId as string;

    const homework = await prisma.homework.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        class: { select: { id: true, name: true, section: true } },
        subject: { select: { id: true, name: true, code: true } },
        teacher: {
          include: { user: { select: { name: true, photoUrl: true } } }
        },
      },
    });

    successResponse(res, homework, 'Homework fetched');
  } catch (e) { next(e); }
};

/* ── GET single homework ── */
export const getHomeworkById = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const hw = await prisma.homework.findUnique({
      where: { id: req.params.id },
      include: {
        class: { select: { id: true, name: true, section: true } },
        subject: { select: { id: true, name: true, code: true } },
        teacher: { include: { user: { select: { name: true, photoUrl: true } } } },
      },
    });
    if (!hw) return next(createError('Homework not found', 404));
    successResponse(res, hw, 'Homework fetched');
  } catch (e) { next(e); }
};

/* ── CREATE homework (teacher/admin) ── */
export const createHomework = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { title, description, dueDate, classId, subjectId, attachments } = req.body;
    if (!title || !dueDate || !classId || !subjectId) {
      return next(createError('title, dueDate, classId, subjectId are required', 400));
    }

    let teacherId: string;
    if (req.user!.role === 'TEACHER') {
      const teacher = await prisma.teacher.findUnique({ where: { userId: req.user!.id } });
      if (!teacher) return next(createError('Teacher profile not found', 404));
      teacherId = teacher.id;
    } else {
      // Admin can assign on behalf of any teacher — require teacherId in body
      if (!req.body.teacherId) return next(createError('teacherId required for admin', 400));
      teacherId = req.body.teacherId;
    }

    const hw = await prisma.homework.create({
      data: {
        title,
        description,
        dueDate: new Date(dueDate),
        classId,
        subjectId,
        teacherId,
        attachments: attachments ? JSON.stringify(attachments) : null,
      },
      include: {
        class: { select: { id: true, name: true, section: true } },
        subject: { select: { id: true, name: true } },
      },
    });

    successResponse(res, hw, 'Homework created', 201);
  } catch (e) { next(e); }
};

/* ── UPDATE homework ── */
export const updateHomework = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { title, description, dueDate, status, attachments } = req.body;
    const hw = await prisma.homework.findUnique({ where: { id: req.params.id } });
    if (!hw) return next(createError('Homework not found', 404));

    // Teacher can only update own homework
    if (req.user!.role === 'TEACHER') {
      const teacher = await prisma.teacher.findUnique({ where: { userId: req.user!.id } });
      if (!teacher || hw.teacherId !== teacher.id) {
        return next(createError('Not authorized to update this homework', 403));
      }
    }

    const updated = await prisma.homework.update({
      where: { id: req.params.id },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(dueDate && { dueDate: new Date(dueDate) }),
        ...(status && { status }),
        ...(attachments !== undefined && { attachments: JSON.stringify(attachments) }),
      },
    });
    successResponse(res, updated, 'Homework updated');
  } catch (e) { next(e); }
};

/* ── DELETE homework ── */
export const deleteHomework = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const hw = await prisma.homework.findUnique({ where: { id: req.params.id } });
    if (!hw) return next(createError('Homework not found', 404));

    if (req.user!.role === 'TEACHER') {
      const teacher = await prisma.teacher.findUnique({ where: { userId: req.user!.id } });
      if (!teacher || hw.teacherId !== teacher.id) {
        return next(createError('Not authorized to delete this homework', 403));
      }
    }

    await prisma.homework.delete({ where: { id: req.params.id } });
    successResponse(res, null, 'Homework deleted');
  } catch (e) { next(e); }
};
