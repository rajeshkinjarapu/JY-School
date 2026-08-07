import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import { FileDown, CalendarDays, ClipboardCheck, Wallet, Users, FileText, BarChart3, TrendingUp, UserCheck, BookOpen } from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '../../components/UI/PageHeader';

export const ReportsPage: React.FC = () => {
  const [classes, setClasses] = useState<any[]>([]);
  const [exams, setExams] = useState<any[]>([]);

  // States for report selections
  const [attendanceClassId, setAttendanceClassId] = useState('');
  const [marksClassId, setMarksClassId] = useState('');
  const [marksExamId, setMarksExamId] = useState('');
  const [studentClassId, setStudentClassId] = useState('');

  const fetchFilters = async () => {
    try {
      const [classRes, examRes]: any = await Promise.all([
        api.get('/api/classes'),
        api.get('/api/exams'),
      ]);
      setClasses(classRes.data || classRes || []);
      setExams(examRes.data || examRes || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchFilters();
  }, []);

  const downloadReport = async (endpoint: string, filename: string, isPdf: boolean = false) => {
    const importToast = toast.loading(`Generating and downloading ${isPdf ? 'PDF' : 'Excel'} report...`);
    try {
      const response: any = await api.get(endpoint, {
        responseType: 'blob',
      });
      const mimeType = isPdf ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      const url = window.URL.createObjectURL(new Blob([response.data || response], { type: mimeType }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      toast.success(`${isPdf ? 'PDF' : 'Excel'} report downloaded successfully!`, { id: importToast });
    } catch (e: any) {
      toast.error('Failed to download report. Please check if data exists.', { id: importToast });
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50/50 min-h-screen animate-fade" style={{ minHeight: 'calc(100vh - 64px)' }}>
      <PageHeader 
        title="Reports Generator"
        icon={<BarChart3 className="w-6 h-6" />}
      />

      <div className="flex-1 overflow-auto p-4 sm:p-6 md:p-8">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Attendance Report Card */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 flex flex-col justify-between space-y-4 hover:shadow-md transition-all">
              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-teal-50 dark:bg-teal-950/20 text-teal-600 dark:text-teal-400 inline-block">
                  <CalendarDays className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-slate-800 dark:text-white uppercase tracking-wider">Attendance Ledger</h4>
                  <p className="text-xs text-slate-400 mt-1">Class aggregate present, absent, and late rates report.</p>
                </div>
                <select
                  value={attendanceClassId}
                  onChange={(e) => setAttendanceClassId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-primary-500/20"
                >
                  <option value="">All Classes</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} - {c.section}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 pt-2 border-t border-slate-50 dark:border-gray-800">
                <button
                  onClick={() => downloadReport(`/api/reports/attendance?classId=${attendanceClassId}`, 'Attendance_Report.xlsx')}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-emerald-600 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <FileDown className="w-3.5 h-3.5" />
                  <span>Excel</span>
                </button>
                <button
                  onClick={() => downloadReport(`/api/reports/attendance/pdf?classId=${attendanceClassId}`, 'Attendance_Report.pdf', true)}
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md shadow-indigo-600/10"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>PDF Report</span>
                </button>
              </div>
            </div>

            {/* Marks Report Card */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 flex flex-col justify-between space-y-4 hover:shadow-md transition-all">
              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 inline-block">
                  <ClipboardCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-slate-800 dark:text-white uppercase tracking-wider">Grades Sheet</h4>
                  <p className="text-xs text-slate-400 mt-1">Class assessment scores, total ranks, grades and statistics.</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <select
                    value={marksClassId}
                    onChange={(e) => setMarksClassId(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-primary-500/20"
                  >
                    <option value="">Select Class</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} - {c.section}
                      </option>
                    ))}
                  </select>
                  <select
                    value={marksExamId}
                    onChange={(e) => setMarksExamId(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-primary-500/20"
                  >
                    <option value="">Select Exam</option>
                    {exams.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-2 border-t border-slate-50 dark:border-gray-800">
                <button
                  disabled={!marksClassId || !marksExamId}
                  onClick={() => downloadReport(`/api/reports/marks?classId=${marksClassId}&examId=${marksExamId}`, 'Marks_Report.xlsx')}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-emerald-600 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FileDown className="w-3.5 h-3.5" />
                  <span>Excel</span>
                </button>
                <button
                  disabled={!marksClassId || !marksExamId}
                  onClick={() => downloadReport(`/api/reports/marks/pdf?classId=${marksClassId}&examId=${marksExamId}`, 'Marks_Report.pdf', true)}
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md shadow-indigo-600/10 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>PDF Report</span>
                </button>
              </div>
            </div>

            {/* Fees Ledger Card */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 flex flex-col justify-between space-y-4 hover:shadow-md transition-all">
              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 inline-block">
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-slate-800 dark:text-white uppercase tracking-wider">Fees Transaction History</h4>
                  <p className="text-xs text-slate-400 mt-1">Total revenue statements, payment modes, terms, and due dates.</p>
                </div>
              </div>
              <div className="flex gap-3 pt-2 border-t border-slate-50 dark:border-gray-800">
                <button
                  onClick={() => downloadReport('/api/reports/fees', 'Fee_Report.xlsx')}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-emerald-600 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <FileDown className="w-3.5 h-3.5" />
                  <span>Excel</span>
                </button>
                <button
                  onClick={() => downloadReport('/api/reports/fees/pdf', 'Fee_Report.pdf', true)}
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md shadow-indigo-600/10"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>PDF Report</span>
                </button>
              </div>
            </div>

            {/* Students list Directory Card */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 flex flex-col justify-between space-y-4 hover:shadow-md transition-all">
              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-teal-50 dark:bg-teal-950/20 text-teal-600 dark:text-teal-400 inline-block">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-slate-800 dark:text-white uppercase tracking-wider">Students Roster</h4>
                  <p className="text-xs text-slate-400 mt-1">Comprehensive directory list of student profiles.</p>
                </div>
                <select
                  value={studentClassId}
                  onChange={(e) => setStudentClassId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-primary-500/20"
                >
                  <option value="">All Classes</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} - {c.section}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 pt-2 border-t border-slate-50 dark:border-gray-800">
                <button
                  onClick={() => downloadReport(`/api/reports/students?classId=${studentClassId}`, 'Student_Report.xlsx')}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-emerald-600 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <FileDown className="w-3.5 h-3.5" />
                  <span>Excel</span>
                </button>
                <button
                  onClick={() => downloadReport(`/api/reports/students/pdf?classId=${studentClassId}`, 'Student_Report.pdf', true)}
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md shadow-indigo-600/10"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>PDF Report</span>
                </button>
              </div>
            </div>

            {/* ── SUGGESTED PROFESSIONAL REPORTS (Coming Soon) ── */}
            {/* Financial Revenue forecasting */}
            <div className="bg-slate-50/50 dark:bg-gray-900/50 rounded-2xl border border-dashed border-gray-200 dark:border-gray-800 p-5 flex flex-col justify-between space-y-4 opacity-75 relative overflow-hidden group">
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <div className="p-3 rounded-xl bg-violet-50 text-violet-600 inline-block">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <span className="text-[9px] font-black tracking-wider uppercase bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full">Suggested</span>
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-slate-700 dark:text-white uppercase tracking-wider">Fee Collection Forecasting</h4>
                  <p className="text-xs text-slate-400 mt-1">Cash flow analytics, collections vs outstanding dues, and monthly projections.</p>
                </div>
              </div>
              <div className="pt-2 border-t border-dashed border-gray-200 dark:border-gray-800 text-center">
                <span className="text-[10px] font-bold text-violet-500 uppercase tracking-widest">Coming Soon</span>
              </div>
            </div>

            {/* Staff attendance report */}
            <div className="bg-slate-50/50 dark:bg-gray-900/50 rounded-2xl border border-dashed border-gray-200 dark:border-gray-800 p-5 flex flex-col justify-between space-y-4 opacity-75 relative overflow-hidden group">
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <div className="p-3 rounded-xl bg-orange-50 text-orange-600 inline-block">
                    <UserCheck className="w-5 h-5" />
                  </div>
                  <span className="text-[9px] font-black tracking-wider uppercase bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">Suggested</span>
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-slate-700 dark:text-white uppercase tracking-wider">Staff Attendance Ledger</h4>
                  <p className="text-xs text-slate-400 mt-1">Monthly staff attendance ledger with aggregate work days, leaves, and late records.</p>
                </div>
              </div>
              <div className="pt-2 border-t border-dashed border-gray-200 dark:border-gray-800 text-center">
                <span className="text-[10px] font-bold text-orange-500 uppercase tracking-widest">Coming Soon</span>
              </div>
            </div>

            {/* Class performance report */}
            <div className="bg-slate-50/50 dark:bg-gray-900/50 rounded-2xl border border-dashed border-gray-200 dark:border-gray-800 p-5 flex flex-col justify-between space-y-4 opacity-75 relative overflow-hidden group">
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <div className="p-3 rounded-xl bg-rose-50 text-rose-600 inline-block">
                    <BarChart3 className="w-5 h-5" />
                  </div>
                  <span className="text-[9px] font-black tracking-wider uppercase bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full">Suggested</span>
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-slate-700 dark:text-white uppercase tracking-wider">Comparative Class Performance</h4>
                  <p className="text-xs text-slate-400 mt-1">Detailed comparative graph and report to analyze subject metrics across classes.</p>
                </div>
              </div>
              <div className="pt-2 border-t border-dashed border-gray-200 dark:border-gray-800 text-center">
                <span className="text-[10px] font-bold text-rose-500 uppercase tracking-widest">Coming Soon</span>
              </div>
            </div>

            {/* Homework activity report */}
            <div className="bg-slate-50/50 dark:bg-gray-900/50 rounded-2xl border border-dashed border-gray-200 dark:border-gray-800 p-5 flex flex-col justify-between space-y-4 opacity-75 relative overflow-hidden group">
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600 inline-block">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <span className="text-[9px] font-black tracking-wider uppercase bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">Suggested</span>
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-slate-700 dark:text-white uppercase tracking-wider">Homework & Engagement Ledger</h4>
                  <p className="text-xs text-slate-400 mt-1">Reports tracking homework completion rates, deadlines met, and active student engagement.</p>
                </div>
              </div>
              <div className="pt-2 border-t border-dashed border-gray-200 dark:border-gray-800 text-center">
                <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Coming Soon</span>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};
export default ReportsPage;

