import React from 'react';
import { CHAIRMAN_KPI_DATA, INSTITUTION_WINGS } from '../data/universityMockData';
import {
  Users, DollarSign, Award, TrendingUp, Building2,
  CheckCircle2, Clock, AlertTriangle, ArrowUpRight, School,
  Briefcase, GraduationCap, BarChart3, PieChart, ShieldCheck
} from 'lucide-react';

interface ChairmanDashboardProps {
  onSelectWing: (wingId: string) => void;
  selectedWingId: string;
}

export const ChairmanDashboard: React.FC<ChairmanDashboardProps> = ({ onSelectWing, selectedWingId }) => {
  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 md:p-8 text-white shadow-xl border border-indigo-500/20">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-indigo-500/20 border border-indigo-400/30 px-3 py-1 text-xs font-semibold text-indigo-200 mb-2">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
              Executive Multi-Institution Command Center
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Sri Venkateswara Educational Society & Deemed University
            </h1>
            <p className="text-slate-300 text-sm mt-1 max-w-2xl">
              Consolidated real-time operational telemetry across School, Intermediate, Degree, PG, and College of Education wings.
            </p>
          </div>
          <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10">
            <div className="text-right">
              <div className="text-xs text-indigo-200">Total Group Strength</div>
              <div className="text-2xl font-black text-white">6,850</div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center border border-emerald-400/30">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Top 4 KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Students */}
        <div className="rounded-xl bg-white dark:bg-slate-900 p-5 shadow-sm border border-slate-200 dark:border-slate-800 hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Students</span>
            <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950 flex items-center justify-center text-blue-600">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white">6,850</span>
            <span className="text-xs font-bold text-emerald-600 flex items-center">
              <ArrowUpRight className="w-3 h-3" /> +14.2% YoY
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-500">Across 5 integrated campuses</div>
        </div>

        {/* Total Revenue & Collection */}
        <div className="rounded-xl bg-white dark:bg-slate-900 p-5 shadow-sm border border-slate-200 dark:border-slate-800 hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Gross Fee Collections</span>
            <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center text-emerald-600">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white">₹15.82 Cr</span>
            <span className="text-xs font-semibold text-slate-500">/ ₹18.40 Cr</span>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full" style={{ width: '86%' }} />
            </div>
            <span className="text-xs font-bold text-emerald-600">86% Collected</span>
          </div>
        </div>

        {/* Total Faculty */}
        <div className="rounded-xl bg-white dark:bg-slate-900 p-5 shadow-sm border border-slate-200 dark:border-slate-800 hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Faculty & Professors</span>
            <div className="w-9 h-9 rounded-lg bg-purple-50 dark:bg-purple-950 flex items-center justify-center text-purple-600">
              <GraduationCap className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white">340</span>
            <span className="text-xs font-semibold text-purple-600">Ph.D & M.Tech Qualified</span>
          </div>
          <div className="mt-2 text-xs text-slate-500">1:20 Student-Faculty Ratio</div>
        </div>

        {/* Placements & Success */}
        <div className="rounded-xl bg-white dark:bg-slate-900 p-5 shadow-sm border border-slate-200 dark:border-slate-800 hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Campus Placements</span>
            <div className="w-9 h-9 rounded-lg bg-amber-50 dark:bg-amber-950 flex items-center justify-center text-amber-600">
              <Award className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white">412 Offers</span>
            <span className="text-xs font-bold text-amber-600">89% Rate</span>
          </div>
          <div className="mt-2 text-xs text-slate-500">TCS, Infosys, Wipro, ICICI, Cognizant</div>
        </div>
      </div>

      {/* Multi-Wing Performance Matrix */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-sm border border-slate-200 dark:border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Building2 className="w-5 h-5 text-indigo-600" />
              Institutions & Campus Performance Comparison
            </h2>
            <p className="text-xs text-slate-500">Click any institution to dive into its specific principal and course view</p>
          </div>
          <div className="inline-flex rounded-lg bg-slate-100 dark:bg-slate-800 p-1 text-xs font-semibold text-slate-600 dark:text-slate-300">
            Active Academic Year 2024-2025
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {INSTITUTION_WINGS.map((wing) => {
            const isSelected = selectedWingId === wing.id;
            return (
              <div
                key={wing.id}
                onClick={() => onSelectWing(wing.id)}
                className={`cursor-pointer rounded-xl p-5 border transition-all duration-200 hover:-translate-y-0.5 ${
                  isSelected
                    ? 'border-indigo-600 bg-indigo-50/40 dark:bg-indigo-950/20 shadow-md ring-2 ring-indigo-500/20'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold shadow-sm"
                      style={{ backgroundColor: wing.color }}
                    >
                      {wing.shortName.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white text-sm line-clamp-1">{wing.name}</h3>
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase text-white mt-0.5" style={{ backgroundColor: wing.color }}>
                        {wing.badge}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2 text-center py-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                  <div>
                    <div className="text-[10px] uppercase font-bold text-slate-400">Students</div>
                    <div className="text-sm font-black text-slate-800 dark:text-slate-200">{wing.totalStudents}</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-bold text-slate-400">Faculty</div>
                    <div className="text-sm font-black text-slate-800 dark:text-slate-200">{wing.totalFaculty}</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-bold text-slate-400">Courses</div>
                    <div className="text-sm font-black text-slate-800 dark:text-slate-200">{wing.totalCourses}</div>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between text-xs">
                  <span className="text-slate-500">Fee Collection:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{wing.feeCollection} ({wing.feePercent}%)</span>
                </div>
                <div className="mt-1.5 h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${wing.feePercent}%`, backgroundColor: wing.color }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
