import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth';
import { createError } from '../middlewares/errorHandler';
import { prisma } from '../utils/prisma';
import { successResponse } from '../utils/response';
import { calculateGrade } from '../utils/helpers';
import { createSystemNotification } from './notifications.controller';
import { areSubjectsMatching, getCanonicalSubjectName } from './exams.controller';
import PDFDocument from 'pdfkit';

export const getByStudent = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const studentId = req.params.studentId as string;
  const student = await prisma.student.findUnique({ where: { id: studentId } });
  if (!student) return next(createError('Student not found', 404));

  const marks = await prisma.mark.findMany({
    where: { studentId },
    include: { exam: { select: { name: true, term: true, examDate: true } }, subject: { select: { name: true, code: true } } },
    orderBy: { createdAt: 'desc' },
  });

  // Group by exam
  const grouped = (marks as any[]).reduce((acc: any, m) => {
    const examId = m.examId;
    if (!acc[examId]) acc[examId] = { exam: m.exam, marks: [] };
    acc[examId].marks.push(m);
    return acc;
  }, {});

  successResponse(res, Object.values(grouped), 'Marks fetched');
};

export const getByExam = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const examId = req.params.examId as string;
  const classId = req.query.classId as string | undefined;

  const whereClause: any = { examId };
  if (classId) {
    whereClause.student = { classId };
  }

  const marks = await prisma.mark.findMany({
    where: whereClause,
    include: {
      student: {
        select: {
          id: true,
          classId: true,
          rollNo: true,
          user: { select: { name: true } }
        }
      },
      subject: { select: { name: true, code: true } },
    },
    orderBy: { createdAt: 'asc' },
  });
  successResponse(res, marks, 'Exam marks fetched');
};

