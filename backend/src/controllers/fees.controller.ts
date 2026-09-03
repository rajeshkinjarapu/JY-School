import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth';
import { createError } from '../middlewares/errorHandler';
import { prisma } from '../utils/prisma';
import { cache } from '../utils/cache';
import { successResponse, paginatedResponse } from '../utils/response';
import PDFDocument from 'pdfkit';
import * as XLSX from 'xlsx';
import { clearDashboardCache } from './dashboard.controller';
import { Role } from '../types/enums';
import { sendSMS } from '../utils/sms';
import { createSystemNotification } from './notifications.controller';

export const bulkImportFees = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  if (!req.file) return next(createError('No file uploaded', 400));
  try {
    const workbook = req.file.buffer 
      ? XLSX.read(req.file.buffer, { type: 'buffer' })
      : XLSX.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const results = XLSX.utils.sheet_to_json<any>(workbook.Sheets[sheetName]);

    let successCount = 0;
    let errorCount = 0;

    for (const row of results) {
      const studentId = row['Student ID'] || row.studentId;
      const term = 'Annual';
      const name = 'Tuition Fee';
      const amount = parseFloat(row.Amount || row.amount);
      const dueDate = new Date();

      if (!amount || isNaN(amount)) {
        errorCount++;
        continue;
      }

      if (studentId) {
        // Assign fee to a specific student
        const student = await prisma.student.findUnique({ where: { rollNo: studentId.toString() } });
        if (student) {
          await prisma.feeStructure.create({
            data: { studentId: student.id, term, name, amount, dueDate, classId: null },
          });
          successCount++;
        } else {
          errorCount++;
        }
      } else {
        errorCount++; // We are skipping class-level bulk import for now to keep it simple, expecting Student ID
      }
    }

    successResponse(res, { success: successCount, failed: errorCount }, 'Bulk import completed');
  } catch (error) {
    next(createError('Error processing excel file', 500));
  }
};

export const getStructures = async (req: AuthRequest, res: Response): Promise<void> => {
  const classId = (req.query.classId as string) || '';
  const term = (req.query.term as string) || '';
  const studentId = (req.query.studentId as string) || '';

  const cacheKey = `fee-structures:${classId}:${studentId}:${term}`;
  const cached = await cache.get<any>(cacheKey);
  if (cached) { res.json({ success: true, data: cached }); return; }

  const where: any = {};
  
  if (studentId && classId) {
    where.OR = [
      { classId: classId },
      { studentId: studentId }
    ];
  } else if (studentId) {
    where.studentId = studentId;
  } else if (classId) {
    where.classId = classId;
  }

  if (term) where.term = term;

  const structures = await prisma.feeStructure.findMany({
    where,
    include: {        
        class: { select: { name: true, section: true } }, 
        student: { select: { rollNo: true, class: { select: { name: true, section: true } }, user: { select: { name: true } } } },
        _count: { select: { payments: true } } 
    },
    orderBy: { dueDate: 'asc' },
  });
  await cache.set(cacheKey, structures, 120); // 2 min cache
  successResponse(res, structures, 'Fee structures fetched');
};

export const createStructure = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const { classId, studentId, term, name, amount, dueDate } = req.body;

  if (!classId && !studentId) {
    return next(createError('Either classId or studentId is required', 400));
  }

  // Student-wise fee creation
  if (studentId) {
    const student = await prisma.student.findUnique({ where: { id: studentId } });
    if (!student) return next(createError('Student not found', 404));

    const structure = await prisma.feeStructure.create({
      data: { studentId, classId: null, term: term || 'Annual', name: name.trim(), amount, dueDate: dueDate ? new Date(dueDate) : new Date() },
    });
    successResponse(res, structure, 'Student fee created', 201);
    return;
  }

  // Class-wise fee creation
  const cls = await prisma.class.findUnique({ where: { id: classId } });
  if (!cls) return next(createError('Class not found', 404));

  // Check for duplicates (case-insensitive)
  const existingList = await prisma.feeStructure.findMany({ where: { classId, term } });
  const isDuplicate = existingList.some(f => f.name.toLowerCase().trim() === name.toLowerCase().trim());
  if (isDuplicate) {
    return next(createError(`A fee structure named '${name}' already exists for this class and term.`, 400));
  }

  const structure = await prisma.feeStructure.create({
    data: { classId, term, name: name.trim(), amount, dueDate: new Date(dueDate) },
  });
  successResponse(res, structure, 'Fee structure created', 201);
};

