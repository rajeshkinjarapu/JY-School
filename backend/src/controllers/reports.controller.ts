import { Request, Response, NextFunction } from 'express';
import { prisma } from '../utils/prisma';
import * as XLSX from 'xlsx';
import { AttendanceStatus } from '../types/enums';
import PDFDocument from 'pdfkit';

export const getAttendanceReport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { classId, startDate, endDate } = req.query;

    const start = startDate ? new Date(startDate as string) : new Date(new Date().getFullYear(), 0, 1);
    const end = endDate ? new Date(endDate as string) : new Date();

    const students = await prisma.student.findMany({
      where: classId ? { classId: classId as string } : {},
      include: {
        user: { select: { name: true } },
        class: true,
        attendance: {
          where: { date: { gte: start, lte: end } }
        }
      }
    });

    const reportData = students.map(s => {
      const total = s.attendance.length;
      const present = s.attendance.filter(a => a.status === AttendanceStatus.PRESENT).length;
      const absent = s.attendance.filter(a => a.status === AttendanceStatus.ABSENT).length;
      const late = s.attendance.filter(a => a.status === AttendanceStatus.LATE).length;
      const excused = s.attendance.filter(a => a.status === AttendanceStatus.EXCUSED).length;
      const presentRate = total > 0 ? Math.round(((present + late) / total) * 100) : 100;

      return {
        'Roll No': s.rollNo,
        'Student Name': s.user.name,
        'Class': s.class ? s.class.name : 'N/A',
        'Section': s.class ? s.class.section : 'N/A',
        'Total Records': total,
        'Present': present,
        'Absent': absent,
        'Late': late,
        'Excused': excused,
        'Attendance %': `${presentRate}%`
      };
    });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(reportData);
    XLSX.utils.book_append_sheet(wb, ws, 'Attendance Report');

    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=Attendance_Report.xlsx');
    res.send(buffer);
  } catch (error) {
    next(error);
  }
};

