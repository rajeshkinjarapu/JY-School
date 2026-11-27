import { Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import { AuthRequest } from '../middlewares/auth';
import { prisma } from '../utils/prisma';
import { successResponse } from '../utils/response';
import { createError } from '../middlewares/errorHandler';

let submissionTableEnsured = false;

const HOMEWORK_DDL_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS "HomeworkSubmission" (
    "id" TEXT PRIMARY KEY,
    "homeworkId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "studentNote" TEXT,
    "attachmentUrl" TEXT,
    "teacherRemark" TEXT,
    "checkedById" TEXT,
    "submittedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "HomeworkSubmission_homeworkId_studentId_key" ON "HomeworkSubmission"("homeworkId", "studentId")`,
];

const ensureSubmissionTable = async () => {
  if (submissionTableEnsured) return;
  let allOk = true;
  for (const sql of HOMEWORK_DDL_STATEMENTS) {
    try {
      await prisma.$executeRawUnsafe(sql);
    } catch (err: any) {
      allOk = false;
      console.warn('Notice ensuring HomeworkSubmission DDL:', err?.message);
    }
  }
  if (allOk) submissionTableEnsured = true;
};

const parseAttachments = (raw?: string | null): { title: string; url: string }[] => {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed
        .map((item: any) =>
          typeof item === 'string'
            ? { title: 'Attachment Link', url: item }
            : { title: String(item?.title || 'Resource Link'), url: String(item?.url || '') }
        )
        .filter(a => a.url.trim().length > 0);
    }
  } catch {}
  return [];
};

/* ── GET all homework (teacher sees own, admin sees all, student sees class) ── */
export const getHomework = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    await ensureSubmissionTable();
    const { classId, subjectId } = req.query;
    const role = req.user!.role;
    const userId = req.user!.id;
    const where: any = {};
    let currentStudentId: string | null = null;

    if (role === 'TEACHER') {
      const teacher = await prisma.teacher.findUnique({ where: { userId } });
      if (!teacher) return next(createError('Teacher not found', 404));
      where.teacherId = teacher.id;
    } else if (role === 'STUDENT') {
      const student = await prisma.student.findUnique({ where: { userId } });
      if (!student) return next(createError('Student not found', 404));
      currentStudentId = student.id;
      where.classId = student.classId || undefined;
    }

    if (classId) where.classId = classId as string;
    if (subjectId) where.subjectId = subjectId as string;

    const homework = await prisma.homework.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        class: {
          select: {
            id: true,
            name: true,
            section: true,
            _count: { select: { students: true } },
          },
        },
        subject: { select: { id: true, name: true, code: true } },
        teacher: {
          include: { user: { select: { name: true, photoUrl: true } } },
        },
      },
    });

    // Aggregate completion counts from HomeworkSubmission safely
    const hwIds = homework.map(h => h.id);
    const submissionsByHw: Record<string, { completed: number; submitted: number; rework: number; mine?: any }> = {};

    if (hwIds.length > 0) {
      try {
        const subRows = await prisma.$queryRaw<
          { homeworkId: string; studentId: string; status: string; studentNote: string | null; attachmentUrl: string | null; teacherRemark: string | null }[]
        >`
          SELECT "homeworkId", "studentId", "status", "studentNote", "attachmentUrl", "teacherRemark"
          FROM "HomeworkSubmission"
        `;
        const idSet = new Set(hwIds);
        for (const r of subRows) {
          if (!idSet.has(r.homeworkId)) continue;
          if (!submissionsByHw[r.homeworkId]) {
            submissionsByHw[r.homeworkId] = { completed: 0, submitted: 0, rework: 0 };
          }
          const st = (r.status || '').toUpperCase();
          if (st === 'COMPLETED' || st === 'CHECKED') submissionsByHw[r.homeworkId].completed += 1;
          else if (st === 'SUBMITTED') submissionsByHw[r.homeworkId].submitted += 1;
          else if (st === 'REWORK') submissionsByHw[r.homeworkId].rework += 1;

          if (currentStudentId && r.studentId === currentStudentId) {
            submissionsByHw[r.homeworkId].mine = r;
          }
        }
      } catch (err: any) {
        console.warn('Notice querying HomeworkSubmission counts:', err?.message);
      }
    }

    const enriched = homework.map(hw => {
      const totalStudents = hw.class?._count?.students || 0;
      const stats = submissionsByHw[hw.id] || { completed: 0, submitted: 0, rework: 0 };
      const doneCount = stats.completed + stats.submitted;
      return {
        ...hw,
        attachmentList: parseAttachments(hw.attachments),
        submissionStats: {
          totalStudents,
          completedCount: stats.completed,
          submittedCount: stats.submitted,
          reworkCount: stats.rework,
          doneCount,
          pendingCount: Math.max(0, totalStudents - doneCount),
          completionPct: totalStudents > 0 ? Math.min(100, Math.round((doneCount / totalStudents) * 100)) : 0,
        },
        mySubmission: stats.mine || null,
      };
    });

    successResponse(res, enriched, 'Homework fetched');
  } catch (e) {
    next(e);
  }
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
    successResponse(res, { ...hw, attachmentList: parseAttachments(hw.attachments) }, 'Homework fetched');
  } catch (e) {
    next(e);
  }
};

