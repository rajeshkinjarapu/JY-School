import React, { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import api from "../../api/axios";
import { Search, UserPlus, GraduationCap, Trash2, Edit, FileDown, Eye, Filter, ChevronLeft, ChevronRight, Upload, Image as ImageIcon, X, CheckCircle2, AlertCircle, FileText, FileSpreadsheet, Phone, IdCard, Menu, Printer } from "lucide-react";
import toast from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { DataCache } from '../../services/dataCache';
import { getPhotoUrl } from "../../utils/photo";
import { StudentListExportModal } from "./StudentListExportModal";
import { useAcademicYear } from "../../contexts/AcademicYearContext";

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

const getClassRank = (name: string = ''): number => {
  if (!name) return 999;
  const lower = name.toLowerCase().trim();
  if (lower.includes('nursery') || lower.includes('nursary') || lower.includes('nur') || lower.includes('pre-kg') || lower.includes('playgroup')) return 1;
  if (lower.includes('pp1') || lower.includes('pp-1') || lower.includes('lkg') || lower.includes('l.k.g') || lower.includes('pre-primary 1')) return 2;
  if (lower.includes('pp2') || lower.includes('pp-2') || lower.includes('ukg') || lower.includes('u.k.g') || lower.includes('pre-primary 2')) return 3;
  const match = lower.match(/(\d+)/);
  if (match) {
    return 10 + parseInt(match[1], 10);
  }
  return 999;
};

const sortStudentsClassWiseAndAlphabetical = (list: any[]) => {
  if (!Array.isArray(list)) return [];
  return [...list].sort((a, b) => {
    const classA = a.class || {};
    const classB = b.class || {};
    const classNameA = classA.name || a.className || '';
    const classNameB = classB.name || b.className || '';

    const rankA = getClassRank(classNameA);
    const rankB = getClassRank(classNameB);
    if (rankA !== rankB) return rankA - rankB;

    const secA = classA.section || (classNameA.includes('-') ? classNameA.split('-')[1]?.trim() : '') || '';
    const secB = classB.section || (classNameB.includes('-') ? classNameB.split('-')[1]?.trim() : '') || '';
    const secComp = secA.localeCompare(secB, undefined, { numeric: true, sensitivity: 'base' });
    if (secComp !== 0) return secComp;

    const nameA = (a.user?.name || a.name || '').trim();
    const nameB = (b.user?.name || b.name || '').trim();
    const nameComp = nameA.localeCompare(nameB, undefined, { sensitivity: 'base' });
    if (nameComp !== 0) return nameComp;

    return (a.rollNo || '').localeCompare(b.rollNo || '', undefined, { numeric: true });
  });
};

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
  const { selectedYear } = useAcademicYear();

  const [students, setStudents] = useState<any[]>(() => {
    try { 
      const raw = JSON.parse(localStorage.getItem('sl_students_cache') || '[]'); 
      return sortStudentsClassWiseAndAlphabetical(raw);
    } catch { return []; }
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
  const [photoZipFile, setPhotoZipFile] = useState<File | null>(null);
  const [photoUploadLoading, setPhotoUploadLoading] = useState(false);
  const [photoUploadResult, setPhotoUploadResult] = useState<any>(null);
  const [photoDragOver, setPhotoDragOver] = useState(false);

  const fetchClasses = useCallback(async () => {
    try {
      const res = await api.get('/api/classes', { params: { academicYear: selectedYear, limit: 100 } });
      const classList = res.data?.data || res.data || [];
      setClasses(classList);
    } catch {
      try {
        const classList = await DataCache.get('classes');
        setClasses(classList);
      } catch {}
    }
  }, [selectedYear]);

  const fetchStudents = useCallback(async () => {
    if (students.length === 0) setLoading(true);
    
    try {
      const response: any = await api.get("/api/students", {
        params: { search, classId, academicYear: selectedYear, limit: LIMIT, page },
      });
      const data = response.data.data || response.data || [];
      const sortedData = sortStudentsClassWiseAndAlphabetical(data);
      const totalCount = response.data.pagination?.total || response.data.meta?.total || sortedData.length;
      
      setStudents(sortedData);
      setTotal(totalCount);
      
      if (!search && !classId && page === 1) {
        localStorage.setItem(`sl_total_${selectedYear}`, String(totalCount));
        DataCache.set('students', sortedData);
      }
    } catch (err: any) {
      console.error("Failed to load students:", err);
      toast.error(err?.response?.data?.message || err?.message || "Failed to load students");
    } finally {
      setLoading(false);
    }
  }, [search, classId, page, selectedYear]);

  useEffect(() => {
    setPage(1);
    setClassId("");
  }, [selectedYear]);

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

  // Master Template & Export for Upsert
  const downloadTemplate = async () => {
    try {
      const res = await api.get('/api/students/template', { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Student_Master_Import_Template.xlsx';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Excel Master Template downloaded!');
    } catch (_) {
      // Fallback local XLSX generation
      const XLSX = await import("xlsx");
      const headers = [
        'Student ID', 'Student Name', 'Class Name', 'Section Name', 'Date of Birth',
        'Gender', 'Child ID', 'APAAR ID', 'PEN Number', 'Student Aadhar',
        'Father Name', 'Father Aadhar', 'Father Phone', 'Mother Name',
        'Mother Aadhar', 'Mother Phone', 'Address', 'Blood Group',
        'Admission Fee', 'Tuition Fee', 'Books Fee'
      ];
      const sampleRow1 = [
        'JY26-8001', 'K. Rajesh', '10th', 'A', '2010-05-15',
        'MALE', '1083920204', '928172938481', '20204049266', '457721363532',
        'K. Suryanarayana', '987654321098', '9502924437',
        'K. Lakshmi', '876543210987', '9848054321',
        'Narasannapeta, Srikakulam', 'O+',
        '5000', '25000', '2000'
      ];
      const sampleRow2 = [
        '', 'S. Grishma', '8th', 'B', '2012-08-20',
        'FEMALE', '1083920205', '928172938482', '20204049288', '568832474643',
        'S. Apparao', '987654322033', '9502924437',
        'S. Parvathi', '876543211099', '9502924438',
        'Palakonda Road, Srikakulam', 'B+',
        '4000', '20000', '2000'
      ];
      const ws = XLSX.utils.aoa_to_sheet([headers, sampleRow1, sampleRow2]);
      ws['!cols'] = [
        { wch: 14 }, { wch: 22 }, { wch: 12 }, { wch: 12 }, { wch: 14 },
        { wch: 10 }, { wch: 14 }, { wch: 16 }, { wch: 16 }, { wch: 16 },
        { wch: 20 }, { wch: 16 }, { wch: 15 }, { wch: 20 }, { wch: 16 },
        { wch: 15 }, { wch: 30 }, { wch: 12 }, { wch: 14 }, { wch: 14 }, { wch: 12 }
      ];
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Students_Template');
      XLSX.writeFile(wb, 'Student_Master_Import_Template.xlsx');
      toast.success('Excel Master Template downloaded!');
    }
  };

  const handleExportExistingForEdit = async () => {
    try {
      const toastId = toast.loading('Exporting all students for Excel editing...');
      const res = await api.get('/api/students/export', { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Students_Master_Update_Sheet.xlsx';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Export downloaded! Edit in Excel and re-upload here to update.', { id: toastId, duration: 5000 });
    } catch (e: any) {
      toast.error('Failed to export students');
    }
  };

  const handleBulkImport = async () => {
    if (!importFile) { toast.error('Please select an Excel file first.'); return; }
    setImportLoading(true);
    const t = toast.loading('Importing & syncing students...');
    try {
      const formData = new FormData();
      formData.append('file', importFile);
      const res: any = await api.post('/api/students/bulk-import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const data = res.data?.data || res.data;
      setImportResult(data);
      toast.success(`Import complete! 🆕 ${data.created || 0} Added, ✏️ ${data.updated || 0} Updated`, { id: t, duration: 5000 });
      fetchStudents();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Import failed', { id: t });
    } finally {
      setImportLoading(false);
    }
  };

  const handleBulkPhotoUpload = async () => {
    if (!photoZipFile) { toast.error('Please select a ZIP file first.'); return; }
    setPhotoUploadLoading(true);
    const t = toast.loading('Uploading & matching student photos...');
    try {
      const formData = new FormData();
      formData.append('file', photoZipFile);
      const res: any = await api.post('/api/students/bulk-photos', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const data = res.data?.data || res.data;
      setPhotoUploadResult(data);
      toast.success(`Photos uploaded! ${data.success || 0} students updated.`, { id: t, duration: 5000 });
      fetchStudents();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Photo upload failed', { id: t });
    } finally {
      setPhotoUploadLoading(false);
    }
  };

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="flex flex-col h-full">
      {/* ── Colorful Hero Header ── */}
      <div className="px-3.5 pt-3 pb-4 bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 shadow-lg">
        <div className="hidden md:flex items-center justify-between mb-3">
          <div className="flex items-center gap-4">
            <div>
              <p className="text-white/70 text-xs font-semibold uppercase tracking-wider">Total</p>
              <p className="text-2xl font-black text-white">{total} Students</p>
            </div>
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
                    setPhotoUploadResult(null);
                    setPhotoZipFile(null);
                    setShowPhotoModal(true);
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-2.5 text-sm font-extrabold text-white bg-white/15 rounded-xl shadow hover:bg-white/25 transition-colors cursor-pointer"
                  title="Upload Photos"
                >
                  <ImageIcon className="w-4 h-4" /> Upload Photos
                </button>
                <Link
                  to={`/students/custom-report${classId ? `?classId=${classId}` : ''}`}
                  className="flex items-center gap-1.5 px-3.5 py-2.5 text-sm font-black text-indigo-700 bg-white rounded-xl shadow hover:bg-indigo-50 hover:shadow-md transition-all cursor-pointer"
                  title="Custom Student Report & Print Studio (కస్టమ్ రిపోర్ట్ & ప్రింట్ స్టూడియో)"
                >
                  <Printer className="w-4 h-4 text-indigo-600" /> Print Studio
                </Link>
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
              <>
                <Link
                  to="/students/promotion"
                  className="flex items-center gap-1.5 px-3.5 py-2.5 text-sm font-extrabold text-pink-700 bg-white rounded-xl shadow hover:bg-pink-50 transition-colors"
                  title="Promote Students"
                >
                  <GraduationCap className="w-4 h-4" /> Promote
                </Link>
                <Link
                  to="/students/new"
                  className="flex items-center gap-1.5 px-3.5 py-2.5 text-sm font-extrabold text-indigo-700 bg-white rounded-xl shadow hover:bg-indigo-50 transition-colors"
                >
                  <UserPlus className="w-4 h-4" /> Add
                </Link>
              </>
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
          {/* Mobile Print Studio Shortcut */}
          <Link
            to={`/students/custom-report${classId ? `?classId=${classId}` : ''}`}
            className="md:hidden p-2.5 bg-white text-indigo-700 rounded-xl transition-all shadow-sm hover:bg-indigo-50 flex items-center justify-center shrink-0"
            title="Print Studio"
          >
            <Printer className="w-4 h-4" />
          </Link>
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
                      <Link to={`/students/${student.id}`} state={{ initialStudent: student }} className="block">
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
                      state={{ initialStudent: student }}
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
                  {/* Step 1: Template or Existing Students Export */}
                  <div className="flex items-start gap-4 p-4.5 bg-indigo-50/70 rounded-2xl border border-indigo-100">
                    <div className="p-3 bg-white rounded-xl shadow-xs text-indigo-600 shrink-0"><FileSpreadsheet className="w-6 h-6" /></div>
                    <div className="flex-1">
                      <h4 className="font-bold text-indigo-950 text-base">Step 1: Download Template or Current Records</h4>
                      <p className="text-xs text-indigo-700/80 mt-1 leading-relaxed">
                        మాస్టర్ ఎక్సెల్ ఫార్మాట్ ద్వారా <strong>Student ID, Child ID, APAAR ID, PEN, Aadhaar, Parents Data</strong> అన్నీ ఒకేసారి మేనేజ్ చేయవచ్చు.
                      </p>

                      <div className="mt-3.5 flex flex-wrap gap-2.5">
                        <button 
                          type="button" 
                          onClick={downloadTemplate} 
                          className="px-4 py-2.5 bg-indigo-600 text-white text-xs font-bold rounded-xl shadow-sm hover:bg-indigo-700 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
                        >
                          <FileDown className="w-4 h-4" /> Download Blank Template
                        </button>
                        <button 
                          type="button" 
                          onClick={handleExportExistingForEdit} 
                          className="px-4 py-2.5 bg-white text-indigo-700 border border-indigo-200 text-xs font-bold rounded-xl shadow-xs hover:bg-indigo-50 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
                          title="Download all students with their Student IDs to edit and re-upload"
                        >
                          <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Export Existing Students (To Edit)
                        </button>
                      </div>

                      {/* Upsert Hint Card */}
                      <div className="mt-3 p-3 bg-white/90 rounded-xl border border-indigo-100/80 text-[11px] text-slate-600 space-y-1.5">
                        <div className="flex items-center gap-1.5 font-bold text-indigo-900">
                          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                          <span>స్మార్ట్ పార్షియల్ అప్‌డేట్ (Any Custom Excel Supported):</span>
                        </div>
                        <p className="pl-3.5 text-slate-500 leading-relaxed">
                          • <strong>అన్ని కాలమ్స్ ఉండాల్సిన పనిలేదు:</strong> మీ ఎక్సెల్‌లో కేవలం <strong>Student ID</strong> (లేదా Roll No) మరియు మీరు అప్‌డేట్ చేయాలనుకుంటున్న కాలమ్స్ (ఉదా: కేవలం Child ID, లేదా APAAR ID, లేదా Aadhaar, లేదా Name) ఏవి ఉన్నా సిస్టమ్ వాటిని మాత్రమే అప్‌డేట్ చేస్తుంది.<br />
                          • ఎక్సెల్ ఫైల్‌లో ఉన్న ఫీల్డ్‌లు మాత్రమే అప్‌డేట్ అవుతాయి, మిగిలిన ఏ పాత డేటా చెక్కుచెదరదు.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Step 2: Upload Data */}
                  <div className="flex items-start gap-4 p-4.5 bg-purple-50/60 rounded-2xl border border-purple-100">
                    <div className="p-3 bg-white rounded-xl shadow-xs text-purple-600 shrink-0"><Upload className="w-6 h-6" /></div>
                    <div className="flex-1">
                      <h4 className="font-bold text-purple-950 text-base">Step 2: Upload Filled Excel Sheet</h4>
                      <p className="text-xs text-purple-700/80 mt-1">డేటా నింపిన ఎక్సెల్ ఫైల్‌ను ఇక్కడ అప్‌లోడ్ చేయండి.</p>
                      
                      <div 
                        className={`mt-3.5 border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer
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
                            <span className="font-bold text-slate-800 text-sm">{importFile.name}</span>
                            <span className="text-xs font-bold text-indigo-600 hover:underline">Click to choose another file</span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-2 text-slate-400">
                            <Upload className="w-8 h-8 text-purple-400" />
                            <span className="font-bold text-slate-700 text-sm">Click or drag Excel file here</span>
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">.xlsx, .xls, .csv</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-3 border-t border-slate-100">
                    <button
                      onClick={handleBulkImport}
                      disabled={!importFile || importLoading}
                      className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-black text-sm rounded-xl shadow-lg shadow-indigo-200 hover:from-indigo-700 hover:to-purple-700 active:scale-95 transition-all disabled:opacity-50 cursor-pointer flex items-center gap-2"
                    >
                      {importLoading ? (
                        <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"/> Processing Excel Data...</>
                      ) : (
                        <>Start Import & Sync</>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6 text-center py-5">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 shadow-inner">
                    <CheckCircle2 className="w-9 h-9" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-slate-800">Processing Complete!</h3>
                    <p className="text-slate-500 text-xs font-medium mt-1">ఎక్సెల్ డేటా విజయవంతంగా సిస్టమ్‌లో అప్‌డేట్ చేయబడింది.</p>
                  </div>
                  
                  {/* Detailed 3-Card Result Metrics */}
                  <div className="grid grid-cols-3 gap-3 max-w-md mx-auto mt-4">
                    <div className="bg-emerald-50 border border-emerald-100 p-3.5 rounded-2xl flex flex-col items-center shadow-xs">
                      <span className="text-2xl sm:text-3xl font-black text-emerald-600">{importResult?.created || 0}</span>
                      <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700/80 mt-1">🆕 New Added</span>
                    </div>

                    <div className="bg-indigo-50 border border-indigo-100 p-3.5 rounded-2xl flex flex-col items-center shadow-xs">
                      <span className="text-2xl sm:text-3xl font-black text-indigo-600">{importResult?.updated || 0}</span>
                      <span className="text-[10px] font-black uppercase tracking-wider text-indigo-700/80 mt-1">✏️ Updated</span>
                    </div>

                    <div className={`${(importResult?.failed?.length || 0) > 0 ? 'bg-rose-50 border-rose-100' : 'bg-slate-50 border-slate-100'} p-3.5 rounded-2xl flex flex-col items-center shadow-xs`}>
                      <span className={`text-2xl sm:text-3xl font-black ${(importResult?.failed?.length || 0) > 0 ? 'text-rose-600' : 'text-slate-400'}`}>{importResult?.failed?.length || 0}</span>
                      <span className={`text-[10px] font-black uppercase tracking-wider mt-1 ${(importResult?.failed?.length || 0) > 0 ? 'text-rose-700/80' : 'text-slate-400'}`}>⚠️ Errors</span>
                    </div>
                  </div>

                  {importResult?.failed && importResult.failed.length > 0 && (
                    <div className="text-left mt-5 max-h-40 overflow-y-auto bg-rose-50/60 border border-rose-100 p-3.5 rounded-xl text-sm">
                      <div className="flex items-center gap-2 text-rose-700 font-bold mb-2 text-xs">
                        <AlertCircle className="w-4 h-4" /> Failed Rows & Errors:
                      </div>
                      <ul className="space-y-1 text-rose-600 text-xs">
                        {importResult.failed.map((e: any, idx: number) => (
                          <li key={idx} className="flex gap-2">
                            <span className="font-mono bg-rose-100 px-1.5 rounded text-rose-700">Row {idx + 1} ({e.row?.studentname || e.row?.name || e.row?.studentid || 'Unknown'})</span>
                            <span>{e.reason}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="flex justify-center pt-4 mt-5 border-t border-slate-100">
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
      {/* Bulk Photo Upload Modal */}
      {showPhotoModal && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200">
            <div className="px-6 py-5 bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-between text-white">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-xl"><ImageIcon className="w-5 h-5" /></div>
                <div>
                  <h2 className="text-lg font-black tracking-tight">Bulk Upload Student Photos</h2>
                  <p className="text-white/80 text-xs font-medium">ZIP file containing photos named by Student ID (e.g. JY26-0511.jpg)</p>
                </div>
              </div>
              <button
                onClick={() => { setShowPhotoModal(false); setPhotoUploadResult(null); setPhotoZipFile(null); }}
                className="p-1.5 hover:bg-white/20 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 max-h-[80vh] overflow-y-auto">
              {!photoUploadResult ? (
                <div className="space-y-5">
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1.5">
                    <p className="font-bold text-slate-800">ఫోటోలు అప్‌లోడ్ చేసే విధానం:</p>
                    <p>1. ప్రతి విద్యార్థి ఫోటో పేరులో వారి <strong>Student ID</strong> ఉండేలా పెట్టుకోండి (ఉదా: <code className="px-1.5 py-0.5 bg-white border border-slate-200 rounded font-bold text-indigo-700">JY26-0511.jpg</code> లేదా <code className="px-1.5 py-0.5 bg-white border border-slate-200 rounded font-bold text-indigo-700">JY26-0511 Name.png</code>).</p>
                    <p>2. ఆ ఫోటోలన్నింటినీ ఒక <strong>.zip</strong> ఫైల్‌గా కంప్రెస్ చేసి ఇక్కడ అప్‌లోడ్ చేయండి.</p>
                  </div>

                  <div
                    onDragOver={(e) => { e.preventDefault(); setPhotoDragOver(true); }}
                    onDragLeave={() => setPhotoDragOver(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setPhotoDragOver(false);
                      if (e.dataTransfer.files?.[0]) setPhotoZipFile(e.dataTransfer.files[0]);
                    }}
                    onClick={() => document.getElementById('bulk-photo-zip-input')?.click()}
                    className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                      photoDragOver
                        ? 'border-indigo-500 bg-indigo-50'
                        : photoZipFile
                        ? 'border-emerald-400 bg-emerald-50/40'
                        : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      id="bulk-photo-zip-input"
                      type="file"
                      accept=".zip"
                      className="hidden"
                      onChange={(e) => setPhotoZipFile(e.target.files?.[0] || null)}
                    />
                    {photoZipFile ? (
                      <div className="flex flex-col items-center gap-2">
                        <div className="p-3 bg-emerald-100 text-emerald-600 rounded-full"><CheckCircle2 className="w-8 h-8" /></div>
                        <span className="font-bold text-slate-800 text-sm">{photoZipFile.name}</span>
                        <span className="text-xs font-bold text-indigo-600 hover:underline">Click to choose another ZIP file</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-slate-400">
                        <Upload className="w-8 h-8 text-indigo-500" />
                        <span className="font-bold text-slate-700 text-sm">Click or drag ZIP file here</span>
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">.zip (JPG, PNG, WEBP inside)</span>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                    <button
                      onClick={() => { setShowPhotoModal(false); setPhotoZipFile(null); }}
                      className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm transition cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleBulkPhotoUpload}
                      disabled={!photoZipFile || photoUploadLoading}
                      className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-black text-sm rounded-xl shadow-md hover:from-indigo-700 hover:to-purple-700 active:scale-95 transition-all disabled:opacity-50 cursor-pointer flex items-center gap-2"
                    >
                      {photoUploadLoading ? (
                        <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Uploading Photos...</>
                      ) : (
                        <>Upload Photos</>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-5 text-center py-4">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-emerald-100 text-emerald-600">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-800">Photo Upload Complete!</h3>
                    <p className="text-slate-500 text-xs font-medium mt-1">విద్యార్థుల ఫోటోలు విజయవంతంగా అప్‌డేట్ అయ్యాయి.</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 max-w-xs mx-auto">
                    <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-2xl flex flex-col items-center">
                      <span className="text-2xl font-black text-emerald-600">{photoUploadResult?.success || 0}</span>
                      <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 mt-1">Uploaded</span>
                    </div>
                    <div className={`${(photoUploadResult?.failed?.length || 0) > 0 ? 'bg-rose-50 border-rose-200' : 'bg-slate-50 border-slate-200'} border p-3.5 rounded-2xl flex flex-col items-center`}>
                      <span className={`text-2xl font-black ${(photoUploadResult?.failed?.length || 0) > 0 ? 'text-rose-600' : 'text-slate-400'}`}>{photoUploadResult?.failed?.length || 0}</span>
                      <span className={`text-[10px] font-black uppercase tracking-wider mt-1 ${(photoUploadResult?.failed?.length || 0) > 0 ? 'text-rose-700' : 'text-slate-400'}`}>Failed</span>
                    </div>
                  </div>

                  {photoUploadResult?.failed && photoUploadResult.failed.length > 0 && (
                    <div className="text-left max-h-40 overflow-y-auto bg-rose-50/70 border border-rose-200 p-3.5 rounded-xl text-xs">
                      <div className="flex items-center gap-1.5 text-rose-700 font-bold mb-2">
                        <AlertCircle className="w-4 h-4" /> Unmatched / Failed Files:
                      </div>
                      <ul className="space-y-1 text-rose-600">
                        {photoUploadResult.failed.map((e: any, idx: number) => (
                          <li key={idx} className="flex justify-between gap-2">
                            <span className="font-mono font-bold truncate">{e.file}</span>
                            <span className="shrink-0">{e.reason}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="flex justify-center pt-3 border-t border-slate-100">
                    <button
                      onClick={() => {
                        setPhotoUploadResult(null);
                        setPhotoZipFile(null);
                        setShowPhotoModal(false);
                      }}
                      className="px-8 py-2.5 bg-slate-100 text-slate-700 hover:bg-slate-200 font-black rounded-xl transition cursor-pointer"
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
