import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import { FileDown, CalendarDays, ClipboardCheck, Wallet, Users, FileText } from 'lucide-react';
import toast from 'react-hot-toast';

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
    <div className="animate-fade-in">
      {/* Colorful Hero Header */}
      <div className="px-4 pt-4 pb-5 bg-gradient-to-br from-rose-500 via-pink-600 to-fuchsia-600 shadow-lg">
        <p className="text-white font-black text-lg">Reports Generator</p>
        <p className="text-white/70 text-xs mt-0.5">Download Excel & PDF reports</p>
      </div>

      <div className="p-3 space-y-3 max-w-2xl mx-auto">

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Attendance Report Card */}
        <div className="card p-4 flex flex-col justify-between space-y-3">
          <div className="space-y-2">
            <div className="p-2.5 rounded-xl bg-teal-50 text-teal-500 inline-block">
              <CalendarDays className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-gray-900 dark:text-white">Attendance Ledger</h4>
              <p className="text-xs text-gray-400">Class aggregate present, absent and late rates.</p>
            </div>
            <select
              value={attendanceClassId}
              onChange={(e) => setAttendanceClassId(e.target.value)}
              className="input text-xs"
            >
              <option value="">All Classes</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}-{c.section}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => downloadReport(`/api/reports/attendance?classId=${attendanceClassId}`, 'Attendance_Report.xlsx')}
              className="btn-secondary py-2.5 flex-1 flex items-center justify-center gap-2 text-xs text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/10 cursor-pointer border border-emerald-100/50"
            >
              <FileDown className="w-4 h-4" />
              <span>Excel</span>
            </button>
            <button
              onClick={() => downloadReport(`/api/reports/attendance/pdf?classId=${attendanceClassId}`, 'Attendance_Report.pdf', true)}
              className="btn-primary py-2.5 flex-1 flex items-center justify-center gap-2 text-xs bg-indigo-600 hover:bg-indigo-700 cursor-pointer"
            >
              <FileText className="w-4 h-4" />
              <span>PDF Report</span>
            </button>
          </div>
        </div>

        {/* Marks Report Card */}
        <div className="card p-6 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/20 text-amber-500 inline-block">
              <ClipboardCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-base text-gray-900 dark:text-white">Grades Sheet</h4>
              <p className="text-xs text-gray-400">Class assessment scores, total ranks, grades and statistics.</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <select
                value={marksClassId}
                onChange={(e) => setMarksClassId(e.target.value)}
                className="input text-xs"
              >
                <option value="">Select Class</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}-{c.section}
                  </option>
                ))}
              </select>
              <select
                value={marksExamId}
                onChange={(e) => setMarksExamId(e.target.value)}
                className="input text-xs"
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
          <div className="flex gap-2">
            <button
              disabled={!marksClassId || !marksExamId}
              onClick={() => downloadReport(`/api/reports/marks?classId=${marksClassId}&examId=${marksExamId}`, 'Marks_Report.xlsx')}
              className="btn-secondary py-2.5 flex-1 flex items-center justify-center gap-2 text-xs text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/10 cursor-pointer border border-emerald-100/50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FileDown className="w-4 h-4" />
              <span>Excel</span>
            </button>
            <button
              disabled={!marksClassId || !marksExamId}
              onClick={() => downloadReport(`/api/reports/marks/pdf?classId=${marksClassId}&examId=${marksExamId}`, 'Marks_Report.pdf', true)}
              className="btn-primary py-2.5 flex-1 flex items-center justify-center gap-2 text-xs bg-indigo-600 hover:bg-indigo-700 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FileText className="w-4 h-4" />
              <span>PDF Report</span>
            </button>
          </div>
        </div>

        {/* Fees Ledger Card */}
        <div className="card p-6 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/20 text-indigo-500 inline-block">
              <Wallet className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-base text-gray-900 dark:text-white">Fees Transaction History</h4>
              <p className="text-xs text-gray-400">Total revenue statements, payment modes, terms and due dates.</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => downloadReport('/api/reports/fees', 'Fee_Report.xlsx')}
              className="btn-secondary py-2.5 flex-1 flex items-center justify-center gap-2 text-xs text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/10 cursor-pointer border border-emerald-100/50"
            >
              <FileDown className="w-4 h-4" />
              <span>Excel</span>
            </button>
            <button
              onClick={() => downloadReport('/api/reports/fees/pdf', 'Fee_Report.pdf', true)}
              className="btn-primary py-2.5 flex-1 flex items-center justify-center gap-2 text-xs bg-indigo-600 hover:bg-indigo-700 cursor-pointer"
            >
              <FileText className="w-4 h-4" />
              <span>PDF Report</span>
            </button>
          </div>
        </div>

        {/* Students list Directory Card */}
        <div className="card p-6 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="p-3 rounded-2xl bg-teal-50 dark:bg-teal-950/20 text-teal-500 inline-block">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-base text-gray-900 dark:text-white">Students Roster</h4>
              <p className="text-xs text-gray-400">Comprehensive directory list of student profiles.</p>
            </div>
            <select
              value={studentClassId}
              onChange={(e) => setStudentClassId(e.target.value)}
              className="input text-xs"
            >
              <option value="">All Classes</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}-{c.section}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => downloadReport(`/api/reports/students?classId=${studentClassId}`, 'Student_Report.xlsx')}
              className="btn-secondary py-2.5 flex-1 flex items-center justify-center gap-2 text-xs text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/10 cursor-pointer border border-emerald-100/50"
            >
              <FileDown className="w-4 h-4" />
              <span>Excel</span>
            </button>
            <button
              onClick={() => downloadReport(`/api/reports/students/pdf?classId=${studentClassId}`, 'Student_Report.pdf', true)}
              className="btn-primary py-2.5 flex-1 flex items-center justify-center gap-2 text-xs bg-indigo-600 hover:bg-indigo-700 cursor-pointer"
            >
              <FileText className="w-4 h-4" />
              <span>PDF Report</span>
            </button>
          </div>
        </div>

        {/* JEE Mains Result Card Generator */}
        <div className="card p-6 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/20 text-rose-500 inline-block">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-base text-gray-900 dark:text-white">JEE Mains Result Generator</h4>
              <p className="text-xs text-gray-400">Generate, view, and print tabular JEE Mains result cards.</p>
            </div>
          </div>
          <div className="flex gap-2">
            <a
              href="/JEE%20Mains%20Result%20card%20with%20Reports.html"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary py-2.5 flex-1 flex items-center justify-center gap-2 text-xs bg-rose-600 hover:bg-rose-700 text-center font-semibold rounded-xl"
            >
              <FileText className="w-4 h-4" />
              <span>Open Generator</span>
            </a>
          </div>
        </div>

        {/* Navodaya Result Card Generator */}
        <div className="card p-6 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500 inline-block">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-base text-gray-900 dark:text-white">Navodaya Result Generator</h4>
              <p className="text-xs text-gray-400">Generate, view, and print Navodaya school entrance result cards.</p>
            </div>
          </div>
          <div className="flex gap-2">
            <a
              href="/Final%20Navodaya%20Result%20Card.html"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary py-2.5 flex-1 flex items-center justify-center gap-2 text-xs bg-emerald-600 hover:bg-emerald-700 text-center font-semibold rounded-xl"
            >
              <FileText className="w-4 h-4" />
              <span>Open Generator</span>
            </a>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
};
export default ReportsPage;

