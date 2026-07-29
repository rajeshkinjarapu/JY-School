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
  '/timetable': () => import('../pages/timetable/TimetablePage'),
  '/leave/gate-pass': () => import('../pages/gate-pass/GatePassPage'),
  '/leave/type': () => import('../pages/leave/LeaveTypePage'),
  '/finance': () => import('../pages/fees/FinancePage'),
  '/fee-payment': () => import('../pages/fees/FeePaymentsPage'),
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
const TeacherListPage = lazy(routeImports['/teachers']);
const TeacherFormPage = lazy(() => import('../pages/teachers/TeacherFormPage'));
const TeacherProfilePage = lazy(() => import('../pages/teachers/TeacherProfilePage'));
const TeacherStudentsPage = lazy(() => import('../pages/teachers/TeacherStudentsPage'));
const TeacherClassesPage = lazy(() => import('../pages/teachers/TeacherClassesPage'));
const TeacherAdmitCardsPage = lazy(() => import('../pages/teachers/TeacherAdmitCardsPage').then((mod) => ({ default: mod.TeacherAdmitCardsPage })));
const ClassManagementPage = lazy(routeImports['/classes']);
const ClassDetailPage = lazy(() => import('../pages/classes/ClassDetailPage'));
const SubjectPage = lazy(routeImports['/subjects']);
const AttendanceDashboard = lazy(routeImports['/attendance']);
const AttendanceMarkingPage = lazy(() => import('../pages/attendance/AttendanceMarkingPage'));
const MyAttendancePage = lazy(() => import('../pages/attendance/MyAttendancePage').then((mod) => ({ default: mod.MyAttendancePage })));
const AttendanceReportPage = lazy(() => import('../pages/attendance/AttendanceReportPage'));
const AttendanceDailyReportPage = lazy(() => import('../pages/attendance/AttendanceDailyReportPage'));
const ExamListPage = lazy(routeImports['/exams']);
const MarksEntryPage = lazy(() => import('../pages/exams/MarksEntryPage'));
const ReportCardPage = lazy(() => import('../pages/exams/ReportCardPage'));
const OMRScannerPage = lazy(() => import('../pages/exams/OMRScannerPage').then((mod) => ({ default: mod.OMRScannerPage })));
const PaperGeneratorDashboard = lazy(() => import('../pages/paper-generator/Dashboard').then((mod) => ({ default: mod.Dashboard })));
const QuestionBankPage = lazy(() => import('../pages/paper-generator/QuestionBank').then((mod) => ({ default: mod.QuestionBank })));
const PaperBuilderPage = lazy(() => import('../pages/paper-generator/PaperBuilder').then((mod) => ({ default: mod.PaperBuilder })));
const PaperDetailPage = lazy(() => import('../pages/paper-generator/PaperDetail').then((mod) => ({ default: mod.PaperDetail })));
const TimetablePage = lazy(routeImports['/timetable']);
const FinancePage = lazy(routeImports['/finance']);
const FeePaymentsPage = lazy(routeImports['/fee-payment']);
const AnnouncementsPage = lazy(routeImports['/announcements']);
const MessagesPage = lazy(routeImports['/messages']);
const ReportsPage = lazy(routeImports['/reports']);
const SettingsPage = lazy(routeImports['/settings']);
const RolesPage = lazy(() => import('../pages/settings/RolesPage'));
const ProfilePage = lazy(() => import('../pages/profile/ProfilePage'));
const LeaveTypePage = lazy(routeImports['/leave/type']);
const LeaveRequestLogPage = lazy(() => import('../pages/leave/LeaveRequestLogPage'));
const GatePassPage = lazy(routeImports['/leave/gate-pass']);
const HomeworkPage = lazy(routeImports['/homework']);
const TeacherAttendancePage = lazy(routeImports['/teacher-attendance']);
const SalaryPage = lazy(routeImports['/hr/salary']);
const OfficeToolsDashboard = lazy(routeImports['/office-tools']);
const SlipTestManualPage = lazy(() => import('../pages/office-tools/SlipTestManualPage'));
const QuestionBankDashboard = lazy(routeImports['/question-bank']);
const QuestionPaperGeneratorPage = lazy(() => import('../pages/question-bank/QuestionPaperGeneratorPage'));
const SavedPapersPage = lazy(() => import('../pages/question-bank/SavedPapersPage'));
const TransportDashboard = lazy(routeImports['/transport']);
const FormManagerPage = lazy(() => import('../pages/office-tools/forms/FormManagerPage').then((mod) => ({ default: mod.FormManagerPage })));
const FormBuilderPage = lazy(() => import('../pages/office-tools/forms/FormBuilderPage').then((mod) => ({ default: mod.FormBuilderPage })));
const FormResponsesPage = lazy(() => import('../pages/office-tools/forms/FormResponsesPage').then((mod) => ({ default: mod.FormResponsesPage })));
const PublicFormPage = lazy(() => import('../pages/public/PublicFormPage').then((mod) => ({ default: mod.PublicFormPage })));

const AttendanceWrapper = () => {
  const { user } = useAuth();
  if (user?.role === 'STUDENT') {
    return <MyAttendancePage />;
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
    path: '/forms/public/:id',
    element: withSuspense(<PublicFormPage />),
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
          <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN']}>
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
        path: 'exams/omr-scanner',
        element: withSuspense(
          <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
            <OMRScannerPage />
          </ProtectedRoute>
        ),
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
        path: 'question-bank/dashboard',
        element: withSuspense(
          <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'TEACHER']}>
            <PaperGeneratorDashboard />
          </ProtectedRoute>
        ),
      },
      {
        path: 'question-bank/questions',
        element: withSuspense(
          <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'TEACHER']}>
            <QuestionBankPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'question-bank/papers/new',
        element: withSuspense(
          <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'TEACHER']}>
            <PaperBuilderPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'question-bank/papers/:id',
        element: withSuspense(
          <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'TEACHER']}>
            <PaperDetailPage />
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
        path: 'office-tools/forms',
        element: withSuspense(
          <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN']}>
            <FormManagerPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'office-tools/forms/builder',
        element: withSuspense(
          <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN']}>
            <FormBuilderPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'office-tools/forms/:id/responses',
        element: withSuspense(
          <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN']}>
            <FormResponsesPage />
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
        path: 'leave/type',
        element: withSuspense(
          <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN']}>
            <LeaveTypePage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'leave/request-log',
        element: withSuspense(<LeaveRequestLogPage />),
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
    ],
  },
  {
    path: '*',
    element: <Navigate to="/dashboard" replace />,
  },
]);
export default router;

