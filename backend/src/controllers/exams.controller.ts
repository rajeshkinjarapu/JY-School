import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth';
import { createError } from '../middlewares/errorHandler';
import { prisma } from '../utils/prisma';
import { successResponse } from '../utils/response';
import { calculateGrade } from '../utils/helpers';
import { sortClasses } from '../utils/sortClasses';
import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';

export const getAll = async (req: AuthRequest, res: Response): Promise<void> => {
  const classId = (req.query.classId as string) || '';
  const term = (req.query.term as string) || '';

  const where: any = {};
  if (classId) {
    where.classes = {
      some: { id: classId }
    };
  }
  if (term) where.term = term;

  const exams = await prisma.exam.findMany({
    where,
    select: {
      id: true,
      name: true,
      term: true,
      examDate: true,
      maxMarks: true,
      passingMarks: true,
      admitCardPublished: true,
      frozenClasses: true,
      subjects: true,
      createdAt: true,
      classes: { select: { id: true, name: true, section: true } },
      _count: { select: { marks: true } },
      // admitCardSettings is EXCLUDED from list - it contains heavy Base64 images
      // It is included only in getById for individual exam editing
    },
    orderBy: { examDate: 'desc' },
  });

  const sortedExams = exams.map(e => ({
    ...e,
    classes: sortClasses(e.classes || [])
  }));

  successResponse(res, sortedExams, 'Exams fetched');
};

export const getById = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const id = req.params.id as string;
  const exam = await prisma.exam.findUnique({
    where: { id },
    include: {
      classes: { select: { id: true, name: true, section: true } },
      marks: {
        include: {
          student: { include: { user: { select: { name: true } } } },
          subject: { select: { name: true } },
        },
      },
    },
  });
  if (!exam) return next(createError('Exam not found', 404));

  if (exam.classes) {
    exam.classes = sortClasses(exam.classes);
  }

  successResponse(res, exam, 'Exam fetched');
};


// ──────────────────────────────────────────────────────────────────────────────
// PERMANENT FIX: Normalize exam subjects to use REAL database subject IDs.
// This prevents FK constraint violations during marks submission forever.
// ──────────────────────────────────────────────────────────────────────────────
const normalizeSubjectsToRealIds = async (subjects: any): Promise<any> => {
  if (!subjects) return subjects;
  
  const subjectsObj = typeof subjects === 'string' ? JSON.parse(subjects) : subjects;
  
  if (!subjectsObj.classConfigs || !Array.isArray(subjectsObj.classConfigs)) return subjectsObj;
  
  const normalizedConfigs = await Promise.all(
    subjectsObj.classConfigs.map(async (cfg: any) => {
      const classId = cfg.classId;
      if (!classId || !Array.isArray(cfg.subjects)) return cfg;
      
      const normalizedSubjects = await Promise.all(
        cfg.subjects.map(async (sub: any) => {
          if (!sub.name) return sub;
          const subName = sub.name.trim();
          
          // Find or create real DB subject for this class
          let realSubject = await prisma.subject.findFirst({
            where: { classId, name: { equals: subName, mode: 'insensitive' } }
          });
          
          if (!realSubject) {
            realSubject = await prisma.subject.create({
              data: {
                name: subName,
                code: subName.substring(0, 3).toUpperCase(),
                classId,
              }
            });
          }
          
          // Return subject with REAL database ID
          return { ...sub, id: realSubject.id, name: realSubject.name };
        })
      );
      
      return { ...cfg, subjects: normalizedSubjects };
    })
  );
  
  // Also normalize globalSubjects if present
  let normalizedGlobal = subjectsObj.globalSubjects;
  // (globalSubjects don't have classId, so we skip auto-create for them)
  
  return { ...subjectsObj, classConfigs: normalizedConfigs, globalSubjects: normalizedGlobal };
};

export const create = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, classIds, term, examDate, maxMarks, passingMarks, subjects } = req.body;

    if (!classIds || !Array.isArray(classIds) || classIds.length === 0) {
      return next(createError('Please provide at least one class', 400));
    }

    const uniqueClassIds = [...new Set(classIds)];

    const classes = await prisma.class.findMany({ where: { id: { in: uniqueClassIds } } });
    if (classes.length !== uniqueClassIds.length) {
      return next(createError('One or more classes not found', 404));
    }

    // PERMANENT FIX: Normalize subjects to use real DB IDs before saving
    const normalizedSubjects = subjects ? await normalizeSubjectsToRealIds(subjects) : (subjects || []);

    // Create a single exam and link it to all selected classes
    const exam = await prisma.exam.create({
      data: {
        name,
        term: term || '',
        examDate: new Date(examDate),
        maxMarks: maxMarks || 100,
        passingMarks: passingMarks || 40,
        subjects: normalizedSubjects,
        classes: {
          connect: uniqueClassIds.map(id => ({ id }))
        }
      },
      include: {
        classes: true
      }
    });

    successResponse(res, [exam], 'Exam created', 201);
  } catch (error: any) {
    console.error("EXAM CREATE ERROR:", error);
    next(error);
  }
};


