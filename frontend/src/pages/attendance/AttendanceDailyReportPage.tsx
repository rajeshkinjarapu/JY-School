import React, { useEffect, useState, useMemo } from 'react';
import api from '../../api/axios';
import { LoadingSpinner } from '../../components/UI/LoadingSpinner';
import { Printer, Calendar, Download, School, Users, UserCheck, UserX, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { toJpeg } from 'html-to-image';
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

export default function AttendanceDailyReportPage() {
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
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

    const cloneEl = reportEl.cloneNode(true) as HTMLElement;
    cloneEl.style.boxShadow = 'none';
    cloneEl.style.border = 'none';
    cloneEl.style.outline = 'none';
    cloneEl.style.minHeight = '0';
    cloneEl.style.width = '100%';
    cloneEl.style.padding = '0';
    cloneEl.style.margin = '0';

    let oldIframe = document.getElementById('daily-report-print-iframe');
    if (oldIframe) {
      oldIframe.remove();
    }

    const iframe = document.createElement('iframe');
    iframe.id = 'daily-report-print-iframe';
    iframe.style.position = 'fixed';
    iframe.style.width = '0px';
    iframe.style.height = '0px';
    iframe.style.border = 'none';
    iframe.style.left = '-10000px';
    iframe.style.top = '-10000px';
    document.body.appendChild(iframe);

    const printDocument = iframe.contentWindow?.document;
    if (!printDocument) {
      window.print();
      return;
    }

    const styleTags = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
      .map((el) => el.outerHTML)
      .join('\n');

    printDocument.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>Daily Attendance Report - ${date}</title>
  ${styleTags}
  <style>
    @page { size: A4 portrait; margin: 6mm 8mm; }
    * { box-sizing: border-box; }
    html, body {
      margin: 0 !important;
      padding: 0 !important;
      background: #ffffff !important;
      color: #0f172a !important;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    #print-root {
      width: 100% !important;
      max-width: 194mm !important;
      margin: 0 auto !important;
      background: #ffffff !important;
    }
    .daily-report-header {
      display: flex !important;
      flex-direction: row !important;
      align-items: center !important;
      justify-content: space-between !important;
      padding-bottom: 3.5mm !important;
      margin-bottom: 4mm !important;
      border-bottom: 2px solid #0f172a !important;
    }
    .daily-kpi-grid {
      display: grid !important;
      grid-template-columns: repeat(4, 1fr) !important;
      gap: 8px !important;
      margin-bottom: 4mm !important;
    }
    .daily-kpi-grid > div {
      display: flex !important;
      align-items: center !important;
      justify-content: space-between !important;
      padding: 8px 10px !important;
    }
    .daily-tables-grid {
      display: grid !important;
      grid-template-columns: repeat(2, 1fr) !important;
      gap: 10px !important;
      margin-bottom: 4mm !important;
    }
    .daily-report-table {
      width: 100% !important;
      border-collapse: collapse !important;
    }
    .daily-report-table th {
      padding: 5.5px 6px !important;
      font-size: 10.5px !important;
      line-height: 1.25 !important;
      background-color: #f8fafc !important;
      color: #475569 !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    .daily-report-table td {
      padding: 7px 6px !important;
      font-size: 11px !important;
      line-height: 1.25 !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    .daily-report-table tfoot td {
      padding: 6px 6px !important;
      font-size: 11px !important;
      font-weight: 900 !important;
      background-color: #f1f5f9 !important;
      color: #0f172a !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    .daily-summary-strip {
      display: flex !important;
      align-items: center !important;
      justify-content: space-between !important;
      padding: 8px 12px !important;
      margin-bottom: 4.5mm !important;
    }
    .daily-signatures-box {
      display: flex !important;
      justify-content: space-between !important;
      align-items: flex-end !important;
      margin-top: 5mm !important;
      padding-top: 6mm !important;
      padding-bottom: 3mm !important;
      border-top: 1.5px solid #cbd5e1 !important;
    }
    .daily-signatures-box .sig-space {
      height: 60px !important;
    }
    .daily-system-footer {
      margin-top: 2.5mm !important;
      padding-top: 2mm !important;
      font-size: 8.5px !important;
    }
  </style>
</head>
<body>
  <div id="print-root">${cloneEl.innerHTML}</div>
</body>
</html>`);
    printDocument.close();

    const triggerPrint = () => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      setTimeout(() => {
        iframe.remove();
      }, 2000);
    };

    if (iframe.contentWindow?.document.readyState === 'complete') {
      setTimeout(triggerPrint, 300);
    } else {
      iframe.onload = () => setTimeout(triggerPrint, 300);
    }
  };

  // Metrics computation
  const totalClasses = data.length;
  const totalStudents = data.reduce((acc, c) => acc + (c.total || 0), 0);
  const totalPresent = data.reduce((acc, c) => acc + (c.present || 0), 0);
  const totalAbsent = data.reduce((acc, c) => acc + (c.absent || 0), 0);

  const overallPercentage = totalStudents > 0 
    ? Math.round((totalPresent / totalStudents) * 100 * 10) / 10 
    : 0;
  const absentPercentage = totalStudents > 0 
    ? Math.round((totalAbsent / totalStudents) * 100 * 10) / 10 
    : 0;

  // Dynamic Academic Session calculation (from classes data or selected date)
  const sessionYear = useMemo(() => {
    const fromData = data.find(c => c.academicYear)?.academicYear;
    if (fromData && fromData.includes('-')) return fromData;

    if (!date) return '2026-2027';
    const d = new Date(date);
    if (isNaN(d.getTime())) return '2026-2027';
    const y = d.getFullYear();
    const m = d.getMonth() + 1; // 1-12
    // Academic year in AP/India starts in June (month 6)
    return m >= 6 ? `${y}-${y + 1}` : `${y - 1}-${y}`;
  }, [data, date]);

  // Split classes into Primary (Nursery to 5th) and Secondary (6th to 10th)
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

    const primary = data.filter(r => isPrimary(r.className));
    const secondary = data.filter(r => !isPrimary(r.className));

    // If filter doesn't neatly separate them, split down the middle
    if (primary.length === 0 || secondary.length === 0) {
      const half = Math.ceil(data.length / 2);
      return {
        primaryClasses: data.slice(0, half),
        secondaryClasses: data.slice(half)
      };
    }

    return { primaryClasses: primary, secondaryClasses: secondary };
  }, [data]);

  // Section subtotals helper
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
        backgroundColor: '#ffffff'
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

  const formattedDate = new Date(date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 pb-20">
      
      {/* ── TOP ACTION BAR (Hidden on Print) ── */}
      <div className="print:hidden flex flex-col md:flex-row justify-between items-center bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs gap-4">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-black text-slate-900 text-lg tracking-tight">Daily Attendance Report</h2>
            <p className="text-xs font-medium text-slate-500">School-wide attendance summary & class breakdown</p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 w-full md:w-auto flex-wrap sm:flex-nowrap">
          {/* Quick Date Shortcuts */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-bold text-slate-700">
            <button
              onClick={() => setDate(new Date().toISOString().split('T')[0])}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                date === new Date().toISOString().split('T')[0] ? 'bg-white shadow-xs text-indigo-700' : 'hover:text-slate-900'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => {
                const y = new Date();
                y.setDate(y.getDate() - 1);
                setDate(y.toISOString().split('T')[0]);
              }}
              className="px-3 py-1.5 rounded-lg transition-all hover:text-slate-900 cursor-pointer"
            >
              Yesterday
            </button>
          </div>

          {/* Date Picker Input */}
          <div className="relative">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 shadow-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
            />
          </div>

          {/* Download Image Button */}
          <button
            onClick={handleDownloadImage}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all shadow-xs active:scale-95 cursor-pointer whitespace-nowrap"
          >
            <Download className="w-4 h-4 text-slate-600" />
            <span>Download</span>
          </button>

          {/* Print Button */}
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl transition-all shadow-sm shadow-indigo-500/25 active:scale-95 cursor-pointer whitespace-nowrap"
          >
            <Printer className="w-4 h-4" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* ── MAIN REPORT CONTAINER (White Background, Screen-Fitting, 1-Page Printable) ── */}
      <div
        id="reportArea"
        className="w-full bg-white rounded-3xl border border-slate-200/90 shadow-sm p-4 sm:p-6 print:p-0 print:border-none print:shadow-none print:rounded-none"
      >
        {/* ── 1. OFFICIAL SCHOOL LETTERHEAD / HEADER ── */}
        <div className="daily-report-header flex flex-row items-center justify-between gap-4 pb-3 sm:pb-3.5 mb-3 sm:mb-3.5 border-b-2 border-slate-900">
          
          {/* Logo & School Title */}
          <div className="flex items-center gap-3.5 text-left">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-white border border-slate-200 p-1.5 shadow-2xs shrink-0 flex items-center justify-center">
              <img
                src="/logo.png?v=1"
                alt="JY School Logo"
                className="w-full h-full object-contain"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
            </div>

            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 uppercase tracking-tight leading-none">
                SRI VENKATESWARA JY SCHOOL
              </h1>
              <p className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider mt-1 leading-tight">
                Recognized by Govt. of Andhra Pradesh
              </p>
              <div className="inline-flex items-center gap-1.5 mt-1 px-2.5 py-0.5 bg-slate-900 text-white rounded text-[9.5px] font-black uppercase tracking-[0.16em]">
                <span>Daily Attendance Summary Report</span>
              </div>
            </div>
          </div>

          {/* Date & Session Box */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-right shrink-0 min-w-[170px]">
            <p className="text-[9px] font-black uppercase tracking-wider text-slate-400 leading-tight">
              Report Date
            </p>
            <p className="text-xs font-black text-slate-900 leading-tight">
              {formattedDate}
            </p>
            <div className="mt-1 pt-1 border-t border-slate-200/80 flex items-center justify-end gap-2 text-[10px]">
              <span className="text-slate-500 font-semibold text-[9.5px]">Session:</span>
              <span className="font-extrabold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">{sessionYear}</span>
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
            {/* ── 2. METRIC SUMMARY CARDS ── */}
            <div className="daily-kpi-grid grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3 mb-3 sm:mb-3.5">
              
              {/* Card 1: Classes */}
              <div className="bg-slate-50/80 rounded-xl px-3.5 py-2.5 border border-slate-200 shadow-2xs flex items-center justify-between">
                <div>
                  <span className="text-[9.5px] font-black uppercase tracking-wider text-slate-500 block leading-tight">
                    Total Classes
                  </span>
                  <div className="flex items-baseline gap-1.5 mt-0.5">
                    <p className="text-xl sm:text-2xl font-black text-slate-900 font-mono leading-none">{totalClasses}</p>
                    <span className="text-[10px] font-semibold text-slate-400">Pre-Primary to 10th</span>
                  </div>
                </div>
                <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-700 flex items-center justify-center font-bold shrink-0 shadow-2xs">
                  <School className="w-4 h-4" />
                </div>
              </div>

              {/* Card 2: Total Strength */}
              <div className="bg-slate-50/80 rounded-xl px-3.5 py-2.5 border border-slate-200 shadow-2xs flex items-center justify-between">
                <div>
                  <span className="text-[9.5px] font-black uppercase tracking-wider text-slate-500 block leading-tight">
                    Total Strength
                  </span>
                  <div className="flex items-baseline gap-1.5 mt-0.5">
                    <p className="text-xl sm:text-2xl font-black text-slate-900 font-mono leading-none">{totalStudents}</p>
                    <span className="text-[10px] font-semibold text-slate-400">Enrolled Students</span>
                  </div>
                </div>
                <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center font-bold shrink-0 shadow-2xs">
                  <Users className="w-4 h-4" />
                </div>
              </div>

              {/* Card 3: Present */}
              <div className="bg-emerald-50/50 rounded-xl px-3.5 py-2.5 border border-emerald-200/90 shadow-2xs flex items-center justify-between">
                <div>
                  <span className="text-[9.5px] font-black uppercase tracking-wider text-emerald-800 block leading-tight">
                    Present Today
                  </span>
                  <div className="flex items-baseline gap-1.5 mt-0.5">
                    <p className="text-xl sm:text-2xl font-black text-emerald-700 font-mono leading-none">{totalPresent}</p>
                    <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-black rounded font-mono">
                      {overallPercentage}%
                    </span>
                  </div>
                </div>
                <div className="w-8 h-8 rounded-lg bg-white border border-emerald-200 text-emerald-600 flex items-center justify-center font-bold shrink-0 shadow-2xs">
                  <UserCheck className="w-4 h-4" />
                </div>
              </div>

              {/* Card 4: Absent */}
              <div className="bg-rose-50/50 rounded-xl px-3.5 py-2.5 border border-rose-200/90 shadow-2xs flex items-center justify-between">
                <div>
                  <span className="text-[9.5px] font-black uppercase tracking-wider text-rose-800 block leading-tight">
                    Absent Today
                  </span>
                  <div className="flex items-baseline gap-1.5 mt-0.5">
                    <p className="text-xl sm:text-2xl font-black text-rose-700 font-mono leading-none">{totalAbsent}</p>
                    <span className="px-1.5 py-0.5 bg-rose-100 text-rose-800 text-[10px] font-black rounded font-mono">
                      {absentPercentage}%
                    </span>
                  </div>
                </div>
                <div className="w-8 h-8 rounded-lg bg-white border border-rose-200 text-rose-600 flex items-center justify-center font-bold shrink-0 shadow-2xs">
                  <UserX className="w-4 h-4" />
                </div>
              </div>

            </div>

            {/* ── 3. CLASS-WISE ATTENDANCE TABLES (Two Columns Side-by-Side) ── */}
            <div className="daily-tables-grid grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-3.5 mb-3 sm:mb-3.5">
              
              {/* ── LEFT TABLE: PRIMARY CLASSES ── */}
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs bg-white">
                <div className="bg-slate-100/90 px-3.5 py-2 border-b border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                    <h3 className="text-[10.5px] font-black uppercase tracking-wider text-slate-800">
                      Primary Section (Nursery – 5th)
                    </h3>
                  </div>
                  <span className="text-[10px] font-extrabold text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                    {primaryClasses.length} Classes
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="daily-report-table w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-black uppercase text-slate-600 tracking-wider">
                        <th className="py-2 px-2.5 w-8 text-center">#</th>
                        <th className="py-2 px-2.5">Class</th>
                        <th className="py-2 px-2.5 text-center">Total</th>
                        <th className="py-2 px-2.5 text-center text-emerald-700">Present</th>
                        <th className="py-2 px-2.5 text-center text-rose-700">Absent</th>
                        <th className="py-2 px-2.5 text-center">Attd %</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {primaryClasses.map((row, idx) => {
                        const pct = row.total > 0 ? Math.round((row.present / row.total) * 100) : 0;
                        return (
                          <tr key={row.classId} className={idx % 2 === 0 ? 'bg-white hover:bg-slate-50/60' : 'bg-slate-50/30 hover:bg-slate-50'}>
                            <td className="py-2 px-2.5 text-center font-bold text-slate-400 text-[10px]">
                              {idx + 1}
                            </td>
                            <td className="py-2 px-2.5 font-black text-slate-800 text-[11.5px]">
                              {row.className}
                            </td>
                            <td className="py-2 px-2.5 text-center font-bold text-slate-600 font-mono text-[11.5px]">
                              {row.total}
                            </td>
                            <td className="py-2 px-2.5 text-center font-black text-emerald-600 font-mono text-[11.5px]">
                              {row.present}
                            </td>
                            <td className="py-2 px-2.5 text-center font-black text-rose-600 font-mono text-[11.5px]">
                              {row.absent > 0 ? row.absent : '0'}
                            </td>
                            <td className="py-2 px-2.5 text-center">
                              <span
                                className={`px-2 py-0.5 rounded font-mono text-[10px] font-black ${
                                  pct >= 85
                                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                    : pct >= 70
                                    ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                                }`}
                              >
                                {pct}%
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    {/* Primary Subtotal */}
                    <tfoot>
                      <tr className="bg-slate-100/90 font-black text-slate-900 border-t border-slate-200 text-xs">
                        <td colSpan={2} className="py-2 px-2.5 uppercase text-[10.5px] tracking-wider">
                          Section Subtotal:
                        </td>
                        <td className="py-2 px-2.5 text-center font-black text-slate-900 font-mono text-xs">
                          {primarySubtotals.total}
                        </td>
                        <td className="py-2 px-2.5 text-center font-black text-emerald-700 font-mono text-xs">
                          {primarySubtotals.present}
                        </td>
                        <td className="py-2 px-2.5 text-center font-black text-rose-700 font-mono text-xs">
                          {primarySubtotals.absent}
                        </td>
                        <td className="py-2 px-2.5 text-center">
                          <span className="px-2 py-0.5 bg-slate-200 text-slate-900 rounded font-black text-[10.5px] font-mono">
                            {primarySubtotals.pct}%
                          </span>
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* ── RIGHT TABLE: SECONDARY CLASSES ── */}
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs bg-white">
                <div className="bg-slate-100/90 px-3.5 py-2 border-b border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-purple-600"></span>
                    <h3 className="text-[10.5px] font-black uppercase tracking-wider text-slate-800">
                      Secondary Section (6th – 10th)
                    </h3>
                  </div>
                  <span className="text-[10px] font-extrabold text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                    {secondaryClasses.length} Classes
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="daily-report-table w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-black uppercase text-slate-600 tracking-wider">
                        <th className="py-2 px-2.5 w-8 text-center">#</th>
                        <th className="py-2 px-2.5">Class</th>
                        <th className="py-2 px-2.5 text-center">Total</th>
                        <th className="py-2 px-2.5 text-center text-emerald-700">Present</th>
                        <th className="py-2 px-2.5 text-center text-rose-700">Absent</th>
                        <th className="py-2 px-2.5 text-center">Attd %</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {secondaryClasses.map((row, idx) => {
                        const pct = row.total > 0 ? Math.round((row.present / row.total) * 100) : 0;
                        return (
                          <tr key={row.classId} className={idx % 2 === 0 ? 'bg-white hover:bg-slate-50/60' : 'bg-slate-50/30 hover:bg-slate-50'}>
                            <td className="py-2 px-2.5 text-center font-bold text-slate-400 text-[10px]">
                              {idx + 1}
                            </td>
                            <td className="py-2 px-2.5 font-black text-slate-800 text-[11.5px]">
                              {row.className}
                            </td>
                            <td className="py-2 px-2.5 text-center font-bold text-slate-600 font-mono text-[11.5px]">
                              {row.total}
                            </td>
                            <td className="py-2 px-2.5 text-center font-black text-emerald-600 font-mono text-[11.5px]">
                              {row.present}
                            </td>
                            <td className="py-2 px-2.5 text-center font-black text-rose-600 font-mono text-[11.5px]">
                              {row.absent > 0 ? row.absent : '0'}
                            </td>
                            <td className="py-2 px-2.5 text-center">
                              <span
                                className={`px-2 py-0.5 rounded font-mono text-[10px] font-black ${
                                  pct >= 85
                                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                    : pct >= 70
                                    ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                                }`}
                              >
                                {pct}%
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    {/* Secondary Subtotal */}
                    <tfoot>
                      <tr className="bg-slate-100/90 font-black text-slate-900 border-t border-slate-200 text-xs">
                        <td colSpan={2} className="py-2 px-2.5 uppercase text-[10.5px] tracking-wider">
                          Section Subtotal:
                        </td>
                        <td className="py-2 px-2.5 text-center font-black text-slate-900 font-mono text-xs">
                          {secondarySubtotals.total}
                        </td>
                        <td className="py-2 px-2.5 text-center font-black text-emerald-700 font-mono text-xs">
                          {secondarySubtotals.present}
                        </td>
                        <td className="py-2 px-2.5 text-center font-black text-rose-700 font-mono text-xs">
                          {secondarySubtotals.absent}
                        </td>
                        <td className="py-2 px-2.5 text-center">
                          <span className="px-2 py-0.5 bg-slate-200 text-slate-900 rounded font-black text-[10.5px] font-mono">
                            {secondarySubtotals.pct}%
                          </span>
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

            </div>

            {/* ── 4. GRAND SUMMARY BAR ── */}
            <div className="daily-summary-strip bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 sm:py-3 mb-3 sm:mb-3.5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-[13px] font-black text-slate-900 leading-tight">
                    School Overall Attendance: <span className="font-mono text-emerald-700">{totalPresent} / {totalStudents} ({overallPercentage}%)</span>
                  </h4>
                  <p className="text-[10px] font-medium text-slate-500 leading-tight mt-0.5">
                    Total Classes Evaluated: {totalClasses} • Total Absentees: {totalAbsent}
                  </p>
                </div>
              </div>

              <div className="text-[10.5px] font-bold text-slate-600 bg-white px-3 py-1.5 rounded-lg border border-slate-200">
                Status: <strong className="text-emerald-700">Normal Working Session</strong>
              </div>
            </div>

            {/* ── 5. OFFICIAL SIGNATURES & VERIFICATION (Generous Room for Real Signing & Stamp) ── */}
            <div className="daily-signatures-box pt-6 pb-2.5 flex items-end justify-between gap-6 px-6 sm:px-12 border-t border-slate-200 mt-auto">
              <div className="text-center w-40">
                <div className="sig-space h-16 sm:h-20"></div>
                <div className="w-32 border-b border-slate-400 mb-1.5 border-dashed mx-auto"></div>
                <p className="text-[10.5px] font-black text-slate-700 uppercase tracking-wider leading-tight">Attendance Incharge</p>
                <p className="text-[8.5px] text-slate-400 mt-0.5 leading-tight">Verified & Signed</p>
              </div>

              <div className="text-center w-40">
                <div className="sig-space h-16 sm:h-20"></div>
                <div className="w-32 border-b border-slate-400 mb-1.5 border-dashed mx-auto"></div>
                <p className="text-[10.5px] font-black text-slate-700 uppercase tracking-wider leading-tight">Vice Principal</p>
                <p className="text-[8.5px] text-slate-400 mt-0.5 leading-tight">Reviewed</p>
              </div>

              <div className="text-center w-40">
                <div className="sig-space h-16 sm:h-20"></div>
                <div className="w-36 border-b-2 border-slate-900 mb-1.5 mx-auto"></div>
                <p className="text-[10.5px] font-black text-slate-900 uppercase tracking-wider leading-tight">Headmaster / Principal</p>
                <p className="text-[8.5px] text-slate-500 font-bold mt-0.5 leading-tight">Official School Seal</p>
              </div>
            </div>

            {/* Document Generation Stamp */}
            <div className="daily-system-footer mt-2 text-center text-[8.5px] font-medium text-slate-400 border-t border-slate-100 pt-2">
              Generated automatically by JY School ERP Portal • System Reference: JYS-ATT-{date.replace(/-/g, '')}
            </div>
          </>
        )}
      </div>

    </div>
  );
}
