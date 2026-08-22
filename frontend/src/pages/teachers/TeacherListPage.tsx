import React, { useEffect, useState, useRef } from "react";
import api from "../../api/axios";
import { LoadingSpinner } from "../../components/UI/LoadingSpinner";
import { Badge } from "../../components/UI/Badge";
import { Avatar } from "../../components/UI/Avatar";
import { Search, UserPlus, Trash2, Edit, Upload, FileDown, Eye, Image as ImageIcon, MessageCircle, Menu } from "lucide-react";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
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

  const exportTeachers = async () => {
    const { default: jsPDF } = await import("jspdf");
    const { default: autoTable } = await import("jspdf-autotable");

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
      <div className="px-3 pt-3 pb-4 bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 shadow-lg">
        <div className="hidden md:flex items-center justify-between mb-3">
          <div>
            <p className="text-white/70 text-xs font-semibold uppercase tracking-wider">Total</p>
            <p className="text-2xl font-black text-white">{teachers.length} Teachers</p>
          </div>
          <div className="hidden md:flex gap-2">
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
        <div className="flex gap-2 items-center">
          {/* Hamburger Menu - Mobile Only */}
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('toggleSidebar'))}
            className="p-2.5 md:hidden bg-white/15 hover:bg-white/25 text-white rounded-xl transition-colors cursor-pointer border border-white/25 shadow-sm"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          
          <div className="relative flex-1">
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
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto bg-gray-50/50 p-4">
      {/* Main Content */}
      {loading ? (
        <LoadingSpinner size="lg" className="py-12" />
      ) : (
        <div className="w-full">
          {/* Desktop View */}
          <div className="overflow-x-auto hidden md:block bg-white rounded-xl shadow-sm border border-gray-200">
            <table className="w-full text-sm text-left min-w-[800px]">
              <thead>
                <tr className="bg-gray-50 text-gray-600 border-b border-gray-200 font-bold uppercase tracking-wider text-xs">
                  <th className="px-5 py-4 text-center w-12 border-r border-gray-100">
                    #
                  </th>
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
                  <th className="px-5 py-4 border-r border-gray-100">
                    Mobile No
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
                      <td className="px-5 py-4 text-center text-sm font-bold text-gray-500 border-r border-gray-100">
                        {idx + 1}
                      </td>
                      <td className="px-5 py-4 flex items-center gap-4 border-r border-gray-100">
                        <div className="relative shrink-0 inline-block">
                          {getPhotoUrl(teacher.user?.photoUrl) ? (
                            <img
                              src={getPhotoUrl(teacher.user?.photoUrl)}
                              alt={name}
                              className="w-12 h-16 rounded object-cover border border-gray-300 shadow-sm"
                            />
                          ) : (
                            <div
                              className={`w-12 h-16 rounded bg-gradient-to-br ${colorClass} flex items-center justify-center text-white font-bold text-sm shadow-sm border border-gray-200`}
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
                        <div className="flex items-center gap-3 text-gray-700 text-sm font-medium whitespace-nowrap">
                          {teacher.user?.phone || "–"}
                          {teacher.user?.phone && (
                            <a href={`https://wa.me/91${teacher.user.phone}`} target="_blank" rel="noreferrer" 
                               className="flex items-center gap-1.5 px-2.5 py-1 bg-[#25D366] hover:bg-[#128C7E] text-white text-xs font-bold rounded shadow-sm transition-colors cursor-pointer" title="Message on WhatsApp">
                              <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.888-.788-1.487-1.761-1.66-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
                              </svg>
                              WhatsApp
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {teachers.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
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
                    <div className="flex items-center gap-2 mb-2">
                      <Link
                        to={`/teachers/${teacher.id}`}
                        className="font-extrabold text-[15px] text-indigo-950 truncate block hover:text-indigo-600 transition-colors"
                      >
                        {name}
                      </Link>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <span className="font-mono text-[10px] font-bold text-indigo-700 dark:text-indigo-200 bg-indigo-50 dark:bg-indigo-500/20 px-2 py-0.5 rounded-md border border-indigo-100 dark:border-indigo-500/30">
                        {teacher.employeeId}
                      </span>
                      <span className="text-[10px] font-bold text-teal-700 dark:text-teal-200 bg-teal-50 dark:bg-teal-500/20 px-2 py-0.5 rounded-md border border-teal-100 dark:border-teal-500/30">
                        {teacher.specialization || "N/A"}
                      </span>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-2">
                    {teacher.user?.phone && (
                      <a href={`https://wa.me/91${teacher.user.phone}`} target="_blank" rel="noreferrer" className="flex items-center justify-center w-10 h-10 bg-[#25D366] hover:bg-[#128C7E] text-white rounded-xl shadow-md transition-all cursor-pointer" title="WhatsApp Message">
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.888-.788-1.487-1.761-1.66-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
                        </svg>
                      </a>
                    )}
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