export const update = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const id = req.params.id as string;
  const { name, term, examDate, maxMarks, passingMarks, subjects, classIds } = req.body;

  const existing = await prisma.exam.findUnique({ where: { id } });
  if (!existing) return next(createError('Exam not found', 404));

  // PERMANENT FIX: Normalize subjects to use real DB IDs before saving
  let finalSubjects = subjects !== undefined ? subjects : existing.subjects;
  if (subjects !== undefined && subjects) {
    try {
      finalSubjects = await normalizeSubjectsToRealIds(subjects);
    } catch (e) {
      finalSubjects = subjects;
    }
  }

  const data: any = {
    name, term,
    examDate: examDate ? new Date(examDate) : undefined,
    maxMarks, passingMarks,
    subjects: finalSubjects,
  };

  if (classIds && Array.isArray(classIds)) {
    data.classes = {
      set: classIds.map((cid: string) => ({ id: cid }))
    };
  }

  const exam = await prisma.exam.update({
    where: { id },
    data,
    include: { classes: true }
  });
  successResponse(res, exam, 'Exam updated');
};

export const deleteExam = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const id = req.params.id as string;
  const existing = await prisma.exam.findUnique({ where: { id } });
  if (!existing) return next(createError('Exam not found', 404));
  await prisma.exam.delete({ where: { id } });
  successResponse(res, null, 'Exam deleted');
};

export const getSubjectsForClassHelper = (subjectsConfig: any, classId?: string): any[] => {
  if (!subjectsConfig) return [];
  let subjectsArray = subjectsConfig;
  if (typeof subjectsConfig === 'object' && !Array.isArray(subjectsConfig)) {
    if (subjectsConfig.classConfigs && Array.isArray(subjectsConfig.classConfigs)) {
      subjectsArray = subjectsConfig.classConfigs;
    } else if (classId && Array.isArray(subjectsConfig[classId])) {
      return subjectsConfig[classId];
    } else {
      subjectsArray = Object.values(subjectsConfig).flat();
    }
  }

  if (Array.isArray(subjectsArray)) {
    if (subjectsArray.length > 0 && (subjectsArray[0]?.classId || subjectsArray[0]?.className) && Array.isArray(subjectsArray[0]?.subjects)) {
      if (classId) {
        const found = subjectsArray.find((c: any) => c.classId === classId);
        if (found) return found.subjects;
      }
      const mergedMap = new Map<string, any>();
      subjectsArray.forEach((c: any) => {
        (c.subjects || []).forEach((s: any) => {
          if (s && s.name && !mergedMap.has(s.name.toUpperCase().trim())) {
            mergedMap.set(s.name.toUpperCase().trim(), s);
          }
        });
      });
      return Array.from(mergedMap.values());
    }
    return subjectsArray;
  }

  return [];
};