export const updateStructure = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const id = req.params.id as string;
  const { term, name, amount, dueDate } = req.body;
  const existing = await prisma.feeStructure.findUnique({ where: { id } });
  if (!existing) return next(createError('Fee structure not found', 404));

  // Check for duplicates (case-insensitive) if name or term is being updated
  if (name || term) {
    const existingList = await prisma.feeStructure.findMany({ 
      where: { classId: existing.classId, term: term || existing.term } 
    });
    const checkName = (name || existing.name).toLowerCase().trim();
    const isDuplicate = existingList.some(f => f.id !== id && f.name.toLowerCase().trim() === checkName);
    if (isDuplicate) {
      return next(createError(`A fee structure named '${name || existing.name}' already exists for this class and term.`, 400));
    }
  }

  const structure = await prisma.feeStructure.update({
    where: { id },
    data: { term, name: name ? name.trim() : undefined, amount, dueDate: dueDate ? new Date(dueDate) : undefined },
  });
  successResponse(res, structure, 'Fee structure updated');
};

export const deleteStructure = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const id = req.params.id as string;
  const existing = await prisma.feeStructure.findUnique({ where: { id } });
  if (!existing) return next(createError('Fee structure not found', 404));
  await prisma.feeStructure.delete({ where: { id } });
  successResponse(res, null, 'Fee structure deleted');
};

export const getPayments = async (req: AuthRequest, res: Response): Promise<void> => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const studentId = (req.query.studentId as string) || '';
  const status = (req.query.status as string) || '';
  const classId = (req.query.classId as string) || '';
  const startDate = req.query.startDate as string;
  const endDate = req.query.endDate as string;
  const skip = (page - 1) * limit;

  const cacheKey = `payments:${req.user?.id}:${page}:${limit}:${studentId}:${status}:${classId}:${startDate}:${endDate}`;
  const cached = await cache.get<any>(cacheKey);
  if (cached) return res.json(cached) as any;

  const where: any = {};
  if (studentId) {
    where.studentId = studentId;
  } else if (req.user?.role === Role.STUDENT) {
    const student = await prisma.student.findUnique({ where: { userId: req.user.id } });
    if (!student) {
      paginatedResponse(res, [], 0, page, limit, 'Payments fetched');
      return;
    }
    where.studentId = student.id;
  }
  if (status) where.status = status;
  if (classId) where.feeStructure = { classId };
  if (startDate || endDate) {
    where.paymentDate = {};
    if (startDate) where.paymentDate.gte = new Date(startDate);
    if (endDate) where.paymentDate.lte = new Date(endDate);
  }

  const [payments, total] = await Promise.all([
    prisma.feePayment.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        student: { include: { user: { select: { name: true, phone: true } }, class: { select: { name: true, section: true } } } },
        feeStructure: { select: { name: true, term: true, amount: true } },
      },
    }),
    prisma.feePayment.count({ where }),
  ]);

  const responseBody = { success: true, data: payments, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  await cache.set(cacheKey, responseBody, 60); // 1 min cache for payments
  return res.json(responseBody) as any;
};

