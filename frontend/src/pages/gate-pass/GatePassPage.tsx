import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';
import api from '../../api/axios';
import { useAuth } from '../../hooks/useAuth';
import { 
  ShieldCheck, PlusCircle, Printer, Eye, Trash2, Clock, 
  LogOut, LogIn, CheckCircle2, XCircle, Search, Filter, 
  RefreshCw, User, Calendar, MapPin, Phone, AlertCircle, 
  Check, Copy, ChevronDown, X, Sparkles, AlertTriangle,
  Building, CheckSquare, Users, Activity
} from 'lucide-react';
import { GatePassPrint, printGatePassSlip } from '../../components/gate-pass/GatePassPrint';
import type { GatePassPrintData, SchoolSettingsData } from '../../components/gate-pass/GatePassPrint';
import { LoadingSpinner } from '../../components/UI/LoadingSpinner';
import { PageHeader } from '../../components/UI/PageHeader';
import { getPhotoUrl } from '../../utils/photo';

interface StudentOption {
  id: string;
  rollNo?: string;
  fatherName?: string;
  mobileNumber?: string;
  user?: { 
    id?: string;
    name: string; 
    phone?: string; 
    photoUrl?: string; 
  };
  class?: { 
    id?: string;
    name: string; 
    section: string; 
  };
}

interface Stats {
  inside: number;
  out: number;
  pending: number;
  todayTotal: number;
}

const REASON_CATEGORIES = [
  { label: '🏥 Medical / Health Issue', value: 'Medical Emergency / Health Issue' },
  { label: '👨‍👩‍👧 Family Emergency', value: 'Family Emergency / Urgent Work' },
  { label: '⏰ Early Permission', value: 'Early Permission from Principal' },
  { label: '🏆 Sports / Competition', value: 'Official School Competition / Sports' },
  { label: '📝 Personal / Other', value: 'Personal Matter' },
];

