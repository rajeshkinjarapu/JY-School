import React, { useEffect, useState, useRef } from "react";
import api from "../../api/axios";
import { LoadingSpinner } from "../../components/UI/LoadingSpinner";
import { Search, UserPlus, Trash2, Edit, FileDown, Eye } from "lucide-react";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useAuth } from "../../hooks/useAuth";
import { getPhotoUrl } from "../../utils/photo";

export const StudentListPage: React.FC = () => {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "SUPER_ADMIN";

  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const response: any = await api.get("/api/students", {
        params: { search, limit: 50, page },
      });
      const data = response.data.data || response.data || [];
      setStudents(data);
      setTotal(response.data.meta?.total || data.length);
    } catch (error) {
      console.error("Error fetching students:", error);
      toast.error("Failed to load students list");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchStudents();
    }, 300);
    return () => clearTimeout(timer);
  }, [search, page]);

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this student?"))
      return;
    try {
      await api.delete(`/api/students/${id}`);
      toast.success("Student deleted successfully");
      fetchStudents();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete student");
    }
  };

  const exportStudents = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Student List", 14, 22);

    const tableColumn = ["S.No", "Roll No", "Name", "Class", "Phone", "Father Name"];
    const tableRows: any[] = [];

    students.forEach((student: any, index: number) => {
      const row = [
        (page - 1) * 50 + index + 1,
        student.rollNo || "-",
        student.user?.name || "-",
        `${student.class?.name || ""} ${student.class?.section || ""}`,
        student.user?.phone || "-",
        student.fatherName || "-",
      ];
      tableRows.push(row);
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 30,
      theme: "grid",
      styles: { fontSize: 10, cellPadding: 3 },
      headStyles: { fillColor: [79, 70, 229], textColor: 255, fontStyle: "bold" },
    });

    doc.save("Student_List.pdf");
    toast.success("PDF generated successfully!");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/80 dark:bg-white/5 p-4 rounded-2xl border border-gray-150 dark:border-white/10 shadow-sm backdrop-blur-xl">
        <div className="flex-1 relative flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 w-4 h-4 text-indigo-500" />
            <input
              type="text"
              placeholder="Search students by name or roll number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-sm bg-indigo-50/30 dark:bg-white/5 border border-indigo-100 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/50 font-medium transition-all text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-300"
            />
          </div>
          <span className="hidden sm:inline-flex items-center justify-center px-3 py-2 text-xs font-black text-indigo-600 bg-indigo-100 rounded-lg whitespace-nowrap">
            {total} Records
          </span>
        </div>
        <div className="flex gap-2 flex-wrap">
          {isSuperAdmin && (
            <button
              onClick={exportStudents}
              className="flex items-center gap-1.5 px-3.5 py-2.5 text-sm font-bold text-gray-600 dark:text-white bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl hover:bg-gray-100 dark:hover:bg-white/10 transition-all cursor-pointer"
            >
              <FileDown className="w-4 h-4" /> Export
            </button>
          )}
          <Link
            to="/students/new"
            className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-extrabold text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 rounded-xl shadow-md shadow-indigo-500/25 transition-all cursor-pointer"
          >
            <UserPlus className="w-4 h-4" /> Add Student
          </Link>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner size="lg" className="py-12" />
      ) : (
        <div className="bg-white/40 dark:bg-white/5 border border-white/60 dark:border-white/10 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden backdrop-blur-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead>
                <tr className="bg-indigo-50/50 text-indigo-900 font-semibold border-b border-indigo-100">
                  <th className="px-6 py-4 font-extrabold text-xs uppercase tracking-wider text-gray-400">Student</th>
                  <th className="px-6 py-4 font-extrabold text-xs uppercase tracking-wider text-gray-400">Roll No</th>
                  <th className="px-6 py-4 font-extrabold text-xs uppercase tracking-wider text-gray-400">Class</th>
                  <th className="px-6 py-4 font-extrabold text-xs uppercase tracking-wider text-gray-400">Father Name</th>
                  <th className="px-6 py-4 font-extrabold text-xs uppercase tracking-wider text-gray-400 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-150 dark:divide-white/5">
                {students.map((student, idx) => {
                  const avatarColors = ["from-indigo-500 to-purple-600", "from-teal-400 to-emerald-600", "from-rose-400 to-pink-600"];
                  const name = student.user?.name || "Student";
                  const colorIdx = name.charCodeAt(0) % avatarColors.length;
                  const colorClass = avatarColors[colorIdx];
                  const getInitials = (n: string) => n.trim().split(" ").map(p=>p[0]).slice(0,2).join("").toUpperCase();

                  return (
                    <tr key={student.id} className="hover:bg-white bg-transparent transition-all duration-300 group border-b border-indigo-50/50 hover:shadow-glow-primary">
                      <td className="px-6 py-4 flex items-center gap-3">
                        <div className="relative">
                          {getPhotoUrl(student.user?.photoUrl) ? (
                            <img src={getPhotoUrl(student.user?.photoUrl)} alt={name} className="w-12 h-12 rounded-2xl object-cover shadow-sm border border-gray-100" />
                          ) : (
                            <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${colorClass} flex items-center justify-center text-white font-black text-lg shadow-sm border-2 border-white`}>
                              {getInitials(name)}
                            </div>
                          )}
                        </div>
                        <div>
                          <h4 className="font-extrabold text-gray-900 dark:text-white leading-tight group-hover:text-indigo-600 transition-colors">
                            {name}
                          </h4>
                          <span className="text-[11px] font-bold text-gray-400">{student.user?.email || student.user?.phone}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100">
                          {student.rollNo}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-[11px] font-extrabold uppercase tracking-wide text-teal-700 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-100">
                          {student.class?.name} {student.class?.section}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-bold text-gray-600 bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-200">
                          {student.fatherName || "-"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Link to={`/students/${student.id}`} className="flex items-center justify-center w-8 h-8 bg-gray-50 hover:bg-indigo-50 text-gray-400 hover:text-indigo-600 rounded-lg transition-all shadow-sm border border-gray-200 cursor-pointer" title="View Profile">
                            <Eye className="w-4 h-4" />
                          </Link>
                          {isSuperAdmin && (
                            <>
                              <Link to={`/students/${student.id}/edit`} className="flex items-center justify-center w-8 h-8 bg-gray-50 hover:bg-amber-50 text-gray-400 hover:text-amber-600 rounded-lg transition-all shadow-sm border border-gray-200 cursor-pointer" title="Edit">
                                <Edit className="w-3.5 h-3.5" />
                              </Link>
                              <button onClick={() => handleDelete(student.id)} className="flex items-center justify-center w-8 h-8 bg-gray-50 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded-lg transition-all shadow-sm border border-gray-200 cursor-pointer" title="Delete">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {students.length === 0 && (
                  <tr><td colSpan={5} className="py-12 text-center text-gray-400 font-semibold">No student records found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="p-4 border-t border-indigo-50 flex items-center justify-between">
             <div className="text-xs font-bold text-gray-500">
               Showing Page {page}
             </div>
             <div className="flex gap-2">
               <button onClick={() => setPage(p=>Math.max(1, p-1))} disabled={page===1} className="px-3 py-1.5 text-xs font-bold bg-white border border-gray-200 rounded-lg disabled:opacity-50">Prev</button>
               <button onClick={() => setPage(p=>p+1)} disabled={students.length < 50} className="px-3 py-1.5 text-xs font-bold bg-white border border-gray-200 rounded-lg disabled:opacity-50">Next</button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default StudentListPage;