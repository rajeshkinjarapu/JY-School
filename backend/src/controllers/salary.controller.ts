import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth';
import { prisma } from '../utils/prisma';
import { successResponse } from '../utils/response';
import { createError } from '../middlewares/errorHandler';

/* ── GET salary records ── */
export const getSalaries = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { month, year, teacherId, status } = req.query;
    const role = req.user!.role;
    let where: any = {};

    if (role === 'TEACHER') {
      const teacher = await prisma.teacher.findUnique({ where: { userId: req.user!.id } });
      if (!teacher) return next(createError('Teacher not found', 404));
      where.teacherId = teacher.id;
    } else {
      if (teacherId) where.teacherId = teacherId as string;
    }

    if (month) where.month = parseInt(month as string);
    if (year) where.year = parseInt(year as string);
    if (status) where.status = status as string;

    const salaries = await prisma.salary.findMany({
      where,
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
      include: {
        teacher: {
          include: { user: { select: { id: true, name: true, email: true, photoUrl: true } } }
        }
      },
    });

    successResponse(res, salaries, 'Salaries fetched');
  } catch (e) { next(e); }
};

/* ── GET single salary ── */
export const getSalaryById = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const salary = await prisma.salary.findUnique({
      where: { id: req.params.id },
      include: {
        teacher: { include: { user: { select: { name: true, email: true, photoUrl: true, phone: true } } } }
      },
    });
    if (!salary) return next(createError('Salary record not found', 404));
    successResponse(res, salary, 'Salary fetched');
  } catch (e) { next(e); }
};

/* ── CREATE salary record (Admin/HR) ── */
export const createSalary = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { teacherId, month, year, basicSalary, allowances, deductions, remarks } = req.body;
    if (!teacherId || !month || !year || basicSalary === undefined) {
      return next(createError('teacherId, month, year, basicSalary are required', 400));
    }

    const allowancesNum = parseFloat(allowances) || 0;
    const deductionsNum = parseFloat(deductions) || 0;
    const netSalary = parseFloat(basicSalary) + allowancesNum - deductionsNum;

    const salary = await prisma.salary.create({
      data: {
        teacherId,
        month: parseInt(month),
        year: parseInt(year),
        basicSalary: parseFloat(basicSalary),
        allowances: allowancesNum,
        deductions: deductionsNum,
        netSalary,
        remarks,
      },
      include: {
        teacher: { include: { user: { select: { name: true } } } }
      },
    });

    successResponse(res, salary, 'Salary record created', 201);
  } catch (e: any) {
    if (e.code === 'P2002') return next(createError('Salary record already exists for this teacher/month/year', 409));
    next(e);
  }
};

/* ── UPDATE salary record ── */
export const updateSalary = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { basicSalary, allowances, deductions, status, remarks } = req.body;
    const existing = await prisma.salary.findUnique({ where: { id: req.params.id } });
    if (!existing) return next(createError('Salary record not found', 404));

    const basic = basicSalary !== undefined ? parseFloat(basicSalary) : existing.basicSalary;
    const allow = allowances !== undefined ? parseFloat(allowances) : existing.allowances;
    const deduct = deductions !== undefined ? parseFloat(deductions) : existing.deductions;
    const net = basic + allow - deduct;

    const updated = await prisma.salary.update({
      where: { id: req.params.id },
      data: {
        basicSalary: basic,
        allowances: allow,
        deductions: deduct,
        netSalary: net,
        ...(status && { status }),
        ...(status === 'PAID' && !existing.paidOn && { paidOn: new Date() }),
        ...(remarks !== undefined && { remarks }),
      },
      include: {
        teacher: { include: { user: { select: { name: true } } } }
      },
    });

    successResponse(res, updated, 'Salary updated');
  } catch (e) { next(e); }
};

/* ── Mark salary as PAID ── */
export const markSalaryPaid = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const existing = await prisma.salary.findUnique({ where: { id: req.params.id } });
    if (!existing) return next(createError('Salary record not found', 404));

    const updated = await prisma.salary.update({
      where: { id: req.params.id },
      data: { status: 'PAID', paidOn: new Date() },
      include: {
        teacher: { include: { user: { select: { name: true } } } }
      },
    });
    successResponse(res, updated, 'Salary marked as paid');
  } catch (e) { next(e); }
};

/* ── DELETE salary ── */
export const deleteSalary = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const existing = await prisma.salary.findUnique({ where: { id: req.params.id } });
    if (!existing) return next(createError('Salary record not found', 404));
    await prisma.salary.delete({ where: { id: req.params.id } });
    successResponse(res, null, 'Salary deleted');
  } catch (e) { next(e); }
};

/* ── GET salary summary for all teachers (current month) ── */
export const getSalarySummary = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const now = new Date();
    const month = parseInt(req.query.month as string) || now.getMonth() + 1;
    const year = parseInt(req.query.year as string) || now.getFullYear();

    const [paid, pending, totalTeachers] = await Promise.all([
      prisma.salary.count({ where: { month, year, status: 'PAID' } }),
      prisma.salary.count({ where: { month, year, status: 'PENDING' } }),
      prisma.teacher.count(),
    ]);

    const totalPaid = await prisma.salary.aggregate({
      where: { month, year, status: 'PAID' },
      _sum: { netSalary: true },
    });

    successResponse(res, {
      month, year, paid, pending, totalTeachers,
      totalPaidAmount: totalPaid._sum.netSalary || 0,
    }, 'Summary fetched');
  } catch (e) { next(e); }
};