export const bulkCreate = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { marks } = req.body as {
      marks: { studentId: string; examId: string; subjectId: string; marksObtained: number; maxMarks: number; remarks?: string }[];
    };
    if (!marks?.length) return next(createError('marks array is required', 400));

    // Get the exam to read the JSON subjects
    const examId = marks[0]?.examId;
    if (!examId) return next(createError('Exam ID is required', 400));

    const exam = await prisma.exam.findUnique({ 
      where: { id: examId },
      include: { examPlans: true }
    });
    const examSubjects: any[] = Array.isArray(exam?.subjects) ? exam.subjects : [];

    // Pre-fetch all students to get their classIds
    const studentIds = [...new Set(marks.map(m => m.studentId))];
    const students = await prisma.student.findMany({ where: { id: { in: studentIds } }, select: { id: true, classId: true } });
    const studentClassMap = new Map(students.map(s => [s.id, s.classId]));

    // Pre-fetch all real subjects for those classes
    const classIds = [...new Set(students.map(s => s.classId))];
    
    let frozenClasses: string[] = [];
    if (exam?.frozenClasses) {
      if (typeof exam.frozenClasses === 'string') {
        frozenClasses = JSON.parse(exam.frozenClasses);
      } else if (Array.isArray(exam.frozenClasses)) {
        frozenClasses = exam.frozenClasses as string[];
      }
    }

    const frozenClassIdsBeingModified = classIds.filter(cId => cId && frozenClasses.includes(cId));
    if (frozenClassIdsBeingModified.length > 0) {
      return next(createError('Marks for one or more classes have been frozen. Cannot update.', 403));
    }

    let realSubjects = await prisma.subject.findMany({ where: { classId: { in: classIds as string[] } } });

    const getSubjectsForClass = (subjectsConfig: any, classId?: string): any[] => {
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

    const upsertOps: any[] = [];
    const deleteOps: any[] = [];
    
    for (const m of marks as any[]) {
      // ── SUBJECT ID RESOLUTION (4-level fallback chain) ──────────────────────
      let realSubjectId = m.subjectId;
      let resolvedFakeName: string | null = null;
      let resolvedMaxMarks: number | null = null;
      const classId = studentClassMap.get(m.studentId);
      
      // Level 1: Check if sent subjectId is ALREADY a valid real DB subject ID
      const directMatch = realSubjects.find(s => s.id === m.subjectId && s.classId === classId);
      
      if (directMatch) {
        realSubjectId = directMatch.id;
        resolvedFakeName = directMatch.name;
      } else {
        // Level 2: Try to find subject via exam's classConfigs by ID or name
        const classExamSubjects = getSubjectsForClass(exam?.subjects, classId);
        const fakeSubject = classExamSubjects.find((s: any) => 
          String(s.id) === String(m.subjectId) || 
          s.name?.toLowerCase()?.trim() === m.subjectId?.toLowerCase()?.trim()
        );
        
        if (fakeSubject) {
          resolvedFakeName = fakeSubject.name?.trim() || null;
          resolvedMaxMarks = fakeSubject.maxMarks ? Number(fakeSubject.maxMarks) : null;
          
          // Level 3: Find real DB subject by name in same class (smart alias matching)
          const canonicalFakeName = getCanonicalSubjectName(resolvedFakeName || '');
          const matchingReal = realSubjects.find(
            s => s.classId === classId && (areSubjectsMatching(s.name, canonicalFakeName) || getCanonicalSubjectName(s.name) === canonicalFakeName)
          );
          
          if (matchingReal) {
            realSubjectId = matchingReal.id;
          } else if (classId && canonicalFakeName) {
             // Check if an alias already exists in this class in DB before creating duplicate
             const allClassSubs = await prisma.subject.findMany({ where: { classId } });
             const foundAlias = allClassSubs.find(s => areSubjectsMatching(s.name, canonicalFakeName) || getCanonicalSubjectName(s.name) === canonicalFakeName);

             if (foundAlias) {
               realSubjectId = foundAlias.id;
               realSubjects.push(foundAlias);
             } else {
               // AUTO-CREATE SUBJECT: Strictly use canonical name (e.g. MATHEMATICS, TELUGU)
               const newSubject = await prisma.subject.create({
                 data: {
                   name: canonicalFakeName,
                   code: canonicalFakeName.substring(0, 3).toUpperCase(),
                   classId: classId
                 }
               });
               realSubjects.push(newSubject);
               realSubjectId = newSubject.id;
             }
          }
        } else {
          // Level 4b: sent ID not in exam subjects — check if it exists in any class
          const anyMatch = realSubjects.find(s => s.id === m.subjectId);
          if (anyMatch && classId) {
            const canonicalAnyName = getCanonicalSubjectName(anyMatch.name);
            const sameNameSameClass = realSubjects.find(
              s => s.classId === classId && (areSubjectsMatching(s.name, canonicalAnyName) || getCanonicalSubjectName(s.name) === canonicalAnyName)
            );
            if (sameNameSameClass) {
              realSubjectId = sameNameSameClass.id;
              resolvedFakeName = sameNameSameClass.name;
            } else {
              const newSubject = await prisma.subject.create({
                data: {
                  name: canonicalAnyName,
                  code: canonicalAnyName.substring(0, 3).toUpperCase(),
                  classId: classId
                }
              });
              realSubjects.push(newSubject);
              realSubjectId = newSubject.id;
            }
          }
        }
      }
      // ────────────────────────────────────────────────────────────────────────

      // Handle deletion
      if (m.isDeleted) {
        deleteOps.push(prisma.mark.deleteMany({
           where: { studentId: m.studentId, examId: m.examId, subjectId: realSubjectId }
        }));
        continue;
      }

      // Handle 'AB' (Absent) logic
      let finalMarksObtained = m.marksObtained;
      let finalRemarks = m.remarks;
      if (m.remarks === 'AB' || m.marksObtained === -1) {
          finalMarksObtained = 0;
          finalRemarks = 'AB';
      }

      // Enforce actual max marks for this specific subject
      let actualMaxMarks = 100;
      if (m.maxMarks && Number(m.maxMarks) > 0 && Number(m.maxMarks) <= 1000) {
        actualMaxMarks = Number(m.maxMarks);
      } else if (resolvedMaxMarks && resolvedMaxMarks > 0) {
        actualMaxMarks = resolvedMaxMarks;
      } else if (exam?.examPlans && exam.examPlans.length > 0) {
        const plan = exam.examPlans.find((p: any) => p.subjectId === realSubjectId);
        if (plan && Number(plan.maxMarks) > 0) {
          actualMaxMarks = Number(plan.maxMarks);
        }
      }
      if (actualMaxMarks <= 0) actualMaxMarks = 100;

      // Validate max marks
      if (finalMarksObtained > actualMaxMarks && finalRemarks !== 'AB') {
         return next(createError(`Marks obtained (${finalMarksObtained}) cannot exceed max marks (${actualMaxMarks}) for this subject.`, 400));
      }

      const grade = finalRemarks === 'AB' ? 'F' : calculateGrade(finalMarksObtained, actualMaxMarks);
      
      // Cleanup ghost duplicates (marks for the same student, exam, and subject name, but different subjectId)
      const duplicateSubjectIds = realSubjects
        .filter(s => s.classId === classId && s.id !== realSubjectId && s.name.toLowerCase().trim() === (resolvedFakeName || '').toLowerCase().trim())
        .map(s => s.id);

      if (duplicateSubjectIds.length > 0) {
        upsertOps.push(prisma.mark.deleteMany({
          where: {
            studentId: m.studentId,
            examId: m.examId,
            subjectId: { in: duplicateSubjectIds }
          }
        }));
      }

      upsertOps.push(prisma.mark.upsert({
        where: { studentId_examId_subjectId: { studentId: m.studentId, examId: m.examId, subjectId: realSubjectId } },
        update: { marksObtained: finalMarksObtained, maxMarks: actualMaxMarks, grade, remarks: finalRemarks },
        create: { studentId: m.studentId, examId: m.examId, subjectId: realSubjectId, marksObtained: finalMarksObtained, maxMarks: actualMaxMarks, grade, remarks: finalRemarks },
      }));
    }

    const results = await prisma.$transaction([...deleteOps, ...upsertOps]);

    // Trigger Notification for Admin & Super Admin
    if (results.length > 0 && marks[0]) {
      const examInfo = await prisma.exam.findUnique({ where: { id: marks[0].examId } });
      const teacherName = req.user?.name || 'A Teacher';
      const examName = examInfo?.name || 'Exam';
      let className = 'a class';
      
      // Try to get class name from student
      const firstStudentId = marks[0]?.studentId;
      if (firstStudentId) {
        const s = await prisma.student.findUnique({ where: { id: firstStudentId }, include: { class: true }});
        if (s?.class) className = `${s.class.name}-${s.class.section}`;
      }

      createSystemNotification({
        role: 'ADMIN',
        title: '📝 Marks Entry Updated',
        message: `${teacherName} entered/updated marks for ${examName} in class ${className}.`,
        type: 'MARKS',
        link: '/exams',
      });
      createSystemNotification({
        role: 'SUPER_ADMIN',
        title: '📝 Marks Entry Updated',
        message: `${teacherName} entered/updated marks for ${examName} in class ${className}.`,
        type: 'MARKS',
        link: '/exams',
      });
    }

    successResponse(res, results, `${results.length} marks saved`);
  } catch (error) {
    next(error);
  }
};