export const getMarksReport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { classId, examId } = req.query;
    if (!classId || !examId) {
      res.status(400).json({ success: false, message: 'classId and examId are required' });
      return;
    }

    const exam = await prisma.exam.findUnique({
      where: { id: examId as string },
      include: { classes: true }
    });

    if (!exam) {
      res.status(404).json({ success: false, message: 'Exam not found' });
      return;
    }

    const subjects = await prisma.subject.findMany({
      where: { classId: classId as string }
    });

    const marks = await prisma.mark.findMany({
      where: { examId: examId as string },
      include: {
        student: {
          include: { user: { select: { name: true } } }
        },
        subject: true
      }
    });

    const studentMap: { [studentId: string]: any } = {};

    marks.forEach(m => {
      if (!studentMap[m.studentId]) {
        studentMap[m.studentId] = {
          'Roll No': m.student.rollNo,
          'Student Name': m.student.user.name,
          totalObtained: 0,
          totalMax: 0,
        };
        subjects.forEach(sub => {
          studentMap[m.studentId][sub.name] = 'N/A';
        });
      }
      const markMax = (m.maxMarks && m.maxMarks > 0) ? m.maxMarks : 50;
      studentMap[m.studentId][m.subject.name] = m.marksObtained;
      studentMap[m.studentId].totalObtained += m.marksObtained;
      studentMap[m.studentId].totalMax += markMax;
    });

    const reportData = Object.values(studentMap).map(s => {
      const percentage = s.totalMax > 0 ? Math.min(100, Math.round((s.totalObtained / s.totalMax) * 100)) : 0;
      let grade = 'F';
      if (percentage >= 90) grade = 'A+';
      else if (percentage >= 80) grade = 'A';
      else if (percentage >= 70) grade = 'B+';
      else if (percentage >= 60) grade = 'B';
      else if (percentage >= 50) grade = 'C+';
      else if (percentage >= 40) grade = 'C';
      else if (percentage >= 33) grade = 'D';

      const { totalObtained, totalMax, ...cleanStudent } = s;
      return {
        ...cleanStudent,
        'Total Marks': totalObtained,
        'Max Marks': totalMax,
        'Percentage': `${percentage}%`,
        'Grade': grade
      };
    });

    // Sort by Total Marks desc to calculate rank
    reportData.sort((a, b) => b['Total Marks'] - a['Total Marks']);
    reportData.forEach((s, idx) => {
      s['Rank'] = idx + 1;
    });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(reportData);
    XLSX.utils.book_append_sheet(wb, ws, 'Marks Report');

    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=Marks_Report_${exam.name.replace(/\s+/g, '_')}.xlsx`);
    res.send(buffer);
  } catch (error) {
    next(error);
  }
};

export const getFeeReport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { startDate, endDate } = req.query;

    const start = startDate ? new Date(startDate as string) : undefined;
    const end = endDate ? new Date(endDate as string) : undefined;
    if (end) end.setHours(23, 59, 59, 999);

    const dateFilter = start || end ? {
      ...(start && { gte: start }),
      ...(end && { lte: end })
    } : undefined;

    const payments = await prisma.feePayment.findMany({
      where: dateFilter ? { paymentDate: dateFilter } : {},
      include: {
        student: {
          include: {
            user: { select: { name: true } },
            class: true
          }
        },
        feeStructure: true
      },
      orderBy: { paymentDate: 'desc' }
    });

    const reportData = payments.map(p => ({
      'Receipt No': p.receiptNo,
      'Student Name': p.student.user.name,
      'Roll No': p.student.rollNo,
      'Class': p.student.class ? p.student.class.name : 'N/A',
      'Section': p.student.class ? p.student.class.section : 'N/A',
      'Fee Component': p.feeStructure.name,
      'Fee Amount': p.feeStructure.amount,
      'Amount Paid': p.amountPaid,
      'Payment Status': p.status,
      'Payment Method': p.method,
      'Payment Date': p.paymentDate.toISOString().split('T')[0]
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(reportData);
    XLSX.utils.book_append_sheet(wb, ws, 'Fee Report');

    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=Fee_Report.xlsx');
    res.send(buffer);
  } catch (error) {
    next(error);
  }
};

export const getStudentsReport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { classId } = req.query;

    const students = await prisma.student.findMany({
      where: classId ? { classId: classId as string } : {},
      include: {
        user: { select: { name: true, email: true, phone: true } },
        class: true,
      }
    });

    const reportData = students.map(s => ({
      'Roll No': s.rollNo,
      'Student Name': s.user.name,
      'Phone': s.user.phone || 'N/A',
      'Class': s.class ? s.class.name : 'N/A',
      'Section': s.class ? s.class.section : 'N/A',
      'Father Name': s.fatherName || 'N/A',
      'Mother Name': s.motherName || 'N/A',
      'Aadhar No': s.aadharNo || 'N/A',
      'PEN Number': s.penNumber || 'N/A',
      'DOB': s.dob ? s.dob.toISOString().split('T')[0] : 'N/A',
      'Gender': s.gender || 'N/A',
      'Admission Date': s.admissionDate.toISOString().split('T')[0],
      'Guardian Name': s.fatherName || 'N/A',
      'Guardian Phone': s.user.phone || 'N/A',
      'Address': s.address || 'N/A',
      'Medical Info': s.medicalInfo || 'None'
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(reportData);
    XLSX.utils.book_append_sheet(wb, ws, 'Student Directory');

    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=Student_Report.xlsx');
    res.send(buffer);
  } catch (error) {
    next(error);
  }
};

export const getAttendanceReportPdf = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { classId, startDate, endDate } = req.query;
    const start = startDate ? new Date(startDate as string) : new Date(new Date().getFullYear(), 0, 1);
    const end = endDate ? new Date(endDate as string) : new Date();

    const targetClass = classId ? await prisma.class.findUnique({ where: { id: classId as string } }) : null;
    const students = await prisma.student.findMany({
      where: classId ? { classId: classId as string } : {},
      include: {
        user: { select: { name: true } },
        class: true,
        attendance: { where: { date: { gte: start, lte: end } } }
      }
    });

    const settings = await prisma.schoolSettings.findFirst();
    const schoolName = settings?.schoolName || 'JY School';
    const schoolAddress = settings?.address || '123 Education Street, Knowledge City';

    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=Attendance_Report.pdf');
    doc.pipe(res);

    // Banner
    doc.rect(40, 30, 515, 60).fill('#1e1b4b');
    doc.fillColor('#ffffff').fontSize(16).font('Helvetica-Bold').text(schoolName.toUpperCase(), 55, 45);
    doc.fontSize(9).font('Helvetica').fillColor('#93c5fd').text('OFFICIAL ACADEMIC SYSTEM REPORT', 55, 68);
    doc.fontSize(12).font('Helvetica-Bold').fillColor('#ffffff').text('ATTENDANCE LEDGER', 320, 48, { align: 'right', width: 220 });

    // Sub-info
    doc.fillColor('#334155').fontSize(9).font('Helvetica-Bold').text(`Class: ${targetClass ? `${targetClass.name}-${targetClass.section}` : 'All Classes'}`, 40, 110);
    doc.font('Helvetica').text(`Range: ${start.toLocaleDateString()} to ${end.toLocaleDateString()}  |  Print Date: ${new Date().toLocaleDateString()}`, 40, 125);

    // Table Headers
    const tableY = 150;
    doc.rect(40, tableY, 515, 20).fill('#f1f5f9');
    doc.fontSize(8).font('Helvetica-Bold').fillColor('#475569');
    doc.text('STUDENT ID', 50, tableY + 6, { width: 90 });
    doc.text('STUDENT NAME', 145, tableY + 6, { width: 165 });
    doc.text('CLASS', 315, tableY + 6, { width: 75 });
    doc.text('PRESENT', 395, tableY + 6, { width: 50, align: 'right' });
    doc.text('ABSENT', 450, tableY + 6, { width: 50, align: 'right' });
    doc.text('RATE %', 505, tableY + 6, { width: 45, align: 'right' });

    let currentY = tableY + 20;
    doc.fontSize(9).font('Helvetica').fillColor('#1e293b');

    students.forEach((s) => {
      const total = s.attendance.length;
      const present = s.attendance.filter(a => a.status === AttendanceStatus.PRESENT).length;
      const absent = s.attendance.filter(a => a.status === AttendanceStatus.ABSENT).length;
      const late = s.attendance.filter(a => a.status === AttendanceStatus.LATE).length;
      const presentRate = total > 0 ? Math.round(((present + late) / total) * 100) : 100;

      if (currentY > 750) {
        doc.addPage();
        currentY = 40;
        // Reprint header on new page
        doc.rect(40, currentY, 515, 20).fill('#f1f5f9');
        doc.fontSize(8).font('Helvetica-Bold').fillColor('#475569');
        doc.text('STUDENT ID', 50, currentY + 6);
        doc.text('STUDENT NAME', 145, currentY + 6);
        doc.text('CLASS', 315, currentY + 6);
        doc.text('PRESENT', 395, currentY + 6, { align: 'right', width: 50 });
        doc.text('ABSENT', 450, currentY + 6, { align: 'right', width: 50 });
        doc.text('RATE %', 505, currentY + 6, { align: 'right', width: 45 });
        currentY += 20;
      }

      doc.fontSize(8).font('Helvetica').fillColor('#334155');
      doc.text(s.rollNo, 50, currentY + 5, { width: 90 });
      doc.font('Helvetica-Bold').text(s.user.name, 145, currentY + 5, { width: 165 });
      doc.font('Helvetica').text(s.class ? `${s.class.name}-${s.class.section}` : 'N/A', 315, currentY + 5, { width: 75 });
      doc.text(present.toString(), 395, currentY + 5, { width: 50, align: 'right' });
      doc.text(absent.toString(), 450, currentY + 5, { width: 50, align: 'right' });
      doc.font('Helvetica-Bold').fillColor(presentRate < 75 ? '#b91c1c' : '#047857').text(`${presentRate}%`, 505, currentY + 5, { width: 45, align: 'right' });

      doc.moveTo(40, currentY + 18).lineTo(555, currentY + 18).stroke('#f1f5f9');
      currentY += 18;
    });

    // Footer
    doc.fontSize(7).font('Helvetica').fillColor('#cbd5e1').text(`${schoolAddress}`, 40, 800, { align: 'center', width: 515 });

    doc.end();
  } catch (error) {
    next(error);
  }
};

export const getMarksReportPdf = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { classId, examId } = req.query;
    if (!classId || !examId) {
      res.status(400).json({ success: false, message: 'classId and examId are required' });
      return;
    }

    const exam = await prisma.exam.findUnique({
      where: { id: examId as string },
      include: { classes: true }
    });
    if (!exam) {
      res.status(404).json({ success: false, message: 'Exam not found' });
      return;
    }

    const subjects = await prisma.subject.findMany({ where: { classId: classId as string } });
    const marks = await prisma.mark.findMany({
      where: { examId: examId as string },
      include: {
        student: { include: { user: { select: { name: true } } } },
        subject: true
      }
    });

    const studentMap: { [studentId: string]: any } = {};
    marks.forEach(m => {
      if (!studentMap[m.studentId]) {
        studentMap[m.studentId] = {
          rollNo: m.student.rollNo,
          name: m.student.user.name,
          totalObtained: 0,
          totalMax: 0,
        };
      }
      studentMap[m.studentId].totalObtained += m.marksObtained;
      studentMap[m.studentId].totalMax += m.maxMarks;
    });

    const reportData = Object.values(studentMap).map(s => {
      const percentage = s.totalMax > 0 ? Math.round((s.totalObtained / s.totalMax) * 100) : 0;
      let grade = 'F';
      if (percentage >= 90) grade = 'A+';
      else if (percentage >= 80) grade = 'A';
      else if (percentage >= 70) grade = 'B+';
      else if (percentage >= 60) grade = 'B';
      else if (percentage >= 50) grade = 'C+';
      else if (percentage >= 40) grade = 'C';
      else if (percentage >= 33) grade = 'D';

      return {
        ...s,
        percentage,
        grade
      };
    });

    reportData.sort((a, b) => b.totalObtained - a.totalObtained);
    reportData.forEach((s, idx) => {
      s.rank = idx + 1;
    });

    const settings = await prisma.schoolSettings.findFirst();
    const schoolName = settings?.schoolName || 'JY School';
    const schoolAddress = settings?.address || '123 Education Street, Knowledge City';

    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Marks_Report_${exam.name.replace(/\s+/g, '_')}.pdf`);
    doc.pipe(res);

    // Banner
    doc.rect(40, 30, 515, 60).fill('#1e1b4b');
    doc.fillColor('#ffffff').fontSize(16).font('Helvetica-Bold').text(schoolName.toUpperCase(), 55, 45);
    doc.fontSize(9).font('Helvetica').fillColor('#93c5fd').text('OFFICIAL ACADEMIC SYSTEM REPORT', 55, 68);
    doc.fontSize(12).font('Helvetica-Bold').fillColor('#ffffff').text('GRADES REGISTRY', 320, 48, { align: 'right', width: 220 });

    // Sub-info
    doc.fillColor('#334155').fontSize(9).font('Helvetica-Bold').text(`Exam: ${exam.name}  |  Class: ${exam.classes && exam.classes.length > 0 ? `${exam.classes[0].name}-${exam.classes[0].section}` : 'N/A'}`, 40, 110);
    doc.font('Helvetica').text(`Print Date: ${new Date().toLocaleDateString()}`, 40, 125);

    // Table Headers
    const tableY = 150;
    doc.rect(40, tableY, 515, 20).fill('#f1f5f9');
    doc.fontSize(8).font('Helvetica-Bold').fillColor('#475569');
    doc.text('RANK', 50, tableY + 6, { width: 40 });
    doc.text('STUDENT NAME', 95, tableY + 6, { width: 165 });
    doc.text('STUDENT ID', 270, tableY + 6, { width: 90 });
    doc.text('OBTAINED', 370, tableY + 6, { width: 55, align: 'right' });
    doc.text('MAX TOTAL', 435, tableY + 6, { width: 55, align: 'right' });
    doc.text('PER %', 500, tableY + 6, { width: 35, align: 'right' });
    doc.text('GRD', 540, tableY + 6, { width: 15, align: 'right' });

    let currentY = tableY + 20;

    reportData.forEach((s) => {
      if (currentY > 750) {
        doc.addPage();
        currentY = 40;
        doc.rect(40, currentY, 515, 20).fill('#f1f5f9');
        doc.fontSize(8).font('Helvetica-Bold').fillColor('#475569');
        doc.text('RANK', 50, currentY + 6);
        doc.text('STUDENT NAME', 95, currentY + 6);
        doc.text('STUDENT ID', 270, currentY + 6);
        doc.text('OBTAINED', 370, currentY + 6, { align: 'right', width: 55 });
        doc.text('MAX TOTAL', 435, currentY + 6, { align: 'right', width: 55 });
        doc.text('PER %', 500, currentY + 6, { align: 'right', width: 35 });
        doc.text('GRD', 540, currentY + 6, { align: 'right', width: 15 });
        currentY += 20;
      }

      doc.fontSize(8).font('Helvetica').fillColor('#334155');
      doc.text(s.rank.toString(), 50, currentY + 5, { width: 40 });
      doc.font('Helvetica-Bold').text(s.name, 95, currentY + 5, { width: 165 });
      doc.font('Helvetica').text(s.rollNo, 270, currentY + 5, { width: 90 });
      doc.text(s.totalObtained.toString(), 370, currentY + 5, { width: 55, align: 'right' });
      doc.text(s.totalMax.toString(), 435, currentY + 5, { width: 55, align: 'right' });
      doc.text(`${s.percentage}%`, 500, currentY + 5, { width: 35, align: 'right' });
      doc.font('Helvetica-Bold').fillColor(s.grade === 'F' ? '#b91c1c' : '#1e1b4b').text(s.grade, 540, currentY + 5, { width: 15, align: 'right' });

      doc.moveTo(40, currentY + 18).lineTo(555, currentY + 18).stroke('#f1f5f9');
      currentY += 18;
    });

    doc.fontSize(7).font('Helvetica').fillColor('#cbd5e1').text(`${schoolAddress}`, 40, 800, { align: 'center', width: 515 });
    doc.end();
  } catch (error) {
    next(error);
  }
};