export const GatePassPage: React.FC = () => {
  const { user } = useAuth();
  const isAdminOrSecurity = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN' || user?.role === 'SECURITY';
  const isSuperAdminOrAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';

  // Base Data
  const [items, setItems] = useState<GatePassPrintData[]>([]);
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [schoolSettings, setSchoolSettings] = useState<SchoolSettingsData>({
    schoolName: 'SRI VENKATESWARA JY SCHOOL',
    schoolSubtitle: '(IIT-JEE / NEET Foundation – Olympiads)',
    address: 'Opp. Hero Showroom, SVL Paradise Campus, Narasannapeta',
    logoUrl: '/logo.png',
  });

  // Stats
  const [stats, setStats] = useState<Stats>({ inside: 0, out: 0, pending: 0, todayTotal: 0 });

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'PENDING' | 'APPROVED' | 'COMPLETED' | 'REJECTED'>('ALL');
  const [classFilter, setClassFilter] = useState('');
  const [dateFilter, setDateFilter] = useState<'TODAY' | 'ALL'>('TODAY');

  // Modals
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [previewItem, setPreviewItem] = useState<GatePassPrintData | null>(null);
  const [deleteConfirmItem, setDeleteConfirmItem] = useState<GatePassPrintData | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Form State
  const [formType, setFormType] = useState<'STUDENT' | 'TEACHER'>('STUDENT');
  const [selectedStudentClass, setSelectedStudentClass] = useState('');
  const [selectedStudentSection, setSelectedStudentSection] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [destination, setDestination] = useState('');
  const [exitTime, setExitTime] = useState(() => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  });
  const [returnTime, setReturnTime] = useState('');
  const [accompanyingPerson, setAccompanyingPerson] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Load School Settings & Stats
  const loadInitialData = async () => {
    try {
      const setRes = await api.get('/api/settings').catch(() => null);
      if (setRes?.data?.data || setRes?.data) {
        const s = setRes.data?.data || setRes.data;
        setSchoolSettings({
          schoolName: s.schoolName || 'SRI VENKATESWARA JY SCHOOL',
          schoolSubtitle: s.schoolSubtitle || '(IIT-JEE / NEET Foundation – Olympiads)',
          address: s.address || 'Opp. Hero Showroom, SVL Paradise Campus, Narasannapeta',
          logoUrl: s.logoUrl || '/logo.png',
          principalSignatureUrl: s.principalSignatureUrl,
        });
      }
    } catch (_) {}

    if (isAdminOrSecurity) {
      try {
        const [clsRes, stuRes] = await Promise.all([
          api.get('/api/classes?limit=1000').catch(() => ({ data: { data: [] } })),
          api.get('/api/students?limit=5000').catch(() => ({ data: { data: [] } })),
        ]);
        setClasses(clsRes.data?.data || clsRes.data || []);
        setStudents(stuRes.data?.data || stuRes.data || []);
      } catch (_) {}
    }
  };

  // Fetch Gate Passes & Stats
  const loadGatePasses = async (showLoadingSpinner = true) => {
    if (showLoadingSpinner) setLoading(true);
    else setRefreshing(true);

    try {
      const [statsRes, listRes] = await Promise.all([
        api.get('/api/gate-pass/stats').catch(() => null),
        api.get('/api/gate-pass?limit=200').catch(() => null),
      ]);

      if (statsRes?.data?.data) {
        setStats(statsRes.data.data);
      }

      if (listRes?.data?.data || listRes?.data) {
        const data = listRes.data?.data || listRes.data || [];
        setItems(data);
      }
    } catch (err) {
      console.error('Error fetching gate passes:', err);
      toast.error('Unable to fetch latest gate passes');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadInitialData();
    loadGatePasses(true);

    // Auto-refresh every 45s for security desk
    const interval = setInterval(() => {
      loadGatePasses(false);
    }, 45000);
    return () => clearInterval(interval);
  }, []);

  // Filtered List
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // 1. Status Filter
      if (statusFilter !== 'ALL') {
        if (statusFilter === 'ACTIVE' && item.status !== 'ACTIVE') return false;
        if (statusFilter === 'PENDING' && item.status !== 'PENDING') return false;
        if (statusFilter === 'APPROVED' && item.status !== 'APPROVED') return false;
        if (statusFilter === 'COMPLETED' && item.status !== 'COMPLETED') return false;
        if (statusFilter === 'REJECTED' && item.status !== 'REJECTED') return false;
      }

      // 2. Class Filter
      if (classFilter) {
        if (item.requestType !== 'STUDENT') return false;
        if (item.student?.class?.name !== classFilter) return false;
      }

      // 3. Date Filter
      if (dateFilter === 'TODAY' && item.createdAt) {
        const itemDate = new Date(item.createdAt).toDateString();
        const todayDate = new Date().toDateString();
        if (itemDate !== todayDate) return false;
      }

      // 4. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const slip = (item.slipNumber || '').toLowerCase();
        const studentName = (item.student?.user?.name || '').toLowerCase();
        const rollNo = (item.student?.rollNo || '').toLowerCase();
        const requesterName = (item.requester?.name || '').toLowerCase();
        const reason = (item.reason || '').toLowerCase();
        const destination = (item.destination || '').toLowerCase();

        return (
          slip.includes(q) ||
          studentName.includes(q) ||
          rollNo.includes(q) ||
          requesterName.includes(q) ||
          reason.includes(q) ||
          destination.includes(q)
        );
      }

      return true;
    });
  }, [items, statusFilter, classFilter, dateFilter, searchQuery]);

  // Unique Classes list for dropdown
  const uniqueClassNames = useMemo(() => {
    return Array.from(new Set(classes.map((c) => c.name))).filter(Boolean);
  }, [classes]);

  // Filtered student list for issue modal
  const modalAvailableStudents = useMemo(() => {
    return students.filter((s) => {
      if (selectedStudentClass && s.class?.name !== selectedStudentClass) return false;
      if (selectedStudentSection && s.class?.section !== selectedStudentSection) return false;
      return true;
    });
  }, [students, selectedStudentClass, selectedStudentSection]);

  const selectedStudentObj = useMemo(() => {
    return students.find((s) => s.id === selectedStudentId);
  }, [students, selectedStudentId]);

  // Issue Gate Pass Submit
  const handleIssuePass = async (autoPrint = false) => {
    if (formType === 'STUDENT' && !selectedStudentId) {
      toast.error('Please select a student');
      return;
    }
    if (!customReason.trim()) {
      toast.error('Please enter a reason for departure');
      return;
    }

    setSubmitting(true);
    try {
      const payload: any = {
        requestType: formType,
        reason: customReason.trim(),
        destination: destination.trim() || undefined,
        exitTime: exitTime || undefined,
        returnTime: returnTime || undefined,
        notes: accompanyingPerson.trim() ? `Escorted by: ${accompanyingPerson.trim()}` : undefined,
      };

      if (formType === 'STUDENT') {
        payload.studentId = selectedStudentId;
      }

      const res = await api.post('/api/gate-pass', payload);
      const createdItem = res.data?.data || res.data;

      toast.success(isAdminOrSecurity ? 'Gate Pass Issued Successfully!' : 'Pass Requested Successfully!');
      setIsIssueModalOpen(false);

      // Reset form
      setSelectedStudentId('');
      setCustomReason('');
      setDestination('');
      setReturnTime('');
      setAccompanyingPerson('');

      // Refresh data
      await loadGatePasses(false);

      // Auto Print if requested
      if (autoPrint && createdItem) {
        setTimeout(() => {
          printGatePassSlip(createdItem, schoolSettings);
        }, 300);
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to issue gate pass');
    } finally {
      setSubmitting(false);
    }
  };

  // Status Actions: Mark Exit (OUT) / Mark Return (IN)
  const handleMarkStatus = async (id: string, action: 'EXIT' | 'RETURN') => {
    try {
      await api.patch(`/api/gate-pass/${id}`, {
        status: action === 'EXIT' ? 'ACTIVE' : 'COMPLETED',
      });
      toast.success(action === 'EXIT' ? 'Marked OUT (Left Campus)' : 'Marked IN (Safely Returned)');
      loadGatePasses(false);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to update status');
    }
  };

  // Approval / Rejection
  const handleApproveReject = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      await api.patch(`/api/gate-pass/${id}`, {
        status,
        rejectionReason: status === 'REJECTED' ? 'Rejected by Administration' : undefined,
      });
      toast.success(`Gate pass ${status.toLowerCase()} successfully`);
      loadGatePasses(false);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to update status');
    }
  };






  // Delete Gate Pass
  const handleDeletePass = async () => {
    if (!deleteConfirmItem) return;
    setDeleting(true);
    try {
      await api.delete(`/api/gate-pass/${deleteConfirmItem.id}`);
      toast.success('Gate pass deleted successfully');
      setDeleteConfirmItem(null);
      loadGatePasses(false);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to delete gate pass');
    } finally {
      setDeleting(false);
    }

  };

  return (
    <div className="flex flex-col h-full bg-slate-50/70" style={{ minHeight: 'calc(100vh - 64px)' }}>
      {/* Top Banner */}
      <PageHeader
        title="Gate Pass Command Center"
        icon={<ShieldCheck className="w-5 h-5 text-indigo-600" />}
      />

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
        <div className="max-w-[1600px] mx-auto space-y-6">

          {/* Top Hero Card */}
          <div className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-blue-700 rounded-3xl p-6 md:p-8 text-white shadow-xl shadow-indigo-600/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
            <div className="absolute right-0 top-0 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="relative z-10 space-y-2">
              <div className="inline-flex items-center gap-2 bg-white/20 text-white px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider border border-white/20">
                <ShieldCheck className="w-4 h-4 text-white" /> Security & Movement Desk
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white drop-shadow-sm">
                Gate Pass Management
              </h1>
              <p className="text-xs sm:text-sm text-indigo-100 font-medium max-w-2xl leading-relaxed">
                Issue, monitor, verify, and print official departure gate passes with student photo, authorized signatures, and dual-copy slips.
              </p>
            </div>

            <div className="relative z-10 flex flex-wrap items-center gap-3">
              <button
                onClick={() => loadGatePasses(false)}
                disabled={refreshing}
                className="bg-white/10 hover:bg-white/20 active:scale-95 text-white text-xs font-black px-4 py-3 rounded-2xl border border-white/15 transition-all flex items-center gap-2 shadow-sm cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>

              {isAdminOrSecurity && (
                <button
                  onClick={() => setIsIssueModalOpen(true)}
                  className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 active:scale-95 text-white text-xs font-black uppercase tracking-wider px-6 py-3.5 rounded-2xl shadow-lg shadow-indigo-500/30 transition-all flex items-center gap-2.5 cursor-pointer hover:-translate-y-0.5"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Issue Gate Pass</span>
                </button>
              )}
            </div>
          </div>

          {/* 4 Live Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Today's Passes */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/70 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-black text-slate-400 uppercase tracking-wider">Passes Today</span>
                <div className="p-2.5 bg-blue-50 text-blue-600 rounded-2xl">
                  <Activity className="w-5 h-5" />
                </div>
              </div>
              <div className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">
                {stats.todayTotal || items.filter(i => new Date(i.createdAt || '').toDateString() === new Date().toDateString()).length}
              </div>
              <p className="text-[11px] font-semibold text-slate-500 mt-1">Total departures logged today</p>
            </div>

            {/* Card 2: Currently Outside */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/70 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-black text-amber-600 uppercase tracking-wider">Currently Outside</span>
                <div className="p-2.5 bg-amber-50 text-amber-600 rounded-2xl">
                  <LogOut className="w-5 h-5" />
                </div>
              </div>
              <div className="text-3xl font-black text-amber-600 tracking-tight flex items-center gap-2">
                <span>{stats.out || items.filter(i => i.status === 'ACTIVE').length}</span>
                {items.filter(i => i.status === 'ACTIVE').length > 0 && (
                  <span className="inline-flex w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
                )}
              </div>
              <p className="text-[11px] font-semibold text-slate-500 mt-1">Out of campus right now</p>
            </div>

            {/* Card 3: Pending Approval */}
            <div 
              onClick={() => setStatusFilter('PENDING')}
              className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/70 shadow-sm relative overflow-hidden group hover:shadow-md transition-all cursor-pointer hover:border-purple-300"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-black text-purple-600 uppercase tracking-wider">Pending Approval</span>
                <div className="p-2.5 bg-purple-50 text-purple-600 rounded-2xl">
                  <Clock className="w-5 h-5" />
                </div>
              </div>
              <div className="text-3xl font-black text-purple-600 tracking-tight">
                {stats.pending || items.filter(i => i.status === 'PENDING').length}
              </div>
              <p className="text-[11px] font-semibold text-slate-500 mt-1">Awaiting principal / admin review</p>
            </div>

            {/* Card 4: Safely Returned */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/70 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-black text-emerald-600 uppercase tracking-wider">Safely Returned</span>
                <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-2xl">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              </div>
              <div className="text-3xl font-black text-emerald-600 tracking-tight">
                {items.filter(i => i.status === 'COMPLETED').length}
              </div>
              <p className="text-[11px] font-semibold text-slate-500 mt-1">Completed passes returned</p>
            </div>
          </div>

          {/* Control Toolbar */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/70 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
              {/* Search Bar */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search student, roll no, slip #, reason..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Class Filter & Date Filter */}
              <div className="flex flex-wrap items-center gap-3">
                <select
                  value={classFilter}
                  onChange={(e) => setClassFilter(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-3.5 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
                >
                  <option value="">All Classes</option>
                  {uniqueClassNames.map((name) => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>

                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
                  <button
                    onClick={() => setDateFilter('TODAY')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      dateFilter === 'TODAY' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-xs' : 'text-slate-500'
                    }`}
                  >
                    Today
                  </button>
                  <button
                    onClick={() => setDateFilter('ALL')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      dateFilter === 'ALL' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-xs' : 'text-slate-500'
                    }`}
                  >
                    All Records
                  </button>
                </div>
              </div>
            </div>

            {/* Status Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 no-scrollbar border-t border-slate-100 dark:border-slate-800">
              {[
                { id: 'ALL', label: 'All Passes', count: items.length },
                { id: 'ACTIVE', label: 'Outside Campus', count: items.filter(i => i.status === 'ACTIVE').length },
                { id: 'PENDING', label: 'Pending Approval', count: items.filter(i => i.status === 'PENDING').length },
                { id: 'APPROVED', label: 'Approved', count: items.filter(i => i.status === 'APPROVED').length },
                { id: 'COMPLETED', label: 'Safely Returned', count: items.filter(i => i.status === 'COMPLETED').length },
                { id: 'REJECTED', label: 'Rejected', count: items.filter(i => i.status === 'REJECTED').length },
              ].map((pill) => (
                <button
                  key={pill.id}
                  onClick={() => setStatusFilter(pill.id as any)}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
                    statusFilter === pill.id
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
                  }`}
                >
                  <span>{pill.label}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                    statusFilter === pill.id ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600'
                  }`}>
                    {pill.count}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Records Table */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200/70 dark:border-slate-800 overflow-hidden">
            {loading ? (
              <div className="py-24 flex flex-col items-center justify-center space-y-3">
                <LoadingSpinner size="lg" />
                <p className="text-xs font-bold text-slate-400">Loading gate passes...</p>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="py-20 flex flex-col items-center justify-center text-center px-4">
                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-3xl mb-3">
                  <ShieldCheck className="w-12 h-12 text-slate-300" />
                </div>
                <h3 className="text-base font-black text-slate-700 dark:text-slate-300">No Gate Passes Found</h3>
                <p className="text-xs font-semibold text-slate-400 mt-1 max-w-sm">
                  {searchQuery || statusFilter !== 'ALL' || classFilter
                    ? 'No passes match your selected filters. Try resetting the search or status filter.'
                    : 'No gate passes have been issued yet. Click "Issue Gate Pass" to create one.'}
                </p>
                {isAdminOrSecurity && (
                  <button
                    onClick={() => setIsIssueModalOpen(true)}
                    className="mt-5 btn-primary text-xs font-bold px-5 py-2.5 rounded-xl flex items-center gap-2"
                  >
                    <PlusCircle className="w-4 h-4" /> Issue Gate Pass
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-slate-400 font-extrabold uppercase tracking-wider text-[11px]">
                      <th className="py-4 px-6">Pass Details</th>
                      <th className="py-4 px-6">Person Profile</th>
                      <th className="py-4 px-6">Reason & Destination</th>
                      <th className="py-4 px-6">Timings</th>
                      <th className="py-4 px-6">Status</th>
                      <th className="py-4 px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                    {filteredItems.map((item) => {
                      const isTeacher = item.requestType === 'TEACHER';
                      const personName = isTeacher ? item.requester?.name : item.student?.user?.name;
                      const rawPhoto = isTeacher ? item.requester?.photoUrl : item.student?.user?.photoUrl;
                      const photoUrl = rawPhoto ? getPhotoUrl(rawPhoto) : '';
                      const rollNo = item.student?.rollNo;
                      const className = item.student?.class ? `${item.student.class.name} - ${item.student.class.section}` : '';
                      const slipNo = item.slipNumber || `GP-${item.id.substring(0, 6).toUpperCase()}`;

                      return (
                        <tr key={item.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors group">
                          {/* Col 1: Pass Details */}
                          <td className="py-4 px-6 align-middle">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-black text-slate-900 dark:text-white text-sm tracking-tight">
                                #{slipNo}
                              </span>
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(slipNo);
                                  toast.success('Slip number copied');
                                }}
                                title="Copy Slip #"
                                className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-slate-600 transition-opacity"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <div className="text-[11px] font-bold text-slate-400 mt-0.5">
                              {item.createdAt ? format(new Date(item.createdAt), 'dd MMM yyyy, hh:mm a') : '--'}
                            </div>
                          </td>

                          {/* Col 2: Person Profile */}
                          <td className="py-4 px-6 align-middle">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0">
                                {photoUrl ? (
                                  <img src={photoUrl} alt="Photo" className="w-full h-full object-cover" />
                                ) : (
                                  <User className="w-4 h-4 text-slate-400" />
                                )}
                              </div>
                              <div>
                                <div className="font-black text-slate-800 dark:text-slate-100 text-xs">
                                  {personName || 'N/A'}
                                </div>
                                <div className="text-[11px] font-bold text-slate-500 flex items-center gap-1.5 mt-0.5">
                                  {!isTeacher ? (
                                    <>
                                      <span className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-[10px] text-slate-700 dark:text-slate-300">
                                        Class: {className || 'N/A'}
                                      </span>
                                      {rollNo && <span>· Roll: {rollNo}</span>}
                                    </>
                                  ) : (
                                    <span className="bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded text-[10px]">Staff Member</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Col 3: Reason & Destination */}
                          <td className="py-4 px-6 align-middle max-w-xs">
                            <div className="font-bold text-slate-800 dark:text-slate-200 truncate" title={item.reason}>
                              {item.reason}
                            </div>
                            <div className="text-[11px] font-semibold text-slate-500 flex items-center gap-1.5 mt-0.5">
                              <MapPin className="w-3 h-3 text-rose-500 shrink-0" />
                              <span className="truncate">{item.destination || 'Not Specified'}</span>
                            </div>
                          </td>

                          {/* Col 4: Timings */}
                          <td className="py-4 px-6 align-middle">
                            <div className="space-y-0.5 font-bold text-[11px]">
                              <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                                <span className="text-slate-400 font-semibold w-12">Exit:</span>
                                <span className="text-rose-600 font-black">{item.exitTime || '--:--'}</span>
                              </div>
                              <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                                <span className="text-slate-400 font-semibold w-12">Return:</span>
                                <span className="text-emerald-600 font-black">{item.returnTime || '--:--'}</span>
                              </div>
                            </div>
                          </td>

                          {/* Col 5: Status */}
                          <td className="py-4 px-6 align-middle">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider border ${
                              item.status === 'APPROVED' ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300' :
                              item.status === 'ACTIVE' ? 'bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-900/30 dark:text-amber-300 animate-pulse' :
                              item.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300' :
                              item.status === 'REJECTED' ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-300' :
                              'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300'
                            }`}>
                              {item.status === 'ACTIVE' ? 'OUTSIDE' : item.status === 'COMPLETED' ? 'RETURNED' : item.status}
                            </span>
                          </td>

                          {/* Col 6: Actions */}
                          <td className="py-4 px-6 align-middle text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* 1. Quick Print Slip */}
                              <button
                                onClick={() => printGatePassSlip(item, schoolSettings)}
                                title="Print Gate Pass (Iframe - 100% Crisp)"
                                className="p-2 bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-600 rounded-xl transition-all border border-slate-200 cursor-pointer shadow-xs active:scale-95"
                              >
                                <Printer className="w-4 h-4" />
                              </button>

                              {/* 2. Visual Preview */}
                              <button
                                onClick={() => setPreviewItem(item)}
                                title="Preview Dual-Copy Slip"
                                className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all border border-slate-200 cursor-pointer shadow-xs active:scale-95"
                              >
                                <Eye className="w-4 h-4" />
                              </button>

                              {/* 3. Mark Out / In for Security Desk */}
                              {isAdminOrSecurity && item.status === 'APPROVED' && (
                                <button
                                  onClick={() => handleMarkStatus(item.id, 'EXIT')}
                                  title="Mark student as EXITED (OUT)"
                                  className="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1 shadow-sm active:scale-95"
                                >
                                  <LogOut className="w-3 h-3" /> OUT
                                </button>
                              )}

                              {isAdminOrSecurity && item.status === 'ACTIVE' && (
                                <button
                                  onClick={() => handleMarkStatus(item.id, 'RETURN')}
                                  title="Mark student as RETURNED (IN)"
                                  className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1 shadow-sm active:scale-95"
                                >
                                  <LogIn className="w-3 h-3" /> IN
                                </button>
                              )}

                              {/* 4. Approve / Reject for Pending Passes */}
                              {isAdminOrSecurity && item.status === 'PENDING' && (
                                <>
                                  <button
                                    onClick={() => handleApproveReject(item.id, 'APPROVED')}
                                    title="Approve Pass"
                                    className="p-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-xl transition-all border border-emerald-200 cursor-pointer active:scale-95"
                                  >
                                    <CheckCircle2 className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleApproveReject(item.id, 'REJECTED')}
                                    title="Reject Pass"
                                    className="p-2 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-xl transition-all border border-rose-200 cursor-pointer active:scale-95"
                                  >
                                    <XCircle className="w-4 h-4" />
                                  </button>
                                </>
                              )}

                              {/* 5. Delete Pass (Admin / Super Admin) */}
                              {isSuperAdminOrAdmin && (
                                <button
                                  onClick={() => setDeleteConfirmItem(item)}
                                  title="Delete Gate Pass Record"
                                  className="p-2 bg-slate-100 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-xl transition-all border border-slate-200 hover:border-rose-200 cursor-pointer shadow-xs active:scale-95"
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
            )}
          </div>

        </div>
      </div>

      {/* ══ MODAL 1: ISSUE GATE PASS ══ */}
      {isIssueModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh] animate-scale-up">
            {/* Modal Header */}
            <div className="p-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-500/20 rounded-xl border border-indigo-400/20 text-indigo-300">
                  <PlusCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black tracking-tight">Issue Official Gate Pass</h3>
                  <p className="text-xs text-slate-300 font-medium">Record student/staff campus departure with live approval</p>
                </div>
              </div>
              <button 
                onClick={() => setIsIssueModalOpen(false)}
                className="p-2 hover:bg-white/10 rounded-full text-slate-300 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5 flex-1">
              {/* Type Switcher */}
              <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setFormType('STUDENT')}
                  className={`flex-1 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                    formType === 'STUDENT' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-xs' : 'text-slate-500'
                  }`}
                >
                  Student Departure Pass
                </button>
                <button
                  type="button"
                  onClick={() => setFormType('TEACHER')}
                  className={`flex-1 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                    formType === 'TEACHER' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-xs' : 'text-slate-500'
                  }`}
                >
                  Staff / Teacher Pass
                </button>
              </div>

              {/* Student Picker */}
              {formType === 'STUDENT' && (
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/80 dark:border-slate-700 space-y-3">
                  <div className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
                    <User className="w-4 h-4 text-indigo-600" /> Select Student
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-slate-500 block mb-1">Filter Class</label>
                      <select
                        value={selectedStudentClass}
                        onChange={(e) => {
                          setSelectedStudentClass(e.target.value);
                          setSelectedStudentId('');
                        }}
                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 outline-none"
                      >
                        <option value="">All Classes</option>
                        {uniqueClassNames.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-500 block mb-1">Select Student</label>
                      <select
                        value={selectedStudentId}
                        onChange={(e) => setSelectedStudentId(e.target.value)}
                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 outline-none"
                      >
                        <option value="">Choose student...</option>
                        {modalAvailableStudents.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.user?.name} {s.rollNo ? `(Roll: ${s.rollNo})` : ''} - {s.class?.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Selected Student Preview Card */}
                  {selectedStudentObj && (
                    <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-indigo-200/70 dark:border-indigo-900/50 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                        {selectedStudentObj.user?.photoUrl ? (
                          <img src={getPhotoUrl(selectedStudentObj.user.photoUrl)} alt="Photo" className="w-full h-full object-cover" />
                        ) : (
                          <User className="w-full h-full p-2 text-slate-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-black text-slate-900 dark:text-white truncate">
                          {selectedStudentObj.user?.name}
                        </div>
                        <div className="text-[10px] font-bold text-slate-500">
                          Class: {selectedStudentObj.class?.name}-{selectedStudentObj.class?.section} · Roll: {selectedStudentObj.rollNo || 'N/A'} · Father: {selectedStudentObj.fatherName || 'N/A'}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Reason Category Chips */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Quick Reason Template</label>
                <div className="flex flex-wrap gap-2">
                  {REASON_CATEGORIES.map((cat) => (
                    <button
                      key={cat.label}
                      type="button"
                      onClick={() => setCustomReason(cat.value)}
                      className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                        customReason === cat.value
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Specific Reason & Destination */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Specific Reason <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Severe headache, Dental appointment"
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Destination</label>
                  <input
                    type="text"
                    placeholder="e.g. Home, SVL Hospital, Narasannapeta"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>

              {/* Times */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Departure Time (Exit)</label>
                  <input
                    type="time"
                    value={exitTime}
                    onChange={(e) => setExitTime(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Expected Return Time</label>
                  <input
                    type="time"
                    placeholder="Leave empty if not returning today"
                    value={returnTime}
                    onChange={(e) => setReturnTime(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>

              {/* Accompanying Person */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Accompanying Guardian / Escort Name (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Father, Mother, Self"
                  value={accompanyingPerson}
                  onChange={(e) => setAccompanyingPerson(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsIssueModalOpen(false)}
                className="px-5 py-2.5 rounded-xl text-xs font-black uppercase text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={submitting}
                onClick={() => handleIssuePass(false)}
                className="btn-secondary text-xs font-black uppercase px-5 py-2.5 rounded-xl cursor-pointer disabled:opacity-50"
              >
                {submitting ? 'Issuing...' : 'Issue Pass'}
              </button>

              <button
                type="button"
                disabled={submitting}
                onClick={() => handleIssuePass(true)}
                className="btn-primary text-xs font-black uppercase px-6 py-2.5 rounded-xl flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
              >
                <Printer className="w-4 h-4" />
                <span>Issue & Print Immediately</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ MODAL 2: PREVIEW DUAL-COPY SLIP ══ */}
      {previewItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[92vh] animate-scale-up">
            <div className="p-5 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex justify-between items-center">
              <div className="flex items-center gap-2.5">
                <Printer className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-black">Gate Pass Slip Preview (A4 2-Copy Layout)</h3>
              </div>
              <button onClick={() => setPreviewItem(null)} className="p-2 hover:bg-white/10 rounded-full text-slate-300 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 bg-slate-50 dark:bg-slate-950">
              <GatePassPrint
                gatePass={previewItem}
                schoolSettings={schoolSettings}
              />
            </div>

            <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">
                Printed format contains Student Copy & Security Copy on 1 single sheet.
              </span>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setPreviewItem(null)}
                  className="px-4 py-2 rounded-xl text-xs font-black uppercase text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    printGatePassSlip(previewItem, schoolSettings);
                    setPreviewItem(null);
                  }}
                  className="btn-primary text-xs font-black uppercase px-6 py-2.5 rounded-xl flex items-center gap-2 cursor-pointer shadow-md"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Slip Now</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══ MODAL 3: DELETE CONFIRMATION ══ */}
      {deleteConfirmItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-5 animate-scale-up">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-rose-50 dark:bg-rose-900/30 text-rose-600 rounded-2xl">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">Delete Gate Pass?</h3>
                <p className="text-xs font-semibold text-slate-500">This action cannot be undone.</p>
              </div>
            </div>

            <div className="p-4 bg-rose-50/60 dark:bg-rose-950/20 rounded-2xl border border-rose-100 dark:border-rose-900/40 text-xs text-rose-800 dark:text-rose-300 space-y-1">
              <div>Are you sure you want to permanently delete Gate Pass:</div>
              <div className="font-mono font-black text-sm text-rose-900 dark:text-rose-200">
                #{deleteConfirmItem.slipNumber || deleteConfirmItem.id}
              </div>
              <div className="text-[11px] text-rose-600 dark:text-rose-400">
                Person: {deleteConfirmItem.student?.user?.name || deleteConfirmItem.requester?.name || 'N/A'}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmItem(null)}
                className="px-5 py-2.5 rounded-xl text-xs font-black uppercase text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleDeletePass}
                className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-black uppercase px-6 py-2.5 rounded-xl shadow-md shadow-rose-600/20 cursor-pointer disabled:opacity-50 flex items-center gap-2"
              >
                {deleting ? <LoadingSpinner size="sm" /> : <Trash2 className="w-4 h-4" />}
                <span>Yes, Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default GatePassPage;
