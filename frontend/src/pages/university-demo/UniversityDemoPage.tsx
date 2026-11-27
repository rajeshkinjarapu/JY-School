import React, { useState } from 'react';
import { INSTITUTION_WINGS } from './data/universityMockData';
import type { InstitutionWing } from './data/universityMockData';
import { ChairmanDashboard } from './components/ChairmanDashboard';
import { PrincipalDashboard } from './components/PrincipalDashboard';
import { FacultyAttendance } from './components/FacultyAttendance';
import { StudentGradeCard } from './components/StudentGradeCard';
import {
  Building2, School, GraduationCap, Briefcase, BookOpen,
  Users, ShieldCheck, Sparkles, HelpCircle, ArrowLeft,
  ChevronRight, Laptop, CheckCircle2, Award, Zap
} from 'lucide-react';
import { Link } from 'react-router-dom';

type UserRole = 'CHAIRMAN' | 'PRINCIPAL' | 'FACULTY' | 'STUDENT';

export const UniversityDemoPage: React.FC = () => {
  const [selectedWingId, setSelectedWingId] = useState<string>('degree');
  const [activeRole, setActiveRole] = useState<UserRole>('CHAIRMAN');
  const [showPitchTips, setShowPitchTips] = useState<boolean>(true);

  const activeWing = INSTITUTION_WINGS.find(w => w.id === selectedWingId) || INSTITUTION_WINGS[2];

  const getWingIcon = (id: string) => {
    switch (id) {
      case 'school': return <School className="w-4 h-4" />;
      case 'junior': return <GraduationCap className="w-4 h-4" />;
      case 'degree': return <Building2 className="w-4 h-4" />;
      case 'pg': return <Briefcase className="w-4 h-4" />;
      case 'bed': return <BookOpen className="w-4 h-4" />;
      default: return <Building2 className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans pb-16">
      {/* Sticky Master Top Bar */}
      <header className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Brand Logo & Title */}
            <div className="flex items-center gap-3">
              <Link
                to="/dashboard"
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                title="Back to School ERP"
              >
                <ArrowLeft className="w-4 h-4" />
              </Link>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center font-black text-xl shadow-md">
                U
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-sm sm:text-base font-extrabold tracking-tight text-white line-clamp-1">
                    Sri Venkateswara Group of Institutions & University
                  </h1>
                  <span className="hidden md:inline-flex items-center gap-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                    <Sparkles className="w-3 h-3" /> Live Demo Mode
                  </span>
                </div>
                <div className="text-[11px] text-slate-400">
                  Autonomous University & Multi-Wing Educational Society Cloud ERP
                </div>
              </div>
            </div>

            {/* Presentation Tips Toggle */}
            <button
              onClick={() => setShowPitchTips(!showPitchTips)}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/30 text-xs font-bold transition"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              {showPitchTips ? 'Hide Pitch Tips' : 'Show Pitch Tips'}
            </button>
          </div>
        </div>

        {/* 5-Wing Institutional Switcher Bar */}
        <div className="bg-slate-950/80 border-t border-slate-800/80 overflow-x-auto scrollbar-none">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-2 py-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 shrink-0 hidden lg:inline-block mr-2">
              Select Institution:
            </span>
            {INSTITUTION_WINGS.map((wing) => {
              const isSelected = selectedWingId === wing.id;
              return (
                <button
                  key={wing.id}
                  onClick={() => {
                    setSelectedWingId(wing.id);
                    if (activeRole === 'CHAIRMAN') {
                      setActiveRole('PRINCIPAL');
                    }
                  }}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 ring-1 ring-white/20'
                      : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  {getWingIcon(wing.id)}
                  <span>{wing.shortName}</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded font-mono bg-white/20 text-white">
                    {wing.totalStudents}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* Floating 1-Click Role Switcher */}
        <div className="sticky top-28 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-2 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-lg flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 px-2">
            <Zap className="w-4 h-4 text-amber-500 shrink-0" />
            <span className="text-xs font-black uppercase tracking-wider text-slate-500">
              1-Click Role Simulator:
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { role: 'CHAIRMAN' as UserRole, label: 'Chairman (Group Chancellor)', desc: 'Consolidated 5-Wing Overview' },
              { role: 'PRINCIPAL' as UserRole, label: `Principal (${activeWing.badge})`, desc: 'Courses & Semester Management' },
              { role: 'FACULTY' as UserRole, label: 'Faculty / Lecturer', desc: 'Period Attendance & 75% Cutoff' },
              { role: 'STUDENT' as UserRole, label: 'Student / Scholar', desc: 'CBCS Grade Memo & JVD Status' },
            ].map((r) => {
              const isActive = activeRole === r.role;
              return (
                <button
                  key={r.role}
                  onClick={() => setActiveRole(r.role)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 ${
                    isActive
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-md scale-[1.02]'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                  title={r.desc}
                >
                  <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-400 animate-pulse' : 'bg-slate-400'}`} />
                  {r.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Client Pitch Script Card (Collapsible) */}
        {showPitchTips && (
          <div className="rounded-2xl p-4 bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-900 text-white border border-indigo-500/30 shadow-md">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <Laptop className="w-5 h-5 text-indigo-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-300">
                  Client Presentation Guide
                </span>
              </div>
              <button
                onClick={() => setShowPitchTips(false)}
                className="text-xs text-slate-400 hover:text-white"
              >
                Close
              </button>
            </div>
            <div className="mt-2.5 text-xs text-slate-300 grid grid-cols-1 md:grid-cols-4 gap-3 border-t border-indigo-800/60 pt-3">
              <div>
                <span className="font-bold text-white block">1. Chairman View:</span>
                &quot;Sir, view total enrolled students (6,850) and overall fee collection (₹15.8 Cr) across all 5 campuses right here.&quot;
              </div>
              <div>
                <span className="font-bold text-white block">2. Wing Tabs:</span>
                &quot;Switch seamlessly between Degree, Intermediate, School, and PG institutions in a single click.&quot;
              </div>
              <div>
                <span className="font-bold text-white block">3. Faculty View:</span>
                &quot;As faculty mark period-wise attendance, students below 75% are automatically highlighted with red alerts.&quot;
              </div>
              <div>
                <span className="font-bold text-white block">4. Student View:</span>
                &quot;Students see their credits, SGPA (9.16), CGPA CBCS memo breakdown, and scholarship fee status.&quot;
              </div>
            </div>
          </div>
        )}

        {/* Active Role Dashboard View Area */}
        <div className="transition-all duration-300">
          {activeRole === 'CHAIRMAN' && (
            <ChairmanDashboard
              selectedWingId={selectedWingId}
              onSelectWing={(id) => {
                setSelectedWingId(id);
                setActiveRole('PRINCIPAL');
              }}
            />
          )}

          {activeRole === 'PRINCIPAL' && (
            <PrincipalDashboard currentWing={activeWing} />
          )}

          {activeRole === 'FACULTY' && (
            <FacultyAttendance />
          )}

          {activeRole === 'STUDENT' && (
            <StudentGradeCard />
          )}
        </div>
      </main>
    </div>
  );
};

export default UniversityDemoPage;
