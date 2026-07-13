import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth';
import { createError } from '../middlewares/errorHandler';
import { prisma } from '../utils/prisma';
import { successResponse } from '../utils/response';

const DAYS_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const checkConflict = async (
  teacherId: string,
  classId: string,
  day: string,
  periodNumber: number,
  excludeId?: string
): Promise<string | null> => {
  // Check teacher conflict on same day & period
  const teacherConflict = await prisma.timetable.findFirst({
    where: {
      teacherId,
      day,
      periodNumber,
      id: excludeId ? { not: excludeId } : undefined,
    },
  });
  if (teacherConflict) return 'Teacher has a conflicting slot at this period';

  // Check class conflict on same day & period
  const classConflict = await prisma.timetable.findFirst({
    where: {
      classId,
      day,
      periodNumber,
      id: excludeId ? { not: excludeId } : undefined,
    },
  });
  if (classConflict) return 'Class already has a slot at this period';

  return null;
};

export const getByClass = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const { classId } = req.query as { classId: string };
  if (!classId) return next(createError('classId is required', 400));

  const slots = await prisma.timetable.findMany({
    where: { classId },
    include: {
      subject: { select: { name: true, code: true } },
      teacher: { include: { user: { select: { name: true } } } },
    },
    orderBy: [{ day: 'asc' }, { periodNumber: 'asc' }],
  });

  // Organize by day
  const organized: Record<string, any[]> = {};
  for (const day of DAYS_ORDER) organized[day] = [];
  for (const slot of slots) {
    if (!organized[slot.day]) organized[slot.day] = [];
    organized[slot.day].push(slot);
  }

  successResponse(res, organized, 'Timetable fetched');
};

export const getByTeacher = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const teacherId = (req.params.teacherId as string) || (await prisma.teacher.findFirst({ where: { userId: req.user!.id } }))?.id;
  if (!teacherId) return next(createError('Teacher not found', 404));

  const slots = await prisma.timetable.findMany({
    where: { teacherId },
    include: {
      class: { select: { name: true, section: true } },
      subject: { select: { name: true, code: true } },
    },
    orderBy: [{ day: 'asc' }, { periodNumber: 'asc' }],
  });

  const organized: Record<string, any[]> = {};
  for (const day of DAYS_ORDER) organized[day] = [];
  for (const slot of slots) {
    if (!organized[slot.day]) organized[slot.day] = [];
    organized[slot.day].push(slot);
  }

  successResponse(res, organized, 'Teacher timetable fetched');
};

export const createSlot = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const { classId, subjectId, teacherId, day, periodNumber, startTime, endTime, room } = req.body;

  if (!periodNumber) return next(createError('periodNumber is required', 400));

  const conflict = await checkConflict(teacherId, classId, day, periodNumber);
  if (conflict) return next(createError(conflict, 409));

  const slot = await prisma.timetable.create({
    data: { classId, subjectId, teacherId, day, periodNumber: parseInt(periodNumber), startTime: startTime || '', endTime: endTime || '', room },
    include: {
      class: { select: { name: true, section: true } },
      subject: { select: { name: true } },
      teacher: { include: { user: { select: { name: true } } } },
    },
  });
  successResponse(res, slot, 'Timetable slot created', 201);
};

export const updateSlot = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const id = req.params.id as string;
  const { classId, subjectId, teacherId, day, periodNumber, startTime, endTime, room } = req.body;

  const existing = await prisma.timetable.findUnique({ where: { id } });
  if (!existing) return next(createError('Slot not found', 404));

  const conflict = await checkConflict(
    teacherId || existing.teacherId,
    classId || existing.classId,
    day || existing.day,
    periodNumber || existing.periodNumber,
    id
  );
  if (conflict) return next(createError(conflict, 409));

  const slot = await prisma.timetable.update({
    where: { id },
    data: {
      classId, subjectId, teacherId, day,
      periodNumber: periodNumber ? parseInt(periodNumber) : undefined,
      startTime, endTime, room,
    },
    include: {
      class: { select: { name: true, section: true } },
      subject: { select: { name: true } },
      teacher: { include: { user: { select: { name: true } } } },
    },
  });
  successResponse(res, slot, 'Timetable slot updated');
};

export const deleteSlot = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const id = req.params.id as string;
  const existing = await prisma.timetable.findUnique({ where: { id } });
  if (!existing) return next(createError('Slot not found', 404));
  await prisma.timetable.delete({ where: { id } });
  successResponse(res, null, 'Slot deleted');
};

export const generateAuto = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const { clearExisting } = req.body as { clearExisting?: boolean };

  try {
    const classes = await prisma.class.findMany();
    const configs = await prisma.timetableConfig.findMany();
    const mappings = await prisma.classSubjectTeacher.findMany({
      include: {
        subject: true,
        teacher: { include: { user: { select: { name: true } } } }
      }
    });

    if (clearExisting) {
      await prisma.timetable.deleteMany({});
    }

    const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const createdSlots: any[] = [];
    const bookedTeachers = new Set<string>();
    const bookedClasses = new Set<string>();

    if (!clearExisting) {
      const existing = await prisma.timetable.findMany();
      for (const slot of existing) {
        bookedTeachers.add(`${slot.teacherId}_${slot.day}_${slot.periodNumber}`);
        bookedClasses.add(`${slot.classId}_${slot.day}_${slot.periodNumber}`);
      }
    }

    const getClassCategory = (name: string): string => {
      const n = name.toLowerCase();
      const num = parseInt(n.replace(/\D/g, ''));
      if (!isNaN(num) && num <= 5) return 'PRIMARY';
      return 'HIGHER';
    };

    for (const day of DAYS) {
      for (const cls of classes) {
        const category = getClassCategory(cls.name);
        const classPeriods = configs.filter(c => c.category === category && !c.isBreak)
                                    .sort((a, b) => a.periodNumber - b.periodNumber);

        const classMappings = mappings.filter(m => m.classId === cls.id);
        if (classMappings.length === 0) continue;

        let mappingIdx = 0;

        for (const period of classPeriods) {
          const classKey = `${cls.id}_${day}_${period.periodNumber}`;
          if (bookedClasses.has(classKey)) continue;

          let attempts = 0;
          let assigned = false;

          while (attempts < classMappings.length) {
            const currentMapping = classMappings[(mappingIdx + attempts) % classMappings.length];
            const teacherKey = `${currentMapping.teacherId}_${day}_${period.periodNumber}`;

            if (!bookedTeachers.has(teacherKey)) {
              bookedTeachers.add(teacherKey);
              bookedClasses.add(classKey);

              createdSlots.push({
                classId: cls.id,
                subjectId: currentMapping.subjectId,
                teacherId: currentMapping.teacherId,
                day,
                periodNumber: period.periodNumber,
                startTime: period.startTime,
                endTime: period.endTime,
                room: `Room ${cls.name}`
              });

              mappingIdx = (mappingIdx + attempts + 1) % classMappings.length;
              assigned = true;
              break;
            }
            attempts++;
          }
        }
      }
    }

    if (createdSlots.length > 0) {
      await prisma.timetable.createMany({
        data: createdSlots
      });
    }

    successResponse(res, { count: createdSlots.length }, 'Timetable generated automatically with success');
  } catch (err: any) {
    next(err);
  }
};
