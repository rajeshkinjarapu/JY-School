import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth';
import { prisma } from '../utils/prisma';
import { successResponse } from '../utils/response';
import { sortClasses } from '../utils/sortClasses';
import { Role, Gender, AttendanceStatus } from '../types/enums';

// Simple in-memory cache to speed up the dashboard
const cache: { [key: string]: { data: any; expiry: number } } = {};

export const clearDashboardCache = () => {
  Object.keys(cache).forEach(key => {
    if (
      key.startsWith('admin_dashboard') ||
      key === 'dashboard:stats' ||
      key === 'dashboard:recent_activities' ||
      key.startsWith('students:list:')
    ) {
      delete cache[key];
    }
  });
};

export const getAdminDashboard = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const academicYear = (req.query.academicYear as string) || '';
    const cacheKey = `admin_dashboard_${academicYear || 'all'}`;
    const nowMs = Date.now();
    const isRefresh = req.query.refresh === 'true';
    if (!isRefresh && cache[cacheKey] && cache[cacheKey].expiry > nowMs) {
      successResponse(res, cache[cacheKey].data, 'Admin dashboard data fetched from cache');
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
    twelveMonthsAgo.setDate(1);
    twelveMonthsAgo.setHours(0, 0, 0, 0);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const studentCountWhere = academicYear ? { class: { academicYear } } : {};
    const classCountWhere = academicYear ? { academicYear } : {};
    const studentFilterWhere = academicYear ? { student: { class: { academicYear } } } : {};

    // Run independent database queries & SQL aggregates in parallel
    const [
      totalStudents,
      totalTeachers,
      totalClasses,
      revenueResult,
      classes,
      todayAttendanceGroups,
      todayTeacherAttendanceGroups,
      monthlyFeeRows,
      genderGroups,
      recentPaymentsRaw,
      recentAnnouncements,
      weekAttendanceRows,
      totalAppInstalls
    ] = await Promise.all([
      prisma.student.count({ where: studentCountWhere }),
      prisma.teacher.count(),
      prisma.class.count({ where: classCountWhere }),
      prisma.feePayment.aggregate({
        where: studentFilterWhere,
        _sum: { amountPaid: true }
      }),
      prisma.class.findMany({ 
        where: classCountWhere,
        select: { id: true, name: true, section: true, academicYear: true, _count: { select: { students: true } } } 
      }).then(sortClasses),
      prisma.attendance.groupBy({
        by: ['status'],
        where: {
          date: { gte: today, lt: tomorrow },
          ...(academicYear ? { class: { academicYear } } : {})
        },
        _count: { _all: true }
      }),
      prisma.teacherAttendance.groupBy({
        by: ['status'],
        where: { date: { gte: today, lt: tomorrow } },
        _count: { _all: true }
      }),
      academicYear
        ? prisma.$queryRaw<any[]>`
            SELECT DATE_TRUNC('month', fp."paymentDate") AS month_start, COALESCE(SUM(fp."amountPaid"), 0)::float8 AS total
            FROM "FeePayment" fp
            INNER JOIN "Student" s ON s.id = fp."studentId"
            INNER JOIN "Class" c ON c.id = s."classId"
            WHERE fp."paymentDate" >= ${twelveMonthsAgo} AND c."academicYear" = ${academicYear}
            GROUP BY 1
          `.catch((): any[] => [])
        : prisma.$queryRaw<any[]>`
            SELECT DATE_TRUNC('month', "paymentDate") AS month_start, COALESCE(SUM("amountPaid"), 0)::float8 AS total
            FROM "FeePayment"
            WHERE "paymentDate" >= ${twelveMonthsAgo}
            GROUP BY 1
          `.catch((): any[] => []),
      prisma.student.groupBy({
        by: ['gender'],
        _count: { _all: true },
        where: studentCountWhere
      }),
      prisma.feePayment.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        where: studentFilterWhere,
        include: {
          student: { include: { user: { select: { id: true, name: true, photoUrl: true } }, class: { select: { name: true, section: true } } } },
          feeStructure: { select: { name: true } }
        }
      }),
      prisma.announcement.findMany({
        take: 3,
        orderBy: { createdAt: 'desc' },
        where: { isActive: true }
      }),
      academicYear
        ? prisma.$queryRaw<any[]>`
            SELECT DATE_TRUNC('day', a."date") AS att_day, a."status", COUNT(*)::int AS cnt
            FROM "Attendance" a
            INNER JOIN "Class" c ON c.id = a."classId"
            WHERE a."date" >= ${sevenDaysAgo} AND c."academicYear" = ${academicYear}
            GROUP BY 1, 2
          `.catch((): any[] => [])
        : prisma.$queryRaw<any[]>`
            SELECT DATE_TRUNC('day', "date") AS att_day, "status", COUNT(*)::int AS cnt
            FROM "Attendance"
            WHERE "date" >= ${sevenDaysAgo}
            GROUP BY 1, 2
          `.catch((): any[] => []),
      prisma.user.count({
        where: {
          role: Role.STUDENT,
          isAppInstalled: true,
          ...(academicYear ? { student: { class: { academicYear } } } : {})
        }
      })
    ]);

    const totalRevenue = revenueResult._sum.amountPaid || 0;

    // Convert any inline base64 photoUrl in recentPayments to lightweight /photo route
    const recentPayments = recentPaymentsRaw.map((p: any) => {
      const u = p.student?.user;
      if (u && typeof u.photoUrl === 'string' && u.photoUrl.startsWith('data:image')) {
        return {
          ...p,
          student: {
            ...p.student,
            user: { ...u, photoUrl: `/api/users/${u.id}/photo` }
          }
        };
      }
      return p;
    });

    const enrollmentByClass = classes.map(c => ({
      name: `${c.name}-${c.section}`,
      count: c._count.students
    }));

    // Live Student Attendance calculation from grouped counts
    let studentTotalMarked = 0;
    let studentPresentCount = 0;
    let studentAbsentCount = 0;
    let studentLeaveCount = 0;
    todayAttendanceGroups.forEach((g: any) => {
      const count = Number(g._count?._all || 0);
      studentTotalMarked += count;
      if (g.status === AttendanceStatus.PRESENT || g.status === AttendanceStatus.LATE) {
        studentPresentCount += count;
      } else if (g.status === AttendanceStatus.ABSENT) {
        studentAbsentCount += count;
      } else if (g.status === AttendanceStatus.EXCUSED) {
        studentLeaveCount += count;
      }
    });
    // Keep the dashboard aligned with the Attendance Dashboard: unmarked students
    // remain part of the school's total until their attendance is recorded.
    const attendanceToday = totalStudents > 0 ? Math.round((studentPresentCount / totalStudents) * 100) : 0;

    // Live Teacher Attendance calculation from grouped counts
    let teacherTotalMarked = 0;
    let teacherPresentCount = 0;
    let teacherAbsentCount = 0;
    let teacherLeaveCount = 0;
    todayTeacherAttendanceGroups.forEach((g: any) => {
      const count = Number(g._count?._all || 0);
      teacherTotalMarked += count;
      if (g.status === 'PRESENT' || g.status === 'LATE') {
        teacherPresentCount += count;
      } else if (g.status === 'ABSENT') {
        teacherAbsentCount += count;
      } else if (g.status === 'HALF_DAY') {
        teacherLeaveCount += count;
      }
    });
    const isTeacherAttendanceMarked = teacherTotalMarked > 0;
    const teacherAttendancePercentage = isTeacherAttendanceMarked ? Math.round((teacherPresentCount / teacherTotalMarked) * 100) : 0;

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyCollectionMap: { [key: string]: number } = {};
    for (let i = 0; i < 12; i++) {
      const d = new Date();
      d.setUTCMonth(d.getUTCMonth() - i);
      const key = `${months[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
      monthlyCollectionMap[key] = 0;
    }

    (monthlyFeeRows || []).forEach((row: any) => {
      if (!row.month_start) return;
      const d = new Date(row.month_start);
      const key = `${months[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
      if (monthlyCollectionMap[key] !== undefined) {
        monthlyCollectionMap[key] += Number(row.total || 0);
      }
    });

    const monthlyFeeCollection = Object.keys(monthlyCollectionMap)
      .map(month => ({ month, amount: monthlyCollectionMap[month] }))
      .reverse();

    const genderDistribution = { male: 0, female: 0, other: 0 };
    genderGroups.forEach(g => {
      if (g.gender === Gender.MALE) genderDistribution.male = g._count._all;
      else if (g.gender === Gender.FEMALE) genderDistribution.female = g._count._all;
      else if (g.gender === Gender.OTHER) genderDistribution.other = g._count._all;
    });

    const dayTrendMap: { [dayKey: string]: { present: number; absent: number } } = {};
    (weekAttendanceRows || []).forEach((row: any) => {
      if (!row.att_day) return;
      const d = new Date(row.att_day);
      const dayKey = `${d.getUTCFullYear()}-${d.getUTCMonth()}-${d.getUTCDate()}`;
      if (!dayTrendMap[dayKey]) dayTrendMap[dayKey] = { present: 0, absent: 0 };
      const cnt = Number(row.cnt || 0);
      if (row.status === AttendanceStatus.PRESENT || row.status === AttendanceStatus.LATE) {
        dayTrendMap[dayKey].present += cnt;
      } else if (row.status === AttendanceStatus.ABSENT) {
        dayTrendMap[dayKey].absent += cnt;
      }
    });

    const attendanceTrend = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setUTCDate(d.getUTCDate() - i);
      const dayKey = `${d.getUTCFullYear()}-${d.getUTCMonth()}-${d.getUTCDate()}`;
      const bucket = dayTrendMap[dayKey] || { present: 0, absent: 0 };
      attendanceTrend.push({
        date: `${d.getUTCDate()} ${months[d.getUTCMonth()]}`,
        present: bucket.present,
        absent: bucket.absent
      });
    }

    const responseData = {
      totalStudents,
      totalTeachers,
      totalClasses,
      totalRevenue,
      enrollmentByClass,
      attendanceToday,
      studentAttendance: {
        totalMarked: studentTotalMarked,
        present: studentPresentCount,
        absent: studentAbsentCount,
        leave: studentLeaveCount,
        percentage: attendanceToday,
        isMarked: studentTotalMarked > 0
      },
      teacherAttendance: {
        totalMarked: teacherTotalMarked,
        totalTeachers,
        present: teacherPresentCount,
        absent: teacherAbsentCount,
        leave: teacherLeaveCount,
        percentage: teacherAttendancePercentage,
        isMarked: isTeacherAttendanceMarked
      },
      monthlyFeeCollection,
      genderDistribution,
      recentPayments,
      recentAnnouncements,
      attendanceTrend,
      todayBirthdays: [],
      upcomingBirthdays: [],
      thisMonthBirthdays: [],
      totalAppInstalls
    };

    // Cache for 3 minutes (180000 ms) to make dashboard lightning fast
    cache[cacheKey] = {
      data: responseData,
      expiry: Date.now() + 180000
    };

    successResponse(res, responseData, 'Admin dashboard data fetched successfully');
  } catch (error) {
    next(error);
  }
};

