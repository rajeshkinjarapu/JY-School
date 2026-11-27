import api from '../api/axios';

export type AccessLevel = 'Full' | 'Manage' | 'View' | 'None';
export type RbacRole = 'SUPER_ADMIN' | 'ADMIN' | 'ACCOUNTANT' | 'TEACHER' | 'TRANSPORT_MANAGER' | 'SECURITY';
export type RbacModuleKey =
  | 'students'
  | 'finance'
  | 'exams'
  | 'questionBank'
  | 'attendance'
  | 'hrSalary'
  | 'transport'
  | 'gatePass'
  | 'settings';

export type RbacMatrixMap = Record<RbacModuleKey, Record<RbacRole, AccessLevel>>;

export const RBAC_MODULES: { key: RbacModuleKey; label: string }[] = [
  { key: 'students', label: 'Students & Admissions' },
  { key: 'finance', label: 'Finance & Fee Approvals' },
  { key: 'exams', label: 'Exams, Marks & OMR' },
  { key: 'questionBank', label: 'Question Bank & AI Studio' },
  { key: 'attendance', label: 'Attendance & Homework' },
  { key: 'hrSalary', label: 'HR Salary & Payroll' },
  { key: 'transport', label: 'Transport & Fleet' },
  { key: 'gatePass', label: 'Gate Pass Verification' },
  { key: 'settings', label: 'Website CMS & Settings' },
];

export const DEFAULT_RBAC_MATRIX: RbacMatrixMap = {
  students:     { SUPER_ADMIN: 'Full', ADMIN: 'Full',   ACCOUNTANT: 'View',   TEACHER: 'Manage', TRANSPORT_MANAGER: 'View', SECURITY: 'None' },
  finance:      { SUPER_ADMIN: 'Full', ADMIN: 'Full',   ACCOUNTANT: 'Full',   TEACHER: 'None',   TRANSPORT_MANAGER: 'None', SECURITY: 'None' },
  exams:        { SUPER_ADMIN: 'Full', ADMIN: 'Full',   ACCOUNTANT: 'None',   TEACHER: 'Manage', TRANSPORT_MANAGER: 'None', SECURITY: 'None' },
  questionBank: { SUPER_ADMIN: 'Full', ADMIN: 'Full',   ACCOUNTANT: 'None',   TEACHER: 'Manage', TRANSPORT_MANAGER: 'None', SECURITY: 'None' },
  attendance:   { SUPER_ADMIN: 'Full', ADMIN: 'Full',   ACCOUNTANT: 'View',   TEACHER: 'Full',   TRANSPORT_MANAGER: 'None', SECURITY: 'None' },
  hrSalary:     { SUPER_ADMIN: 'Full', ADMIN: 'Full',   ACCOUNTANT: 'Manage', TEACHER: 'View',   TRANSPORT_MANAGER: 'None', SECURITY: 'None' },
  transport:    { SUPER_ADMIN: 'Full', ADMIN: 'Full',   ACCOUNTANT: 'View',   TEACHER: 'None',   TRANSPORT_MANAGER: 'Full', SECURITY: 'None' },
  gatePass:     { SUPER_ADMIN: 'Full', ADMIN: 'Full',   ACCOUNTANT: 'None',   TEACHER: 'Manage', TRANSPORT_MANAGER: 'None', SECURITY: 'Manage' },
  settings:     { SUPER_ADMIN: 'Full', ADMIN: 'Manage', ACCOUNTANT: 'None',   TEACHER: 'None',   TRANSPORT_MANAGER: 'None', SECURITY: 'None' },
};

const STORAGE_KEY = 'jy_rbac_matrix_v1';

export const getCachedRbacMatrix = (): RbacMatrixMap => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_RBAC_MATRIX, ...parsed };
    }
  } catch {}
  return JSON.parse(JSON.stringify(DEFAULT_RBAC_MATRIX));
};

export const saveRbacMatrixCache = (matrix: RbacMatrixMap) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(matrix));
    window.dispatchEvent(new Event('rbacMatrixUpdated'));
  } catch {}
};

export const syncRbacMatrixFromServer = async (): Promise<RbacMatrixMap> => {
  try {
    const res: any = await api.get('/api/users/rbac-matrix');
    const payload = res?.data?.data !== undefined ? res.data.data : res?.data;
    if (payload?.matrix) {
      saveRbacMatrixCache(payload.matrix);
      return payload.matrix;
    }
  } catch {}
  return getCachedRbacMatrix();
};

export const resolveModuleFromRoutePath = (pathname: string): RbacModuleKey | null => {
  const p = (pathname || '').toLowerCase();
  if (p.startsWith('/leave/gate-pass') || p.startsWith('/gate-pass')) return 'gatePass';
  if (p.startsWith('/students') || p.startsWith('/admissions') || p.startsWith('/classes') || p.startsWith('/subjects') || p.startsWith('/address-collection')) return 'students';
  if (p.startsWith('/finance') || p.startsWith('/fee-payment') || p.startsWith('/collect-payment') || p.startsWith('/fee-reminder')) return 'finance';
  if (p.startsWith('/question-bank') || p.startsWith('/competitive-question-bank')) return 'questionBank';
  if (p.startsWith('/exams') || p.startsWith('/competitive-exams') || p.startsWith('/online-exams') || p.startsWith('/timetable') || p.startsWith('/answer-key') || p.startsWith('/reports')) return 'exams';
  if (p.startsWith('/attendance') || p.startsWith('/teacher-attendance') || p.startsWith('/homework') || p.startsWith('/holidays')) return 'attendance';
  if (p.startsWith('/hr/salary') || p.startsWith('/salary') || p.startsWith('/leave')) return 'hrSalary';
  if (p.startsWith('/transport')) return 'transport';
  if (p.startsWith('/settings') || p.startsWith('/staff-management') || p.startsWith('/office-tools') || p.startsWith('/id-cards')) return 'settings';
  return null;
};