export const getResults = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const id = req.params.id as string;
  const classId = req.query.classId as string;
  // includePhoto=true is ONLY for ProgressCard. Results list doesn't need photos (saves 16MB per request)
  const includePhoto = req.query.includePhoto === 'true';

  const photoSelect = includePhoto
    ? { name: true, photoUrl: true, phone: true }
    : { name: true, phone: true };

  const exam = await prisma.exam.findUnique({
    where: { id },
    include: {
      marks: {
        where: classId ? { student: { classId } } : undefined,
        include: {
          student: { include: { user: { select: photoSelect }, class: { select: { name: true, section: true, academicYear: true } } } },
          subject: { select: { name: true, code: true } },
        },
      },
    },
  }) as any;
  if (!exam) return next(createError('Exam not found', 404));

  // Group marks by student
  const studentMap = new Map<string, { studentId: string; classId: string; name: string; photo?: string | null; rollNo: string; className: string; academicYear: string; mobile: string; fatherName?: string; marks: any[]; total: number; percentage: number; grade: string }>();
  
  if (classId) {
    const classStudents = await prisma.student.findMany({
      where: { classId },
      include: { user: { select: photoSelect }, class: { select: { name: true, section: true, academicYear: true } } },
      orderBy: { rollNo: 'asc' }
    });
    for (const s of classStudents) {
      studentMap.set(s.id, {
        studentId: s.id,
        classId: s.classId,
        name: s.user.name,
        photo: includePhoto ? (s.user as any).photoUrl : null,
        mobile: (s as any).fatherMobile || (s as any).motherMobile || s.user.phone || '-',
        rollNo: s.rollNo || '-',
        className: s.class ? `${s.class.name} - ${s.class.section}` : '',
        academicYear: (s.class as any)?.academicYear || '',
        marks: [],
        total: 0,
        percentage: 0,
        grade: '',
      });
    }
  }

  const rawSubjects = getSubjectsForClassHelper(exam.subjects, classId as string);
  const subjectOrderMap = new Map<string, number>();
  const subjectMaxMap = new Map<string, number>();
  rawSubjects.forEach((sub: any, index: number) => {
    if (sub && sub.name) {
      const key = sub.name.toUpperCase().trim();
      subjectOrderMap.set(key, index);
      subjectMaxMap.set(key, Number(sub.maxMarks) || 100);
    }
  });

  // Sort marks by createdAt so newer marks overwrite older marks (in case of duplicates)
  const sortedMarks = [...exam.marks].sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  for (const mark of sortedMarks) {
    const key = mark.studentId;
    if (!studentMap.has(key)) {
      studentMap.set(key, {
        studentId: key,
        classId: mark.student.classId || (classId as string),
        name: mark.student.user.name,
        photo: includePhoto ? mark.student.user.photoUrl : null,
        mobile: mark.student.fatherMobile || mark.student.motherMobile || mark.student.user.phone || '-',
        fatherName: mark.student.fatherName || '-',
        rollNo: mark.student.rollNo,
        className: mark.student.class ? `${mark.student.class.name} - ${mark.student.class.section}` : '',
        academicYear: (mark.student.class as any)?.academicYear || '',
        marks: [],
        total: 0,
        percentage: 0,
        grade: '',
      });
    }
    const entry = studentMap.get(key)!;
    const existingMarkIndex = entry.marks.findIndex(m => m.subject.trim().toUpperCase() === mark.subject.name.trim().toUpperCase());
    
    const subKey = mark.subject.name.toUpperCase().trim();
    const studentClassId = mark.student.classId || (classId as string);
    const studentClassSubjects = getSubjectsForClassHelper(exam.subjects, studentClassId);

    let actualMax = 50;
    // 1. Primary ground truth: maxMarks stored directly on the Mark record itself
    if (mark.maxMarks && Number(mark.maxMarks) > 0 && Number(mark.maxMarks) <= 200) {
      actualMax = Number(mark.maxMarks);
    } else {
      // 2. Secondary fallback: classSpecific subjects config or exam subjects
      const foundSub = studentClassSubjects.find((s: any) => s.name?.toUpperCase().trim() === subKey);
      if (foundSub && Number(foundSub.maxMarks) > 0) {
        actualMax = Number(foundSub.maxMarks);
      } else if (subjectMaxMap.has(subKey) && subjectMaxMap.get(subKey)! > 0) {
        actualMax = subjectMaxMap.get(subKey)!;
      } else {
        actualMax = 50;
      }
    }
    if (actualMax <= 0) actualMax = 50;

    if (existingMarkIndex !== -1) {
      entry.total = entry.total - entry.marks[existingMarkIndex].obtained + mark.marksObtained;
      entry.marks[existingMarkIndex] = { subject: mark.subject.name, obtained: mark.marksObtained, max: actualMax, grade: mark.grade, remarks: mark.remarks };
    } else {
      entry.marks.push({ subject: mark.subject.name, obtained: mark.marksObtained, max: actualMax, grade: mark.grade, remarks: mark.remarks });
      entry.total += mark.marksObtained;
    }
  }

  const results = Array.from(studentMap.values()).map((s) => {
    // Populate missing subjects with AB if they have no marks entered for them
    const studentClassSubjects = getSubjectsForClassHelper(exam.subjects, s.classId || (classId as string));
    if (studentClassSubjects && studentClassSubjects.length > 0) {
      studentClassSubjects.forEach((sub: any) => {
        const subName = sub.name?.trim();
        if (subName && !s.marks.find(m => m.subject.toUpperCase() === subName.toUpperCase())) {
           s.marks.push({
              subject: subName,
              obtained: 0,
              max: Number(sub.maxMarks) || 50,
              grade: 'F',
              remarks: 'AB'
           });
        }
      });
    }

    s.marks.sort((a, b) => {
      const weightA = subjectOrderMap.has(a.subject.toUpperCase().trim()) ? subjectOrderMap.get(a.subject.toUpperCase().trim())! : 999;
      const weightB = subjectOrderMap.has(b.subject.toUpperCase().trim()) ? subjectOrderMap.get(b.subject.toUpperCase().trim())! : 999;
      if (weightA !== weightB) return weightA - weightB;
      return a.subject.localeCompare(b.subject);
    });
    
    // Sum total max marks for only the subjects this student actually has in mark sheet
    const totalMax = s.marks.reduce((sum, m) => sum + (m.max > 0 ? m.max : 50), 0);
    const rawPercentage = totalMax > 0 ? (s.total / totalMax) * 100 : 0;
    const percentage = Math.min(100, parseFloat(rawPercentage.toFixed(2)));
    return { ...s, percentage, grade: calculateGrade(s.total, totalMax) };
  });

  // Sort by total desc and add rank
  results.sort((a, b) => b.total - a.total);
  const ranked = results.map((r, i) => ({ ...r, rank: i + 1 }));

  successResponse(res, ranked, 'Exam results fetched');
};

