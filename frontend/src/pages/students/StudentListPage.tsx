import React, { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import api from "../../api/axios";
import { Search, UserPlus, Trash2, Edit, FileDown, Eye, Filter, ChevronLeft, ChevronRight, Upload, Image as ImageIcon, X, CheckCircle2, AlertCircle, FileText, FileSpreadsheet, Phone, IdCard, Menu, Info } from "lucide-react";
import toast from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { DataCache } from '../../services/dataCache';
import { getPhotoUrl } from "../../utils/photo";
import { StudentListExportModal } from "./StudentListExportModal";
import JSZip from "jszip";

const LIMIT = 50;

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
const StudentAvatar = ({ name, photoUrl, isActive }: { name?: string, photoUrl?: string, isActive?: boolean }) => {
  const safeName = name || "Student";
  const colorClass = avatarColors[safeName.charCodeAt(0) % avatarColors.length];
  const url = getPhotoUrl(photoUrl);

  return (
    <div className="relative shrink-0 inline-block">
      {url ? (
        <img src={url} alt={safeName} loading="lazy" className="w-12 h-16 rounded object-cover border border-gray-300 shadow-sm" />
      ) : (
        <div className={`w-12 h-16 rounded bg-gradient-to-br ${colorClass} flex items-center justify-center text-white font-bold text-sm shadow-sm border border-gray-200`}>
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

  const [students, setStudents] = useState<any[]>(() => {
    try { return JSON.parse(localStorage.getItem('sl_students_cache') || '[]'); } catch { return []; }
  });
  const [classes, setClasses] = useState<any[]>(() => {
    try { return JSON.parse(localStorage.getItem('sl_classes_cache') || '[]'); } catch { return []; }
  });
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [classId, setClassId] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(() => {
    try { return parseInt(localStorage.getItem('sl_total_cache') || '0'); } catch { return 0; }
  });

  const [exportDialog, setExportDialog] = useState<{ open: boolean; type: 'pdf' | 'excel' }>({ open: false, type: 'pdf' });

  // Bulk import states
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);
  const [dragOver, setDragOver] = useState(false);

  // Bulk photo upload states
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [photoLoading, setPhotoLoading] = useState(false);
  const [photoProgressText, setPhotoProgressText] = useState('');
  const [photoResult, setPhotoResult] = useState<{ success: number; failed: any[] } | null>(null);
  const [photoDragOver, setPhotoDragOver] = useState(false);

  const fetchClasses = useCallback(async () => {
    try {
      const classList = await DataCache.get('classes');
      setClasses(classList);
    } catch {}
  }, []);

  const fetchStudents = useCallback(async () => {
    // If no filters and page 1, try cache first for instant load
    if (!search && !classId && page === 1) {
      try {
        const cachedStudents = await DataCache.get('students');
        if (cachedStudents && cachedStudents.length > 0) {
          setStudents(cachedStudents);
          setTotal(cachedStudents.length > LIMIT ? cachedStudents.length : parseInt(localStorage.getItem('sl_total_cache') || '0'));
          setLoading(false);
        }
      } catch (_) {}
    }

    if (students.length === 0) setLoading(true);
    
    try {
      const response: any = await api.get("/api/students", {
        params: { search, classId, limit: LIMIT, page },
      });
      const data = response.data.data || response.data || [];
      const totalCount = response.data.pagination?.total || response.data.meta?.total || data.length;
      
      setStudents(data);
      setTotal(totalCount);
      
      if (!search && !classId && page === 1) {
        localStorage.setItem('sl_total_cache', String(totalCount));
        DataCache.set('students', data);
      }
    } catch (err: any) {
      console.error("Failed to load students:", err);
      toast.error(err?.response?.data?.message || err?.message || "Failed to load students");
    } finally {
      setLoading(false);
    }
  }, [search, classId, page]);

  useEffect(() => { fetchClasses(); }, [fetchClasses]);

  useEffect(() => {
    const timer = setTimeout(fetchStudents, search || classId ? 400 : 0);
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

  // Old export function replaced by Export Modal

  const downloadTemplate = async () => {
    const XLSX = await import("xlsx");
    const ws = XLSX.utils.aoa_to_sheet([
      ['Student Name', 'Mobile No', 'Class', 'Section', 'Father Name', 'Date of Birth', 'Address'],
      ['Suhash Kumar', '9052308483', 'PP1', 'A', 'Botu', '2019-05-12', 'Visakhapatnam'],
      ['Arvindh', '9597429747', 'PP1', 'A', 'Vanjarapu', '2019-08-22', 'Hyderabad'],
    ]);
    ws['!cols'] = [{ wch: 20 }, { wch: 15 }, { wch: 10 }, { wch: 10 }, { wch: 20 }, { wch: 15 }, { wch: 30 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Students');
    XLSX.writeFile(wb, 'Student_Import_Template.xlsx');
  };

  const handleBulkImport = async () => {
    if (!importFile) { toast.error('Please select an Excel file first.'); return; }
    setImportLoading(true);
    const t = toast.loading('Importing students...');
    try {
      const formData = new FormData();
      formData.append('file', importFile);
      const res: any = await api.post('/api/students/bulk-import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const data = res.data?.data || res.data;
      setImportResult(data);
      toast.success(`Import done! ✓ ${data.success || 0} success, ✗ ${data.failed?.length || 0} errors`, { id: t, duration: 5000 });
      fetchStudents();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Import failed', { id: t });
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
    const t = toast.loading('Student photos upload అవుతున్నాయి...');
    try {
      let fileToSend: File;
      
      // If single ZIP file was uploaded directly
      if (photoFiles.length === 1 && photoFiles[0].name.toLowerCase().endsWith('.zip')) {
        fileToSend = photoFiles[0];
      } else {
        // Multiple images: bundle them into a ZIP in browser using JSZip!
        setPhotoProgressText(`ఫోటోలను ZIP ఫార్మాట్‌లోకి మార్చుతోంది (${photoFiles.length} photos)...`);
        const zip = new JSZip();
        for (const file of photoFiles) {
          zip.file(file.name, file);
        }
        const zipBlob = await zip.generateAsync({ type: 'blob' }, (metadata) => {
          setPhotoProgressText(`జిప్ ప్రాసెసింగ్: ${Math.round(metadata.percent)}%`);
        });
        fileToSend = new File([zipBlob], 'student_photos.zip', { type: 'application/zip' });
      }

      setPhotoProgressText('సర్వర్‌కు అప్‌లోడ్ చేస్తోంది...');
      const formData = new FormData();
      formData.append('file', fileToSend);

      const res: any = await api.post('/api/students/bulk-photos', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const data = res.data?.data || res.data;
      setPhotoResult(data);
      
      // Invalidate student caches so new photos appear everywhere
      await DataCache.del('students');
      try {
        localStorage.removeItem('sl_students_cache');
      } catch (_) {}

      toast.success(
        res.data?.message || `ఫోటోలు విజయవంతంగా అప్‌లోడ్ అయ్యాయి! (${data.success || 0} విజయం, ${data.failed?.length || 0} విఫలం)`,
        { id: t, duration: 6000 }
      );
      fetchStudents();
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'ఫోటోల అప్‌లోడ్ విఫలమైంది', { id: t });
    } finally {
      setPhotoLoading(false);
      setPhotoProgressText('');
    }
  };

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="flex flex-col h-full">
      {/* ── Colorful Hero Header ── */}
      <div className="px-3.5 pt-3 pb-4 bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 shadow-lg">
        <div className="hidden md:flex items-center justify-between mb-3">
          <div>
            <p className="text-white/70 text-xs font-semibold uppercase tracking-wider">Total</p>
            <p className="text-2xl font-black text-white">{total} Students</p>
          </div>
          <div className="hidden md:flex gap-2">
            {isSuperAdmin && (
              <>
                <button
                  onClick={() => setShowImportModal(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2.5 text-sm font-extrabold text-white bg-white/15 rounded-xl shadow hover:bg-white/25 transition-colors cursor-pointer"
                  title="Upload Students"
                >
                  <Upload className="w-4 h-4" /> Upload Students
                </button>
                <button
                  onClick={() => {
                    setPhotoFiles([]);
                    setPhotoResult(null);
                    setShowPhotoModal(true);
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-2.5 text-sm font-extrabold text-white bg-white/15 rounded-xl shadow hover:bg-white/25 transition-colors cursor-pointer"
                  title="Upload Photos"
                >
                  <ImageIcon className="w-4 h-4" /> Upload Photos
                </button>
                <button
                  onClick={() => setExportDialog({ open: true, type: 'pdf' })}
                  className="flex items-center gap-1.5 px-3.5 py-2.5 text-sm font-extrabold text-indigo-700 bg-white rounded-xl shadow hover:bg-indigo-50 transition-colors"
                  title="Export PDF"
                >
                  <FileText className="w-4 h-4" /> PDF
                </button>
                <button
                  onClick={() => setExportDialog({ open: true, type: 'excel' })}
                  className="flex items-center gap-1.5 px-3.5 py-2.5 text-sm font-extrabold text-emerald-700 bg-white rounded-xl shadow hover:bg-emerald-50 transition-colors"
                  title="Export Excel"
                >
                  <FileSpreadsheet className="w-4 h-4" /> Excel
                </button>
              </>
            )}
            {(isSuperAdmin || user?.role === 'ADMIN') && (
              <Link
                to="/students/new"
                className="flex items-center gap-1.5 px-3.5 py-2.5 text-sm font-extrabold text-indigo-700 bg-white rounded-xl shadow hover:bg-indigo-50 transition-colors"
              >
                <UserPlus className="w-4 h-4" /> Add
              </Link>
            )}
          </div>
        </div>

        {/* Search + Filter */}
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
          {isSuperAdmin && (
            <button
              onClick={() => {
                setPhotoFiles([]);
                setPhotoResult(null);
                setShowPhotoModal(true);
              }}
              className="p-2.5 md:hidden bg-white/15 hover:bg-white/25 text-white rounded-xl transition-colors cursor-pointer border border-white/25 shadow-sm"
              title="Upload Photos"
              aria-label="Upload Photos"
            >
              <ImageIcon className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* ── Student List (Tabular) ── */}
      <div className="flex-1 overflow-auto bg-gray-50/50 p-4 hidden md:block">
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
                      {student.user?.phone ? (
                        <a href={`tel:${student.user.phone}`} className="text-indigo-600 hover:text-indigo-800 text-sm font-medium flex items-center gap-1.5 transition-colors">
                          <Phone className="w-4 h-4" />
                          {student.user.phone}
                        </a>
                      ) : (
                        <span className="text-gray-400 text-sm font-medium">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Student List View */}
      <div className="flex-1 overflow-auto bg-slate-50/50 p-2 md:hidden">
        {loading ? (
          <div className="py-12 flex flex-col items-center gap-2">
            <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
            <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">Loading Students...</p>
          </div>
        ) : students.length === 0 ? (
          <div className="py-16 text-center text-gray-400 bg-white rounded-3xl border border-slate-100 p-8 shadow-sm">
            <div className="w-16 h-16 rounded-full bg-indigo-50 flex items-center justify-center mx-auto mb-3">
              <Search className="w-7 h-7 text-indigo-300" />
            </div>
            <p className="font-bold text-gray-500 text-lg">No students found</p>
            <p className="text-sm text-gray-400 mt-1">Try adjusting your search or filter</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3 pb-24">
            {students.map((student, idx) => {
              const name = student.user?.name || 'Unknown Student';
              return (
                <div key={student.id} className="bg-white rounded-[16px] p-3.5 shadow-sm border border-slate-100 flex flex-col hover:shadow-md transition-shadow relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-2.5">
                    <span className="text-[10px] font-black text-slate-300 group-hover:text-indigo-200 transition-colors">
                      #{(page - 1) * LIMIT + idx + 1}
                    </span>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="shrink-0 relative group">
                      <StudentAvatar name={student.user?.name} photoUrl={student.user?.photoUrl} isActive={student.user?.isActive} />
                    </div>
                    
                    <div className="min-w-0 flex-1 pt-1">
                      <Link to={`/students/${student.id}`} className="block">
                        <h3 className="font-extrabold text-lg text-slate-800 hover:text-indigo-600 truncate transition-colors leading-tight" title={name}>
                          {name}
                        </h3>
                      </Link>
                      
                      <div className="mt-3 flex flex-wrap gap-2">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-teal-50 text-teal-700 border border-teal-100">
                          Class {student.class?.name || 'N/A'}-{student.class?.section || 'N/A'}
                        </span>
                        {student.rollNo && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                            <IdCard className="w-3.5 h-3.5" />
                            {student.rollNo}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-auto pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-slate-500">
                      {student.user?.phone ? (
                        <a href={`tel:${student.user.phone}`} className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors bg-indigo-50 px-3 py-2 rounded-xl">
                          <Phone className="w-3.5 h-3.5" />
                          <span className="truncate max-w-[120px]">{student.user.phone}</span>
                        </a>
                      ) : (
                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 bg-slate-50 px-3 py-2 rounded-xl">
                          <Phone className="w-3.5 h-3.5" />
                          <span className="truncate max-w-[120px]">{student.fatherName || student.parentName || 'No Contact'}</span>
                        </div>
                      )}
                    </div>
                    <Link 
                      to={`/students/${student.id}`} 
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-extrabold text-white bg-indigo-500 hover:bg-indigo-600 rounded-xl transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5"
                    >
                      <Eye className="w-4 h-4" /> View Profile
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
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

      {/* Bulk Import Modal */}
      {showImportModal && createPortal(
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="absolute inset-0" onClick={() => !importLoading && setShowImportModal(false)}></div>
          <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden animate-scale-in">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 flex justify-between items-center text-white">
              <div>
                <h3 className="text-xl font-black">Import Students</h3>
                <p className="text-white/70 text-sm font-medium mt-1">Upload multiple students via Excel</p>
              </div>
              <button 
                onClick={() => !importLoading && setShowImportModal(false)}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors cursor-pointer"
                disabled={importLoading}
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
                      <p className="text-sm text-indigo-700/70 mt-1">Use our standard format to ensure data imports correctly.</p>
                      <button onClick={downloadTemplate} className="mt-3 px-4 py-2 bg-indigo-600 text-white text-sm font-bold rounded-xl shadow-sm hover:bg-indigo-700 transition-colors cursor-pointer">
                        Download Excel Template
                      </button>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-4 bg-purple-50/50 rounded-2xl border border-purple-100">
                    <div className="p-3 bg-white rounded-xl shadow-sm text-purple-600"><Upload className="w-6 h-6" /></div>
                    <div className="flex-1">
                      <h4 className="font-bold text-purple-900">Step 2: Upload Data</h4>
                      <p className="text-sm text-purple-700/70 mt-1">Upload your filled Excel file here.</p>
                      
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
                        onClick={() => document.getElementById('import-file-input')?.click()}
                      >
                        <input 
                          id="import-file-input" 
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
                        <>Import Students</>
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
                    <p className="text-slate-500 font-medium mt-1">Your data has been processed.</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto mt-6">
                    <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl flex flex-col items-center">
                      <span className="text-3xl font-black text-emerald-600">{importResult?.success || 0}</span>
                      <span className="text-xs font-bold uppercase tracking-wider text-emerald-600/70 mt-1">Success</span>
                    </div>
                    <div className={`${(importResult?.failed?.length || 0) > 0 ? 'bg-rose-50 border-rose-100' : 'bg-slate-50 border-slate-100'} p-4 rounded-2xl flex flex-col items-center`}>
                      <span className={`text-3xl font-black ${(importResult?.failed?.length || 0) > 0 ? 'text-rose-600' : 'text-slate-400'}`}>{importResult?.failed?.length || 0}</span>
                      <span className={`text-xs font-bold uppercase tracking-wider mt-1 ${(importResult?.failed?.length || 0) > 0 ? 'text-rose-600/70' : 'text-slate-400'}`}>Failed</span>
                    </div>
                  </div>

                  {importResult?.failed && importResult.failed.length > 0 && (
                    <div className="text-left mt-6 max-h-40 overflow-y-auto bg-rose-50/50 border border-rose-100 p-3 rounded-xl text-sm">
                      <div className="flex items-center gap-2 text-rose-700 font-bold mb-2">
                        <AlertCircle className="w-4 h-4" /> Error Details
                      </div>
                      <ul className="space-y-1 text-rose-600 text-xs">
                        {importResult.failed.map((e: any, idx: number) => (
                          <li key={idx} className="flex gap-2">
                            <span className="font-mono bg-rose-100 px-1.5 rounded text-rose-700">Row {idx + 1} ({e.row?.name || e.row?.studentname || 'Unknown'})</span>
                            <span>{e.reason}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="flex justify-center pt-4 mt-6 border-t border-slate-100">
                    <button
                      onClick={() => {
                        setImportResult(null);
                        setImportFile(null);
                        setShowImportModal(false);
                      }}
                      className="px-8 py-2.5 bg-slate-100 text-slate-700 hover:bg-slate-200 font-black rounded-xl transition-all cursor-pointer"
                    >
                      Close
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="absolute inset-0" onClick={() => !photoLoading && setShowPhotoModal(false)} />
          <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden animate-scale-in max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-violet-700 p-5 sm:p-6 flex justify-between items-center text-white shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-white/15 rounded-2xl backdrop-blur-md">
                  <ImageIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-black">Upload Student Photos</h3>
                  <p className="text-white/80 text-xs sm:text-sm font-medium mt-0.5">
                    విద్యార్థి ప్రొఫైల్ ఫోటోల బల్క్ అప్‌లోడ్
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
                        ప్రతి ఫోటో ఫైల్ పేరు విద్యార్థి <strong>Roll No / ID</strong> తో ఉండాలి.
                        <br />
                        <span className="font-mono bg-white/80 px-2 py-0.5 rounded text-indigo-900 border border-indigo-200 mt-1 inline-block">
                          ఉదాహరణ: JY26-0001.jpg, JY26-0002.png లేదా JY26-0001 Charan.jpg
                        </span>
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
                    onClick={() => document.getElementById('bulk-photo-file-input')?.click()}
                  >
                    <input 
                      id="bulk-photo-file-input" 
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

                        {/* File preview thumbnails if multiple images selected */}
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
                      ఫోటోల ప్రాసెసింగ్ విజయవంతంగా పూర్తయింది.
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
                    <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl flex flex-col items-center">
                      <span className="text-3xl font-black text-emerald-600">{photoResult.success || 0}</span>
                      <span className="text-xs font-bold uppercase tracking-wider text-emerald-600/70 mt-1">Photos Updated</span>
                    </div>
                    <div className={`${(photoResult.failed?.length || 0) > 0 ? 'bg-rose-50 border-rose-100' : 'bg-slate-50 border-slate-100'} p-4 rounded-2xl flex flex-col items-center`}>
                      <span className={`text-3xl font-black ${(photoResult.failed?.length || 0) > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                        {photoResult.failed?.length || 0}
                      </span>
                      <span className={`text-xs font-bold uppercase tracking-wider mt-1 ${(photoResult.failed?.length || 0) > 0 ? 'text-rose-600/70' : 'text-slate-400'}`}>
                        Failed / Skipped
                      </span>
                    </div>
                  </div>

                  {photoResult.failed && photoResult.failed.length > 0 && (
                    <div className="text-left max-h-44 overflow-y-auto bg-rose-50/50 border border-rose-100 p-3.5 rounded-2xl text-sm">
                      <div className="flex items-center gap-2 text-rose-700 font-bold mb-2 text-xs">
                        <AlertCircle className="w-4 h-4" /> విఫలమైన ఫైల్స్ వివరాలు:
                      </div>
                      <ul className="space-y-1.5 text-rose-600 text-xs">
                        {photoResult.failed.map((e: any, idx: number) => (
                          <li key={idx} className="flex items-center justify-between gap-2 bg-white/70 p-2 rounded-lg border border-rose-100">
                            <span className="font-mono font-bold text-slate-700 truncate max-w-[200px]">{e.file}</span>
                            <span className="text-rose-600 font-medium shrink-0">{e.reason}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="flex justify-center pt-4 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => {
                        setPhotoResult(null);
                        setPhotoFiles([]);
                        setShowPhotoModal(false);
                      }}
                      className="px-8 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl shadow-md transition-all cursor-pointer"
                    >
                      Done / పూర్తయింది
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      <StudentListExportModal 
        isOpen={exportDialog.open}
        onClose={() => setExportDialog(f => ({ ...f, open: false }))}
        exportType={exportDialog.type}
        students={students}
        totalStudents={total}
        classId={classId}
        search={search}
      />
    </div>
  );
};
export default StudentListPage;