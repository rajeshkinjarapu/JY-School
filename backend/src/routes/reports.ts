import { Router } from 'express';
import {
  getAttendanceReport, getAttendanceReportPdf,
  getMarksReport, getMarksReportPdf,
  getFeeReport, getFeeReportPdf,
  getStudentsReport, getStudentsReportPdf,
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

// Fee Reports
router.get('/fees', authorize(Role.SUPER_ADMIN, Role.ADMIN, 'ACCOUNTANT'), getFeeReport);
router.get('/fees/pdf', authorize(Role.SUPER_ADMIN, Role.ADMIN, 'ACCOUNTANT'), getFeeReportPdf);

// Student Reports
router.get('/students', authorize(Role.SUPER_ADMIN, Role.ADMIN), getStudentsReport);
router.get('/students/pdf', authorize(Role.SUPER_ADMIN, Role.ADMIN), getStudentsReportPdf);

export default router;