export const updateAdmitCardSettings = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { admitCardPublished, admitCardSettings } = req.body;

    const exam = await prisma.exam.findUnique({ where: { id } });
    if (!exam) {
      return next(createError('Exam not found', 404));
    }

    const updatedExam = await prisma.exam.update({
      where: { id },
      data: {
        admitCardPublished: admitCardPublished !== undefined ? admitCardPublished : exam.admitCardPublished,
        admitCardSettings: admitCardSettings !== undefined ? admitCardSettings : exam.admitCardSettings,
      },
    });

    successResponse(res, updatedExam, 'Admit card settings updated successfully');
  } catch (error) {
    next(error);
  }
};

export const publishResults = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { published } = req.body;

    const exam = await prisma.exam.findUnique({ where: { id } });
    if (!exam) {
      return next(createError('Exam not found', 404));
    }

    const currentSettings = (exam.admitCardSettings as any) || {};
    currentSettings.progressCardPublished = !!published;

    const updatedExam = await prisma.exam.update({
      where: { id },
      data: {
        admitCardSettings: currentSettings,
      },
    });

    successResponse(res, updatedExam, 'Results published status updated successfully');
  } catch (error) {
    next(error);
  }
};

export const toggleFreezeClass = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { classId, isFrozen } = req.body;

    const exam = await prisma.exam.findUnique({ where: { id } });
    if (!exam) {
      return next(createError('Exam not found', 404));
    }

    let frozenClasses: string[] = [];
    if (exam.frozenClasses) {
      try {
        if (typeof exam.frozenClasses === 'string') {
          frozenClasses = JSON.parse(exam.frozenClasses as string);
        } else if (Array.isArray(exam.frozenClasses)) {
          frozenClasses = exam.frozenClasses as string[];
        }
      } catch (e) {
        frozenClasses = [];
      }
    }

    if (isFrozen) {
      if (!frozenClasses.includes(classId)) {
        frozenClasses.push(classId);
      }
    } else {
      frozenClasses = frozenClasses.filter(c => c !== classId);
    }

    const updatedExam = await prisma.exam.update({
      where: { id },
      data: {
        frozenClasses,
      },
    });

    successResponse(res, { frozen: isFrozen }, `Results ${isFrozen ? 'frozen' : 'unfrozen'} successfully`);
  } catch (error) {
    next(error);
  }
};

