import React, { useEffect, useState, useCallback } from "react";
import api from "../../api/axios";
import { Search, UserPlus, Trash2, Edit, FileDown, Eye, Filter, ChevronLeft, ChevronRight, Upload, Image as ImageIcon } from "lucide-react";
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

// Helper for table avatars
const StudentAvatar = ({ name, photoUrl, isActive }: { name: string, photoUrl?: string, isActive?: boolean }) => {
  const safeName = name || "Student";
  const colorClass = avatarColors[safeName.charCodeAt(0) % avatarColors.length];
  const url = getPhotoUrl(photoUrl);

  return (
    <div className="relative shrink-0 inline-block">
      {url ? (
        <img src={url} alt={safeName} className="w-11 h-11 rounded object-cover border border-gray-300 shadow-sm" />
      ) : (
        <div className={`w-11 h-11 rounded bg-gradient-to-br ${colorClass} flex items-center justify-center text-white font-bold text-sm shadow-sm border border-gray-200`}>
          {getInitials(safeName)}
        </div>
      )}
      <span className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${isActive ? 'bg-emerald-500' : 'bg-gray-400'}`} />
    </div>
  );
};

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
              <>
                <button
                  className="flex items-center gap-1.5 px-3.5 py-2.5 text-sm font-extrabold text-white bg-white/15 rounded-xl shadow hover:bg-white/25 transition-colors cursor-pointer"
                  title="Upload Students"
                >
                  <Upload className="w-4 h-4" /> Upload Students
                </button>
                <button
                  className="flex items-center gap-1.5 px-3.5 py-2.5 text-sm font-extrabold text-white bg-white/15 rounded-xl shadow hover:bg-white/25 transition-colors cursor-pointer"
                  title="Upload Photos"
                >
                  <ImageIcon className="w-4 h-4" /> Upload Photos
                </button>
                <button
                  onClick={exportStudents}
                  className="p-2.5 rounded-xl bg-white/15 text-white hover:bg-white/25 transition-colors cursor-pointer"
                  title="Export PDF"
                >
                  <FileDown className="w-5 h-5" />
                </button>
              </>
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

      {/* ── Student List (Tabular) ── */}
      <div className="flex-1 overflow-auto bg-gray-50/50 p-4">
        <div className="min-w-[800px] w-full bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="bg-gray-50 text-gray-600 border-b border-gray-200 font-bold uppercase tracking-wider text-xs">
                <th className="px-5 py-4 text-center w-12 border-r border-gray-100">#</th>
                <th className="px-5 py-4 border-r border-gray-100">Student</th>
                <th className="px-5 py-4 border-r border-gray-100">Roll No / ID</th>
                <th className="px-5 py-4 border-r border-gray-100">Class</th>
                <th className="px-5 py-4 border-r border-gray-100">Father Name</th>
                <th className="px-5 py-4">Mobile No</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center">
                    <div className="animate-pulse flex flex-col items-center gap-2">
                      <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                      <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">Loading Students...</p>
                    </div>
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-gray-400">
                    <div className="w-16 h-16 rounded-full bg-indigo-50 flex items-center justify-center mx-auto mb-3">
                      <Search className="w-7 h-7 text-indigo-300" />
                    </div>
                    <p className="font-bold text-gray-500">No students found</p>
                    <p className="text-sm text-gray-400 mt-1">Try adjusting your search or filter</p>
                  </td>
                </tr>
              ) : (
                students.map((student, idx) => (
                  <tr key={student.id} className="hover:bg-indigo-50/50 transition-colors bg-white">
                    <td className="px-5 py-4 text-center text-sm font-bold text-gray-500 border-r border-gray-100">
                      {(page - 1) * LIMIT + idx + 1}
                    </td>
                    <td className="px-5 py-4 border-r border-gray-100">
                      <div className="flex items-center gap-4">
                        <StudentAvatar name={student.user?.name} photoUrl={student.user?.photoUrl} isActive={student.user?.isActive} />
                        <div>
                          <Link to={`/students/${student.id}`} className="font-bold text-gray-900 text-sm hover:text-indigo-600 transition-colors cursor-pointer">
                            {student.user?.name || "Unknown"}
                          </Link>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 border-r border-gray-100">
                      <span className="text-sm font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-3 py-1.5 rounded font-mono shadow-sm">
                        {student.rollNo || "–"}
                      </span>
                    </td>
                    <td className="px-5 py-4 border-r border-gray-100">
                      <span className="text-xs font-bold text-teal-700 bg-teal-50 border border-teal-100 px-3 py-1.5 rounded uppercase shadow-sm">
                        {student.class?.name || "–"} {student.class?.section || ""}
                      </span>
                    </td>
                    <td className="px-5 py-4 border-r border-gray-100">
                      <p className="font-bold text-gray-800 text-sm">{student.fatherName || "–"}</p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-gray-700 text-sm font-medium">{student.user?.phone || "–"}</p>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
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
  );
};
export default StudentListPage;