/* ── GET roster & submissions for a specific homework ── */
export const getHomeworkSubmissions = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    await ensureSubmissionTable();
    const hw = await prisma.homework.findUnique({
      where: { id: req.params.id },
      include: {
        class: { select: { id: true, name: true, section: true } },
        subject: { select: { id: true, name: true, code: true } },
      },
    });
    if (!hw) return next(createError('Homework not found', 404));

    const classStudents = await prisma.student.findMany({
      where: { classId: hw.classId },
      orderBy: { rollNo: 'asc' },
      include: { user: { select: { name: true, photoUrl: true, phone: true } } },
    });

    const rows = await prisma.$queryRaw<
      {
        studentId: string;
        status: string;
        studentNote: string | null;
        attachmentUrl: string | null;
        teacherRemark: string | null;
        submittedAt: Date | null;
        updatedAt: Date;
      }[]
    >`
      SELECT "studentId", "status", "studentNote", "attachmentUrl", "teacherRemark", "submittedAt", "updatedAt"
      FROM "HomeworkSubmission"
      WHERE "homeworkId" = ${hw.id}
    `;

    const subMap = new Map(rows.map(r => [r.studentId, r]));

    const roster = classStudents.map(st => {
      const sub = subMap.get(st.id);
      return {
        studentId: st.id,
        rollNo: st.rollNo,
        name: st.user?.name || 'Student',
        photoUrl: st.user?.photoUrl || null,
        phone: st.fatherPhone || st.user?.phone || null,
        status: sub?.status || 'PENDING',
        studentNote: sub?.studentNote || '',
        attachmentUrl: sub?.attachmentUrl || '',
        teacherRemark: sub?.teacherRemark || '',
        submittedAt: sub?.submittedAt || null,
        updatedAt: sub?.updatedAt || null,
      };
    });

    successResponse(res, { homework: hw, students: roster }, 'Submissions fetched');
  } catch (e) {
    next(e);
  }
};

/* ── UPSERT student submission / teacher checkoff ── */
export const upsertHomeworkSubmission = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    await ensureSubmissionTable();
    const homeworkId = req.params.id;
    const hw = await prisma.homework.findUnique({ where: { id: homeworkId } });
    if (!hw) return next(createError('Homework not found', 404));

    const role = req.user!.role;
    const userId = req.user!.id;

    if (role === 'STUDENT') {
      const student = await prisma.student.findUnique({ where: { userId } });
      if (!student) return next(createError('Student profile not found', 404));
      const { status, studentNote, attachmentUrl } = req.body;
      const safeStatus = status === 'PENDING' ? 'PENDING' : 'SUBMITTED';

      await prisma.$executeRaw`
        INSERT INTO "HomeworkSubmission" ("id", "homeworkId", "studentId", "status", "studentNote", "attachmentUrl", "submittedAt", "updatedAt")
        VALUES (${randomUUID()}, ${homeworkId}, ${student.id}, ${safeStatus}, ${studentNote || null}, ${attachmentUrl || null}, NOW(), NOW())
        ON CONFLICT ("homeworkId", "studentId") DO UPDATE SET
          "status" = EXCLUDED."status",
          "studentNote" = EXCLUDED."studentNote",
          "attachmentUrl" = EXCLUDED."attachmentUrl",
          "submittedAt" = COALESCE("HomeworkSubmission"."submittedAt", NOW()),
          "updatedAt" = NOW()
      `;

      successResponse(res, { studentId: student.id, status: safeStatus }, 'Homework submission updated');
      return;
    }

    // Teacher / Admin single or bulk update
    const { studentId, studentIds, status, teacherRemark } = req.body;
    const validStatuses = ['PENDING', 'SUBMITTED', 'COMPLETED', 'REWORK'];
    const targetStatus = validStatuses.includes(String(status || '').toUpperCase())
      ? String(status).toUpperCase()
      : 'COMPLETED';

    const targets: string[] = Array.isArray(studentIds) && studentIds.length > 0
      ? studentIds
      : studentId
      ? [studentId]
      : [];

    if (targets.length === 0) {
      return next(createError('studentId or studentIds is required', 400));
    }

    for (const sId of targets) {
      await prisma.$executeRaw`
        INSERT INTO "HomeworkSubmission" ("id", "homeworkId", "studentId", "status", "teacherRemark", "checkedById", "submittedAt", "updatedAt")
        VALUES (${randomUUID()}, ${homeworkId}, ${sId}, ${targetStatus}, ${teacherRemark || null}, ${userId}, NOW(), NOW())
        ON CONFLICT ("homeworkId", "studentId") DO UPDATE SET
          "status" = EXCLUDED."status",
          "teacherRemark" = COALESCE(EXCLUDED."teacherRemark", "HomeworkSubmission"."teacherRemark"),
          "checkedById" = EXCLUDED."checkedById",
          "updatedAt" = NOW()
      `;
    }

    successResponse(res, { count: targets.length, status: targetStatus }, 'Submission status saved');
  } catch (e) {
    next(e);
  }
};

