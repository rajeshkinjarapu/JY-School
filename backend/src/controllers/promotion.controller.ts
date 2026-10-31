import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth';
import { createError } from '../middlewares/errorHandler';
import { prisma } from '../utils/prisma';
import { cache } from '../utils/cache';
import { successResponse } from '../utils/response';
import { sortClasses } from '../utils/sortClasses';
import { v4 as uuidv4 } from 'uuid';

let hasCheckedTable = false;
export const ensurePromotionTableExists = async () => {
  if (hasCheckedTable) return;
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "StudentPromotionHistory" (
        "id" TEXT PRIMARY KEY,
        "studentId" TEXT NOT NULL,
        "fromClassId" TEXT,
        "fromClassName" TEXT,
        "fromAcademicYear" TEXT NOT NULL,
        "toClassId" TEXT,
        "toClassName" TEXT,
        "toAcademicYear" TEXT NOT NULL,
        "action" TEXT NOT NULL DEFAULT 'PROMOTE',
        "remarks" TEXT,
        "promotedById" TEXT,
        "promotedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "StudentPromotionHistory_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE
      );
      CREATE INDEX IF NOT EXISTS "StudentPromotionHistory_studentId_idx" ON "StudentPromotionHistory"("studentId");
      CREATE INDEX IF NOT EXISTS "StudentPromotionHistory_fromAcademicYear_idx" ON "StudentPromotionHistory"("fromAcademicYear");
      CREATE INDEX IF NOT EXISTS "StudentPromotionHistory_toAcademicYear_idx" ON "StudentPromotionHistory"("toAcademicYear");
    `);
    hasCheckedTable = true;
  } catch (err) {
    console.error('Error ensuring StudentPromotionHistory table exists:', err);
  }
};

/**
 * 1. Get all distinct academic years in system with activeYear auto-detection
 */
export const getAcademicYears = async (req: AuthRequest, res: Response, next: NextFunction): Promise<any> => {
  try {
    await ensurePromotionTableExists();

    const classesWithCounts = await prisma.class.findMany({
      select: {
        academicYear: true,
        _count: { select: { students: true } }
      }
    });

    const yearsSet = new Set<string>();
    const yearStudentCount: Record<string, number> = {};

    classesWithCounts.forEach(c => {
      const yr = (c.academicYear || '').trim();
      if (yr) {
        yearsSet.add(yr);
        yearStudentCount[yr] = (yearStudentCount[yr] || 0) + (c._count?.students || 0);
      }
    });

    // Provide default standard academic years if not present
    ['2024-2025', '2025-2026', '2026-2027', '2027-2028', '2028-2029'].forEach(y => yearsSet.add(y));

    const sortedYears = Array.from(yearsSet).sort().reverse();

    // Determine the year with the highest student enrollment (active year)
    let activeYear = '2024-2025';
    let maxCount = -1;
    for (const yr of sortedYears) {
      const count = yearStudentCount[yr] || 0;
      if (count > maxCount && count > 0) {
        maxCount = count;
        activeYear = yr;
      }
    }
    if (maxCount <= 0) {
      activeYear = sortedYears.includes('2024-2025') ? '2024-2025' : (sortedYears[0] || '2024-2025');
    }

    // Determine the next year in progression
    const parts = activeYear.split('-');
    let nextYear = '';
    if (parts.length === 2 && !isNaN(Number(parts[0])) && !isNaN(Number(parts[1]))) {
      nextYear = `${Number(parts[0]) + 1}-${Number(parts[1]) + 1}`;
    } else {
      nextYear = '2025-2026';
    }

    return successResponse(
      res,
      {
        years: sortedYears,
        activeYear,
        nextYear: sortedYears.includes(nextYear) ? nextYear : (sortedYears[0] || nextYear)
      },
      'Academic years fetched successfully'
    );
  } catch (error) {
    return next(error);
  }
};

/**
 * 2. Get classes filtered by academic year with student counts
 */
export const getClassesByYear = async (req: AuthRequest, res: Response, next: NextFunction): Promise<any> => {
  try {
    const academicYear = (req.query.academicYear as string) || '';
    const where: any = {};
    if (academicYear) {
      where.academicYear = academicYear;
    }

    const classes = await prisma.class.findMany({
      where,
      include: {
        _count: { select: { students: true } },
        classTeacher: { include: { user: { select: { name: true, phone: true } } } },
        subjects: { select: { id: true, name: true, code: true } }
      }
    });

    const sorted = sortClasses(classes);
    return successResponse(res, sorted, 'Classes fetched successfully');
  } catch (error) {
    return next(error);
  }
};

/**
 * 3. Get students belonging to a class for promotion review
 */
export const getStudentsForPromotion = async (req: AuthRequest, res: Response, next: NextFunction): Promise<any> => {
  try {
    const classId = req.query.classId as string;
    if (!classId) {
      return next(createError('classId is required', 400));
    }

    const students = await prisma.student.findMany({
      where: { classId },
      include: {
        user: { select: { id: true, name: true, phone: true, photoUrl: true, isActive: true } },
        class: { select: { id: true, name: true, section: true, academicYear: true } },
        marks: {
          take: 6,
          orderBy: { createdAt: 'desc' },
          select: {
            marksObtained: true,
            maxMarks: true,
            grade: true,
            subject: { select: { name: true } }
          }
        }
      },
      orderBy: { rollNo: 'asc' }
    });

    // Compute average percentage for each student if marks are available
    const enrichedStudents = students.map(s => {
      let avgPercentage: number | null = null;
      if (s.marks && s.marks.length > 0) {
        const totalObtained = s.marks.reduce((acc, m) => acc + (m.marksObtained || 0), 0);
        const totalMax = s.marks.reduce((acc, m) => acc + (m.maxMarks || 100), 0);
        if (totalMax > 0) {
          avgPercentage = Math.round((totalObtained / totalMax) * 100);
        }
      }

      return {
        id: s.id,
        userId: s.userId,
        name: s.user?.name || 'Unknown',
        rollNo: s.rollNo,
        phone: s.user?.phone,
        photoUrl: s.user?.photoUrl,
        isActive: s.user?.isActive ?? true,
        currentClass: s.class ? `${s.class.name} - ${s.class.section}` : 'Unassigned',
        currentAcademicYear: s.class?.academicYear || '',
        recentMarksCount: s.marks?.length || 0,
        averagePercentage: avgPercentage,
        defaultAction: 'PROMOTE'
      };
    });

    return successResponse(res, enrichedStudents, 'Students fetched for promotion');
  } catch (error) {
    return next(error);
  }
};

/**
 * 4. Execute bulk promotion / transition in an atomic transaction
 */
export const executeBulkPromotion = async (req: AuthRequest, res: Response, next: NextFunction): Promise<any> => {
  try {
    await ensurePromotionTableExists();

    const { fromAcademicYear, toAcademicYear, promotions } = req.body;

    if (!fromAcademicYear || !toAcademicYear) {
      return next(createError('fromAcademicYear and toAcademicYear are required', 400));
    }

    if (!Array.isArray(promotions) || promotions.length === 0) {
      return next(createError('No student promotion items provided', 400));
    }

    const currentUserId = req.user?.id;

    const result = await prisma.$transaction(async (tx) => {
      const auditRecords: any[] = [];
      let promotedCount = 0;
      let detainedCount = 0;
      let graduatedCount = 0;
      let tcCount = 0;

      for (const item of promotions) {
        const { studentId, action, targetClassId, remarks } = item;
        if (!studentId || !action) continue;

        // Fetch current student details
        const student = await tx.student.findUnique({
          where: { id: studentId },
          include: { class: true, user: true }
        });

        if (!student) continue;

        let targetClass: any = null;
        if (targetClassId) {
          targetClass = await tx.class.findUnique({ where: { id: targetClassId } });
        }

        if (action === 'PROMOTE') {
          if (!targetClassId) {
            throw new Error(`Target class must be specified for promoting student ${student.user?.name}`);
          }
          await tx.student.update({
            where: { id: studentId },
            data: { classId: targetClassId }
          });
          promotedCount++;
        } else if (action === 'DETAIN') {
          // Detain keeps the student in the target class (same grade in new year)
          if (targetClassId) {
            await tx.student.update({
              where: { id: studentId },
              data: { classId: targetClassId }
            });
          }
          detainedCount++;
        } else if (action === 'GRADUATE') {
          // Passed out (Alumni)
          await tx.student.update({
            where: { id: studentId },
            data: { classId: null }
          });
          graduatedCount++;
        } else if (action === 'TC_LEAVE') {
          // Student left school
          await tx.student.update({
            where: { id: studentId },
            data: { classId: null }
          });
          if (student.userId) {
            await tx.user.update({
              where: { id: student.userId },
              data: { isActive: false }
            });
          }
          tcCount++;
        }

        // Create permanent audit trail record
        auditRecords.push({
          id: uuidv4(),
          studentId,
          fromClassId: student.classId,
          fromClassName: student.class ? `${student.class.name} - ${student.class.section}` : null,
          fromAcademicYear,
          toClassId: targetClass?.id || null,
          toClassName: targetClass ? `${targetClass.name} - ${targetClass.section}` : null,
          toAcademicYear,
          action,
          remarks: remarks || null,
          promotedById: currentUserId
        });
      }

      // Batch insert promotion history
      if (auditRecords.length > 0) {
        await tx.studentPromotionHistory.createMany({
          data: auditRecords
        });
      }

      return {
        total: auditRecords.length,
        promotedCount,
        detainedCount,
        graduatedCount,
        tcCount
      };
    });

    // Clear students & classes caches
    try {
      await cache.delPattern('*');
    } catch {}

    return successResponse(res, result, `Successfully processed ${result.total} students promotion!`);
  } catch (error) {
    return next(error);
  }
};

/**
 * 5. Clone classes & subjects from an existing year to a new academic year
 */
export const cloneClasses = async (req: AuthRequest, res: Response, next: NextFunction): Promise<any> => {
  try {
    const { fromAcademicYear, toAcademicYear } = req.body;

    if (!fromAcademicYear || !toAcademicYear) {
      return next(createError('fromAcademicYear and toAcademicYear are required', 400));
    }

    if (fromAcademicYear === toAcademicYear) {
      return next(createError('Source and target academic years cannot be the same', 400));
    }

    const sourceClasses = await prisma.class.findMany({
      where: { academicYear: fromAcademicYear },
      include: { subjects: true }
    });

    if (sourceClasses.length === 0) {
      return next(createError(`No classes found in source year ${fromAcademicYear}`, 404));
    }

    let createdCount = 0;
    let existingCount = 0;

    for (const sc of sourceClasses) {
      const existing = await prisma.class.findFirst({
        where: {
          name: sc.name,
          section: sc.section,
          academicYear: toAcademicYear
        }
      });

      if (existing) {
        existingCount++;
        continue;
      }

      // Create new class
      const newClass = await prisma.class.create({
        data: {
          name: sc.name,
          section: sc.section,
          academicYear: toAcademicYear,
          capacity: sc.capacity,
          classTeacherId: sc.classTeacherId
        }
      });

      // Clone subjects if any
      if (sc.subjects && sc.subjects.length > 0) {
        await prisma.subject.createMany({
          data: sc.subjects.map(s => ({
            name: s.name,
            code: s.code,
            classId: newClass.id
          }))
        });
      }

      createdCount++;
    }

    try {
      await cache.delPattern('*');
    } catch {}

    return successResponse(res, { createdCount, existingCount }, `Created ${createdCount} classes for ${toAcademicYear}`);
  } catch (error) {
    return next(error);
  }
};

/**
 * 6. Get promotion history / audit logs
 */
export const getPromotionHistory = async (req: AuthRequest, res: Response, next: NextFunction): Promise<any> => {
  try {
    await ensurePromotionTableExists();

    const studentId = req.query.studentId as string;
    const academicYear = req.query.academicYear as string;
    const limit = parseInt(req.query.limit as string) || 50;

    const where: any = {};
    if (studentId) where.studentId = studentId;
    if (academicYear) {
      where.OR = [
        { fromAcademicYear: academicYear },
        { toAcademicYear: academicYear }
      ];
    }

    const history = await prisma.studentPromotionHistory.findMany({
      where,
      include: {
        student: {
          include: {
            user: { select: { name: true, phone: true, photoUrl: true } }
          }
        }
      },
      orderBy: { promotedAt: 'desc' },
      take: limit
    });

    return successResponse(res, history, 'Promotion history fetched successfully');
  } catch (error) {
    return next(error);
  }
};