export const getReportCard = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const studentId = req.params.studentId as string;
    const examId = req.params.examId as string;

    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        user: { select: { name: true, email: true, photoUrl: true } },
        class: { select: { name: true, section: true } },
      },
    });
    if (!student) return next(createError('Student not found', 404));

    const exam = await prisma.exam.findUnique({ where: { id: examId } });
    if (!exam) return next(createError('Exam not found', 404));

    const marks = await prisma.mark.findMany({
      where: { studentId, examId },
      include: { subject: { select: { name: true, code: true } } },
    });

    const totalObtained = marks.reduce((s, m) => s + m.marksObtained, 0);
    const totalMax = marks.reduce((s, m) => s + m.maxMarks, 0);
    const percentage = totalMax > 0 ? parseFloat(((totalObtained / totalMax) * 100).toFixed(2)) : 0;
    const grade = calculateGrade(totalObtained, totalMax);

    // Calculate rank among class
    const allStudentMarks = await (prisma.mark as any).groupBy({
      by: ['studentId'],
      where: { examId },
      _sum: { marksObtained: true },
      orderBy: { _sum: { marksObtained: 'desc' } },
    });
    const rank = (allStudentMarks as any[]).findIndex((s) => s.studentId === studentId) + 1;

    // Attendance last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const attendanceRecords = await prisma.attendance.findMany({
      where: { studentId, date: { gte: thirtyDaysAgo } },
    });
    const presentCount = attendanceRecords.filter((a) => a.status === 'PRESENT').length;
    const attendancePercentage = attendanceRecords.length > 0
      ? parseFloat(((presentCount / attendanceRecords.length) * 100).toFixed(2))
      : 0;

    successResponse(res, {
      student,
      exam,
      marks,
      totalObtained,
      totalMax,
      percentage,
      grade,
      rank,
      attendancePercentage,
    }, 'Report card fetched');
  } catch (error) {
    next(error);
  }
};