export const getFeeReportPdf = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { startDate, endDate } = req.query;
    const start = startDate ? new Date(startDate as string) : undefined;
    const end = endDate ? new Date(endDate as string) : undefined;
    if (end) end.setHours(23, 59, 59, 999);

    const dateFilter = start || end ? {
      ...(start && { gte: start }),
      ...(end && { lte: end })
    } : undefined;

    const payments = await prisma.feePayment.findMany({
      where: dateFilter ? { paymentDate: dateFilter } : {},
      include: {
        student: { include: { user: { select: { name: true } }, class: true } },
        feeStructure: true
      },
      orderBy: { paymentDate: 'desc' }
    });

    const settings = await prisma.schoolSettings.findFirst();
    const schoolName = settings?.schoolName || 'JY School';
    const schoolAddress = settings?.address || '123 Education Street, Knowledge City';

    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=Fee_Report.pdf');
    doc.pipe(res);

    // Banner
    doc.rect(40, 30, 515, 60).fill('#1e1b4b');
    doc.fillColor('#ffffff').fontSize(16).font('Helvetica-Bold').text(schoolName.toUpperCase(), 55, 45);
    doc.fontSize(9).font('Helvetica').fillColor('#93c5fd').text('OFFICIAL ACADEMIC SYSTEM REPORT', 55, 68);
    doc.fontSize(12).font('Helvetica-Bold').fillColor('#ffffff').text('FEES REVENUE LEDGER', 320, 48, { align: 'right', width: 220 });

    doc.fillColor('#334155').fontSize(9).font('Helvetica-Bold').text(`Transaction Period: ${start ? start.toLocaleDateString() : 'All Time'} to ${end ? end.toLocaleDateString() : 'All Time'}`, 40, 110);
    doc.font('Helvetica').text(`Print Date: ${new Date().toLocaleDateString()}`, 40, 125);

    // Table Headers
    const tableY = 150;
    doc.rect(40, tableY, 515, 20).fill('#f1f5f9');
    doc.fontSize(8).font('Helvetica-Bold').fillColor('#475569');
    doc.text('S.NO', 45, tableY + 6, { width: 20 });
    doc.text('STUDENT ID', 65, tableY + 6, { width: 55 });
    doc.text('STUDENT NAME', 120, tableY + 6, { width: 110 });
    doc.text('CLASS', 230, tableY + 6, { width: 45 });
    doc.text('FEE COMPONENT', 275, tableY + 6, { width: 80 });
    doc.text('METHOD', 355, tableY + 6, { width: 45 });
    doc.text('PAYMENT DATE', 400, tableY + 6, { width: 65 });
    doc.text('AMOUNT', 470, tableY + 6, { width: 75, align: 'right' });

    let currentY = tableY + 20;
    let index = 1;

    payments.forEach((p) => {
      if (currentY > 750) {
        doc.addPage();
        currentY = 40;
        doc.rect(40, currentY, 515, 20).fill('#f1f5f9');
        doc.fontSize(8).font('Helvetica-Bold').fillColor('#475569');
        doc.text('S.NO', 45, currentY + 6);
        doc.text('STUDENT ID', 65, currentY + 6);
        doc.text('STUDENT NAME', 120, currentY + 6);
        doc.text('CLASS', 230, currentY + 6);
        doc.text('FEE COMPONENT', 275, currentY + 6);
        doc.text('METHOD', 355, currentY + 6);
        doc.text('PAYMENT DATE', 400, currentY + 6);
        doc.text('AMOUNT', 470, currentY + 6, { align: 'right', width: 75 });
        currentY += 20;
      }

      const formattedDate = p.paymentDate ? new Date(p.paymentDate).toLocaleDateString() : '-';

      doc.fontSize(8).font('Helvetica').fillColor('#334155');
      doc.text(index.toString(), 45, currentY + 5, { width: 20 });
      doc.text(p.student.rollNo || '-', 65, currentY + 5, { width: 55 });
      doc.font('Helvetica-Bold').text(p.student.user.name, 120, currentY + 5, { width: 110 });
      doc.font('Helvetica').text(p.student.class ? `${p.student.class.name}-${p.student.class.section}` : 'N/A', 230, currentY + 5, { width: 45 });
      doc.text(p.feeStructure.name, 275, currentY + 5, { width: 80 });
      doc.text(p.method, 355, currentY + 5, { width: 45 });
      doc.text(formattedDate, 400, currentY + 5, { width: 65 });
      doc.font('Helvetica-Bold').text(`Rs. ${p.amountPaid.toLocaleString()}`, 470, currentY + 5, { width: 75, align: 'right' });

      doc.moveTo(40, currentY + 18).lineTo(555, currentY + 18).stroke('#f1f5f9');
      currentY += 18;
      index++;
    });

    doc.fontSize(7).font('Helvetica').fillColor('#cbd5e1').text(`${schoolAddress}`, 40, 800, { align: 'center', width: 515 });
    doc.end();
  } catch (error) {
    next(error);
  }
};

