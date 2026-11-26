import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../api/axios";
import { PageHeader } from "../../components/UI/PageHeader";
import { Trophy, Clock, Medal, ChevronLeft, Download, Search, Users, Award, CheckCircle2, FileBarChart2, RefreshCw } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export const CompetitiveExamLeaderboardPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [exam, setExam] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClass, setSelectedClass] = useState("ALL");

  const loadLeaderboard = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [lbRes, exRes] = await Promise.all([
        api.get(`/api/competitive-exams/${id}/leaderboard`),
        api.get(`/api/competitive-exams/${id}`).catch(() => null),
      ]);
      setSubmissions(lbRes.data?.data || []);
      if (exRes?.data?.data) setExam(exRes.data.data);
    } catch {
      // handled cleanly by empty state
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeaderboard();
  }, [id]);

  const formatTime = (secs: number) => {
    const safe = Math.max(0, Number(secs) || 0);
    const m = Math.floor(safe / 60);
    const s = safe % 60;
    return `${m}m ${s}s`;
  };

  const classList = useMemo(() => {
    const set = new Set<string>();
    submissions.forEach((s) => {
      const cname = s.student?.class ? `${s.student.class.name}${s.student.class.section ? ` - ${s.student.class.section}` : ''}` : '';
      if (cname) set.add(cname);
    });
    return Array.from(set);
  }, [submissions]);

  const filteredSubmissions = useMemo(() => {
    return submissions.filter((s) => {
      const name = (s.student?.user?.name || '').toLowerCase();
      const roll = (s.student?.rollNo || '').toLowerCase();
      const cname = s.student?.class ? `${s.student.class.name}${s.student.class.section ? ` - ${s.student.class.section}` : ''}` : '';
      const q = searchQuery.trim().toLowerCase();
      const matchesQ = !q || name.includes(q) || roll.includes(q);
      const matchesClass = selectedClass === 'ALL' || cname === selectedClass;
      return matchesQ && matchesClass;
    });
  }, [submissions, searchQuery, selectedClass]);

  const stats = useMemo(() => {
    const total = filteredSubmissions.length;
    const topScore = total > 0 ? Math.max(...filteredSubmissions.map((s) => Number(s.marksObtained) || 0)) : 0;
    const avgScore = total > 0 ? Math.round(filteredSubmissions.reduce((acc, s) => acc + (Number(s.marksObtained) || 0), 0) / total) : 0;
    const passMark = Number(exam?.passMarks ?? 35);
    const passed = filteredSubmissions.filter((s) => (Number(s.marksObtained) || 0) >= passMark).length;
    return { total, topScore, avgScore, passed };
  }, [filteredSubmissions, exam]);

  const downloadPDF = () => {
    const doc = new jsPDF();
    doc.text(`Merit Leaderboard - ${exam?.title || "Exam"}`, 14, 15);
    autoTable(doc, {
      startY: 22,
      head: [["Rank", "Student Name", "Class", "Score", "Time Taken"]],
      body: filteredSubmissions.map((s, index) => [
        index + 1,
        s.student?.user?.name || "Unknown",
        `${s.student?.class?.name || ''} ${s.student?.class?.section ? `- ${s.student.class.section}` : ''}`.trim(),
        `${s.marksObtained} / ${exam?.totalMarks || 100}`,
        formatTime(s.totalTimeTaken)
      ])
    });
    doc.save(`Leaderboard_${(exam?.title || "Exam").replace(/\s+/g, '_')}.pdf`);
  };

  return (
    <div className="min-h-screen bg-[#F4F7FC] flex flex-col">
      <PageHeader
        title={`${exam?.title || "Online Exam"} — Merit Leaderboard`}
        icon={<Trophy className="w-5 h-5" />}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => navigate("/competitive-exams/results")}
              className="px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white border border-white/20 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
            >
              <ChevronLeft size={15} /> Back to Results
            </button>
            <button
              onClick={loadLeaderboard}
              className="p-2 rounded-xl bg-white/15 hover:bg-white/25 text-white border border-white/20 transition cursor-pointer"
              title="Refresh Leaderboard"
            >
              <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
            </button>
            <button
              onClick={downloadPDF}
              disabled={filteredSubmissions.length === 0}
              className="px-4 py-2 rounded-xl bg-white hover:bg-indigo-50 text-[#5B3DF5] text-xs font-black flex items-center gap-1.5 shadow-sm transition cursor-pointer disabled:opacity-50"
            >
              <Download size={14} /> Export PDF
            </button>
          </div>
        }
      />

      <div className="p-4 md:p-6 max-w-7xl w-full mx-auto space-y-5 flex-1">
        {/* Pastel KPI Summary Bar */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-[0_2px_10px_rgba(15,23,42,0.03)] space-y-3.5">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="rounded-xl px-4 py-3 bg-gradient-to-r from-[#5B3DF5] to-[#7B3DF5] text-white shadow-sm flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-black leading-tight tabular-nums">{stats.total}</div>
                <div className="text-[11px] font-semibold text-indigo-100">Total Submissions</div>
              </div>
            </div>

            <div className="rounded-xl px-4 py-3 bg-[#FFF4E5] border border-[#FDE2BA] flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#FFE7C4] text-[#D97706] flex items-center justify-center shrink-0">
                <Trophy className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-black text-slate-900 leading-tight tabular-nums">{stats.topScore}</div>
                <div className="text-[11px] font-bold text-[#D97706]">Highest Score</div>
              </div>
            </div>

            <div className="rounded-xl px-4 py-3 bg-[#EAF3FF] border border-[#D4E6FF] flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#D7E8FF] text-[#2563EB] flex items-center justify-center shrink-0">
                <FileBarChart2 className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-black text-slate-900 leading-tight tabular-nums">{stats.avgScore}</div>
                <div className="text-[11px] font-semibold text-slate-600">Average Score</div>
              </div>
            </div>

            <div className="rounded-xl px-4 py-3 bg-[#EAFAEE] border border-[#CBEFD6] flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#D1F4DC] text-[#16A34A] flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-black text-slate-900 leading-tight tabular-nums">{stats.passed}</div>
                <div className="text-[11px] font-bold text-[#16A34A]">Passed Candidates</div>
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
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-800 placeholder-slate-400 outline-none focus:border-[#5B3DF5]"
              />
            </div>

            {classList.length > 0 && (
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full sm:w-56 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 text-xs outline-none focus:border-[#5B3DF5] cursor-pointer"
              >
                <option value="ALL">All Classes ({submissions.length})</option>
                {classList.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            )}
          </div>
        </div>

        {/* Merit Table */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_2px_10px_rgba(15,23,42,0.03)] overflow-hidden">
          {loading ? (
            <div className="p-12 flex flex-col items-center justify-center space-y-3">
              <RefreshCw className="w-8 h-8 animate-spin text-[#5B3DF5]" />
              <p className="text-xs font-bold text-slate-500">Loading Leaderboard Ranks...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F8FAFD] border-b border-slate-200/80">
                  <tr>
                    <th className="py-3.5 px-5 font-black text-slate-500 uppercase tracking-wider text-[10.5px]">Rank</th>
                    <th className="py-3.5 px-5 font-black text-slate-500 uppercase tracking-wider text-[10.5px]">Student Name</th>
                    <th className="py-3.5 px-5 font-black text-slate-500 uppercase tracking-wider text-[10.5px]">Class</th>
                    <th className="py-3.5 px-5 font-black text-slate-500 uppercase tracking-wider text-[10.5px]">Score</th>
                    <th className="py-3.5 px-5 font-black text-slate-500 uppercase tracking-wider text-[10.5px]">Time Taken</th>
                    <th className="py-3.5 px-5 font-black text-slate-500 uppercase tracking-wider text-[10.5px] text-right">Scorecard</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredSubmissions.map((sub, idx) => (
                    <tr key={sub.id} className="hover:bg-[#F8FAFD] transition">
                      <td className="py-3.5 px-5">
                        {idx === 0 ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[#FFF4E5] text-[#D97706] border border-[#FDE2BA] font-black">
                            <Medal size={14} /> #1
                          </span>
                        ) : idx === 1 ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-100 text-slate-700 border border-slate-200 font-black">
                            <Medal size={14} /> #2
                          </span>
                        ) : idx === 2 ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[#FEECEF] text-[#E11D48] border border-[#FBD0D8] font-black">
                            <Medal size={14} /> #3
                          </span>
                        ) : (
                          <span className="font-bold text-slate-600 ml-2">#{idx + 1}</span>
                        )}
                      </td>
                      <td className="py-3.5 px-5 font-black text-slate-900">
                        {sub.student?.user?.name || 'Student'}
                        {sub.student?.rollNo && (
                          <span className="ml-2 text-[10px] font-bold text-slate-400">({sub.student.rollNo})</span>
                        )}
                      </td>
                      <td className="py-3.5 px-5 font-bold text-slate-600">
                        {sub.student?.class?.name || ''} {sub.student?.class?.section ? `- ${sub.student.class.section}` : ''}
                      </td>
                      <td className="py-3.5 px-5 font-black text-[#5B3DF5] tabular-nums">
                        {sub.marksObtained} <span className="text-slate-400 font-bold">/ {exam?.totalMarks || 100}</span>
                      </td>
                      <td className="py-3.5 px-5 text-slate-600 font-semibold">
                        <span className="inline-flex items-center gap-1.5"><Clock size={13} className="text-[#D97706]" /> {formatTime(sub.totalTimeTaken)}</span>
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <button
                          onClick={() => navigate(`/competitive-exam-result/${id}?submissionId=${sub.id}`)}
                          className="px-3 py-1.5 rounded-xl bg-[#F3EEFF] hover:bg-[#E7DDFE] text-[#5B3DF5] font-extrabold text-xs inline-flex items-center gap-1 cursor-pointer transition"
                        >
                          <Award size={13} /> View Scorecard
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredSubmissions.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-slate-500 font-semibold">
                        No submissions recorded for this exam yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CompetitiveExamLeaderboardPage;

