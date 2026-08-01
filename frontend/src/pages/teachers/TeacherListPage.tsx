import React, { useEffect, useState, useRef } from "react";
import api from "../../api/axios";
import { LoadingSpinner } from "../../components/UI/LoadingSpinner";
import { Badge } from "../../components/UI/Badge";
import { Avatar } from "../../components/UI/Avatar";
import { Search, UserPlus, Trash2, Edit, Upload, FileDown, Eye, Image as ImageIcon } from "lucide-react";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useAuth } from "../../hooks/useAuth";
import { getPhotoUrl } from "../../utils/photo";

export const TeacherListPage: React.FC = () => {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "SUPER_ADMIN";

  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchTeachers = async () => {
    setLoading(true);
    try {
      const response: any = await api.get("/api/teachers", {
        params: { search, limit: 5000 },
      });
      setTeachers(response.data.data || response.data || []);
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
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this teacher?"))
      return;
    try {
      await api.delete(`/api/teachers/${id}`);
      toast.success("Teacher deleted successfully");
      fetchTeachers();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete teacher");
    }
  };

  const exportTeachers = () => {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text("Teacher List", 14, 22);

    const tableColumn = [
      "S.No",
      "Teacher ID",
      "Name",
      "Mobile No",
      "Subject(s)",
    ];
    const tableRows: any[] = [];

    teachers.forEach((teacher: any, index: number) => {
      const teacherData = [
        index + 1,
        teacher.employeeId || "-",
        teacher.user?.name || "-",
        teacher.user?.phone || "-",
        teacher.specialization || "-",
      ];
      tableRows.push(teacherData);
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 30,
      theme: "grid",
      styles: { fontSize: 10, cellPadding: 3 },
      headStyles: {
        fillColor: [79, 70, 229],
        textColor: 255,
        fontStyle: "bold",
      },
    });

    doc.save("Teacher_List.pdf");
    toast.success("PDF generated successfully!");
  };

  return (
    <div className="flex flex-col h-full">
      {/* Colorful Hero Header */}
      <div className="px-3 pt-3 pb-4 bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-white/70 text-xs font-semibold uppercase tracking-wider">Total</p>
            <p className="text-2xl font-black text-white">{teachers.length} Teachers</p>
          </div>
          <div className="flex gap-2">
            {isSuperAdmin && (
              <>
                <button
                  className="flex items-center gap-1.5 px-3.5 py-2.5 text-sm font-extrabold text-white bg-white/15 rounded-xl shadow hover:bg-white/25 transition-colors cursor-pointer"
                  title="Upload Teachers"
                >
                  <Upload className="w-4 h-4" /> Upload Teachers
                </button>
                <button
                  className="flex items-center gap-1.5 px-3.5 py-2.5 text-sm font-extrabold text-white bg-white/15 rounded-xl shadow hover:bg-white/25 transition-colors cursor-pointer"
                  title="Upload Photos"
                >
                  <ImageIcon className="w-4 h-4" /> Upload Photos
                </button>
                <button
                  onClick={exportTeachers}
                  className="p-2.5 rounded-xl bg-white/15 text-white hover:bg-white/25 transition-colors cursor-pointer"
                  title="Export PDF"
                >
                  <FileDown className="w-5 h-5" />
                </button>
              </>
            )}
            <Link
              to="/teachers/new"
              className="flex items-center gap-1.5 px-3.5 py-2.5 text-sm font-extrabold text-emerald-700 bg-white rounded-xl shadow hover:bg-emerald-50 transition-colors"
            >
              <UserPlus className="w-4 h-4" /> Add
            </Link>
          </div>
        </div>
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/60" />
          <input
            type="text"
            placeholder="Search teachers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 text-sm bg-white/15 border border-white/25 rounded-xl text-white placeholder:text-white/50 font-medium focus:outline-none focus:bg-white/25 transition-all"
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto bg-gray-50/50 p-4">
      {/* Main Table */}
      {loading ? (
        <LoadingSpinner size="lg" className="py-12" />
      ) : (
        <div className="min-w-[800px] w-full bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto hidden md:block">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="bg-gray-50 text-gray-600 border-b border-gray-200 font-bold uppercase tracking-wider text-xs">
                  <th className="px-5 py-4 border-r border-gray-100">
                    Teacher
                  </th>
                  <th className="px-5 py-4 border-r border-gray-100">
                    Employee ID
                  </th>
                  <th className="px-5 py-4 border-r border-gray-100">
                    Subject
                  </th>
                  <th className="px-5 py-4 border-r border-gray-100">
                    Qualification
                  </th>
                  <th className="px-5 py-4 text-center">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {teachers.map((teacher, idx) => {
                  const avatarColors = [
                    "from-indigo-500 to-purple-600",
                    "from-teal-400 to-emerald-600",
                    "from-rose-400 to-pink-600",
                    "from-amber-400 to-orange-500",
                    "from-blue-400 to-cyan-500",
                    "from-violet-500 to-fuchsia-600",
                  ];
                  const name = teacher.user?.name || "Teacher";
                  const colorIdx = name.charCodeAt(0) % avatarColors.length;
                  const colorClass = avatarColors[colorIdx];
                  const getInitials = (n: string) => {
                    const parts = n.trim().split(" ");
                    return parts.length >= 2
                      ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
                      : n[0].toUpperCase();
                  };
                  return (
                    <tr
                      key={teacher.id}
                      className="hover:bg-indigo-50/50 transition-colors bg-white group"
                    >
                      <td className="px-5 py-4 flex items-center gap-4 border-r border-gray-100">
                        <div className="relative shrink-0 inline-block">
                          {getPhotoUrl(teacher.user?.photoUrl) ? (
                            <img
                              src={getPhotoUrl(teacher.user?.photoUrl)}
                              alt={name}
                              className="w-11 h-11 rounded object-cover border border-gray-300 shadow-sm"
                            />
                          ) : (
                            <div
                              className={`w-11 h-11 rounded bg-gradient-to-br ${colorClass} flex items-center justify-center text-white font-bold text-sm shadow-sm border border-gray-200`}
                            >
                              {getInitials(name)}
                            </div>
                          )}
                          <span className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${teacher.user?.isActive ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                        </div>
                        <div>
                          <Link to={`/teachers/${teacher.id}`} className="font-bold text-gray-900 text-sm hover:text-indigo-600 transition-colors cursor-pointer">
                            {name}
                          </Link>
                          <p className="text-xs text-gray-500 font-medium mt-1">
                            {teacher.user?.email || "No email"}
                          </p>
                        </div>
                      </td>
                      <td className="px-5 py-4 border-r border-gray-100">
                        <span className="text-sm font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-3 py-1.5 rounded font-mono shadow-sm">
                          {teacher.employeeId}
                        </span>
                      </td>
                      <td className="px-5 py-4 border-r border-gray-100">
                        <span className="text-xs font-bold text-teal-700 bg-teal-50 border border-teal-100 px-3 py-1.5 rounded uppercase shadow-sm">
                          {teacher.specialization || "N/A"}
                        </span>
                      </td>
                      <td className="px-5 py-4 border-r border-gray-100">
                        <span className="text-sm font-bold text-gray-800">
                          {teacher.qualification || "N/A"}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <Link
                            to={`/teachers/${teacher.id}`}
                            className="p-2 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 hover:shadow-sm transition-all"
                            title="View Profile"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          {isSuperAdmin && (
                            <>
                              <Link
                                to={`/teachers/${teacher.id}/edit`}
                                className="p-2 rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-100 hover:shadow-sm transition-all"
                                title="Edit"
                              >
                                <Edit className="w-4 h-4" />
                              </Link>
                              <button
                                onClick={() => handleDelete(teacher.id)}
                                className="p-2 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 hover:shadow-sm transition-all cursor-pointer"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {teachers.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="py-12 text-center text-gray-400 font-semibold"
                    >
                      No teacher records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile View */}
          <div className="md:hidden flex flex-col gap-4 p-4 bg-transparent">
            {teachers.map((teacher, idx) => {
              const name = teacher.user?.name || "Teacher";
              const avatarColors = [
                "from-indigo-500 to-purple-600",
                "from-teal-400 to-emerald-600",
                "from-rose-400 to-pink-600",
                "from-amber-400 to-orange-500",
                "from-blue-400 to-cyan-500",
                "from-violet-500 to-fuchsia-600",
              ];
              const colorIdx = name.charCodeAt(0) % avatarColors.length;
              const colorClass = avatarColors[colorIdx];
              const getInitials = (n: string) => {
                const parts = n.trim().split(" ");
                return parts.length >= 2
                  ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
                  : n[0].toUpperCase();
              };
              return (
                <div
                  key={teacher.id}
                  className="bg-gradient-to-br from-white to-indigo-50/30 p-4 rounded-3xl shadow-sm hover:shadow-glow-primary hover:-translate-y-1 transition-all duration-300 border border-indigo-50 flex items-center gap-4 relative overflow-visible mt-2 backdrop-blur-md animate-fade-in-up"
                  style={{ animationDelay: `${idx * 40}ms` }}
                >
                  <div className="absolute -top-2.5 -left-2.5 w-7 h-7 bg-indigo-500 rounded-full flex items-center justify-center text-white font-black text-[10px] shadow-lg border-2 border-white dark:border-indigo-500 z-10">
                    {idx + 1}
                  </div>
                  <div className="shrink-0 pl-2">
                    {getPhotoUrl(teacher.user?.photoUrl) ? (
                      <img
                        src={getPhotoUrl(teacher.user?.photoUrl)}
                        alt={name}
                        className="w-14 h-14 rounded-2xl object-cover shadow-md border-2 border-white dark:border-white/10"
                      />
                    ) : (
                      <div
                        className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${colorClass} flex items-center justify-center text-white font-black text-xl shadow-md border-2 border-white dark:border-white/10`}
                      >
                        {getInitials(name)}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link
                      to={`/teachers/${teacher.id}`}
                      className="font-extrabold text-[15px] text-indigo-950 truncate block hover:text-indigo-600 transition-colors mb-2"
                    >
                      {name}
                    </Link>
                    <div className="flex flex-wrap gap-1.5">
                      <span className="font-mono text-[10px] font-bold text-indigo-700 dark:text-indigo-200 bg-indigo-50 dark:bg-indigo-500/20 px-2 py-0.5 rounded-md border border-indigo-100 dark:border-indigo-500/30">
                        {teacher.employeeId}
                      </span>
                      <span className="text-[10px] font-bold text-teal-700 dark:text-teal-200 bg-teal-50 dark:bg-teal-500/20 px-2 py-0.5 rounded-md border border-teal-100 dark:border-teal-500/30">
                        {teacher.specialization || "N/A"}
                      </span>
                    </div>
                  </div>
                  <div className="shrink-0 flex flex-col gap-2">
                    <Link
                      to={`/teachers/${teacher.id}`}
                      className="flex items-center justify-center w-10 h-10 bg-gray-50 dark:bg-white/5 hover:bg-indigo-50 dark:hover:bg-white/10 text-gray-400 hover:text-indigo-600 dark:hover:text-white rounded-xl transition-all shadow-sm border border-gray-200 dark:border-white/10 cursor-pointer"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    </Link>
                    {isSuperAdmin && (
                      <button
                        onClick={() => handleDelete(teacher.id)}
                        className="flex items-center justify-center w-10 h-10 bg-red-50 dark:bg-white/5 hover:bg-red-100 dark:hover:bg-white/10 text-red-400 hover:text-red-600 dark:hover:text-white rounded-xl transition-all shadow-sm border border-red-200 dark:border-white/10 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="shrink-0">
                    <Link
                      to={`/teachers/${teacher.id}`}
                      className="flex items-center justify-center w-10 h-10 bg-indigo-50 text-indigo-500 hover:bg-indigo-600 hover:text-white hover:shadow-lg hover:shadow-indigo-500/30 rounded-xl transition-all border border-indigo-100 cursor-pointer"
                    >
                      <Eye className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      </div>
    </div>
  );
};
export default TeacherListPage;

