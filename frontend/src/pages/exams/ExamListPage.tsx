import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import { LoadingSpinner } from '../../components/UI/LoadingSpinner';
import { PageHeader } from '../../components/UI/PageHeader';
import { Badge } from '../../components/UI/Badge';
import { useAuth } from '../../hooks/useAuth';
import {
  Plus, Edit3, Trash2, ClipboardList, BookOpen, Layers, CheckSquare,
  Clock, Award, FileText, Settings, Play, ShieldAlert, HelpCircle, Save, X, Calendar, ExternalLink,
  MapPin, FileSpreadsheet, Download, Printer, CheckCircle, MessageSquare, ChevronDown, Key, Upload, Link as LinkIcon, RefreshCw, Copy,
  Search, ArrowLeft, LayoutGrid, List, Check, Sparkles, ArrowRight
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Link, useSearchParams, useOutletContext, useNavigate } from 'react-router-dom';
import { formatExamOptionLabel } from '../../utils/formatters';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { sortClasses } from '../../utils/sortClasses';
import { AdmitCardTab } from './AdmitCardTab';
import { ProgressCardTab } from './ProgressCardTab';
import { ResultsTab } from './ResultsTab';
import { JEEProgressCardTab } from './JEEProgressCardTab';
import { ExamStatusTab } from './ExamStatusTab';
import { ExamSettingsTab } from './ExamSettingsTab';