export const sendMarksSMS = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id, classId } = req.params;

    // Fetch exam
    const exam = await prisma.exam.findUnique({
      where: { id },
      include: { classes: true }
    });

    if (!exam) return next(createError('Exam not found', 404));

    const { studentId } = req.body;

    // Fetch class to get class name
    const classData = await prisma.class.findUnique({ where: { id: classId } });
    if (!classData) return next(createError('Class not found', 404));

    const fullClassName = `${classData.name}-${classData.section}`;

    // Fetch students of this class
    const whereClause: any = { classId };
    if (studentId) {
      whereClause.id = studentId;
    }
    const students = await prisma.student.findMany({
      where: whereClause,
      include: { user: true }
    });

    if (students.length === 0) return next(createError('No students found', 400));

    // Fetch all marks for this class & exam (or individual student)
    const marks = await prisma.mark.findMany({
      where: {
        examId: id,
        studentId: { in: students.map(s => s.id) }
      },
      include: { subject: true }
    });

    const dltTemplateId = '1707175316314375479';
    let sentCount = 0;
    let failedCount = 0;

    // We will dynamically import the sendSMS function
    const { sendSMS } = await import('../utils/sms');

    for (const student of students) {
      const parentMobile = (student as any).fatherMobile || (student as any).motherMobile || student.user?.phone;
      if (!parentMobile) {
        failedCount++;
        continue;
      }

      const studentMarks = marks.filter(m => m.studentId === student.id);
      
      let mathScore = 'A';
      let phyScore = 'A';
      let chemScore = 'A';
      let totalScore = 0;

      studentMarks.forEach(m => {
        const subName = m.subject.name.toLowerCase();
        const isAbsent = m.remarks?.toLowerCase().includes('absent');
        const score = isAbsent ? 'A' : m.marksObtained.toString();

        if (subName.includes('math')) mathScore = score;
        else if (subName.includes('phy')) phyScore = score;
        else if (subName.includes('chem')) chemScore = score;

        if (!isAbsent) totalScore += m.marksObtained;
      });

      // DLT Template: Dear parent Your child {#var#} Class {#var#} JEE MAINS SCORE MATHS: {#var#} PHYSICS : {#var#} CHEMISTRY: {#var#} TOTAL: {#var#} Thanking you SVJY SCHOOL
      const message = `Dear parent Your child ${student.user.name} Class ${fullClassName} JEE MAINS SCORE MATHS: ${mathScore} PHYSICS : ${phyScore} CHEMISTRY: ${chemScore} TOTAL: ${totalScore} Thanking you SVJY SCHOOL`;

      const success = await sendSMS(parentMobile, message, dltTemplateId);
      if (success) {
        sentCount++;
      } else {
        failedCount++;
      }
    }

    successResponse(res, { sent: sentCount, failed: failedCount }, `SMS sending complete. Sent: ${sentCount}, Failed: ${failedCount}`);
  } catch (error: any) {
    console.error("SEND MARKS SMS ERROR:", error);
    next(error);
  }
};

