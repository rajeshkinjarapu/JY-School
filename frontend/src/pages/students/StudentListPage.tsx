import React, { useEffect, useState } from "react";
import api from "../../api/axios";
import { LoadingSpinner } from "../../components/UI/LoadingSpinner";
import { Search, UserPlus, Trash2, Edit, FileDown, Eye, Filter } from "lucide-react";
import toast from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useAuth } from "../../hooks/useAuth";
import { getPhotoUrl } from "../../utils/photo";

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

  const fetchClasses = async () => {
    try {
      const res: any = await api.get('/api/classes');
      setClasses(res.data.data || res.data || []);
    } catch (error) {
      console.error("Error fetching classes:", error);
    }
  };

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const response: any = await api.get("/api/students", {
        params: { search, classId, limit: 50, page },
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
    fetchClasses();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchStudents();
    }, 300);
    return () => clearTimeout(timer);
  }, [search, classId, page]);

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this student?")) return;
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

    const tableColumn = ["S.No", "Student ID", "Name", "Class", "Mobile No", "Father Name", "Status"];
    const tableRows: any[] = [];

    students.forEach((student: any, index: number) => {
      const row = [
        (page - 1) * 50 + index + 1,
        student.rollNo || "-",
        student.user?.name || "-",
        `${student.class?.name || ""} ${student.class?.section || ""}`,
        student.user?.phone || "-",
        student.fatherName || "-",
        student.user?.isActive ? "Active" : "Inactive"
      ];
      tableRows.push(row);
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 30,
      theme: "grid",
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [79, 70, 229], textColor: 255, fontStyle: "bold" },
    });

    doc.save("Student_List.pdf");
    toast.success("PDF generated successfully!");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white/80 dark:bg-white/5 p-4 rounded-2xl border border-gray-150 dark:border-white/10 shadow-sm backdrop-blur-xl">
        
        <div className="flex-1 flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-3 w-4 h-4 text-indigo-500" />
            <input
              type="text"
              placeholder="Search by name or Student ID..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-4 py-2.5 text-sm bg-indigo-50/30 border border-indigo-100 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/50 font-medium transition-all"
            />
          </div>
          
          <div className="relative w-full sm:w-auto">
            <Filter className="absolute left-3 top-3 w-4 h-4 text-indigo-500" />
            <select
              value={classId}
              onChange={(e) => {
                setClassId(e.target.value);
                setPage(1);
              }}
              className="w-full sm:w-48 pl-9 pr-8 py-2.5 text-sm bg-indigo-50/30 border border-indigo-100 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/50 font-medium appearance-none cursor-pointer"
            >
              <option value="">All Classes</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name} {cls.section}
                </option>
              ))}
            </select>
          </div>
          
          <span className="hidden sm:inline-flex items-center justify-center px-3 py-2 text-xs font-black text-indigo-600 bg-indigo-100 rounded-lg whitespace-nowrap">
            {total} Records
          </span>
        </div>

        <div className="flex gap-2 flex-wrap justify-end">
          {isSuperAdmin && (
            <button
              onClick={exportStudents}
              className="flex items-center gap-1.5 px-3.5 py-2.5 text-sm font-bold text-gray-600 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 transition-all cursor-pointer"
            >
              <FileDown className="w-4 h-4" /> Export
            </button>
          )}
          <Link
            to="/students/new"
            className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-extrabold text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 rounded-xl shadow-md transition-all cursor-pointer"
          >
            <UserPlus className="w-4 h-4" /> Add Student
          </Link>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner size="lg" className="py-12" />
      ) : (
        <div className="bg-transparent overflow-hidden">
          <div className="overflow-x-auto pb-4">
            <table className="w-full text-sm text-left border-separate border-spacing-y-3">
              <thead>
                <tr className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl shadow-md">
                  <th className="px-6 py-4 font-extrabold text-xs uppercase tracking-wider text-gray-500 w-16">S.No</th>
                  <th className="px-6 py-4 font-extrabold text-xs uppercase tracking-wider text-gray-500">Student Info</th>
                  <th className="px-6 py-4 font-extrabold text-xs uppercase tracking-wider text-gray-500">Student ID</th>
                  <th className="px-6 py-4 font-extrabold text-xs uppercase tracking-wider text-gray-500">Class & Sec</th>
                  <th className="px-6 py-4 font-extrabold text-xs uppercase tracking-wider text-gray-500">Mobile No</th>
                  <th className="px-6 py-4 font-extrabold text-xs uppercase tracking-wider text-gray-500">Father Name</th>
                  <th className="px-6 py-4 font-black text-xs uppercase tracking-wider text-white">Status</th>
                  <th className="px-6 py-4 font-black text-xs uppercase tracking-wider text-white text-right rounded-r-xl">Actions</th>
                </tr>
              </thead>
              <tbody className="">
                {students.map((student, idx) => {
                  const avatarColors = ["from-indigo-500 to-purple-600", "from-teal-400 to-emerald-600", "from-rose-400 to-pink-600"];
                  const name = student.user?.name || "Student";
                  const colorIdx = name.charCodeAt(0) % avatarColors.length;
                  const colorClass = avatarColors[colorIdx];
                  const getInitials = (n: string) => n.trim().split(" ").map(p=>p[0]).slice(0,2).join("").toUpperCase();

                  return (
                    <tr key={student.id} className="bg-white hover:bg-indigo-50/30 transition-all duration-300 group shadow-sm hover:shadow-md hover:-translate-y-0.5 rounded-xl border border-gray-100">
                      <td className="px-6 py-4 text-gray-500 font-bold rounded-l-xl border-y border-l border-gray-100 group-hover:border-indigo-100">
                        {(page - 1) * 50 + idx + 1}
                      </td>
                      <td className="px-6 py-4 flex items-center gap-3 border-y border-gray-100 group-hover:border-indigo-100">
                        <div className="relative">
                          {getPhotoUrl(student.user?.photoUrl) ? (
                            <img src={getPhotoUrl(student.user?.photoUrl)} alt={name} className="w-10 h-10 rounded-full object-cover shadow-sm border border-gray-100" />
                          ) : (
                            <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${colorClass} flex items-center justify-center text-white font-bold text-sm shadow-sm border border-white`}>
                              {getInitials(name)}
                            </div>
                          )}
                        </div>
                        <div>
                          <div 
                            onClick={() => navigate(`/students/${student.id}`)}
                            className="font-extrabold text-gray-900 leading-tight hover:text-indigo-600 transition-colors cursor-pointer"
                          >
                            {name}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 border-y border-gray-100 group-hover:border-indigo-100">
                        <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-100">
                          {student.rollNo || "-"}
                        </span>
                      </td>
                      <td className="px-6 py-4 border-y border-gray-100 group-hover:border-indigo-100">
                        <span className="text-[11px] font-extrabold uppercase tracking-wide text-teal-700 bg-teal-50 px-2.5 py-1 rounded-md border border-teal-100">
                          {student.class?.name || "-"} {student.class?.section || ""}
                        </span>
                      </td>
                      <td className="px-6 py-4 border-y border-gray-100 group-hover:border-indigo-100">
                        <span className="text-xs font-bold text-gray-600">
                          {student.user?.phone || "-"}
                        </span>
                      </td>
                      <td className="px-6 py-4 border-y border-gray-100 group-hover:border-indigo-100">
                        <span className="text-xs font-bold text-gray-600">
                          {student.fatherName || "-"}
                        </span>
                      </td>
                      <td className="px-6 py-4 border-y border-gray-100 group-hover:border-indigo-100">
                        {student.user?.isActive ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span> Inactive
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right rounded-r-xl border-y border-r border-gray-100 group-hover:border-indigo-100">
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
                  <tr><td colSpan={8} className="py-12 text-center text-gray-400 font-semibold">No student records found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
          
          {total > 0 && (
            <div className="p-4 border-t border-indigo-50 flex items-center justify-between">
              <div className="text-xs font-bold text-gray-500">
                Showing {(page - 1) * 50 + 1} to {Math.min(page * 50, total)} of {total}
              </div>
              <div className="flex gap-2">
                <button onClick={() => setPage(p=>Math.max(1, p-1))} disabled={page===1} className="px-3 py-1.5 text-xs font-bold bg-white hover:bg-gray-50 border border-gray-200 rounded-lg disabled:opacity-50 transition-colors">Prev</button>
                <button onClick={() => setPage(p=>p+1)} disabled={page * 50 >= total} className="px-3 py-1.5 text-xs font-bold bg-white hover:bg-gray-50 border border-gray-200 rounded-lg disabled:opacity-50 transition-colors">Next</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
export default StudentListPage;