export const createPayment = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const { studentId, feeStructureId, amountPaid, method, remarks, utrNumber, receiptUrl, payments, paymentDate } = req.body;

  const student = await prisma.student.findUnique({ 
    where: { id: studentId }, 
    include: { 
      user: true,
      class: {
        include: {
          classTeacher: { select: { userId: true } }
        }
      }
    } 
  });
  if (!student) return next(createError('Student not found', 404));

  const baseReceiptNo = 'JY' + Math.floor(10000000 + Math.random() * 90000000).toString();

  const paymentList = payments && Array.isArray(payments) && payments.length > 0 
    ? payments 
    : [{ feeStructureId, amountPaid }];

  if (paymentList.length === 0 || !paymentList[0].feeStructureId) {
    return next(createError('No fee structures selected', 400));
  }

  const createdPayments = await prisma.$transaction(async (tx) => {
    const results = [];
    let idx = 1;
    for (const p of paymentList) {
      const structure = await tx.feeStructure.findUnique({ where: { id: p.feeStructureId } });
      if (!structure) continue;
      
      const previousPayments = await tx.feePayment.aggregate({
        where: { studentId, feeStructureId: p.feeStructureId },
        _sum: { amountPaid: true },
      });
      const alreadyPaid = previousPayments._sum.amountPaid || 0;
      
      // GUARD: Skip if already fully paid to prevent duplicate payments
      if (alreadyPaid >= structure.amount) {
        continue;
      }

      // Cap the payment at the remaining amount
      const remaining = structure.amount - alreadyPaid;
      const actualAmount = Math.min(Number(p.amountPaid), remaining);

      const totalPaid = alreadyPaid + actualAmount;
      const status = req.user?.role === 'TEACHER' 
        ? 'PENDING' 
        : (totalPaid >= structure.amount ? 'PAID' : 'PARTIAL');
      
      const payment = await tx.feePayment.create({
        data: { 
          studentId, 
          feeStructureId: p.feeStructureId, 
          amountPaid: actualAmount, 
          method: method || 'CASH', 
          status: status as any, 
          remarks,
          utrNumber: utrNumber || null,
          receiptUrl: receiptUrl || null,
          receiptNo: paymentList.length > 1 ? `${baseReceiptNo}-${idx}` : baseReceiptNo,
          paymentDate: paymentDate ? new Date(paymentDate) : new Date()
        },
        include: {
          student: { include: { user: { select: { name: true } } } },
          feeStructure: { select: { name: true, term: true } },
        },
      });
      results.push(payment);
      idx++;
    }
    return results;
  });

  if (createdPayments.length === 0) {
    return next(createError('All selected fees are already fully paid', 400));
  }

  try {
    const totalAmount = createdPayments.reduce((sum, p) => sum + p.amountPaid, 0);

    // 1. Send SMS to parent if phone exists
    if (student.user && student.user.phone) {
      const smsMessage = `Dear parent, We have received fee payment of Rs.${totalAmount} for your child ${student.user.name}. Thanking you, SVJY SCHOOL`;
      await sendSMS(student.user.phone, smsMessage, '1707175316314375479');
    }

    // 2. Dispatch Notifications & Web Push Alerts (Super Admin, Admin, Class Teacher, Student)
    const studentName = student.user?.name || 'Student';
    const className = student.class ? `${student.class.name}-${student.class.section}` : '';
    const receiptNo = createdPayments[0]?.receiptNo || '';
    const recorderName = req.user?.name || 'System';
    const notifTitle = `💰 Fee Payment Received: ₹${totalAmount}`;
    const notifMsg = `Fee payment of ₹${totalAmount} received for student ${studentName}${className ? ` in class ${className}` : ''}. \n\nReceipt: #${receiptNo}\nPayment Method: ${method}\nRecorded by: ${recorderName}.`;

    // Notify Super Admin
    createSystemNotification({
      role: 'SUPER_ADMIN',
      title: notifTitle,
      message: notifMsg,
      type: 'FEES',
      link: `/students/${studentId}/pay-fee`
    });

    // Notify Admin
    createSystemNotification({
      role: 'ADMIN',
      title: notifTitle,
      message: notifMsg,
      type: 'FEES',
      link: `/students/${studentId}/pay-fee`
    });

    // Notify Student / Parent
    if (student.userId) {
      createSystemNotification({
        userId: student.userId,
        title: notifTitle,
        message: notifMsg,
        type: 'FEES',
        link: '/finance'
      });
    }

    // Notify Class Teacher
    if (student.class?.classTeacher?.userId) {
      createSystemNotification({
        userId: student.class.classTeacher.userId,
        title: notifTitle,
        message: notifMsg,
        type: 'FEES',
        link: `/students/${studentId}/pay-fee`
      });
    }
  } catch (error) {
    console.error('Failed to send fee notifications/SMS:', error);
  }

  clearDashboardCache();
  successResponse(res, createdPayments.length === 1 ? createdPayments[0] : createdPayments, 'Payment(s) recorded', 201);
};