export const getTeacherDashboard = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const teacher = await prisma.teacher.findUnique({
      where: { userId: req.user!.id },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true, photoUrl: true } }
      }
    });
    if (!teacher) {
      res.status(404).json({ success: false, message: 'Teacher profile not found' });
      return;
    }

    // Assigned Classes with student count
    const assignedClasses = await prisma.classSubjectTeacher.findMany({
      where: { teacherId: teacher.id },
      include: {
        class: {
          include: {
            _count: { select: { students: true } }
          }
        },
        subject: true
      }
    });

    const classIds = Array.from(new Set(assignedClasses.map(ac => ac.classId)));

    const totalStudents = await prisma.student.count({
      where: {
        classId: { in: classIds }
      }
    });
    // Today's Attendance summary for assigned classes
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Current month for teacher's own attendance
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    const [todayAttendance, todayTeacherAttendance, recentHomework, myAttendanceThisMonth, pendingSalary, timetableToday, announcements] = await Promise.all([
      prisma.attendance.findMany({
        where: {
          classId: { in: classIds },
          date: { gte: today, lt: tomorrow }
        }
      }),
      prisma.teacherAttendance.findMany({ where: { date: { gte: today, lt: tomorrow } }, select: { status: true } }).catch(() => []),
      (prisma as any).homework.findMany({
        where: { teacherId: teacher.id },
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          class: { select: { name: true, section: true } },
          subject: { select: { name: true } },
        },
      }).catch(() => []),
      (prisma as any).teacherAttendance.findMany({
        where: { teacherId: teacher.id, date: { gte: monthStart } }
      }).catch(() => []),
      (prisma as any).salary.findFirst({
        where: {
          teacherId: teacher.id,
          month: today.getMonth() + 1,
          year: today.getFullYear(),
          status: 'PENDING'
        }
      }).catch(() => null),
      prisma.timetable.findMany({
        where: {
          teacherId: teacher.id,
          day: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][new Date().getDay()]
        },
        include: {
          class: true,
          subject: true
        },
        orderBy: { startTime: 'asc' }
      }),
      prisma.announcement.findMany({
        take: 5,
        where: {
          isActive: true,
          OR: [
            { targetRoles: '' },
            { targetRoles: { contains: Role.TEACHER } }
          ]
        },
        include: {
          reads: { where: { userId: req.user!.id } }
        },
        orderBy: { createdAt: 'desc' }
      })
    ]);

    // Live Student Attendance calculation
    const studentTotalMarked = todayAttendance.length;
    const studentPresentCount = todayAttendance.filter(a => a.status === AttendanceStatus.PRESENT || a.status === AttendanceStatus.LATE).length;
    const studentAbsentCount = todayAttendance.filter(a => a.status === AttendanceStatus.ABSENT).length;
    const studentLeaveCount = todayAttendance.filter(a => a.status === AttendanceStatus.EXCUSED).length;
    const attendanceToday = studentTotalMarked > 0 ? Math.round((studentPresentCount / studentTotalMarked) * 100) : 0;

    // Live Teacher Attendance calculation
    const teacherTotalMarked = todayTeacherAttendance.length;
    const teacherPresentCount = todayTeacherAttendance.filter(t => t.status === 'PRESENT' || t.status === 'LATE').length;
    const teacherAbsentCount = todayTeacherAttendance.filter(t => t.status === 'ABSENT').length;
    const teacherLeaveCount = todayTeacherAttendance.filter(t => t.status === 'HALF_DAY').length;
    const isTeacherAttendanceMarked = teacherTotalMarked > 0;
    const teacherAttendancePercentage = isTeacherAttendanceMarked ? Math.round((teacherPresentCount / teacherTotalMarked) * 100) : 0;

    const todayAttendanceSummary = {
      total: studentTotalMarked,
      present: studentPresentCount,
      absent: studentAbsentCount,
      leave: studentLeaveCount,
      rate: studentTotalMarked > 0 ? Math.round((studentPresentCount / studentTotalMarked) * 100) : 0
    };


    // My attendance stats this month
    const myPresent = myAttendanceThisMonth.filter((a: any) => a.status === 'PRESENT' || a.status === 'LATE').length;
    const myTotal = myAttendanceThisMonth.length;
    const myAttendanceRate = myTotal > 0 ? Math.round((myPresent / myTotal) * 100) : 0;

    successResponse(res, {
      teacherProfile: {
        id: teacher.id,
        name: (teacher as any).user.name,
        email: (teacher as any).user.email,
        phone: (teacher as any).user.phone,
        photoUrl: (teacher as any).user.photoUrl,
        employeeId: teacher.employeeId,
        qualification: teacher.qualification,
        specialization: teacher.specialization,
      },
      assignedClasses: assignedClasses.map(ac => ({
        classId: ac.classId,
        className: `${ac.class.name}-${ac.class.section}`,
        subjectName: ac.subject.name,
        subjectCode: ac.subject.code,
        studentCount: ac.class._count.students
      })),
      totalStudents,
      todayAttendanceSummary,
      timetableToday,
      announcements: announcements.map(a => ({
        ...a,
        hasRead: a.reads.length > 0
      })),
      recentHomework,
      myAttendance: {
        present: myPresent,
        total: myTotal,
        rate: myAttendanceRate,
        records: myAttendanceThisMonth,
      },
      pendingSalary: pendingSalary ? {
        month: (pendingSalary as any).month,
        year: (pendingSalary as any).year,
        netSalary: (pendingSalary as any).netSalary,
        status: (pendingSalary as any).status,
      } : null,
    }, 'Teacher dashboard data fetched successfully');
  } catch (error) {
    next(error);
  }
};


