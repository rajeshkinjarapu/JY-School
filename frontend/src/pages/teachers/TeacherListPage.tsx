import React, { useEffect, useState, useMemo } from "react";
import api from "../../api/axios";
import {
  Search, UserPlus, Trash2, FileDown, Eye, Menu, Users, Phone,
  Filter, ChevronDown, CalendarCheck, IdCard
} from "lucide-react";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { getPhotoUrl } from "../../utils/photo";
import { DataCache } from "../../services/dataCache";

const avatarColors = [
  "from-[#8B5CF6] to-[#6D28D9]",
  "from-[#7C3AED] to-[#4F46E5]",
  "from-[#6366F1] to-[#4338CA]",
  "from-[#8B5CF6] to-[#7C3AED]",
];

const getInitials = (n: string) =>
  n.trim().split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase() || "T";

const TeacherAvatar = ({ name, photoUrl, isActive }: { name?: string; photoUrl?: string; isActive?: boolean }) => {
  const safeName = name || "Teacher";
  const colorClass = avatarColors[safeName.charCodeAt(0) % avatarColors.length];
  const url = getPhotoUrl(photoUrl);

  return (
    <div className="relative shrink-0 inline-block">
      {url ? (
        <img
          src={url}
          alt={safeName}
          loading="lazy"
          className="w-10 h-11 rounded-xl object-cover border border-indigo-100 shadow-xs"
        />
      ) : (
        <div
          className={`w-10 h-11 rounded-xl bg-gradient-to-br ${colorClass} flex items-center justify-center text-white font-black text-xs shadow-xs`}
        >
          {getInitials(safeName)}
        </div>
      )}
      <span
        className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white ${
          isActive !== false ? "bg-emerald-500" : "bg-slate-400"
        }`}
      />
    </div>
  );
};

export const TeacherListPage: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === "SUPER_ADMIN" || user?.role === "ADMIN";

  const [teachers, setTeachers] = useState<any[]>(() => {
    try {
      const raw = JSON.parse(localStorage.getItem("tl_teachers_cache") || "[]");
      return Array.isArray(raw) ? raw : [];
    } catch {
      return [];
    }
  });
  const [loading, setLoading] = useState(teachers.length === 0);
  const [search, setSearch] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("");

  const fetchTeachers = async () => {
    if (!search && teachers.length === 0) {
      try {
        const cached = await DataCache.get("teachers");
        if (cached && cached.length > 0) {
          setTeachers(cached);
          setLoading(false);
        }
      } catch (_) {}
    }

    if (teachers.length === 0) setLoading(true);

    try {
      const response: any = await api.get("/api/teachers", {
        params: { search, limit: 5000 },
      });
      const list = Array.isArray(response.data) ? response.data : (response.data?.data || []);
      setTeachers(list);
      if (!search) {
        try {
          localStorage.setItem("tl_teachers_cache", JSON.stringify(list));
          DataCache.set("teachers", list);
        } catch (_) {}
      }
    } catch (error) {
      console.error("Error fetching teachers:", error);
      toast.error("Failed to load teachers list");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchTeachers();
    }, search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [search]);

  const uniqueSubjects = useMemo(() => {
    const set = new Set<string>();
    teachers.forEach((t) => {
      const sp = (t.specialization || "").trim().toUpperCase();
      if (sp && sp !== "N/A") set.add(sp);
    });
    return Array.from(set).sort();
  }, [teachers]);

  const filteredTeachers = useMemo(() => {
    const q = search.toLowerCase().trim();
    return teachers.filter((t) => {
      const name = (t.user?.name || "").toLowerCase();
      const empId = (t.employeeId || "").toLowerCase();
      const spec = (t.specialization || "").toLowerCase();
      const qual = (t.qualification || "").toLowerCase();
      const phone = (t.user?.phone || "").toLowerCase();

      if (q && !name.includes(q) && !empId.includes(q) && !spec.includes(q) && !qual.includes(q) && !phone.includes(q)) {
        return false;
      }
      if (subjectFilter && (t.specialization || "").trim().toUpperCase() !== subjectFilter) {
        return false;
      }
      return true;
    });
  }, [teachers, search, subjectFilter]);

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this teacher?")) return;
    try {
      await api.delete(`/api/teachers/${id}`);
      toast.success("Teacher deleted successfully");
      fetchTeachers();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error.message || "Failed to delete teacher");
    }
  };

  const exportTeachers = async () => {
    const toastId = toast.loading("Generating Teachers Directory PDF...");
    try {
      const { default: jsPDF } = await import("jspdf");
      const autoTableModule: any = await import("jspdf-autotable");
      const autoTable = autoTableModule.default || autoTableModule;

      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageWidth = doc.internal.pageSize.getWidth();

      doc.setFontSize(15);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(15, 23, 42);
      doc.text("SRI VENKATESWARA JY HIGH SCHOOL", pageWidth / 2, 13, { align: "center" });

      doc.setFontSize(11);
      doc.setTextColor(91, 33, 182);
      doc.text(`TEACHING FACULTY DIRECTORY (${filteredTeachers.length} STAFF)`, pageWidth / 2, 20, { align: "center" });

      const tableColumn = ["#", "Employee ID", "Teacher Name", "Subject", "Qualification", "Mobile No"];
      const tableRows = filteredTeachers.map((teacher: any, index: number) => [
        String(index + 1),
        teacher.employeeId || "-",
        (teacher.user?.name || "-").toUpperCase(),
        teacher.specialization || "-",
        teacher.qualification || "-",
        teacher.user?.phone || "-",
      ]);

      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 25,
        theme: "grid",
        styles: { fontSize: 8.5, cellPadding: 2.3, textColor: [30, 41, 59] },
        headStyles: {
          fillColor: [91, 33, 182],
          textColor: 255,
          fontStyle: "bold",
          halign: "center",
        },
        alternateRowStyles: { fillColor: [250, 249, 255] },
        columnStyles: {
          0: { cellWidth: 10, halign: "center", fontStyle: "bold" },
          1: { cellWidth: 26, halign: "center", fontStyle: "bold", textColor: [91, 33, 182] },
          2: { cellWidth: 58, fontStyle: "bold" },
          3: { cellWidth: 32, halign: "center" },
          4: { cellWidth: 30, halign: "center" },
          5: { cellWidth: 30, halign: "center" },
        },
        margin: { left: 12, right: 12, bottom: 14 },
      });

      doc.save("JY_School_Teachers_Directory.pdf");
      toast.success("PDF generated successfully!", { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate PDF", { id: toastId });
    }
  };

  return (
    <div className="relative flex flex-col h-full bg-gradient-to-br from-[#F3F4FC] via-[#F7F5FF] to-[#EEF2FC] overflow-hidden">
      {/* Soft Pastel Ambient Highlights */}
      <div className="absolute -top-24 -left-24 w-80 h-80 bg-indigo-200/25 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -top-24 right-1/4 w-80 h-80 bg-purple-200/20 rounded-full blur-3xl pointer-events-none" />

      {/* ── Soft Light Pastel Header & Toolbar (Matching StudentListPage) ── */}
      <div className="relative z-10 px-4 sm:px-6 pt-4 pb-3 space-y-3">
        <div className="hidden md:flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#8F7BF7] to-[#6D5CE7] text-white flex items-center justify-center shadow-md shadow-indigo-500/20 shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-500 leading-tight">TOTAL</p>
              <p className="text-2xl font-black text-[#1E1B4B] tracking-tight leading-tight">
                {filteredTeachers.length} {filteredTeachers.length === 1 ? "Teacher" : "Teachers"}
              </p>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-2 flex-wrap">
            <Link
              to="/teacher-attendance"
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-extrabold text-[#5B21B6] bg-[#EFEAFE] hover:bg-[#E4DCFD] border border-[#DDD6FE] rounded-2xl shadow-2xs transition-all"
            >
              <CalendarCheck className="w-3.5 h-3.5" /> Staff Attendance
            </Link>

            <button
              type="button"
              onClick={exportTeachers}
              disabled={filteredTeachers.length === 0}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-extrabold text-white bg-gradient-to-r from-[#7352F6] to-[#5636E8] hover:brightness-105 rounded-2xl shadow-[0_4px_14px_rgba(109,77,245,0.30)] transition-all cursor-pointer disabled:opacity-50"
              title="Export Teachers Directory PDF"
            >
              <FileDown className="w-3.5 h-3.5" /> Export PDF
            </button>

            {isAdmin && (
              <Link
                to="/teachers/new"
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-extrabold text-[#4338CA] bg-white/95 hover:bg-white border border-indigo-200/80 rounded-2xl shadow-[0_2px_8px_rgba(79,70,229,0.06)] transition-all"
              >
                <UserPlus className="w-3.5 h-3.5" /> Add Teacher
              </Link>
            )}
          </div>
        </div>

        {/* Search + Filter Row inside Frosted Pastel Bar */}
        <div className="bg-white/60 backdrop-blur-md border border-[#E2DDF5] rounded-[18px] p-1.5 sm:p-2 shadow-[0_6px_22px_rgba(91,33,182,0.06)] flex gap-2 items-center">
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent("toggleSidebar"))}
            className="p-2.5 md:hidden bg-white hover:bg-indigo-50 text-[#1E1B4B] rounded-xl transition-colors cursor-pointer border border-[#E6E2F5] shadow-xs"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search teachers by name, Employee ID, subject or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-white border border-[#E7E4F6] rounded-xl text-slate-800 placeholder:text-slate-400 font-medium shadow-[0_2px_8px_rgba(79,70,229,0.04)] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all"
            />
          </div>

          <div className="hidden sm:block w-px h-7 bg-[#E0DCF2] shrink-0" />

          <div className="relative shrink-0">
            <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#1E1B4B] pointer-events-none" />
            <select
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              className="pl-9 pr-8 py-2 text-xs sm:text-sm bg-white border border-[#E7E4F6] rounded-xl text-[#1E1B4B] font-bold shadow-[0_2px_8px_rgba(79,70,229,0.04)] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 appearance-none cursor-pointer"
            >
              <option value="">All Subjects</option>
              {uniqueSubjects.map((sub) => (
                <option key={sub} value={sub}>{sub}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-600 pointer-events-none" />
          </div>

          {isAdmin && (
            <Link
              to="/teachers/new"
              className="md:hidden p-2.5 bg-gradient-to-r from-[#7352F6] to-[#5636E8] text-white rounded-xl transition-all shadow-sm flex items-center justify-center shrink-0"
              title="Add Teacher"
            >
              <UserPlus className="w-4 h-4" />
            </Link>
          )}
        </div>
      </div>

      {/* ── Desktop Teacher Directory Table (Purple Sticky Header Matching StudentListPage) ── */}
      <div className="relative z-10 flex-1 min-h-0 px-4 sm:px-6 pb-4 hidden md:flex flex-col">
        <div className="flex-1 min-h-0 overflow-auto bg-white rounded-[20px] shadow-[0_12px_32px_-6px_rgba(91,33,182,0.10)] border border-[#DDD7F3]">
          <table className="min-w-[850px] w-full text-sm text-left border-separate border-spacing-0 student-grid-table">
            <thead className="sticky top-0 z-20 bg-gradient-to-r from-[#7D3CEF] via-[#6D38EA] to-[#5B21B6]">
              <tr className="bg-gradient-to-r from-[#7D3CEF] via-[#6D38EA] to-[#5B21B6] !text-white font-extrabold uppercase tracking-wider text-[11px]">
                <th className="px-3 py-3.5 text-center w-14 border-r border-white/20 border-b border-[#5B21B6] !text-white first:rounded-tl-[19px]">#</th>
                <th className="px-4 py-3.5 text-left border-r border-white/20 border-b border-[#5B21B6] !text-white">Teacher</th>
                <th className="px-5 py-3.5 text-left border-r border-white/20 border-b border-[#5B21B6] !text-white">Employee ID</th>
                <th className="px-5 py-3.5 text-left border-r border-white/20 border-b border-[#5B21B6] !text-white">Subject</th>
                <th className="px-5 py-3.5 text-left border-r border-white/20 border-b border-[#5B21B6] !text-white">Qualification</th>
                <th className="px-5 py-3.5 text-left border-r border-white/20 border-b border-[#5B21B6] !text-white">Mobile No</th>
                <th className="px-4 py-3.5 text-center border-b border-[#5B21B6] !text-white last:rounded-tr-[19px]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center">
                    <div className="animate-pulse flex flex-col items-center gap-2">
                      <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
                      <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Loading Teachers...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredTeachers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-400">
                    <div className="w-16 h-16 rounded-full bg-indigo-50 flex items-center justify-center mx-auto mb-3">
                      <Search className="w-7 h-7 text-indigo-300" />
                    </div>
                    <p className="font-bold text-slate-600">No teachers found</p>
                    <p className="text-xs text-slate-400 mt-1">Try adjusting your search query or subject filter</p>
                  </td>
                </tr>
              ) : (
                filteredTeachers.map((teacher, idx) => {
                  const rowBorderBottom = idx === filteredTeachers.length - 1 ? "" : "border-b border-[#EAE7F6]";
                  const name = teacher.user?.name || "Teacher";
                  const phone = teacher.user?.phone || "";

                  return (
                    <tr
                      key={teacher.id}
                      className="even:bg-[#FAF9FF] hover:bg-[#F3EFFE]/60 transition-colors bg-white"
                    >
                      <td className={`px-3 py-2.5 text-center text-xs font-bold text-[#1E1B4B] border-r border-[#EAE7F6] ${rowBorderBottom}`}>
                        {idx + 1}
                      </td>
                      <td className={`px-4 py-2.5 border-r border-[#EAE7F6] ${rowBorderBottom}`}>
                        <div className="flex items-center gap-3.5">
                          <TeacherAvatar name={name} photoUrl={teacher.user?.photoUrl} isActive={teacher.user?.isActive} />
                          <Link
                            to={`/teachers/${teacher.id}`}
                            className="font-extrabold text-[#1E1B4B] text-xs uppercase tracking-tight hover:text-[#6D28D9] transition-colors cursor-pointer"
                          >
                            {name}
                          </Link>
                        </div>
                      </td>
                      <td className={`px-5 py-2.5 text-left border-r border-[#EAE7F6] whitespace-nowrap ${rowBorderBottom}`}>
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-extrabold text-[#5B21B6] bg-[#EFEAFE] border border-[#DDD6FE]/80 font-mono">
                          {teacher.employeeId || "–"}
                        </span>
                      </td>
                      <td className={`px-5 py-2.5 text-left border-r border-[#EAE7F6] ${rowBorderBottom}`}>
                        {teacher.specialization ? (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-extrabold text-[#059669] bg-[#E6F9EE] border border-[#C1F0D6] uppercase">
                            {teacher.specialization}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs font-semibold">—</span>
                        )}
                      </td>
                      <td className={`px-5 py-2.5 text-left border-r border-[#EAE7F6] ${rowBorderBottom}`}>
                        <p className="font-extrabold text-slate-700 text-xs">{teacher.qualification || "N/A"}</p>
                      </td>
                      <td className={`px-5 py-2.5 text-left border-r border-[#EAE7F6] whitespace-nowrap ${rowBorderBottom}`}>
                        {phone ? (
                          <div className="flex items-center gap-2.5">
                            <a
                              href={`tel:${phone}`}
                              className="text-[#5B21B6] hover:text-[#4C1D95] text-xs font-bold inline-flex items-center gap-1.5 transition-colors font-mono"
                            >
                              <Phone className="w-3.5 h-3.5" />
                              {phone}
                            </a>
                            <a
                              href={`https://wa.me/${phone.replace(/\D/g, "").length === 10 ? "91" + phone.replace(/\D/g, "") : phone.replace(/\D/g, "")}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#DCFCE7] hover:bg-[#BBF7D0] text-[#15803D] border border-[#BBF7D0] text-[10.5px] font-extrabold transition-colors cursor-pointer"
                              title="Message on WhatsApp"
                            >
                              WhatsApp
                            </a>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs font-medium">—</span>
                        )}
                      </td>
                      <td className={`px-4 py-2.5 text-center whitespace-nowrap ${rowBorderBottom}`}>
                        <div className="inline-flex items-center gap-1.5">
                          <Link
                            to={`/teachers/${teacher.id}`}
                            className="p-1.5 rounded-lg bg-[#EFEAFE] hover:bg-[#5B21B6] text-[#5B21B6] hover:text-white transition-colors"
                            title="View Teacher Profile"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Link>
                          {isAdmin && (
                            <button
                              type="button"
                              onClick={() => handleDelete(teacher.id)}
                              className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white transition-colors cursor-pointer"
                              title="Delete Teacher"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Mobile Teacher Cards View (Clean Light Pastel Matching StudentListPage) ── */}
      <div className="flex-1 overflow-auto p-3 md:hidden">
        {loading ? (
          <div className="py-12 flex flex-col items-center gap-2">
            <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Loading Teachers...</p>
          </div>
        ) : filteredTeachers.length === 0 ? (
          <div className="py-16 text-center text-slate-400 bg-white rounded-3xl border border-indigo-100 p-8 shadow-sm">
            <Search className="w-8 h-8 text-indigo-300 mx-auto mb-3" />
            <p className="font-bold text-slate-600">No teachers found</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3 pb-20">
            {filteredTeachers.map((teacher, idx) => {
              const name = teacher.user?.name || "Teacher";
              const phone = teacher.user?.phone || "";
              return (
                <div
                  key={teacher.id}
                  className="bg-white rounded-[18px] p-3.5 shadow-sm border border-[#DDD7F3] flex flex-col gap-3 relative"
                >
                  <span className="absolute top-3 right-3 text-[10px] font-black text-slate-300">
                    #{idx + 1}
                  </span>

                  <div className="flex items-center gap-3.5">
                    <TeacherAvatar name={name} photoUrl={teacher.user?.photoUrl} isActive={teacher.user?.isActive} />
                    <div className="min-w-0 flex-1 pr-6">
                      <Link
                        to={`/teachers/${teacher.id}`}
                        className="font-extrabold text-sm text-[#1E1B4B] hover:text-[#5B21B6] truncate block uppercase"
                      >
                        {name}
                      </Link>
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {teacher.employeeId && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-extrabold bg-[#EFEAFE] text-[#5B21B6] border border-[#DDD6FE] font-mono">
                            <IdCard className="w-3 h-3" />
                            {teacher.employeeId}
                          </span>
                        )}
                        {teacher.specialization && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10.5px] font-extrabold bg-[#E6F9EE] text-[#059669] border border-[#C1F0D6]">
                            {teacher.specialization}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="pt-2.5 border-t border-indigo-50 flex items-center justify-between gap-2">
                    {phone ? (
                      <div className="flex items-center gap-1.5">
                        <a
                          href={`tel:${phone}`}
                          className="flex items-center gap-1 text-xs font-bold text-[#5B21B6] bg-[#EFEAFE] px-3 py-1.5 rounded-xl"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          <span>{phone}</span>
                        </a>
                        <a
                          href={`https://wa.me/${phone.replace(/\D/g, "").length === 10 ? "91" + phone.replace(/\D/g, "") : phone.replace(/\D/g, "")}`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-1.5 rounded-xl bg-[#DCFCE7] text-[#15803D] text-xs font-extrabold"
                        >
                          WhatsApp
                        </a>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400 font-semibold">No Phone</span>
                    )}

                    <Link
                      to={`/teachers/${teacher.id}`}
                      className="inline-flex items-center gap-1 px-3.5 py-1.5 text-xs font-extrabold text-white bg-gradient-to-r from-[#5B21B6] to-[#7C3AED] rounded-xl shadow-xs"
                    >
                      <Eye className="w-3.5 h-3.5" /> View
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherListPage;
