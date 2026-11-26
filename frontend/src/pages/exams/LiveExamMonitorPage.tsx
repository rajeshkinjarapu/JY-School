import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { PageHeader } from '../../components/UI/PageHeader';
import { Activity, Users, Clock, CheckCircle2, AlertTriangle, RefreshCw, ChevronLeft, Search, ShieldAlert, Award, Radio, Send } from 'lucide-react';

const LiveExamMonitorPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [monitorData, setMonitorData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'Active' | 'Submitted' | 'Not Started'>('ALL');
  const [forcingId, setForcingId] = useState<string | null>(null);

  const fetchExamData = async (silent = false) => {
    if (!id) return;
    if (!silent) setLoading(true);
    try {
      const res = await api.get(`/api/competitive-exams/${id}/live-monitor`);
      setMonitorData(res.data?.data || null);
    } catch (err) {
      console.error(err);
      if (!silent) toast.error('Failed to load live monitor data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExamData(false);
    const interval = setInterval(() => fetchExamData(true), 10000);
    return () => clearInterval(interval);
  }, [id]);

  const handleForceSubmit = async (studentId: string, studentName: string) => {
    if (!window.confirm(`Force-submit the active exam for ${studentName}?`)) return;
    setForcingId(studentId);
    try {
      await api.post(`/api/competitive-exams/${id}/force-submit/${studentId}`);
      toast.success(`Force-submit signal sent to ${studentName}`);
      fetchExamData(true);
    } catch {
      toast.error('Failed to force submit session');
    } finally {
      setForcingId(null);
    }
  };

  const formatTimeAgo = (dt: string | null) => {
    if (!dt) return '--';
    const secs = Math.max(0, Math.floor((Date.now() - new Date(dt).getTime()) / 1000));
    if (secs < 60) return `${secs}s ago`;
    const mins = Math.floor(secs / 60);
    if (mins < 60) return `${mins}m ago`;
    return `${Math.floor(mins / 60)}h ago`;
  };

  const exam = monitorData?.exam;
  const counts = monitorData?.counts || {
    totalStudents: 0,
    started: 0,
    currentlyWriting: 0,
    submitted: 0,
    notStarted: 0,
  };
  const students: any[] = monitorData?.students || [];

  const filteredStudents = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return students.filter((s) => {
      const matchStatus = statusFilter === 'ALL' || s.status === statusFilter;
      const matchQ = !q || (s.name || '').toLowerCase().includes(q) || (s.rollNo || '').toLowerCase().includes(q);
      return matchStatus && matchQ;
    });
  }, [students, statusFilter, searchQuery]);

  if (loading && !monitorData) {
    return (
      <div className="min-h-screen bg-[#F4F7FC] p-8 flex flex-col items-center justify-center gap-3">
        <RefreshCw className="w-9 h-9 animate-spin text-[#5B3DF5]" />
        <p className="text-xs font-bold text-slate-600">Connecting to Real-Time Exam Proctoring...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F7FC] flex flex-col">
      <PageHeader
        title={`Live Exam Monitor — ${exam?.title || 'Online Exam'}`}
        icon={<Activity className="w-5 h-5" />}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => navigate('/competitive-exams/exams')}
              className="px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white border border-white/20 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
            >
              <ChevronLeft size={15} /> Back to Exams
            </button>
            <button
              onClick={() => fetchExamData(false)}
              className="px-3.5 py-2 rounded-xl bg-white hover:bg-indigo-50 text-[#5B3DF5] text-xs font-black flex items-center gap-1.5 shadow-sm transition cursor-pointer"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Sync Live
            </button>
          </div>
        }
      />

      <div className="p-4 md:p-6 max-w-7xl w-full mx-auto space-y-5 flex-1">
        {/* Pastel Live Status KPI Ribbon */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-[0_2px_10px_rgba(15,23,42,0.03)] space-y-3.5">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <button
              type="button"
              onClick={() => setStatusFilter('ALL')}
              className="rounded-xl px-4 py-3 bg-gradient-to-r from-[#5B3DF5] to-[#7B3DF5] text-white shadow-sm flex items-center gap-3 text-left cursor-pointer"
            >
              <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xl font-black leading-tight tabular-nums">{counts.totalStudents}</div>
                <div className="text-[11px] font-semibold text-indigo-100">Eligible Students</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter('Active')}
              className="rounded-xl px-4 py-3 bg-[#FEECEF] border border-[#FBD0D8] flex items-center gap-3 text-left cursor-pointer"
            >
              <div className="w-9 h-9 rounded-xl bg-[#FAD8DF] text-[#E11D48] flex items-center justify-center shrink-0">
                <Radio className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <div className="text-xl font-black text-slate-900 leading-tight tabular-nums">{counts.currentlyWriting}</div>
                <div className="text-[11px] font-bold text-[#E11D48]">Writing Now</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter('Submitted')}
              className="rounded-xl px-4 py-3 bg-[#EAFAEE] border border-[#CBEFD6] flex items-center gap-3 text-left cursor-pointer"
            >
              <div className="w-9 h-9 rounded-xl bg-[#D1F4DC] text-[#16A34A] flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xl font-black text-slate-900 leading-tight tabular-nums">{counts.submitted}</div>
                <div className="text-[11px] font-bold text-[#16A34A]">Submitted</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter('Not Started')}
              className="rounded-xl px-4 py-3 bg-[#FFF4E5] border border-[#FDE2BA] flex items-center gap-3 text-left cursor-pointer"
            >
              <div className="w-9 h-9 rounded-xl bg-[#FFE7C4] text-[#D97706] flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xl font-black text-slate-900 leading-tight tabular-nums">{counts.notStarted}</div>
                <div className="text-[11px] font-bold text-[#D97706]">Not Started</div>
              </div>
            </button>

            <div className="rounded-xl px-4 py-3 bg-[#EAF3FF] border border-[#D4E6FF] flex items-center gap-3 col-span-2 md:col-span-1">
              <div className="w-9 h-9 rounded-xl bg-[#D7E8FF] text-[#2563EB] flex items-center justify-center shrink-0">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xl font-black text-slate-900 leading-tight tabular-nums">{counts.started}</div>
                <div className="text-[11px] font-semibold text-slate-600">Total Started</div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-center gap-2.5">
            <div className="relative w-full sm:max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search student name or roll no..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-800 outline-none focus:border-[#5B3DF5]"
              />
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {(['ALL', 'Active', 'Submitted', 'Not Started'] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    statusFilter === st
                      ? 'bg-gradient-to-r from-[#5B3DF5] to-[#7B3DF5] text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {st === 'ALL' ? `All (${students.length})` : st}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Real-Time Student Activity Table */}
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgba(15,23,42,0.03)] border border-slate-200/80 overflow-hidden">
          <div className="bg-[#F8FAFD] border-b border-slate-200/80 px-5 py-3.5 flex items-center justify-between">
            <h2 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-wider">
              Real-Time Student Session Log (Auto-refreshes every 10s)
            </h2>
            <span className="text-[11px] font-bold text-slate-500">
              Showing {filteredStudents.length} of {students.length} students
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-white text-[10.5px] uppercase text-slate-400 font-black border-b border-slate-100">
                <tr>
                  <th className="p-4">Student</th>
                  <th className="p-4">Class</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Progress</th>
                  <th className="p-4">Warnings</th>
                  <th className="p-4">Last Activity</th>
                  <th className="p-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.map((s) => {
                  const statusClass = s.status === 'Active'
                    ? 'bg-[#EAF3FF] text-[#2563EB] border border-[#D4E6FF]'
                    : s.status === 'Submitted'
                    ? 'bg-[#EAFAEE] text-[#16A34A] border border-[#CBEFD6]'
                    : 'bg-slate-100 text-slate-500 border border-slate-200';
                  const barClass = s.status === 'Active' ? 'bg-[#2563EB]' : s.status === 'Submitted' ? 'bg-[#16A34A]' : 'bg-slate-300';

                  return (
                    <tr key={s.studentId} className="hover:bg-[#F8FAFD] transition">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-[#F3EEFF] text-[#5B3DF5] font-black flex items-center justify-center shrink-0">
                            {(s.name || 'S').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-black text-slate-900">{s.name}</div>
                            <div className="text-[11px] text-slate-400 font-semibold">Roll: {s.rollNo}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 font-bold text-slate-600">{s.className}</td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-extrabold inline-flex items-center gap-1.5 ${statusClass}`}>
                          {s.status === 'Active' ? <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB] animate-pulse" /> :
                           s.status === 'Submitted' ? <CheckCircle2 size={12} /> :
                           <Clock size={12} />}
                          {s.status}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-24 bg-slate-100 rounded-full h-2 overflow-hidden">
                            <div className={`h-2 rounded-full ${barClass}`} style={{ width: `${s.progress}%` }} />
                          </div>
                          <span className="font-black text-slate-700 tabular-nums">{s.progress}%</span>
                        </div>
                      </td>
                      <td className="p-4">
                        {s.warnings > 0 ? (
                          <span className="px-2 py-0.5 rounded-lg bg-[#FEECEF] text-[#E11D48] border border-[#FBD0D8] font-black inline-flex items-center gap-1">
                            <ShieldAlert size={12} /> {s.warnings}/3
                          </span>
                        ) : (
                          <span className="text-slate-400 font-semibold">0</span>
                        )}
                      </td>
                      <td className="p-4 font-medium text-slate-500">{formatTimeAgo(s.lastActivity)}</td>
                      <td className="p-4 text-right">
                        {s.status === 'Submitted' && s.submissionId ? (
                          <button
                            onClick={() => navigate(`/competitive-exam-result/${id}?submissionId=${s.submissionId}`)}
                            className="px-3 py-1.5 rounded-xl bg-[#F3EEFF] hover:bg-[#E7DDFE] text-[#5B3DF5] font-extrabold inline-flex items-center gap-1 cursor-pointer transition"
                          >
                            <Award size={13} /> Scorecard ({s.marksObtained})
                          </button>
                        ) : s.status === 'Active' ? (
                          <button
                            disabled={forcingId === s.studentId}
                            onClick={() => handleForceSubmit(s.studentId, s.name)}
                            className="px-3 py-1.5 rounded-xl bg-[#FEECEF] hover:bg-[#FAD8DF] text-[#E11D48] border border-[#FBD0D8] font-extrabold inline-flex items-center gap-1 cursor-pointer transition disabled:opacity-50"
                          >
                            <Send size={12} /> {forcingId === s.studentId ? 'Sending...' : 'Force Submit'}
                          </button>
                        ) : (
                          <span className="text-slate-400 text-[11px] font-semibold">Waiting</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {filteredStudents.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-10 text-center text-slate-500 font-semibold">
                      No students match the selected filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveExamMonitorPage;