export const getStudentDashboard = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const student = await prisma.student.findUnique({
      where: { userId: req.user!.id },
      include: {
        class: true,
        user: { select: { name: true, email: true, phone: true, photoUrl: true } }
      }
    });
    if (!student) {
      res.status(404).json({ success: false, message: 'Student profile not found' });
      return;
    }

    // Attendance rate last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const currentDay = days[new Date().getDay()];

    // Run all student dashboard queries in parallel
    const [
      attendanceRecords,
      recentMarks,
      upcomingExams,
      structures,
      payments,
      timetableToday,
      announcements,
      admitCards,
      recentHomework
    ] = await Promise.all([
      prisma.attendance.findMany({
        where: {
          studentId: student.id,
          date: { gte: thirtyDaysAgo }
        },
        select: { status: true }
      }),
      prisma.mark.findMany({
        where: { studentId: student.id },
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          subject: true,
          exam: true
        }
      }),
      student.classId ? prisma.exam.findMany({
        where: {
          classes: { some: { id: student.classId } },
          examDate: { gte: new Date() }
        },
        take: 5,
        orderBy: { examDate: 'asc' }
      }) : Promise.resolve([]),
      student.classId ? prisma.feeStructure.findMany({
        where: { classId: student.classId },
        select: { amount: true }
      }) : Promise.resolve([]),
      student.classId ? prisma.feePayment.findMany({
        where: { studentId: student.id },
        select: { amountPaid: true }
      }) : Promise.resolve([]),
      student.classId ? prisma.timetable.findMany({
        where: {
          classId: student.classId,
          day: currentDay
        },
        include: {
          subject: true,
          teacher: { include: { user: { select: { name: true } } } }
        },
        orderBy: { startTime: 'asc' }
      }) : Promise.resolve([]),
      prisma.announcement.findMany({
        take: 5,
        where: {
          isActive: true,
          OR: [
            { targetRoles: '' },
            { targetRoles: { contains: Role.STUDENT } }
          ]
        },
        include: {
          reads: { where: { userId: req.user!.id } }
        },
        orderBy: { createdAt: 'desc' }
      }),
      student.classId ? prisma.exam.findMany({
        where: {
          classes: { some: { id: student.classId } },
          admitCardPublished: true
        },
        include: {
          examPlans: { include: { subject: true }, orderBy: { examDate: 'asc' } }
        }
      }) : Promise.resolve([]),
      student.classId ? prisma.homework.findMany({
        where: { classId: student.classId },
        include: { subject: { select: { name: true } }, teacher: { include: { user: { select: { name: true } } } } },
        orderBy: { createdAt: 'desc' },
        take: 5
      }) : Promise.resolve([])
    ]);

    const totalDays = attendanceRecords.length;
    const presentDays = attendanceRecords.filter(r => r.status === AttendanceStatus.PRESENT || r.status === AttendanceStatus.LATE).length;
    const attendancePercentage = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 100;

    let feeStatus = { totalDue: 0, totalPaid: 0, status: 'NO_FEES' };
    if (student.classId) {
      const totalDue = structures.reduce((sum, s) => sum + s.amount, 0);
      const totalPaid = payments.reduce((sum, p) => sum + p.amountPaid, 0);

      feeStatus = {
        totalDue,
        totalPaid,
        status: totalPaid === 0 && totalDue > 0 ? 'UNPAID' : totalPaid >= totalDue ? 'PAID' : 'PARTIAL'
      };
    }

    const { medicalInfo, ...studentWithoutMedical } = student;

    successResponse(res, {
      student: studentWithoutMedical,
      attendancePercentage,
      recentMarks: recentMarks.map(m => ({
        examName: m.exam.name,
        subjectName: m.subject.name,
        marksObtained: m.marksObtained,
        maxMarks: m.maxMarks,
        grade: m.grade,
        remarks: m.remarks
      })),
      upcomingExams,
      feeStatus,
      timetableToday,
      announcements: announcements.map(a => ({
        ...a,
        hasRead: a.reads.length > 0
      })),
      recentHomework,
      admitCards
    }, 'Student dashboard data fetched successfully');
  } catch (error) {
    next(error);
  }
};