export const getStudentsReportPdf = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { classId } = req.query;
    const targetClass = classId ? await prisma.class.findUnique({ where: { id: classId as string } }) : null;
    const students = await prisma.student.findMany({
      where: classId ? { classId: classId as string } : {},
      include: {
        user: { select: { name: true, phone: true } },
        class: true,
      }
    });

    const settings = await prisma.schoolSettings.findFirst();
    const schoolName = settings?.schoolName || 'JY School';
    const schoolAddress = settings?.address || '123 Education Street, Knowledge City';

    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=Student_Report.pdf');
    doc.pipe(res);

    // Banner
    doc.rect(40, 30, 515, 60).fill('#1e1b4b');
    doc.fillColor('#ffffff').fontSize(16).font('Helvetica-Bold').text(schoolName.toUpperCase(), 55, 45);
    doc.fontSize(9).font('Helvetica').fillColor('#93c5fd').text('OFFICIAL ACADEMIC SYSTEM REPORT', 55, 68);
    doc.fontSize(12).font('Helvetica-Bold').fillColor('#ffffff').text('STUDENT ROSTER', 320, 48, { align: 'right', width: 220 });

    doc.fillColor('#334155').fontSize(9).font('Helvetica-Bold').text(`Class filter: ${targetClass ? `${targetClass.name}-${targetClass.section}` : 'All Students'}`, 40, 110);
    doc.font('Helvetica').text(`Total Count: ${students.length}  |  Print Date: ${new Date().toLocaleDateString()}`, 40, 125);

    // Table Headers
    const tableY = 150;
    doc.rect(40, tableY, 515, 20).fill('#f1f5f9');
    doc.fontSize(8).font('Helvetica-Bold').fillColor('#475569');
    doc.text('STUDENT ID', 50, tableY + 6, { width: 85 });
    doc.text('STUDENT NAME', 140, tableY + 6, { width: 120 });
    doc.text('CLASS', 265, tableY + 6, { width: 55 });
    doc.text('GUARDIAN NAME', 325, tableY + 6, { width: 115 });
    doc.text('GUARDIAN CONTACT', 445, tableY + 6, { width: 100 });

    let currentY = tableY + 20;

    students.forEach((s) => {
      if (currentY > 750) {
        doc.addPage();
        currentY = 40;
        doc.rect(40, currentY, 515, 20).fill('#f1f5f9');
        doc.fontSize(8).font('Helvetica-Bold').fillColor('#475569');
        doc.text('STUDENT ID', 50, currentY + 6);
        doc.text('STUDENT NAME', 140, currentY + 6);
        doc.text('CLASS', 265, currentY + 6);
        doc.text('GUARDIAN NAME', 325, currentY + 6);
        doc.text('GUARDIAN CONTACT', 445, currentY + 6);
        currentY += 20;
      }

      doc.fontSize(8).font('Helvetica').fillColor('#334155');
      doc.text(s.rollNo, 50, currentY + 5, { width: 85 });
      doc.font('Helvetica-Bold').text(s.user.name, 140, currentY + 5, { width: 120 });
      doc.font('Helvetica').text(s.class ? `${s.class.name}-${s.class.section}` : 'N/A', 265, currentY + 5, { width: 55 });
      doc.text(s.fatherName || 'N/A', 325, currentY + 5, { width: 115 });
      doc.text(s.user.phone || 'N/A', 445, currentY + 5, { width: 100 });

      doc.moveTo(40, currentY + 18).lineTo(555, currentY + 18).stroke('#f1f5f9');
      currentY += 18;
    });

    doc.fontSize(7).font('Helvetica').fillColor('#cbd5e1').text(`${schoolAddress}`, 40, 800, { align: 'center', width: 515 });
    doc.end();
  } catch (error) {
    next(error);
  }
};

