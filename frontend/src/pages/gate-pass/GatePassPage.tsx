import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Download,
  Eye,
  GraduationCap,
  LogIn,
  LogOut,
  MapPin,
  Phone,
  Plus,
  Printer,
  RefreshCw,
  Search,
  Shield,
  ShieldCheck,
  Trash2,
  UserCheck,
  Users,
  X,
  XCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { useAuthStore } from '../../store/authStore';
import { GatePassPrint, printGatePassSlip } from '../../components/gate-pass/GatePassPrint';
import type { GatePassPrintData, SchoolSettingsData } from '../../components/gate-pass/GatePassPrint';
import { LoadingSpinner } from '../../components/UI/LoadingSpinner';
import { PageHeader } from '../../components/UI/PageHeader';
import { getPhotoUrl } from '../../utils/photo';
import { sortClasses } from '../../utils/sortClasses';

interface StudentOption {
  id: string;
  rollNo?: string;
  fatherName?: string;
  mobileNumber?: string;
  user?: {
    id?: string;
    name?: string;
    phone?: string;
    photoUrl?: string;
  };
  class?: {
    id?: string;
    name?: string;
    section?: string;
  };
}

interface TeacherOption {
  id: string;
  userId?: string;
  employeeId?: string;
  designation?: string;
  user?: {
    id?: string;
    name?: string;
    phone?: string;
    photoUrl?: string;
  };
}

interface GatePassItem extends GatePassPrintData {
  rejectionReason?: string | null;
  approvedAt?: string | null;
  requesterId?: string;
}

interface GatePassStats {
  student: number;
  staff: number;
  inside: number;
  out: number;
  pending: number;
  overdue: number;
}

type StatusFilter = 'ALL' | 'OUTSIDE' | 'PENDING' | 'APPROVED' | 'COMPLETED' | 'REJECTED';
type TypeFilter = 'ALL' | 'STUDENT' | 'TEACHER';

const PRESET_REASONS = [
  'Medical Checkup / Fever',
  'Family Emergency',
  'Parent Escort Early Leave',
  'Official School Duty',
  'Personal Urgent Work',
];