export const getAccountantDashboard = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const revenueResult = await prisma.feePayment.aggregate({
      _sum: { amountPaid: true }
    });
    const totalCollected = revenueResult._sum.amountPaid || 0;

    const structures = await prisma.feeStructure.findMany({
      include: { class: { include: { _count: { select: { students: true } } } } }
    });
    let totalExpected = 0;
    structures.forEach(fs => {
      const studentCount = fs.class?._count.students || 0;
      totalExpected += fs.amount * studentCount;
    });

    const pendingDues = Math.max(0, totalExpected - totalCollected);

    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
    twelveMonthsAgo.setDate(1);
    twelveMonthsAgo.setHours(0, 0, 0, 0);

    const payments = await prisma.feePayment.findMany({
      where: { paymentDate: { gte: twelveMonthsAgo } }
    });

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyCollectionMap: { [key: string]: number } = {};
    for (let i = 0; i < 12; i++) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = `${months[d.getMonth()]} ${d.getFullYear()}`;
      monthlyCollectionMap[key] = 0;
    }

    payments.forEach(p => {
      const d = new Date(p.paymentDate);
      const key = `${months[d.getMonth()]} ${d.getFullYear()}`;
      if (monthlyCollectionMap[key] !== undefined) {
        monthlyCollectionMap[key] += p.amountPaid;
      }
    });

    const monthlyCollection = Object.keys(monthlyCollectionMap)
      .map(month => ({ month, amount: monthlyCollectionMap[month] }))
      .reverse();

    const cashCount = await prisma.feePayment.count({ where: { method: 'CASH' } });
    const onlineCount = await prisma.feePayment.count({ where: { method: 'ONLINE' } });
    const bankTransferCount = await prisma.feePayment.count({ where: { method: 'BANK_TRANSFER' } });
    const chequeCount = await prisma.feePayment.count({ where: { method: 'CHEQUE' } });

    const paymentModes = {
      cash: cashCount,
      online: onlineCount,
      bankTransfer: bankTransferCount,
      cheque: chequeCount
    };

    const recentPayments = await prisma.feePayment.findMany({
      take: 12,
      orderBy: { paymentDate: 'desc' },
      include: {
        student: { include: { user: { select: { name: true, photoUrl: true } } } },
        feeStructure: { select: { name: true } }
      }
    });

    const now = new Date();
    const overdueInvoicesCount = await prisma.feeStructure.count({
      where: { dueDate: { lt: now } }
    });

    // Top 5 overdue payments
    const overduePayments: any[] = [];
    const pastStructures = await prisma.feeStructure.findMany({
      where: { dueDate: { lt: now } },
      take: 5,
      include: { class: { select: { name: true, section: true } } }
    });
    for (const struct of pastStructures) {
      const studentsInClass = await prisma.student.findMany({
        where: { classId: struct.classId },
        include: { user: { select: { name: true } } }
      });
      for (const stud of studentsInClass) {
        const paidSum = await prisma.feePayment.aggregate({
          where: { studentId: stud.id, feeStructureId: struct.id },
          _sum: { amountPaid: true }
        });
        const paid = paidSum._sum.amountPaid || 0;
        if (paid < struct.amount) {
          overduePayments.push({
            studentId: stud.id,
            studentName: stud.user.name,
            rollNo: stud.rollNo,
            className: `${struct.class.name}-${struct.class.section}`,
            feeName: struct.name,
            amountDue: struct.amount - paid,
            dueDate: struct.dueDate
          });
        }
        if (overduePayments.length >= 5) break;
      }
      if (overduePayments.length >= 5) break;
    }

    // Fee Structure Collection Summary
    const structureSummary: any[] = [];
    const activeStructures = await prisma.feeStructure.findMany({
      include: { class: { select: { name: true, section: true } } }
    });
    for (const fs of activeStructures) {
      const totalPaid = await prisma.feePayment.aggregate({
        where: { feeStructureId: fs.id },
        _sum: { amountPaid: true }
      });
      const collected = totalPaid._sum.amountPaid || 0;
      const studentsCount = await prisma.student.count({ where: { classId: fs.classId } });
      const target = fs.amount * studentsCount;
      const pending = Math.max(0, target - collected);

      structureSummary.push({
        id: fs.id,
        name: fs.name,
        className: fs.class ? `${fs.class.name}-${fs.class.section}` : 'N/A',
        collected,
        pending,
        target
      });
    }

    successResponse(res, {
      totalCollected,
      pendingDues,
      totalExpected,
      monthlyCollection,
      paymentModes,
      recentPayments,
      overdueInvoicesCount,
      overduePayments,
      structureSummary
    }, 'Accountant dashboard data fetched successfully');
  } catch (error) {
    next(error);
  }
};