export const bulkImportPayments = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  if (!req.file) return next(createError('No file uploaded', 400));
  try {
    const workbook = req.file.buffer
      ? XLSX.read(req.file.buffer, { type: 'buffer', cellDates: true })
      : XLSX.readFile(req.file.path, { cellDates: true });
    const sheetName = workbook.SheetNames[0];
    const rows = XLSX.utils.sheet_to_json<any>(workbook.Sheets[sheetName]);

    const results: { row: number; rollNo: string; status: string; receiptNo?: string; error?: string }[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rollNo = String(row['Student ID'] || row['Roll No'] || row['RollNo'] || row['studentId'] || row['rollNo'] || '').trim();
      const amountPaid = parseFloat(row['Amount Paid'] || row['amountPaid'] || row['Amount'] || row['amount'] || '0');
      const rawMethod = String(row['Payment Mode'] || row['Payment Method'] || row['paymentMode'] || row['method'] || 'CASH').trim().toUpperCase();
      const method = ['CASH', 'UPI', 'ONLINE', 'BANK_TRANSFER', 'CHEQUE'].includes(rawMethod) ? rawMethod : 'CASH';
      const rawDate = row['Payment Date'] || row['paymentDate'] || row['Date'] || row['date'];
      let paymentDate: Date | null = null;
      if (rawDate !== undefined && rawDate !== null && rawDate !== '') {
        if (typeof rawDate === 'number') {
          paymentDate = new Date(Math.round((rawDate - 25569) * 86400 * 1000));
        } else if (rawDate instanceof Date && !isNaN(rawDate.getTime())) {
          paymentDate = rawDate;
        } else {
          let d = new Date(rawDate);
          if (isNaN(d.getTime())) {
            const parts = String(rawDate).split(/[-/]/);
            if (parts.length === 3) {
              const day = parseInt(parts[0], 10);
              const month = parseInt(parts[1], 10) - 1;
              const year = parseInt(parts[2], 10);
              if (year < 100) {
                 d = new Date(2000 + year, month, day);
              } else {
                 d = new Date(year, month, day);
              }
            }
          }
          if (!isNaN(d.getTime())) paymentDate = d;
        }
      }

      if (!paymentDate || isNaN(paymentDate.getTime()) || paymentDate.getFullYear() === 1970) {
        results.push({ row: i + 2, rollNo, status: 'ERROR', error: 'Valid Payment Date is required' });
        continue;
      }

      if (!rollNo) {
        results.push({ row: i + 2, rollNo: '-', status: 'ERROR', error: 'Student ID / Roll No is missing' });
        continue;
      }
      if (!amountPaid || isNaN(amountPaid) || amountPaid <= 0) {
        results.push({ row: i + 2, rollNo, status: 'ERROR', error: 'Invalid amount paid' });
        continue;
      }

      // Lookup student by rollNo
      const student = await prisma.student.findFirst({ where: { rollNo } });
      if (!student) {
        results.push({ row: i + 2, rollNo, status: 'ERROR', error: `Student with Roll No "${rollNo}" not found` });
        continue;
      }

      // Get all fee structures applicable to this student
      const structures = await prisma.feeStructure.findMany({
        where: {
          OR: [
            { studentId: student.id },
            ...(student.classId ? [{ classId: student.classId }] : []),
          ],
        },
        orderBy: { dueDate: 'asc' },
      });

      // Calculate pending amount across all structures
      let remaining = amountPaid;
      const baseReceiptNo = 'JY' + Math.floor(10000000 + Math.random() * 90000000).toString();
      let createdCount = 0;
      let idx = 1;

      for (const structure of structures) {
        if (remaining <= 0) break;

        const agg = await prisma.feePayment.aggregate({
          where: { studentId: student.id, feeStructureId: structure.id },
          _sum: { amountPaid: true },
        });
        const alreadyPaid = agg._sum.amountPaid || 0;
        const pending = Math.max(0, structure.amount - alreadyPaid);
        if (pending <= 0) continue;

        const toApply = Math.min(remaining, pending);
        const totalPaid = alreadyPaid + toApply;
        const status = totalPaid >= structure.amount ? 'PAID' : 'PARTIAL';
        const receiptNo = structures.length > 1 ? `${baseReceiptNo}-${idx}` : baseReceiptNo;

        await prisma.feePayment.create({
          data: {
            studentId: student.id,
            feeStructureId: structure.id,
            amountPaid: toApply,
            method: method as any,
            status: status as any,
            receiptNo,
            paymentDate: isNaN(paymentDate.getTime()) ? new Date() : paymentDate,
            remarks: 'Imported via Excel',
          },
        });

        remaining -= toApply;
        createdCount++;
        idx++;
      }

      if (createdCount === 0 && remaining === amountPaid) {
        results.push({ row: i + 2, rollNo, status: 'SKIPPED', error: 'All fees already fully paid for this student' });
      } else {
        results.push({
          row: i + 2,
          rollNo,
          status: 'SUCCESS',
          receiptNo: baseReceiptNo,
        });
      }
    }

    clearDashboardCache();

    const successCount = results.filter(r => r.status === 'SUCCESS').length;
    const errorCount = results.filter(r => r.status === 'ERROR').length;
    const skippedCount = results.filter(r => r.status === 'SKIPPED').length;

    successResponse(res, { summary: { total: rows.length, success: successCount, errors: errorCount, skipped: skippedCount }, results }, 'Bulk payment import completed');
  } catch (error) {
    next(createError('Error processing Excel file', 500));
  }
};

export const deleteFeePayment = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const id = req.params.id as string;
  const payment = await prisma.feePayment.findUnique({ where: { id } });
  if (!payment) return next(createError('Fee payment not found', 404));

  await prisma.feePayment.delete({ where: { id } });
  clearDashboardCache();
  successResponse(res, null, 'Fee payment deleted successfully');
};

// --- Fee Group Controllers ---
export const getFeeGroups = async (req: AuthRequest, res: Response): Promise<void> => {
  const groups = await prisma.feeGroup.findMany({ include: { feeHeads: true } });
  successResponse(res, groups, 'Fee groups fetched');
};

export const createFeeGroup = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const { name, description } = req.body;
  if (!name) return next(createError('Name is required', 400));
  try {
    const group = await prisma.feeGroup.create({ data: { name, description } });
    successResponse(res, group, 'Fee group created', 201);
  } catch (error: any) {
    if (error.code === 'P2002') return next(createError('Fee group already exists', 400));
    next(error);
  }
};

export const deleteFeeGroup = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    await prisma.feeGroup.delete({ where: { id: req.params.id } });
    successResponse(res, null, 'Fee group deleted');
  } catch {
    next(createError('Fee group not found or cannot be deleted', 400));
  }
};

// --- Fee Head Controllers ---
export const getFeeHeads = async (req: AuthRequest, res: Response): Promise<void> => {
  const heads = await prisma.feeHead.findMany({ include: { group: true } });
  successResponse(res, heads, 'Fee heads fetched');
};

export const createFeeHead = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const { name, groupId, description } = req.body;
  if (!name) return next(createError('Name is required', 400));
  const head = await prisma.feeHead.create({ data: { name, groupId, description } });
  successResponse(res, head, 'Fee head created', 201);
};