/* ── CREATE homework (teacher/admin) ── */
export const createHomework = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { title, description, dueDate, classId, subjectId, attachments, status, notifyStudents = true } = req.body;
    if (!title || !dueDate || !classId || !subjectId) {
      return next(createError('title, dueDate, classId, subjectId are required', 400));
    }

    let teacherId: string;
    if (req.user!.role === 'TEACHER') {
      const teacher = await prisma.teacher.findUnique({ where: { userId: req.user!.id } });
      if (!teacher) return next(createError('Teacher profile not found', 404));
      teacherId = teacher.id;
    } else {
      if (req.body.teacherId) {
        teacherId = req.body.teacherId;
      } else {
        const cst = await prisma.classSubjectTeacher.findFirst({
          where: { classId, subjectId },
        });
        if (cst) {
          teacherId = cst.teacherId;
        } else {
          const anyTeacher = await prisma.teacher.findFirst();
          if (!anyTeacher) return next(createError('No teacher found in school to assign homework', 400));
          teacherId = anyTeacher.id;
        }
      }
    }

    const hw = await prisma.homework.create({
      data: {
        title,
        description,
        dueDate: new Date(dueDate),
        classId,
        subjectId,
        teacherId,
        status: status === 'CLOSED' ? 'CLOSED' : 'ACTIVE',
        attachments: attachments ? (typeof attachments === 'string' ? attachments : JSON.stringify(attachments)) : null,
      },
      include: {
        class: { select: { id: true, name: true, section: true } },
        subject: { select: { id: true, name: true } },
      },
    });

    // Notify all students in this class if requested
    if (notifyStudents !== false) {
      try {
        const classStudents = await prisma.student.findMany({
          where: { classId },
          select: { userId: true },
        });
        const { createSystemNotification } = await import('./notifications.controller');
        for (const s of classStudents) {
          if (s.userId) {
            createSystemNotification({
              userId: s.userId,
              title: `New Homework: ${hw.subject?.name || 'Assignment'}`,
              message: `${title} (Due: ${new Date(dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })})`,
              type: 'HOMEWORK',
              link: '/homework',
            });
          }
        }
      } catch (err) {
        console.error('Failed to dispatch homework notifications:', err);
      }
    }

    // Also notify Admins
    try {
      const { createSystemNotification } = await import('./notifications.controller');
      const author = req.user?.name || 'A Teacher';
      const className = hw.class ? `${hw.class.name}-${hw.class.section}` : 'a class';
      const subjectName = hw.subject?.name || 'a subject';
      const adminMsg = `${author} assigned homework "${title}" to ${className} for ${subjectName} (Due: ${new Date(dueDate).toLocaleDateString()}).`;

      createSystemNotification({
        role: 'ADMIN',
        title: 'New Homework Assigned',
        message: adminMsg,
        type: 'HOMEWORK',
        link: '/homework',
      });
      createSystemNotification({
        role: 'SUPER_ADMIN',
        title: 'New Homework Assigned',
        message: adminMsg,
        type: 'HOMEWORK',
        link: '/homework',
      });
    } catch {}

    successResponse(res, { ...hw, attachmentList: parseAttachments(hw.attachments) }, 'Homework created', 201);
  } catch (e) {
    next(e);
  }
};

/* ── UPDATE homework ── */
export const updateHomework = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { title, description, dueDate, status, attachments } = req.body;
    const hw = await prisma.homework.findUnique({ where: { id: req.params.id } });
    if (!hw) return next(createError('Homework not found', 404));

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
        ...(attachments !== undefined && {
          attachments: typeof attachments === 'string' ? attachments : JSON.stringify(attachments),
        }),
      },
    });
    successResponse(res, { ...updated, attachmentList: parseAttachments(updated.attachments) }, 'Homework updated');
  } catch (e) {
    next(e);
  }
};

/* ── DELETE homework ── */
export const deleteHomework = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    await ensureSubmissionTable();
    const hw = await prisma.homework.findUnique({ where: { id: req.params.id } });
    if (!hw) return next(createError('Homework not found', 404));

    if (req.user!.role === 'TEACHER') {
      const teacher = await prisma.teacher.findUnique({ where: { userId: req.user!.id } });
      if (!teacher || hw.teacherId !== teacher.id) {
        return next(createError('Not authorized to delete this homework', 403));
      }
    }

    await prisma.$executeRaw`DELETE FROM "HomeworkSubmission" WHERE "homeworkId" = ${req.params.id}`.catch(() => {});
    await prisma.homework.delete({ where: { id: req.params.id } });
    successResponse(res, null, 'Homework deleted');
  } catch (e) {
    next(e);
  }
};
