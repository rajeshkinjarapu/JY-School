import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import api from "../../api/axios";
import {
  Calendar,
  CheckCircle,
  Clock,
  XCircle,
  Briefcase,
  FileText,
  RefreshCw,
  CalendarCheck2,
  ClipboardList,
} from "lucide-react";
import toast from "react-hot-toast";
import LeaveTypeTab from "./tabs/LeaveTypeTab";
import LeaveRequestTab from "./tabs/LeaveRequestTab";
import { PageHeader } from "../../components/UI/PageHeader";

export interface LeaveBalanceData {
  casualTotal?: number;
  casualUsed?: number;
  sickTotal?: number;
  sickUsed?: number;
  earnedTotal?: number;
  earnedUsed?: number;
}

const LeaveDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === "SUPER_ADMIN" || user?.role === "ADMIN";

  const [activeTab, setActiveTab] = useState<"requests" | "types">("requests");
  const [requests, setRequests] = useState<any[]>([]);
  const [balance, setBalance] = useState<LeaveBalanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<"ALL" | "PENDING" | "APPROVED" | "REJECTED">("ALL");

  const fetchLeaves = async () => {
    setLoading(true);
    try {
      if (isAdmin) {
        const res: any = await api.get("/api/leave?limit=5000");
        const list = Array.isArray(res) ? res : res?.data?.data || res?.data || [];
        setRequests(list);
      } else {
        const res: any = await api.get("/api/leave/my-leaves");
        const payload = res?.data?.data || res?.data || res || {};
        setRequests(Array.isArray(payload.leaves) ? payload.leaves : []);
        if (payload.balance) setBalance(payload.balance);
      }
    } catch (err) {
      console.error("Failed to fetch leaves:", err);
      toast.error("Failed to load leave records");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, [isAdmin]);

  const metrics = useMemo(() => {
    let pending = 0;
    let approved = 0;
    let rejected = 0;
    let activeToday = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    requests.forEach((r) => {
      const st = (r.status || "").toUpperCase();
      if (st === "PENDING") pending++;
      else if (st === "APPROVED") {
        approved++;
        if (r.startDate) {
          const start = new Date(r.startDate);
          start.setHours(0, 0, 0, 0);
          const end = r.endDate ? new Date(r.endDate) : new Date(r.startDate);
          end.setHours(23, 59, 59, 999);
          if (today >= start && today <= end) activeToday++;
        }
      } else if (st === "REJECTED") rejected++;
    });

    return {
      total: requests.length,
      pending,
      approved,
      rejected,
      activeToday,
    };
  }, [requests]);

  return (
    <div className="flex flex-col h-full bg-[#F4F7FC] animate-fade-in" style={{ minHeight: "calc(100vh - 64px)" }}>
      <PageHeader
        title="Leave Management Dashboard"
        icon={<Calendar className="w-5 h-5" />}
        action={
          <button
            type="button"
            onClick={fetchLeaves}
            className="px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 border border-white/25 text-white text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
        }
      />

      <div className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
        <div className="max-w-7xl mx-auto space-y-6">

          {/* ══ 4 GLOSSY LIGHT PASTEL KPI CARDS ══ */}
          {isAdmin ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-5">
              <div
                onClick={() => { setActiveTab("requests"); setStatusFilter("ALL"); }}
                className="bg-gradient-to-br from-[#F2EDFF] to-[#DDD2FF] border border-[#D8CEF6] rounded-[22px] p-4 sm:p-5 flex items-center justify-between gap-3 shadow-xs cursor-pointer hover:-translate-y-0.5 transition-all"
              >
                <div>
                  <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-[#5B21B6] block">
                    Total Requests
                  </span>
                  <span className="text-2xl sm:text-3xl font-black text-[#1E1B4B] mt-1 block">
                    {metrics.total}
                  </span>
                  <span className="text-[11px] font-bold text-slate-600 mt-0.5 block">
                    {metrics.activeToday} On Leave Today
                  </span>
                </div>
                <div className="w-11 h-11 rounded-2xl bg-[#5B21B6] text-white flex items-center justify-center shadow-sm shrink-0">
                  <ClipboardList className="w-5 h-5" />
                </div>
              </div>

              <div
                onClick={() => { setActiveTab("requests"); setStatusFilter("PENDING"); }}
                className="bg-gradient-to-br from-[#FFF6E5] to-[#FFE4B8] border border-amber-200 rounded-[22px] p-4 sm:p-5 flex items-center justify-between gap-3 shadow-xs cursor-pointer hover:-translate-y-0.5 transition-all"
              >
                <div>
                  <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-amber-800 block">
                    Pending Review
                  </span>
                  <span className="text-2xl sm:text-3xl font-black text-amber-950 mt-1 block">
                    {metrics.pending}
                  </span>
                  <span className="text-[11px] font-bold text-amber-800/80 mt-0.5 block">
                    Awaiting approval
                  </span>
                </div>
                <div className="w-11 h-11 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-sm shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
              </div>

              <div
                onClick={() => { setActiveTab("requests"); setStatusFilter("APPROVED"); }}
                className="bg-gradient-to-br from-[#E5FAEF] to-[#C2F2D9] border border-emerald-200 rounded-[22px] p-4 sm:p-5 flex items-center justify-between gap-3 shadow-xs cursor-pointer hover:-translate-y-0.5 transition-all"
              >
                <div>
                  <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-emerald-700 block">
                    Approved Leaves
                  </span>
                  <span className="text-2xl sm:text-3xl font-black text-emerald-950 mt-1 block">
                    {metrics.approved}
                  </span>
                  <span className="text-[11px] font-bold text-emerald-800/80 mt-0.5 block">
                    Sanctioned records
                  </span>
                </div>
                <div className="w-11 h-11 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-sm shrink-0">
                  <CheckCircle className="w-5 h-5" />
                </div>
              </div>

              <div
                onClick={() => { setActiveTab("requests"); setStatusFilter("REJECTED"); }}
                className="bg-gradient-to-br from-[#FFEFEF] to-[#FFD2D7] border border-rose-200 rounded-[22px] p-4 sm:p-5 flex items-center justify-between gap-3 shadow-xs cursor-pointer hover:-translate-y-0.5 transition-all"
              >
                <div>
                  <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-rose-700 block">
                    Rejected
                  </span>
                  <span className="text-2xl sm:text-3xl font-black text-rose-950 mt-1 block">
                    {metrics.rejected}
                  </span>
                  <span className="text-[11px] font-bold text-rose-800/80 mt-0.5 block">
                    Declined requests
                  </span>
                </div>
                <div className="w-11 h-11 rounded-2xl bg-rose-500 text-white flex items-center justify-center shadow-sm shrink-0">
                  <XCircle className="w-5 h-5" />
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-5">
              <div className="bg-gradient-to-br from-[#F2EDFF] to-[#DDD2FF] border border-[#D8CEF6] rounded-[22px] p-4 sm:p-5 flex items-center justify-between gap-3 shadow-xs">
                <div>
                  <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-[#5B21B6] block">Casual Balance</span>
                  <span className="text-2xl sm:text-3xl font-black text-[#1E1B4B] mt-1 block">
                    {Math.max(0, (balance?.casualTotal ?? 12) - (balance?.casualUsed ?? 0))}
                  </span>
                  <span className="text-[11px] font-bold text-slate-600 mt-0.5 block">Used: {balance?.casualUsed ?? 0} / {balance?.casualTotal ?? 12}</span>
                </div>
                <div className="w-11 h-11 rounded-2xl bg-[#5B21B6] text-white flex items-center justify-center shadow-sm shrink-0">
                  <CalendarCheck2 className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-gradient-to-br from-[#EAF2FF] to-[#CBE0FF] border border-blue-200 rounded-[22px] p-4 sm:p-5 flex items-center justify-between gap-3 shadow-xs">
                <div>
                  <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-blue-800 block">Sick Balance</span>
                  <span className="text-2xl sm:text-3xl font-black text-blue-950 mt-1 block">
                    {Math.max(0, (balance?.sickTotal ?? 10) - (balance?.sickUsed ?? 0))}
                  </span>
                  <span className="text-[11px] font-bold text-blue-800/80 mt-0.5 block">Used: {balance?.sickUsed ?? 0} / {balance?.sickTotal ?? 10}</span>
                </div>
                <div className="w-11 h-11 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-sm shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-gradient-to-br from-[#E5FAEF] to-[#C2F2D9] border border-emerald-200 rounded-[22px] p-4 sm:p-5 flex items-center justify-between gap-3 shadow-xs">
                <div>
                  <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-emerald-700 block">Earned Balance</span>
                  <span className="text-2xl sm:text-3xl font-black text-emerald-950 mt-1 block">
                    {Math.max(0, (balance?.earnedTotal ?? 15) - (balance?.earnedUsed ?? 0))}
                  </span>
                  <span className="text-[11px] font-bold text-emerald-800/80 mt-0.5 block">Used: {balance?.earnedUsed ?? 0} / {balance?.earnedTotal ?? 15}</span>
                </div>
                <div className="w-11 h-11 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-sm shrink-0">
                  <CheckCircle className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-gradient-to-br from-[#FFF6E5] to-[#FFE4B8] border border-amber-200 rounded-[22px] p-4 sm:p-5 flex items-center justify-between gap-3 shadow-xs">
                <div>
                  <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-amber-800 block">My Pending</span>
                  <span className="text-2xl sm:text-3xl font-black text-amber-950 mt-1 block">{metrics.pending}</span>
                  <span className="text-[11px] font-bold text-amber-800/80 mt-0.5 block">Approved: {metrics.approved}</span>
                </div>
                <div className="w-11 h-11 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-sm shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
              </div>
            </div>
          )}

          {/* ══ UNIFIED ERP PILL TAB BAR ══ */}
          <div className="bg-white rounded-[20px] border border-[#DDD7F3] shadow-[0_4px_18px_-6px_rgba(79,70,229,0.1)] p-2 flex items-center gap-2 overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveTab("requests")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer shrink-0 ${activeTab === "requests"
                ? "bg-gradient-to-r from-[#5B21B6] to-[#7C3AED] text-white shadow-sm shadow-indigo-500/25"
                : "text-slate-600 hover:bg-[#F8FAFF] hover:text-[#5B21B6]"
                }`}
            >
              <FileText className="w-4 h-4" />
              <span>Leave Requests ({requests.length})</span>
            </button>

            {isAdmin && (
              <button
                type="button"
                onClick={() => setActiveTab("types")}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer shrink-0 ${activeTab === "types"
                  ? "bg-gradient-to-r from-[#5B21B6] to-[#7C3AED] text-white shadow-sm shadow-indigo-500/25"
                  : "text-slate-600 hover:bg-[#F8FAFF] hover:text-[#5B21B6]"
                  }`}
              >
                <Briefcase className="w-4 h-4" />
                <span>Leave Types & Policies</span>
              </button>
            )}
          </div>

          {/* ══ TAB CONTENT ══ */}
          {activeTab === "requests" && (
            <LeaveRequestTab
              requests={requests}
              loading={loading}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              onRefresh={fetchLeaves}
            />
          )}

          {activeTab === "types" && isAdmin && <LeaveTypeTab />}
        </div>
      </div>
    </div>
  );
};

export default LeaveDashboardPage;