// ══════════════════════════════════════════════════════════════
// NEW REPORTS — Added
// ══════════════════════════════════════════════════════════════

// ── Fee Defaulters Report ─────────────────────────────────────
export const getFeeDefaultersReport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { classId } = req.query;
    const students = await prisma.student.findMany({
      where: classId ? { classId: classId as string } : {},
      include: { user: { select: { name: true, phone: true } }, class: true, feePayments: true, feeStructures: true },
      orderBy: [{ class: { name: 'asc' } }, { rollNo: 'asc' }],
    });

    const defaulters: any[] = [];
    students.forEach(s => {
      const totalDue = s.feeStructures.reduce((sum: number, fs: any) => sum + (fs.amount || 0), 0);
      const totalPaid = s.feePayments.reduce((sum: number, fp: any) => sum + (fp.amountPaid || 0), 0);
      const pending = totalDue - totalPaid;
      if (pending > 0) {
        defaulters.push({
          'Roll No': s.rollNo,
          'Student Name': s.user.name,
          'Class': s.class ? `${s.class.name}-${s.class.section}` : 'N/A',
          'Phone': s.user.phone || 'N/A',
          'Father Name': s.fatherName || 'N/A',
          'Total Fee Due (Rs)': totalDue,
          'Amount Paid (Rs)': totalPaid,
          'Pending Amount (Rs)': pending,
        });
      }
    });
    defaulters.sort((a, b) => b['Pending Amount (Rs)'] - a['Pending Amount (Rs)']);

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(defaulters), 'Fee Defaulters');
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=Fee_Defaulters.xlsx');
    res.send(buffer);
  } catch (error) { next(error); }
};

