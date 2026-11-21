import React from 'react';
import { STUDENT_CBCS_GRADE_MEMO } from '../data/universityMockData';
import {
  Printer, Download, ShieldCheck, CheckCircle2,
  Award, BookOpen, DollarSign, GraduationCap, Building2
} from 'lucide-react';
import toast from 'react-hot-toast';

export const StudentGradeCard: React.FC = () => {
  const data = STUDENT_CBCS_GRADE_MEMO;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center text-indigo-600">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
              Autonomous Degree CBCS Semester Grade Card
            </h3>
            <p className="text-xs text-slate-500">Choice Based Credit System (CBCS) • Affiliated & Autonomous</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-500/20 flex items-center gap-2 transition"
          >
            <Printer className="w-4 h-4" /> Print / Save Memo (PDF)
          </button>
        </div>
      </div>

      {/* Official University Grade Memo Sheet */}
      <div
        id="grade-card-print"
        className="rounded-2xl p-6 md:p-8 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 shadow-lg text-slate-800 dark:text-slate-200"
      >
        {/* Memo Header */}
        <div className="text-center border-b-2 border-slate-900 dark:border-slate-100 pb-5">
          <div className="text-xs font-black uppercase tracking-widest text-indigo-600">
            AUTONOMOUS & NAAC 'A+' ACCREDITED INSTITUTION
          </div>
          <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight mt-1">
            SRI VENKATESWARA DEGREE COLLEGE & DEEMED UNIVERSITY
          </h1>
          <div className="text-xs text-slate-600 dark:text-slate-400 font-medium">
            (Affiliated to Andhra University / Approved by UGC New Delhi)
          </div>
          <div className="inline-block mt-3 px-4 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700">
            STATEMENT OF MARKS & GRADES • {data.semester}
          </div>
        </div>

        {/* Student Meta Data Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4 text-xs border-b border-slate-200 dark:border-slate-800">
          <div>
            <span className="text-slate-400 font-bold uppercase block text-[10px]">Student Name</span>
            <span className="font-extrabold text-slate-900 dark:text-white text-sm">{data.studentName}</span>
          </div>
          <div>
            <span className="text-slate-400 font-bold uppercase block text-[10px]">University PIN</span>
            <span className="font-mono font-extrabold text-indigo-600 text-sm">{data.pinNo}</span>
          </div>
          <div>
            <span className="text-slate-400 font-bold uppercase block text-[10px]">Degree & Program</span>
            <span className="font-bold text-slate-900 dark:text-white">{data.course}</span>
          </div>
          <div>
            <span className="text-slate-400 font-bold uppercase block text-[10px]">Examination Session</span>
            <span className="font-bold text-slate-900 dark:text-white">{data.monthYear}</span>
          </div>
        </div>

        {/* Marks & Credits Table */}
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-black uppercase text-[11px] border-b-2 border-slate-300 dark:border-slate-700">
                <th className="py-2.5 px-3">Sub Code</th>
                <th className="py-2.5 px-3">Course / Paper Title</th>
                <th className="py-2.5 px-2 text-center">Credits</th>
                <th className="py-2.5 px-2 text-center">Int (25)</th>
                <th className="py-2.5 px-2 text-center">Ext (75)</th>
                <th className="py-2.5 px-2 text-center">Total (100)</th>
                <th className="py-2.5 px-2 text-center">Grade Point</th>
                <th className="py-2.5 px-3 text-center">Grade Letter</th>
                <th className="py-2.5 px-2 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-semibold">
              {data.subjects.map((sub) => (
                <tr key={sub.code} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                  <td className="py-2.5 px-3 font-mono font-bold text-slate-500">{sub.code}</td>
                  <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">{sub.name}</td>
                  <td className="py-2.5 px-2 text-center font-bold text-indigo-600">{sub.credits}</td>
                  <td className="py-2.5 px-2 text-center">{sub.internal}</td>
                  <td className="py-2.5 px-2 text-center">{sub.external}</td>
                  <td className="py-2.5 px-2 text-center font-bold text-slate-900 dark:text-white">{sub.total}</td>
                  <td className="py-2.5 px-2 text-center font-bold text-emerald-600">{sub.gradePoint}</td>
                  <td className="py-2.5 px-3 text-center font-bold">{sub.letterGrade}</td>
                  <td className="py-2.5 px-2 text-center font-black text-emerald-600">PASS</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* GPA & Final Result Summary */}
        <div className="mt-6 rounded-xl bg-slate-50 dark:bg-slate-800/60 p-4 border border-slate-200 dark:border-slate-800 grid grid-cols-2 md:grid-cols-5 gap-3 text-center">
          <div>
            <div className="text-[10px] font-bold uppercase text-slate-400">Total Credits</div>
            <div className="text-base font-black text-slate-900 dark:text-white">{data.totalCredits}</div>
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase text-indigo-600">Semester SGPA</div>
            <div className="text-xl font-black text-indigo-600">{data.sgpa} / 10.0</div>
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase text-emerald-600">Cumulative CGPA</div>
            <div className="text-xl font-black text-emerald-600">{data.cgpa} / 10.0</div>
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase text-slate-400">Backlogs</div>
            <div className="text-base font-black text-emerald-600">{data.backlogs} (Nil)</div>
          </div>
          <div className="col-span-2 md:col-span-1">
            <div className="text-[10px] font-bold uppercase text-slate-400">Final Result</div>
            <div className="text-xs font-black text-emerald-700 bg-emerald-100 dark:bg-emerald-950 px-2 py-1 rounded">
              DISTINCTION
            </div>
          </div>
        </div>

        {/* Memo Footer Signatures */}
        <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800 flex items-end justify-between text-center text-[10px] text-slate-400 font-bold uppercase">
          <div>
            <div className="w-24 h-0.5 bg-slate-300 dark:bg-slate-700 mb-1 mx-auto" />
            Prepared By
          </div>
          <div>
            <div className="w-28 h-0.5 bg-slate-300 dark:bg-slate-700 mb-1 mx-auto" />
            Verified By (HOD)
          </div>
          <div>
            <div className="w-32 h-0.5 bg-slate-300 dark:bg-slate-700 mb-1 mx-auto" />
            Controller of Examinations
          </div>
          <div>
            <div className="w-28 h-0.5 bg-slate-300 dark:bg-slate-700 mb-1 mx-auto" />
            Principal / Dean
          </div>
        </div>
      </div>

      {/* JVD / Government Reimbursement Tracker Card */}
      <div className="rounded-2xl p-6 bg-gradient-to-br from-indigo-50 to-emerald-50 dark:from-slate-900 dark:to-slate-900 border border-indigo-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-lg bg-emerald-500 text-white flex items-center justify-center font-bold">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-extrabold text-slate-900 dark:text-white text-sm">
              State Government Scholarship & JVD Fee Reimbursement Telemetry
            </h4>
            <p className="text-xs text-slate-500">Government of Andhra Pradesh • Jagananna Vidya Deevena (RTF Portal)</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
            <span className="text-slate-400 font-bold text-[10px] uppercase block">Scheme Name</span>
            <span className="font-extrabold text-slate-800 dark:text-slate-200">{data.jvdStatus.scheme}</span>
          </div>
          <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
            <span className="text-slate-400 font-bold text-[10px] uppercase block">Application Ref</span>
            <span className="font-mono font-bold text-indigo-600">{data.jvdStatus.applicationNo}</span>
          </div>
          <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
            <span className="text-slate-400 font-bold text-[10px] uppercase block">Govt Grant Released</span>
            <span className="font-extrabold text-emerald-600 text-sm">{data.jvdStatus.govtReleased}</span>
          </div>
          <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
            <span className="text-slate-400 font-bold text-[10px] uppercase block">Student College Due</span>
            <span className="font-extrabold text-emerald-600 text-sm">{data.jvdStatus.collegeBalanceDue}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
