import React, { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  Download,
  X,
  CalendarDays,
  Sparkles,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../../api/axios";
import { useAuth } from "../../../hooks/useAuth";
import { LoadingSpinner } from "../../../components/UI/LoadingSpinner";

interface LeaveRequestTabProps {
  requests: any[];
  loading: boolean;
  statusFilter: "ALL" | "PENDING" | "APPROVED" | "REJECTED";
  setStatusFilter: (val: "ALL" | "PENDING" | "APPROVED" | "REJECTED") => void;
  onRefresh: () => void;
}

const calcLeaveDays = (startDate?: string, endDate?: string | null) => {
  if (!startDate) return 1;
  const s = new Date(startDate);
  const e = endDate ? new Date(endDate) : new Date(startDate);
  if (isNaN(s.getTime()) || isNaN(e.getTime())) return 1;
  const diff = Math.round((e.setHours(0, 0, 0, 0) - s.setHours(0, 0, 0, 0)) / (1000 * 3600 * 24)) + 1;
  return Math.max(1, diff);
};

const mapToBackendType = (labelOrCode: string) => {
  const up = (labelOrCode || "").toUpperCase();
  if (up.includes("SICK") || up.includes("HEALTH") || up.includes("MEDICAL")) return "SICK";
  if (up.includes("EARNED") || up.includes("PRIVILEGE")) return "EARNED";
  return "CASUAL";
};

const LeaveRequestTab: React.FC<LeaveRequestTabProps> = ({
  requests,
  loading,
  statusFilter,
  setStatusFilter,
  onRefresh,
}) => {
  const { user } = useAuth();
  const isAdmin = user?.role === "SUPER_ADMIN" || user?.role === "ADMIN";

  const [teachers, setTeachers] = useState<any[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");

  // Apply / Create Modal
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formUserId, setFormUserId] = useState("");
  const [formType, setFormType] = useState("CASUAL");
  const [formStartDate, setFormStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [formEndDate, setFormEndDate] = useState(new Date().toISOString().split("T")[0]);
  const [formReason, setFormReason] = useState("");

  // Rejection Reason Modal
  const [rejectTarget, setRejectTarget] = useState<any | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  useEffect(() => {
    const storedTypes = localStorage.getItem("fin_leave_types");
    const defaults = [
      { id: "1", name: "Casual Leave", code: "CASUAL" },
      { id: "2", name: "Sick Leave", code: "SICK" },
      { id: "3", name: "Earned Leave", code: "EARNED" },
    ];
    try {
      const parsed = storedTypes ? JSON.parse(storedTypes) : defaults;
      setLeaveTypes(parsed.length ? parsed : defaults);
    } catch {
      setLeaveTypes(defaults);
    }

    if (isAdmin) {
      api
        .get("/api/teachers?limit=500")
        .then((res: any) => {
          const list = Array.isArray(res) ? res : res?.data?.data || res?.data || [];
          setTeachers(list);
          if (list.length > 0) {
            setFormUserId(list[0].userId || list[0].user?.id || "");
          }
        })
        .catch(() => { });
    }
  }, [isAdmin]);

  const filteredRequests = useMemo(() => {
    return requests.filter((r) => {
      const st = (r.status || "PENDING").toUpperCase();
      const matchesStatus = statusFilter === "ALL" || st === statusFilter;
      const tVal = (r.type || r.typeName || "").toUpperCase();
      const matchesType = typeFilter === "ALL" || tVal === typeFilter;
      const q = searchQuery.trim().toLowerCase();
      const applicantName = (r.requester?.name || r.applicant || "").toLowerCase();
      const reasonTxt = (r.reason || "").toLowerCase();
      const matchesQ = !q || applicantName.includes(q) || reasonTxt.includes(q);
      return matchesStatus && matchesType && matchesQ;
    });
  }, [requests, statusFilter, typeFilter, searchQuery]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formStartDate || !formReason.trim()) {
      toast.error("Start date and reason are required.");
      return;
    }
    if (formEndDate && formEndDate < formStartDate) {
      toast.error("End date cannot be before start date.");
      return;
    }

    setSubmitting(true);
    try {
      const payload: any = {
        type: mapToBackendType(formType),
        startDate: formStartDate,
        endDate: formEndDate || formStartDate,
        reason: formReason.trim(),
      };
      if (isAdmin && formUserId) {
        payload.userId = formUserId;
      }

      await api.post("/api/leave/apply", payload);
      toast.success("Leave request submitted successfully!");
      setShowModal(false);
      setFormReason("");
      onRefresh();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err.message || "Failed to apply leave");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: "APPROVED" | "REJECTED", reason?: string) => {
    try {
      await api.put(`/api/leave/${id}/status`, {
        status: newStatus,
        ...(reason ? { rejectionReason: reason } : {}),
      });
      toast.success(`Leave request ${newStatus.toLowerCase()}!`);
      setRejectTarget(null);
      setRejectReason("");
      onRefresh();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err.message || "Failed to update status");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to permanently delete this leave record?")) return;
    try {
      await api.delete(`/api/leave/${id}`);
      toast.success("Leave record deleted.");
      onRefresh();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err.message || "Failed to delete leave");
    }
  };

  const handleExportCSV = () => {
    const headers = ["Applicant", "Role", "Type", "Start Date", "End Date", "Days", "Reason", "Status"];
    const rows = filteredRequests.map((r) => [
      r.requester?.name || r.applicant || "",
      r.requester?.role || "",
      r.type || r.typeName || "",
      r.startDate ? new Date(r.startDate).toLocaleDateString() : "",
      r.endDate ? new Date(r.endDate).toLocaleDateString() : "",
      String(calcLeaveDays(r.startDate, r.endDate)),
      r.reason || "",
      (r.status || "").toUpperCase(),
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `leave-requests-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Leave report exported!");
  };

  return (
    <div className="space-y-4">
      {/* ══ SEARCH, FILTER & ACTION TOOLBAR ══ */}
      <div className="bg-white rounded-[22px] border border-[#DDD7F3] shadow-[0_6px_22px_-8px_rgba(79,70,229,0.1)] p-4 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3.5">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search applicant or reason..."
              className="w-full pl-10 pr-4 py-2 bg-[#F8FAFF] border border-indigo-100 rounded-xl text-xs font-bold text-[#1E1B4B] outline-none focus:border-[#5B21B6]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1 bg-[#F8FAFF] p-1 rounded-xl border border-indigo-100">
            {(["ALL", "PENDING", "APPROVED", "REJECTED"] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-black transition-all cursor-pointer ${statusFilter === st
                  ? "bg-[#5B21B6] text-white shadow-xs"
                  : "text-slate-600 hover:text-[#5B21B6]"
                  }`}
              >
                {st === "ALL" ? "All" : st.charAt(0) + st.slice(1).toLowerCase()}
              </button>
            ))}
          </div>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-[#F8FAFF] border border-indigo-100 rounded-xl px-3 py-2 text-xs font-bold text-[#1E1B4B] outline-none focus:border-[#5B21B6] cursor-pointer"
          >
            <option value="ALL">All Leave Types</option>
            <option value="CASUAL">Casual Leave</option>
            <option value="SICK">Sick Leave</option>
            <option value="EARNED">Earned Leave</option>
          </select>
        </div>

        <div className="flex items-center gap-2 justify-end">
          <button
            type="button"
            onClick={handleExportCSV}
            className="px-3.5 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-black flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <Download className="w-3.5 h-3.5" /> CSV
          </button>
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="bg-gradient-to-r from-[#5B21B6] to-[#7C3AED] hover:opacity-95 text-white font-black text-xs px-4 py-2.5 rounded-xl shadow-md shadow-indigo-500/20 flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Request Leave
          </button>
        </div>
      </div>

      {/* ══ TABLE & MOBILE CARDS ══ */}
      <div className="bg-white rounded-[24px] border border-[#DDD7F3] shadow-[0_6px_22px_-8px_rgba(79,70,229,0.1)] overflow-hidden">
        {loading ? (
          <LoadingSpinner size="lg" className="py-16" />
        ) : (
          <>
            {/* Mobile Card List */}
            <div className="md:hidden p-4 space-y-3">
              {filteredRequests.map((r) => {
                const statusUpper = (r.status || "PENDING").toUpperCase();
                const days = calcLeaveDays(r.startDate, r.endDate);
                return (
                  <div key={r.id} className="p-4 rounded-2xl bg-[#F8FAFF] border border-indigo-100 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-black text-sm text-[#1E1B4B]">{r.requester?.name || r.applicant}</div>
                        <span className="text-[10px] font-black uppercase text-[#5B21B6]">{r.type || r.typeName} · {days} Day(s)</span>
                      </div>
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black border ${statusUpper === "APPROVED"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : statusUpper === "REJECTED"
                            ? "bg-rose-50 text-rose-700 border-rose-200"
                            : "bg-amber-50 text-amber-800 border-amber-200"
                          }`}
                      >
                        {statusUpper}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-slate-600">{r.reason}</p>
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 pt-2 border-t border-indigo-100">
                      <span>
                        {new Date(r.startDate).toLocaleDateString()} {r.endDate ? `→ ${new Date(r.endDate).toLocaleDateString()}` : ""}
                      </span>
                      {isAdmin && (
                        <div className="flex items-center gap-1.5">
                          {statusUpper === "PENDING" && (
                            <>
                              <button onClick={() => handleUpdateStatus(r.id, "APPROVED")} className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg text-[10px] font-black">Approve</button>
                              <button onClick={() => setRejectTarget(r)} className="px-2.5 py-1 bg-rose-500 text-white rounded-lg text-[10px] font-black">Reject</button>
                            </>
                          )}
                          <button onClick={() => handleDelete(r.id)} className="p-1.5 bg-white text-rose-500 border border-rose-200 rounded-lg">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              {filteredRequests.length === 0 && (
                <div className="py-10 text-center text-xs font-bold text-slate-400">No matching leave requests found.</div>
              )}
            </div>

            {/* Desktop Purple Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="student-grid-table w-full text-sm text-left border-collapse">
                <thead>
                  <tr className="bg-gradient-to-r from-[#7D3CEF] via-[#6D38EA] to-[#5B21B6]">
                    <th className="py-3.5 px-4 font-black !text-white text-xs uppercase tracking-wider">Applicant</th>
                    <th className="py-3.5 px-4 font-black !text-white text-xs uppercase tracking-wider">Leave Type</th>
                    <th className="py-3.5 px-4 font-black !text-white text-xs uppercase tracking-wider">Dates & Days</th>
                    <th className="py-3.5 px-4 font-black !text-white text-xs uppercase tracking-wider">Reason</th>
                    <th className="py-3.5 px-4 font-black !text-white text-xs uppercase tracking-wider">Status</th>
                    <th className="py-3.5 px-4 font-black !text-white text-xs uppercase tracking-wider text-right">
                      {isAdmin ? "Actions" : "Updated"}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-indigo-50">
                  {filteredRequests.map((r) => {
                    const statusUpper = (r.status || "PENDING").toUpperCase();
                    const days = calcLeaveDays(r.startDate, r.endDate);
                    const name = r.requester?.name || r.applicant || "Staff";
                    return (
                      <tr key={r.id} className="hover:bg-[#F8FAFF] transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#F2EDFF] to-[#DDD2FF] border border-[#DDD7F3] text-[#5B21B6] font-black text-xs flex items-center justify-center shrink-0">
                              {name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-black text-[#1E1B4B] text-sm">{name}</div>
                              {r.requester?.role && (
                                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                                  {r.requester.role}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="px-2.5 py-1 rounded-lg bg-[#F2EDFF] text-[#5B21B6] border border-[#DDD7F3] text-[11px] font-black uppercase">
                            {r.type || r.typeName}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="text-xs font-bold text-[#1E1B4B] flex items-center gap-1.5">
                            <CalendarDays className="w-3.5 h-3.5 text-indigo-400" />
                            <span>
                              {new Date(r.startDate).toLocaleDateString()}
                              {r.endDate ? ` – ${new Date(r.endDate).toLocaleDateString()}` : ""}
                            </span>
                          </div>
                          <span className="inline-block mt-1 px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 text-[10px] font-black">
                            {days} {days === 1 ? "Day" : "Days"}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 max-w-[240px]">
                          <p className="text-xs font-semibold text-slate-600 line-clamp-2" title={r.reason}>
                            {r.reason}
                          </p>
                          {r.rejectionReason && statusUpper === "REJECTED" && (
                            <p className="text-[10px] font-bold text-rose-600 mt-0.5">
                              Note: {r.rejectionReason}
                            </p>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${statusUpper === "APPROVED"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : statusUpper === "REJECTED"
                                ? "bg-rose-50 text-rose-700 border-rose-200"
                                : "bg-amber-50 text-amber-800 border-amber-200"
                              }`}
                          >
                            {statusUpper === "APPROVED" && <CheckCircle className="w-3 h-3" />}
                            {statusUpper === "REJECTED" && <XCircle className="w-3 h-3" />}
                            {statusUpper === "PENDING" && <Clock className="w-3 h-3" />}
                            {statusUpper}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          {isAdmin ? (
                            <div className="inline-flex items-center gap-1.5">
                              {statusUpper === "PENDING" && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateStatus(r.id, "APPROVED")}
                                    className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white border border-emerald-200 rounded-xl text-[11px] font-black transition-all cursor-pointer"
                                  >
                                    Approve
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setRejectTarget(r)}
                                    className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-500 text-rose-700 hover:text-white border border-rose-200 rounded-xl text-[11px] font-black transition-all cursor-pointer"
                                  >
                                    Reject
                                  </button>
                                </>
                              )}
                              <button
                                type="button"
                                onClick={() => handleDelete(r.id)}
                                className="p-2 rounded-xl bg-[#F8FAFF] hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-indigo-100 transition-colors cursor-pointer"
                                title="Delete Request"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <span className="text-[11px] font-semibold text-slate-400">
                              {r.createdAt ? new Date(r.createdAt).toLocaleDateString() : "—"}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {filteredRequests.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-14 text-center text-slate-400 font-bold text-sm">
                        No leave requests match your selected filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* ══ APPLY / CREATE LEAVE MODAL ══ */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-[26px] border border-[#DDD7F3] shadow-2xl max-w-md w-full overflow-hidden">
            <div className="bg-gradient-to-r from-[#5B21B6] to-[#7C3AED] px-6 py-4 text-white flex items-center justify-between">
              <h4 className="text-base font-black flex items-center gap-2">
                <Sparkles className="w-5 h-5" /> Submit Leave Request
              </h4>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-xl bg-white/15 hover:bg-white/25 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-6 space-y-4 bg-[#F8FAFF]">
              {isAdmin && (
                <div>
                  <label className="block text-[11px] font-black text-slate-600 uppercase tracking-wider mb-1.5">Applicant (Staff Member)</label>
                  <select
                    className="w-full px-4 py-2.5 bg-white border border-indigo-100 rounded-xl text-sm font-bold text-[#1E1B4B] outline-none focus:border-[#5B21B6]"
                    value={formUserId}
                    onChange={(e) => setFormUserId(e.target.value)}
                    required
                  >
                    <option value="">Select Teacher...</option>
                    {teachers.map((t) => (
                      <option key={t.id} value={t.userId || t.user?.id || ""}>
                        {t.user?.name} ({t.employeeId || "Staff"})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-black text-slate-600 uppercase tracking-wider mb-1.5">Leave Type</label>
                <select
                  className="w-full px-4 py-2.5 bg-white border border-indigo-100 rounded-xl text-sm font-bold text-[#1E1B4B] outline-none focus:border-[#5B21B6]"
                  value={formType}
                  onChange={(e) => setFormType(e.target.value)}
                  required
                >
                  {leaveTypes.map((t) => (
                    <option key={t.id} value={t.code || t.name}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-black text-slate-600 uppercase tracking-wider mb-1.5">Start Date</label>
                  <input
                    type="date"
                    className="w-full px-3.5 py-2.5 bg-white border border-indigo-100 rounded-xl text-xs font-bold text-[#1E1B4B] outline-none focus:border-[#5B21B6]"
                    value={formStartDate}
                    onChange={(e) => setFormStartDate(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-black text-slate-600 uppercase tracking-wider mb-1.5">End Date</label>
                  <input
                    type="date"
                    className="w-full px-3.5 py-2.5 bg-white border border-indigo-100 rounded-xl text-xs font-bold text-[#1E1B4B] outline-none focus:border-[#5B21B6]"
                    value={formEndDate}
                    onChange={(e) => setFormEndDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              {formStartDate && formEndDate && formEndDate >= formStartDate && (
                <div className="px-3.5 py-2 rounded-xl bg-[#F2EDFF] border border-[#DDD7F3] text-xs font-black text-[#5B21B6]">
                  Duration: {calcLeaveDays(formStartDate, formEndDate)} Day(s)
                </div>
              )}

              <div>
                <label className="block text-[11px] font-black text-slate-600 uppercase tracking-wider mb-1.5">Reason</label>
                <textarea
                  className="w-full px-4 py-2.5 bg-white border border-indigo-100 rounded-xl text-sm font-semibold text-[#1E1B4B] outline-none focus:border-[#5B21B6]"
                  rows={3}
                  value={formReason}
                  onChange={(e) => setFormReason(e.target.value)}
                  placeholder="Enter leave reason..."
                  required
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-black uppercase text-slate-600 bg-white border border-indigo-100 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-gradient-to-r from-[#5B21B6] to-[#7C3AED] text-white font-black text-xs uppercase px-5 py-2.5 rounded-xl shadow-md cursor-pointer disabled:opacity-60"
                >
                  {submitting ? "Submitting..." : "Submit Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══ REJECT REASON MODAL ══ */}
      {rejectTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-[24px] border border-[#DDD7F3] shadow-2xl max-w-md w-full overflow-hidden">
            <div className="bg-gradient-to-r from-rose-600 to-pink-600 px-6 py-4 text-white flex items-center justify-between">
              <h4 className="text-base font-black">Reject Leave Request</h4>
              <button onClick={() => setRejectTarget(null)} className="p-1.5 rounded-xl bg-white/15 hover:bg-white/25 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4 bg-[#F8FAFF]">
              <p className="text-xs font-bold text-slate-600">
                Applicant: <strong className="text-[#1E1B4B]">{rejectTarget.requester?.name || rejectTarget.applicant}</strong>
              </p>
              <div>
                <label className="block text-[11px] font-black text-slate-600 uppercase tracking-wider mb-1.5">Rejection Reason (Optional)</label>
                <textarea
                  rows={3}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Provide reason for declining..."
                  className="w-full px-4 py-2.5 bg-white border border-indigo-100 rounded-xl text-sm font-semibold text-[#1E1B4B] outline-none focus:border-rose-500"
                />
              </div>
              <div className="flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setRejectTarget(null)}
                  className="px-4 py-2 rounded-xl text-xs font-black uppercase text-slate-600 bg-white border border-indigo-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateStatus(rejectTarget.id, "REJECTED", rejectReason)}
                  className="px-5 py-2 rounded-xl text-xs font-black uppercase bg-rose-600 text-white hover:bg-rose-700 cursor-pointer shadow-sm"
                >
                  Confirm Reject
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaveRequestTab;
