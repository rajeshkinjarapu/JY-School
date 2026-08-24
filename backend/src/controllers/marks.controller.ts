import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth';
import { createError } from '../middlewares/errorHandler';
import { prisma } from '../utils/prisma';
import { successResponse } from '../utils/response';
import { calculateGrade } from '../utils/helpers';
import { createSystemNotification } from './notifications.controller';
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
  const exam = await prisma.exam.findUnique({ where: { id: examId } });
  if (!exam) return next(createError('Exam not found', 404));

  const marks = await prisma.mark.findMany({
    where: { examId },
    include: {
      student: { include: { user: { select: { name: true } } } },
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

    const exam = await prisma.exam.findUnique({ where: { id: examId } });
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

    const upsertOps: any[] = [];
    
    for (const m of marks) {
      // Resolve fake subject ID to real subject ID
      let realSubjectId = m.subjectId;
      const fakeSubject = examSubjects.find(s => s.id === m.subjectId);
      
      if (fakeSubject) {
        const classId = studentClassMap.get(m.studentId);
        let matchingRealSubject = realSubjects.find(
          s => s.classId === classId && s.name.toLowerCase() === fakeSubject.name.toLowerCase()
        );
        if (matchingRealSubject) {
          realSubjectId = matchingRealSubject.id;
        } else {
          // Auto-create subject for this class since it's required for the exam!
          matchingRealSubject = await prisma.subject.create({
            data: {
              name: fakeSubject.name.trim(),
              code: fakeSubject.name.substring(0, 3).toUpperCase(),
              classId: classId as string
            }
          });
          realSubjects.push(matchingRealSubject);
          realSubjectId = matchingRealSubject.id;
        }
      }

      // Handle 'AB' (Absent) logic
      let finalMarksObtained = m.marksObtained;
      let finalRemarks = m.remarks;
      if (m.remarks === 'AB' || m.marksObtained === -1) {
          finalMarksObtained = 0;
          finalRemarks = 'AB';
      }

      // Validate max marks
      if (finalMarksObtained > m.maxMarks && finalRemarks !== 'AB') {
         return next(createError(`Marks obtained (${finalMarksObtained}) cannot exceed max marks (${m.maxMarks})`, 400));
      }

      const grade = finalRemarks === 'AB' ? 'F' : calculateGrade(finalMarksObtained, m.maxMarks);
      upsertOps.push(prisma.mark.upsert({
        where: { studentId_examId_subjectId: { studentId: m.studentId, examId: m.examId, subjectId: realSubjectId } },
        update: { marksObtained: finalMarksObtained, maxMarks: m.maxMarks, grade, remarks: finalRemarks },
        create: { studentId: m.studentId, examId: m.examId, subjectId: realSubjectId, marksObtained: finalMarksObtained, maxMarks: m.maxMarks, grade, remarks: finalRemarks },
      }));
    }

    const results = await prisma.$transaction(upsertOps);

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
       const fakeSubject = examSubjects.find(s => s.id === subjectId);
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