export const getFeeDefaultersReportPdf = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { classId } = req.query;
    const students = await prisma.student.findMany({
      where: classId ? { classId: classId as string } : {},
      include: { user: { select: { name: true, phone: true } }, class: true, feePayments: true, feeStructures: true },
      orderBy: [{ class: { name: 'asc' } }, { rollNo: 'asc' }],
    });

    const defaulters: any[] = [];
    students.forEach(s => {
      const totalDue = s.feeStructures.reduce((sum: number, fs: any) => sum + (fs.amount || 0), 0);
      const totalPaid = s.feePayments.reduce((sum: number, fp: any) => sum + (fp.amountPaid || 0), 0);
      const pending = totalDue - totalPaid;
      if (pending > 0) defaulters.push({ name: s.user.name, rollNo: s.rollNo, cls: s.class ? `${s.class.name}-${s.class.section}` : 'N/A', phone: s.user.phone || 'N/A', father: s.fatherName || 'N/A', due: totalDue, paid: totalPaid, pending });
    });
    defaulters.sort((a, b) => b.pending - a.pending);

    const settings = await prisma.schoolSettings.findFirst();
    const schoolName = settings?.schoolName || 'JY School';
    const schoolAddress = settings?.address || '';

    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=Fee_Defaulters.pdf');
    doc.pipe(res);

    doc.rect(40, 30, 515, 60).fill('#7f1d1d');
    doc.fillColor('#ffffff').fontSize(16).font('Helvetica-Bold').text(schoolName.toUpperCase(), 55, 45);
    doc.fontSize(9).font('Helvetica').fillColor('#fca5a5').text('FEE MANAGEMENT REPORT', 55, 68);
    doc.fontSize(12).font('Helvetica-Bold').fillColor('#ffffff').text('FEE DEFAULTERS LIST', 310, 48, { align: 'right', width: 230 });
    doc.fillColor('#334155').fontSize(9).font('Helvetica-Bold').text(`Total Defaulters: ${defaulters.length}  |  Print Date: ${new Date().toLocaleDateString()}`, 40, 110);
    const totalPending = defaulters.reduce((sum, d) => sum + d.pending, 0);
    doc.font('Helvetica').text(`Total Pending Amount: Rs. ${totalPending.toLocaleString()}`, 40, 125);

    const tableY = 150;
    doc.rect(40, tableY, 515, 20).fill('#fee2e2');
    doc.fontSize(8).font('Helvetica-Bold').fillColor('#991b1b');
    doc.text('ROLL NO', 45, tableY + 6, { width: 60 }); doc.text('STUDENT NAME', 110, tableY + 6, { width: 130 });
    doc.text('CLASS', 245, tableY + 6, { width: 45 }); doc.text('FATHER NAME', 295, tableY + 6, { width: 100 });
    doc.text('DUE', 400, tableY + 6, { width: 55, align: 'right' }); doc.text('PAID', 460, tableY + 6, { width: 45, align: 'right' });
    doc.text('PENDING', 510, tableY + 6, { width: 45, align: 'right' });

    let cy = tableY + 20;
    defaulters.forEach((d, i) => {
      if (cy > 750) { doc.addPage(); cy = 40; }
      if (i % 2 === 0) doc.rect(40, cy, 515, 18).fill('#fff5f5');
      doc.fontSize(8).font('Helvetica').fillColor('#334155');
      doc.text(d.rollNo, 45, cy + 4, { width: 60 }); doc.font('Helvetica-Bold').text(d.name, 110, cy + 4, { width: 130 });
      doc.font('Helvetica').text(d.cls, 245, cy + 4, { width: 45 }); doc.text(d.father, 295, cy + 4, { width: 100 });
      doc.text(d.due.toLocaleString(), 400, cy + 4, { width: 55, align: 'right' }); doc.text(d.paid.toLocaleString(), 460, cy + 4, { width: 45, align: 'right' });
      doc.font('Helvetica-Bold').fillColor('#b91c1c').text(d.pending.toLocaleString(), 510, cy + 4, { width: 45, align: 'right' });
      cy += 18;
    });

    doc.fontSize(7).font('Helvetica').fillColor('#cbd5e1').text(schoolAddress, 40, 800, { align: 'center', width: 515 });
    doc.end();
  } catch (error) { next(error); }
};

