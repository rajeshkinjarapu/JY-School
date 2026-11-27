import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth';
import { prisma } from '../utils/prisma';
import { successResponse } from '../utils/response';
import { createError } from '../middlewares/errorHandler';

const parseCanonicalUtcDate = (dateInput: string | Date): Date => {
  const ymd =
    typeof dateInput === 'string'
      ? dateInput.split('T')[0].trim()
      : dateInput.toISOString().split('T')[0];
  const m = ymd.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) {
    return new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 0, 0, 0, 0));
  }
  const d = new Date(dateInput);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));
};

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
      const m = parseInt(month as string, 10);
      const y = year ? parseInt(year as string, 10) : new Date().getUTCFullYear();
      // Include a 12-hour buffer before month start so legacy IST-shifted records on day 1 are still returned
      const start = new Date(Date.UTC(y, m - 1, 1) - 12 * 60 * 60 * 1000);
      const end = new Date(Date.UTC(y, m, 1) + 12 * 60 * 60 * 1000);
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

    const dateObj = parseCanonicalUtcDate(date);

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

    const dateObj = parseCanonicalUtcDate(date);
    const validRecords = records.filter((r: any) => r && r.teacherId && r.status);
    if (validRecords.length === 0) {
      return next(createError('No valid attendance records provided', 400));
    }

    const teacherIds = Array.from(new Set(validRecords.map((r: any) => String(r.teacherId))));
    // Also clean up any legacy IST-shifted entries on the same calendar window so duplicates don't linger
    const dayStart = new Date(dateObj.getTime() - 6 * 60 * 60 * 1000);
    const dayEnd = new Date(dateObj.getTime() + 18 * 60 * 60 * 1000);

    await prisma.$transaction(async (tx) => {
      await tx.teacherAttendance.deleteMany({
        where: {
          teacherId: { in: teacherIds },
          date: { gte: dayStart, lt: dayEnd },
        },
      });

      await tx.teacherAttendance.createMany({
        data: validRecords.map((r: any) => ({
          teacherId: String(r.teacherId),
          date: dateObj,
          status: String(r.status),
          note: r.note ? String(r.note).trim() || null : null,
          markedById: req.user!.id,
        })),
        skipDuplicates: true,
      });
    });

    const saved = await prisma.teacherAttendance.findMany({
      where: { date: dateObj, teacherId: { in: teacherIds } },
    });

    successResponse(res, saved, `Attendance marked for ${saved.length} staff members`);
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