export const deleteFeeHead = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    await prisma.feeHead.delete({ where: { id: req.params.id } });
    successResponse(res, null, 'Fee head deleted');
  } catch {
    next(createError('Fee head not found', 400));
  }
};

// --- Fee Concession Controllers ---
export const getFeeConcessions = async (req: AuthRequest, res: Response): Promise<void> => {
  const concessions = await prisma.feeConcession.findMany();
  successResponse(res, concessions, 'Fee concessions fetched');
};

export const createFeeConcession = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const { name, type, value } = req.body;
  if (!name || !type || value === undefined) return next(createError('All fields required', 400));
  const concession = await prisma.feeConcession.create({ data: { name, type, value: Number(value) } });
  successResponse(res, concession, 'Fee concession created', 201);
};

export const deleteFeeConcession = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    await prisma.feeConcession.delete({ where: { id: req.params.id } });
    successResponse(res, null, 'Fee concession deleted');
  } catch {
    next(createError('Fee concession not found', 400));
  }
};

export const updateFeePayment = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { amountPaid, method, remarks, status, receiptNo, paymentDate } = req.body;
    
    const payment = await prisma.feePayment.findUnique({ where: { id } });
    if (!payment) return next(createError('Fee payment not found', 404));

    const updatedPayment = await prisma.feePayment.update({
      where: { id },
      data: {
        amountPaid: amountPaid !== undefined ? Number(amountPaid) : payment.amountPaid,
        method: method || payment.method,
        remarks: remarks !== undefined ? remarks : payment.remarks,
        receiptNo: receiptNo !== undefined ? receiptNo : payment.receiptNo,
        paymentDate: paymentDate ? new Date(paymentDate) : payment.paymentDate,
        status: status || payment.status
      }
    });

    clearDashboardCache();
    successResponse(res, updatedPayment, 'Fee payment updated successfully');
  } catch (error) {
    next(error);
  }
};

export const getStudentFeeStatus = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const studentId = req.params.studentId as string;
  const student = await prisma.student.findUnique({ where: { id: studentId } });
  if (!student) return next(createError('Student not found', 404));

  const structures = await prisma.feeStructure.findMany({
    where: { 
      OR: [
        { classId: student.classId || '', studentId: null },
        { studentId: student.id }
      ]
    },
    orderBy: { dueDate: 'asc' },
  });

  const structureIds = structures.map(s => s.id);

  const [allPayments, allDiscounts] = await Promise.all([
    prisma.feePayment.findMany({
      where: { studentId, feeStructureId: { in: structureIds } },
      orderBy: { paymentDate: 'desc' },
    }),
    prisma.feeDiscount.findMany({
      where: { studentId, feeStructureId: { in: structureIds } }
    })
  ]);

  const paymentsMap = allPayments.reduce((acc, p) => {
    if (!acc[p.feeStructureId]) acc[p.feeStructureId] = [];
    acc[p.feeStructureId].push(p);
    return acc;
  }, {} as Record<string, any[]>);

  const discountsMap = allDiscounts.reduce((acc, d) => {
    acc[d.feeStructureId] = d;
    return acc;
  }, {} as Record<string, any>);

  const result = structures.map((structure) => {
    const payments = paymentsMap[structure.id] || [];
    const discountRecord = discountsMap[structure.id];
    
    const discount = discountRecord ? discountRecord.amount : 0;
    
    const amountPaid = payments.reduce((s, p) => s + p.amountPaid, 0);
    const effectiveAmount = structure.amount - discount;
    const amountDue = effectiveAmount - amountPaid;
    const latestPayment = payments[0];
    let status = 'PENDING';
    if (amountPaid >= effectiveAmount) status = 'PAID';
    else if (amountPaid > 0) status = 'PARTIAL';
    else if (structure.dueDate < new Date()) status = 'OVERDUE';

    return {
      feeStructure: structure,
      originalAmount: structure.amount,
      discount,
      effectiveAmount,
      amountDue: Math.max(0, amountDue),
      amountPaid,
      status,
      paymentDate: latestPayment?.paymentDate || null,
    };
  });

  successResponse(res, result, 'Fee status fetched');
};

export const applyFeeDiscount = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { studentId, feeStructureId, discountAmount, remarks } = req.body;
    
    if (discountAmount === undefined || discountAmount === null) {
      return next(createError('Discount amount is required', 400));
    }

    const discount = await prisma.feeDiscount.upsert({
      where: {
        studentId_feeStructureId: { studentId, feeStructureId }
      },
      update: {
        amount: Number(discountAmount),
        remarks
      },
      create: {
        studentId,
        feeStructureId,
        amount: Number(discountAmount),
        remarks
      }
    });

    clearDashboardCache();
    successResponse(res, discount, 'Fee discount applied successfully');
  } catch (error) {
    next(error);
  }
};

