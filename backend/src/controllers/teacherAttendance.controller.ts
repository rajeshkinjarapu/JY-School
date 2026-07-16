import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth';
import { prisma } from '../utils/prisma';
import { successResponse } from '../utils/response';
import { createError } from '../middlewares/errorHandler';

/* ── GET all teacher attendance ── */
export const getTeacherAttendance = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { month, year, teacherId } = req.query;
    const role = req.user!.role;

    let where: any = {};

    // Teacher sees only own attendance
    if (role === 'TEACHER') {
      const teacher = await prisma.teacher.findUnique({ where: { userId: req.user!.id } });
      if (!teacher) return next(createError('Teacher not found', 404));
      where.teacherId = teacher.id;
    } else if (teacherId) {
      where.teacherId = teacherId as string;
    }

    if (month) {
      const m = parseInt(month as string);
      const y = year ? parseInt(year as string) : new Date().getFullYear();
      const start = new Date(y, m - 1, 1);
      const end = new Date(y, m, 1);
      where.date = { gte: start, lt: end };
    }

    const records = await prisma.teacherAttendance.findMany({
      where,
      orderBy: { date: 'desc' },
      include: {
        teacher: {
          include: { user: { select: { id: true, name: true, photoUrl: true, email: true } } }
        }
      },
    });

    successResponse(res, records, 'Teacher attendance fetched');
  } catch (e) { next(e); }
};

/* ── MARK / UPSERT teacher attendance (Admin marks) ── */
export const markTeacherAttendance = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { teacherId, date, status, note } = req.body;
    if (!teacherId || !date || !status) {
      return next(createError('teacherId, date, status are required', 400));
    }

    const dateObj = new Date(date);
    dateObj.setHours(0, 0, 0, 0);

    const record = await prisma.teacherAttendance.upsert({
      where: { teacherId_date: { teacherId, date: dateObj } },
      update: { status, note: note || null, markedById: req.user!.id },
      create: { teacherId, date: dateObj, status, note: note || null, markedById: req.user!.id },
      include: {
        teacher: { include: { user: { select: { name: true } } } }
      },
    });

    successResponse(res, record, 'Attendance marked');
  } catch (e) { next(e); }
};

/* ── BULK MARK teacher attendance for a date (Admin) ── */
export const bulkMarkTeacherAttendance = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { date, records } = req.body;
    // records: [{ teacherId, status, note? }]
    if (!date || !records || !Array.isArray(records)) {
      return next(createError('date and records[] are required', 400));
    }

    const dateObj = new Date(date);
    dateObj.setHours(0, 0, 0, 0);

    const ops = records.map((r: any) =>
      prisma.teacherAttendance.upsert({
        where: { teacherId_date: { teacherId: r.teacherId, date: dateObj } },
        update: { status: r.status, note: r.note || null, markedById: req.user!.id },
        create: { teacherId: r.teacherId, date: dateObj, status: r.status, note: r.note || null, markedById: req.user!.id },
      })
    );

    const results = await Promise.all(ops);
    successResponse(res, results, `Attendance marked for ${results.length} teachers`);
  } catch (e) { next(e); }
};

/* ── DELETE ── */
export const deleteTeacherAttendance = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const record = await prisma.teacherAttendance.findUnique({ where: { id: req.params.id } });
    if (!record) return next(createError('Record not found', 404));
    await prisma.teacherAttendance.delete({ where: { id: req.params.id } });
    successResponse(res, null, 'Attendance deleted');
  } catch (e) { next(e); }
};

/* ── GET summary stats for a teacher ── */
export const getTeacherAttendanceSummary = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const role = req.user!.role;
    let teacherId: string;

    if (role === 'TEACHER') {
      const teacher = await prisma.teacher.findUnique({ where: { userId: req.user!.id } });
      if (!teacher) return next(createError('Teacher not found', 404));
      teacherId = teacher.id;
    } else {
      teacherId = req.params.teacherId;
    }

    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);

    const records = await prisma.teacherAttendance.findMany({
      where: { teacherId, date: { gte: start } },
    });

    const present = records.filter(r => r.status === 'PRESENT' || r.status === 'LATE').length;
    const absent = records.filter(r => r.status === 'ABSENT').length;
    const halfDay = records.filter(r => r.status === 'HALF_DAY').length;
    const total = records.length;
    const rate = total > 0 ? Math.round((present / total) * 100) : 0;

    successResponse(res, { present, absent, halfDay, total, rate, records }, 'Summary fetched');
  } catch (e) { next(e); }
};