export const getAllStatus = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Run all 4 heavy DB queries IN PARALLEL for maximum speed
    const [exams, allSubjects, marksGrouped, students] = await Promise.all([
      prisma.exam.findMany({
        select: {
          id: true,
          name: true,
          term: true,
          examDate: true,
          subjects: true,
          frozenClasses: true,
          // admitCardSettings intentionally excluded — heavy Base64 images not needed for status
          classes: { select: { id: true, name: true, section: true } },
        },
        orderBy: { examDate: 'desc' },
      }),
      prisma.subject.findMany({ select: { id: true, name: true, classId: true } }),
      prisma.mark.groupBy({ by: ['examId', 'studentId', 'subjectId'] }),
      prisma.student.findMany({ select: { id: true, classId: true } }),
    ]);

    const classSubjectsMap: Record<string, { id: string, name: string }[]> = {};
    for (const sub of allSubjects) {
      if (!classSubjectsMap[sub.classId]) classSubjectsMap[sub.classId] = [];
      classSubjectsMap[sub.classId].push({ id: sub.id, name: sub.name });
    }

    const studentClassMap = new Map(students.map(s => [s.id, s.classId]));

    const examClassEnteredSubjects: Record<string, Record<string, Set<string>>> = {};
    for (const m of marksGrouped) {
       const classId = studentClassMap.get(m.studentId);
       if (classId) {
         if (!examClassEnteredSubjects[m.examId]) examClassEnteredSubjects[m.examId] = {};
         if (!examClassEnteredSubjects[m.examId][classId]) examClassEnteredSubjects[m.examId][classId] = new Set();
         examClassEnteredSubjects[m.examId][classId].add(m.subjectId);
       }
    }

    const result = exams.map(exam => {
       let examAllowedSubjects: any[] | null = null;
       if (exam.subjects) {
         try {
           examAllowedSubjects = typeof exam.subjects === 'string' ? JSON.parse(exam.subjects) : exam.subjects;
         } catch (e) {}
       }

       const enhancedClasses = (exam.classes || []).map((cls) => {
         let classSubjects = classSubjectsMap[cls.id] || [];

         // Deduplicate by subject name (keep first occurrence) to avoid duplicate rows
         const seenNames = new Set<string>();
         classSubjects = classSubjects.filter(s => {
           const key = s.name?.trim().toUpperCase() ?? '';
           if (!key || seenNames.has(key)) return false;
           seenNames.add(key);
           return true;
         });
         
          let targetSubjectsArray: any[] = [];
          const examSubjectsAny: any = examAllowedSubjects;
          
          if (examSubjectsAny) {
            if (Array.isArray(examSubjectsAny)) {
              targetSubjectsArray = examSubjectsAny;
            } else if (typeof examSubjectsAny === 'object') {
              if (examSubjectsAny.classConfigs && Array.isArray(examSubjectsAny.classConfigs)) {
                const match = examSubjectsAny.classConfigs.find((c: any) => c.classId === cls.id);
                if (match && Array.isArray(match.subjects)) {
                  targetSubjectsArray = match.subjects;
                }
              } else if (Array.isArray(examSubjectsAny.globalSubjects)) {
                targetSubjectsArray = examSubjectsAny.globalSubjects;
              }
            }
          }

          if (targetSubjectsArray.length > 0) {
            const allowedNames = targetSubjectsArray.map((s: any) => s.name?.trim().toUpperCase()).filter(Boolean);
            classSubjects = classSubjects.filter(s => allowedNames.includes(s.name?.trim().toUpperCase()));
          } else if (examSubjectsAny && typeof examSubjectsAny === 'object' && examSubjectsAny.classConfigs) {
            // If classConfigs is used but this class has no subjects configured, it should have 0 subjects.
            classSubjects = [];
          }

         const rawEnteredIds = examClassEnteredSubjects[exam.id]?.[cls.id] || new Set<string>();
         
         // Build a set of normalized names for the entered subjects
         const enteredSubjectNames = new Set<string>();
         for (const sId of rawEnteredIds) {
           const sub = classSubjectsMap[cls.id]?.find(s => s.id === sId);
           if (sub && sub.name) {
             enteredSubjectNames.add(sub.name.trim().toUpperCase());
           }
         }
         
         const enteredSubjects = classSubjects.filter(s => enteredSubjectNames.has(s.name?.trim().toUpperCase()));
         const pendingSubjects = classSubjects.filter(s => !enteredSubjectNames.has(s.name?.trim().toUpperCase()));
         
         const totalSubjects = classSubjects.length;
         const enteredCount = enteredSubjects.length;
         const progress = totalSubjects > 0 ? (enteredCount / totalSubjects) * 100 : (enteredCount > 0 ? 100 : 0);

         return {
           ...cls,
           subjectStats: {
             totalSubjects: classSubjects,
             enteredSubjects,
             pendingSubjects,
             progress,
           }
         };
       });

       return {
         ...exam,
         classes: enhancedClasses,
         classesWithMarks: enhancedClasses.filter((c) => c.subjectStats.enteredSubjects.length > 0).map((c) => c.id)
       };
    });

    successResponse(res, result, 'Exam status fetched');
  } catch (error) {
    next(error);
  }
};

export const scanOmr = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.file) {
      return next(createError('No image uploaded', 400));
    }

    const { examId, answerKey: reqAnswerKey } = req.body;
    if (!examId) {
      return next(createError('Exam ID is required', 400));
    }

    // Fetch the answer key from request if available, otherwise mock
    const answerKey = reqAnswerKey ? (typeof reqAnswerKey === 'string' ? reqAnswerKey : JSON.stringify(reqAnswerKey)) : JSON.stringify({ "1": "A", "2": "B" });

    const imagePath = req.file.path;
    const scriptPath = path.resolve(__dirname, '../../scripts/omr_scanner.py');

    // Make sure we have a Python runner, fallback to python3
    const pythonCmd = process.platform === 'win32' ? 'python' : 'python3';

    exec(`${pythonCmd} "${scriptPath}" "${imagePath}" '${answerKey}'`, (error, stdout, stderr) => {
      // Clean up the uploaded image immediately
      fs.unlink(imagePath, (err) => { if (err) console.error("Error deleting temp OMR image:", err); });

      if (error) {
        console.error("OMR Python Error:", stderr || error.message);
        return next(createError('Failed to process OMR sheet', 500));
      }

      try {
        const result = JSON.parse(stdout.trim());
        if (result.error) {
           return next(createError(result.error, 400));
        }

        // Ideally, we'd lookup the student by ID here.
        successResponse(res, result, 'OMR Scan completed');
      } catch (e) {
        console.error("OMR Parse Error:", stdout);
        next(createError('Invalid output from OMR scanner', 500));
      }
    });

  } catch (error) {
    next(error);
  }
};
