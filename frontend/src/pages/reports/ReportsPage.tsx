import React, { useEffect, useState } from "react";
import api from "../../api/axios";
import {
  FileDown,
  CalendarDays,
  ClipboardCheck,
  Wallet,
  Users,
  FileText,
  BarChart3,
  UserCheck,
  Award,
  AlertCircle,
  UserPlus,
  ShieldCheck,
  Search,
  Sparkles,
} from "lucide-react";
import toast from "react-hot-toast";
import { PageHeader } from "../../components/UI/PageHeader";
import { sortClasses } from "../../utils/sortClasses";

type ReportCategory = "ALL" | "ACADEMIC" | "ATTENDANCE" | "FINANCE" | "ADMIN";

export const ReportsPage: React.FC = () => {
  const [classes, setClasses] = useState<any[]>([]);
  const [exams, setExams] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<ReportCategory>("ALL");

  // 1. Attendance Ledger filters
  const [attendanceClassId, setAttendanceClassId] = useState("");
  const [attStartDate, setAttStartDate] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0]
  );
  const [attEndDate, setAttEndDate] = useState(new Date().toISOString().split("T")[0]);

  // 2. Grades Sheet filters
  const [marksClassId, setMarksClassId] = useState("");
  const [marksExamId, setMarksExamId] = useState("");

  // 3. Class Toppers filters
  const [topperExamId, setTopperExamId] = useState("");
  const [topperCount, setTopperCount] = useState("10");

  // 4. Fees Ledger filters
  const [feeStartDate, setFeeStartDate] = useState("");
  const [feeEndDate, setFeeEndDate] = useState("");

  // 5. Fee Defaulters filters
  const [defaulterClassId, setDefaulterClassId] = useState("");

  // 6. Students Roster filters
  const [studentClassId, setStudentClassId] = useState("");

  // 7. Staff Attendance filters
  const now = new Date();
  const [staffMonth, setStaffMonth] = useState(String(now.getMonth() + 1));
  const [staffYear, setStaffYear] = useState(String(now.getFullYear()));

  // 8. Admissions & Gate Pass filters
  const [admissionYear, setAdmissionYear] = useState("");
  const [gatePassClassId, setGatePassClassId] = useState("");
  const [gateStartDate, setGateStartDate] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0]
  );
  const [gateEndDate, setGateEndDate] = useState(new Date().toISOString().split("T")[0]);

  const fetchFilters = async () => {
    try {
      const [classRes, examRes]: any = await Promise.all([
        api.get("/api/classes?limit=500"),
        api.get("/api/exams?limit=500"),
      ]);
      const clsRaw = Array.isArray(classRes) ? classRes : classRes?.data?.data || classRes?.data || [];
      const exmRaw = Array.isArray(examRes) ? examRes : examRes?.data?.data || examRes?.data || [];
      setClasses(sortClasses(clsRaw));
      setExams(exmRaw);
      if (exmRaw.length > 0) {
        setTopperExamId(exmRaw[0].id);
      }
    } catch (e) {
      console.error("Failed to fetch report filters:", e);
    }
  };

  useEffect(() => {
    fetchFilters();
  }, []);

  const downloadReport = async (endpoint: string, filename: string, isPdf: boolean = false) => {
    const importToast = toast.loading(`Generating ${isPdf ? "PDF" : "Excel"} report...`);
    try {
      const response: any = await api.get(endpoint, {
        responseType: "blob",
      });
      const blobData = response?.data instanceof Blob ? response.data : response;
      const mimeType = isPdf
        ? "application/pdf"
        : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
      const url = window.URL.createObjectURL(new Blob([blobData], { type: mimeType }));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success(`${isPdf ? "PDF" : "Excel"} report downloaded!`, { id: importToast });
    } catch {
      toast.error("Failed to generate report. Verify records exist for the chosen filters.", { id: importToast });
    }
  };

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];

  const reportMeta = [
    { id: "attendance", title: "Attendance Ledger", cat: "ATTENDANCE", keywords: "attendance present absent class student ledger" },
    { id: "grades", title: "Grades Sheet", cat: "ACADEMIC", keywords: "grades marks ranks exam results score card" },
    { id: "toppers", title: "Class Toppers & Merit List", cat: "ACADEMIC", keywords: "toppers merit rank holders excellence" },
    { id: "fees", title: "Fees Transaction History", cat: "FINANCE", keywords: "fees revenue collections receipts payment statement" },
    { id: "defaulters", title: "Fee Defaulters & Pending Dues", cat: "FINANCE", keywords: "fee defaulters pending dues balance unpaid" },
    { id: "students", title: "Students Roster Directory", cat: "ADMIN", keywords: "students directory profiles aadhar pen guardian" },
    { id: "staff-att", title: "Staff Attendance Ledger", cat: "ATTENDANCE", keywords: "staff teacher attendance monthly summary leaves" },
    { id: "admissions", title: "Admissions Summary", cat: "ADMIN", keywords: "admissions inquiries enrollment summary" },
    { id: "gatepass", title: "Gate Pass Activity Log", cat: "ADMIN", keywords: "gate pass out time in time security log" },
  ];

  const isVisible = (id: string) => {
    const meta = reportMeta.find((r) => r.id === id);
    if (!meta) return true;
    const matchesCat = categoryFilter === "ALL" || meta.cat === categoryFilter;
    const q = searchQuery.trim().toLowerCase();
    const matchesQ =
      !q || meta.title.toLowerCase().includes(q) || meta.keywords.includes(q);
    return matchesCat && matchesQ;
  };

  const visibleCount = reportMeta.filter((r) => isVisible(r.id)).length;

  return (
    <div className="flex flex-col h-full bg-[#F4F7FC] animate-fade-in" style={{ minHeight: "calc(100vh - 64px)" }}>
      <PageHeader
        title="Reports & Export Center"
        icon={<BarChart3 className="w-5 h-5" />}
        action={
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white/15 border border-white/25 text-white text-xs font-black">
            <Sparkles className="w-3.5 h-3.5" /> {reportMeta.length} Live Reports Active
          </span>
        }
      />

      <div className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-6">

          {/* ══ COMMAND SEARCH & CATEGORY BAR ══ */}
          <div className="bg-white rounded-[22px] border border-[#DDD7F3] shadow-[0_6px_22px_-8px_rgba(79,70,229,0.1)] p-4 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search report (e.g. Attendance, Defaulters, Toppers, Staff)..."
                className="w-full pl-10 pr-4 py-2.5 bg-[#F8FAFF] border border-indigo-100 rounded-xl text-xs font-bold text-[#1E1B4B] outline-none focus:border-[#5B21B6]"
              />
            </div>

            <div className="flex flex-wrap items-center gap-1.5 bg-[#F8FAFF] p-1 rounded-xl border border-indigo-100">
              {[
                { id: "ALL", label: "All Reports (9)" },
                { id: "ACADEMIC", label: "Academic" },
                { id: "ATTENDANCE", label: "Attendance" },
                { id: "FINANCE", label: "Finance & Fees" },
                { id: "ADMIN", label: "Administration" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setCategoryFilter(tab.id as ReportCategory)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                    categoryFilter === tab.id
                      ? "bg-gradient-to-r from-[#5B21B6] to-[#7C3AED] text-white shadow-xs"
                      : "text-slate-600 hover:text-[#5B21B6]"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* ══ REPORTS GRID ══ */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">

            {/* 1. ATTENDANCE LEDGER */}
            {isVisible("attendance") && (
              <div className="bg-white rounded-[24px] border border-[#DDD7F3] shadow-[0_6px_22px_-8px_rgba(79,70,229,0.1)] hover:shadow-md transition-all flex flex-col justify-between overflow-hidden">
                <div className="h-1.5 w-full bg-gradient-to-r from-teal-500 to-emerald-500" />
                <div className="p-5 sm:p-6 flex-1 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#E5FAEF] to-[#C2F2D9] border border-emerald-200 text-emerald-700 flex items-center justify-center shrink-0">
                      <CalendarDays className="w-5 h-5" />
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-black uppercase tracking-wider">
                      Attendance
                    </span>
                  </div>
                  <div>
                    <h4 className="font-black text-base text-[#1E1B4B]">Attendance Ledger</h4>
                    <p className="text-xs font-semibold text-slate-500 mt-1">
                      Class-wise aggregate present, absent, late & attendance rate report.
                    </p>
                  </div>
                  <div className="space-y-2.5 bg-[#F8FAFF] p-3.5 rounded-2xl border border-indigo-50">
                    <select
                      value={attendanceClassId}
                      onChange={(e) => setAttendanceClassId(e.target.value)}
                      className="w-full bg-white border border-indigo-100 rounded-xl px-3 py-2 text-xs font-bold text-[#1E1B4B] outline-none focus:border-[#5B21B6]"
                    >
                      <option value="">All Classes</option>
                      {classes.map((c) => (
                        <option key={c.id} value={c.id}>{c.name} - {c.section}</option>
                      ))}
                    </select>
                    <div className="grid grid-cols-2 gap-2">
                      <input type="date" value={attStartDate} onChange={(e) => setAttStartDate(e.target.value)} className="w-full bg-white border border-indigo-100 rounded-xl px-2.5 py-1.5 text-[11px] font-bold text-slate-700 outline-none focus:border-[#5B21B6]" title="From Date" />
                      <input type="date" value={attEndDate} onChange={(e) => setAttEndDate(e.target.value)} className="w-full bg-white border border-indigo-100 rounded-xl px-2.5 py-1.5 text-[11px] font-bold text-slate-700 outline-none focus:border-[#5B21B6]" title="To Date" />
                    </div>
                  </div>
                </div>
                <div className="px-5 py-4 bg-[#F8FAFF] border-t border-indigo-50 flex gap-2.5">
                  <button
                    onClick={() => downloadReport(`/api/reports/attendance?classId=${attendanceClassId}&startDate=${attStartDate}&endDate=${attEndDate}`, "Attendance_Report.xlsx")}
                    className="flex-1 py-2.5 bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white border border-emerald-200 font-black text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <FileDown className="w-3.5 h-3.5" /> Excel
                  </button>
                  <button
                    onClick={() => downloadReport(`/api/reports/attendance/pdf?classId=${attendanceClassId}&startDate=${attStartDate}&endDate=${attEndDate}`, "Attendance_Report.pdf", true)}
                    className="flex-1 py-2.5 bg-gradient-to-r from-[#5B21B6] to-[#7C3AED] hover:opacity-95 text-white font-black text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5" /> PDF Report
                  </button>
                </div>
              </div>
            )}

            {/* 2. GRADES SHEET */}
            {isVisible("grades") && (
              <div className="bg-white rounded-[24px] border border-[#DDD7F3] shadow-[0_6px_22px_-8px_rgba(79,70,229,0.1)] hover:shadow-md transition-all flex flex-col justify-between overflow-hidden">
                <div className="h-1.5 w-full bg-gradient-to-r from-amber-500 to-orange-500" />
                <div className="p-5 sm:p-6 flex-1 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#FFF6E5] to-[#FFE4B8] border border-amber-200 text-amber-700 flex items-center justify-center shrink-0">
                      <ClipboardCheck className="w-5 h-5" />
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-black uppercase tracking-wider">
                      Academic
                    </span>
                  </div>
                  <div>
                    <h4 className="font-black text-base text-[#1E1B4B]">Grades Sheet</h4>
                    <p className="text-xs font-semibold text-slate-500 mt-1">
                      Subject-wise marks matrix, student totals, class ranks & percentages.
                    </p>
                  </div>
                  <div className="space-y-2.5 bg-[#F8FAFF] p-3.5 rounded-2xl border border-indigo-50">
                    <select
                      value={marksClassId}
                      onChange={(e) => setMarksClassId(e.target.value)}
                      className="w-full bg-white border border-indigo-100 rounded-xl px-3 py-2 text-xs font-bold text-[#1E1B4B] outline-none focus:border-[#5B21B6]"
                    >
                      <option value="">Select Class...</option>
                      {classes.map((c) => (
                        <option key={c.id} value={c.id}>{c.name} - {c.section}</option>
                      ))}
                    </select>
                    <select
                      value={marksExamId}
                      onChange={(e) => setMarksExamId(e.target.value)}
                      className="w-full bg-white border border-indigo-100 rounded-xl px-3 py-2 text-xs font-bold text-[#1E1B4B] outline-none focus:border-[#5B21B6]"
                    >
                      <option value="">Select Examination...</option>
                      {exams.map((e) => (
                        <option key={e.id} value={e.id}>{e.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="px-5 py-4 bg-[#F8FAFF] border-t border-indigo-50 flex gap-2.5">
                  <button
                    disabled={!marksClassId || !marksExamId}
                    onClick={() => downloadReport(`/api/reports/marks?classId=${marksClassId}&examId=${marksExamId}`, "Marks_Report.xlsx")}
                    className="flex-1 py-2.5 bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white border border-emerald-200 font-black text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed"
                  >
                    <FileDown className="w-3.5 h-3.5" /> Excel
                  </button>
                  <button
                    disabled={!marksClassId || !marksExamId}
                    onClick={() => downloadReport(`/api/reports/marks/pdf?classId=${marksClassId}&examId=${marksExamId}`, "Marks_Report.pdf", true)}
                    className="flex-1 py-2.5 bg-gradient-to-r from-[#5B21B6] to-[#7C3AED] hover:opacity-95 text-white font-black text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed"
                  >
                    <FileText className="w-3.5 h-3.5" /> PDF Report
                  </button>
                </div>
              </div>
            )}

            {/* 3. CLASS TOPPERS & MERIT LIST */}
            {isVisible("toppers") && (
              <div className="bg-white rounded-[24px] border border-[#DDD7F3] shadow-[0_6px_22px_-8px_rgba(79,70,229,0.1)] hover:shadow-md transition-all flex flex-col justify-between overflow-hidden">
                <div className="h-1.5 w-full bg-gradient-to-r from-[#5B21B6] to-[#7C3AED]" />
                <div className="p-5 sm:p-6 flex-1 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#F2EDFF] to-[#DDD2FF] border border-[#D8CEF6] text-[#5B21B6] flex items-center justify-center shrink-0">
                      <Award className="w-5 h-5" />
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full bg-[#F2EDFF] text-[#5B21B6] border border-[#DDD7F3] text-[10px] font-black uppercase tracking-wider">
                      Academic
                    </span>
                  </div>
                  <div>
                    <h4 className="font-black text-base text-[#1E1B4B]">School Toppers & Merit List</h4>
                    <p className="text-xs font-semibold text-slate-500 mt-1">
                      Export overall top rankers across all classes for any examination.
                    </p>
                  </div>
                  <div className="grid grid-cols-3 gap-2 bg-[#F8FAFF] p-3.5 rounded-2xl border border-indigo-50">
                    <select
                      value={topperExamId}
                      onChange={(e) => setTopperExamId(e.target.value)}
                      className="col-span-2 bg-white border border-indigo-100 rounded-xl px-3 py-2 text-xs font-bold text-[#1E1B4B] outline-none focus:border-[#5B21B6]"
                    >
                      <option value="">Select Exam...</option>
                      {exams.map((e) => (
                        <option key={e.id} value={e.id}>{e.name}</option>
                      ))}
                    </select>
                    <select
                      value={topperCount}
                      onChange={(e) => setTopperCount(e.target.value)}
                      className="col-span-1 bg-white border border-indigo-100 rounded-xl px-2.5 py-2 text-xs font-black text-[#5B21B6] outline-none focus:border-[#5B21B6]"
                    >
                      <option value="5">Top 5</option>
                      <option value="10">Top 10</option>
                      <option value="20">Top 20</option>
                      <option value="50">Top 50</option>
                    </select>
                  </div>
                </div>
                <div className="px-5 py-4 bg-[#F8FAFF] border-t border-indigo-50 flex gap-2.5">
                  <button
                    disabled={!topperExamId}
                    onClick={() => downloadReport(`/api/reports/toppers?examId=${topperExamId}&topN=${topperCount}`, `Class_Toppers_Top${topperCount}.xlsx`)}
                    className="w-full py-2.5 bg-gradient-to-r from-[#5B21B6] to-[#7C3AED] hover:opacity-95 text-white font-black text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed"
                  >
                    <FileDown className="w-3.5 h-3.5" /> Export Toppers Excel
                  </button>
                </div>
              </div>
            )}

            {/* 4. FEES TRANSACTION HISTORY */}
            {isVisible("fees") && (
              <div className="bg-white rounded-[24px] border border-[#DDD7F3] shadow-[0_6px_22px_-8px_rgba(79,70,229,0.1)] hover:shadow-md transition-all flex flex-col justify-between overflow-hidden">
                <div className="h-1.5 w-full bg-gradient-to-r from-indigo-500 to-blue-600" />
                <div className="p-5 sm:p-6 flex-1 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#EAF2FF] to-[#CBE0FF] border border-blue-200 text-blue-700 flex items-center justify-center shrink-0">
                      <Wallet className="w-5 h-5" />
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-black uppercase tracking-wider">
                      Finance
                    </span>
                  </div>
                  <div>
                    <h4 className="font-black text-base text-[#1E1B4B]">Fees Transaction History</h4>
                    <p className="text-xs font-semibold text-slate-500 mt-1">
                      Complete fee receipts, payment modes, components & revenue collections.
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 bg-[#F8FAFF] p-3.5 rounded-2xl border border-indigo-50">
                    <div>
                      <span className="text-[9px] font-black uppercase text-slate-400 block mb-1">From Date</span>
                      <input type="date" value={feeStartDate} onChange={(e) => setFeeStartDate(e.target.value)} className="w-full bg-white border border-indigo-100 rounded-xl px-2.5 py-1.5 text-[11px] font-bold text-slate-700 outline-none focus:border-[#5B21B6]" />
                    </div>
                    <div>
                      <span className="text-[9px] font-black uppercase text-slate-400 block mb-1">To Date</span>
                      <input type="date" value={feeEndDate} onChange={(e) => setFeeEndDate(e.target.value)} className="w-full bg-white border border-indigo-100 rounded-xl px-2.5 py-1.5 text-[11px] font-bold text-slate-700 outline-none focus:border-[#5B21B6]" />
                    </div>
                  </div>
                </div>
                <div className="px-5 py-4 bg-[#F8FAFF] border-t border-indigo-50 flex gap-2.5">
                  <button
                    onClick={() => {
                      const q = new URLSearchParams();
                      if (feeStartDate) q.set("startDate", feeStartDate);
                      if (feeEndDate) q.set("endDate", feeEndDate);
                      downloadReport(`/api/reports/fees?${q.toString()}`, "Fee_Report.xlsx");
                    }}
                    className="flex-1 py-2.5 bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white border border-emerald-200 font-black text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <FileDown className="w-3.5 h-3.5" /> Excel
                  </button>
                  <button
                    onClick={() => {
                      const q = new URLSearchParams();
                      if (feeStartDate) q.set("startDate", feeStartDate);
                      if (feeEndDate) q.set("endDate", feeEndDate);
                      downloadReport(`/api/reports/fees/pdf?${q.toString()}`, "Fee_Report.pdf", true);
                    }}
                    className="flex-1 py-2.5 bg-gradient-to-r from-[#5B21B6] to-[#7C3AED] hover:opacity-95 text-white font-black text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5" /> PDF Report
                  </button>
                </div>
              </div>
            )}

            {/* 5. FEE DEFAULTERS & PENDING DUES */}
            {isVisible("defaulters") && (
              <div className="bg-white rounded-[24px] border border-[#DDD7F3] shadow-[0_6px_22px_-8px_rgba(79,70,229,0.1)] hover:shadow-md transition-all flex flex-col justify-between overflow-hidden">
                <div className="h-1.5 w-full bg-gradient-to-r from-rose-500 to-pink-500" />
                <div className="p-5 sm:p-6 flex-1 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#FFEFEF] to-[#FFD2D7] border border-rose-200 text-rose-700 flex items-center justify-center shrink-0">
                      <AlertCircle className="w-5 h-5" />
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-black uppercase tracking-wider">
                      Finance
                    </span>
                  </div>
                  <div>
                    <h4 className="font-black text-base text-[#1E1B4B]">Fee Defaulters & Pending Dues</h4>
                    <p className="text-xs font-semibold text-slate-500 mt-1">
                      Outstanding fee balances sorted highest-first with parent contact info.
                    </p>
                  </div>
                  <div className="bg-[#F8FAFF] p-3.5 rounded-2xl border border-indigo-50">
                    <select
                      value={defaulterClassId}
                      onChange={(e) => setDefaulterClassId(e.target.value)}
                      className="w-full bg-white border border-indigo-100 rounded-xl px-3 py-2 text-xs font-bold text-[#1E1B4B] outline-none focus:border-[#5B21B6]"
                    >
                      <option value="">All Classes (School-Wide Dues)</option>
                      {classes.map((c) => (
                        <option key={c.id} value={c.id}>{c.name} - {c.section}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="px-5 py-4 bg-[#F8FAFF] border-t border-indigo-50 flex gap-2.5">
                  <button
                    onClick={() => downloadReport(`/api/reports/fee-defaulters?classId=${defaulterClassId}`, "Fee_Defaulters.xlsx")}
                    className="flex-1 py-2.5 bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white border border-emerald-200 font-black text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <FileDown className="w-3.5 h-3.5" /> Excel
                  </button>
                  <button
                    onClick={() => downloadReport(`/api/reports/fee-defaulters/pdf?classId=${defaulterClassId}`, "Fee_Defaulters.pdf", true)}
                    className="flex-1 py-2.5 bg-gradient-to-r from-[#5B21B6] to-[#7C3AED] hover:opacity-95 text-white font-black text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5" /> PDF Report
                  </button>
                </div>
              </div>
            )}

            {/* 6. STUDENTS ROSTER */}
            {isVisible("students") && (
              <div className="bg-white rounded-[24px] border border-[#DDD7F3] shadow-[0_6px_22px_-8px_rgba(79,70,229,0.1)] hover:shadow-md transition-all flex flex-col justify-between overflow-hidden">
                <div className="h-1.5 w-full bg-gradient-to-r from-cyan-500 to-teal-500" />
                <div className="p-5 sm:p-6 flex-1 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#ECFEFF] to-[#CFFAFE] border border-cyan-200 text-cyan-700 flex items-center justify-center shrink-0">
                      <Users className="w-5 h-5" />
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full bg-cyan-50 text-cyan-800 border border-cyan-200 text-[10px] font-black uppercase tracking-wider">
                      Directory
                    </span>
                  </div>
                  <div>
                    <h4 className="font-black text-base text-[#1E1B4B]">Students Roster Directory</h4>
                    <p className="text-xs font-semibold text-slate-500 mt-1">
                      Complete student profiles with Roll No, Aadhar, PEN, DOB & parent details.
                    </p>
                  </div>
                  <div className="bg-[#F8FAFF] p-3.5 rounded-2xl border border-indigo-50">
                    <select
                      value={studentClassId}
                      onChange={(e) => setStudentClassId(e.target.value)}
                      className="w-full bg-white border border-indigo-100 rounded-xl px-3 py-2 text-xs font-bold text-[#1E1B4B] outline-none focus:border-[#5B21B6]"
                    >
                      <option value="">All Classes</option>
                      {classes.map((c) => (
                        <option key={c.id} value={c.id}>{c.name} - {c.section}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="px-5 py-4 bg-[#F8FAFF] border-t border-indigo-50 flex gap-2.5">
                  <button
                    onClick={() => downloadReport(`/api/reports/students?classId=${studentClassId}`, "Student_Report.xlsx")}
                    className="flex-1 py-2.5 bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white border border-emerald-200 font-black text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <FileDown className="w-3.5 h-3.5" /> Excel
                  </button>
                  <button
                    onClick={() => downloadReport(`/api/reports/students/pdf?classId=${studentClassId}`, "Student_Report.pdf", true)}
                    className="flex-1 py-2.5 bg-gradient-to-r from-[#5B21B6] to-[#7C3AED] hover:opacity-95 text-white font-black text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5" /> PDF Report
                  </button>
                </div>
              </div>
            )}

            {/* 7. STAFF ATTENDANCE LEDGER */}
            {isVisible("staff-att") && (
              <div className="bg-white rounded-[24px] border border-[#DDD7F3] shadow-[0_6px_22px_-8px_rgba(79,70,229,0.1)] hover:shadow-md transition-all flex flex-col justify-between overflow-hidden">
                <div className="h-1.5 w-full bg-gradient-to-r from-orange-500 to-amber-500" />
                <div className="p-5 sm:p-6 flex-1 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#FFF7ED] to-[#FED7AA] border border-orange-200 text-orange-700 flex items-center justify-center shrink-0">
                      <UserCheck className="w-5 h-5" />
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full bg-orange-50 text-orange-700 border border-orange-200 text-[10px] font-black uppercase tracking-wider">
                      HR & Staff
                    </span>
                  </div>
                  <div>
                    <h4 className="font-black text-base text-[#1E1B4B]">Staff Attendance Ledger</h4>
                    <p className="text-xs font-semibold text-slate-500 mt-1">
                      Monthly faculty attendance totals: present, absent, late, half-days & rate.
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 bg-[#F8FAFF] p-3.5 rounded-2xl border border-indigo-50">
                    <select
                      value={staffMonth}
                      onChange={(e) => setStaffMonth(e.target.value)}
                      className="bg-white border border-indigo-100 rounded-xl px-3 py-2 text-xs font-bold text-[#1E1B4B] outline-none focus:border-[#5B21B6]"
                    >
                      {monthNames.map((mName, idx) => (
                        <option key={mName} value={String(idx + 1)}>{mName}</option>
                      ))}
                    </select>
                    <input
                      type="number"
                      min={2020}
                      max={2035}
                      value={staffYear}
                      onChange={(e) => setStaffYear(e.target.value)}
                      className="bg-white border border-indigo-100 rounded-xl px-3 py-2 text-xs font-bold text-[#1E1B4B] outline-none focus:border-[#5B21B6]"
                    />
                  </div>
                </div>
                <div className="px-5 py-4 bg-[#F8FAFF] border-t border-indigo-50 flex gap-2.5">
                  <button
                    onClick={() => downloadReport(`/api/reports/staff-attendance?month=${staffMonth}&year=${staffYear}`, `Staff_Attendance_${staffYear}_${staffMonth}.xlsx`)}
                    className="flex-1 py-2.5 bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white border border-emerald-200 font-black text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <FileDown className="w-3.5 h-3.5" /> Excel
                  </button>
                  <button
                    onClick={() => downloadReport(`/api/reports/staff-attendance/pdf?month=${staffMonth}&year=${staffYear}`, `Staff_Attendance_${staffYear}_${staffMonth}.pdf`, true)}
                    className="flex-1 py-2.5 bg-gradient-to-r from-[#5B21B6] to-[#7C3AED] hover:opacity-95 text-white font-black text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5" /> PDF Report
                  </button>
                </div>
              </div>
            )}

            {/* 8. ADMISSIONS SUMMARY */}
            {isVisible("admissions") && (
              <div className="bg-white rounded-[24px] border border-[#DDD7F3] shadow-[0_6px_22px_-8px_rgba(79,70,229,0.1)] hover:shadow-md transition-all flex flex-col justify-between overflow-hidden">
                <div className="h-1.5 w-full bg-gradient-to-r from-emerald-500 to-green-600" />
                <div className="p-5 sm:p-6 flex-1 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#ECFDF5] to-[#D1FAE5] border border-emerald-200 text-emerald-700 flex items-center justify-center shrink-0">
                      <UserPlus className="w-5 h-5" />
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-black uppercase tracking-wider">
                      Admissions
                    </span>
                  </div>
                  <div>
                    <h4 className="font-black text-base text-[#1E1B4B]">Admission Summary Report</h4>
                    <p className="text-xs font-semibold text-slate-500 mt-1">
                      Admission registrations, applied classes, parent contacts & fee statuses.
                    </p>
                  </div>
                  <div className="bg-[#F8FAFF] p-3.5 rounded-2xl border border-indigo-50">
                    <input
                      type="text"
                      value={admissionYear}
                      onChange={(e) => setAdmissionYear(e.target.value)}
                      placeholder="Academic Year (optional, e.g. 2026-2027)"
                      className="w-full bg-white border border-indigo-100 rounded-xl px-3 py-2 text-xs font-bold text-[#1E1B4B] outline-none focus:border-[#5B21B6]"
                    />
                  </div>
                </div>
                <div className="px-5 py-4 bg-[#F8FAFF] border-t border-indigo-50 flex gap-2.5">
                  <button
                    onClick={() => downloadReport(`/api/reports/admissions${admissionYear ? `?academicYear=${encodeURIComponent(admissionYear)}` : ""}`, "Admission_Summary.xlsx")}
                    className="flex-1 py-2.5 bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white border border-emerald-200 font-black text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <FileDown className="w-3.5 h-3.5" /> Excel
                  </button>
                  <button
                    onClick={() => downloadReport(`/api/reports/admissions/pdf${admissionYear ? `?academicYear=${encodeURIComponent(admissionYear)}` : ""}`, "Admission_Summary.pdf", true)}
                    className="flex-1 py-2.5 bg-gradient-to-r from-[#5B21B6] to-[#7C3AED] hover:opacity-95 text-white font-black text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5" /> PDF Report
                  </button>
                </div>
              </div>
            )}

            {/* 9. GATE PASS ACTIVITY LOG */}
            {isVisible("gatepass") && (
              <div className="bg-white rounded-[24px] border border-[#DDD7F3] shadow-[0_6px_22px_-8px_rgba(79,70,229,0.1)] hover:shadow-md transition-all flex flex-col justify-between overflow-hidden">
                <div className="h-1.5 w-full bg-gradient-to-r from-sky-500 to-indigo-500" />
                <div className="p-5 sm:p-6 flex-1 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#EFF6FF] to-[#DBEAFE] border border-sky-200 text-sky-700 flex items-center justify-center shrink-0">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200 text-[10px] font-black uppercase tracking-wider">
                      Campus Log
                    </span>
                  </div>
                  <div>
                    <h4 className="font-black text-base text-[#1E1B4B]">Gate Pass Activity Log</h4>
                    <p className="text-xs font-semibold text-slate-500 mt-1">
                      Student campus exit/entry logs with reasons, approval statuses & timestamps.
                    </p>
                  </div>
                  <div className="space-y-2 bg-[#F8FAFF] p-3.5 rounded-2xl border border-indigo-50">
                    <select
                      value={gatePassClassId}
                      onChange={(e) => setGatePassClassId(e.target.value)}
                      className="w-full bg-white border border-indigo-100 rounded-xl px-3 py-2 text-xs font-bold text-[#1E1B4B] outline-none focus:border-[#5B21B6]"
                    >
                      <option value="">All Classes</option>
                      {classes.map((c) => (
                        <option key={c.id} value={c.id}>{c.name} - {c.section}</option>
                      ))}
                    </select>
                    <div className="grid grid-cols-2 gap-2">
                      <input type="date" value={gateStartDate} onChange={(e) => setGateStartDate(e.target.value)} className="w-full bg-white border border-indigo-100 rounded-xl px-2.5 py-1.5 text-[11px] font-bold text-slate-700 outline-none focus:border-[#5B21B6]" />
                      <input type="date" value={gateEndDate} onChange={(e) => setGateEndDate(e.target.value)} className="w-full bg-white border border-indigo-100 rounded-xl px-2.5 py-1.5 text-[11px] font-bold text-slate-700 outline-none focus:border-[#5B21B6]" />
                    </div>
                  </div>
                </div>
                <div className="px-5 py-4 bg-[#F8FAFF] border-t border-indigo-50 flex gap-2.5">
                  <button
                    onClick={() => downloadReport(`/api/reports/gate-pass?classId=${gatePassClassId}&startDate=${gateStartDate}&endDate=${gateEndDate}`, "Gate_Pass_Log.xlsx")}
                    className="w-full py-2.5 bg-gradient-to-r from-[#5B21B6] to-[#7C3AED] hover:opacity-95 text-white font-black text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
                  >
                    <FileDown className="w-3.5 h-3.5" /> Export Excel Log
                  </button>
                </div>
              </div>
            )}
          </div>

          {visibleCount === 0 && (
            <div className="bg-white rounded-[24px] border border-dashed border-[#DDD7F3] p-14 text-center">
              <BarChart3 className="w-12 h-12 text-indigo-200 mx-auto mb-3" />
              <h3 className="text-base font-black text-[#1E1B4B]">No Matching Reports Found</h3>
              <p className="text-xs font-semibold text-slate-500 mt-1">Clear your search filter to view all 9 live export reports.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