export const getOverdue = async (_req: AuthRequest, res: Response): Promise<void> => {
  const now = new Date();
  const structures = await prisma.feeStructure.findMany({
    where: { dueDate: { lt: now } },
    include: { class: { select: { name: true, section: true } } },
  });

  const result = [];
  const classIds = structures.map(s => s.classId).filter(Boolean) as string[];
  const studentIds = structures.map(s => s.studentId).filter(Boolean) as string[];
  const structureIds = structures.map(s => s.id);

  if (structures.length === 0) {
    successResponse(res, result, 'Overdue fees fetched');
    return;
  }

  const [allStudents, allPayments] = await Promise.all([
    prisma.student.findMany({
      where: {
        OR: [
          { classId: { in: classIds } },
          { id: { in: studentIds } }
        ]
      },
      include: { user: { select: { name: true, email: true } } }
    }),
    prisma.feePayment.groupBy({
      by: ['studentId', 'feeStructureId'],
      where: { feeStructureId: { in: structureIds } },
      _sum: { amountPaid: true }
    })
  ]);

  const paymentMap = allPayments.reduce((acc, p) => {
    acc[`${p.studentId}_${p.feeStructureId}`] = p._sum.amountPaid || 0;
    return acc;
  }, {} as Record<string, number>);

  for (const structure of structures) {
    const applicableStudents = structure.studentId
      ? allStudents.filter(s => s.id === structure.studentId)
      : allStudents.filter(s => s.classId === structure.classId);

    for (const student of applicableStudents) {
      const paid = paymentMap[`${student.id}_${structure.id}`] || 0;
      if (paid < structure.amount) {
        result.push({
          student: { id: student.id, rollNo: student.rollNo, name: student.user?.name, email: student.user?.email },
          feeStructure: structure,
          amountPaid: paid,
          amountDue: structure.amount - paid,
          status: paid > 0 ? 'PARTIAL' : 'OVERDUE',
        });
      }
    }
  }

  successResponse(res, result, 'Overdue fees fetched');
};

