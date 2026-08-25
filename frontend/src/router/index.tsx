import React, { Suspense, lazy } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import DashboardLayout from '../components/Layout/DashboardLayout';
import { LoadingSpinner } from '../components/UI/LoadingSpinner';
import { useAuth } from '../hooks/useAuth';

const pageLoader = (
  <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950">
    <LoadingSpinner size="lg" />
  </div>
);

const withSuspense = (element: React.ReactElement) => (
  <Suspense fallback={pageLoader}>{element}</Suspense>
);

export const routeImports: Record<string, () => Promise<any>> = {
  '/dashboard': () => import('../pages/dashboard/DashboardPage'),
  '/students': () => import('../pages/students/StudentListPage'),
  '/teachers': () => import('../pages/teachers/TeacherListPage'),
  '/classes': () => import('../pages/classes/ClassManagementPage'),
  '/subjects': () => import('../pages/subjects/SubjectPage'),
  '/attendance': () => import('../pages/attendance/AttendanceDashboard'),
  '/exams': () => import('../pages/exams/ExamListPage'),
  '/exams/create': () => import('../pages/exams/CreateExamPage'),
  '/timetable': () => import('../pages/timetable/TimetablePage'),
  '/leave/gate-pass': () => import('../pages/gate-pass/GatePassPage'),
  '/leave/type': () => import('../pages/leave/LeaveTypePage'),
  '/finance': () => import('../pages/fees/FinancePage'),
  '/fee-payment': () => import('../pages/fees/FeePaymentsPage'),
  '/collect-payment': () => import('../pages/fees/CollectPaymentPage'),
  '/announcements': () => import('../pages/announcements/AnnouncementsPage'),
  '/messages': () => import('../pages/messages/MessagesPage'),
  '/reports': () => import('../pages/reports/ReportsPage'),
  '/hr/salary': () => import('../pages/hr/SalaryPage'),
  '/teacher-attendance': () => import('../pages/teacher-attendance/TeacherAttendancePage'),
  '/homework': () => import('../pages/homework/HomeworkPage'),
  '/office-tools': () => import('../pages/office-tools/OfficeToolsDashboard'),
  '/question-bank': () => import('../pages/question-bank/QuestionBankDashboard'),
  '/transport': () => import('../pages/transport/TransportDashboard'),
  '/settings': () => import('../pages/settings/SettingsPage'),
};

