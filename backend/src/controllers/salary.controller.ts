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
          include: { user: { select: { id: true, name: true, email: true, photoUrl: true, phone: true } } }
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

/* ── GET Advanced Salary Analytics & KPIs ── */
export const getSalaryAnalytics = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const now = new Date();
    const month = parseInt(req.query.month as string) || now.getMonth() + 1;
    const year = parseInt(req.query.year as string) || now.getFullYear();

    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;

    const [currentSalaries, prevSalaries, allTeachers] = await Promise.all([
      prisma.salary.findMany({
        where: { month, year },
        include: { teacher: { include: { user: { select: { name: true } } } } },
      }),
      prisma.salary.findMany({
        where: { month: prevMonth, year: prevYear },
      }),
      prisma.teacher.findMany({
        include: { user: { select: { name: true } } },
      }),
    ]);

    const totalCost = currentSalaries.reduce((sum, s) => sum + s.netSalary, 0);
    const prevCost = prevSalaries.reduce((sum, s) => sum + s.netSalary, 0);
    const trendPercent = prevCost > 0 ? parseFloat((((totalCost - prevCost) / prevCost) * 100).toFixed(1)) : 0;

    const totalEmployees = currentSalaries.length > 0 ? currentSalaries.length : allTeachers.length;
    const avgSalary = currentSalaries.length > 0 ? Math.round(totalCost / currentSalaries.length) : 0;
    const pendingCount = currentSalaries.filter(s => s.status === 'PENDING').length;
    const paidCount = currentSalaries.filter(s => s.status === 'PAID').length;

    const totalBasic = currentSalaries.reduce((sum, s) => sum + s.basicSalary, 0);
    const totalAllowances = currentSalaries.reduce((sum, s) => sum + s.allowances, 0);
    const totalDeductions = currentSalaries.reduce((sum, s) => sum + s.deductions, 0);
    const totalGross = totalBasic + totalAllowances;

    // Monthly Trend (Last 6 Months)
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyTrend = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(year, month - 1 - i, 1);
      const m = d.getMonth() + 1;
      const y = d.getFullYear();
      const monthSalaries = await prisma.salary.findMany({
        where: { month: m, year: y },
        select: { netSalary: true, basicSalary: true, allowances: true },
      });
      const net = monthSalaries.reduce((acc, s) => acc + s.netSalary, 0);
      const gross = monthSalaries.reduce((acc, s) => acc + (s.basicSalary + s.allowances), 0);
      monthlyTrend.push({
        month: m,
        year: y,
        name: `${monthNames[m - 1]} ${y.toString().slice(-2)}`,
        netPayroll: net,
        grossPayroll: gross,
      });
    }

    // Department / Specialization Breakdown
    const deptMap: Record<string, { value: number; count: number }> = {};
    currentSalaries.forEach(s => {
      const dept = s.teacher.specialization || 'Teaching Staff';
      if (!deptMap[dept]) deptMap[dept] = { value: 0, count: 0 };
      deptMap[dept].value += s.netSalary;
      deptMap[dept].count += 1;
    });

    if (Object.keys(deptMap).length === 0) {
      allTeachers.forEach(t => {
        const dept = t.specialization || 'Teaching Staff';
        if (!deptMap[dept]) deptMap[dept] = { value: 0, count: 0 };
        deptMap[dept].count += 1;
        deptMap[dept].value += 25000;
      });
    }

    const departmentDistribution = Object.keys(deptMap).map(name => ({
      name,
      value: deptMap[name].value,
      count: deptMap[name].count,
    }));

    successResponse(res, {
      kpi: {
        totalPayrollCost: totalCost,
        previousMonthCost: prevCost,
        trendPercent,
        totalEmployees,
        averageSalary: avgSalary,
        pendingApprovals: pendingCount,
        paidCount,
      },
      breakdown: {
        totalBasic,
        totalAllowances,
        totalDeductions,
        totalGross,
        totalNet: totalCost,
      },
      monthlyTrend,
      departmentDistribution,
    }, 'Analytics fetched');
  } catch (e) { next(e); }
};

/* ── Process Payroll Automatically for all Teachers ── */
export const processPayroll = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { month, year, defaultBasic = 25000, defaultAllowances = 2500 } = req.body;
    if (!month || !year) return next(createError('Month and year are required', 400));

    const m = parseInt(month);
    const y = parseInt(year);

    const teachers = await prisma.teacher.findMany({
      include: {
        user: { select: { name: true } },
      },
    });

    if (teachers.length === 0) {
      return next(createError('No active teachers found to process payroll', 404));
    }

    const startDate = new Date(y, m - 1, 1);
    const endDate = new Date(y, m, 0);

    let processedCount = 0;

    for (const teacher of teachers) {
      const attendances = await prisma.teacherAttendance.findMany({
        where: {
          teacherId: teacher.id,
          date: { gte: startDate, lte: endDate },
        },
      });

      const absentCount = attendances.filter(a => a.status === 'ABSENT').length;
      const base = parseFloat(defaultBasic) || 25000;
      const allow = parseFloat(defaultAllowances) || 2500;
      
      const perDaySalary = base / 30;
      const lopDays = Math.max(0, absentCount - 2);
      const lopDeduction = Math.round(lopDays * perDaySalary);
      const standardDeductions = 1800;
      const totalDeductions = standardDeductions + lopDeduction;
      const netSalary = Math.max(0, base + allow - totalDeductions);

      await prisma.salary.upsert({
        where: {
          teacherId_month_year: {
            teacherId: teacher.id,
            month: m,
            year: y,
          },
        },
        create: {
          teacherId: teacher.id,
          month: m,
          year: y,
          basicSalary: base,
          allowances: allow,
          deductions: totalDeductions,
          netSalary,
          status: 'PENDING',
          remarks: lopDays > 0 ? `Includes Loss of Pay (${lopDays} days absent)` : 'Regular Payroll',
        },
        update: {
          basicSalary: base,
          allowances: allow,
          deductions: totalDeductions,
          netSalary,
          remarks: lopDays > 0 ? `Includes Loss of Pay (${lopDays} days absent)` : 'Regular Payroll',
        },
      });
      processedCount++;
    }

    successResponse(res, { processedCount }, `Payroll processed successfully for ${processedCount} employees`);
  } catch (e) { next(e); }
};

/* ── Bulk Mark Paid ── */
export const bulkMarkPaid = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { month, year, ids } = req.body;
    let where: any = { status: 'PENDING' };

    if (Array.isArray(ids) && ids.length > 0) {
      where.id = { in: ids };
    } else if (month && year) {
      where.month = parseInt(month);
      where.year = parseInt(year);
    } else {
      return next(createError('Please provide either record IDs or Month and Year', 400));
    }

    const updated = await prisma.salary.updateMany({
      where,
      data: {
        status: 'PAID',
        paidOn: new Date(),
      },
    });

    successResponse(res, { count: updated.count }, `${updated.count} salary records marked as PAID`);
  } catch (e) { next(e); }
};