// ── Staff Attendance Ledger ───────────────────────────────────
export const getStaffAttendanceReport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { month, year } = req.query;
    const now = new Date();
    const m = month ? parseInt(month as string) - 1 : now.getMonth();
    const y = year ? parseInt(year as string) : now.getFullYear();
    const start = new Date(y, m, 1);
    const end = new Date(y, m + 1, 0, 23, 59, 59);

    const records = await prisma.teacherAttendance.findMany({
      where: { date: { gte: start, lte: end } },
      include: { teacher: { include: { user: { select: { name: true } } } } },
    });

    const staffMap: { [tid: string]: any } = {};
    records.forEach(r => {
      if (!staffMap[r.teacherId]) staffMap[r.teacherId] = { name: r.teacher.user.name, present: 0, absent: 0, late: 0, halfDay: 0, total: 0 };
      staffMap[r.teacherId].total++;
      const s = r.status.toUpperCase();
      if (s === 'PRESENT') staffMap[r.teacherId].present++;
      else if (s === 'ABSENT') staffMap[r.teacherId].absent++;
      else if (s === 'LATE') staffMap[r.teacherId].late++;
      else if (s === 'HALF_DAY') staffMap[r.teacherId].halfDay++;
    });

    const reportData = Object.values(staffMap).map((s: any) => ({
      'Staff Name': s.name,
      'Total Working Days': s.total,
      'Present': s.present,
      'Absent': s.absent,
      'Late': s.late,
      'Half Day': s.halfDay,
      'Attendance %': s.total > 0 ? `${Math.round(((s.present + s.late * 0.5 + s.halfDay * 0.5) / s.total) * 100)}%` : '0%',
    }));

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(reportData), 'Staff Attendance');
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=Staff_Attendance_${y}_${m + 1}.xlsx`);
    res.send(buffer);
  } catch (error) { next(error); }
};

export const getStaffAttendanceReportPdf = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { month, year } = req.query;
    const now = new Date();
    const m = month ? parseInt(month as string) - 1 : now.getMonth();
    const y = year ? parseInt(year as string) : now.getFullYear();
    const start = new Date(y, m, 1); const end = new Date(y, m + 1, 0, 23, 59, 59);
    const monthName = start.toLocaleString('default', { month: 'long' });

    const records = await prisma.teacherAttendance.findMany({
      where: { date: { gte: start, lte: end } },
      include: { teacher: { include: { user: { select: { name: true } } } } },
    });

    const staffMap: { [tid: string]: any } = {};
    records.forEach(r => {
      if (!staffMap[r.teacherId]) staffMap[r.teacherId] = { name: r.teacher.user.name, present: 0, absent: 0, late: 0, halfDay: 0, total: 0 };
      staffMap[r.teacherId].total++;
      const s = r.status.toUpperCase();
      if (s === 'PRESENT') staffMap[r.teacherId].present++;
      else if (s === 'ABSENT') staffMap[r.teacherId].absent++;
      else if (s === 'LATE') staffMap[r.teacherId].late++;
      else if (s === 'HALF_DAY') staffMap[r.teacherId].halfDay++;
    });

    const data = Object.values(staffMap);
    const settings = await prisma.schoolSettings.findFirst();
    const schoolName = settings?.schoolName || 'JY School';
    const schoolAddress = settings?.address || '';

    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Staff_Attendance_${y}_${m + 1}.pdf`);
    doc.pipe(res);

    doc.rect(40, 30, 515, 60).fill('#1e3a5f');
    doc.fillColor('#ffffff').fontSize(16).font('Helvetica-Bold').text(schoolName.toUpperCase(), 55, 45);
    doc.fontSize(9).font('Helvetica').fillColor('#93c5fd').text('HR MANAGEMENT REPORT', 55, 68);
    doc.fontSize(12).font('Helvetica-Bold').fillColor('#ffffff').text('STAFF ATTENDANCE LEDGER', 290, 48, { align: 'right', width: 250 });
    doc.fillColor('#334155').fontSize(9).font('Helvetica-Bold').text(`Month: ${monthName} ${y}  |  Total Staff: ${data.length}`, 40, 110);
    doc.font('Helvetica').text(`Print Date: ${new Date().toLocaleDateString()}`, 40, 125);

    const tableY = 150;
    doc.rect(40, tableY, 515, 20).fill('#dbeafe');
    doc.fontSize(8).font('Helvetica-Bold').fillColor('#1e3a8a');
    doc.text('STAFF NAME', 45, tableY + 6, { width: 170 }); doc.text('TOTAL', 220, tableY + 6, { width: 50, align: 'right' });
    doc.text('PRESENT', 275, tableY + 6, { width: 55, align: 'right' }); doc.text('ABSENT', 335, tableY + 6, { width: 50, align: 'right' });
    doc.text('LATE', 390, tableY + 6, { width: 45, align: 'right' }); doc.text('HALF DAY', 440, tableY + 6, { width: 55, align: 'right' });
    doc.text('RATE %', 500, tableY + 6, { width: 50, align: 'right' });

    let cy = tableY + 20;
    data.forEach((s: any, i: number) => {
      if (cy > 750) { doc.addPage(); cy = 40; }
      if (i % 2 === 0) doc.rect(40, cy, 515, 18).fill('#eff6ff');
      const rate = s.total > 0 ? Math.round(((s.present + s.late * 0.5 + s.halfDay * 0.5) / s.total) * 100) : 0;
      doc.fontSize(8).font('Helvetica-Bold').fillColor('#334155').text(s.name, 45, cy + 4, { width: 170 });
      doc.font('Helvetica').text(s.total.toString(), 220, cy + 4, { width: 50, align: 'right' });
      doc.fillColor('#047857').text(s.present.toString(), 275, cy + 4, { width: 55, align: 'right' });
      doc.fillColor('#b91c1c').text(s.absent.toString(), 335, cy + 4, { width: 50, align: 'right' });
      doc.fillColor('#d97706').text(s.late.toString(), 390, cy + 4, { width: 45, align: 'right' });
      doc.fillColor('#7c3aed').text(s.halfDay.toString(), 440, cy + 4, { width: 55, align: 'right' });
      doc.font('Helvetica-Bold').fillColor(rate < 75 ? '#b91c1c' : '#047857').text(`${rate}%`, 500, cy + 4, { width: 50, align: 'right' });
      cy += 18;
    });

    doc.fontSize(7).font('Helvetica').fillColor('#cbd5e1').text(schoolAddress, 40, 800, { align: 'center', width: 515 });
    doc.end();
  } catch (error) { next(error); }
};

// ── Admission Summary ─────────────────────────────────────────
export const getAdmissionSummaryReport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { academicYear } = req.query;
    const where: any = {};
    if (academicYear) where.academicYear = academicYear as string;
    const admissions = await prisma.admissionInquiry.findMany({ where, orderBy: { createdAt: 'desc' } });

    const reportData = admissions.map((a: any) => ({
      'Adm No': a.regNo || a.id.slice(0, 8).toUpperCase(),
      'Student Name': a.studentName || 'N/A',
      'Class Applied': a.classApplied || 'N/A',
      'Father Name': a.fatherName || 'N/A',
      'Phone': a.fatherPhone || a.phone || 'N/A',
      'Gender': a.gender || 'N/A',
      'Caste': a.caste || 'N/A',
      'Academic Year': a.academicYear || 'N/A',
      'Annual Fee': a.admissionFee ? `Rs.${Number(a.admissionFee).toLocaleString()}` : 'N/A',
      'Payment Status': a.paymentStatus || 'N/A',
      'Date': a.createdAt ? new Date(a.createdAt).toLocaleDateString('en-IN') : 'N/A',
    }));

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(reportData), 'Admissions');
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=Admission_Summary.xlsx');
    res.send(buffer);
  } catch (error) { next(error); }
};

