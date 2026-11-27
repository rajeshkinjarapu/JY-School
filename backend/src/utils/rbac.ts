import { prisma } from './prisma';

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

const VALID_LEVELS: AccessLevel[] = ['Full', 'Manage', 'View', 'None'];
const EDITABLE_ROLES: RbacRole[] = ['ADMIN', 'ACCOUNTANT', 'TEACHER', 'TRANSPORT_MANAGER', 'SECURITY'];

const cloneDefaults = (): RbacMatrixMap =>
  JSON.parse(JSON.stringify(DEFAULT_RBAC_MATRIX)) as RbacMatrixMap;

let rbacTableReady = false;
let cachedMatrix: RbacMatrixMap | null = null;

export const ensureRbacTableExists = async () => {
  if (rbacTableReady) return;
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "RolePermission" (
        "id" TEXT PRIMARY KEY,
        "role" TEXT NOT NULL,
        "moduleKey" TEXT NOT NULL,
        "accessLevel" TEXT NOT NULL,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await prisma.$executeRawUnsafe(`
      CREATE UNIQUE INDEX IF NOT EXISTS "RolePermission_role_moduleKey_key" ON "RolePermission"("role", "moduleKey")
    `);
    rbacTableReady = true;
  } catch (err: any) {
    console.warn('Notice ensuring RolePermission table:', err?.message);
  }
};

export const getRbacMatrix = async (): Promise<RbacMatrixMap> => {
  if (cachedMatrix) return cachedMatrix;
  await ensureRbacTableExists();

  const matrix = cloneDefaults();
  try {
    const rows = await prisma.$queryRaw<{ role: string; moduleKey: string; accessLevel: string }[]>`
      SELECT "role", "moduleKey", "accessLevel" FROM "RolePermission"
    `;
    for (const r of rows) {
      const mod = r.moduleKey as RbacModuleKey;
      const role = r.role as RbacRole;
      const lvl = r.accessLevel as AccessLevel;
      if (matrix[mod] && EDITABLE_ROLES.includes(role) && VALID_LEVELS.includes(lvl)) {
        matrix[mod][role] = lvl;
      }
    }
  } catch (err: any) {
    console.warn('Failed reading RolePermission overrides, using defaults:', err?.message);
  }

  cachedMatrix = matrix;
  return matrix;
};

export const saveRbacMatrix = async (incoming: Partial<RbacMatrixMap>): Promise<RbacMatrixMap> => {
  await ensureRbacTableExists();
  const base = await getRbacMatrix();

  for (const modDef of RBAC_MODULES) {
    const modKey = modDef.key;
    const incomingMod = incoming?.[modKey];
    if (!incomingMod) continue;

    for (const role of EDITABLE_ROLES) {
      const level = incomingMod[role];
      if (!level || !VALID_LEVELS.includes(level)) continue;

      base[modKey][role] = level;
      const rowId = `${role}__${modKey}`;
      await prisma.$executeRaw`
        INSERT INTO "RolePermission" ("id", "role", "moduleKey", "accessLevel", "updatedAt")
        VALUES (${rowId}, ${role}, ${modKey}, ${level}, CURRENT_TIMESTAMP)
        ON CONFLICT ("role", "moduleKey") DO UPDATE SET
          "accessLevel" = EXCLUDED."accessLevel",
          "updatedAt" = CURRENT_TIMESTAMP
      `;
    }
  }

  // Ensure SUPER_ADMIN is always Full across every module
  for (const modDef of RBAC_MODULES) {
    base[modDef.key].SUPER_ADMIN = 'Full';
  }

  cachedMatrix = base;
  return base;
};

export const resetRbacMatrix = async (): Promise<RbacMatrixMap> => {
  await ensureRbacTableExists();
  try {
    await prisma.$executeRawUnsafe(`DELETE FROM "RolePermission"`);
  } catch {}
  cachedMatrix = cloneDefaults();
  return cachedMatrix;
};

export const resolveModuleFromBaseUrl = (baseUrl: string): RbacModuleKey | null => {
  const path = (baseUrl || '').toLowerCase();
  if (path.startsWith('/api/students') || path.startsWith('/api/admissions') || path.startsWith('/api/classes') || path.startsWith('/api/subjects') || path.startsWith('/api/address-collection') || path.startsWith('/api/promotion')) {
    return 'students';
  }
  if (path.startsWith('/api/fees')) return 'finance';
  if (path.startsWith('/api/exams') || path.startsWith('/api/marks') || path.startsWith('/api/slip-tests') || path.startsWith('/api/timetable') || path.startsWith('/api/answer-keys') || path.startsWith('/api/online-exams') || path.startsWith('/api/competitive-exams') || path.startsWith('/api/reports')) {
    return 'exams';
  }
  if (path.startsWith('/api/question-papers') || path.startsWith('/api/generated-papers') || path.startsWith('/api/master-questions') || path.startsWith('/api/latex')) {
    return 'questionBank';
  }
  if (path.startsWith('/api/attendance') || path.startsWith('/api/teacher-attendance') || path.startsWith('/api/homework')) {
    return 'attendance';
  }
  if (path.startsWith('/api/salary') || path.startsWith('/api/leave')) return 'hrSalary';
  if (path.startsWith('/api/transport')) return 'transport';
  if (path.startsWith('/api/gate-pass')) return 'gatePass';
  if (path.startsWith('/api/website') || path.startsWith('/api/settings') || path.startsWith('/api/users')) return 'settings';
  return null;
};
