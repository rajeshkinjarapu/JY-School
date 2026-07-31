import React, { useEffect, useState, useCallback } from "react";
import api from "../../api/axios";
import { Search, UserPlus, Trash2, Edit, FileDown, Eye, Filter, ChevronLeft, ChevronRight } from "lucide-react";
import toast from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useAuth } from "../../hooks/useAuth";
import { getPhotoUrl } from "../../utils/photo";

const LIMIT = 30;

const avatarColors = [
  "from-indigo-500 to-purple-600",
  "from-teal-400 to-emerald-500",
  "from-rose-400 to-pink-600",
  "from-amber-400 to-orange-500",
  "from-cyan-400 to-blue-500",
  "from-violet-400 to-purple-600",
];

const getInitials = (n: string) =>
  n.trim().split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();

/* ── Skeleton Row ── */
const SkeletonCard = () => (
  <div className="mobile-card flex items-center gap-3 animate-pulse">
    <div className="w-11 h-11 rounded-full bg-gray-200 shrink-0" />
    <div className="flex-1 space-y-2">
      <div className="h-3.5 bg-gray-200 rounded-full w-2/3" />
      <div className="h-3 bg-gray-100 rounded-full w-1/2" />
    </div>
    <div className="w-8 h-8 rounded-lg bg-gray-100 shrink-0" />
  </div>
);