const formatDateTime = (value?: string | null): string => {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

const isSameLocalDay = (value?: string | null, target = new Date()): boolean => {
  if (!value) return false;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return false;
  return (
    d.getFullYear() === target.getFullYear() &&
    d.getMonth() === target.getMonth() &&
    d.getDate() === target.getDate()
  );
};

const getStatusBadgeConfig = (status: string) => {
  switch (status) {
    case 'PENDING':
      return {
        label: 'Pending Approval',
        className: 'bg-[#FEF3C7] text-[#B45309] border border-[#FDE68A]',
        dot: 'bg-[#D97706]',
      };
    case 'APPROVED':
      return {
        label: 'Approved',
        className: 'bg-[#EDE9FE] text-[#6D28D9] border border-[#DDD6FE]',
        dot: 'bg-[#7C3AED]',
      };
    case 'ACTIVE':
      return {
        label: 'Outside Campus',
        className: 'bg-[#FFEDD5] text-[#C2410C] border border-[#FED7AA]',
        dot: 'bg-[#EA580C]',
      };
    case 'COMPLETED':
      return {
        label: 'Safely Returned',
        className: 'bg-[#D1FAE5] text-[#047857] border border-[#A7F3D0]',
        dot: 'bg-[#10B981]',
      };
    case 'REJECTED':
      return {
        label: 'Rejected',
        className: 'bg-[#FFE4E6] text-[#BE123C] border border-[#FECDD3]',
        dot: 'bg-[#E11D48]',
      };
    default:
      return {
        label: status || 'Unknown',
        className: 'bg-slate-100 text-slate-700 border border-slate-200',
        dot: 'bg-slate-500',
      };
  }
};

export const GatePassPage: React.FC = () => {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';
  const isSecurity = user?.role === 'SECURITY';
  const canManage = isAdmin || isSecurity;
  const canApprove = isAdmin;

  const [items, setItems] = useState<GatePassItem[]>([]);
  const [stats, setStats] = useState<GatePassStats>({
    student: 0,
    staff: 0,
    inside: 0,
    out: 0,
    pending: 0,
    overdue: 0,
  });
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [teachers, setTeachers] = useState<TeacherOption[]>([]);
  const [schoolSettings, setSchoolSettings] = useState<SchoolSettingsData>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('ALL');
  const [classFilter, setClassFilter] = useState<string>('ALL');
  const [dateFilter, setDateFilter] = useState<'TODAY' | 'ALL'>('ALL');

  // Modals & action states
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [previewItem, setPreviewItem] = useState<GatePassItem | null>(null);
  const [deleteConfirmItem, setDeleteConfirmItem] = useState<GatePassItem | null>(null);
  const [rejectConfirmItem, setRejectConfirmItem] = useState<GatePassItem | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [actionBusyId, setActionBusyId] = useState<string | null>(null);

  // Issue Pass form state
  const [formType, setFormType] = useState<'STUDENT' | 'TEACHER'>('STUDENT');
  const [studentSearch, setStudentSearch] = useState('');
  const [modalClassFilter, setModalClassFilter] = useState<string>('ALL');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [teacherSearch, setTeacherSearch] = useState('');
  const [selectedStaffUserId, setSelectedStaffUserId] = useState('');
  const [reason, setReason] = useState('');
  const [destination, setDestination] = useState('');
  const [exitTime, setExitTime] = useState(() => {
    const now = new Date();
    return now.toTimeString().slice(0, 5);
  });
  const [returnTime, setReturnTime] = useState('');
  const [notes, setNotes] = useState('');

  const loadGatePasses = async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);

    try {
      const [passesRes, statsRes] = await Promise.all([
        api.get('/gate-pass?limit=250'),
        api.get('/gate-pass/stats').catch(() => null),
      ]);

      const rawPasses = passesRes?.data;
      const passesData = Array.isArray(rawPasses)
        ? rawPasses
        : Array.isArray(rawPasses?.data)
        ? rawPasses.data
        : [];
      setItems(passesData);

      if (statsRes?.data) {
        const s = statsRes.data?.data ?? statsRes.data;
        if (s && typeof s === 'object') {
          setStats({
            student: Number(s.student || 0),
            staff: Number(s.staff || 0),
            inside: Number(s.inside || 0),
            out: Number(s.out || 0),
            pending: Number(s.pending || 0),
            overdue: Number(s.overdue || 0),
          });
        }
      }
    } catch (error: any) {
      console.error('Failed to load gate passes:', error);
      toast.error(error?.response?.data?.message || 'Failed to load gate passes');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadSupportingData = async () => {
    try {
      const requests: Promise<any>[] = [
        api.get('/settings').catch(() => null),
        api.get('/students?limit=500').catch(() => null),
      ];
      if (isAdmin) {
        requests.push(api.get('/teachers?limit=500').catch(() => null));
      }

      const [settingsRes, studentsRes, teachersRes] = await Promise.all(requests);

      if (settingsRes?.data) {
        const s = settingsRes.data?.data ?? settingsRes.data;
        if (s && typeof s === 'object') {
          setSchoolSettings(s);
        }
      }

      if (studentsRes?.data) {
        const rawStudents = studentsRes.data?.data ?? studentsRes.data;
        if (Array.isArray(rawStudents)) {
          setStudents(rawStudents);
        }
      }

      if (teachersRes?.data) {
        const rawTeachers = teachersRes.data?.data ?? teachersRes.data;
        if (Array.isArray(rawTeachers)) {
          setTeachers(rawTeachers);
        }
      }
    } catch (error) {
      console.error('Failed to load supporting gate pass metadata:', error);
    }
  };

  useEffect(() => {
    loadGatePasses();
    loadSupportingData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const uniqueClassNames = useMemo(() => {
    const map = new Map<string, { name: string }>();
    students.forEach((s) => {
      if (s.class?.name && !map.has(s.class.name)) {
        map.set(s.class.name, { name: s.class.name });
      }
    });
    items.forEach((item) => {
      if (item.student?.class?.name && !map.has(item.student.class.name)) {
        map.set(item.student.class.name, { name: item.student.class.name });
      }
    });
    return sortClasses(Array.from(map.values())).map((c) => c.name);
  }, [students, items]);

  const dateScopedItems = useMemo(() => {
    return items.filter((item) => {
      if (typeFilter !== 'ALL' && item.requestType !== typeFilter) return false;
      if (classFilter !== 'ALL') {
        if (item.requestType === 'TEACHER') return false;
        if (item.student?.class?.name !== classFilter) return false;
      }
      if (dateFilter === 'TODAY') {
        return isSameLocalDay(item.createdAt || item.requestedDate);
      }
      return true;
    });
  }, [items, typeFilter, classFilter, dateFilter]);

  const statusCounts = useMemo(() => {
    const counts = {
      ALL: dateScopedItems.length,
      OUTSIDE: 0,
      PENDING: 0,
      APPROVED: 0,
      COMPLETED: 0,
      REJECTED: 0,
    };
    dateScopedItems.forEach((item) => {
      if (item.status === 'ACTIVE') counts.OUTSIDE += 1;
      else if (item.status === 'PENDING') counts.PENDING += 1;
      else if (item.status === 'APPROVED') counts.APPROVED += 1;
      else if (item.status === 'COMPLETED') counts.COMPLETED += 1;
      else if (item.status === 'REJECTED') counts.REJECTED += 1;
    });
    return counts;
  }, [dateScopedItems]);

  const filteredItems = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return dateScopedItems.filter((item) => {
      if (statusFilter === 'OUTSIDE' && item.status !== 'ACTIVE') return false;
      if (statusFilter !== 'ALL' && statusFilter !== 'OUTSIDE' && item.status !== statusFilter) {
        return false;
      }
      if (!q) return true;

      const haystack = [
        item.slipNumber,
        item.reason,
        item.destination,
        item.student?.user?.name,
        item.student?.rollNo,
        item.student?.fatherName,
        item.student?.mobileNumber,
        item.student?.class?.name,
        item.student?.class?.section,
        item.requester?.name,
        item.requester?.phone,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return haystack.includes(q);
    });
  }, [dateScopedItems, statusFilter, searchTerm]);

  const kpiMetrics = useMemo(() => {
    const todayItems = items.filter((item) => isSameLocalDay(item.createdAt || item.requestedDate));
    const currentlyOutside = items.filter((item) => item.status === 'ACTIVE').length;
    const pendingApproval = items.filter((item) => item.status === 'PENDING').length;
    const safelyReturned = items.filter((item) => item.status === 'COMPLETED').length;
    const approvedReady = items.filter((item) => item.status === 'APPROVED').length;

    return {
      passesToday: todayItems.length,
      currentlyOutside: Math.max(currentlyOutside, stats.out),
      pendingApproval: Math.max(pendingApproval, stats.pending),
      safelyReturned: Math.max(safelyReturned, stats.inside),
      approvedReady,
      overdueCount: stats.overdue,
    };
  }, [items, stats]);

  const filteredStudentsForModal = useMemo(() => {
    const q = studentSearch.trim().toLowerCase();
    return students.filter((s) => {
      if (modalClassFilter !== 'ALL' && s.class?.name !== modalClassFilter) return false;
      if (!q) return true;
      const haystack = [
        s.user?.name,
        s.rollNo,
        s.fatherName,
        s.mobileNumber,
        s.class?.name,
        s.class?.section,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [students, studentSearch, modalClassFilter]);

  const filteredTeachersForModal = useMemo(() => {
    const q = teacherSearch.trim().toLowerCase();
    return teachers.filter((t) => {
      if (!q) return true;
      const haystack = [t.user?.name, t.employeeId, t.designation, t.user?.phone]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [teachers, teacherSearch]);

  const selectedStudentObj = useMemo(
    () => students.find((s) => s.id === selectedStudentId) || null,
    [students, selectedStudentId]
  );

  const selectedTeacherObj = useMemo(
    () =>
      teachers.find((t) => (t.user?.id || t.userId || t.id) === selectedStaffUserId) || null,
    [teachers, selectedStaffUserId]
  );

  const resetIssueForm = () => {
    setFormType('STUDENT');
    setStudentSearch('');
    setModalClassFilter('ALL');
    setSelectedStudentId('');
    setTeacherSearch('');
    setSelectedStaffUserId('');
    setReason('');
    setDestination('');
    setExitTime(new Date().toTimeString().slice(0, 5));
    setReturnTime('');
    setNotes('');
  };

  const handleOpenIssueModal = () => {
    resetIssueForm();
    setIsIssueModalOpen(true);
  };

  const handleIssuePass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      toast.error('Please enter a reason for the gate pass');
      return;
    }
    if (formType === 'STUDENT' && !selectedStudentId) {
      toast.error('Please select a student');
      return;
    }
    if (formType === 'TEACHER' && isAdmin && !selectedStaffUserId) {
      toast.error('Please select a teacher or staff member');
      return;
    }

    setSubmitting(true);
    try {
      const payload: Record<string, any> = {
        requestType: formType,
        reason: reason.trim(),
        destination: destination.trim() || undefined,
        exitTime: exitTime || undefined,
        returnTime: returnTime || undefined,
        notes: notes.trim() || undefined,
      };

      if (formType === 'STUDENT') {
        payload.studentId = selectedStudentId;
      } else if (isAdmin && selectedStaffUserId) {
        payload.staffId = selectedStaffUserId;
      }

      await api.post('/gate-pass', payload);
      toast.success(
        isAdmin
          ? 'Gate pass issued & auto-approved successfully!'
          : 'Gate pass request submitted for approval!'
      );
      setIsIssueModalOpen(false);
      resetIssueForm();
      await loadGatePasses(true);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to create gate pass');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (
    item: GatePassItem,
    status: 'APPROVED' | 'REJECTED' | 'ACTIVE' | 'COMPLETED',
    reasonText?: string
  ) => {
    setActionBusyId(item.id);
    try {
      await api.patch(`/gate-pass/${item.id}`, {
        status,
        ...(reasonText ? { rejectionReason: reasonText } : {}),
      });
      const labelMap: Record<string, string> = {
        APPROVED: 'Gate pass approved',
        REJECTED: 'Gate pass rejected',
        ACTIVE: 'Marked as exited campus',
        COMPLETED: 'Marked as safely returned',
      };
      toast.success(labelMap[status] || 'Gate pass updated');
      setRejectConfirmItem(null);
      setRejectionReason('');
      await loadGatePasses(true);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to update gate pass status');
    } finally {
      setActionBusyId(null);
    }
  };

  const handleDeletePass = async () => {
    if (!deleteConfirmItem) return;
    setActionBusyId(deleteConfirmItem.id);
    try {
      await api.delete(`/gate-pass/${deleteConfirmItem.id}`);
      toast.success('Gate pass deleted');
      setDeleteConfirmItem(null);
      await loadGatePasses(true);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to delete gate pass');
    } finally {
      setActionBusyId(null);
    }
  };

  const handleExportCsv = () => {
    if (filteredItems.length === 0) {
      toast.error('No gate passes available to export');
      return;
    }

    const escapeCsv = (val: any) => {
      const s = String(val ?? '').replace(/"/g, '""');
      return `"${s}"`;
    };

    const headers = [
      'Slip Number',
      'Type',
      'Name',
      'Class / Role',
      'Roll / Phone',
      'Reason',
      'Destination',
      'Exit Time',
      'Return Time',
      'Status',
      'Approved By',
      'Created At',
    ];

    const rows = filteredItems.map((item) => {
      const isTeacher = item.requestType === 'TEACHER';
      const personName = isTeacher
        ? item.requester?.name || 'Staff'
        : item.student?.user?.name || 'Student';
      const classOrRole = isTeacher
        ? item.requester?.designation || item.requester?.role || 'Staff'
        : item.student?.class
        ? `${item.student.class.name} ${item.student.class.section || ''}`.trim()
        : '—';
      const identity = isTeacher
        ? item.requester?.phone || '—'
        : `${item.student?.rollNo || '—'} / ${item.student?.mobileNumber || item.student?.user?.phone || '—'}`;

      return [
        item.slipNumber || item.id.slice(0, 8),
        item.requestType,
        personName,
        classOrRole,
        identity,
        item.reason,
        item.destination || '—',
        item.exitTime || '—',
        item.returnTime || '—',
        item.status,
        item.approvedBy?.name || '—',
        formatDateTime(item.createdAt || item.requestedDate),
      ]
        .map(escapeCsv)
        .join(',');
    });

    const csv = [headers.map(escapeCsv).join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gate-passes-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${filteredItems.length} gate passes`);
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-[#F4F7FC]">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F7FC] pb-12">
      <PageHeader
        title="Gate Pass Command Center"
        subtitle="Real-time campus movement tracking, approvals, and dual-copy security slip printing"
        icon={ShieldCheck}
        action={
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => loadGatePasses(true)}
              disabled={refreshing}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white border border-white/25 text-xs sm:text-sm font-semibold backdrop-blur-sm transition-all cursor-pointer disabled:opacity-60"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>

            <button
              type="button"
              onClick={handleExportCsv}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white border border-white/25 text-xs sm:text-sm font-semibold backdrop-blur-sm transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </button>

            <button
              type="button"
              onClick={handleOpenIssueModal}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-[#5B21B6] hover:bg-[#F5F3FF] text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Issue Gate Pass</span>
            </button>
          </div>
        }
      />

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* 4 Glossy Light Pastel KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {/* KPI 1: Passes Today */}
          <button
            type="button"
            onClick={() => {
              setDateFilter(dateFilter === 'TODAY' ? 'ALL' : 'TODAY');
              setStatusFilter('ALL');
            }}
            className={`group text-left rounded-2xl p-5 bg-gradient-to-br from-[#EDE9FE] via-[#F5F3FF] to-white border transition-all cursor-pointer shadow-sm hover:shadow-md hover:-translate-y-0.5 ${
              dateFilter === 'TODAY' && statusFilter === 'ALL'
                ? 'border-[#7C3AED] ring-2 ring-[#7C3AED]/25'
                : 'border-[#DDD6FE]'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#6D28D9]">
                  Passes Today
                </p>
                <p className="mt-1.5 text-3xl font-extrabold text-slate-800 tracking-tight">
                  {kpiMetrics.passesToday}
                </p>
                <p className="mt-1 text-xs text-slate-600 font-medium">
                  {dateFilter === 'TODAY'
                    ? 'Showing today only (click for all)'
                    : `${items.length} total passes in register`}
                </p>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#7C3AED] to-[#5B21B6] text-white flex items-center justify-center shadow-md shadow-violet-500/20 group-hover:scale-105 transition-transform">
                <Activity className="w-5 h-5" />
              </div>
            </div>
          </button>

          {/* KPI 2: Currently Outside */}
          <button
            type="button"
            onClick={() => {
              setDateFilter('ALL');
              setStatusFilter(statusFilter === 'OUTSIDE' ? 'ALL' : 'OUTSIDE');
            }}
            className={`group text-left rounded-2xl p-5 bg-gradient-to-br from-[#FEF3C7] via-[#FFFBEB] to-white border transition-all cursor-pointer shadow-sm hover:shadow-md hover:-translate-y-0.5 ${
              statusFilter === 'OUTSIDE'
                ? 'border-[#D97706] ring-2 ring-[#D97706]/25'
                : 'border-[#FDE68A]'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#B45309]">
                  Currently Outside
                </p>
                <p className="mt-1.5 text-3xl font-extrabold text-slate-800 tracking-tight">
                  {kpiMetrics.currentlyOutside}
                </p>
                <p className="mt-1 text-xs text-slate-600 font-medium">
                  {kpiMetrics.approvedReady > 0
                    ? `${kpiMetrics.approvedReady} approved awaiting gate exit`
                    : 'Out of campus right now'}
                </p>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#F59E0B] to-[#D97706] text-white flex items-center justify-center shadow-md shadow-amber-500/20 group-hover:scale-105 transition-transform">
                <LogOut className="w-5 h-5" />
              </div>
            </div>
          </button>

          {/* KPI 3: Pending Approval */}
          <button
            type="button"
            onClick={() => {
              setDateFilter('ALL');
              setStatusFilter(statusFilter === 'PENDING' ? 'ALL' : 'PENDING');
            }}
            className={`group text-left rounded-2xl p-5 bg-gradient-to-br from-[#FCE7F3] via-[#FDF2F8] to-white border transition-all cursor-pointer shadow-sm hover:shadow-md hover:-translate-y-0.5 ${
              statusFilter === 'PENDING'
                ? 'border-[#DB2777] ring-2 ring-[#DB2777]/25'
                : 'border-[#FBCFE8]'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#BE185D]">
                  Pending Approval
                </p>
                <p className="mt-1.5 text-3xl font-extrabold text-slate-800 tracking-tight">
                  {kpiMetrics.pendingApproval}
                </p>
                <p className="mt-1 text-xs text-slate-600 font-medium">
                  Awaiting Principal / Admin review
                </p>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#EC4899] to-[#BE185D] text-white flex items-center justify-center shadow-md shadow-pink-500/20 group-hover:scale-105 transition-transform">
                <Clock className="w-5 h-5" />
              </div>
            </div>
          </button>

          {/* KPI 4: Safely Returned */}
          <button
            type="button"
            onClick={() => {
              setDateFilter('ALL');
              setStatusFilter(statusFilter === 'COMPLETED' ? 'ALL' : 'COMPLETED');
            }}
            className={`group text-left rounded-2xl p-5 bg-gradient-to-br from-[#D1FAE5] via-[#ECFDF5] to-white border transition-all cursor-pointer shadow-sm hover:shadow-md hover:-translate-y-0.5 ${
              statusFilter === 'COMPLETED'
                ? 'border-[#059669] ring-2 ring-[#059669]/25'
                : 'border-[#A7F3D0]'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#047857]">
                  Safely Returned
                </p>
                <p className="mt-1.5 text-3xl font-extrabold text-slate-800 tracking-tight">
                  {kpiMetrics.safelyReturned}
                </p>
                <p className="mt-1 text-xs text-slate-600 font-medium">
                  Completed passes checked back in
                </p>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#10B981] to-[#059669] text-white flex items-center justify-center shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>
          </button>
        </div>

        {/* Search, Filter & Status Pill Toolbar */}
        <div className="bg-white rounded-2xl border border-[#DDD7F3] shadow-sm p-4 sm:p-5 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search student, staff, roll no, slip #, reason, destination..."
                className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-[#DDD7F3] bg-[#F8FAFC] focus:bg-white text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/25 focus:border-[#7C3AED] transition-all"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Type Filter */}
            <div className="flex flex-wrap items-center gap-2.5">
              <select
                value={typeFilter}
                onChange={(e) => {
                  const val = e.target.value as TypeFilter;
                  setTypeFilter(val);
                  if (val === 'TEACHER') setClassFilter('ALL');
                }}
                className="px-3.5 py-2.5 rounded-xl border border-[#DDD7F3] bg-[#F8FAFC] text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/25 focus:border-[#7C3AED]"
              >
                <option value="ALL">All Types ({items.length})</option>
                <option value="STUDENT">Students Only</option>
                <option value="TEACHER">Teachers / Staff</option>
              </select>

              {/* Class Filter */}
              <select
                value={classFilter}
                onChange={(e) => {
                  setClassFilter(e.target.value);
                  if (e.target.value !== 'ALL') setTypeFilter('STUDENT');
                }}
                className="px-3.5 py-2.5 rounded-xl border border-[#DDD7F3] bg-[#F8FAFC] text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/25 focus:border-[#7C3AED]"
              >
                <option value="ALL">All Classes</option>
                {uniqueClassNames.map((clsName) => (
                  <option key={clsName} value={clsName}>
                    {clsName}
                  </option>
                ))}
              </select>

              {/* Date Range Segmented Toggle */}
              <div className="inline-flex rounded-xl border border-[#DDD7F3] bg-[#F4F7FC] p-1">
                <button
                  type="button"
                  onClick={() => setDateFilter('ALL')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    dateFilter === 'ALL'
                      ? 'bg-[#6D38EA] text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  All Records
                </button>
                <button
                  type="button"
                  onClick={() => setDateFilter('TODAY')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    dateFilter === 'TODAY'
                      ? 'bg-[#6D38EA] text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Today
                </button>
              </div>
            </div>
          </div>

          {/* Interactive Status Filter Pills */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-slate-100">
            <div className="flex flex-wrap items-center gap-2">
              {(
                [
                  { key: 'ALL', label: 'All Passes', count: statusCounts.ALL },
                  { key: 'OUTSIDE', label: 'Outside Campus', count: statusCounts.OUTSIDE },
                  { key: 'PENDING', label: 'Pending Approval', count: statusCounts.PENDING },
                  { key: 'APPROVED', label: 'Approved', count: statusCounts.APPROVED },
                  { key: 'COMPLETED', label: 'Safely Returned', count: statusCounts.COMPLETED },
                  { key: 'REJECTED', label: 'Rejected', count: statusCounts.REJECTED },
                ] as { key: StatusFilter; label: string; count: number }[]
              ).map((pill) => {
                const active = statusFilter === pill.key;
                return (
                  <button
                    key={pill.key}
                    type="button"
                    onClick={() => setStatusFilter(pill.key)}
                    className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
                      active
                        ? 'bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] text-white border-transparent shadow-sm'
                        : 'bg-[#F8FAFC] text-slate-600 border-[#E2E8F0] hover:bg-[#F5F3FF] hover:border-[#DDD6FE] hover:text-[#5B21B6]'
                    }`}
                  >
                    <span>{pill.label}</span>
                    <span
                      className={`px-1.5 py-0.5 rounded-md text-[11px] font-bold ${
                        active ? 'bg-white/20 text-white' : 'bg-white text-slate-700 border border-slate-200'
                      }`}
                    >
                      {pill.count}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="text-xs font-medium text-slate-500">
              Showing <span className="font-bold text-slate-800">{filteredItems.length}</span> of{' '}
              <span className="font-bold text-slate-800">{dateScopedItems.length}</span> passes
            </div>
          </div>
        </div>

        {/* Main Content: Empty State vs Unified Table + Mobile Cards */}
        {filteredItems.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#DDD7F3] shadow-sm p-12 text-center">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-[#F5F3FF] border border-[#DDD6FE] text-[#7C3AED] flex items-center justify-center mb-4">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">No Gate Passes Found</h3>
            <p className="mt-1.5 text-sm text-slate-500 max-w-md mx-auto">
              {dateFilter === 'TODAY'
                ? 'No gate passes have been logged today for the active filters. Try switching to All Records or issue a new gate pass.'
                : 'No gate passes match your current search or status filters. Clear filters or issue a new gate pass.'}
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
              {(searchTerm || statusFilter !== 'ALL' || classFilter !== 'ALL' || typeFilter !== 'ALL' || dateFilter === 'TODAY') && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('ALL');
                    setClassFilter('ALL');
                    setTypeFilter('ALL');
                    setDateFilter('ALL');
                  }}
                  className="px-4 py-2 rounded-xl border border-[#DDD7F3] bg-white hover:bg-[#F5F3FF] text-slate-700 text-sm font-semibold transition-all cursor-pointer"
                >
                  Reset All Filters
                </button>
              )}
              <button
                type="button"
                onClick={handleOpenIssueModal}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] text-white text-sm font-semibold shadow-sm hover:shadow-md transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Issue Gate Pass</span>
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Desktop ERP Table */}
            <div className="hidden lg:block bg-white rounded-2xl border border-[#DDD7F3] shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full student-grid-table border-collapse text-left">
                  <thead>
                    <tr className="bg-gradient-to-r from-[#7D3CEF] via-[#6D38EA] to-[#5B21B6] !text-white">
                      <th className="py-3.5 px-4 text-xs font-bold uppercase tracking-wider !text-white whitespace-nowrap">
                        Slip &amp; Timestamp
                      </th>
                      <th className="py-3.5 px-4 text-xs font-bold uppercase tracking-wider !text-white">
                        Person &amp; Identity
                      </th>
                      <th className="py-3.5 px-4 text-xs font-bold uppercase tracking-wider !text-white">
                        Purpose &amp; Schedule
                      </th>
                      <th className="py-3.5 px-4 text-xs font-bold uppercase tracking-wider !text-white whitespace-nowrap">
                        Status
                      </th>
                      <th className="py-3.5 px-4 text-xs font-bold uppercase tracking-wider !text-white text-right whitespace-nowrap">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EDE9FE]">
                    {filteredItems.map((item) => {
                      const isTeacher = item.requestType === 'TEACHER';
                      const personName = isTeacher
                        ? item.requester?.name || 'Staff Member'
                        : item.student?.user?.name || 'Unknown Student';
                      const rawPhoto = isTeacher
                        ? item.requester?.photoUrl
                        : item.student?.user?.photoUrl;
                      const photoUrl = getPhotoUrl(rawPhoto);
                      const statusCfg = getStatusBadgeConfig(item.status);
                      const isBusy = actionBusyId === item.id;
                      const canDelete = isAdmin || (item.status === 'PENDING' && item.requesterId === user?.id);

                      return (
                        <tr
                          key={item.id}
                          className="hover:bg-[#F5F3FF]/60 transition-colors align-middle"
                        >
                          {/* Slip & Timestamp */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#F5F3FF] border border-[#DDD6FE] text-[#5B21B6] font-mono text-xs font-bold">
                              <span>{item.slipNumber || `#${item.id.slice(0, 8).toUpperCase()}`}</span>
                            </div>
                            <div className="mt-1.5 flex items-center gap-1 text-[11px] text-slate-500 font-medium">
                              <Calendar className="w-3 h-3 text-slate-400" />
                              <span>{formatDateTime(item.createdAt || item.requestedDate)}</span>
                            </div>
                          </td>

                          {/* Person & Identity */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              {photoUrl ? (
                                <img
                                  src={photoUrl}
                                  alt={personName}
                                  className="w-10 h-10 rounded-full object-cover border-2 border-[#DDD6FE] shrink-0"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#EDE9FE] to-[#DDD6FE] text-[#5B21B6] font-bold text-sm flex items-center justify-center shrink-0 border border-[#C4B5FD]">
                                  {personName.charAt(0).toUpperCase()}
                                </div>
                              )}
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-bold text-sm text-slate-800 truncate">
                                    {personName}
                                  </span>
                                  <span
                                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide ${
                                      isTeacher
                                        ? 'bg-sky-50 text-sky-700 border border-sky-200'
                                        : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                                    }`}
                                  >
                                    {isTeacher ? (
                                      <>
                                        <UserCheck className="w-2.5 h-2.5" />
                                        Staff
                                      </>
                                    ) : (
                                      <>
                                        <GraduationCap className="w-2.5 h-2.5" />
                                        Student
                                      </>
                                    )}
                                  </span>
                                </div>

                                <div className="mt-0.5 flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-xs text-slate-500">
                                  {isTeacher ? (
                                    <>
                                      <span>{item.requester?.designation || item.requester?.role || 'Faculty'}</span>
                                      {item.requester?.phone && (
                                        <span className="inline-flex items-center gap-1">
                                          <Phone className="w-3 h-3 text-slate-400" />
                                          {item.requester.phone}
                                        </span>
                                      )}
                                    </>
                                  ) : (
                                    <>
                                      <span className="font-semibold text-slate-700">
                                        {item.student?.class
                                          ? `${item.student.class.name}${
                                              item.student.class.section ? ` - ${item.student.class.section}` : ''
                                            }`
                                          : 'No Class'}
                                      </span>
                                      {item.student?.rollNo && <span>Roll: {item.student.rollNo}</span>}
                                      {(item.student?.mobileNumber || item.student?.user?.phone) && (
                                        <span className="inline-flex items-center gap-1">
                                          <Phone className="w-3 h-3 text-slate-400" />
                                          {item.student?.mobileNumber || item.student?.user?.phone}
                                        </span>
                                      )}
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Purpose & Schedule */}
                          <td className="py-3.5 px-4 max-w-xs">
                            <p className="text-sm font-semibold text-slate-800 line-clamp-2">
                              {item.reason}
                            </p>
                            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                              {item.destination && (
                                <span className="inline-flex items-center gap-1">
                                  <MapPin className="w-3 h-3 text-[#7C3AED]" />
                                  {item.destination}
                                </span>
                              )}
                              {(item.exitTime || item.returnTime) && (
                                <span className="inline-flex items-center gap-1 font-medium text-slate-600">
                                  <Clock className="w-3 h-3 text-slate-400" />
                                  {item.exitTime || '—'} → {item.returnTime || 'Open'}
                                </span>
                              )}
                            </div>
                            {item.rejectionReason && (
                              <p className="mt-1 text-[11px] font-medium text-rose-600">
                                Reason: {item.rejectionReason}
                              </p>
                            )}
                          </td>

                          {/* Status */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${statusCfg.className}`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
                              {statusCfg.label}
                            </span>
                            {item.approvedBy?.name && item.status !== 'PENDING' && (
                              <p className="mt-1 text-[11px] text-slate-500">
                                By {item.approvedBy.name}
                              </p>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="py-3.5 px-4 whitespace-nowrap text-right">
                            <div className="inline-flex items-center justify-end gap-1.5">
                              {canApprove && item.status === 'PENDING' && (
                                <>
                                  <button
                                    type="button"
                                    disabled={isBusy}
                                    onClick={() => handleUpdateStatus(item, 'APPROVED')}
                                    title="Approve Gate Pass"
                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                    <span>Approve</span>
                                  </button>
                                  <button
                                    type="button"
                                    disabled={isBusy}
                                    onClick={() => {
                                      setRejectConfirmItem(item);
                                      setRejectionReason('');
                                    }}
                                    title="Reject Gate Pass"
                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                                  >
                                    <XCircle className="w-3.5 h-3.5" />
                                    <span>Reject</span>
                                  </button>
                                </>
                              )}

                              {canManage && item.status === 'APPROVED' && (
                                <button
                                  type="button"
                                  disabled={isBusy}
                                  onClick={() => handleUpdateStatus(item, 'ACTIVE')}
                                  title="Mark Exited Campus"
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                                >
                                  <LogOut className="w-3.5 h-3.5" />
                                  <span>Mark Out</span>
                                </button>
                              )}

                              {canManage && item.status === 'ACTIVE' && (
                                <button
                                  type="button"
                                  disabled={isBusy}
                                  onClick={() => handleUpdateStatus(item, 'COMPLETED')}
                                  title="Mark Safely Returned"
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                                >
                                  <LogIn className="w-3.5 h-3.5" />
                                  <span>Mark Returned</span>
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => setPreviewItem(item)}
                                title="Preview Dual-Copy Slip"
                                className="p-2 rounded-lg bg-[#F5F3FF] hover:bg-[#EDE9FE] text-[#6D28D9] border border-[#DDD6FE] transition-all cursor-pointer"
                              >
                                <Eye className="w-4 h-4" />
                              </button>

                              <button
                                type="button"
                                onClick={() => printGatePassSlip(item, schoolSettings)}
                                title="Print Gate Pass Slip"
                                className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition-all cursor-pointer"
                              >
                                <Printer className="w-4 h-4" />
                              </button>

                              {canDelete && (
                                <button
                                  type="button"
                                  disabled={isBusy}
                                  onClick={() => setDeleteConfirmItem(item)}
                                  title="Delete Gate Pass"
                                  className="p-2 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 transition-all cursor-pointer disabled:opacity-50"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Cards View */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:hidden">
              {filteredItems.map((item) => {
                const isTeacher = item.requestType === 'TEACHER';
                const personName = isTeacher
                  ? item.requester?.name || 'Staff Member'
                  : item.student?.user?.name || 'Unknown Student';
                const rawPhoto = isTeacher
                  ? item.requester?.photoUrl
                  : item.student?.user?.photoUrl;
                const photoUrl = getPhotoUrl(rawPhoto);
                const statusCfg = getStatusBadgeConfig(item.status);
                const isBusy = actionBusyId === item.id;
                const canDelete = isAdmin || (item.status === 'PENDING' && item.requesterId === user?.id);

                return (
                  <div
                    key={item.id}
                    className="bg-white rounded-2xl border border-[#DDD7F3] shadow-sm p-4 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="px-2.5 py-1 rounded-lg bg-[#F5F3FF] border border-[#DDD6FE] text-[#5B21B6] font-mono text-xs font-bold">
                        {item.slipNumber || `#${item.id.slice(0, 8).toUpperCase()}`}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${statusCfg.className}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
                        {statusCfg.label}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      {photoUrl ? (
                        <img
                          src={photoUrl}
                          alt={personName}
                          className="w-11 h-11 rounded-full object-cover border-2 border-[#DDD6FE]"
                        />
                      ) : (
                        <div className="w-11 h-11 rounded-full bg-[#EDE9FE] text-[#5B21B6] font-bold flex items-center justify-center border border-[#C4B5FD]">
                          {personName.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="font-bold text-slate-800 text-sm truncate">{personName}</p>
                        <p className="text-xs text-slate-500">
                          {isTeacher
                            ? item.requester?.designation || 'Staff Member'
                            : `${item.student?.class?.name || 'No Class'}${
                                item.student?.class?.section ? ` - ${item.student.class.section}` : ''
                              }${item.student?.rollNo ? ` • Roll: ${item.student.rollNo}` : ''}`}
                        </p>
                      </div>
                    </div>

                    <div className="rounded-xl bg-[#F8FAFC] border border-slate-100 p-3 space-y-1">
                      <p className="text-xs font-semibold text-slate-800">{item.reason}</p>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500">
                        {item.destination && (
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-[#7C3AED]" />
                            {item.destination}
                          </span>
                        )}
                        <span>{formatDateTime(item.createdAt || item.requestedDate)}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {canApprove && item.status === 'PENDING' && (
                          <>
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => handleUpdateStatus(item, 'APPROVED')}
                              className="px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold cursor-pointer"
                            >
                              Approve
                            </button>
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => {
                                setRejectConfirmItem(item);
                                setRejectionReason('');
                              }}
                              className="px-2.5 py-1.5 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold cursor-pointer"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {canManage && item.status === 'APPROVED' && (
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => handleUpdateStatus(item, 'ACTIVE')}
                            className="px-2.5 py-1.5 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold cursor-pointer"
                          >
                            Mark Out
                          </button>
                        )}
                        {canManage && item.status === 'ACTIVE' && (
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => handleUpdateStatus(item, 'COMPLETED')}
                            className="px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold cursor-pointer"
                          >
                            Mark Returned
                          </button>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setPreviewItem(item)}
                          className="p-2 rounded-lg bg-[#F5F3FF] text-[#6D28D9] border border-[#DDD6FE] cursor-pointer"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => printGatePassSlip(item, schoolSettings)}
                          className="p-2 rounded-lg bg-slate-50 text-slate-700 border border-slate-200 cursor-pointer"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                        {canDelete && (
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmItem(item)}
                            className="p-2 rounded-lg bg-rose-50 text-rose-600 border border-rose-200 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* ISSUE GATE PASS MODAL */}
      {isIssueModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#2E1065]/35 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl border border-[#DDD7F3] shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
            {/* Light-ERP Purple Gradient Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-[#5B21B6] via-[#6D38EA] to-[#7C3AED] text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/15 border border-white/25 flex items-center justify-center">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold">Issue New Gate Pass</h2>
                  <p className="text-xs text-violet-100">
                    {isAdmin
                      ? 'Admin passes are automatically approved for immediate gate print'
                      : 'Request will be routed to Principal / Admin for approval'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsIssueModalOpen(false)}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/25 text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleIssuePass} className="p-6 overflow-y-auto space-y-5">
              {/* Pass Type Switch */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFormType('STUDENT')}
                  className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border text-sm font-bold transition-all cursor-pointer ${
                    formType === 'STUDENT'
                      ? 'bg-[#F5F3FF] border-[#7C3AED] text-[#5B21B6] shadow-sm'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <GraduationCap className="w-4 h-4" />
                  <span>Student Gate Pass</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFormType('TEACHER')}
                  className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border text-sm font-bold transition-all cursor-pointer ${
                    formType === 'TEACHER'
                      ? 'bg-[#F5F3FF] border-[#7C3AED] text-[#5B21B6] shadow-sm'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span>Teacher / Staff Pass</span>
                </button>
              </div>

              {/* Person Selector */}
              {formType === 'STUDENT' ? (
                <div className="space-y-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] p-4">
                  <div className="flex flex-col sm:flex-row gap-2.5">
                    <div className="relative flex-1">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={studentSearch}
                        onChange={(e) => setStudentSearch(e.target.value)}
                        placeholder="Search student name, roll no, or phone..."
                        className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/25 focus:border-[#7C3AED]"
                      />
                    </div>
                    <select
                      value={modalClassFilter}
                      onChange={(e) => setModalClassFilter(e.target.value)}
                      className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/25 focus:border-[#7C3AED]"
                    >
                      <option value="ALL">All Classes</option>
                      {uniqueClassNames.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                      Select Student *
                    </label>
                    <select
                      required
                      value={selectedStudentId}
                      onChange={(e) => setSelectedStudentId(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#DDD7F3] bg-white text-sm text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/25 focus:border-[#7C3AED]"
                    >
                      <option value="">
                        -- Choose from {filteredStudentsForModal.length} students --
                      </option>
                      {filteredStudentsForModal.slice(0, 200).map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.user?.name || 'Unnamed'} (
                          {s.class ? `${s.class.name}${s.class.section ? `-${s.class.section}` : ''}` : 'No Class'}
                          {s.rollNo ? ` • Roll ${s.rollNo}` : ''})
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedStudentObj && (
                    <div className="flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl bg-white border border-[#DDD6FE]">
                      <div>
                        <p className="text-sm font-bold text-slate-800">
                          {selectedStudentObj.user?.name}
                        </p>
                        <p className="text-xs text-slate-500">
                          Father: {selectedStudentObj.fatherName || 'N/A'} • Mobile:{' '}
                          {selectedStudentObj.mobileNumber || selectedStudentObj.user?.phone || 'N/A'}
                        </p>
                      </div>
                      <span className="px-2.5 py-1 rounded-lg bg-[#F5F3FF] text-[#5B21B6] text-xs font-bold">
                        {selectedStudentObj.class?.name || 'Class'}{' '}
                        {selectedStudentObj.class?.section || ''}
                      </span>
                    </div>
                  )}
                </div>
              ) : isAdmin ? (
                <div className="space-y-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] p-4">
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={teacherSearch}
                      onChange={(e) => setTeacherSearch(e.target.value)}
                      placeholder="Search teacher or staff name, employee ID..."
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/25 focus:border-[#7C3AED]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                      Select Teacher / Staff Member *
                    </label>
                    <select
                      required
                      value={selectedStaffUserId}
                      onChange={(e) => setSelectedStaffUserId(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#DDD7F3] bg-white text-sm text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/25 focus:border-[#7C3AED]"
                    >
                      <option value="">
                        -- Choose from {filteredTeachersForModal.length} staff members --
                      </option>
                      {filteredTeachersForModal.map((t) => {
                        const staffUserId = t.user?.id || t.userId || t.id;
                        return (
                          <option key={t.id} value={staffUserId}>
                            {t.user?.name || 'Staff Member'}
                            {t.designation ? ` • ${t.designation}` : ''}
                            {t.employeeId ? ` (${t.employeeId})` : ''}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                  {selectedTeacherObj && (
                    <div className="flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl bg-white border border-[#DDD6FE]">
                      <div>
                        <p className="text-sm font-bold text-slate-800">
                          {selectedTeacherObj.user?.name}
                        </p>
                        <p className="text-xs text-slate-500">
                          {selectedTeacherObj.designation || 'Faculty'} • Phone:{' '}
                          {selectedTeacherObj.user?.phone || 'N/A'}
                        </p>
                      </div>
                      {selectedTeacherObj.employeeId && (
                        <span className="px-2.5 py-1 rounded-lg bg-[#F5F3FF] text-[#5B21B6] text-xs font-bold">
                          {selectedTeacherObj.employeeId}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="rounded-xl bg-[#F5F3FF] border border-[#DDD6FE] p-3.5 text-xs font-medium text-[#5B21B6]">
                  This staff gate pass will be submitted under your account ({user?.name || 'Current Staff'}).
                </div>
              )}

              {/* Quick Reason Presets */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Reason for Departure *
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {PRESET_REASONS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setReason(preset)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                        reason === preset
                          ? 'bg-[#EDE9FE] border-[#7C3AED] text-[#5B21B6]'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-[#F5F3FF]'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  required
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Specify departure reason..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#DDD7F3] bg-white text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/25 focus:border-[#7C3AED]"
                />
              </div>

              {/* Destination & Schedule */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div className="sm:col-span-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Destination / Escort
                  </label>
                  <input
                    type="text"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    placeholder="e.g., Home / Hospital"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#DDD7F3] bg-white text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/25 focus:border-[#7C3AED]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Exit Time
                  </label>
                  <input
                    type="time"
                    value={exitTime}
                    onChange={(e) => setExitTime(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#DDD7F3] bg-white text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/25 focus:border-[#7C3AED]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Expected Return
                  </label>
                  <input
                    type="time"
                    value={returnTime}
                    onChange={(e) => setReturnTime(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#DDD7F3] bg-white text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/25 focus:border-[#7C3AED]"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Security / Escort Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Parent ID verified, vehicle number, or special gate instructions..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#DDD7F3] bg-white text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/25 focus:border-[#7C3AED]"
                />
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsIssueModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] text-white text-sm font-bold shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-60"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>{submitting ? 'Issuing...' : isAdmin ? 'Issue & Approve' : 'Submit Request'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SLIP PREVIEW MODAL */}
      {previewItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#2E1065]/35 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl border border-[#DDD7F3] shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-[#5B21B6] via-[#6D38EA] to-[#7C3AED] text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/15 border border-white/25 flex items-center justify-center">
                  <Printer className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold">
                    Dual-Copy Gate Pass Preview ({previewItem.slipNumber || previewItem.id.slice(0, 8)})
                  </h3>
                  <p className="text-xs text-violet-100">
                    School Office Copy + Gate Security Copy • A4 Landscape Layout
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => printGatePassSlip(previewItem, schoolSettings)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-[#5B21B6] hover:bg-[#F5F3FF] text-xs font-bold shadow-sm cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Slip</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewItem(null)}
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/25 text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-5 overflow-auto bg-[#F4F7FC] flex-1">
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-3 overflow-x-auto">
                <GatePassPrint gatePass={previewItem} schoolSettings={schoolSettings} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* REJECT REASON MODAL */}
      {rejectConfirmItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#2E1065]/35 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl border border-[#DDD7F3] shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-5 py-4 bg-gradient-to-r from-[#BE123C] to-[#E11D48] text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <XCircle className="w-5 h-5" />
                <h3 className="font-bold text-base">Reject Gate Pass</h3>
              </div>
              <button
                type="button"
                onClick={() => setRejectConfirmItem(null)}
                className="p-1 rounded-lg bg-white/15 hover:bg-white/25 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-sm text-slate-600">
                Enter an optional rejection reason for{' '}
                <span className="font-bold text-slate-800">
                  {rejectConfirmItem.requestType === 'TEACHER'
                    ? rejectConfirmItem.requester?.name
                    : rejectConfirmItem.student?.user?.name}
                </span>
                .
              </p>
              <textarea
                rows={3}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Reason for rejecting this gate pass request..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500/25 focus:border-rose-500"
              />
              <div className="flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setRejectConfirmItem(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={actionBusyId === rejectConfirmItem.id}
                  onClick={() => handleUpdateStatus(rejectConfirmItem, 'REJECTED', rejectionReason.trim())}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold shadow-sm cursor-pointer disabled:opacity-60"
                >
                  Confirm Rejection
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteConfirmItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#2E1065]/35 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl border border-[#DDD7F3] shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-5 py-4 bg-gradient-to-r from-[#5B21B6] to-[#7C3AED] text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="w-5 h-5 text-amber-200" />
                <h3 className="font-bold text-base">Delete Gate Pass</h3>
              </div>
              <button
                type="button"
                onClick={() => setDeleteConfirmItem(null)}
                className="p-1 rounded-lg bg-white/15 hover:bg-white/25 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-sm text-slate-600">
                Are you sure you want to permanently remove slip{' '}
                <span className="font-bold text-slate-800">
                  {deleteConfirmItem.slipNumber || deleteConfirmItem.id.slice(0, 8)}
                </span>{' '}
                for{' '}
                <span className="font-bold text-slate-800">
                  {deleteConfirmItem.requestType === 'TEACHER'
                    ? deleteConfirmItem.requester?.name
                    : deleteConfirmItem.student?.user?.name}
                </span>
                ? This action cannot be undone.
              </p>
              <div className="flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setDeleteConfirmItem(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={actionBusyId === deleteConfirmItem.id}
                  onClick={handleDeletePass}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold shadow-sm cursor-pointer disabled:opacity-60"
                >
                  {actionBusyId === deleteConfirmItem.id ? 'Deleting...' : 'Delete Pass'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GatePassPage;
