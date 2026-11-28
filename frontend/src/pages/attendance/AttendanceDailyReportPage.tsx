import React, { useEffect, useState, useMemo } from 'react';
import api from '../../api/axios';
import { LoadingSpinner } from '../../components/UI/LoadingSpinner';
import {
  Printer, Calendar, Download, School, Users, UserCheck,
  UserX, CheckCircle2, FileSpreadsheet
} from 'lucide-react';
import toast from 'react-hot-toast';
import { toJpeg } from 'html-to-image';
import { PageHeader } from '../../components/UI/PageHeader';
import { AttendanceNavTabs } from './AttendanceNavTabs';
import './AttendanceDailyReport.css';

interface ClassAttendanceSummary {
  classId: string;
  className: string;
  academicYear?: string;
  total: number;
  present: number;
  absent: number;
  late?: number;
  excused?: number;
}

const formatLocalYMD = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export default function AttendanceDailyReportPage() {
  const [date, setDate] = useState<string>(() => formatLocalYMD(new Date()));
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ClassAttendanceSummary[]>([]);

  const fetchDailySummary = async () => {
    setLoading(true);
    try {
      const res: any = await api.get('/api/attendance/daily-summary', { params: { date } });
      const summaryList = Array.isArray(res.data) ? res.data : (res.data?.data || res || []);
      setData(summaryList);
    } catch (e: any) {
      console.error(e);
      toast.error('Failed to load daily attendance report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDailySummary();
  }, [date]);

  const handlePrint = () => {
    const reportEl = document.getElementById('reportArea');
    if (!reportEl) {
      window.print();
      return;
    }

    const oldFrame = document.getElementById('attendance-print-frame');
    if (oldFrame) oldFrame.remove();

    const iframe = document.createElement('iframe');
    iframe.id = 'attendance-print-frame';
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) {
      window.print();
      return;
    }

    const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
      .map((node) => node.outerHTML)
      .join('\n');

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Daily Attendance Report - ${date}</title>
          ${styles}
          <style>
            @page {
              size: A4 portrait;
              margin: 6mm 8mm;
            }
            html, body {
              margin: 0 !important;
              padding: 0 !important;
              background: #ffffff !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
            }
            #reportArea {
              width: 100% !important;
              max-width: 100% !important;
              margin: 0 !important;
              padding: 0 !important;
              border: none !important;
              box-shadow: none !important;
              border-radius: 0 !important;
              background: #ffffff !important;
            }
            .daily-report-table th,
            .daily-report-table td,
            .daily-kpi-grid div {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
          </style>
        </head>
        <body>
          <div id="reportArea">
            ${reportEl.innerHTML}
          </div>
        </body>
      </html>
    `);
    doc.close();

    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      setTimeout(() => {
        iframe.remove();
      }, 1000);
    }, 250);
  };

  // Metrics computation
  const totalClasses = data.length;
  const totalStudents = data.reduce((acc, c) => acc + (c.total || 0), 0);
  const totalPresent = data.reduce((acc, c) => acc + (c.present || 0), 0);
  const totalAbsent = data.reduce((acc, c) => acc + (c.absent || 0), 0);

  const overallPercentage =
    totalStudents > 0 ? Math.round((totalPresent / totalStudents) * 100 * 10) / 10 : 0;
  const absentPercentage =
    totalStudents > 0 ? Math.round((totalAbsent / totalStudents) * 100 * 10) / 10 : 0;

  const sessionYear = useMemo(() => {
    const fromData = data.find((c) => c.academicYear)?.academicYear;
    if (fromData && fromData.includes('-')) return fromData;
    if (!date) return '2026-2027';
    const d = new Date(date);
    if (isNaN(d.getTime())) return '2026-2027';
    const y = d.getFullYear();
    const m = d.getMonth() + 1;
    return m >= 6 ? `${y}-${y + 1}` : `${y - 1}-${y}`;
  }, [data, date]);

  const { primaryClasses, secondaryClasses } = useMemo(() => {
    const isPrimary = (className: string) => {
      const lower = (className || '').toLowerCase().trim();
      if (lower.match(/(nursery|nur|pp1|pp-1|pp2|pp-2|lkg|ukg|pre-kg|playgroup)/i)) return true;
      const numMatch = lower.match(/(\d+)/);
      if (numMatch) {
        const num = parseInt(numMatch[1], 10);
        return num >= 1 && num <= 5;
      }
      return false;
    };

    const primary = data.filter((r) => isPrimary(r.className));
    const secondary = data.filter((r) => !isPrimary(r.className));

    if (primary.length === 0 || secondary.length === 0) {
      const half = Math.ceil(data.length / 2);
      return {
        primaryClasses: data.slice(0, half),
        secondaryClasses: data.slice(half),
      };
    }

    return { primaryClasses: primary, secondaryClasses: secondary };
  }, [data]);

  const getSubtotals = (list: ClassAttendanceSummary[]) => {
    const total = list.reduce((acc, c) => acc + (c.total || 0), 0);
    const present = list.reduce((acc, c) => acc + (c.present || 0), 0);
    const absent = list.reduce((acc, c) => acc + (c.absent || 0), 0);
    const pct = total > 0 ? Math.round((present / total) * 100 * 10) / 10 : 0;
    return { total, present, absent, pct, count: list.length };
  };

  const primarySubtotals = getSubtotals(primaryClasses);
  const secondarySubtotals = getSubtotals(secondaryClasses);

  const handleDownloadImage = async () => {
    const reportElement = document.getElementById('reportArea');
    if (!reportElement) return;
    const toastId = toast.loading('Generating High-Resolution Image...');
    try {
      const imgData = await toJpeg(reportElement, {
        cacheBust: true,
        pixelRatio: 2,
        quality: 0.98,
        backgroundColor: '#ffffff',
      });

      const link = document.createElement('a');
      link.download = `JY_School_Daily_Attendance_${date}.jpg`;
      link.href = imgData;
      link.click();
      toast.success('Downloaded successfully!', { id: toastId });
    } catch (e) {
      console.error(e);
      toast.error('Failed to download image', { id: toastId });
    }
  };

  const todayYmd = formatLocalYMD(new Date());
  const yesterdayObj = new Date();
  yesterdayObj.setDate(yesterdayObj.getDate() - 1);
  const yesterdayYmd = formatLocalYMD(yesterdayObj);

  const formattedDate = new Date(date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const renderSectionTable = (
    title: string,
    dotColor: string,
    rows: ClassAttendanceSummary[],
    subtotals: { total: number; present: number; absent: number; pct: number; count: number }
  ) => (
    <div className="border border-[#DDD7F3] rounded-2xl overflow-hidden shadow-xs bg-white">
      <div className="bg-[#FAF9FF] px-3.5 py-2 border-b border-indigo-100/80 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${dotColor}`} />
          <h3 className="text-[11px] font-black uppercase tracking-wider text-[#1E1B4B]">{title}</h3>
        </div>
        <span className="text-[10px] font-extrabold text-[#5B21B6] bg-[#EFEAFE] px-2.5 py-0.5 rounded-full border border-[#DDD6FE]">
          {rows.length} Classes
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="daily-report-table w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-gradient-to-r from-[#7D3CEF] via-[#6D38EA] to-[#5B21B6] text-white text-[10px] font-black uppercase tracking-wider">
              <th className="py-2 px-2.5 w-8 text-center border-r border-white/15">#</th>
              <th className="py-2 px-2.5 border-r border-white/15">Class</th>
              <th className="py-2 px-2.5 text-center border-r border-white/15">Total</th>
              <th className="py-2 px-2.5 text-center border-r border-white/15">Present</th>
              <th className="py-2 px-2.5 text-center border-r border-white/15">Absent</th>
              <th className="py-2 px-2.5 text-center">Attd %</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => {
              const pct = row.total > 0 ? Math.round((row.present / row.total) * 100) : 0;
              return (
                <tr
                  key={row.classId}
                  className={idx % 2 === 0 ? 'bg-white border-b border-[#EAE7F6]' : 'bg-[#FAF9FF] border-b border-[#EAE7F6]'}
                >
                  <td className="py-1.5 px-2.5 text-center font-bold text-[#1E1B4B] text-[10.5px] border-r border-[#EAE7F6]">
                    {idx + 1}
                  </td>
                  <td className="py-1.5 px-2.5 font-black text-[#1E1B4B] text-[11.5px] border-r border-[#EAE7F6]">
                    {row.className}
                  </td>
                  <td className="py-1.5 px-2.5 text-center font-bold text-slate-700 font-mono text-[11.5px] border-r border-[#EAE7F6]">
                    {row.total}
                  </td>
                  <td className="py-1.5 px-2.5 text-center font-black text-emerald-600 font-mono text-[11.5px] border-r border-[#EAE7F6]">
                    {row.present}
                  </td>
                  <td className="py-1.5 px-2.5 text-center font-black text-rose-600 font-mono text-[11.5px] border-r border-[#EAE7F6]">
                    {row.absent > 0 ? row.absent : '0'}
                  </td>
                  <td className="py-1.5 px-2.5 text-center">
                    <span
                      className={`px-2 py-0.5 rounded-full font-mono text-[10px] font-black border ${
                        pct >= 85
                          ? 'bg-[#DCFCE7] text-[#15803D] border-[#BBF7D0]'
                          : pct >= 70
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : 'bg-rose-50 text-rose-800 border-rose-200'
                      }`}
                    >
                      {pct}%
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="bg-[#EFEAFE]/70 font-black text-[#1E1B4B] border-t border-[#DDD6FE] text-xs">
              <td colSpan={2} className="py-2 px-2.5 uppercase text-[10.5px] tracking-wider border-r border-[#DDD6FE]">
                Section Subtotal:
              </td>
              <td className="py-2 px-2.5 text-center font-black text-[#1E1B4B] font-mono text-xs border-r border-[#DDD6FE]">
                {subtotals.total}
              </td>
              <td className="py-2 px-2.5 text-center font-black text-emerald-700 font-mono text-xs border-r border-[#DDD6FE]">
                {subtotals.present}
              </td>
              <td className="py-2 px-2.5 text-center font-black text-rose-700 font-mono text-xs border-r border-[#DDD6FE]">
                {subtotals.absent}
              </td>
              <td className="py-2 px-2.5 text-center">
                <span className="px-2 py-0.5 bg-white text-[#5B21B6] border border-[#DDD6FE] rounded-full font-black text-[10.5px] font-mono">
                  {subtotals.pct}%
                </span>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-[#F4F7FC] text-slate-800 overflow-hidden">
      <PageHeader
        title="Daily Attendance Report"
        icon={<FileSpreadsheet className="w-5 h-5 text-white" />}
        action={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadImage}
              className="px-3.5 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white border border-white/25 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download JPG</span>
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-indigo-50 text-[#1E1B4B] text-xs font-extrabold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-[#5B21B6]" />
              <span>Print Report</span>
            </button>
          </div>
        }
      />

      <div className="flex-1 overflow-auto p-4 sm:p-6">
        <div className="w-full max-w-7xl mx-auto space-y-5 pb-14">

          {/* Navigation Tabs & Date Controls Strip */}
          <div className="print:hidden flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <AttendanceNavTabs />

            <div className="bg-white border border-[#DDD7F3] rounded-[16px] p-1.5 shadow-[0_6px_18px_-6px_rgba(91,33,182,0.08)] flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setDate(todayYmd)}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                  date === todayYmd
                    ? 'bg-gradient-to-r from-[#5B21B6] to-[#7C3AED] text-white shadow-xs'
                    : 'text-slate-600 hover:bg-[#F4F2FC]'
                }`}
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => setDate(yesterdayYmd)}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                  date === yesterdayYmd
                    ? 'bg-gradient-to-r from-[#5B21B6] to-[#7C3AED] text-white shadow-xs'
                    : 'text-slate-600 hover:bg-[#F4F2FC]'
                }`}
              >
                Yesterday
              </button>
              <div className="flex items-center gap-1.5 bg-[#F8FAFF] border border-indigo-100 rounded-xl px-2.5 py-1">
                <Calendar className="w-3.5 h-3.5 text-[#5B21B6]" />
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="bg-transparent border-none text-xs font-bold text-[#1E1B4B] focus:outline-none cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* ── MAIN REPORT CONTAINER (Screen-Fitting & 1-Page A4 Printable) ── */}
          <div
            id="reportArea"
            className="w-full bg-white rounded-[22px] border border-[#DDD7F3] shadow-[0_12px_32px_-6px_rgba(91,33,182,0.09)] p-4 sm:p-6 print:p-0 print:border-none print:shadow-none print:rounded-none"
          >
            {/* 1. Official School Letterhead */}
            <div className="daily-report-header flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3.5 mb-4 border-b-2 border-[#5B21B6]">
              <div className="flex items-center gap-3.5 text-left">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white border border-[#DDD6FE] p-1.5 shadow-2xs shrink-0 flex items-center justify-center">
                  <img
                    src="/logo.png?v=1"
                    alt="JY School Logo"
                    className="w-full h-full object-contain"
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                </div>

                <div>
                  <h1 className="text-lg sm:text-2xl font-black text-[#1E1B4B] uppercase tracking-tight leading-none">
                    SRI VENKATESWARA JY SCHOOL
                  </h1>
                  <p className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider mt-1 leading-tight">
                    Recognized by Govt. of Andhra Pradesh
                  </p>
                  <div className="inline-flex items-center gap-1.5 mt-1.5 px-3 py-0.5 bg-gradient-to-r from-[#5B21B6] to-[#4338CA] text-white rounded-md text-[9.5px] font-black uppercase tracking-[0.14em]">
                    <span>Daily Attendance Summary Report</span>
                  </div>
                </div>
              </div>

              <div className="bg-[#FAF9FF] border border-[#DDD6FE] rounded-2xl px-3.5 py-2 text-left sm:text-right shrink-0 min-w-[185px]">
                <p className="text-[9px] font-black uppercase tracking-wider text-indigo-400 leading-tight">
                  Report Date
                </p>
                <p className="text-xs font-black text-[#1E1B4B] leading-tight mt-0.5">
                  {formattedDate}
                </p>
                <div className="mt-1.5 pt-1 border-t border-indigo-100 flex items-center sm:justify-end gap-2 text-[10px]">
                  <span className="text-slate-500 font-semibold text-[9.5px]">Session:</span>
                  <span className="font-extrabold text-[#5B21B6] bg-[#EFEAFE] px-2 py-0.5 rounded-md border border-[#DDD6FE]">
                    {sessionYear}
                  </span>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="py-20 text-center">
                <LoadingSpinner size="lg" className="mx-auto mb-3" />
                <p className="text-xs font-bold text-slate-500">Loading daily attendance records...</p>
              </div>
            ) : (
              <>
                {/* 2. Dashboard Glossy Pastel KPI Cards */}
                <div className="daily-kpi-grid grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                  <div className="relative overflow-hidden rounded-[18px] px-3.5 py-3 border bg-gradient-to-br from-[#F2EDFF] to-[#DDD2FF] border-[#CEC0FF] shadow-2xs flex items-center justify-between">
                    <div>
                      <span className="text-[9.5px] font-black uppercase tracking-wider text-slate-600 block leading-tight">
                        Total Classes
                      </span>
                      <div className="flex items-baseline gap-1.5 mt-0.5">
                        <p className="text-xl sm:text-2xl font-black text-[#4C1D95] font-mono leading-none">{totalClasses}</p>
                        <span className="text-[10px] font-bold text-slate-600">Pre-Primary–10th</span>
                      </div>
                    </div>
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#8B5CF6] to-[#6D28D9] text-white flex items-center justify-center shrink-0 shadow-sm">
                      <School className="w-4 h-4" />
                    </div>
                  </div>

                  <div className="relative overflow-hidden rounded-[18px] px-3.5 py-3 border bg-gradient-to-br from-[#EAF2FF] to-[#CBE0FF] border-[#B6D2FF] shadow-2xs flex items-center justify-between">
                    <div>
                      <span className="text-[9.5px] font-black uppercase tracking-wider text-slate-600 block leading-tight">
                        Total Strength
                      </span>
                      <div className="flex items-baseline gap-1.5 mt-0.5">
                        <p className="text-xl sm:text-2xl font-black text-slate-900 font-mono leading-none">{totalStudents}</p>
                        <span className="text-[10px] font-bold text-slate-600">Enrolled</span>
                      </div>
                    </div>
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#2563EB] to-[#1D4ED8] text-white flex items-center justify-center shrink-0 shadow-sm">
                      <Users className="w-4 h-4" />
                    </div>
                  </div>

                  <div className="relative overflow-hidden rounded-[18px] px-3.5 py-3 border bg-gradient-to-br from-[#E5FAEF] to-[#C2F2D9] border-[#ACEAD0] shadow-2xs flex items-center justify-between">
                    <div>
                      <span className="text-[9.5px] font-black uppercase tracking-wider text-[#065F46] block leading-tight">
                        Present Today
                      </span>
                      <div className="flex items-baseline gap-1.5 mt-0.5">
                        <p className="text-xl sm:text-2xl font-black text-[#065F46] font-mono leading-none">{totalPresent}</p>
                        <span className="px-1.5 py-0.5 bg-white/80 text-[#065F46] text-[10px] font-black rounded font-mono">
                          {overallPercentage}%
                        </span>
                      </div>
                    </div>
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#10B981] to-[#059669] text-white flex items-center justify-center shrink-0 shadow-sm">
                      <UserCheck className="w-4 h-4" />
                    </div>
                  </div>

                  <div className="relative overflow-hidden rounded-[18px] px-3.5 py-3 border bg-gradient-to-br from-[#FFEFEF] to-[#FFD2D7] border-[#FFC0C7] shadow-2xs flex items-center justify-between">
                    <div>
                      <span className="text-[9.5px] font-black uppercase tracking-wider text-[#991B1B] block leading-tight">
                        Absent Today
                      </span>
                      <div className="flex items-baseline gap-1.5 mt-0.5">
                        <p className="text-xl sm:text-2xl font-black text-[#991B1B] font-mono leading-none">{totalAbsent}</p>
                        <span className="px-1.5 py-0.5 bg-white/80 text-[#991B1B] text-[10px] font-black rounded font-mono">
                          {absentPercentage}%
                        </span>
                      </div>
                    </div>
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#EF4444] to-[#DC2626] text-white flex items-center justify-center shrink-0 shadow-sm">
                      <UserX className="w-4 h-4" />
                    </div>
                  </div>
                </div>

                {/* 3. Two-Column Side-by-Side Tables */}
                <div className="daily-tables-grid grid grid-cols-1 lg:grid-cols-2 gap-3.5 mb-4">
                  {renderSectionTable(
                    'Primary Section (Nursery – 5th)',
                    'bg-indigo-600',
                    primaryClasses,
                    primarySubtotals
                  )}
                  {renderSectionTable(
                    'Secondary Section (6th – 10th)',
                    'bg-purple-600',
                    secondaryClasses,
                    secondarySubtotals
                  )}
                </div>

                {/* 4. Grand Summary Strip */}
                <div className="daily-summary-strip bg-[#FAF9FF] border border-[#DDD6FE] rounded-2xl px-4 py-2.5 mb-3.5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-[13px] font-black text-[#1E1B4B] leading-tight">
                        School Overall Attendance:{' '}
                        <span className="font-mono text-emerald-700">
                          {totalPresent} / {totalStudents} ({overallPercentage}%)
                        </span>
                      </h4>
                      <p className="text-[10px] font-medium text-slate-500 leading-tight mt-0.5">
                        Total Classes Evaluated: {totalClasses} &bull; Total Absentees: {totalAbsent}
                      </p>
                    </div>
                  </div>
                </div>

                {/* 5. Official Signatures */}
                <div className="daily-signatures-box pt-5 pb-2 flex items-end justify-between gap-6 px-4 sm:px-10 border-t border-indigo-100 mt-auto">
                  <div className="text-center w-40">
                    <div className="sig-space h-14 sm:h-16" />
                    <div className="w-32 border-b border-slate-400 mb-1.5 border-dashed mx-auto" />
                    <p className="text-[10.5px] font-black text-slate-700 uppercase tracking-wider leading-tight">Attendance Incharge</p>
                    <p className="text-[8.5px] text-slate-400 mt-0.5 leading-tight">Verified &amp; Signed</p>
                  </div>

                  <div className="text-center w-40">
                    <div className="sig-space h-14 sm:h-16" />
                    <div className="w-32 border-b border-slate-400 mb-1.5 border-dashed mx-auto" />
                    <p className="text-[10.5px] font-black text-slate-700 uppercase tracking-wider leading-tight">Vice Principal</p>
                    <p className="text-[8.5px] text-slate-400 mt-0.5 leading-tight">Reviewed</p>
                  </div>

                  <div className="text-center w-40">
                    <div className="sig-space h-14 sm:h-16" />
                    <div className="w-36 border-b-2 border-[#1E1B4B] mb-1.5 mx-auto" />
                    <p className="text-[10.5px] font-black text-[#1E1B4B] uppercase tracking-wider leading-tight">Headmaster / Principal</p>
                    <p className="text-[8.5px] text-slate-500 font-bold mt-0.5 leading-tight">Official School Seal</p>
                  </div>
                </div>

                <div className="daily-system-footer mt-2 text-center text-[8.5px] font-medium text-slate-400 border-t border-slate-100 pt-2">
                  Generated automatically by JY School ERP Portal &bull; System Reference: JYS-ATT-{date.replace(/-/g, '')}
                </div>
              </>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
