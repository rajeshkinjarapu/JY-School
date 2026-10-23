import React, { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import api from "../../api/axios";
import { LoadingSpinner } from "../../components/UI/LoadingSpinner";
import { Badge } from "../../components/UI/Badge";
import { Avatar } from "../../components/UI/Avatar";
import {
  Search, UserPlus, Trash2, Edit, Upload, FileDown, Eye, Image as ImageIcon,
  MessageCircle, Menu, X, CheckCircle2, AlertCircle, FileText, Info
} from "lucide-react";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { getPhotoUrl } from "../../utils/photo";
import { DataCache } from "../../services/dataCache";
import JSZip from "jszip";

export const TeacherListPage: React.FC = () => {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "SUPER_ADMIN";

  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Bulk Excel Import states
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);
  const [dragOver, setDragOver] = useState(false);

  // Bulk Photo Upload states
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [photoLoading, setPhotoLoading] = useState(false);
  const [photoProgressText, setPhotoProgressText] = useState('');
  const [photoResult, setPhotoResult] = useState<{ success: number; failed: any[] } | null>(null);
  const [photoDragOver, setPhotoDragOver] = useState(false);

  const fetchTeachers = async () => {
    // Instant cache load if no search
    if (!search) {
      try {
        const cached = await DataCache.get('teachers');
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
      const data = response.data.data || response.data || [];
      setTeachers(data);
      if (!search) {
        DataCache.set('teachers', data);
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
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this teacher?"))
      return;
    try {
      await api.delete(`/api/teachers/${id}`);
      toast.success("Teacher deleted successfully");
      await DataCache.del('teachers');
      fetchTeachers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || error.message || "Failed to delete teacher");
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
      "Qualification",
    ];
    const tableRows: any[] = [];

    teachers.forEach((teacher: any, index: number) => {
      const teacherData = [
        index + 1,
        teacher.employeeId || "-",
        teacher.user?.name || "-",
        teacher.user?.phone || "-",
        teacher.specialization || "-",
        teacher.qualification || "-",
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

  const downloadTemplate = async () => {
    try {
      const XLSX = await import("xlsx");
      const ws = XLSX.utils.aoa_to_sheet([
        ['Teacher Name', 'Mobile No', 'Subject', 'Qualification'],
        ['Somesh Kumar', '9949511604', 'Hindi', 'M.A., B.Ed.'],
        ['Arji Shyamala Rani', '7569964899', 'Physical Science', 'M.Sc., B.Ed.'],
        ['Tarra Varalakshmi', '8919853884', 'Mathematics', 'B.Sc., B.Ed.'],
      ]);
      ws['!cols'] = [{ wch: 22 }, { wch: 16 }, { wch: 20 }, { wch: 20 }];
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Teachers');
      XLSX.writeFile(wb, 'Teacher_Import_Template.xlsx');
    } catch (e: any) {
      toast.error("టెంప్లేట్ డౌన్‌లోడ్ విఫలమైంది");
    }
  };

  const handleBulkImport = async () => {
    if (!importFile) { toast.error('దయచేసి ముందుగా Excel లేదా CSV ఫైల్‌ను సెలెక్ట్ చేయండి.'); return; }
    setImportLoading(true);
    const t = toast.loading('టీచర్ల వివరాలు ఇంపోర్ట్ అవుతున్నాయి...');
    try {
      const formData = new FormData();
      formData.append('file', importFile);
      const res: any = await api.post('/api/teachers/bulk-import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const data = res.data?.data || res.data;
      setImportResult(data);
      await DataCache.del('teachers');
      toast.success(`ఇంపోర్ట్ పూర్తయింది! ✓ ${data.success || 0} సక్సెస్, ✗ ${data.failed?.length || 0} ఎర్రర్లు`, { id: t, duration: 5000 });
      fetchTeachers();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'ఇంపోర్ట్ విఫలమైంది', { id: t });
    } finally {
      setImportLoading(false);
    }
  };

  const handleBulkPhotosUpload = async () => {
    if (photoFiles.length === 0) {
      toast.error('దయచేసి ముందుగా ఫోటోలు లేదా ZIP ఫైల్‌ను సెలెక్ట్ చేయండి.');
      return;
    }
    setPhotoLoading(true);
    setPhotoProgressText('ఫోటోలను సిద్ధం చేస్తోంది...');
    const t = toast.loading('Teacher photos upload అవుతున్నాయి...');
    try {
      let fileToSend: File;
      
      if (photoFiles.length === 1 && photoFiles[0].name.toLowerCase().endsWith('.zip')) {
        fileToSend = photoFiles[0];
      } else {
        setPhotoProgressText(`ఫోటోలను ZIP ఫార్మాట్‌లోకి మార్చుతోంది (${photoFiles.length} photos)...`);
        const zip = new JSZip();
        for (const file of photoFiles) {
          zip.file(file.name, file);
        }
        const zipBlob = await zip.generateAsync({ type: 'blob' }, (metadata) => {
          setPhotoProgressText(`జిప్ ప్రాసెసింగ్: ${Math.round(metadata.percent)}%`);
        });
        fileToSend = new File([zipBlob], 'teacher_photos.zip', { type: 'application/zip' });
      }

      setPhotoProgressText('సర్వర్‌కు అప్‌లోడ్ చేస్తోంది...');
      const formData = new FormData();
      formData.append('file', fileToSend);

      const res: any = await api.post('/api/teachers/bulk-photos', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const data = res.data?.data || res.data;
      setPhotoResult(data);
      
      await DataCache.del('teachers');

      toast.success(
        res.data?.message || `టీచర్ ఫోటోలు విజయవంతంగా అప్‌లోడ్ అయ్యాయి! (${data.success || 0} విజయం, ${data.failed?.length || 0} విఫలం)`,
        { id: t, duration: 6000 }
      );
      fetchTeachers();
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'ఫోటోల అప్‌లోడ్ విఫలమైంది', { id: t });
    } finally {
      setPhotoLoading(false);
      setPhotoProgressText('');
    }
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
                  onClick={() => { setImportResult(null); setImportFile(null); setShowImportModal(true); }}
                  className="flex items-center gap-1.5 px-3.5 py-2.5 text-sm font-extrabold text-white bg-white/15 rounded-xl shadow hover:bg-white/25 transition-colors cursor-pointer active:scale-95"
                  title="Upload Teachers (Excel)"
                >
                  <Upload className="w-4 h-4" /> Upload Teachers
                </button>
                <button
                  onClick={() => { setPhotoResult(null); setPhotoFiles([]); setShowPhotoModal(true); }}
                  className="flex items-center gap-1.5 px-3.5 py-2.5 text-sm font-extrabold text-white bg-white/15 rounded-xl shadow hover:bg-white/25 transition-colors cursor-pointer active:scale-95"
                  title="Upload Photos (ZIP / Images)"
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

        {/* Search & Mobile Actions */}
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

        {/* Mobile quick actions for Super Admin */}
        {isSuperAdmin && (
          <div className="flex md:hidden gap-2 mt-2.5 pt-2.5 border-t border-white/15">
            <button
              onClick={() => { setImportResult(null); setImportFile(null); setShowImportModal(true); }}
              className="flex-1 flex items-center justify-center gap-1 py-2 px-2 text-xs font-bold text-white bg-white/15 rounded-lg hover:bg-white/25 transition-colors cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" /> Upload Excel
            </button>
            <button
              onClick={() => { setPhotoResult(null); setPhotoFiles([]); setShowPhotoModal(true); }}
              className="flex-1 flex items-center justify-center gap-1 py-2 px-2 text-xs font-bold text-white bg-white/15 rounded-lg hover:bg-white/25 transition-colors cursor-pointer"
            >
              <ImageIcon className="w-3.5 h-3.5" /> Upload Photos
            </button>
            <button
              onClick={exportTeachers}
              className="p-2 bg-white/15 text-white rounded-lg hover:bg-white/25 transition-colors cursor-pointer"
              title="Export PDF"
            >
              <FileDown className="w-4 h-4" />
            </button>
            <Link
              to="/teachers/new"
              className="flex items-center justify-center gap-1 py-2 px-3 text-xs font-bold text-emerald-800 bg-white rounded-lg shadow transition-colors"
            >
              <UserPlus className="w-3.5 h-3.5" /> Add
            </Link>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto bg-gray-50/50 p-4">
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
                                loading="lazy"
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

      {/* ── Bulk Import Teachers Modal ── */}
      {showImportModal && createPortal(
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="absolute inset-0" onClick={() => !importLoading && setShowImportModal(false)}></div>
          <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden animate-scale-in">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 flex justify-between items-center text-white">
              <div>
                <h3 className="text-xl font-black">Import Teachers</h3>
                <p className="text-white/70 text-sm font-medium mt-1">Upload multiple teachers via Excel / CSV</p>
              </div>
              <button 
                onClick={() => !importLoading && setShowImportModal(false)}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors cursor-pointer"
                disabled={importLoading}
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6">
              {!importResult ? (
                <div className="space-y-6">
                  <div className="flex items-start gap-4 p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100">
                    <div className="p-3 bg-white rounded-xl shadow-sm text-indigo-600"><FileText className="w-6 h-6" /></div>
                    <div>
                      <h4 className="font-bold text-indigo-900">Step 1: Download Template</h4>
                      <p className="text-sm text-indigo-700/70 mt-1">Use our standard format with Teacher Name, Mobile No, Subject, and Qualification.</p>
                      <button onClick={downloadTemplate} className="mt-3 px-4 py-2 bg-indigo-600 text-white text-sm font-bold rounded-xl shadow-sm hover:bg-indigo-700 transition-colors cursor-pointer">
                        Download Excel Template
                      </button>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-4 bg-purple-50/50 rounded-2xl border border-purple-100">
                    <div className="p-3 bg-white rounded-xl shadow-sm text-purple-600"><Upload className="w-6 h-6" /></div>
                    <div className="flex-1">
                      <h4 className="font-bold text-purple-900">Step 2: Upload Data</h4>
                      <p className="text-sm text-purple-700/70 mt-1">Upload your filled Excel or CSV file here.</p>
                      
                      <div 
                        className={`mt-4 border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer
                          ${dragOver ? 'border-purple-500 bg-purple-50' : 'border-purple-200 bg-white hover:border-purple-400 hover:bg-purple-50/30'}`}
                        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                        onDragLeave={() => setDragOver(false)}
                        onDrop={(e) => {
                          e.preventDefault();
                          setDragOver(false);
                          if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                            setImportFile(e.dataTransfer.files[0]);
                          }
                        }}
                        onClick={() => document.getElementById('teacher-import-file-input')?.click()}
                      >
                        <input 
                          id="teacher-import-file-input" 
                          type="file" 
                          accept=".xlsx,.xls,.csv"
                          className="hidden" 
                          onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                        />
                        {importFile ? (
                          <div className="flex flex-col items-center gap-2">
                            <div className="p-3 bg-emerald-100 text-emerald-600 rounded-full"><CheckCircle2 className="w-8 h-8" /></div>
                            <span className="font-bold text-slate-700">{importFile.name}</span>
                            <span className="text-xs font-bold text-slate-400">Click to change file</span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-2 text-slate-400">
                            <Upload className="w-8 h-8 text-purple-300" />
                            <span className="font-bold text-slate-600">Click or drag file here</span>
                            <span className="text-xs font-bold uppercase tracking-wider">.xlsx, .xls, .csv</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-4 border-t border-slate-100">
                    <button
                      onClick={handleBulkImport}
                      disabled={!importFile || importLoading}
                      className="px-6 py-2.5 bg-indigo-600 text-white font-black rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:shadow-indigo-300 active:scale-95 transition-all disabled:opacity-50 cursor-pointer flex items-center gap-2"
                    >
                      {importLoading ? (
                        <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"/> Importing...</>
                      ) : (
                        <>Import Teachers</>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6 text-center py-6">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 mb-2 shadow-inner">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-slate-800">Import Complete</h3>
                    <p className="text-slate-500 font-medium mt-1">Teacher records have been processed.</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
                    <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl">
                      <span className="text-3xl font-black text-emerald-600">{importResult.success || 0}</span>
                      <span className="block text-xs font-bold uppercase tracking-wider text-emerald-600/70 mt-1">Success</span>
                    </div>
                    <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl">
                      <span className="text-3xl font-black text-rose-600">{importResult.failed?.length || 0}</span>
                      <span className="block text-xs font-bold uppercase tracking-wider text-rose-600/70 mt-1">Errors</span>
                    </div>
                  </div>

                  {importResult.failed?.length > 0 && (
                    <div className="text-left bg-rose-50/50 border border-rose-100 rounded-2xl p-4 max-h-48 overflow-y-auto">
                      <h5 className="font-bold text-rose-900 text-sm mb-2 flex items-center gap-1.5">
                        <AlertCircle className="w-4 h-4 text-rose-500" /> Error Details
                      </h5>
                      <div className="space-y-2">
                        {importResult.failed.map((f: any, i: number) => (
                          <div key={i} className="text-xs bg-white p-2.5 rounded-xl border border-rose-100 shadow-xs flex justify-between gap-2">
                            <span className="font-bold text-slate-700">{f.row?.Name || f.row?.name || f.row?.Phone || 'Record'}:</span>
                            <span className="text-rose-600 font-medium">{f.reason}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-center pt-2">
                    <button
                      onClick={() => { setShowImportModal(false); setImportResult(null); setImportFile(null); }}
                      className="px-8 py-2.5 bg-slate-900 text-white font-bold rounded-xl shadow hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      Done
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── Bulk Photo Upload Modal ── */}
      {showPhotoModal && createPortal(
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="absolute inset-0" onClick={() => !photoLoading && setShowPhotoModal(false)} />
          <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden animate-scale-in max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-violet-700 p-5 sm:p-6 flex justify-between items-center text-white shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-white/15 rounded-2xl backdrop-blur-md">
                  <ImageIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-black">Upload Teacher Photos</h3>
                  <p className="text-white/80 text-xs sm:text-sm font-medium mt-0.5">
                    ఉపాధ్యాయుల ప్రొఫైల్ ఫోటోల బల్క్ అప్‌లోడ్
                  </p>
                </div>
              </div>
              <button 
                onClick={() => !photoLoading && setShowPhotoModal(false)}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors cursor-pointer"
                disabled={photoLoading}
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Modal Body */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
              {!photoResult ? (
                <>
                  {/* Instructions Box */}
                  <div className="p-4 bg-indigo-50/70 rounded-2xl border border-indigo-100/80 space-y-2">
                    <div className="flex items-center gap-2 text-indigo-900 font-bold text-sm">
                      <Info className="w-4 h-4 text-indigo-600 shrink-0" />
                      <span>ముఖ్యమైన సూచనలు (Naming Instructions):</span>
                    </div>
                    <ul className="text-xs text-indigo-800/90 space-y-1.5 pl-6 list-disc font-medium leading-relaxed">
                      <li>
                        ప్రతి ఫోటో ఫైల్ పేరు టీచర్ <strong>Employee ID</strong> (ఉదా: <code>SVJY-1140.jpg</code> లేదా <code>1140.jpg</code>), లేదా <strong>మొబైల్ నెంబర్</strong> (<code>9949511604.jpg</code>), లేదా <strong>టీచర్ పేరు</strong> (<code>SOMESH.jpg</code>) తో ఉండాలి.
                      </li>
                      <li>
                        మీరు ఒకేసారి ఫోల్డర్ నుండి <strong>బహుళ ఫోటోలను (Multiple Photos)</strong> సెలెక్ట్ చేసుకోవచ్చు లేదా ఫోటోలు ఉన్న <strong>.ZIP ఫైల్</strong> ని అప్‌లోడ్ చేయవచ్చు.
                      </li>
                      <li>
                        సపోర్ట్ చేసే ఫార్మాట్లు: <strong>.JPG, .JPEG, .PNG, .WEBP, .ZIP</strong>
                      </li>
                    </ul>
                  </div>

                  {/* Dropzone */}
                  <div 
                    className={`border-2 border-dashed rounded-3xl p-6 sm:p-8 text-center transition-all cursor-pointer relative ${
                      photoDragOver 
                        ? 'border-indigo-500 bg-indigo-50/60 scale-[0.99]' 
                        : 'border-slate-200 bg-slate-50/50 hover:border-indigo-400 hover:bg-indigo-50/20'
                    }`}
                    onDragOver={(e) => { e.preventDefault(); setPhotoDragOver(true); }}
                    onDragLeave={() => setPhotoDragOver(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setPhotoDragOver(false);
                      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                        setPhotoFiles(Array.from(e.dataTransfer.files));
                      }
                    }}
                    onClick={() => document.getElementById('teacher-bulk-photo-input')?.click()}
                  >
                    <input 
                      id="teacher-bulk-photo-input" 
                      type="file" 
                      accept=".zip,image/jpeg,image/png,image/webp,image/jpg"
                      multiple
                      className="hidden" 
                      onChange={(e) => {
                        if (e.target.files && e.target.files.length > 0) {
                          setPhotoFiles(Array.from(e.target.files));
                        }
                      }}
                    />

                    {photoFiles.length > 0 ? (
                      <div className="flex flex-col items-center gap-3">
                        <div className="p-3.5 bg-emerald-100 text-emerald-600 rounded-2xl shadow-sm">
                          <CheckCircle2 className="w-8 h-8" />
                        </div>
                        <div>
                          <p className="font-black text-slate-800 text-base">
                            {photoFiles.length === 1 
                              ? photoFiles[0].name 
                              : `${photoFiles.length} Photos Selected`}
                          </p>
                          <p className="text-xs font-bold text-slate-400 mt-1">
                            {photoFiles.length === 1 
                              ? `${(photoFiles[0].size / 1024).toFixed(1)} KB` 
                              : `Total: ${(photoFiles.reduce((acc, f) => acc + f.size, 0) / (1024 * 1024)).toFixed(2)} MB`}
                          </p>
                        </div>

                        {photoFiles.length > 1 && !photoFiles[0].name.toLowerCase().endsWith('.zip') && (
                          <div className="flex flex-wrap gap-1.5 justify-center max-h-28 overflow-y-auto p-2 bg-white rounded-xl border border-slate-200 w-full mt-2">
                            {photoFiles.slice(0, 15).map((f, i) => (
                              <span key={i} className="text-[10px] font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200 truncate max-w-[140px]" title={f.name}>
                                {f.name}
                              </span>
                            ))}
                            {photoFiles.length > 15 && (
                              <span className="text-[10px] font-bold text-indigo-600 px-2 py-0.5">
                                +{photoFiles.length - 15} more
                              </span>
                            )}
                          </div>
                        )}

                        <span className="text-xs font-bold text-indigo-600 hover:text-indigo-800 underline mt-1">
                          Click to select different files
                        </span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2.5 text-slate-400">
                        <div className="p-4 bg-indigo-50 text-indigo-500 rounded-3xl">
                          <Upload className="w-8 h-8" />
                        </div>
                        <div>
                          <p className="font-extrabold text-slate-700 text-base">
                            ఫోటోలను ఇక్కడ డ్రాగ్ చేయండి లేదా క్లిక్ చేసి సెలెక్ట్ చేయండి
                          </p>
                          <p className="text-xs font-medium text-slate-500 mt-1">
                            Click or Drag .ZIP or Multiple Image Files (.jpg, .png)
                          </p>
                        </div>
                        <span className="text-[11px] font-black uppercase tracking-wider text-indigo-500 bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-full mt-2">
                          .ZIP / MULTIPLE IMAGES
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setShowPhotoModal(false)}
                      disabled={photoLoading}
                      className="px-5 py-2.5 text-slate-600 hover:bg-slate-100 font-bold text-sm rounded-xl transition-all cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleBulkPhotosUpload}
                      disabled={photoFiles.length === 0 || photoLoading}
                      className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-extrabold text-sm rounded-xl shadow-lg shadow-indigo-200 active:scale-95 transition-all disabled:opacity-50 cursor-pointer flex items-center gap-2"
                    >
                      {photoLoading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>{photoProgressText || 'Uploading...'}</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4" />
                          <span>Upload Photos</span>
                        </>
                      )}
                    </button>
                  </div>
                </>
              ) : (
                /* Result View */
                <div className="space-y-6 text-center py-4">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 mb-1 shadow-inner">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                  <div>
                    <h3 className="text-xl sm:text-2xl font-black text-slate-800">Photo Upload Complete</h3>
                    <p className="text-slate-500 font-medium text-xs sm:text-sm mt-1">
                      టీచర్ ఫోటోల ప్రాసెసింగ్ విజయవంతంగా పూర్తయింది.
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
                    <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl flex flex-col items-center">
                      <span className="text-3xl font-black text-emerald-600">{photoResult.success || 0}</span>
                      <span className="text-xs font-bold uppercase tracking-wider text-emerald-600/70 mt-1">Photos Updated</span>
                    </div>
                    <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl flex flex-col items-center">
                      <span className="text-3xl font-black text-rose-600">{photoResult.failed?.length || 0}</span>
                      <span className="text-xs font-bold uppercase tracking-wider text-rose-600/70 mt-1">Failed / Not Found</span>
                    </div>
                  </div>

                  {photoResult.failed?.length > 0 && (
                    <div className="text-left bg-rose-50/60 border border-rose-100 rounded-2xl p-4 max-h-48 overflow-y-auto">
                      <h5 className="font-bold text-rose-900 text-xs sm:text-sm mb-2 flex items-center gap-1.5">
                        <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" /> Failed Files Details:
                      </h5>
                      <div className="space-y-1.5">
                        {photoResult.failed.map((f: any, i: number) => (
                          <div key={i} className="text-xs bg-white p-2 rounded-xl border border-rose-100 flex items-center justify-between gap-2">
                            <span className="font-mono font-bold text-slate-700 truncate">{f.file}</span>
                            <span className="text-rose-600 font-semibold text-[11px] shrink-0">{f.reason}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-center pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowPhotoModal(false);
                        setPhotoResult(null);
                        setPhotoFiles([]);
                      }}
                      className="px-8 py-2.5 bg-slate-900 text-white font-bold rounded-xl shadow hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      Done
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
export default TeacherListPage;