export const getAdmissionSummaryReportPdf = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { academicYear } = req.query;
    const where: any = {};
    if (academicYear) where.academicYear = academicYear as string;
    const admissions = await prisma.admissionInquiry.findMany({ where, orderBy: { createdAt: 'desc' } });
    const settings = await prisma.schoolSettings.findFirst();
    const schoolName = settings?.schoolName || 'JY School';
    const schoolAddress = settings?.address || '';

    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=Admission_Summary.pdf');
    doc.pipe(res);

    doc.rect(40, 30, 515, 60).fill('#14532d');
    doc.fillColor('#ffffff').fontSize(16).font('Helvetica-Bold').text(schoolName.toUpperCase(), 55, 45);
    doc.fontSize(9).font('Helvetica').fillColor('#86efac').text('ADMISSIONS MANAGEMENT REPORT', 55, 68);
    doc.fontSize(12).font('Helvetica-Bold').fillColor('#ffffff').text('ADMISSION SUMMARY', 310, 48, { align: 'right', width: 230 });
    doc.fillColor('#334155').fontSize(9).font('Helvetica-Bold').text(`Academic Year: ${academicYear || 'All Years'}  |  Total: ${admissions.length}`, 40, 110);
    doc.font('Helvetica').text(`Print Date: ${new Date().toLocaleDateString()}`, 40, 125);

    const tableY = 150;
    doc.rect(40, tableY, 515, 20).fill('#dcfce7');
    doc.fontSize(8).font('Helvetica-Bold').fillColor('#14532d');
    doc.text('ADM NO', 45, tableY + 6, { width: 70 }); doc.text('STUDENT NAME', 120, tableY + 6, { width: 130 });
    doc.text('CLASS', 255, tableY + 6, { width: 40 }); doc.text('FATHER NAME', 300, tableY + 6, { width: 110 });
    doc.text('PHONE', 415, tableY + 6, { width: 80 }); doc.text('GENDER', 500, tableY + 6, { width: 55 });

    let cy = tableY + 20;
    admissions.forEach((a: any, i: number) => {
      if (cy > 750) { doc.addPage(); cy = 40; }
      if (i % 2 === 0) doc.rect(40, cy, 515, 18).fill('#f0fdf4');
      doc.fontSize(8).font('Helvetica').fillColor('#334155');
      doc.text((a.regNo || a.id.slice(0, 8).toUpperCase()), 45, cy + 4, { width: 70 });
      doc.font('Helvetica-Bold').text(a.studentName || 'N/A', 120, cy + 4, { width: 130 });
      doc.font('Helvetica').text(a.classApplied || 'N/A', 255, cy + 4, { width: 40 });
      doc.text(a.fatherName || 'N/A', 300, cy + 4, { width: 110 }); doc.text(a.fatherPhone || a.phone || 'N/A', 415, cy + 4, { width: 80 });
      doc.text(a.gender || 'N/A', 500, cy + 4, { width: 55 }); cy += 18;
    });

    doc.fontSize(7).font('Helvetica').fillColor('#cbd5e1').text(schoolAddress, 40, 800, { align: 'center', width: 515 });
    doc.end();
  } catch (error) { next(error); }
};

// ── Class Toppers ─────────────────────────────────────────────
export const getClassToppersReport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { examId, topN } = req.query;
    if (!examId) { res.status(400).json({ success: false, message: 'examId required' }); return; }
    const limit = parseInt((topN as string) || '10');

    const marks = await prisma.mark.findMany({
      where: { examId: examId as string },
      include: { student: { include: { user: { select: { name: true } }, class: true } } },
    });

    const studentMap: { [id: string]: any } = {};
    marks.forEach(m => {
      if (!studentMap[m.studentId]) studentMap[m.studentId] = { rollNo: m.student.rollNo, name: m.student.user.name, cls: m.student.class ? `${m.student.class.name}-${m.student.class.section}` : 'N/A', total: 0, max: 0 };
      studentMap[m.studentId].total += m.marksObtained;
      studentMap[m.studentId].max += m.maxMarks;
    });

    const sorted = Object.values(studentMap).sort((a: any, b: any) => b.total - a.total).slice(0, limit);
    const reportData = sorted.map((s: any, i: number) => ({
      'Rank': i + 1, 'Student Name': s.name, 'Roll No': s.rollNo, 'Class': s.cls,
      'Total Marks': s.total, 'Max Marks': s.max,
      'Percentage': s.max > 0 ? `${Math.round((s.total / s.max) * 100)}%` : '0%',
    }));

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(reportData), 'Class Toppers');
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=Class_Toppers.xlsx');
    res.send(buffer);
  } catch (error) { next(error); }
};

// ── Gate Pass Log ─────────────────────────────────────────────
export const getGatePassReport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { startDate, endDate, classId } = req.query;
    const start = startDate ? new Date(startDate as string) : new Date(new Date().setDate(1));
    const end = endDate ? new Date(endDate as string) : new Date();

    const gatePasses = await prisma.gatePass.findMany({
      where: { createdAt: { gte: start, lte: end }, ...(classId ? { student: { classId: classId as string } } : {}) },
      include: { student: { include: { user: { select: { name: true } }, class: true } } },
      orderBy: { createdAt: 'desc' },
    });

    const reportData = gatePasses.map((g: any) => ({
      'Gate Pass No': g.id.slice(0, 8).toUpperCase(),
      'Student Name': g.student?.user?.name || 'N/A',
      'Roll No': g.student?.rollNo || 'N/A',
      'Class': g.student?.class ? `${g.student.class.name}-${g.student.class.section}` : 'N/A',
      'Reason': g.reason || 'N/A',
      'Status': g.status || 'N/A',
      'Date': g.createdAt ? new Date(g.createdAt).toLocaleDateString('en-IN') : 'N/A',
      'Out Time': g.outTime ? new Date(g.outTime).toLocaleTimeString('en-IN') : 'N/A',
      'In Time': g.inTime ? new Date(g.inTime).toLocaleTimeString('en-IN') : 'N/A',
    }));

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(reportData), 'Gate Pass Log');
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=Gate_Pass_Log.xlsx');
    res.send(buffer);
  } catch (error) { next(error); }
};
