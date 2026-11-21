import React, { useState } from 'react';
import { PERIOD_ATTENDANCE_STUDENTS } from '../data/universityMockData';
import {
  Calendar, Clock, CheckCircle2, XCircle, AlertTriangle,
  Send, Users, BookOpen, ShieldAlert, Check, RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';

export const FacultyAttendance: React.FC = () => {
  const [students, setStudents] = useState(PERIOD_ATTENDANCE_STUDENTS);
  const [selectedPeriod, setSelectedPeriod] = useState(3);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleStatus = (id: string) => {
    setStudents(prev => prev.map(s => {
      if (s.id === id) {
        const newPresent = !s.present;
        const newAttended = newPresent ? s.totalAttended + 1 : Math.max(0, s.totalAttended - 1);
        const newPercent = Number(((newAttended / s.totalConducted) * 100).toFixed(1));
        return {
          ...s,
          present: newPresent,
          totalAttended: newAttended,
          percent: newPercent,
          atRisk: newPercent < 75
        };
      }
      return s;
    }));
  };

  const markAll = (status: boolean) => {
    setStudents(prev => prev.map(s => {
      const newAttended = status ? s.totalAttended + 1 : Math.max(0, s.totalAttended - 1);
      const newPercent = Number(((newAttended / s.totalConducted) * 100).toFixed(1));
      return {
        ...s,
        present: status,
        totalAttended: newAttended,
        percent: newPercent,
        atRisk: newPercent < 75
      };
    }));
    toast.success(status ? 'Marked all as Present' : 'Marked all as Absent');
  };

  const presentCount = students.filter(s => s.present).length;
  const absentCount = students.length - presentCount;
  const periodRate = Math.round((presentCount / students.length) * 100);

  const handleSubmit = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      toast.success('⚡ Period 3 Attendance locked & synced with University Exam Cell!');
    }, 600);
  };

  return (
    <div className="space-y-6">
      {/* Period Header */}
      <div className="rounded-2xl p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200 mb-1">
              <Clock className="w-3.5 h-3.5" />
              Live Period-wise Attendance Session
            </div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white">
              CS401: Advanced Java Programming & J2EE
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Course: <span className="font-bold text-slate-700 dark:text-slate-300">B.Sc Computer Science (Sem-IV, Sec-A)</span> • Faculty: <span className="font-bold text-slate-700 dark:text-slate-300">Dr. K. V. Ramanamurthy</span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5, 6].map(p => (
              <button
                key={p}
                onClick={() => setSelectedPeriod(p)}
                className={`w-9 h-9 rounded-lg font-bold text-xs transition ${
                  selectedPeriod === p
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                P{p}
              </button>
            ))}
          </div>
        </div>

        {/* Real-time stats bar */}
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div className="rounded-xl p-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
            <div className="text-[10px] font-bold uppercase text-slate-400">Total Enrolled</div>
            <div className="text-lg font-black text-slate-900 dark:text-white">{students.length}</div>
          </div>
          <div className="rounded-xl p-3 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-800/40">
            <div className="text-[10px] font-bold uppercase text-emerald-600">Present (In Class)</div>
            <div className="text-lg font-black text-emerald-600">{presentCount}</div>
          </div>
          <div className="rounded-xl p-3 bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-800/40">
            <div className="text-[10px] font-bold uppercase text-rose-600">Absent</div>
            <div className="text-lg font-black text-rose-600">{absentCount}</div>
          </div>
          <div className="rounded-xl p-3 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-800/40">
            <div className="text-[10px] font-bold uppercase text-indigo-600">Period Attendance Rate</div>
            <div className="text-lg font-black text-indigo-600">{periodRate}%</div>
          </div>
        </div>
      </div>

      {/* University 75% Rule Alert Box */}
      <div className="rounded-xl p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-800 dark:text-amber-300">
          <span className="font-bold">Autonomous University Regulation:</span> Students with overall subject attendance below <span className="font-extrabold underline">75%</span> are highlighted in <span className="font-bold text-rose-600">RED</span> and flagged for Exam Condonation / Detention. Toggle attendance below to test live calculation.
        </div>
      </div>

      {/* Attendance Marking Table */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Roll Call Sheet (Period 3: 11:30 AM - 12:20 PM)
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => markAll(true)}
              className="px-3 py-1 rounded-lg text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100"
            >
              All Present
            </button>
            <button
              onClick={() => markAll(false)}
              className="px-3 py-1 rounded-lg text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100"
            >
              All Absent
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/70 dark:bg-slate-800/80 text-slate-500 font-bold uppercase border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4 w-12">#</th>
                <th className="py-3 px-4">University PIN</th>
                <th className="py-3 px-4">Student Name</th>
                <th className="py-3 px-4 text-center">Cum. Attendance</th>
                <th className="py-3 px-4 text-center">Semester Status</th>
                <th className="py-3 px-4 text-right">Period 3 Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {students.map((student, idx) => (
                <tr
                  key={student.id}
                  className={`hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition ${
                    student.atRisk ? 'bg-rose-50/20' : ''
                  }`}
                >
                  <td className="py-3.5 px-4 text-slate-400 font-mono">{idx + 1}</td>
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-700 dark:text-slate-300">{student.pin}</td>
                  <td className="py-3.5 px-4">
                    <span className="font-bold text-slate-900 dark:text-white">{student.name}</span>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {student.totalAttended} / {student.totalConducted} ({student.percent}%)
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    {student.atRisk ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-600 border border-rose-200">
                        <AlertTriangle className="w-3 h-3" /> Condonation Risk (&lt;75%)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <Check className="w-3 h-3" /> Eligible (≥75%)
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => toggleStatus(student.id)}
                      className={`px-4 py-1.5 rounded-lg font-bold text-xs transition-all shadow-sm ${
                        student.present
                          ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-500/20'
                          : 'bg-rose-600 text-white hover:bg-rose-700 shadow-rose-500/20'
                      }`}
                    >
                      {student.present ? '✓ PRESENT' : '✗ ABSENT'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <span className="text-xs text-slate-500">Clicking any status button immediately recalculates eligibility.</span>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-6 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-500/20 flex items-center gap-2 transition disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" /> Locking Attendance...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" /> Lock & Submit Attendance
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
