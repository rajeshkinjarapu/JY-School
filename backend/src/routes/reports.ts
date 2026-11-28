import { Router } from 'express';
import {
  getAttendanceReport, getAttendanceReportPdf,
  getMarksReport, getMarksReportPdf,
  getFeeReport, getFeeReportPdf,
  getStudentsReport, getStudentsReportPdf,
  getFeeDefaultersReport, getFeeDefaultersReportPdf,
  getStaffAttendanceReport, getStaffAttendanceReportPdf,
  getAdmissionSummaryReport, getAdmissionSummaryReportPdf,
  getClassToppersReport,
  getGatePassReport,
} from '../controllers/reports.controller';
import { authenticate, authorize } from '../middlewares/auth';
import { Role } from '../types/enums';

const router = Router();

router.use(authenticate);

// Attendance Reports
router.get('/attendance', authorize(Role.SUPER_ADMIN, Role.ADMIN), getAttendanceReport);
router.get('/attendance/pdf', authorize(Role.SUPER_ADMIN, Role.ADMIN), getAttendanceReportPdf);

// Marks Reports
router.get('/marks', authorize(Role.SUPER_ADMIN, Role.ADMIN), getMarksReport);
router.get('/marks/pdf', authorize(Role.SUPER_ADMIN, Role.ADMIN), getMarksReportPdf);
router.get('/toppers', authorize(Role.SUPER_ADMIN, Role.ADMIN), getClassToppersReport);

// Fee Reports
router.get('/fees', authorize(Role.SUPER_ADMIN, Role.ADMIN, 'ACCOUNTANT'), getFeeReport);
router.get('/fees/pdf', authorize(Role.SUPER_ADMIN, Role.ADMIN, 'ACCOUNTANT'), getFeeReportPdf);
router.get('/fee-defaulters', authorize(Role.SUPER_ADMIN, Role.ADMIN, 'ACCOUNTANT'), getFeeDefaultersReport);
router.get('/fee-defaulters/pdf', authorize(Role.SUPER_ADMIN, Role.ADMIN, 'ACCOUNTANT'), getFeeDefaultersReportPdf);

// Student Reports
router.get('/students', authorize(Role.SUPER_ADMIN, Role.ADMIN), getStudentsReport);
router.get('/students/pdf', authorize(Role.SUPER_ADMIN, Role.ADMIN), getStudentsReportPdf);

// Staff Attendance Reports
router.get('/staff-attendance', authorize(Role.SUPER_ADMIN, Role.ADMIN), getStaffAttendanceReport);
router.get('/staff-attendance/pdf', authorize(Role.SUPER_ADMIN, Role.ADMIN), getStaffAttendanceReportPdf);

// Admissions & Gate Pass Reports
router.get('/admissions', authorize(Role.SUPER_ADMIN, Role.ADMIN), getAdmissionSummaryReport);
router.get('/admissions/pdf', authorize(Role.SUPER_ADMIN, Role.ADMIN), getAdmissionSummaryReportPdf);
router.get('/gate-pass', authorize(Role.SUPER_ADMIN, Role.ADMIN), getGatePassReport);

export default router;