export const downloadInvoice = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const paymentId = req.params.paymentId as string;
  const payment = await prisma.feePayment.findUnique({
    where: { id: paymentId },
    include: {
      student: { include: { user: { select: { name: true, email: true } }, class: true } },
      feeStructure: true,
    },
  }) as any;
  if (!payment) return next(createError('Payment not found', 404));

  const settings = await prisma.schoolSettings.findFirst();
  const schoolName = settings?.schoolName || 'JY School';
  const schoolAddress = settings?.address || '123 Education Street, Knowledge City';
  const schoolPhone = settings?.phone || '+91-9876543210';
  const schoolEmail = settings?.email || 'info@school.com';
  const schoolWebsite = settings?.website || 'https://school.com';

  // Modern Minimalist Professional Design for White Paper
  const doc = new PDFDocument({ margin: 50, size: 'A4' });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=invoice-${payment.receiptNo}.pdf`);
  doc.pipe(res);

  const primaryColor = '#1e1b4b'; // Deep Indigo
  const accentColor = '#6366f1'; // Indigo 500
  const textColor = '#1e293b'; // Slate 800
  const mutedColor = '#64748b'; // Slate 500
  const borderColor = '#e2e8f0'; // Slate 200

  // Top Accent Bar (Thin, elegant)
  doc.rect(0, 0, 595, 8).fill(primaryColor);
  
  // School Info
  doc.fontSize(22).font('Helvetica-Bold').fillColor(primaryColor).text(schoolName.toUpperCase(), 50, 45);
  doc.fontSize(9).font('Helvetica').fillColor(mutedColor).text(schoolWebsite, 50, 72);
  
  // Receipt Title & Meta
  doc.fontSize(16).font('Helvetica-Bold').fillColor(primaryColor).text('PAYMENT RECEIPT', 380, 45, { align: 'right', width: 165 });
  doc.fontSize(10).font('Helvetica-Bold').fillColor(accentColor).text(`No: ${payment.receiptNo}`, 380, 65, { align: 'right', width: 165 });
  doc.fontSize(9).font('Helvetica').fillColor(mutedColor).text(`Date: ${payment.paymentDate.toLocaleDateString('en-IN')}`, 380, 80, { align: 'right', width: 165 });

  // Subtle separator
  doc.moveTo(50, 110).lineTo(545, 110).stroke(borderColor);

  // Billing Details (Two Columns)
  doc.fontSize(8).font('Helvetica-Bold').fillColor(mutedColor).text('ISSUED TO', 50, 130, { characterSpacing: 1 });
  doc.fontSize(12).font('Helvetica-Bold').fillColor(textColor).text(payment.student.user.name, 50, 145);
  doc.fontSize(10).font('Helvetica').fillColor(mutedColor).text(`ID: ${payment.student.rollNo}`, 50, 162);
  doc.fontSize(10).font('Helvetica').fillColor(mutedColor).text(`Class: ${payment.student.class ? `${payment.student.class.name}-${payment.student.class.section}` : 'N/A'}`, 50, 177);

  doc.fontSize(8).font('Helvetica-Bold').fillColor(mutedColor).text('PAYMENT INFO', 350, 130, { characterSpacing: 1 });
  doc.fontSize(10).font('Helvetica-Bold').fillColor(textColor).text(`Method: ${payment.method.toUpperCase()}`, 350, 145);
  if (payment.method === 'UPI' && payment.utrNumber) {
    doc.fontSize(10).font('Helvetica').fillColor(mutedColor).text(`UTR: ${payment.utrNumber}`, 350, 162);
  }
  doc.fontSize(10).font('Helvetica').fillColor(mutedColor).text(`Status: ${payment.status}`, 350, payment.method === 'UPI' && payment.utrNumber ? 177 : 162);

  // Table Structure
  const tableTop = 230;
  
  // Table Header
  doc.rect(50, tableTop, 495, 28).fill('#f8fafc');
  doc.fontSize(9).font('Helvetica-Bold').fillColor(mutedColor);
  doc.text('DESCRIPTION', 65, tableTop + 10, { characterSpacing: 1 });
  doc.text('AMOUNT DUE', 330, tableTop + 10, { align: 'right', width: 100, characterSpacing: 1 });
  doc.text('AMOUNT PAID', 440, tableTop + 10, { align: 'right', width: 90, characterSpacing: 1 });

  // Table Row
  const rowY = tableTop + 45;
  doc.fontSize(11).font('Helvetica-Bold').fillColor(textColor).text(payment.feeStructure.name, 65, rowY);
  doc.fontSize(11).font('Helvetica').fillColor(mutedColor).text(`Rs. ${payment.feeStructure.amount.toLocaleString('en-IN')}`, 330, rowY, { align: 'right', width: 100 });
  doc.fontSize(11).font('Helvetica-Bold').fillColor(textColor).text(`Rs. ${payment.amountPaid.toLocaleString('en-IN')}`, 440, rowY, { align: 'right', width: 90 });

  // Divider Line
  const lineY = rowY + 30;
  doc.moveTo(50, lineY).lineTo(545, lineY).stroke(borderColor);

  // Total Section
  const totalY = lineY + 15;
  doc.fontSize(12).font('Helvetica-Bold').fillColor(primaryColor).text('TOTAL PAID', 330, totalY, { align: 'right', width: 100 });
  doc.fontSize(14).font('Helvetica-Bold').fillColor(accentColor).text(`Rs. ${payment.amountPaid.toLocaleString('en-IN')}`, 440, totalY - 1, { align: 'right', width: 90 });

  // Status Stamp / Box
  const stampY = totalY + 40;
  doc.rect(430, stampY, 100, 28).fill(payment.status === 'PAID' ? '#ecfdf5' : '#fffbeb');
  doc.fontSize(10).font('Helvetica-Bold').fillColor(payment.status === 'PAID' ? '#059669' : '#d97706').text(payment.status === 'PAID' ? 'SUCCESS / PAID' : 'PARTIAL / PENDING', 430, stampY + 9, { align: 'center', width: 100 });

  // Remarks Note
  if (payment.remarks) {
    doc.fontSize(9).font('Helvetica-Bold').fillColor(mutedColor).text('Remarks:', 50, totalY);
    doc.fontSize(9).font('Helvetica').fillColor(mutedColor).text(payment.remarks, 50, totalY + 15, { width: 250, lineGap: 3 });
  }

  // Footer (Bottom of page)
  const footerY = 750;
  doc.moveTo(50, footerY - 15).lineTo(545, footerY - 15).stroke(borderColor);
  doc.fontSize(8).font('Helvetica-Bold').fillColor(primaryColor).text('THANK YOU FOR YOUR PAYMENT', 50, footerY, { align: 'center', width: 495 });
  doc.fontSize(8).font('Helvetica').fillColor(mutedColor).text('This is a computer generated document. No signature is required.', 50, footerY + 15, { align: 'center', width: 495 });
  doc.fontSize(8).font('Helvetica').fillColor(mutedColor).text(`${schoolAddress} | ${schoolPhone} | ${schoolEmail}`, 50, footerY + 30, { align: 'center', width: 495 });

  doc.end();
};

export const getPendingBalances = async (req: AuthRequest, res: Response): Promise<void> => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const classId = (req.query.classId as string) || '';
  const search = (req.query.search as string) || '';

  const where: any = {};
  if (classId && classId !== 'ALL') where.classId = classId;
  if (search) {
    where.OR = [
      { user: { name: { contains: search, mode: 'insensitive' } } },
      { rollNo: { contains: search, mode: 'insensitive' } },
    ];
  }

  const allStudents = await prisma.student.findMany({
    where,
    select: {
      id: true,
      rollNo: true,
      classId: true,
      user: { select: { name: true, phone: true } },
      class: { select: { name: true, section: true } },
      feePayments: { 
        where: { status: 'PAID' },
        select: { feeStructureId: true, amountPaid: true }
      }
    }
  });

  const classIds = [...new Set(allStudents.map((s: any) => s.classId).filter(Boolean))] as string[];
  const studentIds = allStudents.map((s: any) => s.id);
  
  const structures = await prisma.feeStructure.findMany({
    where: {
      OR: [
        { classId: { in: classIds } },
        { studentId: { in: studentIds } }
      ]
    },
    select: { id: true, name: true, amount: true, classId: true, studentId: true }
  });

  const pendingStudents = [];
  for (const student of allStudents) {
    const studentStructures = structures.filter((st: any) => 
      st.studentId === student.id || (st.classId === student.classId && !st.studentId)
    );
    const tuitionStructure = studentStructures.find((st: any) => st.name?.toLowerCase().includes('tuition')) || studentStructures[0];
    const tuitionFeeAmount = tuitionStructure?.amount || 0;

    let paidAmount = 0;
    if (tuitionStructure) {
      paidAmount = student.feePayments
        .filter((p: any) => p.feeStructureId === tuitionStructure.id)
        .reduce((sum: number, p: any) => sum + (p.amountPaid || 0), 0);
    }

    const balance = tuitionFeeAmount - paidAmount;
    if (balance > 0) {
      pendingStudents.push({
        id: student.rollNo || '-',
        name: student.user?.name || '-',
        className: student.class ? `${student.class.name}-${student.class.section}` : '-',
        tuitionFee: tuitionFeeAmount,
        paidAmount,
        balance,
        phone: student.user?.phone || '',
      });
    }
  }

  const total = pendingStudents.length;
  const skip = (page - 1) * limit;
  const paginatedData = pendingStudents.slice(skip, skip + limit);

  paginatedResponse(res, paginatedData, total, page, limit, 'Pending balances fetched');
};

// ============================================================================
// STUDENT FEE PAYMENT & ADMIN VERIFICATION
// ============================================================================

export const studentPayFee = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    let { studentId, feeStructureId, amountPaid, amount, method, paymentMethod, utrNumber, referenceNumber } = req.body;
    
    // Auto-resolve studentId from logged in user if not explicitly sent in body
    if (!studentId && req.user?.id) {
      const student = await prisma.student.findFirst({ where: { userId: req.user.id } });
      if (student) {
        studentId = student.id;
      }
    }

    const finalAmount = amountPaid || amount;
    const finalMethod = method || paymentMethod || 'ONLINE';
    const finalUtr = utrNumber || referenceNumber;

    if (!studentId || !finalAmount) {
      return next(createError('Missing required fields (Student or Amount)', 400));
    }

    let screenshotUrl = null;
    if (req.file) {
      screenshotUrl = `/uploads/${req.file.filename}`;
    }

    const payment = await prisma.feePayment.create({
      data: {
        studentId,
        feeStructureId: (feeStructureId && feeStructureId !== 'undefined' && feeStructureId !== 'null') ? feeStructureId : null,
        amountPaid: parseFloat(finalAmount),
        method: finalMethod,
        utrNumber: finalUtr || null,
        screenshotUrl,
        status: 'PENDING',
      },
    });

    successResponse(res, payment, 'Payment submitted for admin approval');
  } catch (error) {
    console.error('Fee payment error:', error);
    next(createError('Error submitting fee payment', 500));
  }
};

export const getPendingApprovals = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const [total, pending] = await Promise.all([
      prisma.feePayment.count({ where: { status: 'PENDING' } }),
      prisma.feePayment.findMany({
        where: { status: 'PENDING' },
        include: {
          student: { select: { rollNo: true, user: { select: { name: true } }, class: { select: { name: true, section: true } } } },
          feeStructure: { select: { name: true, amount: true } }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      })
    ]);

    paginatedResponse(res, pending, total, page, limit, 'Pending approvals fetched');
  } catch (error) {
    next(createError('Error fetching pending approvals', 500));
  }
};

export const approveFeePayment = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { paymentId } = req.params;
    const { status, remarks } = req.body; // status can be PAID or REJECTED

    if (!['PAID', 'REJECTED'].includes(status)) {
      return next(createError('Invalid status. Must be PAID or REJECTED', 400));
    }

    const payment = await prisma.feePayment.update({
      where: { id: paymentId },
      data: {
        status,
        remarks,
        verifiedBy: req.user?.id,
      },
      include: {
        student: { select: { user: { select: { name: true, phone: true } } } }
      }
    });

    if (status === 'PAID') {
      await clearDashboardCache();
      // Optional: send SMS to student
      // if (payment.student?.user?.phone) {
      //   await sendSMS(payment.student.user.phone, `Your fee payment of Rs.${payment.amountPaid} has been approved.`);
      // }
    }

    successResponse(res, payment, `Payment ${status.toLowerCase()} successfully`);
  } catch (error) {
    next(createError('Error updating payment status', 500));
  }
};
