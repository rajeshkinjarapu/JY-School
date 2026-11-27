import React, { useState, useEffect, useMemo } from 'react';
import {
  Plus,
  Trash2,
  Search,
  User as UserIcon,
  Shield,
  Loader,
  Mail,
  Lock,
  Phone,
  Briefcase,
  X,
  Edit2,
  Key,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertTriangle,
  Users,
  Award,
  Smartphone,
  LayoutDashboard,
  ShieldCheck,
  RefreshCw,
  FileDown,
  Copy,
  UserCheck,
  UserX,
  ChevronRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { PageHeader } from '../../components/UI/PageHeader';

interface StaffMember {
  id: string;
  name: string;
  email: string;
  role: string;
  phone?: string | null;
  photoUrl?: string | null;
  isActive: boolean;
  createdAt?: string;
  plainPassword?: string | null;
  isAppInstalled?: boolean;
  lastAppLoginAt?: string | null;
  deviceModel?: string | null;
  teacher?: {
    id: string;
    employeeId: string;
    qualification?: string | null;
    specialization?: string | null;
    canEditStudents: boolean;
    canUploadQuestionPapers: boolean;
    canViewAllStudents: boolean;
  } | null;
}

const ROLE_META: Record<string, { label: string; badge: string; cardBg: string; desc: string }> = {
  SUPER_ADMIN: {
    label: 'Super Admin',
    badge: 'bg-purple-50 text-purple-700 border-purple-200',
    cardBg: 'from-[#F3EEFF] to-[#E5D9FF] border-[#D3BFFF]',
    desc: 'Unrestricted school-wide control, system settings & danger zone',
  },
  ADMIN: {
    label: 'Admin',
    badge: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    cardBg: 'from-[#EBF3FF] to-[#D8E7FF] border-[#C2DAFF]',
    desc: 'Students, admissions, exams, attendance, timetable & reports',
  },
  ACCOUNTANT: {
    label: 'Accountant',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    cardBg: 'from-[#E5FAEF] to-[#C8F3DD] border-[#ADE8C9]',
    desc: 'Fee collections, fee approvals, receipts & salary payroll',
  },
  TEACHER: {
    label: 'Teacher',
    badge: 'bg-blue-50 text-blue-700 border-blue-200',
    cardBg: 'from-[#E0F2FE] to-[#C5E8FC] border-[#A5DBF8]',
    desc: 'Attendance, homework, marks entry, exams & assigned classes',
  },
  TRANSPORT_MANAGER: {
    label: 'Transport Mgr',
    badge: 'bg-amber-50 text-amber-800 border-amber-200',
    cardBg: 'from-[#FFF4E0] to-[#FFE3B8] border-[#FAD496]',
    desc: 'Fleet vehicles, bus routes, fuel & maintenance logs',
  },
  SECURITY: {
    label: 'Security',
    badge: 'bg-rose-50 text-rose-700 border-rose-200',
    cardBg: 'from-[#FCE7F3] to-[#FBCFE8] border-[#F9A8D4]',
    desc: 'Campus gate pass verification & visitor entry logs',
  },
};

const RBAC_MATRIX = [
  { module: 'Students & Admissions', SUPER_ADMIN: 'Full', ADMIN: 'Full', ACCOUNTANT: 'View', TEACHER: 'Assigned*', TRANSPORT_MANAGER: 'View', SECURITY: 'None' },
  { module: 'Finance & Fee Approvals', SUPER_ADMIN: 'Full', ADMIN: 'Full', ACCOUNTANT: 'Full', TEACHER: 'None', TRANSPORT_MANAGER: 'None', SECURITY: 'None' },
  { module: 'Exams, Marks & OMR', SUPER_ADMIN: 'Full', ADMIN: 'Full', ACCOUNTANT: 'None', TEACHER: 'Manage', TRANSPORT_MANAGER: 'None', SECURITY: 'None' },
  { module: 'Question Bank & AI Studio', SUPER_ADMIN: 'Full', ADMIN: 'Full', ACCOUNTANT: 'None', TEACHER: 'Assigned*', TRANSPORT_MANAGER: 'None', SECURITY: 'None' },
  { module: 'Attendance & Homework', SUPER_ADMIN: 'Full', ADMIN: 'Full', ACCOUNTANT: 'View', TEACHER: 'Full', TRANSPORT_MANAGER: 'None', SECURITY: 'None' },
  { module: 'HR Salary & Payroll', SUPER_ADMIN: 'Full', ADMIN: 'Full', ACCOUNTANT: 'Manage', TEACHER: 'Self', TRANSPORT_MANAGER: 'None', SECURITY: 'None' },
  { module: 'Transport & Fleet', SUPER_ADMIN: 'Full', ADMIN: 'Full', ACCOUNTANT: 'View', TEACHER: 'None', TRANSPORT_MANAGER: 'Full', SECURITY: 'None' },
  { module: 'Gate Pass Verification', SUPER_ADMIN: 'Full', ADMIN: 'Full', ACCOUNTANT: 'None', TEACHER: 'Approve', TRANSPORT_MANAGER: 'None', SECURITY: 'Verify' },
  { module: 'Website CMS & Settings', SUPER_ADMIN: 'Full', ADMIN: 'Manage', ACCOUNTANT: 'None', TEACHER: 'None', TRANSPORT_MANAGER: 'None', SECURITY: 'None' },
];

const getAccessChip = (level: string) => {
  if (level === 'Full') return 'bg-emerald-100 text-emerald-800 border border-emerald-200';
  if (level === 'Manage' || level === 'Approve' || level === 'Verify') return 'bg-indigo-100 text-indigo-800 border border-indigo-200';
  if (level.includes('Assigned')) return 'bg-amber-100 text-amber-800 border border-amber-200';
  if (level === 'View' || level === 'Self') return 'bg-sky-100 text-sky-800 border border-sky-200';
  return 'bg-slate-100 text-slate-400 border border-slate-200';
};

export const StaffManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'directory' | 'matrix'>('dashboard');
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'SUSPENDED'>('ALL');
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, boolean>>({});

  // Create / Edit Staff Modal
  const [showModal, setShowModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formRole, setFormRole] = useState('ACCOUNTANT');
  const [formPhone, setFormPhone] = useState('');
  const [showPasswordField, setShowPasswordField] = useState(false);
  const [savingForm, setSavingForm] = useState(false);

  // Reset Password Modal
  const [resetTarget, setResetTarget] = useState<StaffMember | null>(null);
  const [newPasswordValue, setNewPasswordValue] = useState('');
  const [resettingPwd, setResettingPwd] = useState(false);

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const res: any = await api.get('/api/users?excludeRole=STUDENT&limit=500');
      const list = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      setStaff(list);
    } catch (error) {
      toast.error('Failed to fetch staff records');
    } finally {
      setLoading(false);
    }
  };

  // KPI & Role Metrics
  const kpis = useMemo(() => {
    const total = staff.length;
    const active = staff.filter(s => s.isActive).length;
    const suspended = total - active;
    const privilegeAdmins = staff.filter(s => ['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT'].includes(s.role)).length;
    const teachersList = staff.filter(s => s.role === 'TEACHER');
    const elevatedTeachers = teachersList.filter(
      t => t.teacher?.canEditStudents || t.teacher?.canUploadQuestionPapers || t.teacher?.canViewAllStudents
    ).length;
    const appInstalled = staff.filter(s => s.isAppInstalled).length;
    const appAdoptionPct = total > 0 ? Math.round((appInstalled / total) * 100) : 0;
    const missingPhone = staff.filter(s => !s.phone).length;

    const roleCounts: Record<string, number> = {};
    Object.keys(ROLE_META).forEach(r => { roleCounts[r] = 0; });
    staff.forEach(s => {
      roleCounts[s.role] = (roleCounts[s.role] || 0) + 1;
    });

    return {
      total,
      active,
      suspended,
      privilegeAdmins,
      teachersCount: teachersList.length,
      elevatedTeachers,
      operationalCount: total - teachersList.length,
      appInstalled,
      appAdoptionPct,
      missingPhone,
      roleCounts,
    };
  }, [staff]);

  const filteredStaff = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return staff.filter(s => {
      const matchesRole = roleFilter === 'ALL' || s.role === roleFilter;
      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'ACTIVE' && s.isActive) ||
        (statusFilter === 'SUSPENDED' && !s.isActive);
      const matchesQuery =
        !q ||
        (s.name || '').toLowerCase().includes(q) ||
        (s.email || '').toLowerCase().includes(q) ||
        (s.phone || '').toLowerCase().includes(q) ||
        (s.teacher?.employeeId || '').toLowerCase().includes(q) ||
        s.id.toLowerCase().includes(q);
      return matchesRole && matchesStatus && matchesQuery;
    });
  }, [staff, searchQuery, roleFilter, statusFilter]);

  const teachersDirectory = useMemo(
    () => staff.filter(s => s.role === 'TEACHER'),
    [staff]
  );

  const openCreateModal = () => {
    setEditingStaff(null);
    setFormName('');
    setFormEmail('');
    setFormPassword('');
    setFormRole('ACCOUNTANT');
    setFormPhone('');
    setShowPasswordField(false);
    setShowModal(true);
  };

  const openEditModal = (member: StaffMember) => {
    setEditingStaff(member);
    setFormName(member.name || '');
    setFormEmail(member.email || '');
    setFormPassword('');
    setFormRole(member.role || 'ACCOUNTANT');
    setFormPhone(member.phone || '');
    setShowPasswordField(false);
    setShowModal(true);
  };

  const handleSaveStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingForm(true);
    try {
      if (editingStaff) {
        const payload: any = {
          name: formName,
          email: formEmail,
          role: formRole,
          phone: formPhone || null,
        };
        if (formPassword.trim()) payload.password = formPassword.trim();
        await api.put(`/api/users/${editingStaff.id}`, payload);
        toast.success('Staff profile & role updated!');
      } else {
        await api.post('/api/users', {
          name: formName,
          email: formEmail,
          password: formPassword,
          role: formRole,
          phone: formPhone || null,
        });
        toast.success('New staff account created!');
      }
      setShowModal(false);
      fetchStaff();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error?.message || 'Failed to save staff account');
    } finally {
      setSavingForm(false);
    }
  };

  const handleToggleActive = async (member: StaffMember) => {
    const nextState = !member.isActive;
    const actionLabel = nextState ? 'activate' : 'suspend';
    if (!window.confirm(`Are you sure you want to ${actionLabel} "${member.name}"?`)) return;
    try {
      await api.put(`/api/users/${member.id}`, { isActive: nextState });
      toast.success(`Account ${nextState ? 'activated' : 'suspended'} successfully`);
      setStaff(prev => prev.map(item => (item.id === member.id ? { ...item, isActive: nextState } : item)));
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to update status');
    }
  };

  const handleHardDelete = async (member: StaffMember) => {
    if (!window.confirm(`WARNING: Permanently delete "${member.name}" (${member.role})? This cannot be undone.`)) return;
    try {
      await api.delete(`/api/users/${member.id}?hard=true`);
      toast.success('Staff account deleted');
      setStaff(prev => prev.filter(item => item.id !== member.id));
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to delete staff');
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetTarget || !newPasswordValue.trim()) return;
    setResettingPwd(true);
    try {
      await api.put(`/api/users/${resetTarget.id}`, { password: newPasswordValue.trim() });
      toast.success(`Password updated for ${resetTarget.name}`);
      setResetTarget(null);
      setNewPasswordValue('');
      fetchStaff();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to reset password');
    } finally {
      setResettingPwd(false);
    }
  };

  const handleToggleTeacherPermission = async (
    teacherUser: StaffMember,
    field: 'canEditStudents' | 'canUploadQuestionPapers' | 'canViewAllStudents',
    nextVal: boolean
  ) => {
    try {
      await api.put(`/api/users/${teacherUser.id}`, { [field]: nextVal });
      toast.success(`Permission updated for ${teacherUser.name}`);
      setStaff(prev =>
        prev.map(item =>
          item.id === teacherUser.id && item.teacher
            ? { ...item, teacher: { ...item.teacher, [field]: nextVal } }
            : item
        )
      );
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to update permission');
    }
  };

  const handleExportStaffPDF = async () => {
    if (staff.length === 0) {
      toast.error('No staff records to export');
      return;
    }
    try {
      const { default: jsPDF } = await import('jspdf');
      const autoTableModule: any = await import('jspdf-autotable');
      const autoTable = autoTableModule.default || autoTableModule;

      const doc = new jsPDF();
      doc.setFontSize(17);
      doc.setTextColor(30, 27, 75);
      doc.text('JY SCHOOL - Staff Roles & Access Directory', 14, 15);
      doc.setFontSize(9);
      doc.setTextColor(100);
      doc.text(`Generated: ${new Date().toLocaleDateString('en-IN')} | Total Staff: ${staff.length}`, 14, 22);

      autoTable(doc, {
        startY: 28,
        head: [['#', 'Staff Name', 'Email / Login', 'Phone', 'Role', 'Status']],
        body: staff.map((s, i) => [
          i + 1,
          s.name,
          s.email,
          s.phone || '-',
          ROLE_META[s.role]?.label || s.role,
          s.isActive ? 'Active' : 'Suspended',
        ]),
        theme: 'grid',
        headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255], fontStyle: 'bold' },
        styles: { fontSize: 8.5, cellPadding: 2.5 },
      });

      doc.save(`JY_Staff_Directory_${new Date().toISOString().slice(0, 10)}.pdf`);
      toast.success('Staff directory PDF downloaded!');
    } catch {
      toast.error('Failed to export PDF');
    }
  };

  const handleCopyText = (txt: string, label: string) => {
    navigator.clipboard.writeText(txt);
    toast.success(`${label} copied!`);
  };

  const jumpToRole = (role: string) => {
    setRoleFilter(role);
    setStatusFilter('ALL');
    setActiveTab('directory');
  };

  return (
    <div className="min-h-full bg-[#F5F7FB] text-slate-800 flex flex-col font-sans">

      {/* Unified Top Bar */}
      <PageHeader
        title="Staff Roles & Access Center"
        icon={<Shield className="w-5 h-5 text-white" />}
        action={
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={fetchStaff}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white border border-white/20 text-xs font-bold transition-all cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <button
              type="button"
              onClick={handleExportStaffPDF}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white border border-white/20 text-xs font-bold transition-all cursor-pointer"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export PDF</span>
            </button>
            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white text-indigo-700 hover:bg-indigo-50 text-xs font-extrabold shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Staff</span>
            </button>
          </div>
        }
      />

      <div className="p-3 sm:p-5 lg:p-6 max-w-7xl mx-auto w-full space-y-5">

        {/* ── 5 EXECUTIVE PASTEL KPI CARDS ── */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3.5">

          {/* KPI 1: Total Staff */}
          <button
            type="button"
            onClick={() => jumpToRole('ALL')}
            className="text-left relative overflow-hidden rounded-[22px] p-4 border bg-gradient-to-br from-[#EBF3FF] to-[#D6E6FF] border-[#C5DBFF] shadow-[0_6px_18px_-6px_rgba(37,99,235,0.16)] hover:-translate-y-0.5 transition-all cursor-pointer flex flex-col justify-between gap-2.5"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-blue-800">Total Staff</span>
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-sm">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-black text-slate-900">{kpis.total}</p>
              <p className="text-[11px] font-bold text-blue-700 mt-0.5">
                {kpis.teachersCount} Faculty • {kpis.operationalCount} Ops
              </p>
            </div>
          </button>

          {/* KPI 2: Admin & Finance Governance */}
          <button
            type="button"
            onClick={() => jumpToRole('ACCOUNTANT')}
            className="text-left relative overflow-hidden rounded-[22px] p-4 border bg-gradient-to-br from-[#F1EDFF] to-[#DFD5FF] border-[#D0C2FF] shadow-[0_6px_18px_-6px_rgba(109,40,217,0.16)] hover:-translate-y-0.5 transition-all cursor-pointer flex flex-col justify-between gap-2.5"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-violet-800">Admin &amp; Finance</span>
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-600 to-purple-700 text-white flex items-center justify-center shadow-sm">
                <ShieldCheck className="w-4 h-4" />
              </div>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-black text-slate-900">{kpis.privilegeAdmins}</p>
              <p className="text-[11px] font-bold text-violet-800 mt-0.5">
                High-privilege accounts
              </p>
            </div>
          </button>

          {/* KPI 3: Teaching Faculty & Special Perms */}
          <button
            type="button"
            onClick={() => setActiveTab('matrix')}
            className="text-left relative overflow-hidden rounded-[22px] p-4 border bg-gradient-to-br from-[#E5FAEF] to-[#C2F2D9] border-[#ACEAD0] shadow-[0_6px_18px_-6px_rgba(16,185,129,0.16)] hover:-translate-y-0.5 transition-all cursor-pointer flex flex-col justify-between gap-2.5"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800">Faculty Perms</span>
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-sm">
                <Award className="w-4 h-4" />
              </div>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-black text-slate-900">{kpis.elevatedTeachers}</p>
              <p className="text-[11px] font-bold text-emerald-800 mt-0.5">
                of {kpis.teachersCount} teachers granted extras
              </p>
            </div>
          </button>

          {/* KPI 4: Account Status */}
          <button
            type="button"
            onClick={() => {
              setStatusFilter(kpis.suspended > 0 ? 'SUSPENDED' : 'ACTIVE');
              setRoleFilter('ALL');
              setActiveTab('directory');
            }}
            className="text-left relative overflow-hidden rounded-[22px] p-4 border bg-gradient-to-br from-[#FFF4E0] to-[#FFE1B3] border-[#FAD496] shadow-[0_6px_18px_-6px_rgba(217,119,6,0.16)] hover:-translate-y-0.5 transition-all cursor-pointer flex flex-col justify-between gap-2.5"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-800">Account Status</span>
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center shadow-sm">
                <UserCheck className="w-4 h-4" />
              </div>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-black text-slate-900">{kpis.active}</p>
              <p className="text-[11px] font-bold text-amber-800 mt-0.5">
                Active • {kpis.suspended} Suspended
              </p>
            </div>
          </button>

          {/* KPI 5: Mobile App Adoption */}
          <div className="col-span-2 md:col-span-1 relative overflow-hidden rounded-[22px] p-4 border bg-gradient-to-br from-[#FCE7F3] to-[#FBCFE8] border-[#F9A8D4] shadow-[0_6px_18px_-6px_rgba(219,39,119,0.16)] flex flex-col justify-between gap-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-pink-800">App Adoption</span>
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-pink-500 to-rose-600 text-white flex items-center justify-center shadow-sm">
                <Smartphone className="w-4 h-4" />
              </div>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-black text-slate-900">{kpis.appAdoptionPct}%</p>
              <p className="text-[11px] font-bold text-pink-800 mt-0.5">
                {kpis.appInstalled} of {kpis.total} logged into app
              </p>
            </div>
          </div>

        </div>

        {/* ── 3-TAB COMMAND SWITCHER ── */}
        <div className="bg-white rounded-[22px] p-1.5 shadow-sm border border-indigo-100/90 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-[#F3F5FC] rounded-2xl">
            <button
              type="button"
              onClick={() => setActiveTab('dashboard')}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'dashboard'
                  ? 'bg-gradient-to-r from-[#4F46E5] to-[#6D28D9] text-white shadow-sm'
                  : 'text-slate-600 hover:text-indigo-700 hover:bg-white/70'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Executive Dashboard</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('directory')}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'directory'
                  ? 'bg-gradient-to-r from-[#4F46E5] to-[#6D28D9] text-white shadow-sm'
                  : 'text-slate-600 hover:text-indigo-700 hover:bg-white/70'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Staff Directory</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                activeTab === 'directory' ? 'bg-white/25 text-white' : 'bg-indigo-100 text-indigo-700'
              }`}>
                {filteredStaff.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('matrix')}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'matrix'
                  ? 'bg-gradient-to-r from-[#4F46E5] to-[#6D28D9] text-white shadow-sm'
                  : 'text-slate-600 hover:text-indigo-700 hover:bg-white/70'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>RBAC Matrix &amp; Perms</span>
            </button>
          </div>

          <div className="px-3 text-[11px] font-bold text-slate-500 hidden md:flex items-center gap-2">
            <span>Quick Links:</span>
            <Link to="/teachers/new" className="text-indigo-600 hover:underline font-extrabold">+ Add Teacher</Link>
            <span>•</span>
            <Link to="/app-installs" className="text-emerald-600 hover:underline font-extrabold">App Installs</Link>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* TAB 1: EXECUTIVE DASHBOARD                                     */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        {activeTab === 'dashboard' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">

            {/* Left: Role-Wise Distribution Cards */}
            <div className="lg:col-span-8 bg-white rounded-[24px] border border-indigo-100/90 shadow-sm p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-sm sm:text-base font-black text-slate-900">Role-Wise Distribution &amp; Access Scope</h3>
                  <p className="text-[11px] text-slate-500 font-medium">Click any role card to inspect or manage those accounts</p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('matrix')}
                  className="text-xs font-extrabold text-indigo-600 hover:underline cursor-pointer"
                >
                  View Full Matrix →
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                {Object.entries(ROLE_META).map(([roleKey, meta]) => {
                  const count = kpis.roleCounts[roleKey] || 0;
                  return (
                    <button
                      key={roleKey}
                      type="button"
                      onClick={() => jumpToRole(roleKey)}
                      className={`text-left p-4 rounded-2xl border bg-gradient-to-br ${meta.cardBg} hover:-translate-y-0.5 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between gap-3 group`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-slate-900">{meta.label}</span>
                        <span className="px-2.5 py-0.5 rounded-full bg-white/90 text-slate-900 text-xs font-black shadow-2xs">
                          {count}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-700/85 font-medium leading-snug">{meta.desc}</p>
                      <div className="flex items-center justify-between text-[11px] font-extrabold text-indigo-700 pt-1">
                        <span>Manage {meta.label}</span>
                        <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right: Security Hygiene & Quick Actions */}
            <div className="lg:col-span-4 space-y-4">
              <div className="bg-white rounded-[24px] border border-slate-200/80 shadow-sm p-5 space-y-3.5">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                  <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900">Access Security Health</h3>
                    <p className="text-[11px] text-slate-400 font-medium">Real-time directory hygiene audit</p>
                  </div>
                </div>

                <div className="space-y-2.5 text-xs">
                  <div className={`p-3 rounded-2xl border flex items-center justify-between ${
                    kpis.suspended === 0 ? 'bg-[#ECFDF5] border-emerald-200 text-emerald-900' : 'bg-[#FFF8EB] border-amber-200 text-amber-900'
                  }`}>
                    <div className="flex items-center gap-2">
                      {kpis.suspended === 0 ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertTriangle className="w-4 h-4 text-amber-600" />}
                      <span className="font-bold">Suspended Staff Accounts</span>
                    </div>
                    <span className="font-black px-2 py-0.5 rounded-lg bg-white/80">{kpis.suspended}</span>
                  </div>

                  <div className={`p-3 rounded-2xl border flex items-center justify-between ${
                    kpis.missingPhone === 0 ? 'bg-[#ECFDF5] border-emerald-200 text-emerald-900' : 'bg-[#FFF8EB] border-amber-200 text-amber-900'
                  }`}>
                    <div className="flex items-center gap-2">
                      {kpis.missingPhone === 0 ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertTriangle className="w-4 h-4 text-amber-600" />}
                      <span className="font-bold">Missing Contact Phone</span>
                    </div>
                    <span className="font-black px-2 py-0.5 rounded-lg bg-white/80">{kpis.missingPhone}</span>
                  </div>

                  <div className="p-3 rounded-2xl border bg-[#F4F8FF] border-indigo-100 text-indigo-900 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Smartphone className="w-4 h-4 text-indigo-600" />
                      <span className="font-bold">Mobile App Synced</span>
                    </div>
                    <span className="font-black px-2 py-0.5 rounded-lg bg-white/80">{kpis.appInstalled} / {kpis.total}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-[24px] border border-slate-200/80 shadow-sm p-5 space-y-3">
                <h3 className="text-sm font-black text-slate-900">Quick Staff Onboarding</h3>
                <button
                  type="button"
                  onClick={openCreateModal}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#6D28D9] text-white text-xs font-extrabold shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Accountant / Admin / Security</span>
                </button>
                <Link
                  to="/teachers/new"
                  className="w-full py-2.5 px-4 rounded-xl bg-[#EEF4FF] hover:bg-[#E0EAFF] text-indigo-700 border border-indigo-200 text-xs font-extrabold flex items-center justify-center gap-2 transition-colors"
                >
                  <Users className="w-4 h-4" />
                  <span>Onboard New Teaching Faculty</span>
                </Link>
              </div>
            </div>

          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* TAB 2: UNIFIED STAFF DIRECTORY                                 */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        {activeTab === 'directory' && (
          <div className="space-y-4">

            {/* Search & Multi-Role Filters */}
            <div className="bg-white rounded-[22px] border border-indigo-100/90 shadow-sm p-4 space-y-3">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search staff by name, email, phone or employee ID..."
                    className="w-full pl-9 pr-4 py-2.5 bg-[#F8FAFF] border border-indigo-100 rounded-xl text-xs font-bold text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {(['ALL', 'ACTIVE', 'SUSPENDED'] as const).map(st => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setStatusFilter(st)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-extrabold cursor-pointer transition-all ${
                        statusFilter === st
                          ? 'bg-indigo-600 text-white shadow-2xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {st === 'ALL' ? 'All Status' : st === 'ACTIVE' ? 'Active Only' : 'Suspended Only'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Role Filter Chips */}
              <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setRoleFilter('ALL')}
                  className={`px-3 py-1 rounded-xl text-[11px] font-extrabold cursor-pointer ${
                    roleFilter === 'ALL' ? 'bg-indigo-600 text-white' : 'bg-[#F3F5FC] text-slate-600 hover:bg-indigo-50'
                  }`}
                >
                  All Roles ({kpis.total})
                </button>
                {Object.entries(ROLE_META).map(([roleKey, meta]) => (
                  <button
                    key={roleKey}
                    type="button"
                    onClick={() => setRoleFilter(roleKey)}
                    className={`px-3 py-1 rounded-xl text-[11px] font-extrabold cursor-pointer ${
                      roleFilter === roleKey ? 'bg-indigo-600 text-white' : 'bg-[#F3F5FC] text-slate-600 hover:bg-indigo-50'
                    }`}
                  >
                    {meta.label} ({kpis.roleCounts[roleKey] || 0})
                  </button>
                ))}
              </div>
            </div>

            {/* Staff Table */}
            <div className="bg-white rounded-[24px] border border-indigo-100/90 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gradient-to-r from-[#4F46E5] via-[#6D28D9] to-[#7C3AED] text-white text-[11px] font-extrabold uppercase tracking-wider">
                      <th className="py-3.5 px-5">Staff Member</th>
                      <th className="py-3.5 px-4">Contact Info</th>
                      <th className="py-3.5 px-4">Role &amp; Privileges</th>
                      <th className="py-3.5 px-4">Credentials</th>
                      <th className="py-3.5 px-4">Status &amp; App</th>
                      <th className="py-3.5 px-5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                    {loading ? (
                      <tr>
                        <td colSpan={6} className="py-16 text-center text-slate-400">
                          <Loader className="w-7 h-7 text-indigo-600 animate-spin mx-auto mb-2" />
                          <p className="text-xs font-bold">Loading staff directory...</p>
                        </td>
                      </tr>
                    ) : filteredStaff.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-16 text-center text-slate-400">
                          <UserIcon className="w-9 h-9 text-slate-300 mx-auto mb-2" />
                          <p className="text-sm font-extrabold text-slate-700">No matching staff found</p>
                          <p className="text-xs mt-1">Adjust filters or click &ldquo;Add New Staff&rdquo; above.</p>
                        </td>
                      </tr>
                    ) : (
                      filteredStaff.map(s => {
                        const meta = ROLE_META[s.role] || { label: s.role, badge: 'bg-slate-100 text-slate-700 border-slate-200' };
                        const isPwdShown = revealedPasswords[s.id];
                        return (
                          <tr key={s.id} className="hover:bg-[#F8FAFF] transition-colors">
                            <td className="py-3.5 px-5">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100 text-indigo-700 font-black flex items-center justify-center shrink-0">
                                  {(s.name || 'S').charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <p className="font-extrabold text-slate-900 leading-tight">{s.name}</p>
                                  <p className="text-[11px] font-mono text-slate-400 mt-0.5">
                                    {s.teacher?.employeeId ? `EMP: ${s.teacher.employeeId}` : `ID: ${s.id.slice(0, 8)}`}
                                  </p>
                                </div>
                              </div>
                            </td>

                            <td className="py-3.5 px-4 text-xs">
                              <div className="flex items-center gap-1.5 text-slate-700 font-semibold">
                                <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <span className="truncate max-w-[180px]">{s.email}</span>
                              </div>
                              <div className="flex items-center gap-1.5 text-slate-500 mt-1">
                                <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <span>{s.phone || 'Not Set'}</span>
                              </div>
                            </td>

                            <td className="py-3.5 px-4">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-black border ${meta.badge}`}>
                                <Briefcase className="w-3 h-3" />
                                <span>{meta.label}</span>
                              </span>
                              {s.teacher && (s.teacher.canEditStudents || s.teacher.canUploadQuestionPapers || s.teacher.canViewAllStudents) && (
                                <div className="flex flex-wrap gap-1 mt-1.5">
                                  {s.teacher.canEditStudents && <span className="text-[9px] font-extrabold bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded">Edit Students</span>}
                                  {s.teacher.canUploadQuestionPapers && <span className="text-[9px] font-extrabold bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded">Papers</span>}
                                  {s.teacher.canViewAllStudents && <span className="text-[9px] font-extrabold bg-amber-50 text-amber-800 px-1.5 py-0.5 rounded">All View</span>}
                                </div>
                              )}
                            </td>

                            <td className="py-3.5 px-4">
                              {s.plainPassword ? (
                                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#F3F5FC] border border-indigo-100 text-xs font-mono font-bold text-indigo-900">
                                  <span>{isPwdShown ? s.plainPassword : '••••••••'}</span>
                                  <button
                                    type="button"
                                    onClick={() => setRevealedPasswords(p => ({ ...p, [s.id]: !p[s.id] }))}
                                    className="text-slate-400 hover:text-indigo-700 cursor-pointer"
                                    title={isPwdShown ? 'Hide' : 'Show'}
                                  >
                                    {isPwdShown ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleCopyText(s.plainPassword || '', 'Password')}
                                    className="text-slate-400 hover:text-indigo-700 cursor-pointer"
                                    title="Copy Password"
                                  >
                                    <Copy className="w-3 h-3" />
                                  </button>
                                </div>
                              ) : (
                                <span className="text-[11px] font-bold text-slate-400">Encrypted</span>
                              )}
                            </td>

                            <td className="py-3.5 px-4">
                              <div className="space-y-1">
                                <span className={`inline-flex items-center gap-1.5 text-xs font-extrabold ${s.isActive ? 'text-emerald-600' : 'text-rose-600'}`}>
                                  <span className={`w-2 h-2 rounded-full ${s.isActive ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                                  <span>{s.isActive ? 'Active' : 'Suspended'}</span>
                                </span>
                                <div>
                                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                    s.isAppInstalled ? 'bg-sky-50 text-sky-700 border border-sky-200' : 'bg-slate-100 text-slate-500'
                                  }`}>
                                    <Smartphone className="w-2.5 h-2.5" />
                                    <span>{s.isAppInstalled ? 'App Active' : 'Web Only'}</span>
                                  </span>
                                </div>
                              </div>
                            </td>

                            {/* Always-Visible Clean Action Controls */}
                            <td className="py-3.5 px-5 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => openEditModal(s)}
                                  className="p-2 rounded-xl bg-[#F3F5FC] hover:bg-indigo-100 text-indigo-700 transition-colors cursor-pointer"
                                  title="Edit Profile & Role"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setResetTarget(s);
                                    setNewPasswordValue('');
                                  }}
                                  className="p-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-700 transition-colors cursor-pointer"
                                  title="Reset Password"
                                >
                                  <Key className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleToggleActive(s)}
                                  className={`p-2 rounded-xl transition-colors cursor-pointer ${
                                    s.isActive
                                      ? 'bg-orange-50 hover:bg-orange-100 text-orange-700'
                                      : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700'
                                  }`}
                                  title={s.isActive ? 'Suspend Account' : 'Activate Account'}
                                >
                                  {s.isActive ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleHardDelete(s)}
                                  className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors cursor-pointer"
                                  title="Permanent Delete"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* TAB 3: RBAC PERMISSION MATRIX & TEACHER PRIVILEGES             */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        {activeTab === 'matrix' && (
          <div className="space-y-5">

            {/* RBAC Blueprint Table */}
            <div className="bg-white rounded-[24px] border border-indigo-100/90 shadow-sm overflow-hidden">
              <div className="px-6 py-4 bg-gradient-to-r from-[#EEF2FF] via-[#F5F3FF] to-[#FCE7F3] border-b border-indigo-100/80">
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-indigo-600" />
                  <span>Module-Wise RBAC Permission Matrix</span>
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Standard system authorization across operational &amp; teaching roles (*Assigned flags configurable below)
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#F8FAFF] border-b border-slate-200 text-slate-600 font-black uppercase text-[10px] tracking-wider">
                      <th className="py-3.5 px-5">ERP Module</th>
                      {Object.entries(ROLE_META).map(([rKey, meta]) => (
                        <th key={rKey} className="py-3.5 px-3 text-center">{meta.label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {RBAC_MATRIX.map(row => (
                      <tr key={row.module} className="hover:bg-[#FAFBFD]">
                        <td className="py-3 px-5 font-extrabold text-slate-800">{row.module}</td>
                        {(['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT', 'TEACHER', 'TRANSPORT_MANAGER', 'SECURITY'] as const).map(roleKey => (
                          <td key={roleKey} className="py-3 px-3 text-center">
                            <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black ${getAccessChip((row as any)[roleKey])}`}>
                              {(row as any)[roleKey]}
                            </span>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Live Teacher Granular Permission Toggles */}
            <div className="bg-white rounded-[24px] border border-indigo-100/90 shadow-sm overflow-hidden">
              <div className="px-6 py-4 bg-gradient-to-r from-[#E5FAEF] via-[#F0FDF4] to-[#EBF3FF] border-b border-emerald-100 flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-black text-slate-900">Live Teacher Privilege Overrides</h3>
                  <p className="text-xs text-slate-600 font-medium mt-0.5">
                    Toggle special student directory and question-paper permissions for individual teachers in real-time
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full bg-white text-emerald-700 border border-emerald-200 text-xs font-extrabold">
                  {teachersDirectory.length} Teachers
                </span>
              </div>

              {teachersDirectory.length === 0 ? (
                <div className="p-10 text-center text-xs font-bold text-slate-400">
                  No teachers found in directory. Add teachers from the Teachers module or &ldquo;Add New Staff&rdquo;.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {teachersDirectory.map(t => (
                    <div key={t.id} className="p-4 sm:px-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-[#F8FAFF]">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 font-black flex items-center justify-center shrink-0">
                          {t.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-extrabold text-sm text-slate-900 truncate">{t.name}</p>
                          <p className="text-[11px] font-mono text-slate-400">
                            {t.teacher?.employeeId || t.email} {t.teacher?.specialization ? `• ${t.teacher.specialization}` : ''}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2.5">
                        {[
                          { key: 'canEditStudents' as const, label: 'Edit Students' },
                          { key: 'canUploadQuestionPapers' as const, label: 'Upload Question Papers' },
                          { key: 'canViewAllStudents' as const, label: 'View All Students' },
                        ].map(perm => {
                          const enabled = Boolean(t.teacher?.[perm.key]);
                          return (
                            <button
                              key={perm.key}
                              type="button"
                              onClick={() => handleToggleTeacherPermission(t, perm.key, !enabled)}
                              className={`px-3 py-1.5 rounded-xl border text-xs font-extrabold flex items-center gap-2 cursor-pointer transition-all ${
                                enabled
                                  ? 'bg-[#ECFDF5] border-emerald-300 text-emerald-800 shadow-2xs'
                                  : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                              }`}
                            >
                              <span className={`w-2 h-2 rounded-full ${enabled ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                              <span>{perm.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

      </div>

      {/* ── CREATE / EDIT STAFF MODAL ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-indigo-950/35 backdrop-blur-xs">
          <div className="fixed inset-0" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-indigo-100 z-10">
            <div className="bg-gradient-to-r from-[#EEF2FF] via-[#F5F3FF] to-[#FCE7F3] px-6 py-5 border-b border-indigo-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white flex items-center justify-center">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">
                    {editingStaff ? 'Edit Staff Member' : 'Add New Staff Member'}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    {editingStaff ? 'Update profile info, phone or role assignment' : 'Register an operational or teaching staff login'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-2 bg-white hover:bg-slate-100 rounded-xl text-slate-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveStaff} className="p-6 space-y-4">
              <div>
                <label className="block text-[11px] font-extrabold text-slate-600 uppercase tracking-wider mb-1">Full Name *</label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={e => setFormName(e.target.value)}
                    placeholder="e.g. Rajesh Kumar"
                    className="w-full pl-10 pr-4 py-2.5 bg-[#F8FAFF] border border-slate-200 rounded-xl text-sm font-bold text-slate-900 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-slate-600 uppercase tracking-wider mb-1">Login Email / User ID *</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={formEmail}
                    onChange={e => setFormEmail(e.target.value)}
                    placeholder="name@jyschool.com"
                    className="w-full pl-10 pr-4 py-2.5 bg-[#F8FAFF] border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[11px] font-extrabold text-slate-600 uppercase tracking-wider mb-1">
                    {editingStaff ? 'New Password (Optional)' : 'Password *'}
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPasswordField ? 'text' : 'password'}
                      required={!editingStaff}
                      value={formPassword}
                      onChange={e => setFormPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-9 py-2.5 bg-[#F8FAFF] border border-slate-200 rounded-xl text-sm font-mono font-bold text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswordField(!showPasswordField)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 cursor-pointer"
                    >
                      {showPasswordField ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold text-slate-600 uppercase tracking-wider mb-1">Phone Number</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={formPhone}
                      onChange={e => setFormPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full pl-10 pr-3 py-2.5 bg-[#F8FAFF] border border-slate-200 rounded-xl text-sm font-bold text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-slate-600 uppercase tracking-wider mb-1">Assigned Role *</label>
                <select
                  value={formRole}
                  onChange={e => setFormRole(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 bg-[#F8FAFF] border border-slate-200 rounded-xl text-xs sm:text-sm font-extrabold text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
                >
                  <option value="ACCOUNTANT">Accountant (Finance &amp; Fees)</option>
                  <option value="ADMIN">Administrator (Campus Management)</option>
                  <option value="TEACHER">Teacher (Teaching Faculty)</option>
                  <option value="TRANSPORT_MANAGER">Transport Manager (Fleet &amp; Routes)</option>
                  <option value="SECURITY">Security (Gate Pass &amp; Campus)</option>
                  <option value="SUPER_ADMIN">Super Admin (Unrestricted Access)</option>
                </select>
              </div>

              <div className="flex gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-extrabold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingForm}
                  className="flex-1 py-2.5 bg-gradient-to-r from-[#4F46E5] to-[#6D28D9] text-white text-xs font-extrabold rounded-xl shadow-md cursor-pointer disabled:opacity-50"
                >
                  {savingForm ? 'Saving...' : editingStaff ? 'Update Staff' : 'Create Staff Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── RESET PASSWORD MODAL ── */}
      {resetTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-indigo-950/35 backdrop-blur-xs">
          <div className="fixed inset-0" onClick={() => setResetTarget(null)} />
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 border border-indigo-100 z-10 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Reset Staff Password</h3>
                  <p className="text-xs text-slate-500">{resetTarget.name} ({resetTarget.email})</p>
                </div>
              </div>
              <button type="button" onClick={() => setResetTarget(null)} className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-extrabold text-slate-600 uppercase mb-1">New Password</label>
                <input
                  type="text"
                  required
                  minLength={6}
                  value={newPasswordValue}
                  onChange={e => setNewPasswordValue(e.target.value)}
                  placeholder="Enter new password (min 6 chars)"
                  className="w-full px-4 py-2.5 bg-[#F8FAFF] border border-slate-200 rounded-xl text-sm font-mono font-bold text-slate-900 outline-none focus:bg-white focus:ring-2 focus:ring-amber-500/20"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setResetTarget(null)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-extrabold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resettingPwd}
                  className="flex-1 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-extrabold rounded-xl shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {resettingPwd ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default StaffManagement;
