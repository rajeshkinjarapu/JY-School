import React, { useEffect, useState, useMemo } from 'react';
import api from '../../api/axios';
import { LoadingSpinner } from '../../components/UI/LoadingSpinner';
import {
  FileDown, CalendarDays, BarChart3, Users, Percent, CheckCircle2,
  AlertTriangle, Search, Download, ListFilter
} from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '../../components/UI/PageHeader';
import { AttendanceNavTabs } from './AttendanceNavTabs';

const extractArray = <T = any>(res: any): T[] => {
  const payload = res?.data ?? res;
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

export const AttendanceReportPage: React.FC = () => {
  const [classes, setClasses] = useState<any[]>([]);
  const [classId, setClassId] = useState('');
  const [report, setReport] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [rateFilter, setRateFilter] = useState<'ALL' | 'HIGH' | 'LOW'>('ALL');

  const fetchClasses = async () => {
    try {
      const res: any = await api.get('/api/classes', { params: { limit: 200 } });
      const list = extractArray(res);
      setClasses(list);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  const loadReport = async () => {
    if (!classId) return;
    setLoading(true);
    try {
      const res: any = await api.get('/api/attendance/report', {
        params: { classId },
      });
      const normalized = extractArray(res).map((item: any) => {
        const present = Number(item.present ?? 0);
        const absent = Number(item.absent ?? 0);
        const totalDays = Number(item.total ?? item.totalDays ?? present + absent);
        const rawRate = item.percentage ?? item.rate;
        const rate =
          rawRate !== undefined && rawRate !== null
            ? Math.round(Number(rawRate))
            : totalDays > 0
              ? Math.round((present / totalDays) * 100)
              : 0;
        return {
          ...item,
          studentName: item.name || item.studentName || '-',
          rollNo: item.rollNo || '-',
          totalDays,
          present,
          absent,
          rate,
        };
      });
      setReport(normalized);
    } catch (e) {
      toast.error('Failed to load attendance analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, [classId]);

  const selectedClassObj = useMemo(
    () => classes.find((c) => c.id === classId),
    [classes, classId]
  );

  const stats = useMemo(() => {
    const totalStudents = report.length;
    const avgRate =
      totalStudents > 0
        ? Math.round(report.reduce((sum, r) => sum + (Number(r.rate) || 0), 0) / totalStudents)
        : 0;
    const goodCount = report.filter((r) => (Number(r.rate) || 0) >= 75).length;
    const lowCount = report.filter((r) => (Number(r.rate) || 0) < 75).length;
    return { totalStudents, avgRate, goodCount, lowCount };
  }, [report]);

  const filteredReport = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return report.filter((item) => {
      const nameMatch = (item.studentName || '').toLowerCase().includes(q);
      const rollMatch = (item.rollNo || '').toLowerCase().includes(q);
      if (q && !nameMatch && !rollMatch) return false;

      const r = Number(item.rate) || 0;
      if (rateFilter === 'HIGH') return r >= 75;
      if (rateFilter === 'LOW') return r < 75;
      return true;
    });
  }, [report, searchQuery, rateFilter]);

  const handleExportExcel = async () => {
    if (!classId) return;
    const importToast = toast.loading('Generating Excel sheet...');
    try {
      const response: any = await api.get(`/api/reports/attendance?classId=${classId}`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data || response]));
      const link = document.createElement('a');
      link.href = url;
      const clsName = selectedClassObj ? `${selectedClassObj.name}_${selectedClassObj.section}` : 'Class';
      link.setAttribute('download', `Attendance_Report_${clsName}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      toast.success('Excel report downloaded!', { id: importToast });
    } catch (e: any) {
      toast.error('Failed to export attendance registry.', { id: importToast });
    }
  };

  const handleExportPdf = async () => {
    if (!classId || filteredReport.length === 0) return;
    setExportingPdf(true);
    const toastId = toast.loading('Generating Class Attendance Analytics PDF...');
    try {
      const { default: jsPDF } = await import('jspdf');
      const autoTableModule: any = await import('jspdf-autotable');
      const autoTable = autoTableModule.default || autoTableModule;

      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageWidth = doc.internal.pageSize.getWidth();
      const clsLabel = selectedClassObj ? `${selectedClassObj.name} - ${selectedClassObj.section}` : 'Selected Class';

      doc.setFontSize(15);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text('SRI VENKATESWARA JY HIGH SCHOOL', pageWidth / 2, 13, { align: 'center' });

      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text('Opp. Hero Showroom, SVL Paradise Campus, Narasannapeta, Srikakulam Dist.', pageWidth / 2, 18, { align: 'center' });

      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(91, 33, 182);
      doc.text(`CLASS ATTENDANCE ANALYTICS REPORT • ${clsLabel.toUpperCase()}`, pageWidth / 2, 24.5, { align: 'center' });

      doc.setFontSize(8.5);
      doc.setTextColor(51, 65, 85);
      doc.text(
        `Students: ${stats.totalStudents}   |   Class Avg Rate: ${stats.avgRate}%   |   >=75%: ${stats.goodCount}   |   <75%: ${stats.lowCount}`,
        pageWidth / 2,
        30,
        { align: 'center' }
      );

      autoTable(doc, {
        startY: 34,
        head: [['#', 'Roll No', 'Student Name', 'Total Days', 'Present', 'Absent', 'Rate %']],
        body: filteredReport.map((item, idx) => [
          String(idx + 1),
          item.rollNo || '-',
          (item.studentName || '-').toUpperCase(),
          String(item.totalDays ?? 0),
          String(item.present ?? 0),
          String(item.absent ?? 0),
          `${item.rate ?? 0}%`,
        ]),
        theme: 'grid',
        margin: { left: 12, right: 12, bottom: 14 },
        headStyles: {
          fillColor: [91, 33, 182],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 8.5,
          halign: 'center',
        },
        styles: {
          fontSize: 8.5,
          textColor: [30, 41, 59],
          cellPadding: 2.3,
        },
        alternateRowStyles: {
          fillColor: [250, 249, 255],
        },
        columnStyles: {
          0: { cellWidth: 11, halign: 'center', fontStyle: 'bold' },
          1: { cellWidth: 28, halign: 'center', fontStyle: 'bold', textColor: [91, 33, 182] },
          2: { cellWidth: 67, fontStyle: 'bold' },
          3: { cellWidth: 22, halign: 'center' },
          4: { cellWidth: 20, halign: 'center', fontStyle: 'bold', textColor: [5, 150, 105] },
          5: { cellWidth: 20, halign: 'center', fontStyle: 'bold', textColor: [220, 38, 38] },
          6: { cellWidth: 18, halign: 'center', fontStyle: 'bold' },
        },
      });

      doc.save(`JY_School_Attendance_Analytics_${clsLabel.replace(/\s+/g, '_')}.pdf`);
      toast.success('PDF report downloaded!', { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate PDF report', { id: toastId });
    } finally {
      setExportingPdf(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#F4F7FC] text-slate-800 overflow-hidden">
      <PageHeader
        title="Attendance Analytics"
        icon={<BarChart3 className="w-5 h-5 text-white" />}
        action={
          classId ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleExportPdf}
                disabled={exportingPdf || filteredReport.length === 0}
                className="px-3.5 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white border border-white/25 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{exportingPdf ? 'Generating...' : 'PDF'}</span>
              </button>
              <button
                type="button"
                onClick={handleExportExcel}
                className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-indigo-50 text-[#1E1B4B] text-xs font-extrabold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
              >
                <FileDown className="w-3.5 h-3.5 text-emerald-600" />
                <span>Export Excel</span>
              </button>
            </div>
          ) : undefined
        }
      />

      <div className="flex-1 overflow-auto p-4 sm:p-6">
        <div className="w-full max-w-7xl mx-auto space-y-5 pb-10">

          {/* Navigation + Class Selector Card */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <AttendanceNavTabs />
          </div>

          <div className="bg-white border border-indigo-100/80 rounded-[20px] p-4 sm:p-5 shadow-[0_6px_22px_-6px_rgba(91,33,182,0.08)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#EFEAFE] border border-[#DDD6FE] text-[#5B21B6] flex items-center justify-center shrink-0">
                <ListFilter className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-black text-[#1E1B4B]">Class-wise Attendance Analytics</h2>
                <p className="text-xs font-medium text-slate-500">Select a class to inspect overall attendance percentages and export reports</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <select
                value={classId}
                onChange={(e) => setClassId(e.target.value)}
                className="w-full sm:w-64 bg-[#F8FAFF] border border-indigo-100 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-bold text-slate-800 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 cursor-pointer"
              >
                <option value="">Select Class &amp; Section</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} - {c.section}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {classId ? (
            loading ? (
              <div className="flex flex-col justify-center items-center py-20 bg-white rounded-[22px] border border-indigo-100/80 shadow-xs">
                <LoadingSpinner size="lg" />
                <p className="text-xs font-bold text-slate-400 mt-3 uppercase tracking-wider">Calculating attendance analytics...</p>
              </div>
            ) : (
              <>
                {/* 4 Dashboard Pastel KPI Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
                  <div className="relative overflow-hidden rounded-[20px] px-4 py-3.5 border bg-gradient-to-br from-[#EAF2FF] to-[#CBE0FF] border-[#B6D2FF] shadow-[0_6px_18px_-6px_rgba(15,23,42,0.10)]">
                    <div className="absolute inset-x-0 top-0 h-[45%] bg-gradient-to-b from-white/55 to-transparent pointer-events-none rounded-t-[20px]" />
                    <div className="relative z-10 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#2563EB] to-[#1D4ED8] flex items-center justify-center text-white shadow-md shrink-0">
                        <Users className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-600">Total Students</p>
                        <p className="text-2xl font-black text-slate-900 leading-tight">{stats.totalStudents}</p>
                      </div>
                    </div>
                  </div>

                  <div className="relative overflow-hidden rounded-[20px] px-4 py-3.5 border bg-gradient-to-br from-[#F2EDFF] to-[#DDD2FF] border-[#CEC0FF] shadow-[0_6px_18px_-6px_rgba(15,23,42,0.10)]">
                    <div className="absolute inset-x-0 top-0 h-[45%] bg-gradient-to-b from-white/55 to-transparent pointer-events-none rounded-t-[20px]" />
                    <div className="relative z-10 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#8B5CF6] to-[#6D28D9] flex items-center justify-center text-white shadow-md shrink-0">
                        <Percent className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-600">Class Avg Rate</p>
                        <p className="text-2xl font-black text-[#4C1D95] leading-tight">{stats.avgRate}%</p>
                      </div>
                    </div>
                  </div>

                  <div className="relative overflow-hidden rounded-[20px] px-4 py-3.5 border bg-gradient-to-br from-[#E5FAEF] to-[#C2F2D9] border-[#ACEAD0] shadow-[0_6px_18px_-6px_rgba(15,23,42,0.10)]">
                    <div className="absolute inset-x-0 top-0 h-[45%] bg-gradient-to-b from-white/55 to-transparent pointer-events-none rounded-t-[20px]" />
                    <div className="relative z-10 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#10B981] to-[#059669] flex items-center justify-center text-white shadow-md shrink-0">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-600">&ge; 75% Attendance</p>
                        <p className="text-2xl font-black text-[#065F46] leading-tight">{stats.goodCount}</p>
                      </div>
                    </div>
                  </div>

                  <div className="relative overflow-hidden rounded-[20px] px-4 py-3.5 border bg-gradient-to-br from-[#FFEFEF] to-[#FFD2D7] border-[#FFC0C7] shadow-[0_6px_18px_-6px_rgba(15,23,42,0.10)]">
                    <div className="absolute inset-x-0 top-0 h-[45%] bg-gradient-to-b from-white/55 to-transparent pointer-events-none rounded-t-[20px]" />
                    <div className="relative z-10 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#EF4444] to-[#DC2626] flex items-center justify-center text-white shadow-md shrink-0">
                        <AlertTriangle className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-600">&lt; 75% Attention</p>
                        <p className="text-2xl font-black text-[#991B1B] leading-tight">{stats.lowCount}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Analytics Table Card */}
                <div className="bg-white border border-[#DDD7F3] rounded-[20px] overflow-hidden shadow-[0_12px_32px_-6px_rgba(91,33,182,0.10)]">
                  <div className="px-4 sm:px-5 py-3.5 border-b border-indigo-100/80 bg-[#FAF9FF] flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="relative w-full sm:w-64">
                        <Search className="w-4 h-4 text-indigo-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          placeholder="Search student or Roll No..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full bg-white border border-indigo-100 rounded-xl pl-9 pr-3 py-2 text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                        />
                      </div>

                      <div className="flex items-center gap-1.5">
                        {[
                          { key: 'ALL', label: `All (${stats.totalStudents})`, active: 'bg-[#5B21B6] text-white', idle: 'bg-white text-slate-600 border-indigo-100' },
                          { key: 'HIGH', label: `>= 75% (${stats.goodCount})`, active: 'bg-emerald-600 text-white', idle: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
                          { key: 'LOW', label: `< 75% (${stats.lowCount})`, active: 'bg-rose-600 text-white', idle: 'bg-rose-50 text-rose-700 border-rose-200' },
                        ].map((chip) => (
                          <button
                            key={chip.key}
                            type="button"
                            onClick={() => setRateFilter(chip.key as any)}
                            className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                              rateFilter === chip.key ? `${chip.active} border-transparent shadow-xs` : chip.idle
                            }`}
                          >
                            {chip.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleExportPdf}
                        disabled={exportingPdf || filteredReport.length === 0}
                        className="px-3 py-1.5 rounded-xl bg-white hover:bg-indigo-50 text-[#5B21B6] border border-indigo-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>PDF</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleExportExcel}
                        className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#5B21B6] to-[#7C3AED] hover:opacity-95 text-white text-xs font-extrabold flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <FileDown className="w-3.5 h-3.5" />
                        <span>Export Excel</span>
                      </button>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs student-grid-table">
                      <thead>
                        <tr className="bg-gradient-to-r from-[#7D3CEF] via-[#6D38EA] to-[#5B21B6] !text-white font-extrabold uppercase text-[11px] tracking-wider">
                          <th className="py-3.5 px-3 w-14 text-center border-r border-white/20 !text-white">#</th>
                          <th className="py-3.5 px-4 text-left border-r border-white/20 !text-white">Roll No</th>
                          <th className="py-3.5 px-5 text-left border-r border-white/20 !text-white">Student Name</th>
                          <th className="py-3.5 px-4 text-center border-r border-white/20 !text-white">Total Days</th>
                          <th className="py-3.5 px-4 text-center border-r border-white/20 !text-white">Present</th>
                          <th className="py-3.5 px-4 text-center border-r border-white/20 !text-white">Absent</th>
                          <th className="py-3.5 px-5 text-right !text-white">Attendance Rate</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredReport.map((item, idx) => {
                          const rate = Number(item.rate) || 0;
                          const rowBorderBottom = idx === filteredReport.length - 1 ? '' : 'border-b border-[#EAE7F6]';
                          return (
                            <tr key={idx} className="even:bg-[#FAF9FF] hover:bg-[#F3EFFE]/60 transition-colors bg-white">
                              <td className={`py-3 px-3 text-center font-bold text-[#1E1B4B] border-r border-[#EAE7F6] ${rowBorderBottom}`}>
                                {idx + 1}
                              </td>
                              <td className={`py-3 px-4 border-r border-[#EAE7F6] whitespace-nowrap ${rowBorderBottom}`}>
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-extrabold text-[#5B21B6] bg-[#EFEAFE] border border-[#DDD6FE]/80 font-mono">
                                  {item.rollNo || '—'}
                                </span>
                              </td>
                              <td className={`py-3 px-5 font-extrabold text-[#1E1B4B] uppercase border-r border-[#EAE7F6] ${rowBorderBottom}`}>
                                {item.studentName}
                              </td>
                              <td className={`py-3 px-4 text-center font-bold text-slate-700 font-mono border-r border-[#EAE7F6] ${rowBorderBottom}`}>
                                {item.totalDays}
                              </td>
                              <td className={`py-3 px-4 text-center font-black text-emerald-600 font-mono border-r border-[#EAE7F6] ${rowBorderBottom}`}>
                                {item.present}
                              </td>
                              <td className={`py-3 px-4 text-center font-black text-rose-600 font-mono border-r border-[#EAE7F6] ${rowBorderBottom}`}>
                                {item.absent}
                              </td>
                              <td className={`py-3 px-5 ${rowBorderBottom}`}>
                                <div className="flex items-center justify-end gap-3">
                                  <div className="hidden sm:block w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                      className={`h-full rounded-full ${
                                        rate >= 85 ? 'bg-emerald-500' : rate >= 75 ? 'bg-amber-500' : 'bg-rose-500'
                                      }`}
                                      style={{ width: `${Math.min(100, rate)}%` }}
                                    />
                                  </div>
                                  <span
                                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-black font-mono border ${
                                      rate >= 75
                                        ? 'bg-[#DCFCE7] text-[#15803D] border-[#BBF7D0]'
                                        : 'bg-rose-50 text-rose-700 border-rose-200'
                                    }`}
                                  >
                                    {rate}%
                                  </span>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                        {filteredReport.length === 0 && (
                          <tr>
                            <td colSpan={7} className="py-12 text-center text-slate-400 font-bold">
                              No attendance analytics records found for this selection.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )
          ) : (
            <div className="bg-white border border-[#DDD7F3] rounded-[22px] p-12 sm:p-16 text-center shadow-[0_12px_32px_-6px_rgba(91,33,182,0.08)] flex flex-col items-center justify-center min-h-[340px]">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#F2EDFF] to-[#DDD2FF] border border-[#CEC0FF] flex items-center justify-center mb-5 shadow-sm">
                <CalendarDays className="w-8 h-8 text-[#5B21B6]" />
              </div>
              <h3 className="text-xl font-black text-[#1E1B4B] mb-2">Select a Class to View Analytics</h3>
              <p className="font-medium text-slate-500 text-xs sm:text-sm max-w-md">
                Choose any class &amp; section from the dropdown above to inspect student-wise attendance rates, low-attendance alerts, and download PDF or Excel reports.
              </p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default AttendanceReportPage;