const LoginPage = lazy(() => import('../pages/auth/LoginPage'));
const ForgotPasswordPage = lazy(() => import('../pages/auth/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('../pages/auth/ResetPasswordPage'));
const DashboardPage = lazy(routeImports['/dashboard']);
const StudentListPage = lazy(routeImports['/students']);
const StudentFormPage = lazy(() => import('../pages/students/StudentFormPage'));
const StudentProfilePage = lazy(() => import('../pages/students/StudentProfilePage'));
const StudentAdmitCardViewPage = lazy(() => import('../pages/students/StudentAdmitCardViewPage').then((mod) => ({ default: mod.StudentAdmitCardViewPage })));
const StudentAdmitCardsPage = lazy(() => import('../pages/students/StudentAdmitCardsPage').then((mod) => ({ default: mod.StudentAdmitCardsPage })));
const RecordFeePaymentPage = lazy(() => import('../pages/fees/RecordFeePaymentPage').then((mod) => ({ default: mod.RecordFeePaymentPage })));
const TeacherListPage = lazy(routeImports['/teachers']);
const TeacherFormPage = lazy(() => import('../pages/teachers/TeacherFormPage'));
const TeacherProfilePage = lazy(() => import('../pages/teachers/TeacherProfilePage'));
const TeacherStudentsPage = lazy(() => import('../pages/teachers/TeacherStudentsPage'));
const TeacherClassesPage = lazy(() => import('../pages/teachers/TeacherClassesPage'));
const TeacherAdmitCardsPage = lazy(() => import('../pages/teachers/TeacherAdmitCardsPage').then((mod) => ({ default: mod.TeacherAdmitCardsPage })));
const ClassManagementPage = lazy(routeImports['/classes']);
const ClassDetailPage = lazy(() => import('../pages/classes/ClassDetailPage'));
const SubjectPage = lazy(routeImports['/subjects']);
const SubjectDetailsPage = lazy(() => import('../pages/subjects/SubjectDetailsPage'));
const AttendanceDashboard = lazy(routeImports['/attendance']);
const AttendanceMarkingPage = lazy(() => import('../pages/attendance/AttendanceMarkingPage'));
const MyAttendancePage = lazy(() => import('../pages/attendance/MyAttendancePage').then((mod) => ({ default: mod.MyAttendancePage })));
const AttendanceReportPage = lazy(() => import('../pages/attendance/AttendanceReportPage'));
const AttendanceDailyReportPage = lazy(() => import('../pages/attendance/AttendanceDailyReportPage'));
const ExamListPage = lazy(routeImports['/exams']);
const CreateExamPage = lazy(routeImports['/exams/create']);
const MarksEntryPage = lazy(() => import('../pages/exams/MarksEntryPage'));
const ReportCardPage = lazy(() => import('../pages/exams/ReportCardPage'));

const TimetablePage = lazy(routeImports['/timetable']);
const FinancePage = lazy(routeImports['/finance']);
const FeePaymentsPage = lazy(routeImports['/fee-payment']);
const CollectPaymentPage = lazy(routeImports['/collect-payment']);
const AnnouncementsPage = lazy(routeImports['/announcements']);
const MessagesPage = lazy(routeImports['/messages']);
const ReportsPage = lazy(routeImports['/reports']);
const SettingsPage = lazy(routeImports['/settings']);
const RolesPage = lazy(() => import('../pages/settings/RolesPage'));
const ProfilePage = lazy(() => import('../pages/profile/ProfilePage'));
const LeaveDashboardPage = lazy(() => import('../pages/leave/LeaveDashboardPage'));
const GatePassPage = lazy(routeImports['/leave/gate-pass']);
const HomeworkPage = lazy(routeImports['/homework']);
const TeacherAttendancePage = lazy(routeImports['/teacher-attendance']);
const SalaryPage = lazy(routeImports['/hr/salary']);
const OfficeToolsDashboard = lazy(routeImports['/office-tools']);
const SlipTestManualPage = lazy(() => import('../pages/office-tools/SlipTestManualPage'));
const FeeReminderPage = lazy(() => import('../pages/fees/FeeReminderPage'));
const QuestionBankDashboard = lazy(routeImports['/question-bank']);
const QuestionPaperGeneratorPage = lazy(() => import('../pages/question-bank/QuestionPaperGeneratorPage'));
const NavodayaPaperGeneratorPage = lazy(() => import('../pages/question-bank/NavodayaPaperGeneratorPage'));
const MCQPaperGeneratorPage = lazy(() => import('../pages/question-bank/MCQPaperGeneratorPage'));
const SavedPapersPage = lazy(() => import('../pages/question-bank/SavedPapersPage'));
const TransportDashboard = lazy(routeImports['/transport']);
const TransportRoutesPage = lazy(() => import('../pages/transport/RoutesPage'));
const TransportVehiclesPage = lazy(() => import('../pages/transport/VehiclesPage'));
const TransportStudentsPage = lazy(() => import('../pages/transport/StudentTransportPage'));
const TransportFuelLogsPage = lazy(() => import('../pages/transport/FuelLogsPage'));
const TransportMaintenanceLogsPage = lazy(() => import('../pages/transport/MaintenanceLogsPage'));
const AnswerKeyPage = lazy(() => import('../pages/question-bank/AnswerKeyPage'));


const AttendanceWrapper = () => {
  const { user } = useAuth();
  if (user?.role === 'STUDENT') {
    return <MyAttendancePage />;
  }
  if (user?.role === 'TEACHER') {
    return <AttendanceMarkingPage />;
  }
  return <AttendanceDashboard />;
};

export const router = createBrowserRouter([
  {
    path: '/login',
    element: withSuspense(<LoginPage />),
  },
  {
    path: '/forgot-password',
    element: withSuspense(<ForgotPasswordPage />),
  },
  {
    path: '/reset-password',
    element: withSuspense(<ResetPasswordPage />),
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <DashboardLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: 'dashboard',
        element: withSuspense(<DashboardPage />),
      },
      {
        path: 'students',
        element: withSuspense(
          <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'TEACHER']}>
            <StudentListPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'students/new',
        element: withSuspense(
          <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN']}>
            <StudentFormPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'students/:id',
        element: withSuspense(<StudentProfilePage />),
      },
      {
        path: 'students/:id/edit',
        element: withSuspense(
          <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'TEACHER']}>
            <StudentFormPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'students/:id/pay-fee',
        element: withSuspense(
          <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT']}>
            <RecordFeePaymentPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'teachers',
        element: withSuspense(
          <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN']}>
            <TeacherListPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'teachers/new',
        element: withSuspense(
          <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN']}>
            <TeacherFormPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'teachers/:id',
        element: withSuspense(<TeacherProfilePage />),
      },
      {
        path: 'teachers/:id/edit',
        element: withSuspense(
          <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN']}>
            <TeacherFormPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'teachers/students',
        element: withSuspense(
          <ProtectedRoute allowedRoles={['TEACHER', 'SUPER_ADMIN', 'ADMIN']}>
            <TeacherStudentsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'teachers/classes',
        element: withSuspense(
          <ProtectedRoute allowedRoles={['TEACHER', 'SUPER_ADMIN', 'ADMIN']}>
            <TeacherClassesPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'teacher/admit-cards',
        element: withSuspense(
          <ProtectedRoute allowedRoles={['TEACHER', 'SUPER_ADMIN', 'ADMIN']}>
            <TeacherAdmitCardsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'student/admit-cards',
        element: withSuspense(
          <ProtectedRoute allowedRoles={['STUDENT']}>
            <StudentAdmitCardsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'classes',
        element: withSuspense(
          <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN']}>
            <ClassManagementPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'classes/:id',
        element: withSuspense(<ClassDetailPage />),
      },
      {
        path: 'subjects',
        element: withSuspense(
          <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN']}>
            <SubjectPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'subjects/:name',
        element: withSuspense(
          <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'TEACHER']}>
            <SubjectDetailsPage />
          </ProtectedRoute>
        ),
      },
      {
          path: 'attendance',
          element: withSuspense(<AttendanceWrapper />),
        },
        {
          path: 'attendance/mark',
          element: withSuspense(<AttendanceMarkingPage />),
        },
      {
        path: 'attendance/report',
        element: withSuspense(<AttendanceReportPage />),
      },
      {
        path: 'attendance/daily-report',
        element: withSuspense(<AttendanceDailyReportPage />),
      },
      {
        path: 'exams',
        element: withSuspense(<ExamListPage />),
      },
      {
        path: 'exams/create',
        element: withSuspense(<CreateExamPage />),
      },
      {
        path: 'exams/:id/entry',
        element: withSuspense(
          <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'TEACHER']}>
            <MarksEntryPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'exams/:examId/report-card/:studentId',
        element: withSuspense(<ReportCardPage />),
      },
      {
        path: 'admit-card-view/:id',
        element: withSuspense(<StudentAdmitCardViewPage />),
      },
      {
        path: 'question-bank/generator',
        element: (
          <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'TEACHER']}>
            <QuestionPaperGeneratorPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'question-bank/navodaya-generator',
        element: (
          <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'TEACHER']}>
            <NavodayaPaperGeneratorPage />
          </ProtectedRoute>
        ),
      },

      {
        path: 'timetable',
        element: withSuspense(<TimetablePage />),
      },
      {
        path: 'finance',
        element: withSuspense(
          <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT']}>
            <FinancePage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'fee-payment',
        element: withSuspense(
          <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT']}>
            <FeePaymentsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'collect-payment',
        element: withSuspense(
          <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'TEACHER']}>
            <CollectPaymentPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'announcements',
        element: withSuspense(<AnnouncementsPage />),
      },
      {
        path: 'messages',
        element: withSuspense(<MessagesPage />),
      },
      {
        path: 'reports',
        element: withSuspense(
          <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN']}>
            <ReportsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'office-tools',
        element: withSuspense(
          <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN']}>
            <OfficeToolsDashboard />
          </ProtectedRoute>
        ),
      },
      {
        path: 'office-tools/slip-test',
        element: withSuspense(
          <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
            <SlipTestManualPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'question-bank',
        element: withSuspense(
          <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
            <QuestionBankDashboard />
          </ProtectedRoute>
        ),
      },
      {
        path: 'question-bank/generator',
        element: withSuspense(
          <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
            <QuestionPaperGeneratorPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'question-bank/navodaya-generator',
        element: withSuspense(
          <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
            <NavodayaPaperGeneratorPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'question-bank/mcq-generator',
        element: withSuspense(
          <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
            <MCQPaperGeneratorPage />
          </ProtectedRoute>
        ),
      },

      {
        path: 'question-bank/saved-papers',
        element: withSuspense(
          <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
            <SavedPapersPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'transport',
        element: withSuspense(
          <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN']}>
            <TransportDashboard />
          </ProtectedRoute>
        ),
      },
      {
        path: 'transport/routes',
        element: withSuspense(
          <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN']}>
            <TransportRoutesPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'transport/vehicles',
        element: withSuspense(
          <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN']}>
            <TransportVehiclesPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'transport/students',
        element: withSuspense(
          <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN']}>
            <TransportStudentsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'transport/fuel',
        element: withSuspense(
          <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN']}>
            <TransportFuelLogsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'transport/maintenance',
        element: withSuspense(
          <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN']}>
            <TransportMaintenanceLogsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'settings',
        element: withSuspense(
          <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN']}>
            <SettingsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'roles',
        element: withSuspense(
          <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN']}>
            <RolesPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'profile',
        element: withSuspense(<ProfilePage />),
      },
      {
        path: 'leave/gate-pass',
        element: withSuspense(<GatePassPage />),
      },
      {
        path: 'leave',
        element: withSuspense(
          <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'STUDENT']}>
            <LeaveDashboardPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'gate-pass',
        element: withSuspense(
          <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'STUDENT']}>
            <GatePassPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'homework',
        element: withSuspense(
          <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'STUDENT']}>
            <HomeworkPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'teacher-attendance',
        element: withSuspense(
          <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'TEACHER']}>
            <TeacherAttendancePage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'hr/salary',
        element: withSuspense(
          <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN']}>
            <SalaryPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'salary',
        element: withSuspense(
          <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'TEACHER']}>
            <SalaryPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'fee-reminder',
        element: withSuspense(
          <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'TEACHER']}>
            <FeeReminderPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'answer-key',
        element: withSuspense(
          <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'TEACHER']}>
            <AnswerKeyPage />
          </ProtectedRoute>
        ),
      },

    ],
  },
  {
    path: '*',
    element: <Navigate to="/dashboard" replace />,
  },
]);
export default router;
