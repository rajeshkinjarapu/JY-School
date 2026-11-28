import React, { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { LoadingSpinner } from '../../components/UI/LoadingSpinner';
import {
  Users, CheckCircle2, XCircle, Percent, PlusCircle, Edit, Calendar,
  Download, Search, BookOpen, Clock, AlertTriangle, FileText
} from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '../../components/UI/PageHeader';
import { AttendanceNavTabs } from './AttendanceNavTabs';

export default function AttendanceDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusListTab, setStatusListTab] = useState<'leaves' | 'absent'>('absent');

  const fetchStats = async () => {
    try {
      const res = await api.get('/api/attendance/dashboard-stats');
      setStats(res.data || res);
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const filteredClassWise = useMemo(() => {
    const list = stats?.classWise || [];
    const q = searchQuery.toLowerCase().trim();
    if (!q) return list;
    return list.filter((c: any) => (c.className || '').toLowerCase().includes(q));
  }, [stats, searchQuery]);

  const filteredAbsents = useMemo(() => {
    const list = stats?.studentsAbsent || [];
    const q = searchQuery.toLowerCase().trim();
    if (!q) return list;
    return list.filter(
      (s: any) =>
        (s.studentName || '').toLowerCase().includes(q) ||
        (s.className || '').toLowerCase().includes(q) ||
        String(s.studentId || '').toLowerCase().includes(q)
    );
  }, [stats, searchQuery]);

  const filteredLeaves = useMemo(() => {
    const list = stats?.studentsOnLeave || [];
    const q = searchQuery.toLowerCase().trim();
    if (!q) return list;
    return list.filter(
      (s: any) =>
        (s.studentName || '').toLowerCase().includes(q) ||
        (s.className || '').toLowerCase().includes(q) ||
        String(s.studentId || '').toLowerCase().includes(q)
    );
  }, [stats, searchQuery]);

  if (loading) {
    return (
      <div className="flex flex-col h-full bg-[#F4F7FC] text-slate-800 overflow-hidden">
        <PageHeader title="Attendance Dashboard" icon={<Calendar className="w-5 h-5 text-white" />} />
        <div className="flex justify-center items-center flex-1">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="flex flex-col h-full bg-[#F4F7FC] text-slate-800 overflow-hidden">
      <PageHeader
        title="Attendance Dashboard"
        icon={<Calendar className="w-5 h-5 text-white" />}
        action={
          <div className="flex items-center gap-2">
            <Link
              to="/attendance/mark"
              className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-indigo-50 text-[#1E1B4B] text-xs font-extrabold flex items-center gap-1.5 shadow-xs transition-all"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Mark Attendance</span>
            </Link>
          </div>
        }
      />

      <div className="flex-1 overflow-auto p-4 sm:p-6">
        <div className="w-full max-w-7xl mx-auto space-y-5 pb-10">

          {/* Unified Sub-Navigation */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <AttendanceNavTabs />
            <span className="px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-extrabold uppercase tracking-wider">
              LIVE &bull; {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
            </span>
          </div>

          {/* 4 Dashboard Glossy Pastel KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div className="relative overflow-hidden rounded-[20px] px-4 py-4 border bg-gradient-to-br from-[#EAF2FF] to-[#CBE0FF] border-[#B6D2FF] shadow-[0_6px_18px_-6px_rgba(15,23,42,0.10)]">
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

            <div className="relative overflow-hidden rounded-[20px] px-4 py-4 border bg-gradient-to-br from-[#E5FAEF] to-[#C2F2D9] border-[#ACEAD0] shadow-[0_6px_18px_-6px_rgba(15,23,42,0.10)]">
              <div className="absolute inset-x-0 top-0 h-[45%] bg-gradient-to-b from-white/55 to-transparent pointer-events-none rounded-t-[20px]" />
              <div className="relative z-10 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#10B981] to-[#059669] flex items-center justify-center text-white shadow-md shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-600">Present Today</p>
                  <p className="text-2xl font-black text-[#065F46] leading-tight">{stats.todayPresent}</p>
                </div>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-[20px] px-4 py-4 border bg-gradient-to-br from-[#FFEFEF] to-[#FFD2D7] border-[#FFC0C7] shadow-[0_6px_18px_-6px_rgba(15,23,42,0.10)]">
              <div className="absolute inset-x-0 top-0 h-[45%] bg-gradient-to-b from-white/55 to-transparent pointer-events-none rounded-t-[20px]" />
              <div className="relative z-10 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#EF4444] to-[#DC2626] flex items-center justify-center text-white shadow-md shrink-0">
                  <XCircle className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-600">Absent Today</p>
                  <p className="text-2xl font-black text-[#991B1B] leading-tight">{stats.todayAbsent}</p>
                </div>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-[20px] px-4 py-4 border bg-gradient-to-br from-[#F2EDFF] to-[#DDD2FF] border-[#CEC0FF] shadow-[0_6px_18px_-6px_rgba(15,23,42,0.10)]">
              <div className="absolute inset-x-0 top-0 h-[45%] bg-gradient-to-b from-white/55 to-transparent pointer-events-none rounded-t-[20px]" />
              <div className="relative z-10 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#8B5CF6] to-[#6D28D9] flex items-center justify-center text-white shadow-md shrink-0">
                  <Percent className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-600">Attendance Rate</p>
                  <p className="text-2xl font-black text-[#4C1D95] leading-tight">{stats.attendancePercentage}%</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-5">

              {/* Quick Actions */}
              <div className="bg-white rounded-[20px] border border-indigo-100/80 shadow-[0_6px_22px_-6px_rgba(91,33,182,0.08)] p-4 sm:p-5">
                <h2 className="text-xs font-black text-[#1E1B4B] uppercase tracking-wider mb-3 flex items-center gap-2">
                  <PlusCircle className="w-4 h-4 text-[#5B21B6]" />
                  Quick Actions
                </h2>
                <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2.5">
                  <Link
                    to="/attendance/mark"
                    className="px-4 py-2.5 bg-gradient-to-r from-[#5B21B6] to-[#7C3AED] hover:opacity-95 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-sm"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Mark Attendance
                  </Link>
                  <button
                    type="button"
                    onClick={() => navigate('/attendance/mark')}
                    className="px-4 py-2.5 bg-[#F8FAFF] hover:bg-[#EFEAFE] text-[#1E1B4B] border border-indigo-100 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Edit className="w-3.5 h-3.5 text-[#5B21B6]" /> Edit Register
                  </button>
                  <Link
                    to="/attendance/report"
                    className="px-4 py-2.5 bg-[#F8FAFF] hover:bg-[#EFEAFE] text-[#1E1B4B] border border-indigo-100 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all"
                  >
                    <Calendar className="w-3.5 h-3.5 text-[#5B21B6]" /> Class Analytics
                  </Link>
                  <Link
                    to="/attendance/daily-report"
                    className="px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all"
                  >
                    <Download className="w-3.5 h-3.5" /> Daily Print Report
                  </Link>
                </div>
              </div>

              {/* School Overview Card */}
              <div className="bg-white rounded-[20px] border border-indigo-100/80 shadow-[0_6px_22px_-6px_rgba(91,33,182,0.08)] overflow-hidden flex flex-col md:flex-row">
                <div className="p-5 bg-gradient-to-br from-[#F2EDFF] to-[#E6F0FF] md:w-1/3 flex flex-col justify-center border-b md:border-b-0 md:border-r border-indigo-100">
                  <p className="text-[10px] font-black uppercase tracking-wider text-indigo-500 mb-1">Today's Date</p>
                  <p className="text-xl font-black text-[#1E1B4B] mb-0.5">
                    {new Date().toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </p>
                  <p className="text-xs font-bold text-[#5B21B6]">
                    {new Date().toLocaleDateString('en-US', { weekday: 'long' })}
                  </p>
                </div>
                <div className="p-5 flex-1 flex flex-col justify-center">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-black text-[#1E1B4B] text-base">School Attendance Overview</h3>
                    <span className="px-2.5 py-0.5 bg-[#DCFCE7] text-[#15803D] border border-[#BBF7D0] text-[10px] font-black rounded-full">
                      LIVE
                    </span>
                  </div>
                  <div className="flex justify-between items-end mb-2.5">
                    <div className="flex gap-6">
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Present</p>
                        <p className="text-2xl font-black text-emerald-600">{stats.todayPresent}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Absent</p>
                        <p className="text-2xl font-black text-rose-600">{stats.todayAbsent}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Leave</p>
                        <p className="text-2xl font-black text-amber-500">{stats.todayLeave}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-black text-[#5B21B6]">{stats.attendancePercentage}%</p>
                    </div>
                  </div>
                  <div className="w-full bg-indigo-50 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full rounded-full transition-all"
                      style={{ width: `${stats.attendancePercentage}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Class-wise Attendance Table */}
              <div className="bg-white rounded-[20px] border border-[#DDD7F3] shadow-[0_12px_32px_-6px_rgba(91,33,182,0.08)] overflow-hidden">
                <div className="px-5 py-3.5 border-b border-indigo-100/80 bg-[#FAF9FF] flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase tracking-wider text-[#1E1B4B] flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-[#5B21B6]" />
                    Class-wise Attendance ({filteredClassWise.length})
                  </h3>
                </div>
                <div className="overflow-x-auto max-h-[380px] overflow-y-auto">
                  <table className="w-full text-left border-collapse text-xs student-grid-table">
                    <thead className="sticky top-0 z-10">
                      <tr className="bg-gradient-to-r from-[#7D3CEF] via-[#6D38EA] to-[#5B21B6] !text-white font-extrabold uppercase text-[11px] tracking-wider">
                        <th className="py-3 px-4 border-r border-white/20 !text-white">Class</th>
                        <th className="py-3 px-4 text-center border-r border-white/20 !text-white">Present</th>
                        <th className="py-3 px-4 text-center border-r border-white/20 !text-white">Absent</th>
                        <th className="py-3 px-4 text-center !text-white">%</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredClassWise.length > 0 ? (
                        filteredClassWise.map((c: any, i: number) => (
                          <tr key={i} className="even:bg-[#FAF9FF] hover:bg-[#F3EFFE]/60 transition-colors bg-white border-b border-[#EAE7F6]">
                            <td className="py-2.5 px-4 font-extrabold text-[#1E1B4B] border-r border-[#EAE7F6]">{c.className}</td>
                            <td className="py-2.5 px-4 font-black text-emerald-600 text-center font-mono border-r border-[#EAE7F6]">{c.present}</td>
                            <td className="py-2.5 px-4 font-black text-rose-600 text-center font-mono border-r border-[#EAE7F6]">{c.absent}</td>
                            <td className="py-2.5 px-4 text-center">
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-[11px] font-black font-mono border ${
                                  c.percentage >= 90
                                    ? 'bg-[#DCFCE7] text-[#15803D] border-[#BBF7D0]'
                                    : c.percentage >= 75
                                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                                      : 'bg-rose-50 text-rose-700 border-rose-200'
                                }`}
                              >
                                {c.percentage}%
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="py-10 text-center text-slate-400 font-bold">
                            No attendance records found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-5">
              {/* Quick Search */}
              <div className="bg-white rounded-[20px] border border-indigo-100/80 shadow-[0_6px_22px_-6px_rgba(91,33,182,0.08)] p-4 sm:p-5">
                <h3 className="text-xs font-black uppercase tracking-wider text-[#1E1B4B] mb-3 flex items-center gap-2">
                  <Search className="w-4 h-4 text-[#5B21B6]" />
                  Quick Search
                </h3>
                <div className="relative">
                  <Search className="w-4 h-4 text-indigo-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Filter class, student name or ID..."
                    className="w-full bg-[#F8FAFF] border border-indigo-100 rounded-xl pl-9 pr-3 py-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              {/* Weekly Trend */}
              <div className="bg-white rounded-[20px] border border-indigo-100/80 shadow-[0_6px_22px_-6px_rgba(91,33,182,0.08)] p-4 sm:p-5">
                <h3 className="text-xs font-black uppercase tracking-wider text-[#1E1B4B] mb-4 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#5B21B6]" />
                  Weekly Attendance Trend
                </h3>
                <div className="space-y-3.5">
                  {stats.weeklyTrend.map((day: any, i: number) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-10 text-[11px] font-bold text-slate-500">{day.day}</div>
                      <div className="flex-1 h-2.5 bg-indigo-50 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${
                            day.percentage >= 90
                              ? 'bg-gradient-to-r from-[#5B21B6] to-[#7C3AED]'
                              : day.percentage >= 75
                                ? 'bg-amber-400'
                                : 'bg-rose-400'
                          }`}
                          style={{ width: `${day.percentage}%` }}
                        />
                      </div>
                      <div className="w-10 text-right text-xs font-black text-[#1E1B4B] font-mono">{day.percentage}%</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Absent / Leave List */}
              <div className="bg-white rounded-[20px] border border-indigo-100/80 shadow-[0_6px_22px_-6px_rgba(91,33,182,0.08)] p-4 sm:p-5">
                <div className="flex items-center justify-between mb-3.5">
                  <h3 className="text-xs font-black uppercase tracking-wider text-[#1E1B4B] flex items-center gap-2">
                    <AlertTriangle className={`w-4 h-4 ${statusListTab === 'leaves' ? 'text-amber-500' : 'text-rose-500'}`} />
                    {statusListTab === 'leaves' ? 'On Leave' : 'Absent Today'}
                  </h3>
                  <div className="flex bg-[#F3F5FC] p-1 rounded-xl border border-indigo-100 text-[11px] font-bold">
                    <button
                      type="button"
                      onClick={() => setStatusListTab('absent')}
                      className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                        statusListTab === 'absent' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Absent ({stats.todayAbsent || 0})
                    </button>
                    <button
                      type="button"
                      onClick={() => setStatusListTab('leaves')}
                      className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                        statusListTab === 'leaves' ? 'bg-amber-500 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Leaves ({stats.todayLeave || 0})
                    </button>
                  </div>
                </div>

                <div className="space-y-2.5 max-h-[240px] overflow-y-auto pr-1">
                  {statusListTab === 'leaves' ? (
                    filteredLeaves.length > 0 ? (
                      filteredLeaves.map((s: any, i: number) => (
                        <div key={i} className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-3 flex justify-between items-start gap-2">
                          <div className="min-w-0">
                            <p className="text-xs font-extrabold text-[#1E1B4B] truncate">{s.studentName}</p>
                            <p className="text-[11px] text-slate-500">{s.className} &bull; {s.studentId}</p>
                          </div>
                          <span className="text-[10px] font-extrabold uppercase text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md shrink-0">
                            {s.reason || 'Leave'}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs font-bold text-slate-400 text-center py-5 bg-[#FAF9FF] rounded-xl">
                        No students on leave today.
                      </p>
                    )
                  ) : filteredAbsents.length > 0 ? (
                    filteredAbsents.map((s: any, i: number) => (
                      <div key={i} className="bg-rose-50/70 border border-rose-200/80 rounded-xl p-3 flex justify-between items-start gap-2">
                        <div className="min-w-0">
                          <p className="text-xs font-extrabold text-[#1E1B4B] truncate">{s.studentName}</p>
                          <p className="text-[11px] text-slate-500">{s.className} &bull; {s.studentId}</p>
                        </div>
                        <span className="text-[10px] font-extrabold uppercase text-rose-700 bg-rose-100 px-2 py-0.5 rounded-md shrink-0">
                          Absent
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs font-bold text-slate-400 text-center py-5 bg-[#FAF9FF] rounded-xl">
                      No students absent today.
                    </p>
                  )}
                </div>
              </div>

              {/* Shortcuts */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { to: '/attendance/mark', label: 'Mark Register', icon: Edit, color: 'text-[#5B21B6]', bg: 'bg-[#EFEAFE]' },
                  { to: '/attendance/absentees-today', label: 'Absentees List', icon: FileText, color: 'text-rose-600', bg: 'bg-rose-50' },
                  { to: '/attendance/holidays', label: 'Holiday Calendar', icon: Calendar, color: 'text-amber-600', bg: 'bg-amber-50' },
                  { to: '/attendance/report', label: 'Class Analytics', icon: Clock, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                ].map((s, i) => (
                  <Link
                    key={i}
                    to={s.to}
                    className="bg-white border border-indigo-100/80 rounded-2xl p-3.5 flex flex-col items-center justify-center text-center hover:border-[#5B21B6]/40 hover:bg-[#FAF9FF] transition-all shadow-2xs"
                  >
                    <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center mb-2`}>
                      <s.icon className={`w-4 h-4 ${s.color}`} />
                    </div>
                    <span className="text-[11px] font-extrabold text-[#1E1B4B]">{s.label}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