const ExamCard: React.FC<{
  label: string;
  icon: React.ElementType;
  bgGradient: string;
  iconGradient: string;
  borderClass: string;
  titleColor?: string;
  badgeText?: string;
  badgeClass?: string;
  onClick: () => void;
  sub?: string;
}> = ({
  label,
  icon: Icon,
  bgGradient,
  iconGradient,
  borderClass,
  titleColor = 'text-[#1E1B4B]',
  badgeText,
  badgeClass = 'bg-white/80 text-indigo-700 border-indigo-100',
  onClick,
  sub,
}) => {
  return (
    <div
      onClick={onClick}
      className={`group relative overflow-hidden rounded-[22px] p-4 sm:p-5 min-h-[132px] sm:min-h-[148px] flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 cursor-pointer border shadow-[0_6px_22px_-8px_rgba(79,70,229,0.14)] hover:shadow-[0_14px_30px_-8px_rgba(79,70,229,0.22)] ${bgGradient} ${borderClass}`}
    >
      {/* Subtle Light Gloss & Watermark */}
      <div className="absolute -right-3 -bottom-3 opacity-[0.07] group-hover:opacity-[0.13] transition-all duration-500 transform group-hover:scale-110 pointer-events-none text-indigo-950">
        <Icon className="w-20 h-20 sm:w-24 sm:h-24" />
      </div>
      <div className="absolute -top-10 -right-10 w-24 h-24 bg-white/55 blur-xl rounded-full pointer-events-none" />

      <div className="relative z-10 flex items-start justify-between gap-2">
        <div className={`w-11 h-11 rounded-2xl ${iconGradient} text-white flex items-center justify-center shadow-md transition-transform duration-300 group-hover:scale-105`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex items-center gap-1.5">
          {badgeText && (
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border shadow-xs ${badgeClass}`}>
              {badgeText}
            </span>
          )}
          <span className="w-7 h-7 rounded-full bg-white/85 group-hover:bg-white text-slate-600 group-hover:text-indigo-700 flex items-center justify-center shadow-xs border border-white transition-all">
            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
          </span>
        </div>
      </div>

      <div className="relative z-10 mt-3">
        <h3 className={`text-sm sm:text-[15px] font-black tracking-tight leading-snug truncate ${titleColor}`}>{label}</h3>
        {sub && (
          <p className="text-[11px] sm:text-xs text-slate-600 font-bold flex items-center gap-1.5 truncate mt-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-current opacity-50 shrink-0" />
            {sub}
          </p>
        )}
      </div>
    </div>
  );
};

export const ExamListPage: React.FC = () => {
  const { user } = useAuth();
  const isAdminOrTeacher = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN' || user?.role === 'TEACHER';
  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';
  const isTeacher = user?.role === 'TEACHER';
  const isStudent = user?.role === 'STUDENT';

  const navigate = useNavigate();

  // Search parameters for linking tabs from sidebar
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  
  const { setDynamicTitle } = (useOutletContext() as { setDynamicTitle?: (title: string) => void }) || {};

  // Tabs
  const [activeTab, setActiveTab] = useState<'examination' | 'exam-plan' | 'question-group' | 'question-bank' | 'question-papers' | 'add-online-exam' | 'online-exams' | 'written-exam' | 'admit-card' | 'results' | 'progress-card' | 'jee-progress-card' | 'settings' | 'slip-tests' | 'status-overview' | ''>('');

  useEffect(() => {
    setActiveTab((tabParam as any) || '');
  }, [tabParam]);

  useEffect(() => {
    if (setDynamicTitle) {
      if (activeTab === '') setDynamicTitle('Examination Dashboard');
      else {
        const titles: Record<string, string> = {
          'examination': 'Create & Manage Exams',
          'exam-plan': 'Exam Plan',
          'question-group': 'Question Groups',
          'question-bank': 'Question Bank',
          'question-papers': 'Question Papers',
          'add-online-exam': 'Add Online Exam',
          'online-exams': 'Online Exams',
          'written-exam': 'Written Exam',
          'admit-card': 'Admit Cards',
          'results': 'Results Entry',
          'progress-card': 'Progress Cards',
          'jee-progress-card': 'Progress Cards',
          'settings': 'Exam Settings',
          'slip-tests': 'Slip Tests',
          'status-overview': 'Status Overview'
        };
        setDynamicTitle(titles[activeTab] || 'Examinations');
      }
    }
  }, [activeTab, setDynamicTitle]);

  // Base Data
  const [exams, setExams] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter selections
  const [selectedExamId, setSelectedExamId] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');

  // -------------------------------------------------------------
  // EXAMINATION Tab States & Logic
  // -------------------------------------------------------------
  const openCreateModal = () => {
    navigate('/exams/create');
  };

  const openEditModal = (exam: any) => {
    navigate('/exams/create', { state: { exam } });
  };

  const handleDuplicateExam = (exam: any) => {
    navigate('/exams/create', { state: { exam, isDuplicate: true } });
  };

  // Written Exam State
  const [selectedWrittenExamId, setSelectedWrittenExamId] = useState('');

  // Excel Upload States
  const [showExcelModal, setShowExcelModal] = useState(false);
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [excelExamId, setExcelExamId] = useState('');
  const [expandedExam, setExpandedExam] = useState<string | null>(null);

  // Directory & Question Papers UI Filters
  const [examSearch, setExamSearch] = useState('');
  const [examCategoryFilter, setExamCategoryFilter] = useState<'ALL' | 'BOARD' | 'NAVODAYA' | 'JEE' | 'OTHER'>('ALL');
  const [examViewMode, setExamViewMode] = useState<'grid' | 'list'>('grid');
  const [qpSearch, setQpSearch] = useState('');
  const [qpStatusFilter, setQpStatusFilter] = useState<'ALL' | 'PUBLISHED' | 'APPROVED' | 'PENDING_APPROVAL' | 'REJECTED'>('ALL');
  const [qpClassFilter, setQpClassFilter] = useState('');

  const selectTab = (tab: typeof activeTab) => {
    setActiveTab(tab);
    setSearchParams(tab ? { tab } : {});
  };

  const fetchExams = async (silent = false) => {
    try {
      // Serve from localStorage cache instantly, then refresh in background
      const CACHE_KEY = 'jy_exams_cache';
      const CACHE_TTL = 5 * 60 * 1000; // 5 min
      if (!silent) {
        try {
          const raw = localStorage.getItem(CACHE_KEY);
          if (raw) {
            const { data, ts } = JSON.parse(raw);
            if (Date.now() - ts < CACHE_TTL && Array.isArray(data) && data.length > 0) {
              setExams(data);
              setLoading(false);
              // Still refresh in background silently
              fetchExams(true);
              return;
            }
          }
        } catch (_) {}
      }
      const res: any = await api.get('/api/exams?limit=500');
      const list = Array.isArray(res) ? res : (res?.data || []);
      setExams(list);
      try { localStorage.setItem(CACHE_KEY, JSON.stringify({ data: list, ts: Date.now() })); } catch (_) {}
    } catch (e) {
      if (!silent) toast.error('Failed to load exams');
    }
  };

  const handleDeleteExam = async (id: string) => {
    if (!confirm('Are you sure you want to delete this exam? This will remove all associated marks and plans.')) return;
    try {
      await api.delete(`/api/exams/${id}`);
      toast.success('Exam deleted successfully');
      fetchExams();
    } catch (err: any) {
      toast.error(err.message || 'Error deleting exam');
    }
  };

  // -------------------------------------------------------------
  // EXCEL UPLOAD Logic
  // -------------------------------------------------------------
  const downloadSampleExcel = async () => {
    const XLSX = await import('xlsx');
    
    let subjectNames = ["Maths", "Physics", "Chemistry"];
    const selectedExam = exams.find(e => e.id === excelExamId);
    if (selectedExam && selectedExam.subjects) {
      try {
        const subjectsObj = typeof selectedExam.subjects === 'string' ? JSON.parse(selectedExam.subjects) : selectedExam.subjects;
        const allSubjects = new Set<string>();
        if (subjectsObj?.globalSubjects) subjectsObj.globalSubjects.forEach((s: any) => allSubjects.add(s.name));
        if (subjectsObj?.classConfigs) {
          subjectsObj.classConfigs.forEach((cfg: any) => {
            if (cfg.subjects) cfg.subjects.forEach((s: any) => allSubjects.add(s.name));
          });
        }
        if (allSubjects.size > 0) subjectNames = Array.from(allSubjects);
      } catch (e) {}
    }

    const ws = XLSX.utils.json_to_sheet([
      { "S.No": 1, "Student ID": "STU123", "Student Name": "John Doe", ...Object.fromEntries(subjectNames.map(s => [s, 85])) },
      { "S.No": 2, "Student ID": "STU124", "Student Name": "Jane Doe", ...Object.fromEntries(subjectNames.map(s => [s, 90])) }
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Marks");
    XLSX.writeFile(wb, "Sample_Marks_Upload.xlsx");
  };

  const handleExcelUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!excelFile || !excelExamId) {
      toast.error('Please select an exam and a file');
      return;
    }
    
    // Show loading state here if desired
    const toastId = toast.loading('Processing Excel file...');

    try {
      // Fetch subjects to map names to IDs
      const subjectsRes: any = await api.get('/api/subjects?limit=500');
      const subjectsList = subjectsRes.data?.data || subjectsRes.data || [];
      const subjectMap = new Map(subjectsList.map((s: any) => [s.name.toLowerCase().trim(), s.id]));

      const reader = new FileReader();
      reader.onload = async (evt) => {
        try {
          const data = evt.target?.result;
          const XLSX = await import('xlsx');
          const workbook = XLSX.read(data, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const sheet = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
          
          const mappedMarks: any[] = [];

          sheet.forEach((row: any) => {
            const studentId = row['Student ID'] || row['studentId'] || row['Student Id'] || row['ID'];
            if (!studentId) return;

            Object.keys(row).forEach((key) => {
              const normalizedKey = key.toLowerCase().trim();
              if (['student id', 'studentid', 'student_id', 'id', 'remarks', 's.no', 's. no', 'sno', 'student name', 'studentname', 'name'].includes(normalizedKey)) return;

              // Assume any other column is a subject
              let subjectId = key;
              
              // Try to find the subject ID from the fetched subjects
              if (subjectMap.has(normalizedKey)) {
                subjectId = subjectMap.get(normalizedKey);
              }

              const marksObtained = Number(row[key]);
              if (!isNaN(marksObtained)) {
                mappedMarks.push({
                  studentId: String(studentId),
                  examId: excelExamId,
                  subjectId: subjectId,
                  marksObtained: marksObtained,
                  remarks: row['Remarks'] || row['remarks'] || ''
                });
              }
            });
          });

          if (mappedMarks.length === 0) {
            toast.error('No valid marks found in the file', { id: toastId });
            return;
          }

          await api.post('/api/marks/bulk', {
            examId: excelExamId,
            marks: mappedMarks
          });
          toast.success('Excel marks uploaded successfully!', { id: toastId });
          setShowExcelModal(false);
          setExcelFile(null);
        } catch (err: any) {
          toast.error(err.response?.data?.message || 'Error processing excel file', { id: toastId });
        }
      };
      reader.readAsBinaryString(excelFile);
    } catch (err) {
      toast.error('Error fetching subjects or uploading excel file', { id: toastId });
    }
  };

  const downloadClassSampleExcel = async (exam: any, classObj: any) => {
    const toastId = toast.loading('Generating Excel Sample...');
    try {
      const XLSX = await import('xlsx');
      
      const res = await api.get('/api/students', { params: { classId: classObj.id, limit: 1000 } });
      const students = res.data?.data || res.data || [];
      const sortedStudents = students.sort((a: any, b: any) => (a.rollNumber || '').localeCompare(b.rollNumber || ''));

      let subjectNames = ["Maths", "Physics", "Chemistry"];
      if (exam && exam.subjects) {
        try {
          const subjectsObj = typeof exam.subjects === 'string' ? JSON.parse(exam.subjects) : exam.subjects;
          let classSubjects: any[] = [];
          if (subjectsObj?.classConfigs) {
            const cfg = subjectsObj.classConfigs.find((c: any) => c.classId === classObj.id);
            if (cfg && cfg.subjects && cfg.subjects.length > 0) {
              classSubjects = cfg.subjects;
            }
          }
          if (classSubjects.length === 0 && subjectsObj?.globalSubjects) {
            classSubjects = subjectsObj.globalSubjects;
          }
          if (classSubjects.length > 0) {
            subjectNames = classSubjects.map((s: any) => s.name);
          }
        } catch (e) {}
      }

      const rows = sortedStudents.map((st: any, idx: number) => ({
        "S.No": idx + 1,
        "Student ID": st.rollNo || st.rollNumber || st.id.substring(0, 8),
        "Student Name": st.user?.name || "Unknown",
        ...Object.fromEntries(subjectNames.map(s => [s, ""]))
      }));

      if (rows.length === 0) {
        // Fallback dummy row if no students found
        rows.push({
          "S.No": 1,
          "Student ID": "STU123",
          "Student Name": "John Doe",
          ...Object.fromEntries(subjectNames.map(s => [s, ""]))
        });
      }

      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Marks");
      XLSX.writeFile(wb, `${exam.name}_${classObj.name}_Sample.xlsx`);
      toast.success('Excel Generated Successfully!', { id: toastId });
    } catch (err) {
      toast.error('Failed to generate Excel', { id: toastId });
    }
  };

  const downloadClassSamplePDF = async (exam: any, classObj: any) => {
    const toastId = toast.loading('Generating PDF...');
    try {
      const res = await api.get('/api/students', { params: { classId: classObj.id, limit: 1000 } });
      const students = res.data?.data || res.data || [];
      const sortedStudents = students.sort((a: any, b: any) => (a.rollNumber || '').localeCompare(b.rollNumber || ''));

      let subjectNames = ["Maths", "Physics", "Chemistry"];
      if (exam && exam.subjects) {
        try {
          const subjectsObj = typeof exam.subjects === 'string' ? JSON.parse(exam.subjects) : exam.subjects;
          let classSubjects: any[] = [];
          if (subjectsObj?.classConfigs) {
            const cfg = subjectsObj.classConfigs.find((c: any) => c.classId === classObj.id);
            if (cfg && cfg.subjects && cfg.subjects.length > 0) {
              classSubjects = cfg.subjects;
            }
          }
          if (classSubjects.length === 0 && subjectsObj?.globalSubjects) {
            classSubjects = subjectsObj.globalSubjects;
          }
          if (classSubjects.length > 0) {
            subjectNames = classSubjects.map((s: any) => s.name);
          }
        } catch (e) {}
      }

      const doc = new jsPDF('p', 'pt', 'a4');
      
      let schoolName = "JY SCHOOL";
      try {
        const schoolSettingsRes = await api.get('/api/settings/school');
        if (schoolSettingsRes.data?.data?.name) {
          schoolName = schoolSettingsRes.data.data.name;
        }
      } catch (e) {}
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(schoolName, doc.internal.pageSize.getWidth() / 2, 35, { align: 'center' });
      
      doc.setFontSize(10);
      doc.text(`Exam: ${exam.name}   |   Class: ${classObj.name} ${classObj.section ? `(${classObj.section})` : ''}`, doc.internal.pageSize.getWidth() / 2, 55, { align: 'center' });
      
      const head = [["S.No", "Student ID", "Student Name", ...subjectNames]];
      const body = sortedStudents.map((st: any, idx: number) => [
        (idx + 1).toString(),
        st.rollNo || st.rollNumber || st.id.substring(0, 8),
        st.user?.name || "Unknown",
        ...subjectNames.map(() => "")
      ]);

      // Calculate dynamic row height to fit A4 page (842pt height)
      const availableHeight = 842 - 70 - 30; // startY 70, bottom margin 30
      const headerHeight = 25;
      let dynamicRowHeight = Math.floor((availableHeight - headerHeight) / Math.max(sortedStudents.length, 1));
      
      // Cap the row height between 14pt (min for readability) and 35pt (max to not look too stretched)
      dynamicRowHeight = Math.max(14, Math.min(dynamicRowHeight, 35));

      autoTable(doc, {
        head,
        body,
        startY: 70,
        theme: 'grid',
        styles: { fontSize: 9, cellPadding: 2, minCellHeight: dynamicRowHeight, textColor: 20, valign: 'middle' },
        headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold', halign: 'center', fontSize: 9, minCellHeight: 25 },
        columnStyles: {
          0: { cellWidth: 35, halign: 'center' }, // S.No
          1: { cellWidth: 85, fontStyle: 'bold', halign: 'center' }, // ID (now short Roll No)
          2: { cellWidth: 160, fontStyle: 'bold' }, // Name
        },
        margin: { top: 30, right: 20, bottom: 20, left: 20 },
      });

      doc.save(`${exam.name}_${classObj.name}_Marks_Template.pdf`);
      toast.success('PDF Generated Successfully!', { id: toastId });
    } catch (err) {
      toast.error('Failed to generate PDF', { id: toastId });
    }
  };

  const handleClassExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>, examId: string, classId: string) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const toastId = toast.loading('Processing Excel file...');

    try {
      const studentsRes = await api.get('/api/students', { params: { classId: classId, limit: 1000 } });
      const studentsList = studentsRes.data?.data || studentsRes.data || [];
      const studentMap = new Map();
      studentsList.forEach((st: any) => {
        studentMap.set(st.id, st.id); // By UUID just in case
        if (st.rollNo) studentMap.set(String(st.rollNo).trim().toLowerCase(), st.id);
        if (st.rollNumber) studentMap.set(String(st.rollNumber).trim().toLowerCase(), st.id);
        studentMap.set(st.id.substring(0, 8).toLowerCase(), st.id);
      });

      const reader = new FileReader();
      reader.onload = async (evt) => {
        try {
          const data = evt.target?.result;
          const XLSX = await import('xlsx');
          const workbook = XLSX.read(data, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const sheet = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
          
          const mappedMarks: any[] = [];

          sheet.forEach((row: any) => {
            const rawStudentId = row['Student ID'] || row['studentId'] || row['Student Id'] || row['ID'];
            if (!rawStudentId) return;
            
            const normalizedRawId = String(rawStudentId).trim().toLowerCase();
            const realStudentId = studentMap.get(normalizedRawId) || rawStudentId;

            Object.keys(row).forEach((key) => {
              const normalizedKey = key.toLowerCase().trim();
              if (['student id', 'studentid', 'student_id', 'id', 'remarks', 's.no', 's. no', 'sno', 'student name', 'studentname', 'name'].includes(normalizedKey)) return;

              let subjectId = key; // Backend handles string to correct UUID resolution scoped to classId

              const marksObtained = Number(row[key]);
              if (!isNaN(marksObtained)) {
                mappedMarks.push({
                  studentId: String(realStudentId),
                  examId: examId,
                  subjectId: subjectId,
                  marksObtained: marksObtained,
                  remarks: row['Remarks'] || row['remarks'] || ''
                });
              }
            });
          });

          if (mappedMarks.length === 0) {
            toast.error('No valid marks found in the file', { id: toastId });
            return;
          }

          await api.post('/api/marks/bulk', {
            examId: examId,
            marks: mappedMarks
          });
          toast.success('Marks uploaded successfully!', { id: toastId });
        } catch (err: any) {
          toast.error(err.response?.data?.message || 'Error processing excel file', { id: toastId });
        }
      };
      reader.readAsBinaryString(file);
    } catch (err) {
      toast.error('Error uploading excel file', { id: toastId });
    }
    
    e.target.value = '';
  };

  // -------------------------------------------------------------
  // EXAM PLAN Tab States & Logic
  // -------------------------------------------------------------
  const [examPlans, setExamPlans] = useState<any[]>([]);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [showSmsModal, setShowSmsModal] = useState(false);
  const [smsExamId, setSmsExamId] = useState('');
  const [smsClassId, setSmsClassId] = useState('');
  const [smsSendType, setSmsSendType] = useState('all');
  const [smsStudentId, setSmsStudentId] = useState('');
  const [classStudents, setClassStudents] = useState<any[]>([]);
  const [isSendingSms, setIsSendingSms] = useState(false);

  useEffect(() => {
    if (smsClassId && showSmsModal) {
      api.get('/api/students', { params: { classId: smsClassId, limit: 1000 } })
        .then(res => {
          setClassStudents(res.data.data || res.data || []);
        })
        .catch(err => {
          console.error('Failed to fetch students', err);
          setClassStudents([]);
        });
    } else {
      setClassStudents([]);
    }
  }, [smsClassId, showSmsModal]);

  const handleSendMarksSMS = async () => {
    if (!smsExamId || !smsClassId) return;
    if (smsSendType === 'individual' && !smsStudentId) {
      toast.error('Please select a student');
      return;
    }
    setIsSendingSms(true);
    try {
      const payload: any = {};
      if (smsSendType === 'individual') {
        payload.studentId = smsStudentId;
      }
      const res: any = await api.post(`/api/exams/${smsExamId}/classes/${smsClassId}/send-sms`, payload);
      const data = res.data || res;
      if (data.sent === 0 && data.failed > 0) {
        toast.error(`SMS sending failed! Check student mobile numbers or SMS gateway settings. (Failed: ${data.failed})`);
      } else if (data.failed > 0) {
        toast.success(`SMS sent with some failures. Sent: ${data.sent}, Failed: ${data.failed}`);
        setShowSmsModal(false);
        setSmsSendType('all');
        setSmsStudentId('');
      } else {
        toast.success(`SMS sent successfully to all ${data.sent} students!`);
        setShowSmsModal(false);
        setSmsSendType('all');
        setSmsStudentId('');
      }
    } catch (e: any) {
      toast.error(e.response?.data?.message || e.message || 'Failed to send SMS');
    } finally {
      setIsSendingSms(false);
    }
  };

  const [planClassId, setPlanClassId] = useState('');
  const [planSubjectId, setPlanSubjectId] = useState('');
  const [planDate, setPlanDate] = useState('');
  const [planStartTime, setPlanStartTime] = useState('');
  const [planEndTime, setPlanEndTime] = useState('');
  const [planRoom, setPlanRoom] = useState('');
  const [planMaxMarks, setPlanMaxMarks] = useState(100);
  const [planPassingMarks, setPlanPassingMarks] = useState(40);

  const fetchExamPlans = async () => {
    if (!selectedExamId) return;
    try {
      const res: any = await api.get(`/api/exams-extended/plans?examId=${selectedExamId}`);
      setExamPlans(res.data || []);
    } catch {
      toast.error('Failed to fetch exam plans');
    }
  };

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/api/exams-extended/plans', {
        examId: selectedExamId,
        subjectId: planSubjectId,
        examDate: planDate,
        startTime: planStartTime,
        endTime: planEndTime,
        room: planRoom,
        maxMarks: Number(planMaxMarks),
        passingMarks: Number(planPassingMarks)
      });
      toast.success('Paper plan scheduled successfully!');
      setShowPlanModal(false);
      fetchExamPlans();
    } catch (err: any) {
      toast.error(err.message || 'Error scheduling paper');
    }
  };

  const handleDeletePlan = async (id: string) => {
    if (!confirm('Are you sure you want to remove this paper from plan?')) return;
    try {
      await api.delete(`/api/exams-extended/plans/${id}`);
      toast.success('Paper plan deleted');
      fetchExamPlans();
    } catch {
      toast.error('Error deleting exam plan');
    }
  };

  // -------------------------------------------------------------
  // QUESTION GROUP Tab States & Logic
  // -------------------------------------------------------------
  const [questionGroups, setQuestionGroups] = useState<any[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupDesc, setGroupDesc] = useState('');

  const fetchQuestionGroups = async () => {
    try {
      const res: any = await api.get('/api/exams-extended/question-groups');
      const list = res.data || [];
      setQuestionGroups(list);
      if (list.length > 0 && !selectedGroupId) {
        setSelectedGroupId(list[0].id);
      }
    } catch {
      setQuestionGroups([]);
    }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/api/exams-extended/question-groups', {
        name: groupName,
        description: groupDesc
      });
      toast.success('Question group created');
      setShowGroupModal(false);
      setGroupName('');
      setGroupDesc('');
      fetchQuestionGroups();
    } catch (err: any) {
      toast.error(err.message || 'Error creating group');
    }
  };

  const handleDeleteGroup = async (id: string) => {
    if (!confirm('Are you sure you want to delete this question group?')) return;
    try {
      await api.delete(`/api/exams-extended/question-groups/${id}`);
      toast.success('Group deleted');
      fetchQuestionGroups();
    } catch {
      toast.error('Error deleting group');
    }
  };

  // -------------------------------------------------------------
  // QUESTION BANK Tab States & Logic
  // -------------------------------------------------------------
  const [questions, setQuestions] = useState<any[]>([]);
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [qText, setQText] = useState('');
  const [qType, setQType] = useState('MCQ');
  const [qOptions, setQOptions] = useState(['', '', '', '']);
  const [qCorrect, setQCorrect] = useState('0');
  const [qMarks, setQMarks] = useState(1);

  const fetchQuestions = async () => {
    try {
      const res: any = await api.get(`/api/exams-extended/questions${selectedGroupId ? `?groupId=${selectedGroupId}` : ''}`);
      setQuestions(res.data || []);
    } catch {
      setQuestions([]);
    }
  };

  const handleCreateQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/api/exams-extended/questions', {
        groupId: selectedGroupId,
        questionText: qText,
        questionType: qType,
        options: qType === 'MCQ' ? qOptions : null,
        correctAnswer: qCorrect,
        marks: Number(qMarks)
      });
      toast.success('Question added to bank');
      setShowQuestionModal(false);
      setQText('');
      setQOptions(['', '', '', '']);
      if (activeTab === 'question-bank') {
      fetchQuestions();
    }
    } catch (err: any) {
      toast.error(err.message || 'Error adding question');
    }
  };

  const handleDeleteQuestion = async (id: string) => {
    if (!confirm('Delete question?')) return;
    try {
      await api.delete(`/api/exams-extended/questions/${id}`);
      toast.success('Question deleted');
      if (activeTab === 'question-bank') {
      fetchQuestions();
    }
    } catch {
      toast.error('Error deleting question');
    }
  };

  // -------------------------------------------------------------
  // ONLINE EXAM Tab States & Logic
  // -------------------------------------------------------------
  const [onlineExams, setOnlineExams] = useState<any[]>([]);
  const [showOnlineModal, setShowOnlineModal] = useState(false);
  const [onlineTitle, setOnlineTitle] = useState('');
  const [onlineClassId, setOnlineClassId] = useState('');
  const [onlineSubjectId, setOnlineSubjectId] = useState('');
  const [onlineDuration, setOnlineDuration] = useState(60);
  const [onlineStart, setOnlineStart] = useState(new Date().toISOString().slice(0, 16));
  const [onlineEnd, setOnlineEnd] = useState(new Date().toISOString().slice(0, 16));
  const [onlinePassMarks, setOnlinePassMarks] = useState(40);
  const [selectedQIds, setSelectedQIds] = useState<string[]>([]);

  // Taking exam states
  const [takingExam, setTakingExam] = useState<any>(null);
  const [takingAnswers, setTakingAnswers] = useState<Record<string, string>>({});
  const [takingTimeLeft, setTakingTimeLeft] = useState(0);

  // Submissions states
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [viewingSubmissionsId, setViewingSubmissionsId] = useState<string | null>(null);

  const fetchOnlineExams = async () => {
    try {
      const res: any = await api.get('/api/exams-extended/online-exams');
      setOnlineExams(res.data || []);
    } catch {
      setOnlineExams([]);
    }
  };

  const handleCreateOnlineExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedQIds.length === 0) {
      toast.error('Please select at least one question');
      return;
    }
    // Compute total marks
    const total = selectedQIds.reduce((sum, qId) => {
      const q = questions.find(item => item.id === qId);
      return sum + (q ? q.marks : 0);
    }, 0);

    try {
      await api.post('/api/exams-extended/online-exams', {
        title: onlineTitle,
        classId: onlineClassId,
        subjectId: onlineSubjectId,
        duration: Number(onlineDuration),
        startTime: onlineStart,
        endTime: onlineEnd,
        totalMarks: total,
        passMarks: Number(onlinePassMarks),
        questionIds: selectedQIds
      });
      toast.success('Online Exam published successfully!');
      setShowOnlineModal(false);
      setOnlineTitle('');
      setSelectedQIds([]);
      fetchOnlineExams();
    } catch (err: any) {
      toast.error(err.message || 'Error publishing online exam');
    }
  };

  const handleDeleteOnlineExam = async (id: string) => {
    if (!confirm('Are you sure you want to delete this online exam?')) return;
    try {
      await api.delete(`/api/exams-extended/online-exams/${id}`);
      toast.success('Online exam deleted');
      fetchOnlineExams();
    } catch {
      toast.error('Error deleting online exam');
    }
  };

  const handleStartTakeExam = async (examId: string) => {
    try {
      const res: any = await api.get(`/api/exams-extended/online-exams/${examId}`);
      if (res.data.completed) {
        toast.success(`You already took this exam. Score: ${res.data.marksObtained}`);
        return;
      }
      const data = res.data.exam;
      setTakingExam(data);
      setTakingAnswers({});
      setTakingTimeLeft(data.duration * 60);
    } catch {
      toast.error('Failed to load exam details');
    }
  };

  const handleAnswerChange = (qId: string, answer: string) => {
    setTakingAnswers({ ...takingAnswers, [qId]: answer });
  };

  const handleSubmitOnlineExam = async () => {
    if (!takingExam) return;
    try {
      await api.post(`/api/exams-extended/online-exams/${takingExam.id}/submit`, {
        answers: takingAnswers
      });
      toast.success('Exam submitted successfully!');
      setTakingExam(null);
      fetchOnlineExams();
    } catch {
      toast.error('Error submitting exam');
    }
  };

  const handleViewSubmissions = async (examId: string) => {
    try {
      const res: any = await api.get(`/api/exams-extended/online-exams/${examId}/submissions`);
      setSubmissions(res.data || []);
      setViewingSubmissionsId(examId);
    } catch {
      toast.error('Error fetching submissions');
    }
  };

  // Timer effect for online test
  useEffect(() => {
    if (!takingExam || takingTimeLeft <= 0) {
      if (takingExam && takingTimeLeft === 0) {
        toast.error('Time limit reached! Submitting test automatically.');
        handleSubmitOnlineExam();
      }
      return;
    }
    const timer = setInterval(() => {
      setTakingTimeLeft((t) => t - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [takingExam, takingTimeLeft]);

  // -------------------------------------------------------------
  // BOOTSTRAPPING
  // -------------------------------------------------------------
  const fetchBaseFilters = async () => {
    try {
      // Check classes cache
      const CLS_CACHE_KEY = 'jy_classes_cache_exam';
      const CLS_CACHE_TTL = 2 * 60 * 1000;
      let classList: any[] = [];
      try {
        const raw = localStorage.getItem(CLS_CACHE_KEY);
        if (raw) {
          const { data, ts } = JSON.parse(raw);
          if (Date.now() - ts < CLS_CACHE_TTL && Array.isArray(data) && data.length > 0) {
            classList = data;
          }
        }
      } catch (_) {}

      // Fetch classes + teachers IN PARALLEL (not sequential)
      const promises: Promise<any>[] = [
        classList.length === 0
          ? api.get('/api/classes?limit=500')
          : Promise.resolve(null),
        isAdmin ? api.get('/api/teachers?limit=500') : Promise.resolve(null),
      ];

      const [classRes, teachRes] = await Promise.all(promises);

      if (classRes !== null) {
        classList = classRes?.data || classRes || [];
        try { localStorage.setItem(CLS_CACHE_KEY, JSON.stringify({ data: classList, ts: Date.now() })); } catch (_) {}
      }
      const sortedClasses = sortClasses(classList);
      setClasses(sortedClasses);
      if (sortedClasses.length > 0) {
        setOnlineClassId(sortedClasses[0].id);
        setSelectedClassId(sortedClasses[0].id);
      }

      if (isAdmin && teachRes !== null) {
        const teacherList = teachRes?.data?.data || teachRes?.data || [];
        setTeachers(teacherList);
      }
    } catch (err) {
      console.error('Failed to bootstrap filters:', err);
      toast.error('Failed to bootstrap filters');
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------------------------------
  // QUESTION PAPERS Tab States & Logic (Upload/Download)
  // -------------------------------------------------------------
  const [questionPapers, setQuestionPapers] = useState<any[]>([]);
  const [showQpModal, setShowQpModal] = useState(false);
  const [qpTitle, setQpTitle] = useState('');
  const [qpClassId, setQpClassId] = useState('');
  const [qpClassIds, setQpClassIds] = useState<string[]>([]);
  const [qpSubjectId, setQpSubjectId] = useState('');
  const [qpSubjectIds, setQpSubjectIds] = useState<string[]>([]);
  const [qpExamId, setQpExamId] = useState('');
  const [qpFileUrl, setQpFileUrl] = useState('');
  
  // Teacher Answer Key States
  const [showAnswerKeyModal, setShowAnswerKeyModal] = useState(false);
  const [selectedQpForAnswerKey, setSelectedQpForAnswerKey] = useState<any>(null);
  const [answerKeyText, setAnswerKeyText] = useState('');
  const [answerKeyUrl, setAnswerKeyUrl] = useState('');

  // New Workflow States & Methods
  const [qpStats, setQpStats] = useState<any>(null);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);

  const fetchQpStats = async () => {
    if (!isAdmin) return;
    try {
      const res: any = await api.get('/api/question-papers/dashboard-stats');
      setQpStats(res?.data || res);
    } catch {
      setQpStats(null);
    }
  };

  const fetchQuestionPapers = async () => {
    try {
      const res: any = await api.get('/api/question-papers');
      setQuestionPapers(Array.isArray(res) ? res : (res?.data || []));
      fetchQpStats();
    } catch {
      setQuestionPapers([]);
    }
  };

  const handleApproveQp = async (id: string) => {
    try {
      await api.put(`/api/question-papers/${id}/approve`);
      toast.success('Question paper approved');
      fetchQuestionPapers();
    } catch {
      toast.error('Failed to approve question paper');
    }
  };

  const handleRejectQp = async (id: string) => {
    try {
      await api.put(`/api/question-papers/${id}/reject`);
      toast.success('Question paper rejected');
      fetchQuestionPapers();
    } catch {
      toast.error('Failed to reject question paper');
    }
  };

  const handlePublishQp = async (id: string) => {
    try {
      await api.put(`/api/question-papers/${id}/publish`);
      toast.success('Question paper published');
      fetchQuestionPapers();
    } catch {
      toast.error('Failed to publish question paper');
    }
  };

  const handleToggleTeacherPermission = async (teacherId: string, canUpload: boolean) => {
    try {
      await api.post('/api/question-papers/toggle-permission', { teacherId, canUpload });
      toast.success('Teacher permission updated');
      setTeachers(prev => prev.map((t: any) => t.id === teacherId ? { ...t, canUploadQuestionPapers: canUpload } : t));
    } catch {
      toast.error('Failed to update teacher permission');
    }
  };

  const handleCreateQp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (qpClassIds.length === 0) {
      toast.error('Please select at least one class');
      return;
    }
    if (!qpFileUrl.trim()) {
      toast.error('Please upload a file or enter a document URL');
      return;
    }

    const loadingToast = toast.loading('Uploading question paper(s)...');
    try {
      const subjectsToUpload = qpSubjectIds.length === 0 ? [undefined] : qpSubjectIds;

      for (const classId of qpClassIds) {
        for (const subjectId of subjectsToUpload) {
          let finalTitle = qpTitle.trim();
          if (!finalTitle) {
            const examObj = exams.find(ex => ex.id === qpExamId);
            const examPart = examObj ? examObj.name : '';
            const subObj = subjects.find(s => s.id === subjectId);
            const subjectPart = subObj ? subObj.name : '';
            
            if (examPart && subjectPart) {
              finalTitle = `${examPart} - ${subjectPart}`;
            } else if (examPart) {
              finalTitle = examPart;
            } else if (subjectPart) {
              finalTitle = subjectPart;
            } else {
              finalTitle = qpFileUrl.split('/').pop() || 'Question Paper';
            }
          }

          await api.post('/api/question-papers', {
            title: finalTitle,
            examId: qpExamId || undefined,
            classId,
            subjectId,
            fileUrl: qpFileUrl
          });
        }
      }
      toast.dismiss(loadingToast);
      toast.success('Question paper(s) uploaded successfully');
      setShowQpModal(false);
      setQpTitle('');
      setQpExamId('');
      setQpSubjectIds([]);
      setQpFileUrl('');
      setQpClassIds([]);
      fetchQuestionPapers();
    } catch {
      toast.dismiss(loadingToast);
      toast.error('Error uploading question paper');
    }
  };

  const handleDeleteQp = async (id: string) => {
    if (!confirm('Are you sure you want to delete this question paper?')) return;
    try {
      await api.delete(`/api/question-papers/${id}`);
      toast.success('Question paper deleted');
      fetchQuestionPapers();
    } catch {
      toast.error('Error deleting question paper');
    }
  };

  const handleUpdateAnswerKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedQpForAnswerKey) return;
    try {
      await api.put(`/api/question-papers/${selectedQpForAnswerKey.id}/answer-key`, {
        answerKey: answerKeyText,
        answerKeyUrl: answerKeyUrl
      });
      toast.success('Answer Key updated successfully');
      setShowAnswerKeyModal(false);
      setSelectedQpForAnswerKey(null);
      fetchQuestionPapers();
    } catch {
      toast.error('Error updating Answer Key');
    }
  };

  useEffect(() => {
    // Run ALL initial fetches IN PARALLEL — maximum speed boot
    Promise.all([
      fetchBaseFilters(),
      fetchExams(),



    ]);
  }, []);

  // Fetch plans when selected exam changes
  useEffect(() => {
    if (selectedExamId) {
      fetchExamPlans();
    }
  }, [selectedExamId]);

  // Fetch questions when group changes
  useEffect(() => {
    if (activeTab === 'question-bank') {
      fetchQuestions();
    }
  }, [selectedGroupId, activeTab]);

  // Lazy-load specific tab data only when user navigates to that tab
  useEffect(() => {
    if (activeTab === 'question-group') {
      fetchQuestionGroups();
    } else if (activeTab === 'question-bank') {
      fetchQuestionGroups();
      fetchQuestions();
    } else if (activeTab === 'online-exams' || activeTab === 'add-online-exam') {
      fetchOnlineExams();
    } else if (activeTab === 'question-papers') {
      fetchQuestionPapers();
    }
  }, [activeTab]);

  // Initialize planClassId when modal opens or exam changes
  useEffect(() => {
    if (showPlanModal) {
      const activeExam = exams.find(e => e.id === selectedExamId);
      if (activeExam?.classes?.length > 0) {
        setPlanClassId(activeExam.classes[0].id);
      } else {
        setPlanClassId('');
      }
    }
  }, [selectedExamId, showPlanModal, exams]);

  // Load subjects for exam plan form
  useEffect(() => {
    if (planClassId) {
      api.get(`/api/classes/${planClassId}/subjects`)
        .then((res: any) => {
          setSubjects(res.data || []);
          if (res.data?.length > 0) {
            setPlanSubjectId(res.data[0].id);
          } else {
            setPlanSubjectId('');
          }
        })
        .catch(() => {});
    } else {
      setSubjects([]);
      setPlanSubjectId('');
    }
  }, [planClassId]);

  // Load subjects for online exam form
  useEffect(() => {
    if (onlineClassId) {
      api.get(`/api/classes/${onlineClassId}/subjects`)
        .then((res: any) => {
          setSubjects(res.data || []);
          if (res.data?.length > 0) {
            setOnlineSubjectId(res.data[0].id);
          }
        })
        .catch(() => {});
    }
  }, [onlineClassId]);

  if (loading) return <LoadingSpinner size="lg" className="h-[50vh]" />;

  // -------------------------------------------------------------
  // EXAM TAKING MODAL SCREEN
  // -------------------------------------------------------------
  if (takingExam) {
    const mins = Math.floor(takingTimeLeft / 60);
    const secs = takingTimeLeft % 60;
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex justify-between items-center bg-red-500 text-white p-5 rounded-2xl shadow">
          <div>
            <h3 className="text-xl font-bold">{takingExam.title}</h3>
            <p className="text-xs opacity-90">Subject: {takingExam.subject?.name}</p>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-extrabold uppercase block tracking-wider opacity-75">Time Remaining</span>
            <span className="text-2xl font-black">{mins}:{secs < 10 ? '0' : ''}{secs}</span>
          </div>
        </div>

        <div className="space-y-6">
          {takingExam.questions.map((eq: any, index: number) => {
            const q = eq.question;
            const opts = q.options ? JSON.parse(q.options) : [];
            return (
              <div key={q.id} className="card p-6 space-y-4">
                <div className="flex justify-between items-start gap-4">
                  <h4 className="font-bold text-sm text-gray-900 dark:text-white">
                    Q{index + 1}. {q.questionText}
                  </h4>
                  <Badge variant="info">Marks: {q.marks}</Badge>
                </div>

                {q.questionType === 'MCQ' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {opts.map((opt: string, optIdx: number) => (
                      <label
                        key={optIdx}
                        className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer select-none transition-all hover:bg-gray-50 dark:hover:bg-gray-800 ${
                          takingAnswers[q.id] === String(optIdx)
                            ? 'bg-primary-50 border-primary-500 dark:bg-primary-950/20'
                            : 'border-gray-200 dark:border-gray-700'
                        }`}
                      >
                        <input
                          type="radio"
                          name={`q_${q.id}`}
                          value={optIdx}
                          checked={takingAnswers[q.id] === String(optIdx)}
                          onChange={() => handleAnswerChange(q.id, String(optIdx))}
                          className="w-4 h-4 text-primary-600 focus:ring-primary-500"
                        />
                        <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">{opt}</span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <textarea
                    rows={4}
                    placeholder="Type your answer here..."
                    value={takingAnswers[q.id] || ''}
                    onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                    className="input"
                  />
                )}
              </div>
            );
          })}
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <button
            onClick={() => {
              if (confirm('Cancel exam? Your answers will not be saved.')) {
                setTakingExam(null);
              }
            }}
            className="btn-secondary"
          >
            Cancel / Give Up
          </button>
          <button onClick={handleSubmitOnlineExam} className="btn-primary">
            Submit Exam
          </button>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // EXAM SUBMISSIONS VIEW
  // -------------------------------------------------------------
  if (viewingSubmissionsId) {
    const activeExam = onlineExams.find(e => e.id === viewingSubmissionsId);
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-150 dark:border-gray-800">
          <div>
            <h3 className="font-bold">Submissions: {activeExam?.title}</h3>
            <p className="text-xs text-gray-400">Total Marks: {activeExam?.totalMarks} · Passing Marks: {activeExam?.passMarks}</p>
          </div>
          <button onClick={() => setViewingSubmissionsId(null)} className="btn-secondary">
            Back to Exams
          </button>
        </div>

        <div className="card p-6 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800">
                  <th className="pb-3.5 font-extrabold text-gray-400 text-xs uppercase tracking-wider">Student Name</th>
                  <th className="pb-3.5 font-extrabold text-gray-400 text-xs uppercase tracking-wider">Roll No</th>
                  <th className="pb-3.5 font-extrabold text-gray-400 text-xs uppercase tracking-wider">Submitted At</th>
                  <th className="pb-3.5 font-extrabold text-gray-400 text-xs uppercase tracking-wider">Marks Obtained</th>
                  <th className="pb-3.5 font-extrabold text-gray-400 text-xs uppercase tracking-wider text-right">Result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-150 dark:divide-gray-800">
                {submissions.map((sub) => {
                  const pass = sub.marksObtained >= (activeExam?.passMarks || 40);
                  return (
                    <tr key={sub.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/10">
                      <td className="py-4 font-bold text-gray-900 dark:text-white">{sub.student?.user?.name}</td>
                      <td className="py-4 text-xs text-gray-400">{sub.student?.rollNo}</td>
                      <td className="py-4 text-xs text-gray-500">{new Date(sub.submittedAt).toLocaleString()}</td>
                      <td className="py-4 font-bold">{sub.marksObtained} / {activeExam?.totalMarks}</td>
                      <td className="py-4 text-right">
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-extrabold tracking-wide uppercase ${
                          pass ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20' : 'bg-red-50 text-red-700 dark:bg-red-950/20'
                        }`}>
                          {pass ? 'Pass' : 'Fail'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {submissions.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-gray-400">
                      No submissions recorded yet for this exam.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#F4F7FC] w-full" style={{ minHeight: 'calc(100vh - 64px)' }}>

      {/* UNIFIED ERP EXAMINATION HEADER */}
      <PageHeader
        title={
          activeTab === 'status-overview' ? 'Status Overview' :
          activeTab === 'written-exam' ? 'Marks Upload & Entry' :
          activeTab === 'progress-card' || activeTab === 'jee-progress-card' ? 'Progress Report Cards' :
          activeTab === 'results' ? 'Exam Results & Ranks' :
          activeTab === 'admit-card' ? 'Admit Cards & Hall Tickets' :
          activeTab === 'examination' ? 'Examinations Directory' :
          activeTab === 'question-papers' ? 'Question Papers & Answer Keys' :
          activeTab === 'settings' ? 'Examination Master Settings' :
          'Examination Hub'
        }
        icon={<ClipboardList className="w-5 h-5" />}
        action={
          <div className="flex items-center gap-2">
            {activeTab && (
              <button
                type="button"
                onClick={() => selectTab('')}
                className="px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 border border-white/25 text-white text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>All Modules</span>
              </button>
            )}
            {isAdmin && (activeTab === '' || activeTab === 'examination') && (
              <button
                type="button"
                onClick={openCreateModal}
                className="px-4 py-2 rounded-xl bg-white text-[#5B21B6] hover:bg-indigo-50 text-xs font-black flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Create Exam
              </button>
            )}
          </div>
        }
      />

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Persistent Quick Module Switcher Bar when inside any tab */}
        {activeTab !== '' && (
          <div className="bg-white rounded-[20px] border border-[#DDD7F3] shadow-[0_4px_18px_-6px_rgba(79,70,229,0.1)] p-2 flex items-center gap-1.5 overflow-x-auto custom-scrollbar">
            <button
              type="button"
              onClick={() => selectTab('')}
              className="px-3.5 py-2 rounded-xl text-xs font-black text-slate-600 hover:bg-[#F2EDFF] hover:text-[#5B21B6] transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              <LayoutGrid className="w-3.5 h-3.5" /> Hub
            </button>
            <div className="w-px h-5 bg-indigo-100 shrink-0" />
            {[
              ...(isAdmin ? [{ id: 'examination', label: 'Exams List', icon: ClipboardList }] : []),
              { id: 'admit-card', label: 'Admit Card', icon: FileText },
              { id: 'question-papers', label: 'Question Papers', icon: Layers },
              ...(isAdminOrTeacher ? [{ id: 'written-exam', label: 'Marks Upload', icon: Edit3 }] : []),
              { id: 'results', label: 'Results', icon: Award },
              { id: 'jee-progress-card', label: 'Progress Card', icon: FileSpreadsheet },
              ...(isAdmin ? [
                { id: 'status-overview', label: 'Status Overview', icon: ShieldAlert },
                { id: 'settings', label: 'Settings', icon: Settings },
              ] : []),
            ].map((item) => {
              const Icon = item.icon;
              const isSelected = activeTab === item.id || (item.id === 'jee-progress-card' && activeTab === 'progress-card');
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => selectTab(item.id as any)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                    isSelected
                      ? 'bg-gradient-to-r from-[#5B21B6] to-[#7C3AED] text-white shadow-sm shadow-indigo-500/25'
                      : 'text-slate-600 hover:bg-[#F8FAFF] hover:text-[#5B21B6]'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
            {isAdmin && (
              <button
                type="button"
                onClick={() => setShowSmsModal(true)}
                className="ml-auto px-3.5 py-2 rounded-xl text-xs font-black bg-pink-50 hover:bg-pink-100 text-pink-700 border border-pink-200 transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
              >
                <MessageSquare className="w-3.5 h-3.5" /> Send SMS
              </button>
            )}
          </div>
        )}

        {!activeTab && (
          <div className="space-y-6 animate-fade-in">
            {/* ERP Lifecycle Workflow Strip (Non-KPI interactive pipeline) */}
            {isAdminOrTeacher && (
              <div className="bg-white rounded-[22px] border border-[#DDD7F3] shadow-[0_6px_22px_-8px_rgba(79,70,229,0.12)] p-4 sm:p-5 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#5B21B6] to-[#7C3AED] text-white flex items-center justify-center shadow-md shadow-indigo-500/20 shrink-0">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-sm sm:text-base font-black text-[#1E1B4B]">Examination Management Workflow</h2>
                    <p className="text-xs font-semibold text-slate-500 mt-0.5">
                      End-to-end ERP exam pipeline — from scheduling & hall tickets to marks entry & parent SMS alerts
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-[11px] font-black">
                  {[
                    { step: '1', text: 'Create Exam', tab: isAdmin ? 'examination' : '' },
                    { step: '2', text: 'Papers', tab: 'question-papers' },
                    { step: '3', text: 'Admit Cards', tab: 'admit-card' },
                    { step: '4', text: 'Marks', tab: 'written-exam' },
                    { step: '5', text: 'Results', tab: 'results' },
                  ].map((s, idx) => (
                    <React.Fragment key={s.step}>
                      <button
                        type="button"
                        onClick={() => s.tab && selectTab(s.tab as any)}
                        className="px-2.5 py-1.5 rounded-xl bg-[#F8FAFF] hover:bg-[#F2EDFF] text-[#1E1B4B] hover:text-[#5B21B6] border border-indigo-100 flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <span className="w-4 h-4 rounded-full bg-[#5B21B6] text-white text-[9px] flex items-center justify-center font-black">{s.step}</span>
                        {s.text}
                      </button>
                      {idx < 4 && <span className="text-slate-300 font-bold hidden sm:inline">→</span>}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            )}

            {/* Unified Light Pastel ERP Modules Grid (Zero Black / Dark Cards) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
              {isAdmin && (
                <ExamCard
                  label="Examinations List"
                  sub="Create, edit & schedule exams"
                  icon={ClipboardList}
                  bgGradient="bg-gradient-to-br from-[#F2EDFF] via-[#EDE9FE] to-[#DDD6FE]"
                  iconGradient="bg-gradient-to-br from-[#6366F1] to-[#4F46E5]"
                  borderClass="border-[#D8CEF6]"
                  badgeText={`${exams.length} Exams`}
                  badgeClass="bg-white/90 text-indigo-700 border-indigo-200"
                  onClick={() => selectTab('examination')}
                />
              )}

              {isAdminOrTeacher && (
                <>
                  <ExamCard
                    label="Admit Card"
                    sub="Generate & print hall tickets"
                    icon={FileText}
                    bgGradient="bg-gradient-to-br from-[#FFF8EB] via-[#FFEDD5] to-[#FED7AA]/75"
                    iconGradient="bg-gradient-to-br from-[#F59E0B] to-[#EA580C]"
                    borderClass="border-amber-200/80"
                    badgeText="Hall Tickets"
                    badgeClass="bg-white/90 text-amber-700 border-amber-200"
                    onClick={() => selectTab('admit-card')}
                  />
                  <ExamCard
                    label="Question Papers"
                    sub="Manage papers & answer keys"
                    icon={Layers}
                    bgGradient="bg-gradient-to-br from-[#ECFEFF] via-[#E0F7FA] to-[#CFFAFE]"
                    iconGradient="bg-gradient-to-br from-[#0891B2] to-[#0284C7]"
                    borderClass="border-cyan-200/80"
                    badgeText="Repository"
                    badgeClass="bg-white/90 text-cyan-700 border-cyan-200"
                    onClick={() => selectTab('question-papers')}
                  />
                  <ExamCard
                    label="Marks Upload"
                    sub="Enter grid marks or upload Excel"
                    icon={Edit3}
                    bgGradient="bg-gradient-to-br from-[#ECFDF5] via-[#D1FAE5] to-[#A7F3D0]/70"
                    iconGradient="bg-gradient-to-br from-[#10B981] to-[#059669]"
                    borderClass="border-emerald-200/80"
                    badgeText="Gradebook"
                    badgeClass="bg-white/90 text-emerald-700 border-emerald-200"
                    onClick={() => selectTab('written-exam')}
                  />
                  <ExamCard
                    label="Results & Ranks"
                    sub="Class merit lists & grade sheets"
                    icon={Award}
                    bgGradient="bg-gradient-to-br from-[#EFF6FF] via-[#DBEAFE] to-[#BFDBFE]/80"
                    iconGradient="bg-gradient-to-br from-[#0EA5E9] to-[#2563EB]"
                    borderClass="border-blue-200/80"
                    badgeText="Merit List"
                    badgeClass="bg-white/90 text-blue-700 border-blue-200"
                    onClick={() => selectTab('results')}
                  />
                  <ExamCard
                    label="Progress Card"
                    sub="Detailed A4 & JEE report cards"
                    icon={FileSpreadsheet}
                    bgGradient="bg-gradient-to-br from-[#FFF1F2] via-[#FFE4E6] to-[#FECDD3]/80"
                    iconGradient="bg-gradient-to-br from-[#F43F5E] to-[#E11D48]"
                    borderClass="border-rose-200/80"
                    badgeText="Reports"
                    badgeClass="bg-white/90 text-rose-700 border-rose-200"
                    onClick={() => selectTab('jee-progress-card')}
                  />
                </>
              )}

              {isAdmin && (
                <>
                  <ExamCard
                    label="Send Marks SMS"
                    sub="Dispatch DLT marks alerts to parents"
                    icon={MessageSquare}
                    bgGradient="bg-gradient-to-br from-[#FDF2F8] via-[#FCE7F3] to-[#FBCFE8]/80"
                    iconGradient="bg-gradient-to-br from-[#EC4899] to-[#DB2777]"
                    borderClass="border-pink-200/80"
                    badgeText="Parent SMS"
                    badgeClass="bg-white/90 text-pink-700 border-pink-200"
                    onClick={() => setShowSmsModal(true)}
                  />
                  <ExamCard
                    label="Status Overview"
                    sub="Track class-wise marks completion"
                    icon={ShieldAlert}
                    bgGradient="bg-gradient-to-br from-[#F5F3FF] via-[#EDE9FE] to-[#DDD6FE]"
                    iconGradient="bg-gradient-to-br from-[#8B5CF6] to-[#6D28D9]"
                    borderClass="border-violet-200/80"
                    badgeText="Live Tracker"
                    badgeClass="bg-white/90 text-violet-700 border-violet-200"
                    onClick={() => selectTab('status-overview')}
                  />
                  <ExamCard
                    label="Exam Settings"
                    sub="Branding, grading scales & rules"
                    icon={Settings}
                    bgGradient="bg-gradient-to-br from-[#F0FDFA] via-[#CCFBF1] to-[#99F6E4]/60"
                    iconGradient="bg-gradient-to-br from-[#0D9488] to-[#0F766E]"
                    borderClass="border-teal-200/80"
                    badgeText="Config"
                    badgeClass="bg-white/90 text-teal-700 border-teal-200"
                    onClick={() => selectTab('settings')}
                  />
                </>
              )}

              {isStudent && (
                <>
                  <ExamCard
                    label="Admit Card"
                    sub="Download your hall ticket"
                    icon={FileText}
                    bgGradient="bg-gradient-to-br from-[#FFF8EB] via-[#FFEDD5] to-[#FED7AA]/75"
                    iconGradient="bg-gradient-to-br from-[#F59E0B] to-[#EA580C]"
                    borderClass="border-amber-200/80"
                    onClick={() => selectTab('admit-card')}
                  />
                  <ExamCard
                    label="Question Papers"
                    sub="Study material & past papers"
                    icon={Layers}
                    bgGradient="bg-gradient-to-br from-[#ECFEFF] via-[#E0F7FA] to-[#CFFAFE]"
                    iconGradient="bg-gradient-to-br from-[#0891B2] to-[#0284C7]"
                    borderClass="border-cyan-200/80"
                    onClick={() => selectTab('question-papers')}
                  />
                  <ExamCard
                    label="Results"
                    sub="View published exam results"
                    icon={Award}
                    bgGradient="bg-gradient-to-br from-[#EFF6FF] via-[#DBEAFE] to-[#BFDBFE]/80"
                    iconGradient="bg-gradient-to-br from-[#0EA5E9] to-[#2563EB]"
                    borderClass="border-blue-200/80"
                    onClick={() => selectTab('results')}
                  />
                  <ExamCard
                    label="Progress Card"
                    sub="View detailed report card"
                    icon={FileSpreadsheet}
                    bgGradient="bg-gradient-to-br from-[#FFF1F2] via-[#FFE4E6] to-[#FECDD3]/80"
                    iconGradient="bg-gradient-to-br from-[#F43F5E] to-[#E11D48]"
                    borderClass="border-rose-200/80"
                    onClick={() => selectTab('jee-progress-card')}
                  />
                </>
              )}
            </div>

            {/* Recent Examinations Quick Launcher Strip */}
            {isAdminOrTeacher && exams.length > 0 && (
              <div className="bg-white rounded-[22px] border border-[#DDD7F3] shadow-[0_6px_22px_-8px_rgba(79,70,229,0.1)] p-5">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
                    <h3 className="text-sm font-black text-[#1E1B4B] uppercase tracking-wider">Recent Examinations Quick Access</h3>
                  </div>
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => selectTab('examination')}
                      className="text-xs font-black text-[#5B21B6] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      View All ({exams.length}) <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                  {exams.slice(0, 3).map((ex) => (
                    <div key={ex.id} className="p-4 rounded-2xl bg-[#F8FAFF] border border-indigo-100/90 hover:border-[#7C3AED]/50 transition-all flex flex-col justify-between gap-3">
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-sm font-black text-[#1E1B4B] line-clamp-1">{ex.name}</h4>
                          <span className="px-2 py-0.5 rounded-lg bg-white border border-indigo-100 text-[10px] font-black text-[#5B21B6] shrink-0">
                            {(ex.classes || []).length} Classes
                          </span>
                        </div>
                        <p className="text-[11px] font-bold text-slate-500 flex items-center gap-1 mt-1">
                          <Calendar className="w-3 h-3 text-indigo-400" />
                          {new Date(ex.examDate).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 pt-2 border-t border-indigo-100/60">
                        <button
                          type="button"
                          onClick={() => { setSelectedWrittenExamId(ex.id); selectTab('written-exam'); }}
                          className="flex-1 py-1.5 px-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white border border-emerald-200 text-[11px] font-black transition-all flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <Edit3 className="w-3 h-3" /> Marks
                        </button>
                        <button
                          type="button"
                          onClick={() => selectTab('results')}
                          className="flex-1 py-1.5 px-2.5 rounded-xl bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white border border-blue-200 text-[11px] font-black transition-all flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <Award className="w-3 h-3" /> Results
                        </button>
                        {isAdmin && (
                          <button
                            type="button"
                            onClick={() => openEditModal(ex)}
                            className="py-1.5 px-2.5 rounded-xl bg-white hover:bg-[#5B21B6] text-[#5B21B6] hover:text-white border border-indigo-200 text-[11px] font-black transition-all cursor-pointer"
                            title="Configure Exam"
                          >
                            <Settings className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}


      {/* ══ TAB 2: EXAM PLAN ══ */}
      {activeTab === 'exam-plan' && (
        <div className="space-y-5">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-[20px] border border-[#DDD7F3] shadow-sm">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <span className="text-xs font-black uppercase text-slate-500">Exam Batch:</span>
              <select value={selectedExamId} onChange={e => setSelectedExamId(e.target.value)} className="bg-[#F8FAFF] border border-indigo-100 rounded-xl px-3.5 py-2 text-sm font-bold text-slate-800 outline-none focus:border-[#5B21B6]">
                {exams.map(e => <option key={e.id} value={e.id}>{e.name} ({e.class?.name})</option>)}
              </select>
            </div>
            {isAdmin && selectedExamId && (
              <button onClick={() => setShowPlanModal(true)} className="px-4 py-2 bg-gradient-to-r from-[#5B21B6] to-[#7C3AED] text-white rounded-xl flex items-center gap-2 text-xs font-black shadow-sm cursor-pointer">
                <Plus className="w-4 h-4" /> Schedule Paper
              </button>
            )}
          </div>

          <div className="bg-white rounded-[22px] border border-[#DDD7F3] shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="student-grid-table w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-gradient-to-r from-[#7D3CEF] via-[#6D38EA] to-[#5B21B6]">
                    <th className="py-3.5 px-4 font-black !text-white text-xs uppercase tracking-wider">Subject</th>
                    <th className="py-3.5 px-4 font-black !text-white text-xs uppercase tracking-wider">Exam Date</th>
                    <th className="py-3.5 px-4 font-black !text-white text-xs uppercase tracking-wider">Timing</th>
                    <th className="py-3.5 px-4 font-black !text-white text-xs uppercase tracking-wider">Room</th>
                    <th className="py-3.5 px-4 font-black !text-white text-xs uppercase tracking-wider">Marks Info</th>
                    {isAdmin && <th className="py-3.5 px-4 text-right font-black !text-white text-xs uppercase tracking-wider">Action</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-indigo-50">
                  {examPlans.map((plan) => (
                    <tr key={plan.id} className="hover:bg-[#F8FAFF] transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-[#1E1B4B]">{plan.subject?.name}</div>
                        <span className="text-[10px] text-slate-400 font-bold">{plan.subject?.code}</span>
                      </td>
                      <td className="py-3.5 px-4 text-xs font-bold text-slate-700">{new Date(plan.examDate).toLocaleDateString()}</td>
                      <td className="py-3.5 px-4 text-xs text-slate-600 font-bold">{plan.startTime} – {plan.endTime}</td>
                      <td className="py-3.5 px-4 text-xs text-slate-600 font-bold">{plan.room || 'N/A'}</td>
                      <td className="py-3.5 px-4 text-xs font-bold text-[#5B21B6]">Max: {plan.maxMarks} · Pass: {plan.passingMarks}</td>
                      {isAdmin && (
                        <td className="py-3.5 px-4 text-right">
                          <button onClick={() => handleDeletePlan(plan.id)} className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 cursor-pointer">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                  {examPlans.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400 font-semibold">
                        No subject papers scheduled in plan yet for this exam batch.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {showPlanModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
              <div className="bg-white rounded-[24px] border border-[#DDD7F3] shadow-2xl w-full max-w-md p-6 space-y-5">
                <div className="flex justify-between items-center pb-3 border-b border-indigo-50">
                  <h3 className="text-lg font-black text-[#1E1B4B]">Schedule Exam Paper</h3>
                  <button onClick={() => setShowPlanModal(false)} className="p-1.5 rounded-xl bg-slate-100 text-slate-500 hover:text-slate-800 cursor-pointer"><X className="w-5 h-5" /></button>
                </div>
                <form onSubmit={handleCreatePlan} className="space-y-4">
                  <div>
                    <label className="label">Select Class</label>
                    <select required value={planClassId} onChange={e => setPlanClassId(e.target.value)} className="input">
                      {exams.find(e => e.id === selectedExamId)?.classes?.map((c: any) => (
                        <option key={c.id} value={c.id}>{c.name} {c.section ? `- ${c.section}` : ''}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label">Select Subject</label>
                    <select required value={planSubjectId} onChange={e => setPlanSubjectId(e.target.value)} className="input">
                      {subjects.map(s => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label">Exam Date</label>
                    <input type="date" value={planDate} onChange={e => setPlanDate(e.target.value)} className="input" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label">Start Time</label>
                      <input type="text" placeholder="09:00" value={planStartTime} onChange={e => setPlanStartTime(e.target.value)} className="input" />
                    </div>
                    <div>
                      <label className="label">End Time</label>
                      <input type="text" placeholder="12:00" value={planEndTime} onChange={e => setPlanEndTime(e.target.value)} className="input" />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-1">
                      <label className="label">Room</label>
                      <input type="text" placeholder="102" value={planRoom} onChange={e => setPlanRoom(e.target.value)} className="input" />
                    </div>
                    <div className="col-span-1">
                      <label className="label">Max Marks</label>
                      <input type="number" value={planMaxMarks} onChange={e => setPlanMaxMarks(Number(e.target.value))} className="input" />
                    </div>
                    <div className="col-span-1">
                      <label className="label">Pass Marks</label>
                      <input type="number" value={planPassingMarks} onChange={e => setPlanPassingMarks(Number(e.target.value))} className="input" />
                    </div>
                  </div>
                  <div className="flex gap-3 justify-end pt-2">
                    <button type="button" onClick={() => setShowPlanModal(false)} className="btn-secondary text-sm">Cancel</button>
                    <button type="submit" className="px-5 py-2.5 bg-gradient-to-r from-[#5B21B6] to-[#7C3AED] text-white rounded-xl text-sm font-black shadow-sm cursor-pointer">Save Paper</button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══ TAB 3: MARKS UPLOAD (written-exam) ══ */}
      {activeTab === 'written-exam' && (
        <div className="space-y-5 animate-fade-in-up">
          <div className="bg-white p-5 rounded-[22px] border border-[#DDD7F3] shadow-[0_6px_22px_-8px_rgba(79,70,229,0.1)] space-y-3.5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#ECFDF5] to-[#D1FAE5] border border-emerald-200 text-emerald-600 flex items-center justify-center shrink-0">
                <Edit3 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-black text-[#1E1B4B]">Marks Upload & Class Gradebook</h2>
                <p className="text-xs font-semibold text-slate-500">Download sample templates, bulk import Excel sheets, or open live class mark entry</p>
              </div>
            </div>

            <div className="w-full relative">
              <select
                className="w-full appearance-none bg-[#F8FAFF] border border-indigo-100 rounded-xl px-4 py-3 text-xs sm:text-sm font-bold text-[#1E1B4B] focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-[#5B21B6] transition-all cursor-pointer truncate pr-9"
                value={selectedWrittenExamId}
                onChange={(e) => setSelectedWrittenExamId(e.target.value)}
              >
                <option value="" className="text-xs font-medium">-- Select Examination to Enter / Upload Marks --</option>
                {exams.map(e => (
                  <option key={e.id} value={e.id} className="text-xs font-medium">{formatExamOptionLabel(e.name)}</option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-3.5 flex items-center pointer-events-none">
                <ChevronDown className="h-4 w-4 text-slate-400" />
              </div>
            </div>
          </div>

          {selectedWrittenExamId && (
            <div className="grid grid-cols-1 gap-6">
              {exams.filter(e => e.id === selectedWrittenExamId).map(exam => (
                <div key={exam.id} className="rounded-[24px] p-5 sm:p-6 bg-white shadow-[0_6px_24px_-8px_rgba(79,70,229,0.1)] border border-[#DDD7F3] flex flex-col">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-indigo-50">
                    <div>
                      <h4 className="font-black text-[#1E1B4B] text-base sm:text-lg" title={exam.name}>
                        {formatExamOptionLabel(exam.name)}
                      </h4>
                      <p className="text-xs font-bold text-slate-500 mt-0.5">
                        Select a target class card below to enter or upload marks ({(exam.classes || []).length} classes assigned)
                      </p>
                    </div>
                    {isAdmin && (
                      <button
                        onClick={() => { setExcelExamId(exam.id); setShowExcelModal(true); }}
                        className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-95 text-white font-black rounded-xl text-xs shadow-sm transition-all flex items-center gap-2 cursor-pointer shrink-0"
                      >
                        <Upload className="w-3.5 h-3.5" /> Global Excel Bulk Upload
                      </button>
                    )}
                  </div>

                  <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
                    {sortClasses(exam.classes || []).map((c: any) => (
                      <div key={c.id} className="flex flex-col bg-[#F8FAFF] p-4 rounded-2xl border border-indigo-100 hover:border-[#7C3AED]/50 hover:bg-white transition-all shadow-xs">
                        <div className="flex items-center justify-between gap-2 mb-3 pb-2.5 border-b border-indigo-100/70">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-7 h-7 rounded-xl bg-[#F2EDFF] border border-[#DDD7F3] flex items-center justify-center shrink-0">
                              <BookOpen className="w-3.5 h-3.5 text-[#5B21B6]" />
                            </div>
                            <span className="text-sm font-black text-[#1E1B4B] truncate">{c.name} - {c.section}</span>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 mt-auto">
                           <button onClick={() => downloadClassSampleExcel(exam, c)} className="w-full py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-xl text-[11px] font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer">
                             <FileSpreadsheet className="w-3.5 h-3.5" /> Excel
                           </button>
                           <button onClick={() => downloadClassSamplePDF(exam, c)} className="w-full py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded-xl text-[11px] font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer">
                             <FileText className="w-3.5 h-3.5" /> PDF
                           </button>
                           <label className="w-full py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-xl text-[11px] font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer mb-0">
                             <Upload className="w-3.5 h-3.5" /> Upload
                             <input type="file" className="hidden" accept=".xlsx,.xls" onChange={(e) => handleClassExcelUpload(e, exam.id, c.id)} />
                           </label>
                           <Link to={`/exams/${exam.id}/entry?classId=${c.id}`} className="w-full py-1.5 bg-gradient-to-r from-[#5B21B6] to-[#7C3AED] hover:opacity-95 text-white font-black rounded-xl text-[11px] shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer">
                             <Edit3 className="w-3.5 h-3.5" /> Marks
                           </Link>
                        </div>
                      </div>
                    ))}
                    {(!exam.classes || exam.classes.length === 0) && (
                      <div className="col-span-full p-6 rounded-2xl bg-amber-50 border border-amber-200 text-center">
                        <span className="text-xs font-black text-amber-800">No classes assigned to this exam yet.</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {showExcelModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
              <div className="bg-white rounded-[24px] border border-[#DDD7F3] shadow-2xl w-full max-w-md p-6 space-y-5">
                <div className="flex justify-between items-center pb-3 border-b border-indigo-50">
                  <h3 className="text-lg font-black text-[#1E1B4B]">Upload Marks Excel</h3>
                  <button onClick={() => setShowExcelModal(false)} className="p-1.5 rounded-xl bg-slate-100 text-slate-500 hover:text-slate-800 cursor-pointer"><X className="w-5 h-5" /></button>
                </div>

                <div className="bg-[#F8FAFF] border border-indigo-100 p-4 rounded-2xl">
                  <p className="text-xs text-[#5B21B6] font-black mb-2">Instructions:</p>
                  <ul className="text-xs text-slate-600 font-semibold list-disc pl-4 space-y-1">
                    <li>Download the sample Excel file.</li>
                    <li>Ensure columns are: 'Student ID', 'Maths', 'Physics', etc.</li>
                    <li>Upload the filled file back here.</li>
                  </ul>
                  <button onClick={downloadSampleExcel} className="mt-3 text-xs font-black bg-white px-3 py-2 rounded-xl shadow-xs border border-indigo-200 text-indigo-700 hover:bg-indigo-50 w-full text-center cursor-pointer">
                    Download Sample Excel
                  </button>
                </div>

                <form onSubmit={handleExcelUpload} className="space-y-4">
                  <div>
                    <label className="label">Select Excel File</label>
                    <input type="file" accept=".xlsx, .xls" required onChange={e => setExcelFile(e.target.files?.[0] || null)} className="input p-2" />
                  </div>
                  <div className="flex gap-3 justify-end pt-2">
                    <button type="button" onClick={() => setShowExcelModal(false)} className="btn-secondary text-sm">Cancel</button>
                    <button type="submit" className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl text-sm font-black shadow-sm cursor-pointer">Upload Data</button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══ STATUS OVERVIEW ══ */}
      {activeTab === 'status-overview' && (
        <ExamStatusTab exams={exams} />
      )}

      {/* ══ TAB 4: ADMIT CARD ══ */}
      {activeTab === 'admit-card' && (
        <AdmitCardTab exams={exams} />
      )}

      {/* ══ TAB 5: PROGRESS CARD ══ */}
      {activeTab === 'progress-card' && (
        <ProgressCardTab exams={exams} />
      )}

      {/* ══ TAB 5B: JEE PROGRESS CARD ══ */}
      {activeTab === 'jee-progress-card' && (
        <JEEProgressCardTab exams={exams} />
      )}

      {/* ══ TAB 6: SLIP TESTS ══ */}
      {activeTab === 'online-exams' && (
        <div className="card p-2 h-[80vh] overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800">
          <div className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800 mb-2">
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white">Slip Test Result Card</h3>
              <p className="text-xs text-gray-500">Standalone tool using Slip Test Result Card.html</p>
            </div>
            <a href="/Slip Test Result Card.html" target="_blank" className="btn-primary text-xs flex items-center gap-2">
              <ExternalLink className="w-4 h-4" /> Open Full Screen
            </a>
          </div>
          <iframe src="/Slip Test Result Card.html" className="w-full h-full border-0 rounded-b-lg"></iframe>
        </div>
      )}

      {/* ══ TAB 7: QUESTION GROUP ══ */}
      {activeTab === 'question-group' && (
        <div className="space-y-5">
          <div className="flex justify-between items-center bg-white p-4 rounded-[20px] border border-[#DDD7F3] shadow-sm">
            <span className="text-xs font-black uppercase text-[#5B21B6] tracking-wider">Manage Question Categories & Chapters</span>
            <button onClick={() => setShowGroupModal(true)} className="px-4 py-2 bg-gradient-to-r from-[#5B21B6] to-[#7C3AED] text-white rounded-xl flex items-center gap-2 text-xs font-black cursor-pointer">
              <Plus className="w-4 h-4" /> Add Question Group
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {questionGroups.map(group => (
              <div key={group.id} className="bg-white rounded-[20px] border border-[#DDD7F3] p-5 space-y-4 hover:shadow-md transition-all relative group border-l-4 border-l-[#5B21B6]">
                <div>
                  <h4 className="font-black text-base text-[#1E1B4B]">{group.name}</h4>
                  <p className="text-xs text-slate-500 mt-1">{group.description || 'No description provided'}</p>
                </div>
                <div className="flex items-center justify-between text-xs font-bold text-slate-500 border-t border-indigo-50 pt-3">
                  <span>Questions in group: <strong className="text-[#5B21B6]">{group._count?.questions || 0}</strong></span>
                  <button onClick={() => handleDeleteGroup(group.id)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {showGroupModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
              <div className="bg-white rounded-[24px] border border-[#DDD7F3] shadow-2xl w-full max-w-md p-6 space-y-5">
                <div className="flex justify-between items-center pb-3 border-b border-indigo-50">
                  <h3 className="text-lg font-black text-[#1E1B4B]">New Question Group</h3>
                  <button onClick={() => setShowGroupModal(false)} className="p-1.5 rounded-xl bg-slate-100 text-slate-500 hover:text-slate-800 cursor-pointer"><X className="w-5 h-5" /></button>
                </div>
                <form onSubmit={handleCreateGroup} className="space-y-4">
                  <div>
                    <label className="label">Group Name</label>
                    <input type="text" required placeholder="e.g. Physics Chapter 1" value={groupName} onChange={e => setGroupName(e.target.value)} className="input" />
                  </div>
                  <div>
                    <label className="label">Description</label>
                    <textarea rows={3} placeholder="Describe the topics covered..." value={groupDesc} onChange={e => setGroupDesc(e.target.value)} className="input" />
                  </div>
                  <div className="flex gap-3 justify-end pt-2">
                    <button type="button" onClick={() => setShowGroupModal(false)} className="btn-secondary text-sm">Cancel</button>
                    <button type="submit" className="px-5 py-2.5 bg-gradient-to-r from-[#5B21B6] to-[#7C3AED] text-white rounded-xl text-sm font-black shadow-sm cursor-pointer">Create Group</button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══ TAB 4: QUESTION BANK ══ */}
      {activeTab === 'question-bank' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-5 rounded-[22px] border border-[#DDD7F3] shadow-sm">
            <div className="flex items-center gap-4 w-full sm:w-auto">
              <div className="bg-gradient-to-br from-[#5B21B6] to-[#7C3AED] p-3 rounded-2xl shadow-md text-white shrink-0 hidden sm:block">
                <Layers className="w-5 h-5" />
              </div>
              <div className="flex flex-col sm:flex-row w-full gap-3 items-center">
                <span className="text-xs font-black uppercase text-[#5B21B6] tracking-wider shrink-0 w-full sm:w-auto">Select Group:</span>
                <select
                  value={selectedGroupId}
                  onChange={e => setSelectedGroupId(e.target.value)}
                  className="appearance-none bg-[#F8FAFF] border border-indigo-100 rounded-xl px-4 py-2.5 text-sm font-bold text-[#1E1B4B] focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-[#5B21B6] transition-all cursor-pointer w-full sm:min-w-[220px]"
                >
                  <option value="">-- Select Question Group --</option>
                  {questionGroups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
              </div>
            </div>

            {selectedGroupId && (
              <button
                onClick={() => setShowQuestionModal(true)}
                className="w-full sm:w-auto bg-gradient-to-r from-[#5B21B6] to-[#7C3AED] hover:opacity-95 text-white shadow-md px-5 py-2.5 rounded-xl text-xs uppercase tracking-wider font-black transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Create Question
              </button>
            )}
          </div>

          <div className="space-y-4">
            {questions.map((q, index) => {
              const opts = q.options ? JSON.parse(q.options) : [];
              return (
                <div key={q.id} className="bg-white p-6 rounded-[22px] border border-[#DDD7F3] shadow-sm relative group transition-all hover:shadow-md flex flex-col gap-4 overflow-hidden">
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-[#5B21B6] to-[#7C3AED]"></div>
                  <div className="flex justify-between items-start gap-4 pl-3">
                    <div>
                      <h4 className="font-black text-base text-[#1E1B4B] leading-relaxed">
                        <span className="text-[#5B21B6] mr-2">Q{index + 1}.</span>
                        {q.questionText}
                      </h4>
                      <div className="flex items-center gap-2.5 mt-2.5">
                        <span className="text-[10px] font-black uppercase tracking-wider bg-[#F2EDFF] text-[#5B21B6] px-2.5 py-1 rounded-lg border border-[#DDD7F3]">
                          {q.questionType}
                        </span>
                        <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-lg border border-emerald-200">
                          {q.marks} Marks
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteQuestion(q.id)}
                      className="p-2 rounded-xl bg-[#F8FAFF] border border-indigo-100 text-slate-400 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200 transition-all cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {q.questionType === 'MCQ' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-3 pt-1">
                      {opts.map((opt: string, optIdx: number) => {
                        const correct = q.correctAnswer === String(optIdx);
                        return (
                          <div key={optIdx} className={`p-3.5 rounded-xl border font-bold text-sm transition-all flex items-center gap-3 ${correct ? 'bg-emerald-50 border-emerald-300 text-emerald-800 shadow-xs' : 'bg-[#F8FAFF] border-indigo-100 text-slate-700'}`}>
                            <span className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-black ${correct ? 'bg-emerald-500 text-white' : 'bg-white border border-indigo-100 text-slate-500'}`}>
                              {String.fromCharCode(65 + optIdx)}
                            </span>
                            {opt}
                            {correct && <CheckCircle className="w-4 h-4 ml-auto text-emerald-600" />}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {q.questionType === 'SUBJECTIVE' && (
                    <div className="text-sm bg-[#F8FAFF] p-4 rounded-xl border border-indigo-100 ml-3">
                      <span className="text-[11px] font-black text-[#5B21B6] uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                        <CheckCircle className="w-4 h-4" /> Expected Key Phrases/Answers:
                      </span>
                      <p className="font-bold text-slate-700 leading-relaxed">{q.correctAnswer}</p>
                    </div>
                  )}
                </div>
              );
            })}
            {questions.length === 0 && (
              <div className="bg-white rounded-[24px] p-14 flex flex-col items-center justify-center text-center border border-[#DDD7F3]">
                <Layers className="w-12 h-12 text-indigo-200 mb-3" />
                <h3 className="text-lg font-black text-[#1E1B4B]">No Questions Found</h3>
                <p className="text-xs font-semibold text-slate-500 mt-1 max-w-md">No questions defined inside this group. Add question elements to populate the exam bank.</p>
              </div>
            )}
          </div>

          {showQuestionModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
              <div className="bg-white rounded-[24px] border border-[#DDD7F3] shadow-2xl w-full max-w-lg p-6 space-y-5 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center pb-3 border-b border-indigo-50">
                  <h3 className="text-lg font-black text-[#1E1B4B]">Add Question to Bank</h3>
                  <button onClick={() => setShowQuestionModal(false)} className="p-1.5 rounded-xl bg-slate-100 text-slate-500 hover:text-slate-800 cursor-pointer"><X className="w-5 h-5" /></button>
                </div>
                <form onSubmit={handleCreateQuestion} className="space-y-4">
                  <div>
                    <label className="label">Question Type</label>
                    <select value={qType} onChange={e => setQType(e.target.value)} className="input">
                      <option value="MCQ">Multiple Choice Question (MCQ)</option>
                      <option value="SUBJECTIVE">Subjective Answer</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">Question Text</label>
                    <textarea rows={3} required placeholder="e.g. What is the value of gravitational constant G?" value={qText} onChange={e => setQText(e.target.value)} className="input" />
                  </div>

                  {qType === 'MCQ' ? (
                    <div className="space-y-3">
                      <span className="text-xs font-bold text-slate-500">Provide 4 Answer Options:</span>
                      <div className="grid grid-cols-2 gap-3">
                        {qOptions.map((opt, optIdx) => (
                          <input key={optIdx} type="text" required placeholder={`Option ${optIdx + 1}`} value={opt} onChange={e => {
                            const updated = [...qOptions];
                            updated[optIdx] = e.target.value;
                            setQOptions(updated);
                          }} className="input" />
                        ))}
                      </div>
                      <div>
                        <label className="label">Select Correct Option Number</label>
                        <select value={qCorrect} onChange={e => setQCorrect(e.target.value)} className="input">
                          <option value="0">Option 1</option>
                          <option value="1">Option 2</option>
                          <option value="2">Option 3</option>
                          <option value="3">Option 4</option>
                        </select>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label className="label">Correct Answer Key Description</label>
                      <input type="text" required placeholder="Describe key answers phrases..." value={qCorrect} onChange={e => setQCorrect(e.target.value)} className="input" />
                    </div>
                  )}

                  <div>
                    <label className="label">Marks weightage</label>
                    <input type="number" min={1} value={qMarks} onChange={e => setQMarks(Number(e.target.value))} className="input" />
                  </div>

                  <div className="flex gap-3 justify-end pt-2">
                    <button type="button" onClick={() => setShowQuestionModal(false)} className="btn-secondary text-sm">Cancel</button>
                    <button type="submit" className="px-5 py-2.5 bg-gradient-to-r from-[#5B21B6] to-[#7C3AED] text-white rounded-xl text-sm font-black shadow-sm cursor-pointer">Save Question</button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══ TAB 5: ADD ONLINE EXAM ══ */}
      {activeTab === 'add-online-exam' && isAdminOrTeacher && (
        <div className="bg-white p-6 rounded-[24px] border border-[#DDD7F3] shadow-sm space-y-6">
          <div className="pb-3 border-b border-indigo-50">
            <h3 className="text-lg font-black text-[#1E1B4B]">Configure Advanced Online Exam</h3>
            <p className="text-xs font-semibold text-slate-500 mt-1">Configure timed, automated grading online tests from the question bank.</p>
          </div>

          <form onSubmit={handleCreateOnlineExam} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Exam Title</label>
                <input type="text" required placeholder="e.g. Physics Chapter 1 MCQ Test" value={onlineTitle} onChange={e => setOnlineTitle(e.target.value)} className="input" />
              </div>
              <div>
                <label className="label">Target Class</label>
                <select required value={onlineClassId} onChange={e => setOnlineClassId(e.target.value)} className="input">
                  <option value="">Select Class</option>
                  {classes.map(c => <option key={c.id} value={c.id}>{c.name}-{c.section}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="label">Subject</label>
                <select required value={onlineSubjectId} onChange={e => setOnlineSubjectId(e.target.value)} className="input">
                  <option value="">Select Subject</option>
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Duration (minutes)</label>
                <input type="number" required value={onlineDuration} onChange={e => setOnlineDuration(Number(e.target.value))} className="input" />
              </div>
              <div>
                <label className="label">Passing Marks</label>
                <input type="number" required value={onlinePassMarks} onChange={e => setOnlinePassMarks(Number(e.target.value))} className="input" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Start Schedule Time</label>
                <input type="datetime-local" value={onlineStart} onChange={e => setOnlineStart(e.target.value)} className="input" />
              </div>
              <div>
                <label className="label">End Schedule Time</label>
                <input type="datetime-local" value={onlineEnd} onChange={e => setOnlineEnd(e.target.value)} className="input" />
              </div>
            </div>

            <div className="space-y-3 pt-3 border-t border-indigo-50">
              <span className="text-xs font-black text-slate-600 uppercase tracking-wider block">Pick Staged Questions to Include in Exam:</span>
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-slate-500">Filter Question Group:</span>
                <select value={selectedGroupId} onChange={e => setSelectedGroupId(e.target.value)} className="bg-[#F8FAFF] border border-indigo-100 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800">
                  {questionGroups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
              </div>

              <div className="max-h-60 overflow-y-auto border border-indigo-100 rounded-2xl divide-y divide-indigo-50 bg-[#F8FAFF]">
                {questions.map(q => {
                  const checked = selectedQIds.includes(q.id);
                  return (
                    <label key={q.id} className="flex items-start gap-3 p-3.5 hover:bg-white cursor-pointer select-none transition-colors">
                      <input type="checkbox" checked={checked} onChange={() => {
                        if (checked) {
                          setSelectedQIds(selectedQIds.filter(id => id !== q.id));
                        } else {
                          setSelectedQIds([...selectedQIds, q.id]);
                        }
                      }} className="mt-1" />
                      <div className="text-xs">
                        <p className="font-bold text-[#1E1B4B]">{q.questionText}</p>
                        <span className="text-[10px] text-slate-500 font-semibold">{q.questionType} · Marks: {q.marks}</span>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3">
              <button type="submit" className="px-6 py-2.5 bg-gradient-to-r from-[#5B21B6] to-[#7C3AED] text-white rounded-xl text-sm font-black flex items-center gap-2 shadow-sm cursor-pointer">
                <Save className="w-4 h-4" /> Publish Online Exam
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ══ TAB 8: QUESTION PAPERS (UPLOAD/DOWNLOAD) ══ */}
      {activeTab === 'question-papers' && (() => {
        const filteredQps = questionPapers.filter((qp) => {
          const matchesSearch = !qpSearch.trim() ||
            (qp.title || '').toLowerCase().includes(qpSearch.trim().toLowerCase()) ||
            (qp.exam?.name || '').toLowerCase().includes(qpSearch.trim().toLowerCase()) ||
            (qp.subject?.name || '').toLowerCase().includes(qpSearch.trim().toLowerCase());
          const matchesStatus = qpStatusFilter === 'ALL' || (qp.status || 'PENDING_APPROVAL') === qpStatusFilter;
          const matchesClass = !qpClassFilter || qp.classId === qpClassFilter || qp.class?.id === qpClassFilter;
          return matchesSearch && matchesStatus && matchesClass;
        });

        return (
        <div className="space-y-6 animate-fade-in">
          {/* Light Pastel Stats Strip */}
          {isAdmin && qpStats && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4">
              {[
                { label: 'Total Papers', val: qpStats.totalPapers ?? 0, icon: FileText, bg: 'bg-gradient-to-br from-[#F2EDFF] to-[#DDD2FF]', border: 'border-[#D8CEF6]', iconBg: 'bg-[#5B21B6]', valCol: 'text-[#3B0764]' },
                { label: 'Answer Keys', val: qpStats.answerKeys ?? 0, icon: Key, bg: 'bg-gradient-to-br from-[#FFF6E5] to-[#FFE4B8]', border: 'border-amber-200', iconBg: 'bg-amber-500', valCol: 'text-amber-900' },
                { label: 'Published', val: qpStats.publishedPapers ?? 0, icon: CheckCircle, bg: 'bg-gradient-to-br from-[#E5FAEF] to-[#C2F2D9]', border: 'border-emerald-200', iconBg: 'bg-emerald-600', valCol: 'text-emerald-900' },
                { label: 'Scheduled', val: qpStats.scheduledPapers ?? 0, icon: Clock, bg: 'bg-gradient-to-br from-[#EAF2FF] to-[#CBE0FF]', border: 'border-blue-200', iconBg: 'bg-blue-600', valCol: 'text-blue-900' },
                { label: 'Total Questions', val: qpStats.totalQuestions ?? 0, icon: HelpCircle, bg: 'bg-gradient-to-br from-[#FFEFEF] to-[#FFD2D7]', border: 'border-rose-200', iconBg: 'bg-rose-500', valCol: 'text-rose-900' },
              ].map((st) => {
                const Icon = st.icon;
                return (
                  <div key={st.label} className={`rounded-[20px] p-4 border shadow-xs ${st.bg} ${st.border} flex items-center justify-between gap-3`}>
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-600 block">{st.label}</span>
                      <p className={`text-2xl font-black mt-1 ${st.valCol}`}>{st.val}</p>
                    </div>
                    <div className={`w-10 h-10 rounded-2xl ${st.iconBg} text-white flex items-center justify-center shadow-sm shrink-0`}>
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Toolbar & Filters */}
          <div className="bg-white p-4 sm:p-5 rounded-[22px] border border-[#DDD7F3] shadow-[0_6px_22px_-8px_rgba(79,70,229,0.1)] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-black text-[#1E1B4B]">Question Papers & Answer Keys Repository</h3>
                <p className="text-xs font-semibold text-slate-500 mt-0.5">Manage, approve, and publish exam papers with attached solution keys</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {isAdmin && (
                  <button
                    onClick={() => setShowPermissionsModal(true)}
                    className="flex items-center gap-2 text-xs font-black px-4 py-2.5 rounded-xl bg-[#F8FAFF] border border-indigo-100 hover:bg-indigo-50 text-[#1E1B4B] transition-all cursor-pointer"
                  >
                    <ShieldAlert className="w-3.5 h-3.5 text-[#5B21B6]" /> Teacher Permissions
                  </button>
                )}
                {(isAdmin || isTeacher) && (
                  <button
                    onClick={() => setShowQpModal(true)}
                    className="flex items-center gap-2 text-xs font-black px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#5B21B6] to-[#7C3AED] hover:opacity-95 text-white shadow-md shadow-indigo-500/20 transition-all cursor-pointer"
                  >
                    <Plus className="w-4 h-4" /> Upload Question Paper
                  </button>
                )}
              </div>
            </div>

            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pt-3 border-t border-indigo-50">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={qpSearch}
                  onChange={(e) => setQpSearch(e.target.value)}
                  placeholder="Search paper title, exam or subject..."
                  className="w-full pl-10 pr-4 py-2 bg-[#F8FAFF] border border-indigo-100 rounded-xl text-xs font-bold text-[#1E1B4B] outline-none focus:border-[#5B21B6]"
                />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={qpClassFilter}
                  onChange={(e) => setQpClassFilter(e.target.value)}
                  className="bg-[#F8FAFF] border border-indigo-100 rounded-xl px-3 py-2 text-xs font-bold text-[#1E1B4B] outline-none focus:border-[#5B21B6] cursor-pointer"
                >
                  <option value="">All Classes</option>
                  {classes.map(c => <option key={c.id} value={c.id}>{c.name}-{c.section}</option>)}
                </select>
                <div className="flex flex-wrap gap-1 bg-[#F8FAFF] p-1 rounded-xl border border-indigo-100">
                  {[
                    { id: 'ALL', label: 'All' },
                    { id: 'PUBLISHED', label: 'Published' },
                    { id: 'APPROVED', label: 'Approved' },
                    { id: 'PENDING_APPROVAL', label: 'Pending' },
                  ].map((st) => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => setQpStatusFilter(st.id as any)}
                      className={`px-3 py-1 rounded-lg text-[11px] font-black transition-all cursor-pointer ${
                        qpStatusFilter === st.id
                          ? 'bg-[#5B21B6] text-white shadow-xs'
                          : 'text-slate-600 hover:text-[#5B21B6]'
                      }`}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredQps.map(qp => {
              let borderCol = 'bg-amber-500';
              const statusText = qp.status || 'PENDING_APPROVAL';
              let badgeStyle = 'bg-amber-50 text-amber-700 border-amber-200';
              let statusLabel = 'Pending Approval';

              if (statusText === 'PUBLISHED') {
                borderCol = 'bg-emerald-500';
                badgeStyle = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                statusLabel = 'Published';
              } else if (statusText === 'APPROVED') {
                borderCol = 'bg-blue-500';
                badgeStyle = 'bg-blue-50 text-blue-700 border-blue-200';
                statusLabel = 'Approved';
              } else if (statusText === 'REJECTED') {
                borderCol = 'bg-rose-500';
                badgeStyle = 'bg-rose-50 text-rose-700 border-rose-200';
                statusLabel = 'Rejected';
              }

              return (
                <div key={qp.id} className="relative overflow-hidden bg-white border border-[#DDD7F3] rounded-[22px] p-5 shadow-[0_6px_22px_-8px_rgba(79,70,229,0.1)] hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between group">
                  <div className={`absolute top-0 left-0 w-1.5 h-full ${borderCol}`}></div>

                  <div className="space-y-3.5 pl-2">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <h4 className="font-black text-base text-[#1E1B4B] leading-snug group-hover:text-[#5B21B6] transition-colors">{qp.title}</h4>
                        <span className="inline-block mt-1.5 text-[10px] font-black bg-[#F2EDFF] text-[#5B21B6] px-2.5 py-0.5 rounded-lg border border-[#DDD7F3]">
                          {qp.exam?.name ? formatExamOptionLabel(qp.exam.name) : 'General Exam'}
                        </span>
                      </div>
                      <span className={`text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border shrink-0 ${badgeStyle}`}>
                        {statusLabel}
                      </span>
                    </div>

                    <div className="space-y-1.5 bg-[#F8FAFF] p-3 rounded-xl border border-indigo-50">
                      <div className="flex items-center gap-1.5 text-xs text-slate-600">
                        <Layers className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Class: <strong className="text-[#1E1B4B]">{qp.class?.name}-{qp.class?.section}</strong></span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-600">
                        <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Subject: <strong className="text-[#1E1B4B]">{qp.subject?.name || 'All Subjects / Combined'}</strong></span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 mt-4 border-t border-indigo-50 pl-2">
                    <div className="flex gap-2">
                      <a href={qp.fileUrl} target="_blank" rel="noreferrer" className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white border border-emerald-200 text-xs font-black transition-all">
                        <FileText className="w-3.5 h-3.5" /> View Paper
                      </a>

                      {qp.answerKeyUrl && (
                        <a href={qp.answerKeyUrl} target="_blank" rel="noreferrer" className="flex items-center justify-center p-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition-all" title="View Key Link">
                           <ExternalLink className="w-4 h-4" />
                        </a>
                      )}

                      {(isAdmin || isTeacher) && (
                        <button onClick={() => { setSelectedQpForAnswerKey(qp); setAnswerKeyText(qp.answerKey || ''); setAnswerKeyUrl(qp.answerKeyUrl || ''); setShowAnswerKeyModal(true); }} className="p-2 border border-indigo-100 hover:border-[#5B21B6] text-[#5B21B6] bg-[#F8FAFF] hover:bg-[#F2EDFF] rounded-xl cursor-pointer transition-all" title="Manage Answer Key">
                          <Key className="w-4 h-4" />
                        </button>
                      )}

                      {isAdmin && (
                        <button onClick={() => handleDeleteQp(qp.id)} className="p-2 border border-rose-100 hover:bg-rose-50 text-rose-500 rounded-xl cursor-pointer transition-all" title="Delete Paper">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {isAdmin && (statusText === 'PENDING_APPROVAL' || statusText === 'APPROVED' || statusText === 'REJECTED') && (
                      <div className="flex gap-2 mt-2.5 pt-2.5 border-t border-indigo-50">
                        {statusText === 'PENDING_APPROVAL' && (
                          <>
                            <button onClick={() => handleApproveQp(qp.id)} className="flex-1 py-1.5 px-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl font-black border border-emerald-200 text-xs transition-all cursor-pointer">
                              Approve
                            </button>
                            <button onClick={() => handleRejectQp(qp.id)} className="flex-1 py-1.5 px-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl font-black border border-rose-200 text-xs transition-all cursor-pointer">
                              Reject
                            </button>
                          </>
                        )}
                        {(statusText === 'APPROVED' || statusText === 'REJECTED') && (
                          <button onClick={() => handlePublishQp(qp.id)} className="w-full py-1.5 px-2 bg-[#F2EDFF] hover:bg-[#5B21B6] text-[#5B21B6] hover:text-white rounded-xl font-black border border-[#DDD7F3] text-xs transition-all cursor-pointer">
                            Publish Paper
                          </button>
                        )}
                      </div>
                    )}

                    {qp.answerKey && (
                      <div className="mt-3 p-3 bg-[#F8FAFF] rounded-xl text-[11px] border border-indigo-100">
                        <p className="font-black mb-1 flex items-center gap-1 text-[#1E1B4B]"><Key className="w-3.5 h-3.5 text-[#5B21B6]"/> Typed Answer Key:</p>
                        <div className="whitespace-pre-wrap text-slate-600 font-medium leading-relaxed">{qp.answerKey}</div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            {filteredQps.length === 0 && (
              <div className="col-span-full py-14 flex flex-col items-center justify-center text-center bg-white rounded-[24px] border border-dashed border-[#DDD7F3]">
                <Layers className="w-12 h-12 text-indigo-200 mb-3" />
                <h3 className="text-base font-black text-[#1E1B4B]">No Question Papers Found</h3>
                <p className="text-xs font-semibold text-slate-500 mt-1">Adjust filters or click "Upload Question Paper" to add a new paper.</p>
              </div>
            )}
          </div>

          {/* ── REDESIGNED UPLOAD QUESTION PAPER STUDIO MODAL ── */}
          {showQpModal && (() => {
            const availableClasses = sortClasses((() => {
              if (!qpExamId) return classes;
              const selectedExam = exams.find(ex => ex.id === qpExamId);
              return selectedExam?.classes || [];
            })());

            const availableSubjects = (() => {
              if (!qpExamId) return subjects;
              const selectedExam = exams.find(e => e.id === qpExamId);
              if (!selectedExam || !selectedExam.subjects) return [];
              let examSubs: any[] = [];
              const subData = typeof selectedExam.subjects === 'string' ? JSON.parse(selectedExam.subjects) : selectedExam.subjects;
              if (subData && typeof subData === 'object' && !Array.isArray(subData) && subData.globalSubjects) {
                examSubs = subData.globalSubjects;
              } else if (Array.isArray(subData)) {
                examSubs = subData;
              }
              return examSubs.map((es: any) => {
                const subId = es.id || es.subjectId || es.subject?.id;
                const foundSub = subjects.find(s => s.id === subId);
                return foundSub || { id: subId, name: es.name || es.subject?.name };
              }).filter(Boolean);
            })();

            const allClassesPicked = availableClasses.length > 0 && availableClasses.every((c: any) => qpClassIds.includes(c.id));

            return (
              <div className="fixed inset-0 z-50 bg-slate-900/45 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-fade-in">
                <div className="bg-white rounded-[26px] border border-[#DDD7F3] shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">
                  {/* Purple ERP Modal Header */}
                  <div className="bg-gradient-to-r from-[#5B21B6] via-[#6D38EA] to-[#7C3AED] px-6 py-4 flex items-center justify-between text-white shrink-0">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-white/15 border border-white/25 flex items-center justify-center">
                        <Upload className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-base sm:text-lg font-black tracking-wide">Upload Question Paper</h3>
                        <p className="text-[11px] font-semibold text-indigo-100">Assign target classes & subjects and attach PDF/Word or document link</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowQpModal(false)}
                      className="p-2 rounded-xl bg-white/15 hover:bg-white/25 text-white transition-all cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <form onSubmit={handleCreateQp} className="flex-1 flex flex-col overflow-hidden">
                    <div className="flex-1 overflow-y-auto p-5 sm:p-6 bg-[#F8FAFF] space-y-5 custom-scrollbar">
                      {/* Row 1: Title & Exam */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white p-5 rounded-2xl border border-indigo-100 shadow-xs">
                        <div>
                          <label className="block text-[11px] font-black uppercase tracking-wider text-slate-600 mb-2">Paper Title (Optional)</label>
                          <input
                            type="text"
                            placeholder="e.g. SA-1 Mathematics Model Paper"
                            value={qpTitle}
                            onChange={e => setQpTitle(e.target.value)}
                            className="w-full px-4 py-2.5 bg-[#F8FAFF] border border-indigo-100 rounded-xl text-sm font-bold text-[#1E1B4B] outline-none focus:border-[#5B21B6] focus:bg-white transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-black uppercase tracking-wider text-slate-600 mb-2">Link to Examination (Optional)</label>
                          <select
                            value={qpExamId}
                            onChange={e => {
                              const newExamId = e.target.value;
                              setQpExamId(newExamId);
                              setQpClassIds([]);
                              setQpSubjectId('');
                            }}
                            className="w-full px-4 py-2.5 bg-[#F8FAFF] border border-indigo-100 rounded-xl text-sm font-bold text-[#1E1B4B] outline-none focus:border-[#5B21B6] focus:bg-white transition-all cursor-pointer"
                          >
                            <option value="">General / Standalone Paper</option>
                            {exams.map(e => <option key={e.id} value={e.id}>{formatExamOptionLabel(e.name)}</option>)}
                          </select>
                        </div>
                      </div>

                      {/* Row 2: Target Classes & Subjects */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-white p-5 rounded-2xl border border-indigo-100 shadow-xs flex flex-col">
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <label className="block text-[11px] font-black uppercase tracking-wider text-[#1E1B4B]">Target Classes *</label>
                              <span className="text-[10px] font-bold text-slate-400">{qpClassIds.length} classes selected</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                if (allClassesPicked) setQpClassIds([]);
                                else setQpClassIds(availableClasses.map((c: any) => c.id));
                              }}
                              className="px-2.5 py-1 rounded-lg bg-[#F2EDFF] hover:bg-indigo-100 text-[#5B21B6] text-[10px] font-black cursor-pointer"
                            >
                              {allClassesPicked ? 'Clear All' : 'Select All'}
                            </button>
                          </div>
                          <div className="flex-1 overflow-y-auto p-3 bg-[#F8FAFF] rounded-xl border border-indigo-50 max-h-52 grid grid-cols-2 gap-2 custom-scrollbar">
                            {availableClasses.map((c: any) => {
                              const checked = qpClassIds.includes(c.id);
                              return (
                                <label
                                  key={c.id}
                                  className={`flex items-center gap-2 cursor-pointer text-xs font-black p-2.5 rounded-xl border transition-all ${
                                    checked
                                      ? 'bg-[#F2EDFF] border-[#7C3AED] text-[#5B21B6] shadow-xs'
                                      : 'bg-white border-indigo-100 text-slate-700 hover:border-indigo-300'
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={(e) => {
                                      if (e.target.checked) setQpClassIds(prev => [...prev, c.id]);
                                      else setQpClassIds(prev => prev.filter(id => id !== c.id));
                                    }}
                                    className="w-4 h-4 text-[#5B21B6] rounded focus:ring-[#5B21B6] border-slate-300"
                                  />
                                  <span className="truncate">{c.name}-{c.section}</span>
                                </label>
                              );
                            })}
                          </div>
                        </div>

                        <div className="bg-white p-5 rounded-2xl border border-indigo-100 shadow-xs flex flex-col">
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <label className="block text-[11px] font-black uppercase tracking-wider text-[#1E1B4B]">Subjects (Optional)</label>
                              <span className="text-[10px] font-bold text-slate-400">{qpSubjectIds.length || 'All'} selected</span>
                            </div>
                            {qpSubjectIds.length > 0 && (
                              <button
                                type="button"
                                onClick={() => setQpSubjectIds([])}
                                className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-600 text-[10px] font-black cursor-pointer"
                              >
                                Clear
                              </button>
                            )}
                          </div>
                          <div className="flex-1 overflow-y-auto p-3 bg-[#F8FAFF] rounded-xl border border-indigo-50 max-h-52 grid grid-cols-1 sm:grid-cols-2 gap-2 custom-scrollbar">
                            {availableSubjects.map((s: any) => {
                              const checked = qpSubjectIds.includes(s.id);
                              return (
                                <label
                                  key={s.id}
                                  className={`flex items-center gap-2 cursor-pointer text-xs font-black p-2.5 rounded-xl border transition-all ${
                                    checked
                                      ? 'bg-emerald-50 border-emerald-400 text-emerald-800 shadow-xs'
                                      : 'bg-white border-indigo-100 text-slate-700 hover:border-indigo-300'
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={(e) => {
                                      if (e.target.checked) setQpSubjectIds(prev => [...prev, s.id]);
                                      else setQpSubjectIds(prev => prev.filter(id => id !== s.id));
                                    }}
                                    className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 border-slate-300"
                                  />
                                  <span className="truncate uppercase">{s.name}</span>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      {/* Row 3: Upload Document Dropzone + Link */}
                      <div className="bg-white p-5 rounded-2xl border border-indigo-100 shadow-xs space-y-4">
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] font-black uppercase tracking-wider text-[#1E1B4B] flex items-center gap-2">
                            <Upload className="w-4 h-4 text-[#5B21B6]" /> Upload Question Paper Document (PDF / Word)
                          </label>
                          {qpFileUrl && (
                            <span className="px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-black flex items-center gap-1">
                              <CheckCircle className="w-3.5 h-3.5" /> File Attached
                            </span>
                          )}
                        </div>

                        <div className="relative border-2 border-dashed border-indigo-200 hover:border-[#5B21B6] transition-all rounded-2xl p-7 flex flex-col items-center justify-center bg-[#F8FAFF] hover:bg-[#F2EDFF]/40 cursor-pointer group">
                          <input
                            type="file"
                            accept=".pdf,.doc,.docx"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              const formData = new FormData();
                              formData.append('file', file);
                              const loadingToast = toast.loading('Uploading document...');
                              try {
                                const res: any = await api.post('/api/uploads/document', formData, {
                                  headers: { 'Content-Type': 'multipart/form-data' }
                                });
                                toast.dismiss(loadingToast);
                                const urlVal = res.data?.url || res.url || res.data?.data?.url;
                                if (urlVal) {
                                  setQpFileUrl(urlVal);
                                  toast.success('Document uploaded successfully');
                                } else {
                                  toast.error('Upload failed: Invalid response');
                                }
                              } catch {
                                toast.dismiss(loadingToast);
                                toast.error('Error uploading document');
                              }
                            }}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          />
                          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#F2EDFF] to-[#DDD2FF] border border-indigo-200 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                            <Download className="w-6 h-6 text-[#5B21B6]" />
                          </div>
                          <span className="text-sm font-black text-[#1E1B4B] group-hover:text-[#5B21B6] transition-colors">Click or drag question paper here to upload</span>
                          <span className="text-xs text-slate-500 mt-1 font-semibold">Supported formats: PDF, DOC, DOCX (Max 10MB)</span>
                        </div>

                        <div>
                          <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 mb-1.5 flex items-center gap-1.5">
                            <LinkIcon className="w-3.5 h-3.5 text-[#5B21B6]" /> Or Paste Document / Google Drive Link
                          </label>
                          <input
                            type="text"
                            placeholder="https://link-to-file.pdf or Google Drive share link"
                            value={qpFileUrl}
                            onChange={e => setQpFileUrl(e.target.value)}
                            className="w-full bg-[#F8FAFF] border border-indigo-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-[#5B21B6] text-[#1E1B4B] font-bold transition-all"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Modal Footer */}
                    <div className="px-6 py-4 bg-white border-t border-indigo-50 flex items-center justify-end gap-3 shrink-0">
                      <button
                        type="button"
                        onClick={() => setShowQpModal(false)}
                        className="px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider bg-gradient-to-r from-[#5B21B6] to-[#7C3AED] text-white hover:opacity-95 shadow-lg shadow-indigo-500/25 transition-all flex items-center gap-2 cursor-pointer"
                      >
                        <Save className="w-4 h-4" /> Save Question Paper
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            );
          })()}

          {/* ANSWER KEY MODAL */}
          {showAnswerKeyModal && selectedQpForAnswerKey && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 backdrop-blur-sm p-4">
              <div className="bg-white rounded-[24px] w-full max-w-lg p-6 space-y-5 shadow-2xl border border-[#DDD7F3]">
                <div className="flex justify-between items-center border-b border-indigo-50 pb-4">
                  <div>
                    <h3 className="text-lg font-black text-[#1E1B4B] flex items-center gap-2"><Key className="w-5 h-5 text-[#5B21B6]" /> Answer Key</h3>
                    <p className="text-xs font-semibold text-slate-500 mt-0.5">{selectedQpForAnswerKey.title}</p>
                  </div>
                  <button onClick={() => setShowAnswerKeyModal(false)} className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"><X className="w-5 h-5 text-slate-600" /></button>
                </div>

                <form onSubmit={handleUpdateAnswerKey} className="space-y-4">
                  <div>
                    <label className="label font-bold">Answer Key Document URL (PDF/Image) - Optional</label>
                    <input type="url" placeholder="https://link-to-answer-key.pdf" value={answerKeyUrl} onChange={e => setAnswerKeyUrl(e.target.value)} className="input border-indigo-100 focus:border-[#5B21B6]" />
                    <p className="text-[10px] text-slate-400 mt-1">If you have a PDF answer key, paste the link here.</p>
                  </div>

                  <div className="relative flex items-center py-1">
                    <div className="flex-grow border-t border-indigo-100"></div>
                    <span className="mx-3 text-xs text-slate-400 font-black uppercase tracking-wider">OR</span>
                    <div className="flex-grow border-t border-indigo-100"></div>
                  </div>

                  <div>
                    <label className="label font-bold">Type Answers Manually</label>
                    <textarea
                      placeholder="1. A&#10;2. B&#10;3. C&#10;..."
                      value={answerKeyText}
                      onChange={e => setAnswerKeyText(e.target.value)}
                      className="input min-h-[150px] resize-y font-mono text-sm leading-relaxed"
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-3 border-t border-indigo-50">
                    <button type="button" onClick={() => setShowAnswerKeyModal(false)} className="btn-secondary">Cancel</button>
                    <button type="submit" className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#5B21B6] to-[#7C3AED] text-white font-black text-xs uppercase tracking-wider shadow-md flex items-center gap-2 cursor-pointer">
                      <Save className="w-4 h-4"/> Save Answer Key
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
        );
      })()}

      {/* ══ TAB 10: SLIP TESTS ══ */}
      {activeTab === 'slip-tests' && (
        <SlipTestsTab />
      )}

      {/* ══ TAB 11: RESULTS ══ */}
      {activeTab === 'results' && (
        <ResultsTab exams={exams} />
      )}

      {/* ══ TAB 9: ONLINE EXAMS LIST ══ */}
      {activeTab === 'online-exams' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {onlineExams.map(exam => (
              <div key={exam.id} className="bg-white rounded-[22px] border border-[#DDD7F3] p-5 space-y-4 hover:shadow-md border-t-4 border-t-[#5B21B6]">
                <div>
                  <Badge variant="success">{exam.subject?.name}</Badge>
                  <h4 className="font-black text-base text-[#1E1B4B] mt-1.5">{exam.title}</h4>
                  <p className="text-[11px] font-bold text-slate-400 mt-1">Class: {exam.class?.name}-{exam.class?.section}</p>
                </div>

                <div className="text-xs space-y-2 text-slate-600 font-semibold border-y border-indigo-50 py-3">
                  <p className="flex justify-between"><span>Duration:</span> <strong>{exam.duration} mins</strong></p>
                  <p className="flex justify-between"><span>Total Marks:</span> <strong>{exam.totalMarks}</strong></p>
                  <p className="flex justify-between"><span>Passing Marks:</span> <strong>{exam.passMarks}</strong></p>
                  <p className="flex justify-between"><span>Questions:</span> <strong>{exam.questions?.length || 0} items</strong></p>
                </div>

                {isStudent ? (
                  <button onClick={() => handleStartTakeExam(exam.id)} className="w-full py-2.5 bg-gradient-to-r from-[#5B21B6] to-[#7C3AED] text-white rounded-xl font-black text-xs flex items-center justify-center gap-2 cursor-pointer">
                    <Play className="w-4 h-4" /> Start Exam
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button onClick={() => handleViewSubmissions(exam.id)} className="btn-secondary flex-1 text-xs font-bold">
                      Submissions ({exam.submissions?.length || 0})
                    </button>
                    <button onClick={() => handleDeleteOnlineExam(exam.id)} className="p-2 border border-rose-200 text-rose-500 hover:bg-rose-50 rounded-xl cursor-pointer">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            ))}
            {onlineExams.length === 0 && (
              <div className="col-span-full py-12 text-center text-slate-400 font-semibold">
                No active online exams scheduled or published.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══ TAB 7: EXAMINATIONS DIRECTORY (Redesigned Professional ERP List) ══ */}
      {activeTab === 'examination' && (() => {
        const getExamMeta = (ex: any) => {
          const upper = (ex.name || '').toUpperCase();
          let catKey: 'BOARD' | 'NAVODAYA' | 'JEE' | 'OTHER' = 'OTHER';
          let catLabel = 'Assessment';
          let accentBar = 'from-emerald-500 to-teal-500';
          let badgeCss = 'bg-emerald-50 text-emerald-700 border-emerald-200';

          if (upper.includes('JEE') || upper.includes('NEET') || upper.includes('IIT')) {
            catKey = 'JEE';
            catLabel = 'JEE / Competitive';
            accentBar = 'from-amber-500 to-orange-500';
            badgeCss = 'bg-amber-50 text-amber-800 border-amber-200';
          } else if (upper.includes('NAVODAYA')) {
            catKey = 'NAVODAYA';
            catLabel = 'Navodaya Model';
            accentBar = 'from-cyan-500 to-blue-600';
            badgeCss = 'bg-cyan-50 text-cyan-800 border-cyan-200';
          } else if (
            upper.includes('FA-') || upper.includes('FA ') ||
            upper.includes('SA-') || upper.includes('SA ') ||
            upper.includes('FORMATIVE') || upper.includes('SUMMATIVE') ||
            upper.includes('PRE-FINAL') || upper.includes('BOARD') || upper.includes('FINAL')
          ) {
            catKey = 'BOARD';
            catLabel = 'Board / Term';
            accentBar = 'from-[#5B21B6] to-[#7C3AED]';
            badgeCss = 'bg-[#F2EDFF] text-[#5B21B6] border-[#DDD7F3]';
          }

          let subCount = 0;
          try {
            const parsed = typeof ex.subjects === 'string' ? JSON.parse(ex.subjects) : ex.subjects;
            if (Array.isArray(parsed)) subCount = parsed.length;
            else if (parsed?.classConfigs && Array.isArray(parsed.classConfigs)) {
              const uniq = new Set<string>();
              parsed.classConfigs.forEach((cfg: any) => (cfg.subjects || []).forEach((s: any) => s?.name && uniq.add(s.name.trim().toUpperCase())));
              subCount = uniq.size;
            } else if (parsed?.globalSubjects && Array.isArray(parsed.globalSubjects)) {
              subCount = parsed.globalSubjects.length;
            }
          } catch {}

          const sortedCls = sortClasses(ex.classes || []);
          return { catKey, catLabel, accentBar, badgeCss, subCount, sortedCls };
        };

        const filteredExams = exams.filter((ex) => {
          const { catKey, sortedCls } = getExamMeta(ex);
          const q = examSearch.trim().toLowerCase();
          const matchesQ = !q ||
            (ex.name || '').toLowerCase().includes(q) ||
            (ex.term || '').toLowerCase().includes(q) ||
            sortedCls.some((c: any) => `${c.name}-${c.section}`.toLowerCase().includes(q));
          const matchesCat = examCategoryFilter === 'ALL' || catKey === examCategoryFilter;
          return matchesQ && matchesCat;
        });

        return (
          <div className="space-y-5 animate-fade-in">
            {/* Command & Filter Toolbar */}
            <div className="bg-white rounded-[22px] border border-[#DDD7F3] shadow-[0_6px_22px_-8px_rgba(79,70,229,0.1)] p-4 sm:p-5 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={examSearch}
                    onChange={(e) => setExamSearch(e.target.value)}
                    placeholder="Search examination, term, or class (e.g. SA-1, 6th-A)..."
                    className="w-full pl-10 pr-4 py-2.5 bg-[#F8FAFF] border border-indigo-100 rounded-xl text-xs font-bold text-[#1E1B4B] outline-none focus:border-[#5B21B6]"
                  />
                </div>

                {/* Category Chips */}
                <div className="flex flex-wrap items-center gap-1.5 bg-[#F8FAFF] p-1 rounded-xl border border-indigo-100">
                  {[
                    { id: 'ALL', label: `All (${exams.length})` },
                    { id: 'BOARD', label: 'Board / FA-SA' },
                    { id: 'NAVODAYA', label: 'Navodaya' },
                    { id: 'JEE', label: 'JEE Mains' },
                  ].map((chip) => (
                    <button
                      key={chip.id}
                      type="button"
                      onClick={() => setExamCategoryFilter(chip.id as any)}
                      className={`px-3 py-1.5 rounded-lg text-[11px] font-black transition-all cursor-pointer ${
                        examCategoryFilter === chip.id
                          ? 'bg-gradient-to-r from-[#5B21B6] to-[#7C3AED] text-white shadow-xs'
                          : 'text-slate-600 hover:text-[#5B21B6]'
                      }`}
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-2.5">
                <div className="flex items-center bg-[#F8FAFF] p-1 rounded-xl border border-indigo-100">
                  <button
                    type="button"
                    onClick={() => setExamViewMode('grid')}
                    className={`p-1.5 rounded-lg transition-all cursor-pointer ${examViewMode === 'grid' ? 'bg-white text-[#5B21B6] shadow-xs' : 'text-slate-400 hover:text-slate-600'}`}
                    title="Card View"
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setExamViewMode('list')}
                    className={`p-1.5 rounded-lg transition-all cursor-pointer ${examViewMode === 'list' ? 'bg-white text-[#5B21B6] shadow-xs' : 'text-slate-400 hover:text-slate-600'}`}
                    title="Table View"
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>

                {isAdmin && (
                  <button
                    onClick={openCreateModal}
                    className="bg-gradient-to-r from-[#5B21B6] to-[#7C3AED] hover:opacity-95 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 text-xs font-black transition-all shadow-md shadow-indigo-500/20 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" /> Create Exam
                  </button>
                )}
              </div>
            </div>

            {examViewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {filteredExams.map(e => {
                  const isExpanded = expandedExam === e.id;
                  const meta = getExamMeta(e);
                  return (
                    <div
                      key={e.id}
                      className="bg-white rounded-[22px] shadow-[0_6px_22px_-8px_rgba(79,70,229,0.1)] border border-[#DDD7F3] hover:shadow-md hover:border-[#7C3AED]/50 transition-all flex flex-col justify-between relative overflow-hidden group"
                    >
                      {/* Top Color Accent Strip */}
                      <div className={`h-1.5 w-full bg-gradient-to-r ${meta.accentBar}`} />

                      <div className="p-5 flex-1 flex flex-col gap-4">
                        <div className="flex justify-between items-start gap-2">
                          <div className="space-y-1.5 min-w-0">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${meta.badgeCss}`}>
                                {meta.catLabel}
                              </span>
                              {e.term && (
                                <span className="bg-indigo-50 text-indigo-700 border border-indigo-100 text-[10px] font-black uppercase px-2 py-0.5 rounded-full">
                                  {e.term}
                                </span>
                              )}
                            </div>
                            <h3 className="text-[15px] sm:text-base font-black text-[#1E1B4B] leading-snug">{e.name}</h3>
                            <p className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                              {new Date(e.examDate).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                            </p>
                          </div>

                          <div className="text-right shrink-0 bg-[#F8FAFF] border border-indigo-100 rounded-xl px-2.5 py-1.5">
                            <span className="block text-[10px] font-black text-[#5B21B6]">{meta.sortedCls.length} Classes</span>
                            <span className="block text-[10px] font-bold text-slate-400">{meta.subCount || '—'} Subj</span>
                          </div>
                        </div>

                        <div>
                          <div className="text-[10px] font-black uppercase text-slate-400 mb-2 tracking-wider">Target Classes</div>
                          <div className="flex flex-wrap gap-1.5">
                            {meta.sortedCls.slice(0, isExpanded ? undefined : 4).map((c: any) => (
                              <span key={c.id} className="bg-[#F8FAFF] text-[#1E1B4B] px-2.5 py-1 rounded-lg text-[11px] font-black border border-indigo-100/80">
                                {c.name}-{c.section}
                              </span>
                            ))}
                            {meta.sortedCls.length > 4 && (
                              <button
                                type="button"
                                onClick={() => setExpandedExam(isExpanded ? null : e.id)}
                                className="bg-[#F2EDFF] hover:bg-indigo-100 text-[#5B21B6] px-2.5 py-1 rounded-lg text-[11px] font-black border border-[#DDD7F3] cursor-pointer transition-colors"
                              >
                                {isExpanded ? 'Show less' : `+${meta.sortedCls.length - 4} more`}
                              </button>
                            )}
                            {meta.sortedCls.length === 0 && (
                              <span className="text-xs font-bold text-slate-400 italic">No classes assigned</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Always-Accessible Quick Actions Footer */}
                      <div className="px-5 py-3.5 bg-[#F8FAFF]/90 border-t border-indigo-50 flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => { setSelectedWrittenExamId(e.id); selectTab('written-exam'); }}
                            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#5B21B6] to-[#7C3AED] hover:opacity-95 text-white text-[11px] font-black flex items-center gap-1 shadow-xs cursor-pointer"
                          >
                            <Edit3 className="w-3 h-3" /> Marks
                          </button>
                          <button
                            type="button"
                            onClick={() => selectTab('results')}
                            className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-blue-50 text-blue-700 border border-blue-200 text-[11px] font-black flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            <Award className="w-3 h-3" /> Results
                          </button>
                        </div>

                        {isAdmin && (
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => openEditModal(e)}
                              className="p-1.5 rounded-xl bg-white hover:bg-[#F2EDFF] text-[#5B21B6] border border-indigo-100 transition-colors cursor-pointer"
                              title="Edit Configuration"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDuplicateExam(e)}
                              className="p-1.5 rounded-xl bg-white hover:bg-emerald-50 text-emerald-600 border border-emerald-200/70 transition-colors cursor-pointer"
                              title="Duplicate Exam"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={async () => {
                                try {
                                  await api.post(`/api/exams/${e.id}/sync-from-marks`);
                                  toast.success('Subjects synced successfully based on marks!');
                                  fetchExams(true);
                                } catch (err: any) {
                                  toast.error(err.response?.data?.message || 'Sync failed');
                                }
                              }}
                              className="p-1.5 rounded-xl bg-white hover:bg-amber-50 text-amber-600 border border-amber-200/70 transition-colors cursor-pointer"
                              title="Restore Subjects from Marks"
                            >
                              <RefreshCw className="w-3.5 h-3.5" />
                            </button>
                            {user?.role === 'SUPER_ADMIN' && (
                              <button
                                type="button"
                                onClick={() => handleDeleteExam(e.id)}
                                className="p-1.5 rounded-xl bg-white hover:bg-rose-50 text-rose-500 border border-rose-200/70 transition-colors cursor-pointer"
                                title="Delete Exam"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white rounded-[22px] border border-[#DDD7F3] shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="student-grid-table w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="bg-gradient-to-r from-[#7D3CEF] via-[#6D38EA] to-[#5B21B6]">
                        <th className="py-3.5 px-4 font-black !text-white text-xs uppercase tracking-wider w-12">#</th>
                        <th className="py-3.5 px-4 font-black !text-white text-xs uppercase tracking-wider">Examination Name</th>
                        <th className="py-3.5 px-4 font-black !text-white text-xs uppercase tracking-wider">Category</th>
                        <th className="py-3.5 px-4 font-black !text-white text-xs uppercase tracking-wider">Date</th>
                        <th className="py-3.5 px-4 font-black !text-white text-xs uppercase tracking-wider">Classes</th>
                        <th className="py-3.5 px-4 font-black !text-white text-xs uppercase tracking-wider text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-indigo-50">
                      {filteredExams.map((e, idx) => {
                        const meta = getExamMeta(e);
                        return (
                          <tr key={e.id} className="hover:bg-[#F8FAFF] transition-colors">
                            <td className="py-3.5 px-4 font-bold text-slate-400 text-xs">{idx + 1}</td>
                            <td className="py-3.5 px-4">
                              <div className="font-black text-[#1E1B4B]">{e.name}</div>
                              {e.term && <span className="text-[10px] font-bold text-indigo-600">{e.term}</span>}
                            </td>
                            <td className="py-3.5 px-4">
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border ${meta.badgeCss}`}>
                                {meta.catLabel}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-xs font-bold text-slate-600 whitespace-nowrap">
                              {new Date(e.examDate).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="flex flex-wrap gap-1">
                                {meta.sortedCls.slice(0, 3).map((c: any) => (
                                  <span key={c.id} className="px-2 py-0.5 bg-[#F8FAFF] border border-indigo-100 rounded text-[10px] font-black text-[#1E1B4B]">
                                    {c.name}-{c.section}
                                  </span>
                                ))}
                                {meta.sortedCls.length > 3 && (
                                  <span className="px-2 py-0.5 bg-[#F2EDFF] text-[#5B21B6] rounded text-[10px] font-black">+{meta.sortedCls.length - 3}</span>
                                )}
                              </div>
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <div className="inline-flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => { setSelectedWrittenExamId(e.id); selectTab('written-exam'); }}
                                  className="px-2.5 py-1 rounded-lg bg-[#5B21B6] text-white text-[11px] font-black cursor-pointer"
                                >
                                  Marks
                                </button>
                                {isAdmin && (
                                  <>
                                    <button type="button" onClick={() => openEditModal(e)} className="p-1.5 rounded-lg bg-indigo-50 text-[#5B21B6] hover:bg-indigo-100 cursor-pointer" title="Edit">
                                      <Edit3 className="w-3.5 h-3.5" />
                                    </button>
                                    <button type="button" onClick={() => handleDuplicateExam(e)} className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 cursor-pointer" title="Duplicate">
                                      <Copy className="w-3.5 h-3.5" />
                                    </button>
                                    {user?.role === 'SUPER_ADMIN' && (
                                      <button type="button" onClick={() => handleDeleteExam(e.id)} className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 cursor-pointer" title="Delete">
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {filteredExams.length === 0 && (
              <div className="py-16 flex flex-col items-center justify-center bg-white rounded-[24px] border-2 border-dashed border-[#DDD7F3]">
                <Layers className="w-12 h-12 text-indigo-200 mb-3" />
                <h3 className="text-lg font-black text-[#1E1B4B]">No Examinations Found</h3>
                <p className="text-xs font-semibold text-slate-500 mt-1">Adjust your search filters or click "Create Exam" to schedule a new examination.</p>
              </div>
            )}
          </div>
        );
      })()}

      {/* ══ TAB 8: SETTINGS ══ */}
      {activeTab === 'settings' && (
        <ExamSettingsTab />
      )}

      {/* SMS Modal */}
      {showSmsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/45 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-[26px] w-full max-w-2xl overflow-hidden shadow-2xl border border-[#DDD7F3]">
            <div className="p-5 sm:p-6 bg-gradient-to-r from-[#EC4899] via-[#DB2777] to-[#BE185D] text-white flex justify-between items-center">
              <h2 className="text-lg sm:text-xl font-black flex items-center gap-2.5"><MessageSquare className="w-5 h-5" /> Send Marks via SMS</h2>
              <button onClick={() => setShowSmsModal(false)} className="p-2 bg-white/15 hover:bg-white/25 rounded-xl transition-colors cursor-pointer"><X className="w-5 h-5" /></button>
            </div>

            <div className="p-6 space-y-5 bg-[#F8FAFF]">
              <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200">
                <p className="text-xs sm:text-sm font-bold text-amber-900">
                  This will send SMS to parents in the selected class using the approved DLT template. Ensure Marks are entered and verified.
                </p>
              </div>

              <div>
                <label className="text-xs font-black text-slate-600 uppercase tracking-wider mb-2 block">Select Exam</label>
                <select value={smsExamId} onChange={e => setSmsExamId(e.target.value)} className="input-field">
                  <option value="" className="text-xs font-medium">Select Exam...</option>
                  {exams.map(ex => <option key={ex.id} value={ex.id} className="text-xs font-medium">{formatExamOptionLabel(ex.name)}</option>)}
                </select>
              </div>

              {smsExamId && (
                <div>
                  <label className="text-xs font-black text-slate-600 uppercase tracking-wider mb-2 block">Select Class</label>
                  <select value={smsClassId} onChange={e => {
                    setSmsClassId(e.target.value);
                    setSmsStudentId('');
                  }} className="input-field">
                    <option value="">Select Class...</option>
                    {sortClasses(exams.find(e => e.id === smsExamId)?.classes || []).map((c: any) => (
                      <option key={c.id} value={c.id}>{c.name}-{c.section}</option>
                    ))}
                  </select>
                </div>
              )}

              {smsClassId && (
                <div>
                  <label className="text-xs font-black text-slate-600 uppercase tracking-wider mb-2 block">Send To</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer bg-white px-4 py-2.5 rounded-xl border border-indigo-100">
                      <input type="radio" name="smsSendType" value="all" checked={smsSendType === 'all'} onChange={() => setSmsSendType('all')} className="w-4 h-4 text-pink-600" />
                      <span className="text-xs font-black text-[#1E1B4B]">Entire Class</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer bg-white px-4 py-2.5 rounded-xl border border-indigo-100">
                      <input type="radio" name="smsSendType" value="individual" checked={smsSendType === 'individual'} onChange={() => setSmsSendType('individual')} className="w-4 h-4 text-pink-600" />
                      <span className="text-xs font-black text-[#1E1B4B]">Individual Student</span>
                    </label>
                  </div>
                </div>
              )}

              {smsClassId && smsSendType === 'individual' && (
                <div>
                  <label className="text-xs font-black text-slate-600 uppercase tracking-wider mb-2 block">Select Student</label>
                  <select value={smsStudentId} onChange={e => setSmsStudentId(e.target.value)} className="input-field">
                    <option value="">Select Student...</option>
                    {classStudents.map(s => (
                      <option key={s.id} value={s.id}>{s.user?.name || s.name} ({s.rollNo || ''})</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="p-5 border-t border-indigo-50 bg-white flex justify-end gap-3">
              <button onClick={() => setShowSmsModal(false)} className="px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer">Cancel</button>
              <button onClick={handleSendMarksSMS} disabled={isSendingSms || !smsExamId || !smsClassId} className="px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider bg-gradient-to-r from-[#EC4899] to-[#DB2777] text-white hover:opacity-95 shadow-md shadow-pink-500/20 transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer">
                {isSendingSms ? 'Sending...' : 'Send SMS'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Teacher Permissions Modal */}
      {showPermissionsModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/45 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-fade-in">
          <div className="bg-white rounded-[26px] border border-[#DDD7F3] shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="bg-gradient-to-r from-[#5B21B6] via-[#6D38EA] to-[#7C3AED] px-6 py-4 flex justify-between items-center text-white shrink-0">
              <div>
                <h3 className="text-lg font-black uppercase tracking-wider">Teacher Upload Permissions</h3>
                <p className="text-xs text-indigo-100 font-semibold mt-0.5">Authorize faculty members to upload draft question papers</p>
              </div>
              <button onClick={() => setShowPermissionsModal(false)} className="p-2 bg-white/15 hover:bg-white/25 text-white rounded-xl transition-all cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 sm:p-6 bg-[#F8FAFF] custom-scrollbar">
              <div className="bg-white rounded-2xl border border-[#DDD7F3] overflow-hidden shadow-xs">
                <div className="p-4 bg-[#F2EDFF]/50 border-b border-indigo-100 flex items-center justify-between">
                  <span className="text-xs font-black text-[#5B21B6] uppercase tracking-wider">Staff Members</span>
                  <span className="text-xs font-black text-[#5B21B6] bg-white px-3 py-1 rounded-full border border-[#DDD7F3]">Total: {teachers.length}</span>
                </div>
                <div className="divide-y divide-indigo-50">
                  {teachers.map((teacher: any) => (
                    <div key={teacher.id} className="p-4 flex justify-between items-center hover:bg-[#F8FAFF] transition-colors">
                      <div className="flex items-center gap-3.5">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#F2EDFF] to-[#DDD2FF] flex items-center justify-center text-[#5B21B6] font-black text-sm border border-[#DDD7F3]">
                          {(teacher.user?.name || 'U').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-black text-[#1E1B4B]">{teacher.user?.name || 'Unknown'}</p>
                          <p className="text-xs font-semibold text-slate-400 mt-0.5">{teacher.employeeId || 'No ID'} · {teacher.specialization || 'General'}</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={teacher.canUploadQuestionPapers || false}
                          onChange={(e) => handleToggleTeacherPermission(teacher.id, e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-12 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#5B21B6]"></div>
                      </label>
                    </div>
                  ))}
                  {teachers.length === 0 && (
                    <div className="p-10 text-center flex flex-col items-center">
                      <ShieldAlert className="w-10 h-10 text-indigo-200 mb-3" />
                      <h4 className="text-base font-black text-[#1E1B4B]">No Teachers Found</h4>
                      <p className="text-xs font-semibold text-slate-500 mt-1">There are no teachers registered in the system yet.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-white border-t border-indigo-50 flex justify-end shrink-0">
              <button onClick={() => setShowPermissionsModal(false)} className="px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider bg-gradient-to-r from-[#5B21B6] to-[#7C3AED] text-white shadow-md cursor-pointer">
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      </div>
    </div>
  );
};

export default ExamListPage;

