import React, { useEffect, useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../../hooks/useAuth';
import api from '../../api/axios';
import { LoadingSpinner } from '../../components/UI/LoadingSpinner';
import { getPhotoUrl } from '../../utils/photo';
import {
  CalendarCheck, CheckCircle2, XCircle, AlertCircle,
  ChevronLeft, ChevronRight, Save, UserCheck, FileText,
  Search, CheckCheck, Users, Clock, Calendar, Check, X,
  Filter, Sparkles, ShieldCheck, Mail
} from 'lucide-react';
import { PageHeader } from '../../components/UI/PageHeader';
import { toast } from 'react-hot-toast';

interface Teacher {
  id: string;
  employeeId: string;
  qualification?: string;
  specialization?: string;
  user: { id: string; name: string; email: string; phone?: string; photoUrl?: string };
}

interface AttRecord { 
  id: string; 
  teacherId: string; 
  date: string; 
  status: string; 
  note?: string;
}

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

const STATUS_OPTIONS = [
  { key: 'PRESENT', label: 'Present', short: 'P', color: 'emerald' },
  { key: 'ABSENT', label: 'Absent', short: 'A', color: 'rose' },
  { key: 'LEAVE', label: 'Leave', short: 'L', color: 'amber' },
  { key: 'HALF_DAY', label: 'Half Day', short: '½', color: 'sky' },
];

const STATUS_COLORS: Record<string, { bg: string; text: string; border: string; icon: React.ElementType }> = {
  PRESENT:  { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', icon: CheckCircle2 },
  ABSENT:   { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', icon: XCircle },
  LEAVE:    { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', icon: AlertCircle },
  HALF_DAY: { bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200', icon: CalendarCheck },
};

const formatLocalYMD = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

// Match record date reliably across UTC midnight (T00:00:00Z) and legacy local-timezone shifted entries
const matchesSelectedDate = (rawDate: string, targetYmd: string): boolean => {
  if (!rawDate) return false;
  const utcYmd = String(rawDate).split('T')[0];
  if (utcYmd === targetYmd) return true;
  const localYmd = formatLocalYMD(new Date(rawDate));
  return localYmd === targetYmd;
};

export const TeacherAttendancePage: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';
  const isTeacher = user?.role === 'TEACHER';

  const today = new Date();
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth());
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState(() => formatLocalYMD(new Date()));

  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [records, setRecords] = useState<AttRecord[]>([]);
  const [myRecords, setMyRecords] = useState<AttRecord[]>([]);
  const [summary, setSummary] = useState({ present: 0, absent: 0, halfDay: 0, total: 0, rate: 0 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [attendanceMap, setAttendanceMap] = useState<Record<string, string>>({});
  const [noteMap, setNoteMap] = useState<Record<string, string>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [historyLogs, setHistoryLogs] = useState<any[]>([]);

  // 1. Fetch Teachers (Admin Only)
  const fetchTeachers = async () => {
    try {
      const res: any = await api.get('/api/teachers', { params: { limit: 500 } });
      setTeachers(res.data?.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  // 2. Fetch Attendance Records for selected date/month
  const fetchRecords = async () => {
    setLoading(true);
    try {
      if (isAdmin) {
        const res: any = await api.get('/api/teacher-attendance', {
          params: { month: selectedMonth + 1, year: selectedYear }
        });
        const recList = res.data?.data || [];
        setRecords(recList);

        // Build attendance map for selectedDate
        const dateRecords = recList.filter((r: AttRecord) => matchesSelectedDate(r.date, selectedDate));

        const map: Record<string, string> = {};
        const notes: Record<string, string> = {};
        dateRecords.forEach((r: AttRecord) => {
          map[r.teacherId] = r.status;
          notes[r.teacherId] = r.note || '';
        });
        setAttendanceMap(map);
        setNoteMap(notes);
      } else {
        const [attRes, leaveRes, gpRes]: any = await Promise.all([
          api.get('/api/teacher-attendance', { params: { month: selectedMonth + 1, year: selectedYear } }),
          api.get('/api/leave/my?limit=5000').catch(() => ({ data: { data: [] } })),
          api.get('/api/gate-pass?limit=5000').catch(() => ({ data: { data: [] } }))
        ]);
        const arr = attRes.data?.data || [];
        setMyRecords(arr);

        const leaves = (leaveRes.data?.data || []).map((l: any) => ({ ...l, logType: l.type || 'LEAVE' }));
        const passes = (gpRes.data?.data || []).map((gp: any) => ({ ...gp, logType: 'GATEPASS' }));
        const combined = [...leaves, ...passes].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setHistoryLogs(combined);

        const present = arr.filter((r: AttRecord) => r.status === 'PRESENT' || r.status === 'LATE').length;
        const absent = arr.filter((r: AttRecord) => r.status === 'ABSENT').length;
        const halfDay = arr.filter((r: AttRecord) => r.status === 'HALF_DAY').length;
        setSummary({
          present,
          absent,
          halfDay,
          total: arr.length,
          rate: arr.length > 0 ? Math.round((present / arr.length) * 100) : 0
        });
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.message || 'Failed to load staff attendance records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) fetchTeachers();
  }, [isAdmin]);

  useEffect(() => {
    fetchRecords();
  }, [selectedMonth, selectedYear, selectedDate, isAdmin]);

  // Statistics calculation for Admin
  const adminStats = useMemo(() => {
    let present = 0, absent = 0, leave = 0, halfDay = 0;
    teachers.forEach(t => {
      const status = attendanceMap[t.id] || 'PRESENT';
      if (status === 'PRESENT') present++;
      else if (status === 'ABSENT') absent++;
      else if (status === 'LEAVE') leave++;
      else if (status === 'HALF_DAY') halfDay++;
    });
    const total = teachers.length;
    const rate = total > 0 ? Math.round((present / total) * 100) : 100;
    return { present, absent, leave, halfDay, total, rate };
  }, [teachers, attendanceMap]);

  // Filtered staff list for search and status filters
  const filteredTeachers = useMemo(() => {
    return teachers.filter(t => {
      const matchesSearch = 
        t.user.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        t.employeeId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.user.email && t.user.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (t.specialization && t.specialization.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchesSearch) return false;

      const status = attendanceMap[t.id] || 'PRESENT';
      if (statusFilter === 'ALL') return true;
      return status === statusFilter;
    });
  }, [teachers, searchQuery, statusFilter, attendanceMap]);

  // Quick Action: Mark All Present
  const handleMarkAllPresent = () => {
    const newMap = { ...attendanceMap };
    filteredTeachers.forEach(t => {
      newMap[t.id] = 'PRESENT';
    });
    setAttendanceMap(newMap);
    toast.success('Marked all staff as Present');
  };

  // Quick Action: Mark Individual Status
  const handleSetStatus = (teacherId: string, status: string) => {
    setAttendanceMap(prev => ({
      ...prev,
      [teacherId]: status
    }));
  };

  // Quick Action: Update Note
  const handleNoteChange = (teacherId: string, note: string) => {
    setNoteMap(prev => ({
      ...prev,
      [teacherId]: note
    }));
  };

  // Bulk Save Attendance to Backend
  const handleBulkSave = async () => {
    if (teachers.length === 0) {
      toast.error('No staff records loaded to save');
      return;
    }
    setSaving(true);
    try {
      const recs = teachers.map(t => ({
        teacherId: t.id,
        status: attendanceMap[t.id] || 'PRESENT',
        note: noteMap[t.id] || '',
      }));

      await api.post('/api/teacher-attendance/bulk-mark', { 
        date: selectedDate, 
        records: recs 
      });

      toast.success('Staff attendance saved successfully!');
      await fetchRecords();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to save attendance');
    } finally {
      setSaving(false);
    }
  };

  const navigateMonth = (dir: number) => {
    const d = new Date(selectedYear, selectedMonth + dir, 1);
    setSelectedMonth(d.getMonth());
    setSelectedYear(d.getFullYear());
  };

  if (loading && teachers.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 bg-slate-50 min-h-screen">
        <LoadingSpinner size="lg" />
        <p className="text-sm font-bold text-slate-500 mt-4">Loading staff attendance register...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-50 text-slate-800 min-h-screen">
      <PageHeader 
        title={isAdmin ? "Staff Attendance Manager" : "My Attendance Register"}
        icon={<CalendarCheck className="w-5 h-5" />}
      />

      <div className="flex-1 overflow-auto p-4 sm:p-6 md:p-8 space-y-6">
        <div className="w-full max-w-7xl mx-auto space-y-6">

          {/* ── ADMIN VIEW: ENTERPRISE LIST LAYOUT ───────────────────────────── */}
          {isAdmin && (
            <div className="space-y-6 pb-28">

              {/* 4 Premium Metric KPI Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* Total Staff */}
                <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">Total Staff</span>
                    <div className="text-3xl font-black text-slate-900 mt-1">{adminStats.total}</div>
                    <div className="text-xs text-slate-500 font-medium mt-0.5">Teaching Faculty</div>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                    <Users className="w-6 h-6" />
                  </div>
                </div>

                {/* Present Today */}
                <div className="p-5 rounded-2xl bg-white border border-emerald-200/80 shadow-sm hover:shadow-md transition-shadow flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-black uppercase tracking-wider text-emerald-600">Present Today</span>
                    <div className="text-3xl font-black text-emerald-600 mt-1">{adminStats.present}</div>
                    <div className="text-xs text-emerald-600/80 font-bold mt-0.5">{adminStats.rate}% Attendance</div>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                </div>

                {/* Absent */}
                <div className="p-5 rounded-2xl bg-white border border-rose-200/80 shadow-sm hover:shadow-md transition-shadow flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-black uppercase tracking-wider text-rose-600">Absent Today</span>
                    <div className="text-3xl font-black text-rose-600 mt-1">{adminStats.absent}</div>
                    <div className="text-xs text-rose-600/80 font-medium mt-0.5">Unexcused leaves</div>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
                    <XCircle className="w-6 h-6" />
                  </div>
                </div>

                {/* Leave / Half Day */}
                <div className="p-5 rounded-2xl bg-white border border-amber-200/80 shadow-sm hover:shadow-md transition-shadow flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-black uppercase tracking-wider text-amber-600">On Leave / Half Day</span>
                    <div className="text-3xl font-black text-amber-600 mt-1">{adminStats.leave + adminStats.halfDay}</div>
                    <div className="text-xs text-amber-600/80 font-medium mt-0.5">{adminStats.leave} Leave &bull; {adminStats.halfDay} Half Day</div>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
                    <AlertCircle className="w-6 h-6" />
                  </div>
                </div>
              </div>

              {/* Smart Search & Control Toolbar */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
                
                {/* Search Box */}
                <div className="flex-1 flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus-within:bg-white focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all">
                  <Search className="w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search staff by Name, Employee ID (e.g. SVJY-1140)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-transparent border-none text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none"
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery('')} className="text-slate-400 hover:text-slate-700">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Status Filter Chips */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
                  <button
                    onClick={() => setStatusFilter('ALL')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
                      statusFilter === 'ALL'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
                    }`}
                  >
                    All ({adminStats.total})
                  </button>
                  <button
                    onClick={() => setStatusFilter('PRESENT')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
                      statusFilter === 'PRESENT'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                    }`}
                  >
                    Present ({adminStats.present})
                  </button>
                  <button
                    onClick={() => setStatusFilter('ABSENT')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
                      statusFilter === 'ABSENT'
                        ? 'bg-rose-600 text-white shadow-sm'
                        : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                    }`}
                  >
                    Absent ({adminStats.absent})
                  </button>
                  <button
                    onClick={() => setStatusFilter('LEAVE')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
                      statusFilter === 'LEAVE'
                        ? 'bg-amber-600 text-white shadow-sm'
                        : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
                    }`}
                  >
                    Leave ({adminStats.leave})
                  </button>
                </div>

                {/* Date Picker & Month Navigator */}
                <div className="flex items-center gap-2 shrink-0">
                  <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800">
                    <Calendar className="w-4 h-4 text-indigo-600" />
                    <input
                      type="date"
                      value={selectedDate}
                      max={formatLocalYMD(today)}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSelectedDate(val);
                        if (val) {
                          const [y, m] = val.split('-').map(Number);
                          if (y && m) {
                            setSelectedYear(y);
                            setSelectedMonth(m - 1);
                          }
                        }
                      }}
                      className="bg-transparent border-none text-slate-800 text-xs font-bold focus:outline-none cursor-pointer"
                    />
                  </div>

                  {/* Month Navigation */}
                  <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl p-1">
                    <button
                      onClick={() => navigateMonth(-1)}
                      className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-white shadow-2xs transition"
                      title="Previous Month"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-[11px] font-bold px-2 text-slate-700">
                      {MONTHS[selectedMonth].slice(0, 3)} {selectedYear}
                    </span>
                    <button
                      onClick={() => navigateMonth(1)}
                      disabled={selectedMonth === today.getMonth() && selectedYear === today.getFullYear()}
                      className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-white shadow-2xs transition disabled:opacity-30"
                      title="Next Month"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

              </div>

              {/* ── THE ENTERPRISE STAFF LIST / TABLE ───────────────────────── */}
              <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
                
                {/* Table Header Strip */}
                <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/80 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-indigo-600" />
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
                      Daily Attendance Register &bull; {new Date(selectedDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </h3>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-500">
                      Showing <strong className="text-slate-900">{filteredTeachers.length}</strong> of {teachers.length} Staff
                    </span>
                    <button
                      onClick={handleMarkAllPresent}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border border-slate-200 hover:border-emerald-300 text-xs font-bold transition-all active:scale-95 shadow-2xs"
                    >
                      <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                      Mark All Present
                    </button>
                  </div>
                </div>

                {/* Table Content */}
                {filteredTeachers.length === 0 ? (
                  <div className="p-16 text-center text-slate-400">
                    <Users className="w-12 h-12 mx-auto stroke-1 mb-3 text-slate-300" />
                    <p className="text-sm font-bold text-slate-600">No staff members found matching criteria.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50/60 text-slate-500 font-black uppercase text-[10.5px] tracking-wider">
                          <th className="py-3.5 px-4 w-12 text-center">#</th>
                          <th className="py-3.5 px-6 min-w-[260px]">Staff Member</th>
                          <th className="py-3.5 px-6 min-w-[260px]">Attendance Status</th>
                          <th className="py-3.5 px-6 min-w-[240px]">Notes / Remarks</th>
                          <th className="py-3.5 px-4 text-center w-36">Live Badge</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {filteredTeachers.map((t, idx) => {
                          const status = attendanceMap[t.id] || 'PRESENT';
                          const note = noteMap[t.id] || '';
                          const sc = STATUS_COLORS[status] || STATUS_COLORS.PRESENT;
                          const StatusIcon = sc.icon;

                          return (
                            <tr 
                              key={t.id}
                              className="hover:bg-indigo-50/30 transition-colors group"
                            >
                              {/* Serial Number */}
                              <td className="py-4 px-4 text-center font-bold text-slate-400">
                                {idx + 1}
                              </td>

                              {/* Staff Member Info */}
                              <td className="py-4 px-6">
                                <div className="flex items-center gap-3.5">
                                  <div className="w-11 h-11 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0 shadow-2xs">
                                    {t.user.photoUrl ? (
                                      <img 
                                        src={getPhotoUrl(t.user.photoUrl)} 
                                        alt={t.user.name} 
                                        className="w-full h-full object-cover" 
                                      />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center text-white font-black text-sm bg-gradient-to-br from-indigo-500 to-purple-600">
                                        {t.user.name.charAt(0).toUpperCase()}
                                      </div>
                                    )}
                                  </div>
                                  <div className="min-w-0">
                                    <div className="font-bold text-slate-900 text-sm truncate flex items-center gap-2">
                                      <span>{t.user.name}</span>
                                      {status === 'PRESENT' && (
                                        <span className="w-2 h-2 rounded-full bg-emerald-500" title="Active Today" />
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium mt-0.5">
                                      <span className="font-mono text-indigo-700 font-bold px-1.5 py-0.5 rounded bg-indigo-50 border border-indigo-200">
                                        {t.employeeId}
                                      </span>
                                      <span>&bull;</span>
                                      <span className="truncate">{t.specialization || t.qualification || 'Teaching Faculty'}</span>
                                    </div>
                                  </div>
                                </div>
                              </td>

                              {/* Attendance Segmented Selector Chips */}
                              <td className="py-4 px-6">
                                <div className="inline-flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 gap-1">
                                  {STATUS_OPTIONS.map((opt) => {
                                    const isSelected = status === opt.key;
                                    return (
                                      <button
                                        key={opt.key}
                                        type="button"
                                        onClick={() => handleSetStatus(t.id, opt.key)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                                          isSelected
                                            ? opt.color === 'emerald'
                                              ? 'bg-emerald-600 text-white shadow-sm'
                                              : opt.color === 'rose'
                                              ? 'bg-rose-600 text-white shadow-sm'
                                              : opt.color === 'amber'
                                              ? 'bg-amber-600 text-white shadow-sm'
                                              : 'bg-sky-600 text-white shadow-sm'
                                            : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
                                        }`}
                                      >
                                        <span>{opt.short}</span>
                                        <span className="hidden sm:inline font-bold text-[11px]">{opt.label}</span>
                                      </button>
                                    );
                                  })}
                                </div>
                              </td>

                              {/* Inline Notes / Remarks Input */}
                              <td className="py-4 px-6">
                                <input
                                  type="text"
                                  value={note}
                                  onChange={(e) => handleNoteChange(t.id, e.target.value)}
                                  placeholder="Add check-in remarks (optional)..."
                                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition-colors"
                                />
                              </td>

                              {/* Live Status Badge */}
                              <td className="py-4 px-4 text-center">
                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10.5px] font-black uppercase tracking-wider border shadow-2xs ${sc.bg} ${sc.text} ${sc.border}`}>
                                  <StatusIcon className="w-3.5 h-3.5" />
                                  <span>{status === 'HALF_DAY' ? 'Half Day' : status}</span>
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

              </div>

              {/* ── STICKY BOTTOM SAVE ACTION BAR (Portal to document.body) ── */}
              {typeof document !== 'undefined' && createPortal(
                <div className="fixed bottom-0 left-0 right-0 lg:left-[280px] z-50 bg-white/95 backdrop-blur-xl border-t border-slate-200 px-4 sm:px-6 py-3.5 pb-[max(0.875rem,env(safe-area-inset-bottom))] shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
                  <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                        <UserCheck className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs font-black text-slate-900 uppercase tracking-wider">
                          {adminStats.total} Staff Attendance Register
                        </p>
                        <p className="text-[11px] text-slate-500 font-medium">
                          {adminStats.present} Present &bull; {adminStats.absent} Absent &bull; {adminStats.leave + adminStats.halfDay} Leave/Half Day ({adminStats.rate}% Present)
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={handleMarkAllPresent}
                        className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-bold transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
                      >
                        <CheckCheck className="w-4 h-4 text-emerald-500" />
                        Mark All Present
                      </button>
                      <button
                        type="button"
                        onClick={handleBulkSave}
                        disabled={saving}
                        className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-emerald-500/30 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                      >
                        {saving ? (
                          <>
                            <LoadingSpinner size="sm" />
                            <span>Saving...</span>
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4" />
                            <span>Save Staff Attendance</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>,
                document.body
              )}

            </div>
          )}

          {/* ── TEACHER PERSONAL VIEW: MONTHLY CALENDAR & HISTORY ────────────── */}
          {isTeacher && (
            <div className="space-y-6">
              {/* Monthly KPI Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { label: 'Present Days', value: summary.present, color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
                  { label: 'Absent Days', value: summary.absent, color: 'text-rose-700', bg: 'bg-rose-50 border-rose-200' },
                  { label: 'Half Day', value: summary.halfDay, color: 'text-sky-700', bg: 'bg-sky-50 border-sky-200' },
                  { label: 'Attendance %', value: `${summary.rate}%`, color: 'text-indigo-700', bg: 'bg-indigo-50 border-indigo-200' },
                ].map((stat, i) => (
                  <div key={i} className={`rounded-2xl p-5 border shadow-lg ${stat.bg}`}>
                    <p className="text-[11px] font-black uppercase tracking-wider text-slate-400 mb-1">{stat.label}</p>
                    <p className={`text-3xl font-black ${stat.color}`}>{stat.value}</p>

                  </div>
                ))}
              </div>

              {/* Monthly Attendance Log */}
              <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                  <div>
                    <h3 className="font-black text-slate-900 text-sm">Monthly Attendance Breakdown</h3>
                    <p className="text-xs text-slate-500 mt-0.5">{MONTHS[selectedMonth]} {selectedYear} &bull; {myRecords.length} records</p>
                  </div>
                  <span className="px-3 py-1 bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl border border-indigo-200">
                    {summary.rate}% Attendance
                  </span>
                </div>

                <div className="divide-y divide-slate-100 max-h-[380px] overflow-y-auto">
                  {myRecords.length > 0 ? (
                    myRecords.map((r: any) => {
                      const sc = STATUS_COLORS[r.status] || STATUS_COLORS.PRESENT;
                      const StatusIcon = sc.icon;
                      const dObj = new Date(r.date);
                      return (
                        <div key={r.id || r.date} className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3.5">
                            <div className="w-10 h-10 rounded-xl flex flex-col items-center justify-center bg-indigo-50 border border-indigo-200 text-indigo-700 font-black shrink-0">
                              <span className="text-[9px] uppercase text-indigo-500 font-bold leading-none">{dObj.toLocaleDateString('en-US', { weekday: 'short' })}</span>
                              <span className="text-sm font-black leading-none mt-0.5">{dObj.getDate()}</span>
                            </div>
                            <div>
                              <p className="font-bold text-slate-800 text-xs sm:text-sm">
                                {dObj.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                              </p>
                              {r.note && <p className="text-xs text-slate-500 mt-0.5">{r.note}</p>}
                            </div>
                          </div>

                          <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shrink-0 border ${sc.bg} ${sc.text} ${sc.border}`}>
                            <StatusIcon className="w-3.5 h-3.5" />
                            {r.status === 'HALF_DAY' ? 'Half Day' : r.status}
                          </span>
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-12 text-center text-slate-500 text-xs font-bold">
                      No attendance records logged for {MONTHS[selectedMonth]} {selectedYear}.
                    </div>
                  )}
                </div>
              </div>

              {/* Request History */}
              <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="p-5 border-b border-slate-200 bg-slate-50">
                  <h3 className="font-black text-slate-900 text-sm">Gatepass &amp; Leave Request History</h3>
                </div>
                <div className="divide-y divide-slate-100 max-h-[350px] overflow-y-auto">
                  {historyLogs.map((log: any, idx) => (
                    <div key={idx} className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          log.logType === 'GATEPASS' ? 'bg-orange-50 text-orange-500 border border-orange-200' : 'bg-blue-50 text-blue-500 border border-blue-200'
                        }`}>
                          {log.logType === 'GATEPASS' ? <FileText className="w-5 h-5" /> : <UserCheck className="w-5 h-5" />}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 text-sm">
                            {log.logType === 'GATEPASS' ? `Gate Pass to ${log.destination}` : `${log.logType} Request`}
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5">{log.reason}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">{new Date(log.createdAt).toLocaleString()}</p>
                        </div>
                      </div>

                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wide border ${
                        log.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        log.status === 'REJECTED' ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {log.status}
                      </span>
                    </div>
                  ))}
                  {historyLogs.length === 0 && (
                    <div className="p-12 text-center text-slate-500 text-xs font-bold">
                      No request history found.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default TeacherAttendancePage;