export const downloadReportCard = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const studentId = req.params.studentId as string;
  const examId = req.params.examId as string;

  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: {
      user: { select: { name: true, email: true } },
      class: { select: { name: true, section: true } },
    },
  });
  if (!student) return next(createError('Student not found', 404));

  const exam = await prisma.exam.findUnique({ where: { id: examId } });
  if (!exam) return next(createError('Exam not found', 404));

  const marks = await prisma.mark.findMany({
    where: { studentId, examId },
    include: { subject: { select: { name: true } } },
  });

  const totalObtained = marks.reduce((s, m) => s + m.marksObtained, 0);
  const totalMax = marks.reduce((s, m) => s + m.maxMarks, 0);
  const percentage = totalMax > 0 ? parseFloat(((totalObtained / totalMax) * 100).toFixed(2)) : 0;
  const grade = calculateGrade(totalObtained, totalMax);
  const passed = percentage >= (exam.passingMarks / exam.maxMarks) * 100;

  const doc = new PDFDocument({ margin: 50, size: 'A4' });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=report-card-${student.rollNo}.pdf`);
  doc.pipe(res);

  // Header
  doc.fontSize(24).fillColor('#4f46e5').text('JY SCHOOL', { align: 'center' });
  doc.fontSize(12).fillColor('#64748b').text('Student Report Card', { align: 'center' });
  doc.moveDown();
  doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke('#e2e8f0');
  doc.moveDown();

  // Student Info
  doc.fontSize(12).fillColor('#1e293b');
  doc.text(`Student Name: ${(student as any).user.name}`, { continued: true }).text(`  Roll No: ${student.rollNo}`, { align: 'right' });
  doc.text(`Class: ${(student as any).class?.name || ''} ${(student as any).class?.section || ''}`, { continued: true }).text(`  Exam: ${exam.name}`, { align: 'right' });
  doc.text(`Term: ${exam.term}`, { continued: true }).text(`  Date: ${exam.examDate.toLocaleDateString()}`, { align: 'right' });
  doc.moveDown();

  // Marks table header
  doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke('#6366f1');
  doc.moveDown(0.5);
  doc.fontSize(11).fillColor('#4f46e5');
  doc.text('Subject', 50, doc.y, { width: 200 });
  const headerY = doc.y - doc.currentLineHeight();
  doc.text('Marks Obtained', 250, headerY, { width: 120 });
  doc.text('Max Marks', 370, headerY, { width: 90 });
  doc.text('Grade', 460, headerY, { width: 60 });
  doc.moveDown();
  doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke('#e2e8f0');

  // Marks rows
  for (const mark of marks as any[]) {
    doc.fontSize(10).fillColor('#1e293b');
    const rowY = doc.y + 5;
    doc.text(mark.subject.name, 50, rowY, { width: 200 });
    doc.text(mark.marksObtained.toString(), 250, rowY, { width: 120 });
    doc.text(mark.maxMarks.toString(), 370, rowY, { width: 90 });
    doc.text(mark.grade || '-', 460, rowY, { width: 60 });
    doc.moveDown();
  }
  
  doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke('#e2e8f0');
  doc.moveDown();
  
  // Footer Stats
  doc.fontSize(11).fillColor('#4f46e5');
  doc.text(`Total: ${totalObtained} / ${totalMax}`, { continued: true });
  doc.text(`Percentage: ${percentage}%`, { align: 'right' });
  doc.text(`Grade: ${grade}`, { continued: true });
  doc.text(`Result: ${passed ? 'PASS' : 'FAIL'}`, { align: 'right' });

  doc.end();
};

export const clearMarks = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const examId = req.params.examId as string;
    const classId = req.query.classId as string;
    const subjectId = req.query.subjectId as string;
    
    if (!examId || !classId) return next(createError('Exam ID and Class ID are required', 400));
    
    // Find students in this class
    const students = await prisma.student.findMany({ where: { classId } });
    const studentIds = students.map(s => s.id);
    
    const exam = await prisma.exam.findUnique({ where: { id: examId }});
    
    let frozenClasses: string[] = [];
    if (exam?.frozenClasses) {
      if (typeof exam.frozenClasses === 'string') {
        frozenClasses = JSON.parse(exam.frozenClasses);
      } else if (Array.isArray(exam.frozenClasses)) {
        frozenClasses = exam.frozenClasses as string[];
      }
    }
    
    if (frozenClasses.includes(classId)) {
       return next(createError('Marks for this class have been frozen. Cannot clear.', 403));
    }
    
    let targetSubjectId = subjectId;
    if (subjectId) {
       const examSubjects: any[] = Array.isArray(exam?.subjects) ? exam.subjects : [];
       const fakeSubject = examSubjects.find(s => String(s.id) === String(subjectId));
       if (fakeSubject) {
           const realSubject = await prisma.subject.findFirst({
               where: { classId, name: fakeSubject.name }
           });
           if (realSubject) targetSubjectId = realSubject.id;
       }
    }

    const whereClause: any = {
      examId,
      studentId: { in: studentIds }
    };
    if (targetSubjectId) {
      whereClause.subjectId = targetSubjectId;
    }

    // Delete marks for these students in this exam
    const result = await prisma.mark.deleteMany({
      where: whereClause
    });
    
    successResponse(res, result, `Successfully cleared ${result.count} marks records.`);
  } catch (error) {
    next(error);
  }
};

export const getMarksEntryData = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const examId = (req.query.examId || req.params.examId) as string;
    const classId = (req.query.classId || req.params.classId) as string;

    if (!examId || !classId) {
      return next(createError('examId and classId are required', 400));
    }

    // Parallel fetch: exam, class, students, and realSubjects all executed in parallel
    const [exam, cls, students, realSubjects] = await Promise.all([
      prisma.exam.findUnique({
        where: { id: examId },
        select: {
          id: true,
          name: true,
          term: true,
          examDate: true,
          maxMarks: true,
          passingMarks: true,
          subjects: true,
          frozenClasses: true,
        }
      }),
      prisma.class.findUnique({
        where: { id: classId },
        select: { id: true, name: true, section: true }
      }),
      prisma.student.findMany({
        where: { classId },
        select: {
          id: true,
          rollNo: true,
          user: { select: { name: true } }
        },
        orderBy: { rollNo: 'asc' }
      }),
      prisma.subject.findMany({
        where: { classId },
        select: { id: true, name: true, code: true }
      })
    ]);

    if (!exam) return next(createError('Exam not found', 404));

    // Fetch marks only for this class's students in this exam
    const studentList = students || [];
    const studentIds = studentList.map(s => s.id);
    const marks = studentIds.length > 0 ? await prisma.mark.findMany({
      where: {
        examId,
        studentId: { in: studentIds }
      },
      select: {
        studentId: true,
        subjectId: true,
        marksObtained: true,
        maxMarks: true,
        remarks: true,
        subject: { select: { name: true, code: true } }
      }
    }) : [];

    successResponse(res, {
      exam,
      currentClass: cls,
      students: studentList,
      marks,
      realSubjects: realSubjects || []
    }, 'Marks entry data fetched');
  } catch (error) {
    next(error);
  }
};

export const getCceCumulativeCard = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    let classId = (req.query.classId as string) || '';
    const studentId = (req.query.studentId as string) || '';

    // If no classId provided, find the first available class
    if (!classId) {
      const firstClass = await prisma.class.findFirst({
        orderBy: { name: 'asc' },
        select: { id: true }
      });
      if (firstClass) classId = firstClass.id;
    }

    if (!classId) {
      return next(createError('No class found', 404));
    }

    const [cls, schoolSettings] = await Promise.all([
      prisma.class.findUnique({
        where: { id: classId },
        select: { id: true, name: true, section: true, academicYear: true }
      }),
      (prisma as any).schoolSettings?.findFirst ? (prisma as any).schoolSettings.findFirst() : null
    ]);

    if (!cls) return next(createError('Class not found', 404));

    // Fetch students for class (or single student if specified)
    const whereStudent: any = { classId };
    if (studentId) whereStudent.id = studentId;

    const students = await prisma.student.findMany({
      where: whereStudent,
      include: {
        user: { select: { id: true, name: true, photoUrl: true } }
      },
      orderBy: { rollNo: 'asc' }
    });

    // Fetch subjects for class
    const classSubjects = await prisma.subject.findMany({
      where: { classId },
      select: { id: true, name: true, code: true },
      orderBy: { name: 'asc' }
    });

    // Fetch all exams linked to this class or all exams
    let classExams = await prisma.exam.findMany({
      where: {
        classes: { some: { id: classId } }
      },
      select: { id: true, name: true, term: true, maxMarks: true, examDate: true },
      orderBy: { examDate: 'asc' }
    });

    if (classExams.length === 0) {
      // Fallback: fetch all active exams
      classExams = await prisma.exam.findMany({
        select: { id: true, name: true, term: true, maxMarks: true, examDate: true },
        orderBy: { examDate: 'asc' }
      });
    }

    // Auto-classify exams into fa1..fa4, sa1, sa2
    const classifyExam = (name: string): string | null => {
      const n = (name || '').toLowerCase().trim();
      if (/(fa[\s\-_]*1|formative[\s\-_]*(assessment)?[\s\-_]*1|fa[\s\-_]*i\b)/i.test(n)) return 'fa1';
      if (/(fa[\s\-_]*2|formative[\s\-_]*(assessment)?[\s\-_]*2|fa[\s\-_]*ii\b)/i.test(n)) return 'fa2';
      if (/(fa[\s\-_]*3|formative[\s\-_]*(assessment)?[\s\-_]*3|fa[\s\-_]*iii\b)/i.test(n)) return 'fa3';
      if (/(fa[\s\-_]*4|formative[\s\-_]*(assessment)?[\s\-_]*4|fa[\s\-_]*iv\b)/i.test(n)) return 'fa4';
      if (/(sa[\s\-_]*1|summative[\s\-_]*(assessment)?[\s\-_]*1|sa[\s\-_]*i\b|half[\s\-_]*yearly|term[\s\-_]*1)/i.test(n)) return 'sa1';
      if (/(sa[\s\-_]*2|summative[\s\-_]*(assessment)?[\s\-_]*2|sa[\s\-_]*ii\b|annual|final[\s\-_]*exam|term[\s\-_]*2)/i.test(n)) return 'sa2';
      return null;
    };

    const detectedExams: Record<string, { id: string; name: string; maxMarks: number }> = {};
    for (const ex of classExams) {
      const slot = classifyExam(ex.name);
      if (slot && !detectedExams[slot]) {
        detectedExams[slot] = { id: ex.id, name: ex.name, maxMarks: ex.maxMarks };
      }
    }

    const studentIds = students.map(s => s.id);

    // Fetch marks for all these students
    const allMarks = studentIds.length > 0 ? await prisma.mark.findMany({
      where: {
        studentId: { in: studentIds }
      },
      select: {
        studentId: true,
        examId: true,
        subjectId: true,
        marksObtained: true,
        maxMarks: true,
        grade: true,
        exam: { select: { id: true, name: true } },
        subject: { select: { id: true, name: true, code: true } }
      }
    }) : [];

    // Fetch attendance summary
    const allAttendance = studentIds.length > 0 ? await prisma.attendance.findMany({
      where: {
        studentId: { in: studentIds }
      },
      select: { studentId: true, status: true }
    }) : [];

    // CCE Grade calculator
    const getCceGrade = (pct: number) => {
      if (pct >= 91) return { grade: 'A1', point: 10 };
      if (pct >= 81) return { grade: 'A2', point: 9 };
      if (pct >= 71) return { grade: 'B1', point: 8 };
      if (pct >= 61) return { grade: 'B2', point: 7 };
      if (pct >= 51) return { grade: 'C1', point: 6 };
      if (pct >= 41) return { grade: 'C2', point: 5 };
      if (pct >= 35) return { grade: 'D', point: 4 };
      return { grade: 'E', point: 3 };
    };

    // Standard school subject order
    const SUBJECT_ORDER = ['TELUGU', 'HINDI', 'ENGLISH', 'MATHEMATICS', 'SCIENCE', 'GENERAL SCIENCE', 'PHYSICAL SCIENCE', 'BIOLOGICAL SCIENCE', 'SOCIAL STUDIES', 'SOCIAL'];

    // Identify unique canonical subjects
    const canonicalSubjectMap = new Map<string, string>(); // canonicalName -> display name
    for (const sub of classSubjects) {
      const cName = getCanonicalSubjectName(sub.name);
      if (!canonicalSubjectMap.has(cName)) {
        canonicalSubjectMap.set(cName, sub.name);
      }
    }
    // Also include any subjects appearing in marks
    for (const m of allMarks) {
      if (m.subject?.name) {
        const cName = getCanonicalSubjectName(m.subject.name);
        if (!canonicalSubjectMap.has(cName)) {
          canonicalSubjectMap.set(cName, m.subject.name);
        }
      }
    }

    const uniqueCanonicalSubjects = Array.from(canonicalSubjectMap.entries()).sort((a, b) => {
      const idxA = SUBJECT_ORDER.findIndex(o => a[0].includes(o));
      const idxB = SUBJECT_ORDER.findIndex(o => b[0].includes(o));
      return (idxA !== -1 ? idxA : 99) - (idxB !== -1 ? idxB : 99);
    });

    // Map each student's evaluations
    const studentEvaluations = students.map(student => {
      const stMarks = allMarks.filter(m => m.studentId === student.id);
      const stAtt = allAttendance.filter(a => a.studentId === student.id);
      const totalDays = stAtt.length;
      const presentDays = stAtt.filter(a => a.status === 'PRESENT').length;
      const attPct = totalDays > 0 ? parseFloat(((presentDays / totalDays) * 100).toFixed(1)) : 100;

      let studentTotalObtained = 0;
      let studentTotalMax = 0;

      const subjectRows = uniqueCanonicalSubjects.map(([canonName, displayName], sIdx) => {
        // Marks for this subject
        const subMarks = stMarks.filter(m => {
          const mCanon = getCanonicalSubjectName(m.subject?.name || '');
          return mCanon === canonName || areSubjectsMatching(m.subject?.name || '', canonName);
        });

        // Helper to find mark in a slot
        const getMarkForSlot = (slot: string) => {
          const detected = detectedExams[slot];
          if (!detected) return null;
          const found = subMarks.find(m => m.examId === detected.id);
          if (found) {
            return {
              obtained: found.marksObtained,
              max: found.maxMarks || detected.maxMarks || 50
            };
          }
          return null;
        };

        const fa1 = getMarkForSlot('fa1');
        const fa2 = getMarkForSlot('fa2');
        const fa3 = getMarkForSlot('fa3');
        const fa4 = getMarkForSlot('fa4');
        const sa1 = getMarkForSlot('sa1');
        const sa2 = getMarkForSlot('sa2');

        const faList = [fa1, fa2, fa3, fa4].filter(Boolean) as { obtained: number; max: number }[];
        const faObtained = faList.reduce((acc, x) => acc + x.obtained, 0);
        const faMax = faList.length > 0 ? faList.reduce((acc, x) => acc + x.max, 0) : 200;

        const saList = [sa1, sa2].filter(Boolean) as { obtained: number; max: number }[];
        const saObtained = saList.reduce((acc, x) => acc + x.obtained, 0);
        const saMax = saList.length > 0 ? saList.reduce((acc, x) => acc + x.max, 0) : 200;

        const totalObtained = faObtained + saObtained;
        const totalMax = (faList.length > 0 ? faMax : 200) + (saList.length > 0 ? saMax : 200);
        const hasAnyMark = faList.length > 0 || saList.length > 0;

        const subPct = totalMax > 0 && hasAnyMark ? (totalObtained / totalMax) * 100 : 0;
        const { grade, point } = getCceGrade(subPct);

        if (hasAnyMark) {
          studentTotalObtained += totalObtained;
          studentTotalMax += totalMax;
        }

        return {
          slNo: sIdx + 1,
          subjectName: displayName,
          canonicalName: canonName,
          fa1: fa1 ? fa1.obtained : null,
          fa1Max: fa1 ? fa1.max : 50,
          fa2: fa2 ? fa2.obtained : null,
          fa2Max: fa2 ? fa2.max : 50,
          fa3: fa3 ? fa3.obtained : null,
          fa3Max: fa3 ? fa3.max : 50,
          fa4: fa4 ? fa4.obtained : null,
          fa4Max: fa4 ? fa4.max : 50,
          faTotal: faList.length > 0 ? faObtained : null,
          faMax: faMax,
          sa1: sa1 ? sa1.obtained : null,
          sa1Max: sa1 ? sa1.max : 100,
          sa2: sa2 ? sa2.obtained : null,
          sa2Max: sa2 ? sa2.max : 100,
          saTotal: saList.length > 0 ? saObtained : null,
          saMax: saMax,
          grandTotal: hasAnyMark ? totalObtained : null,
          grandMax: totalMax,
          percentage: hasAnyMark ? parseFloat(subPct.toFixed(1)) : null,
          grade: hasAnyMark ? grade : '-',
          gradePoint: hasAnyMark ? point : null
        };
      });

      const overallPercentage = studentTotalMax > 0 ? parseFloat(((studentTotalObtained / studentTotalMax) * 100).toFixed(1)) : 0;
      const overallCce = getCceGrade(overallPercentage);

      return {
        id: student.id,
        rollNo: student.rollNo,
        name: student.user?.name || student.rollNo,
        photoUrl: student.user?.photoUrl || null,
        fatherName: student.fatherName || '-',
        motherName: student.motherName || '-',
        dob: student.dob ? new Date(student.dob).toLocaleDateString('en-GB') : '-',
        gender: student.gender || 'MALE',
        bloodGroup: student.bloodGroup || 'O+',
        admissionNo: student.rollNo,
        className: `${cls.name} - ${cls.section}`,
        academicYear: cls.academicYear || '2026-2027',
        attendance: {
          totalDays: totalDays || 220,
          presentDays: presentDays || 205,
          percentage: attPct
        },
        subjectRows,
        summary: {
          totalObtained: studentTotalObtained,
          totalMax: studentTotalMax || 600,
          percentage: overallPercentage,
          grade: studentTotalObtained > 0 ? overallCce.grade : '-',
          gpa: studentTotalObtained > 0 ? (overallCce.point).toFixed(1) : '-',
          result: overallPercentage >= 35 ? 'PROMOTED TO NEXT CLASS' : (studentTotalObtained > 0 ? 'NEEDS IMPROVEMENT' : 'PENDING EVALUATION'),
          rank: 1
        }
      };
    });

    // Assign class ranks based on percentage (descending)
    const sortedStudents = [...studentEvaluations].sort((a, b) => b.summary.percentage - a.summary.percentage);
    sortedStudents.forEach((st, idx) => {
      st.summary.rank = idx + 1;
    });

    successResponse(res, {
      class: cls,
      school: {
        schoolName: schoolSettings?.schoolName || 'SRI VENKATESWARA JY SCHOOL',
        schoolSubtitle: schoolSettings?.schoolSubtitle || '(Recognized by Govt. of Andhra Pradesh | English Medium High School)',
        address: schoolSettings?.address || 'Opp. Hero Showroom, SVL Paradise Campus, Narasannapeta, Srikakulam',
        logoUrl: schoolSettings?.logoUrl || '/logo.png',
        principalSignatureUrl: schoolSettings?.principalSignatureUrl || null,
        teacherSignatureUrl: schoolSettings?.teacherSignatureUrl || null,
        udiseCode: (schoolSettings as any)?.udiseCode || '281125100013'
      },
      detectedExams,
      availableExams: classExams,
      students: studentEvaluations
    }, 'CCE Cumulative Progress Card data fetched');
  } catch (error) {
    next(error);
  }
};
