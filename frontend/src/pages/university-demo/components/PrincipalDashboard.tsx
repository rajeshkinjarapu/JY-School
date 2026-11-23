import React, { useState } from 'react';
import { DEGREE_PROGRAMS, INSTITUTION_WINGS } from '../data/universityMockData';
import type { InstitutionWing } from '../data/universityMockData';
import {
  BookOpen, Users, Calendar, Award, CheckCircle2,
  Clock, ArrowRight, Shield, Layers, FileText, Sparkles
} from 'lucide-react';

interface PrincipalDashboardProps {
  currentWing: InstitutionWing;
}

export const PrincipalDashboard: React.FC<PrincipalDashboardProps> = ({ currentWing }) => {
  const [selectedProgram, setSelectedProgram] = useState(DEGREE_PROGRAMS[0]);

  return (
    <div className="space-y-6">
      {/* Wing Header Card */}
      <div className="rounded-2xl p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-2xl font-black shadow-md"
            style={{ backgroundColor: currentWing.color }}
          >
            {currentWing.shortName.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Dean / Principal Management Portal</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold text-white uppercase" style={{ backgroundColor: currentWing.color }}>
                {currentWing.badge}
              </span>
            </div>
            <h2 className="text-xl md:text-2xl font-extrabold text-slate-900 dark:text-white mt-0.5">{currentWing.name}</h2>
            <p className="text-xs text-slate-500 mt-0.5">{currentWing.tagline}</p>
          </div>
        </div>

        <div className="flex items-center gap-4 border-t md:border-t-0 md:border-l border-slate-200 dark:border-slate-800 pt-3 md:pt-0 md:pl-6">
          <div className="text-center">
            <div className="text-xs text-slate-400">Total Enrolled</div>
            <div className="text-xl font-black text-slate-900 dark:text-white">{currentWing.totalStudents}</div>
          </div>
          <div className="w-px h-8 bg-slate-200 dark:bg-slate-800" />
          <div className="text-center">
            <div className="text-xs text-slate-400">Faculty Staff</div>
            <div className="text-xl font-black text-slate-900 dark:text-white">{currentWing.totalFaculty}</div>
          </div>
          <div className="w-px h-8 bg-slate-200 dark:bg-slate-800" />
          <div className="text-center">
            <div className="text-xs text-slate-400">Fee Rate</div>
            <div className="text-xl font-black text-emerald-600">{currentWing.feePercent}%</div>
          </div>
        </div>
      </div>

      {/* Degree & PG Courses Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Programs List */}
        <div className="lg:col-span-1 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">Degree & PG Departments</h3>
            <span className="text-xs font-bold text-indigo-600">{DEGREE_PROGRAMS.length} Active Courses</span>
          </div>

          {DEGREE_PROGRAMS.map((prog) => {
            const isSelected = selectedProgram.code === prog.code;
            return (
              <div
                key={prog.code}
                onClick={() => setSelectedProgram(prog)}
                className={`cursor-pointer rounded-xl p-4 border transition-all ${
                  isSelected
                    ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/20 shadow-md ring-1 ring-indigo-500'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      {prog.code}
                    </span>
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm mt-1.5">{prog.name}</h4>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                  <span>{prog.semesters} Semesters (CBCS)</span>
                  <span className="font-bold text-slate-700 dark:text-slate-300">{prog.strength} Students</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right: Selected Program Details & Semester Grid */}
        <div className="lg:col-span-2 space-y-5">
          <div className="rounded-2xl p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <div className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Program Structure & Syllabus</div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">{selectedProgram.name}</h3>
                <p className="text-xs text-slate-500">Head of Department: <span className="font-semibold text-slate-700 dark:text-slate-300">{selectedProgram.hod}</span></p>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {selectedProgram.status}
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  {selectedProgram.credits} Total Credits
                </span>
              </div>
            </div>

            {/* Semester Tabs / Cards */}
            <div className="mt-5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">6-Semester CBCS Curricular Blueprint</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[1, 2, 3, 4, 5, 6].map((sem) => (
                  <div
                    key={sem}
                    className={`rounded-xl p-3.5 border transition ${
                      sem === 4
                        ? 'border-indigo-600 bg-indigo-500 text-white shadow-md'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-slate-800 dark:text-slate-200 hover:border-indigo-300'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className={sem === 4 ? 'text-indigo-100' : 'text-slate-500'}>Semester {sem}</span>
                      {sem === 4 && <span className="text-[10px] font-black uppercase tracking-wider bg-white/20 px-1.5 py-0.5 rounded">Active</span>}
                    </div>
                    <div className="mt-1 text-sm font-extrabold">24 Credits</div>
                    <div className={`mt-2 text-[10px] ${sem === 4 ? 'text-indigo-100' : 'text-slate-500'}`}>
                      5 Theory + 2 Labs
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Semester 4 Subjects Breakdown */}
            <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Semester 4 Mapped Subjects & Credits
                </h4>
                <span className="text-xs text-indigo-600 font-semibold">Autonomous Syllabus 2024-2025</span>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {[
                  { code: 'CS401', name: 'Advanced Java Programming', credits: 4, faculty: 'Dr. K. V. Ramanamurthy', hours: '4 Hrs/Wk' },
                  { code: 'CS402', name: 'Database Management Systems', credits: 4, faculty: 'Prof. M. Sarada Devi', hours: '4 Hrs/Wk' },
                  { code: 'CS403', name: 'Operating Systems & Linux Shell', credits: 4, faculty: 'Dr. P. Srinivas Rao', hours: '4 Hrs/Wk' },
                  { code: 'CS404', name: 'Web Technologies (React & Node)', credits: 3, faculty: 'G. Lakshmi Narayana', hours: '3 Hrs/Wk' },
                  { code: 'CS405L', name: 'Java & DBMS Laboratory', credits: 2, faculty: 'Lab Assistant Team', hours: '3 Hrs/Wk' },
                ].map((sub) => (
                  <div key={sub.code} className="py-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-slate-400 w-14">{sub.code}</span>
                      <div>
                        <div className="font-bold text-slate-800 dark:text-slate-200">{sub.name}</div>
                        <div className="text-[11px] text-slate-400">Faculty: {sub.faculty}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-slate-400">{sub.hours}</span>
                      <span className="font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-950 px-2.5 py-1 rounded-md">
                        {sub.credits} Credits
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