/* ── Mobile Student Card ── */
const StudentCard = React.memo(({ student, idx, page, isSuperAdmin, onDelete, navigate }: any) => {
  const name = student.user?.name || "Student";
  const colorClass = avatarColors[name.charCodeAt(0) % avatarColors.length];
  const photoUrl = getPhotoUrl(student.user?.photoUrl);

  return (
    <div className="mobile-card flex items-center gap-3 cursor-pointer" onClick={() => navigate(`/students/${student.id}`)}>
      {/* Avatar */}
      <div className="relative shrink-0">
        {photoUrl ? (
          <img src={photoUrl} alt={name} className="w-11 h-11 rounded-full object-cover border-2 border-white shadow" />
        ) : (
          <div className={`w-11 h-11 rounded-full bg-gradient-to-br ${colorClass} flex items-center justify-center text-white font-bold text-sm shadow`}>
            {getInitials(name)}
          </div>
        )}
        <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${student.user?.isActive ? 'bg-emerald-500' : 'bg-gray-400'}`} />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-extrabold text-gray-900 text-sm truncate">{name}</p>
        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
          <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded font-mono">
            {student.rollNo || "–"}
          </span>
          <span className="text-[11px] font-bold text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded uppercase">
            {student.class?.name || "–"} {student.class?.section || ""}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
        <Link
          to={`/students/${student.id}`}
          className="p-2 rounded-xl bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors"
          title="View"
        >
          <Eye className="w-4 h-4" />
        </Link>
        {isSuperAdmin && (
          <>
            <Link
              to={`/students/${student.id}/edit`}
              className="p-2 rounded-xl bg-amber-50 text-amber-600 hover:bg-amber-100 transition-colors"
              title="Edit"
            >
              <Edit className="w-4 h-4" />
            </Link>
            <button
              onClick={() => onDelete(student.id)}
              className="p-2 rounded-xl bg-red-50 text-red-500 hover:bg-red-100 transition-colors cursor-pointer"
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </>
        )}
      </div>
    </div>
  );
});

export const StudentListPage: React.FC = () => {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "SUPER_ADMIN";
  const navigate = useNavigate();

  const [students, setStudents] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [classId, setClassId] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchClasses = useCallback(async () => {
    try {
      const res: any = await api.get("/api/classes");
      setClasses(res.data.data || res.data || []);
    } catch {}
  }, []);

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const response: any = await api.get("/api/students", {
        params: { search, classId, limit: LIMIT, page },
      });
      const data = response.data.data || response.data || [];
      setStudents(data);
      setTotal(response.data.meta?.total || data.length);
    } catch {
      toast.error("Failed to load students");
    } finally {
      setLoading(false);
    }
  }, [search, classId, page]);

  useEffect(() => { fetchClasses(); }, [fetchClasses]);

  useEffect(() => {
    const timer = setTimeout(fetchStudents, 250);
    return () => clearTimeout(timer);
  }, [fetchStudents]);

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this student?")) return;
    try {
      await api.delete(`/api/students/${id}`);
      toast.success("Student deleted");
      fetchStudents();
    } catch (e: any) {
      toast.error(e.message || "Failed to delete");
    }
  };

  const exportStudents = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Student List", 14, 22);
    autoTable(doc, {
      head: [["S.No", "Student ID", "Name", "Class", "Mobile", "Father Name", "Status"]],
      body: students.map((s: any, i: number) => [
        (page - 1) * LIMIT + i + 1,
        s.rollNo || "–",
        s.user?.name || "–",
        `${s.class?.name || ""} ${s.class?.section || ""}`,
        s.user?.phone || "–",
        s.fatherName || "–",
        s.user?.isActive ? "Active" : "Inactive",
      ]),
      startY: 30,
      theme: "grid",
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [79, 70, 229], textColor: 255, fontStyle: "bold" },
    });
    doc.save("Student_List.pdf");
    toast.success("PDF exported!");
  };

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="flex flex-col h-full">
      {/* ── Colorful Hero Header ── */}
      <div className="px-3 pt-3 pb-4 bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-white/70 text-xs font-semibold uppercase tracking-wider">Total</p>
            <p className="text-2xl font-black text-white">{total} Students</p>
          </div>
          <div className="flex gap-2">
            {isSuperAdmin && (
              <button
                onClick={exportStudents}
                className="p-2.5 rounded-xl bg-white/15 text-white hover:bg-white/25 transition-colors cursor-pointer"
                title="Export PDF"
              >
                <FileDown className="w-5 h-5" />
              </button>
            )}
            <Link
              to="/students/new"
              className="flex items-center gap-1.5 px-3.5 py-2.5 text-sm font-extrabold text-indigo-700 bg-white rounded-xl shadow hover:bg-indigo-50 transition-colors"
            >
              <UserPlus className="w-4 h-4" /> Add
            </Link>
          </div>
        </div>

        {/* Search + Filter */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/60" />
            <input
              type="text"
              placeholder="Search students..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-3 py-2.5 text-sm bg-white/15 border border-white/25 rounded-xl text-white placeholder:text-white/50 font-medium focus:outline-none focus:bg-white/25 transition-all"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/60 pointer-events-none" />
            <select
              value={classId}
              onChange={(e) => { setClassId(e.target.value); setPage(1); }}
              className="pl-8 pr-3 py-2.5 text-sm bg-white/15 border border-white/25 rounded-xl text-white font-semibold focus:outline-none appearance-none cursor-pointer"
              style={{ colorScheme: 'dark' }}
            >
              <option value="" className="text-gray-900 bg-white">All Classes</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id} className="text-gray-900 bg-white">
                  {cls.name} {cls.section}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ── Student List ── */}
      <div className="flex-1 overflow-y-auto" style={{ overscrollBehavior: 'contain' }}>
        <div className="p-3 space-y-2">
          {loading ? (
            Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)
          ) : students.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <div className="w-16 h-16 rounded-full bg-indigo-50 flex items-center justify-center mb-3">
                <Search className="w-7 h-7 text-indigo-300" />
              </div>
              <p className="font-bold text-gray-500">No students found</p>
              <p className="text-sm text-gray-400 mt-1">Try adjusting your search or filter</p>
            </div>
          ) : (
            <>
              {students.map((student, idx) => (
                <StudentCard
                  key={student.id}
                  student={student}
                  idx={idx}
                  page={page}
                  isSuperAdmin={isSuperAdmin}
                  onDelete={handleDelete}
                  navigate={navigate}
                />
              ))}
            </>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-3 pb-4 flex items-center justify-between">
            <p className="text-xs font-bold text-gray-500">
              {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, total)} of {total}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded-xl bg-white border border-gray-200 text-gray-500 hover:bg-indigo-50 hover:text-indigo-600 disabled:opacity-40 transition-colors cursor-pointer shadow-sm"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="flex items-center px-3 text-xs font-black text-indigo-600 bg-indigo-50 rounded-xl">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= totalPages}
                className="p-2 rounded-xl bg-white border border-gray-200 text-gray-500 hover:bg-indigo-50 hover:text-indigo-600 disabled:opacity-40 transition-colors cursor-pointer shadow-sm"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
export default StudentListPage;