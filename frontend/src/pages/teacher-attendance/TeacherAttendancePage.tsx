import React, { useEffect, useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../../hooks/useAuth';
import api from '../../api/axios';
import { LoadingSpinner } from '../../components/UI/LoadingSpinner';
import { getPhotoUrl } from '../../utils/photo';
import {
  CalendarCheck, CheckCircle2, XCircle, AlertCircle,
  ChevronLeft, ChevronRight, Save, UserCheck, FileText,
  Search, CheckCheck, Users, Calendar, CalendarDays,
  X, Download, Award
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

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const STATUS_OPTIONS = [
  { key: 'PRESENT', label: 'Present', short: 'P', color: 'emerald' },
  { key: 'ABSENT', label: 'Absent', short: 'A', color: 'rose' },
  { key: 'LEAVE', label: 'Leave', short: 'L', color: 'amber' },
  { key: 'HALF_DAY', label: 'Half Day', short: '½', color: 'sky' },
];

const STATUS_COLORS: Record<string, { bg: string; text: string; border: string; icon: React.ElementType }> = {
  PRESENT:  { bg: 'bg-[#DCFCE7]', text: 'text-[#15803D]', border: 'border-[#BBF7D0]', icon: CheckCircle2 },
  ABSENT:   { bg: 'bg-rose-50',   text: 'text-rose-700',  border: 'border-rose-200',  icon: XCircle },
  LEAVE:    { bg: 'bg-[#FFF6E5]', text: 'text-[#B45309]', border: 'border-[#FAD79B]', icon: AlertCircle },
  HALF_DAY: { bg: 'bg-sky-50',    text: 'text-sky-700',   border: 'border-sky-200',   icon: CalendarCheck },
};

const formatLocalYMD = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const getRecordYMD = (rawDate: string): string => {
  if (!rawDate) return '';
  const str = String(rawDate);
  if (str.includes('T00:00:00')) {
    return str.split('T')[0];
  }
  return formatLocalYMD(new Date(rawDate));
};

const matchesSelectedDate = (rawDate: string, targetYmd: string): boolean => {
  if (!rawDate) return false;
  const utcYmd = String(rawDate).split('T')[0];
  if (utcYmd === targetYmd) return true;
  return formatLocalYMD(new Date(rawDate)) === targetYmd;
};

// Axios interceptor returns array directly when there is no pagination, or with hidden .data when paginated
const extractArray = <T = any>(res: any): T[] => {
  const payload = res?.data;
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

export const TeacherAttendancePage: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';
  const isTeacher = user?.role === 'TEACHER';

  const today = new Date();
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth());
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState(() => formatLocalYMD(new Date()));
  const [adminViewTab, setAdminViewTab] = useState<'daily' | 'monthly'>('daily');

  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [records, setRecords] = useState<AttRecord[]>([]);
  const [myRecords, setMyRecords] = useState<AttRecord[]>([]);
  const [summary, setSummary] = useState({ present: 0, absent: 0, halfDay: 0, total: 0, rate: 0 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [attendanceMap, setAttendanceMap] = useState<Record<string, string>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [historyLogs, setHistoryLogs] = useState<any[]>([]);

  const fetchTeachers = async () => {
    try {
      const res: any = await api.get('/api/teachers', { params: { limit: 500 } });
      setTeachers(extractArray<Teacher>(res));
    } catch (err) {
      console.error(err);
    }
  };

  const fetchRecords = async () => {
    if (!user) return;
    setLoading(true);
    try {
      if (isAdmin) {
        const [selY, selM] = selectedDate ? selectedDate.split('-').map(Number) : [0, 0];
        const queryYear = adminViewTab === 'daily' && selY ? selY : selectedYear;
        const queryMonth = adminViewTab === 'daily' && selM ? selM : selectedMonth + 1;

        const res: any = await api.get('/api/teacher-attendance', {
          params: { month: queryMonth, year: queryYear },
        });
        const recList = extractArray<AttRecord>(res);
        setRecords(recList);

        const dateRecords = recList.filter((r: AttRecord) => matchesSelectedDate(r.date, selectedDate));
        const map: Record<string, string> = {};
        dateRecords.forEach((r: AttRecord) => {
          map[r.teacherId] = r.status;
        });
        setAttendanceMap(map);
      } else {
        const [attRes, leaveRes, gpRes]: any = await Promise.all([
          api.get('/api/teacher-attendance', { params: { month: selectedMonth + 1, year: selectedYear } }),
          api.get('/api/leave/my?limit=5000').catch(() => ({ data: [] })),
          api.get('/api/gate-pass?limit=5000').catch(() => ({ data: [] })),
        ]);
        const arr = extractArray<AttRecord>(attRes);
        setMyRecords(arr);

        const leaves = extractArray(leaveRes).map((l: any) => ({ ...l, logType: l.type || 'LEAVE' }));
        const passes = extractArray(gpRes).map((gp: any) => ({ ...gp, logType: 'GATEPASS' }));
        const combined = [...leaves, ...passes].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setHistoryLogs(combined);

        const present = arr.filter((r: AttRecord) => r.status === 'PRESENT' || r.status === 'LATE').length;
        const absent = arr.filter((r: AttRecord) => r.status === 'ABSENT').length;
        const halfDay = arr.filter((r: AttRecord) => r.status === 'HALF_DAY').length;
        setSummary({
          present,
          absent,
          halfDay,
          total: arr.length,
          rate: arr.length > 0 ? Math.round((present / arr.length) * 100) : 0,
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
  }, [selectedMonth, selectedYear, selectedDate, isAdmin, user?.id]);

  // Admin Daily Statistics
  const adminStats = useMemo(() => {
    let present = 0, absent = 0, leave = 0, halfDay = 0;
    teachers.forEach((t) => {
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

  // Filtered staff list by Name or Employee ID
  const filteredTeachers = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return teachers.filter((t) => {
      const matchesSearch =
        !q ||
        t.user.name.toLowerCase().includes(q) ||
        t.employeeId.toLowerCase().includes(q);
      if (!matchesSearch) return false;
      if (adminViewTab === 'monthly') return true;
      const status = attendanceMap[t.id] || 'PRESENT';
      if (statusFilter === 'ALL') return true;
      return status === statusFilter;
    });
  }, [teachers, searchQuery, statusFilter, attendanceMap, adminViewTab]);

  // Monthly Matrix Computation (All Teachers across days 1..daysInMonth)
  const daysInMonth = useMemo(
    () => new Date(selectedYear, selectedMonth + 1, 0).getDate(),
    [selectedYear, selectedMonth]
  );

  const monthDayMeta = useMemo(() => {
    const list: { day: number; ymd: string; isSunday: boolean; weekdayShort: string }[] = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const dateObj = new Date(selectedYear, selectedMonth, d);
      list.push({
        day: d,
        ymd: formatLocalYMD(dateObj),
        isSunday: dateObj.getDay() === 0,
        weekdayShort: dateObj.toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 1),
      });
    }
    return list;
  }, [daysInMonth, selectedYear, selectedMonth]);

  const monthlyMatrix = useMemo(() => {
    const targetPrefix = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-`;
    const byTeacherDay: Record<string, Record<number, string>> = {};
    const markedDatesSet = new Set<number>();

    records.forEach((r) => {
      const ymd = getRecordYMD(r.date);
      if (!ymd.startsWith(targetPrefix)) return;
      const dayNum = parseInt(ymd.split('-')[2], 10);
      if (!dayNum || dayNum < 1 || dayNum > daysInMonth) return;
      if (!byTeacherDay[r.teacherId]) byTeacherDay[r.teacherId] = {};
      byTeacherDay[r.teacherId][dayNum] = r.status;
      markedDatesSet.add(dayNum);
    });

    const rows = teachers.map((t) => {
      const daysMap = byTeacherDay[t.id] || {};
      let p = 0, a = 0, l = 0, hd = 0, marked = 0;
      Object.values(daysMap).forEach((st) => {
        marked++;
        if (st === 'PRESENT' || st === 'LATE') p++;
        else if (st === 'ABSENT') a++;
        else if (st === 'LEAVE') l++;
        else if (st === 'HALF_DAY') hd++;
      });
      const pct = marked > 0 ? Math.round(((p + hd * 0.5) / marked) * 100) : 0;
      return {
        teacher: t,
        daysMap,
        present: p,
        absent: a,
        leave: l,
        halfDay: hd,
        marked,
        pct,
      };
    });

    const totalMarkedDays = markedDatesSet.size;
    const totalPresentMarks = rows.reduce((s, r) => s + r.present, 0);
    const totalAbsentMarks = rows.reduce((s, r) => s + r.absent, 0);
    const totalLeaveMarks = rows.reduce((s, r) => s + r.leave + r.halfDay, 0);
    const avgRate = rows.length > 0 && totalMarkedDays > 0
      ? Math.round(rows.reduce((s, r) => s + r.pct, 0) / rows.length)
      : 0;

    return {
      rows,
      totalMarkedDays,
      totalPresentMarks,
      totalAbsentMarks,
      totalLeaveMarks,
      avgRate,
    };
  }, [teachers, records, selectedYear, selectedMonth, daysInMonth]);

  const filteredMonthlyRows = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return monthlyMatrix.rows;
    return monthlyMatrix.rows.filter(
      (r) =>
        r.teacher.user.name.toLowerCase().includes(q) ||
        r.teacher.employeeId.toLowerCase().includes(q)
    );
  }, [monthlyMatrix.rows, searchQuery]);

  // Quick Actions
  const handleMarkAllPresent = () => {
    const newMap = { ...attendanceMap };
    filteredTeachers.forEach((t) => {
      newMap[t.id] = 'PRESENT';
    });
    setAttendanceMap(newMap);
    toast.success('Marked all staff as Present');
  };

  const handleSetStatus = (teacherId: string, status: string) => {
    setAttendanceMap((prev) => ({ ...prev, [teacherId]: status }));
  };

  const handleBulkSave = async () => {
    if (teachers.length === 0) {
      toast.error('No staff records loaded to save');
      return;
    }
    setSaving(true);
    try {
      const recs = teachers.map((t) => ({
        teacherId: t.id,
        status: attendanceMap[t.id] || 'PRESENT',
        note: '',
      }));

      await api.post('/api/teacher-attendance/bulk-mark', {
        date: selectedDate,
        records: recs,
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
    const newMonth = d.getMonth();
    const newYear = d.getFullYear();
    setSelectedMonth(newMonth);
    setSelectedYear(newYear);

    const curDay = selectedDate ? Number(selectedDate.split('-')[2]) || 1 : 1;
    const maxDayInTarget = new Date(newYear, newMonth + 1, 0).getDate();
    let clampedDay = Math.min(curDay, maxDayInTarget);
    if (newYear === today.getFullYear() && newMonth === today.getMonth()) {
      clampedDay = Math.min(clampedDay, today.getDate());
    }
    setSelectedDate(formatLocalYMD(new Date(newYear, newMonth, clampedDay)));
  };

  // ── ALL TEACHERS MONTHLY ATTENDANCE REGISTER PDF EXPORT ──
  const handleDownloadMonthlyPdf = async () => {
    if (teachers.length === 0) {
      toast.error('No staff data available to export');
      return;
    }
    setExportingPdf(true);
    const toastId = toast.loading(`Generating ${MONTHS[selectedMonth]} ${selectedYear} Staff Attendance PDF...`);
    try {
      const { default: jsPDF } = await import('jspdf');
      const autoTableModule: any = await import('jspdf-autotable');
      const autoTable = autoTableModule.default || autoTableModule;

      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      const pageWidth = doc.internal.pageSize.getWidth();
      const monthName = MONTHS[selectedMonth].toUpperCase();

      // Official Header
      doc.setFontSize(15);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text('SRI VENKATESWARA JY HIGH SCHOOL', pageWidth / 2, 12, { align: 'center' });

      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text('Opp. Hero Showroom, SVL Paradise Campus, Narasannapeta, Srikakulam Dist.', pageWidth / 2, 17, { align: 'center' });

      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(91, 33, 182);
      doc.text(`MONTHLY STAFF ATTENDANCE REPORT - ${monthName} ${selectedYear}`, pageWidth / 2, 23, { align: 'center' });

      doc.setDrawColor(221, 214, 254);
      doc.setLineWidth(0.4);
      doc.line(8, 25.5, pageWidth - 8, 25.5);

      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(51, 65, 85);
      doc.text(
        `Total Staff: ${teachers.length}   |   Working Days Marked: ${monthlyMatrix.totalMarkedDays}   |   Monthly Avg Attendance: ${monthlyMatrix.avgRate}%`,
        8,
        30
      );
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text(
        `Generated: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`,
        pageWidth - 8,
        30,
        { align: 'right' }
      );

      const headers = [
        '#',
        'EMP ID',
        'STAFF NAME',
        ...monthDayMeta.map((m) => String(m.day)),
        'P',
        'A',
        'L',
        'H',
        '%',
      ];

      const body = monthlyMatrix.rows.map((row, idx) => {
        const dayCells = monthDayMeta.map((m) => {
          const st = row.daysMap[m.day];
          if (!st) return m.isSunday ? 'S' : '-';
          if (st === 'PRESENT' || st === 'LATE') return 'P';
          if (st === 'ABSENT') return 'A';
          if (st === 'LEAVE') return 'L';
          if (st === 'HALF_DAY') return 'H';
          return '-';
        });

        return [
          String(idx + 1),
          row.teacher.employeeId || '-',
          row.teacher.user.name.toUpperCase(),
          ...dayCells,
          String(row.present),
          String(row.absent),
          String(row.leave),
          String(row.halfDay),
          `${row.pct}%`,
        ];
      });

      // Exact column widths fitting 297mm - 16mm margin = 281mm cleanly (31 days -> 278.8mm)
      const dayColWidth = 5.3;
      const columnStyles: Record<number, any> = {
        0: { cellWidth: 7, halign: 'center', fontStyle: 'bold' },
        1: { cellWidth: 21, halign: 'center', fontStyle: 'bold', textColor: [91, 33, 182] },
        2: { cellWidth: 46, halign: 'left', fontStyle: 'bold' },
      };
      monthDayMeta.forEach((_, idx) => {
        columnStyles[3 + idx] = { cellWidth: dayColWidth, halign: 'center' };
      });
      const sumStart = 3 + monthDayMeta.length;
      columnStyles[sumStart]     = { cellWidth: 7.5, halign: 'center', fontStyle: 'bold', textColor: [5, 150, 105] };
      columnStyles[sumStart + 1] = { cellWidth: 7.5, halign: 'center', fontStyle: 'bold', textColor: [220, 38, 38] };
      columnStyles[sumStart + 2] = { cellWidth: 7.5, halign: 'center', fontStyle: 'bold', textColor: [217, 119, 6] };
      columnStyles[sumStart + 3] = { cellWidth: 7.5, halign: 'center', fontStyle: 'bold', textColor: [2, 132, 199] };
      columnStyles[sumStart + 4] = { cellWidth: 10.5, halign: 'center', fontStyle: 'bold', textColor: [30, 27, 75] };

      autoTable(doc, {
        head: [headers],
        body,
        startY: 33,
        theme: 'grid',
        margin: { left: 8, right: 8, bottom: 16 },
        styles: {
          font: 'helvetica',
          fontSize: 6.8,
          cellPadding: { top: 1.5, bottom: 1.5, left: 0.7, right: 0.7 },
          lineColor: [226, 232, 240],
          lineWidth: 0.15,
          textColor: [30, 41, 59],
          overflow: 'ellipsize',
        },
        headStyles: {
          fillColor: [91, 33, 182],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 6.8,
          halign: 'center',
          cellPadding: { top: 2.2, bottom: 2.2, left: 0.5, right: 0.5 },
        },
        alternateRowStyles: {
          fillColor: [250, 249, 255],
        },
        columnStyles,
        didParseCell: (data: any) => {
          if (data.section === 'body' && data.column.index >= 3 && data.column.index < sumStart) {
            const val = String(data.cell.raw || '');
            if (val === 'P') {
              data.cell.styles.textColor = [5, 150, 105];
              data.cell.styles.fontStyle = 'bold';
            } else if (val === 'A') {
              data.cell.styles.fillColor = [254, 226, 226];
              data.cell.styles.textColor = [220, 38, 38];
              data.cell.styles.fontStyle = 'bold';
            } else if (val === 'L') {
              data.cell.styles.fillColor = [254, 243, 199];
              data.cell.styles.textColor = [180, 83, 9];
              data.cell.styles.fontStyle = 'bold';
            } else if (val === 'H') {
              data.cell.styles.fillColor = [224, 242, 254];
              data.cell.styles.textColor = [2, 132, 199];
              data.cell.styles.fontStyle = 'bold';
            } else if (val === 'S') {
              data.cell.styles.fillColor = [241, 245, 249];
              data.cell.styles.textColor = [148, 163, 184];
            } else {
              data.cell.styles.textColor = [148, 163, 184];
            }
          }
        },
        didDrawPage: (data: any) => {
          const h = doc.internal.pageSize.getHeight();
          doc.setFontSize(7.5);
          doc.setTextColor(100, 116, 139);
          doc.text(
            'Legend:  P = Present  |  A = Absent  |  L = Leave  |  H = Half Day  |  S = Sunday',
            8,
            h - 8
          );
          doc.text(
            `Principal Signature: ____________________     Page ${data.pageNumber} of ${doc.getNumberOfPages()}`,
            pageWidth - 8,
            h - 8,
            { align: 'right' }
          );
        },
      });

      doc.save(`JY_School_Staff_Attendance_${MONTHS[selectedMonth]}_${selectedYear}.pdf`);
      toast.success('Monthly Staff Attendance PDF downloaded!', { id: toastId });
    } catch (err: any) {
      console.error('PDF export error:', err);
      toast.error('Failed to generate Monthly PDF: ' + (err?.message || 'Error'), { id: toastId });
    } finally {
      setExportingPdf(false);
    }
  };

  if (loading && teachers.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 bg-[#F4F7FC] min-h-screen">
        <LoadingSpinner size="lg" />
        <p className="text-sm font-bold text-slate-500 mt-4">Loading staff attendance register...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#F4F7FC] text-slate-800 overflow-hidden">
      <PageHeader
        title={isAdmin ? 'Staff Attendance Manager' : 'My Attendance Register'}
        icon={<CalendarCheck className="w-5 h-5 text-white" />}
        action={
          isAdmin ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setAdminViewTab(adminViewTab === 'daily' ? 'monthly' : 'daily')}
                className="px-3.5 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white border border-white/25 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <CalendarDays className="w-3.5 h-3.5" />
                <span>{adminViewTab === 'daily' ? 'Monthly Report' : 'Daily Register'}</span>
              </button>
              <button
                type="button"
                onClick={handleDownloadMonthlyPdf}
                disabled={exportingPdf || teachers.length === 0}
                className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-indigo-50 text-[#1E1B4B] text-xs font-extrabold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5 text-rose-600" />
                <span>{exportingPdf ? 'Generating...' : 'Month PDF'}</span>
              </button>
            </div>
          ) : undefined
        }
      />

      <div className="flex-1 overflow-auto p-4 sm:p-6 space-y-5">
        <div className="w-full max-w-7xl mx-auto space-y-5">

          {/* ── ADMIN VIEW ───────────────────────────────────────────────────── */}
          {isAdmin && (
            <div className={`space-y-5 ${adminViewTab === 'daily' ? 'pb-24' : 'pb-8'}`}>

              {/* 4 Dashboard Pastel Metric KPI Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
                {adminViewTab === 'daily' ? (
                  <>
                    <div className="relative overflow-hidden rounded-[20px] px-4 py-4 border bg-gradient-to-br from-[#EAF2FF] to-[#CBE0FF] border-[#B6D2FF] shadow-[0_6px_18px_-6px_rgba(15,23,42,0.10)] flex items-center justify-between gap-2">
                      <div className="absolute inset-x-0 top-0 h-[45%] bg-gradient-to-b from-white/55 to-transparent pointer-events-none rounded-t-[20px]" />
                      <div className="relative z-10 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#2563EB] to-[#1D4ED8] flex items-center justify-center text-white shadow-md shrink-0">
                          <Users className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-600">Total Staff</p>
                          <p className="text-2xl font-black text-slate-900 leading-tight">{adminStats.total}</p>
                        </div>
                      </div>
                    </div>

                    <div className="relative overflow-hidden rounded-[20px] px-4 py-4 border bg-gradient-to-br from-[#E5FAEF] to-[#C2F2D9] border-[#ACEAD0] shadow-[0_6px_18px_-6px_rgba(15,23,42,0.10)] flex items-center justify-between gap-2">
                      <div className="absolute inset-x-0 top-0 h-[45%] bg-gradient-to-b from-white/55 to-transparent pointer-events-none rounded-t-[20px]" />
                      <div className="relative z-10 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#10B981] to-[#059669] flex items-center justify-center text-white shadow-md shrink-0">
                          <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-600">Present ({adminStats.rate}%)</p>
                          <p className="text-2xl font-black text-[#065F46] leading-tight">{adminStats.present}</p>
                        </div>
                      </div>
                    </div>

                    <div className="relative overflow-hidden rounded-[20px] px-4 py-4 border bg-gradient-to-br from-[#FFEFEF] to-[#FFD2D7] border-[#FFC0C7] shadow-[0_6px_18px_-6px_rgba(15,23,42,0.10)] flex items-center justify-between gap-2">
                      <div className="absolute inset-x-0 top-0 h-[45%] bg-gradient-to-b from-white/55 to-transparent pointer-events-none rounded-t-[20px]" />
                      <div className="relative z-10 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#EF4444] to-[#DC2626] flex items-center justify-center text-white shadow-md shrink-0">
                          <XCircle className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-600">Absent Today</p>
                          <p className="text-2xl font-black text-[#991B1B] leading-tight">{adminStats.absent}</p>
                        </div>
                      </div>
                    </div>

                    <div className="relative overflow-hidden rounded-[20px] px-4 py-4 border bg-gradient-to-br from-[#FFF6E5] to-[#FFE4B8] border-[#FAD79B] shadow-[0_6px_18px_-6px_rgba(15,23,42,0.10)] flex items-center justify-between gap-2">
                      <div className="absolute inset-x-0 top-0 h-[45%] bg-gradient-to-b from-white/55 to-transparent pointer-events-none rounded-t-[20px]" />
                      <div className="relative z-10 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#F59E0B] to-[#D97706] flex items-center justify-center text-white shadow-md shrink-0">
                          <AlertCircle className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-600">Leave / Half Day</p>
                          <p className="text-2xl font-black text-[#9A3412] leading-tight">{adminStats.leave + adminStats.halfDay}</p>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="relative overflow-hidden rounded-[20px] px-4 py-4 border bg-gradient-to-br from-[#F2EDFF] to-[#DDD2FF] border-[#CEC0FF] shadow-[0_6px_18px_-6px_rgba(15,23,42,0.10)]">
                      <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-600">Working Days Marked</p>
                      <p className="text-2xl font-black text-[#4C1D95] mt-1">{monthlyMatrix.totalMarkedDays} Days</p>
                    </div>
                    <div className="relative overflow-hidden rounded-[20px] px-4 py-4 border bg-gradient-to-br from-[#E5FAEF] to-[#C2F2D9] border-[#ACEAD0] shadow-[0_6px_18px_-6px_rgba(15,23,42,0.10)]">
                      <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-600">Monthly Avg Rate</p>
                      <p className="text-2xl font-black text-[#065F46] mt-1">{monthlyMatrix.avgRate}%</p>
                    </div>
                    <div className="relative overflow-hidden rounded-[20px] px-4 py-4 border bg-gradient-to-br from-[#FFEFEF] to-[#FFD2D7] border-[#FFC0C7] shadow-[0_6px_18px_-6px_rgba(15,23,42,0.10)]">
                      <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-600">Total Absences</p>
                      <p className="text-2xl font-black text-[#991B1B] mt-1">{monthlyMatrix.totalAbsentMarks}</p>
                    </div>
                    <div className="relative overflow-hidden rounded-[20px] px-4 py-4 border bg-gradient-to-br from-[#FFF6E5] to-[#FFE4B8] border-[#FAD79B] shadow-[0_6px_18px_-6px_rgba(15,23,42,0.10)]">
                      <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-600">Leaves &amp; Half Days</p>
                      <p className="text-2xl font-black text-[#9A3412] mt-1">{monthlyMatrix.totalLeaveMarks}</p>
                    </div>
                  </>
                )}
              </div>

              {/* Control Toolbar: View Switcher + Search + Status Filter + Date / Month */}
              <div className="p-3.5 rounded-[20px] bg-white border border-indigo-100/90 shadow-[0_8px_24px_-6px_rgba(79,70,229,0.08)] flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-3">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1">
                  {/* View Toggle Tabs */}
                  <div className="flex items-center p-1 bg-[#F3F5FC] rounded-xl shrink-0">
                    <button
                      type="button"
                      onClick={() => setAdminViewTab('daily')}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                        adminViewTab === 'daily'
                          ? 'bg-gradient-to-r from-[#4F46E5] to-[#6D28D9] text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Daily Attendance
                    </button>
                    <button
                      type="button"
                      onClick={() => setAdminViewTab('monthly')}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                        adminViewTab === 'monthly'
                          ? 'bg-gradient-to-r from-[#4F46E5] to-[#6D28D9] text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Monthly Report ({MONTHS[selectedMonth].slice(0, 3)})
                    </button>
                  </div>

                  {/* Search Input */}
                  <div className="flex-1 flex items-center gap-2.5 bg-[#F8FAFF] border border-indigo-100 rounded-xl px-3.5 py-2 focus-within:bg-white focus-within:border-indigo-400 transition-all">
                    <Search className="w-4 h-4 text-slate-400 shrink-0" />
                    <input
                      type="text"
                      placeholder="Search by Staff Name or Employee ID (e.g. SVJY-1140)..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-transparent border-none text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none"
                    />
                    {searchQuery && (
                      <button type="button" onClick={() => setSearchQuery('')} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Right Controls */}
                <div className="flex flex-wrap items-center justify-between xl:justify-end gap-2 shrink-0">
                  {adminViewTab === 'daily' && (
                    <div className="flex items-center gap-1.5 overflow-x-auto">
                      {[
                        { key: 'ALL', label: `All (${adminStats.total})`, active: 'bg-indigo-600 text-white', idle: 'bg-slate-100 text-slate-700 border-slate-200' },
                        { key: 'PRESENT', label: `Present (${adminStats.present})`, active: 'bg-emerald-600 text-white', idle: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
                        { key: 'ABSENT', label: `Absent (${adminStats.absent})`, active: 'bg-rose-600 text-white', idle: 'bg-rose-50 text-rose-700 border-rose-200' },
                        { key: 'LEAVE', label: `Leave (${adminStats.leave})`, active: 'bg-amber-600 text-white', idle: 'bg-amber-50 text-amber-700 border-amber-200' },
                      ].map((chip) => (
                        <button
                          key={chip.key}
                          type="button"
                          onClick={() => setStatusFilter(chip.key)}
                          className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold border transition-all shrink-0 cursor-pointer ${
                            statusFilter === chip.key ? `${chip.active} border-transparent shadow-xs` : chip.idle
                          }`}
                        >
                          {chip.label}
                        </button>
                      ))}
                    </div>
                  )}

                  {adminViewTab === 'daily' && (
                    <div className="flex items-center gap-2 bg-[#F8FAFF] border border-indigo-100 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800">
                      <Calendar className="w-3.5 h-3.5 text-indigo-600" />
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
                  )}

                  {/* Month Switcher */}
                  <div className="flex items-center bg-[#F8FAFF] border border-indigo-100 rounded-xl p-1">
                    <button
                      type="button"
                      onClick={() => navigateMonth(-1)}
                      className="p-1 text-slate-500 hover:text-indigo-700 rounded-lg hover:bg-white transition cursor-pointer"
                      title="Previous Month"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-[11px] font-extrabold px-2 text-[#1E1B4B]">
                      {MONTHS[selectedMonth].slice(0, 3)} {selectedYear}
                    </span>
                    <button
                      type="button"
                      onClick={() => navigateMonth(1)}
                      disabled={selectedMonth === today.getMonth() && selectedYear === today.getFullYear()}
                      className="p-1 text-slate-500 hover:text-indigo-700 rounded-lg hover:bg-white transition disabled:opacity-30 cursor-pointer"
                      title="Next Month"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                  {adminViewTab === 'monthly' && (
                    <button
                      type="button"
                      onClick={handleDownloadMonthlyPdf}
                      disabled={exportingPdf || teachers.length === 0}
                      className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#5B21B6] to-[#7C3AED] hover:opacity-95 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download All Teachers PDF</span>
                    </button>
                  )}
                </div>
              </div>

              {/* ── TAB 1: DAILY ATTENDANCE REGISTER TABLE (No Notes, Separate Emp ID, No Subject) ── */}
              {adminViewTab === 'daily' ? (
                <div className="bg-white border border-[#DDD7F3] rounded-[20px] overflow-hidden shadow-[0_12px_32px_-6px_rgba(91,33,182,0.10)]">
                  <div className="px-5 py-3.5 border-b border-indigo-100/80 bg-[#FAF9FF] flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <UserCheck className="w-4 h-4 text-[#5B21B6]" />
                      <h3 className="text-xs font-black uppercase tracking-wider text-[#1E1B4B]">
                        Daily Attendance Register &bull; {new Date(selectedDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </h3>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xs text-slate-500 font-medium">
                        Showing <strong className="text-slate-900">{filteredTeachers.length}</strong> of {teachers.length} Staff
                      </span>
                      <button
                        type="button"
                        onClick={handleMarkAllPresent}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border border-indigo-100 hover:border-emerald-300 text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-2xs"
                      >
                        <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Mark All Present</span>
                      </button>
                    </div>
                  </div>

                  {filteredTeachers.length === 0 ? (
                    <div className="p-16 text-center text-slate-400">
                      <Users className="w-12 h-12 mx-auto stroke-1 mb-3 text-slate-300" />
                      <p className="text-sm font-bold text-slate-600">No staff members found matching criteria.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs student-grid-table">
                        <thead>
                          <tr className="bg-gradient-to-r from-[#7D3CEF] via-[#6D38EA] to-[#5B21B6] !text-white font-extrabold uppercase text-[11px] tracking-wider">
                            <th className="py-3.5 px-3 w-14 text-center border-r border-white/20 !text-white">#</th>
                            <th className="py-3.5 px-5 text-left border-r border-white/20 !text-white">Employee ID</th>
                            <th className="py-3.5 px-5 text-left border-r border-white/20 !text-white">Staff Member</th>
                            <th className="py-3.5 px-5 text-left border-r border-white/20 !text-white">Attendance Status</th>
                            <th className="py-3.5 px-4 text-center w-36 !text-white">Live Badge</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredTeachers.map((t, idx) => {
                            const status = attendanceMap[t.id] || 'PRESENT';
                            const sc = STATUS_COLORS[status] || STATUS_COLORS.PRESENT;
                            const StatusIcon = sc.icon;
                            const rowBorderBottom = idx === filteredTeachers.length - 1 ? '' : 'border-b border-[#EAE7F6]';

                            return (
                              <tr
                                key={t.id}
                                className="even:bg-[#FAF9FF] hover:bg-[#F3EFFE]/60 transition-colors bg-white"
                              >
                                <td className={`py-3 px-3 text-center font-bold text-[#1E1B4B] border-r border-[#EAE7F6] ${rowBorderBottom}`}>
                                  {idx + 1}
                                </td>

                                {/* Dedicated Employee ID Column */}
                                <td className={`py-3 px-5 border-r border-[#EAE7F6] whitespace-nowrap ${rowBorderBottom}`}>
                                  <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-extrabold text-[#5B21B6] bg-[#EFEAFE] border border-[#DDD6FE]/80 font-mono">
                                    {t.employeeId || '—'}
                                  </span>
                                </td>

                                {/* Staff Member (Avatar + Name ONLY, Subject removed) */}
                                <td className={`py-3 px-5 border-r border-[#EAE7F6] ${rowBorderBottom}`}>
                                  <div className="flex items-center gap-3">
                                    <div className="relative w-10 h-11 rounded-xl bg-indigo-50 border border-indigo-200/80 flex items-center justify-center overflow-hidden shrink-0 shadow-2xs">
                                      {t.user.photoUrl ? (
                                        <img
                                          src={getPhotoUrl(t.user.photoUrl)}
                                          alt={t.user.name}
                                          className="w-full h-full object-cover"
                                        />
                                      ) : (
                                        <div className="w-full h-full flex items-center justify-center text-white font-black text-xs bg-gradient-to-br from-[#7C3AED] to-[#5B21B6]">
                                          {t.user.name.slice(0, 2).toUpperCase()}
                                        </div>
                                      )}
                                    </div>
                                    <div className="min-w-0 flex items-center gap-2">
                                      <span className="font-extrabold text-[#1E1B4B] text-xs sm:text-[13px] uppercase tracking-tight">
                                        {t.user.name}
                                      </span>
                                      {status === 'PRESENT' && (
                                        <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" title="Present" />
                                      )}
                                    </div>
                                  </div>
                                </td>

                                {/* Attendance Selector Pills */}
                                <td className={`py-3 px-5 border-r border-[#EAE7F6] ${rowBorderBottom}`}>
                                  <div className="inline-flex items-center bg-[#F3F5FC] p-1 rounded-xl border border-indigo-100 gap-1">
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
                                                ? 'bg-emerald-600 text-white shadow-xs'
                                                : opt.color === 'rose'
                                                  ? 'bg-rose-600 text-white shadow-xs'
                                                  : opt.color === 'amber'
                                                    ? 'bg-amber-600 text-white shadow-xs'
                                                    : 'bg-sky-600 text-white shadow-xs'
                                              : 'text-slate-600 hover:text-slate-900 hover:bg-white/90'
                                          }`}
                                        >
                                          <span>{opt.short}</span>
                                          <span className="hidden sm:inline font-bold text-[11px]">{opt.label}</span>
                                        </button>
                                      );
                                    })}
                                  </div>
                                </td>

                                {/* Live Status Badge */}
                                <td className={`py-3 px-4 text-center ${rowBorderBottom}`}>
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
              ) : (
                /* ── TAB 2: ALL TEACHERS MONTHLY ATTENDANCE REGISTER MATRIX ── */
                <div className="bg-white border border-[#DDD7F3] rounded-[20px] overflow-hidden shadow-[0_12px_32px_-6px_rgba(91,33,182,0.10)]">
                  <div className="px-5 py-3.5 border-b border-indigo-100/80 bg-[#FAF9FF] flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Award className="w-4 h-4 text-[#5B21B6]" />
                      <h3 className="text-xs font-black uppercase tracking-wider text-[#1E1B4B]">
                        All Teachers Monthly Attendance Matrix &bull; {MONTHS[selectedMonth]} {selectedYear}
                      </h3>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-[10px] font-extrabold">
                      <span className="px-2 py-0.5 rounded bg-[#DCFCE7] text-[#15803D]">P = Present</span>
                      <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-700">A = Absent</span>
                      <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800">L = Leave</span>
                      <span className="px-2 py-0.5 rounded bg-sky-100 text-sky-700">H = Half Day</span>
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-500">S = Sunday</span>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-[11px] student-grid-table">
                      <thead>
                        <tr className="bg-gradient-to-r from-[#7D3CEF] via-[#6D38EA] to-[#5B21B6] !text-white font-extrabold uppercase tracking-wider">
                          <th className="py-2.5 px-2.5 text-center border-r border-white/20 !text-white sticky left-0 z-20 bg-[#7D3CEF]">#</th>
                          <th className="py-2.5 px-3 text-left border-r border-white/20 !text-white whitespace-nowrap">Emp ID</th>
                          <th className="py-2.5 px-3 text-left border-r border-white/20 !text-white whitespace-nowrap min-w-[170px]">Staff Name</th>
                          {monthDayMeta.map((m) => (
                            <th
                              key={m.day}
                              onClick={() => {
                                setSelectedDate(m.ymd);
                                setAdminViewTab('daily');
                              }}
                              title={`Click to mark/edit ${m.ymd}`}
                              className={`py-2 px-1 text-center border-r border-white/15 min-w-[26px] cursor-pointer hover:bg-white/15 !text-white ${
                                m.isSunday ? 'bg-black/15' : ''
                              }`}
                            >
                              <div className="leading-tight">{m.day}</div>
                              <div className="text-[8px] font-bold opacity-80">{m.weekdayShort}</div>
                            </th>
                          ))}
                          <th className="py-2.5 px-2 text-center border-r border-white/20 !text-white">P</th>
                          <th className="py-2.5 px-2 text-center border-r border-white/20 !text-white">A</th>
                          <th className="py-2.5 px-2 text-center border-r border-white/20 !text-white">L</th>
                          <th className="py-2.5 px-2 text-center border-r border-white/20 !text-white">H</th>
                          <th className="py-2.5 px-2.5 text-center !text-white">%</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredMonthlyRows.map((row, idx) => {
                          const rowBorderBottom = idx === filteredMonthlyRows.length - 1 ? '' : 'border-b border-[#EAE7F6]';
                          return (
                            <tr key={row.teacher.id} className="even:bg-[#FAF9FF] hover:bg-[#F3EFFE]/60 transition-colors bg-white">
                              <td className={`py-2 px-2.5 text-center font-bold text-[#1E1B4B] border-r border-[#EAE7F6] sticky left-0 bg-inherit ${rowBorderBottom}`}>
                                {idx + 1}
                              </td>
                              <td className={`py-2 px-3 border-r border-[#EAE7F6] whitespace-nowrap ${rowBorderBottom}`}>
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold text-[#5B21B6] bg-[#EFEAFE] font-mono">
                                  {row.teacher.employeeId}
                                </span>
                              </td>
                              <td className={`py-2 px-3 font-extrabold text-[#1E1B4B] border-r border-[#EAE7F6] whitespace-nowrap uppercase ${rowBorderBottom}`}>
                                {row.teacher.user.name}
                              </td>
                              {monthDayMeta.map((m) => {
                                const st = row.daysMap[m.day];
                                let code = m.isSunday ? 'S' : '·';
                                let cellCls = m.isSunday ? 'bg-slate-50 text-slate-400' : 'text-slate-300';
                                if (st === 'PRESENT' || st === 'LATE') {
                                  code = 'P';
                                  cellCls = 'text-emerald-700 font-black bg-emerald-50/50';
                                } else if (st === 'ABSENT') {
                                  code = 'A';
                                  cellCls = 'text-rose-700 font-black bg-rose-100/80';
                                } else if (st === 'LEAVE') {
                                  code = 'L';
                                  cellCls = 'text-amber-700 font-black bg-amber-100/80';
                                } else if (st === 'HALF_DAY') {
                                  code = 'H';
                                  cellCls = 'text-sky-700 font-black bg-sky-100/80';
                                }
                                return (
                                  <td
                                    key={m.day}
                                    onClick={() => {
                                      setSelectedDate(m.ymd);
                                      setAdminViewTab('daily');
                                    }}
                                    title={`${row.teacher.user.name} (${m.ymd}): ${st || 'Not marked'}`}
                                    className={`py-2 px-1 text-center border-r border-[#EAE7F6] cursor-pointer hover:ring-1 hover:ring-inset hover:ring-indigo-400 ${cellCls} ${rowBorderBottom}`}
                                  >
                                    {code}
                                  </td>
                                );
                              })}
                              <td className={`py-2 px-2 text-center font-black text-emerald-700 border-r border-[#EAE7F6] ${rowBorderBottom}`}>{row.present}</td>
                              <td className={`py-2 px-2 text-center font-black text-rose-600 border-r border-[#EAE7F6] ${rowBorderBottom}`}>{row.absent}</td>
                              <td className={`py-2 px-2 text-center font-black text-amber-600 border-r border-[#EAE7F6] ${rowBorderBottom}`}>{row.leave}</td>
                              <td className={`py-2 px-2 text-center font-black text-sky-600 border-r border-[#EAE7F6] ${rowBorderBottom}`}>{row.halfDay}</td>
                              <td className={`py-2 px-2.5 text-center font-black ${row.pct >= 85 ? 'text-emerald-700' : row.pct >= 70 ? 'text-amber-700' : 'text-rose-700'} ${rowBorderBottom}`}>
                                {row.pct}%
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ── STICKY BOTTOM SAVE ACTION BAR (Daily View Only, Aligned with 224px Sidebar) ── */}
              {adminViewTab === 'daily' && typeof document !== 'undefined' && createPortal(
                <div className="fixed bottom-0 left-0 right-0 lg:left-[224px] z-40 bg-white/95 backdrop-blur-xl border-t border-indigo-100 px-4 sm:px-6 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-4px_20px_rgba(91,33,182,0.08)]">
                  <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-[#EFEAFE] border border-[#DDD6FE] flex items-center justify-center text-[#5B21B6] shrink-0">
                        <UserCheck className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-black text-[#1E1B4B] uppercase tracking-wider">
                          {adminStats.total} Staff Attendance Register
                        </p>
                        <p className="text-[11px] text-slate-500 font-semibold">
                          {adminStats.present} Present &bull; {adminStats.absent} Absent &bull; {adminStats.leave + adminStats.halfDay} Leave/Half Day ({adminStats.rate}% Present)
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <button
                        type="button"
                        onClick={handleMarkAllPresent}
                        className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-bold transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
                      >
                        <CheckCheck className="w-4 h-4 text-emerald-600" />
                        <span>Mark All Present</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleBulkSave}
                        disabled={saving}
                        className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white text-xs font-black uppercase tracking-wider shadow-md shadow-emerald-500/25 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2 cursor-pointer"
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
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { label: 'Present Days', value: summary.present, color: 'text-emerald-700', bg: 'bg-gradient-to-br from-[#E5FAEF] to-[#C2F2D9] border-[#ACEAD0]' },
                  { label: 'Absent Days', value: summary.absent, color: 'text-rose-700', bg: 'bg-gradient-to-br from-[#FFEFEF] to-[#FFD2D7] border-[#FFC0C7]' },
                  { label: 'Half Day', value: summary.halfDay, color: 'text-sky-700', bg: 'bg-gradient-to-br from-[#E6F4FF] to-[#C5E5FF] border-[#B2DCFF]' },
                  { label: 'Attendance %', value: `${summary.rate}%`, color: 'text-indigo-700', bg: 'bg-gradient-to-br from-[#F2EDFF] to-[#DDD2FF] border-[#CEC0FF]' },
                ].map((stat, i) => (
                  <div key={i} className={`rounded-[20px] p-5 border shadow-sm ${stat.bg}`}>
                    <p className="text-[11px] font-black uppercase tracking-wider text-slate-600 mb-1">{stat.label}</p>
                    <p className={`text-3xl font-black ${stat.color}`}>{stat.value}</p>
                  </div>
                ))}
              </div>

              <div className="bg-white rounded-[22px] border border-indigo-100/90 overflow-hidden shadow-sm">
                <div className="p-5 border-b border-indigo-100/80 flex items-center justify-between bg-[#FAF9FF]">
                  <div>
                    <h3 className="font-black text-[#1E1B4B] text-sm">Monthly Attendance Breakdown</h3>
                    <p className="text-xs text-slate-500 mt-0.5">{MONTHS[selectedMonth]} {selectedYear} &bull; {myRecords.length} records</p>
                  </div>
                  <span className="px-3 py-1 bg-[#EFEAFE] text-[#5B21B6] font-extrabold text-xs rounded-xl border border-[#DDD6FE]">
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
                        <div key={r.id || r.date} className="p-4 hover:bg-indigo-50/30 transition-colors flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3.5">
                            <div className="w-10 h-10 rounded-xl flex flex-col items-center justify-center bg-[#EFEAFE] border border-[#DDD6FE] text-[#5B21B6] font-black shrink-0">
                              <span className="text-[9px] uppercase text-indigo-500 font-bold leading-none">{dObj.toLocaleDateString('en-US', { weekday: 'short' })}</span>
                              <span className="text-sm font-black leading-none mt-0.5">{dObj.getDate()}</span>
                            </div>
                            <div>
                              <p className="font-bold text-slate-800 text-xs sm:text-sm">
                                {dObj.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                              </p>
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

              <div className="bg-white rounded-[22px] border border-indigo-100/90 overflow-hidden shadow-sm">
                <div className="p-5 border-b border-indigo-100/80 bg-[#FAF9FF]">
                  <h3 className="font-black text-[#1E1B4B] text-sm">Gatepass &amp; Leave Request History</h3>
                </div>
                <div className="divide-y divide-slate-100 max-h-[350px] overflow-y-auto">
                  {historyLogs.map((log: any, idx) => (
                    <div key={idx} className="p-4 hover:bg-indigo-50/30 transition-colors flex items-center justify-between">
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
