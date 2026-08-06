import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import { LoadingSpinner } from '../../components/UI/LoadingSpinner';
import { PageHeader } from '../../components/UI/PageHeader';
import { Badge } from '../../components/UI/Badge';
import { useAuth } from '../../hooks/useAuth';
import {
  Plus, Edit3, Trash2, ClipboardList, BookOpen, Layers, CheckSquare,
  Clock, Award, FileText, Settings, Play, ShieldAlert, HelpCircle, Save, X, Calendar, ExternalLink,
  MapPin, FileSpreadsheet, Download, Printer, CheckCircle, MessageSquare
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Link, useSearchParams, useOutletContext, useNavigate } from 'react-router-dom';
import { SlipTestsTab } from './SlipTestsTab';
import { AdmitCardTab } from './AdmitCardTab';
import { ProgressCardTab } from './ProgressCardTab';
import { ResultsTab } from './ResultsTab';
import { JEEProgressCardTab } from './JEEProgressCardTab';
import { ExamStatusTab } from './ExamStatusTab';

const ExamCard: React.FC<{
  label: string;
  icon: React.ElementType;
  gradient: string;
  glow: string;
  onClick: () => void;
  sub?: string;
}> = ({ label, icon: Icon, gradient, glow, onClick, sub }) => {
  const match = gradient.match(/#([0-9a-fA-F]{6})/);
  const primaryColor = match ? match[0] : '#6366f1';
  
  return (
    <div onClick={onClick} className="group relative overflow-hidden rounded-[1.5rem] p-5 sm:p-6 transition-all duration-300 hover:-translate-y-1.5 cursor-pointer shadow-md hover:shadow-2xl border border-white/10"
         style={{ background: gradient, boxShadow: `0 10px 25px -5px ${primaryColor}70` }}>
      
      {/* Background Watermark Icon */}
      <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:opacity-20 transition-all duration-500 transform group-hover:scale-110 group-hover:-rotate-12 pointer-events-none text-white">
        <Icon className="w-28 h-28 sm:w-32 sm:h-32" />
      </div>
        
      {/* Top right gradient orb */}
      <div className="absolute -top-10 -right-10 w-24 h-24 bg-white/20 blur-2xl rounded-full group-hover:bg-white/30 transition-all" />

      <div className="relative z-10 flex flex-col h-full justify-between gap-5 sm:gap-6">
        <div className="flex items-start justify-between">
          <div className="p-3 sm:p-3.5 rounded-2xl bg-white/20 backdrop-blur-md shadow-sm transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3 border border-white/20">
            <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
          <div className="p-2 sm:p-2.5 rounded-full bg-white/10 group-hover:bg-white/20 backdrop-blur-sm transition-all transform group-hover:translate-x-1 border border-white/10">
            <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
        <div>
          <h3 className="text-base sm:text-lg font-extrabold text-white tracking-wide mb-1 sm:mb-1.5 leading-tight">{label}</h3>
          {sub && <p className="text-xs sm:text-sm text-white/80 font-bold flex items-center gap-1.5"><span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-white/60"/>{sub}</p>}
        </div>
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
    if (tabParam) {
      setActiveTab(tabParam as any);
    }
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
          'jee-progress-card': 'JEE Progress Cards',
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

  // Written Exam State
  const [selectedWrittenExamId, setSelectedWrittenExamId] = useState('');

  // Excel Upload States
  const [showExcelModal, setShowExcelModal] = useState(false);
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [excelExamId, setExcelExamId] = useState('');
  const [expandedExam, setExpandedExam] = useState<string | null>(null);

  const fetchExams = async () => {
    try {
      const res: any = await api.get('/api/exams?limit=500');
      const list = res.data || res || [];
      setExams(list);
      if (list.length > 0 && !selectedExamId) {
        setSelectedExamId(list[0].id);
      }
    } catch (e) {
      toast.error('Failed to load exams');
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
    const ws = XLSX.utils.json_to_sheet([
      { "Student ID": "STU123", "Subject": "MATH101", "Marks": 85 },
      { "Student ID": "STU124", "Subject": "MATH101", "Marks": 90 }
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
    try {
      const reader = new FileReader();
      reader.onload = async (evt) => {
        const data = evt.target?.result;
        const XLSX = await import('xlsx');
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const sheet = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
        
        // Map excel columns to backend payload
        const mappedMarks = sheet.map((row: any) => ({
          studentId: row['Student ID'] || row['studentId'] || row['Student Id'],
          subjectId: row['Subject'] || row['Subject Code'] || row['subjectId'] || row['Subject Id'],
          marksObtained: Number(row['Marks'] || row['Marks Obtained'] || row['marksObtained']),
          remarks: row['Remarks'] || row['remarks'] || ''
        }));

        await api.post('/api/marks/bulk', {
          examId: excelExamId,
          marks: mappedMarks
        });
        toast.success('Excel marks uploaded successfully!');
        setShowExcelModal(false);
        setExcelFile(null);
      };
      reader.readAsBinaryString(excelFile);
    } catch (err) {
      toast.error('Error uploading excel file');
    }
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
      api.get('/api/students', { params: { classId: smsClassId } })
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
      await api.post(`/api/exams/${smsExamId}/classes/${smsClassId}/send-sms`, payload);
      toast.success('SMS sent successfully!');
      setShowSmsModal(false);
      setSmsSendType('all');
      setSmsStudentId('');
    } catch (e: any) {
      toast.error(e.response?.data?.message || e.message || 'Failed to send SMS');
    } finally {
      setIsSendingSms(false);
    }
  };

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
      toast.error('Failed to load question groups');
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
      toast.error('Failed to load questions');
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
      fetchQuestions();
    } catch (err: any) {
      toast.error(err.message || 'Error adding question');
    }
  };

  const handleDeleteQuestion = async (id: string) => {
    if (!confirm('Delete question?')) return;
    try {
      await api.delete(`/api/exams-extended/questions/${id}`);
      toast.success('Question deleted');
      fetchQuestions();
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
      toast.error('Failed to load online exams');
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
      const classRes: any = await api.get('/api/classes?limit=500');
      const classList = classRes.data || classRes || [];
      setClasses(classList);

      if (classList.length > 0) {
        setOnlineClassId(classList[0].id);
        setSelectedClassId(classList[0].id);
      }

      if (isAdmin) {
        try {
          const teachRes: any = await api.get('/api/teachers?limit=500');
          const teacherList = teachRes.data?.data || teachRes.data || [];
          setTeachers(teacherList);
        } catch (e) {
          console.warn('Could not fetch teachers', e);
        }
      }
    } catch {
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
  const [qpSubjectId, setQpSubjectId] = useState('');
  const [qpFileUrl, setQpFileUrl] = useState('');

  const fetchQuestionPapers = async () => {
    try {
      const res: any = await api.get('/api/question-papers');
      // axios interceptor returns response.data directly, so res is already the array
      setQuestionPapers(Array.isArray(res) ? res : (res?.data || []));
    } catch {
      // Silently fail - question papers are optional, don't block the page with a toast
      setQuestionPapers([]);
    }
  };

  const handleCreateQp = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/api/question-papers', {
        title: qpTitle,
        classId: qpClassId,
        subjectId: qpSubjectId,
        fileUrl: qpFileUrl
      });
      toast.success('Question paper uploaded successfully');
      setShowQpModal(false);
      setQpTitle('');
      setQpFileUrl('');
      fetchQuestionPapers();
    } catch {
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

  useEffect(() => {
    fetchBaseFilters();
    fetchExams();
    fetchQuestionGroups();
    fetchOnlineExams();
    fetchQuestionPapers();
  }, []);

  // Fetch plans when selected exam changes
  useEffect(() => {
    if (selectedExamId) {
      fetchExamPlans();
    }
  }, [selectedExamId]);

  // Fetch questions when group changes
  useEffect(() => {
    fetchQuestions();
  }, [selectedGroupId]);

  // Load subjects for exam plan form
  useEffect(() => {
    const activeExam = exams.find(e => e.id === selectedExamId);
    if (activeExam?.classId) {
      api.get(`/api/classes/${activeExam.classId}/subjects`)
        .then((res: any) => {
          setSubjects(res.data || []);
          if (res.data?.length > 0) {
            setPlanSubjectId(res.data[0].id);
          }
        })
        .catch(() => {});
    }
  }, [selectedExamId, exams]);

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
    <div className="space-y-4 sm:space-y-6 md:space-y-8 p-4 sm:p-6 md:p-8 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 min-h-screen overflow-x-hidden">
      
      {/* BEAUTIFUL PAGE HEADING BANNER */}
      <PageHeader 
        title="Examination Dashboard"
        icon={<ClipboardList className="w-6 h-6" />}
        action={
          activeTab ? (
            <button
              onClick={() => setActiveTab('')}
              className="btn-secondary w-full sm:w-auto"
            >
              ← Back to Examination Home
            </button>
          ) : undefined
        }
      />
      <div className="space-y-6 md:space-y-8">
        {!activeTab && (
          <div className="pt-2 sm:pt-4 space-y-8">
            {/* Unified Tools Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 mt-6">
              {isAdmin && <ExamCard label="Examinations List" sub="Manage exams" icon={ClipboardList} gradient="linear-gradient(135deg, #6366f1, #4f46e5)" glow="rgba(99,102,241,0.4)" onClick={() => setActiveTab('examination')} />}
              {isAdminOrTeacher && (
                <>
                  <ExamCard label="Admit Card" sub="Hall tickets" icon={FileText} gradient="linear-gradient(135deg, #f59e0b, #ea580c)" glow="rgba(245,158,11,0.4)" onClick={() => setActiveTab('admit-card')} />
                  <ExamCard label="Question Papers" sub="Manage papers" icon={Layers} gradient="linear-gradient(135deg, #475569, #334155)" glow="rgba(71,85,105,0.4)" onClick={() => setActiveTab('question-bank')} />
                  <ExamCard label="Marks Upload" sub="Upload marks" icon={Edit3} gradient="linear-gradient(135deg, #10b981, #059669)" glow="rgba(16,185,129,0.4)" onClick={() => setActiveTab('written-exam')} />
                  <ExamCard label="Results" sub="Grade sheets" icon={Award} gradient="linear-gradient(135deg, #0ea5e9, #0284c7)" glow="rgba(14,165,233,0.4)" onClick={() => setActiveTab('results')} />
                  <ExamCard label="Progress Card" sub="Detailed progress" icon={FileSpreadsheet} gradient="linear-gradient(135deg, #f43f5e, #e11d48)" glow="rgba(244,63,94,0.4)" onClick={() => setActiveTab('jee-progress-card')} />
                </>
              )}
              {isAdmin && (
                <>
                  <ExamCard label="Slip Test Rank Card" sub="Manual ranks" icon={Award} gradient="linear-gradient(135deg, #06b6d4, #0891b2)" glow="rgba(6,182,212,0.4)" onClick={() => navigate('/office-tools/slip-test')} />
                  <ExamCard label="Send Marks SMS" sub="SMS parents" icon={MessageSquare} gradient="linear-gradient(135deg, #ec4899, #db2777)" glow="rgba(236,72,153,0.4)" onClick={() => setShowSmsModal(true)} />
                  <ExamCard label="Status Overview" sub="Track progress" icon={ShieldAlert} gradient="linear-gradient(135deg, #8b5cf6, #7c3aed)" glow="rgba(139,92,246,0.4)" onClick={() => setActiveTab('status-overview')} />
                  <ExamCard label="Settings" sub="Configurations" icon={Settings} gradient="linear-gradient(135deg, #3f3f46, #27272a)" glow="rgba(63,63,70,0.4)" onClick={() => setActiveTab('settings')} />
                </>
              )}
            </div>

          </div>
        )}


      {/* ══ TAB 2: EXAM PLAN ══ */}
      {activeTab === 'exam-plan' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-150 dark:border-gray-800">
            <div className="flex items-center gap-3">
              <span className="text-xs font-extrabold uppercase text-gray-400">Exam Batch:</span>
              <select value={selectedExamId} onChange={e => setSelectedExamId(e.target.value)} className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm font-bold">
                {exams.map(e => <option key={e.id} value={e.id}>{e.name} ({e.class?.name})</option>)}
              </select>
            </div>
            {isAdmin && selectedExamId && (
              <button onClick={() => setShowPlanModal(true)} className="btn-primary flex items-center gap-2 text-xs font-bold">
                <Plus className="w-4 h-4" /> Schedule Paper
              </button>
            )}
          </div>

          <div className="card p-6 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-800">
                    <th className="pb-3.5 font-extrabold text-gray-400 text-xs uppercase tracking-wider">Subject</th>
                    <th className="pb-3.5 font-extrabold text-gray-400 text-xs uppercase tracking-wider">Exam Date</th>
                    <th className="pb-3.5 font-extrabold text-gray-400 text-xs uppercase tracking-wider">Timing</th>
                    <th className="pb-3.5 font-extrabold text-gray-400 text-xs uppercase tracking-wider">Room</th>
                    <th className="pb-3.5 font-extrabold text-gray-400 text-xs uppercase tracking-wider">Marks Info</th>
                    {isAdmin && <th className="pb-3.5 text-right font-extrabold text-gray-400 text-xs uppercase tracking-wider">Action</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-150 dark:divide-gray-800">
                  {examPlans.map((plan) => (
                    <tr key={plan.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/10">
                      <td className="py-4">
                        <div className="font-bold text-gray-900 dark:text-white">{plan.subject?.name}</div>
                        <span className="text-[10px] text-gray-400 font-bold">{plan.subject?.code}</span>
                      </td>
                      <td className="py-4 text-xs font-semibold text-gray-700 dark:text-gray-200">{new Date(plan.examDate).toLocaleDateString()}</td>
                      <td className="py-4 text-xs text-gray-500 font-bold">{plan.startTime} – {plan.endTime}</td>
                      <td className="py-4 text-xs text-gray-500 font-bold">{plan.room || 'N/A'}</td>
                      <td className="py-4 text-xs font-semibold text-gray-500">Max: {plan.maxMarks} · Pass: {plan.passingMarks}</td>
                      {isAdmin && (
                        <td className="py-4 text-right">
                          <button onClick={() => handleDeletePlan(plan.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 cursor-pointer">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                  {examPlans.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-gray-400">
                        No subject papers scheduled in plan yet for this exam batch.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {showPlanModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-4">
              <div className="card w-full max-w-md p-6 space-y-5">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-bold">Schedule Exam Paper</h3>
                  <button onClick={() => setShowPlanModal(false)} className="text-gray-400 hover:text-black dark:hover:text-white"><X className="w-5 h-5" /></button>
                </div>
                <form onSubmit={handleCreatePlan} className="space-y-4">
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
                    <button type="submit" className="btn-primary text-sm">Save Paper</button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══ TAB 3: MARKS UPLOAD (written-exam) ══ */}
      {activeTab === 'written-exam' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-white/40 dark:bg-white/10 backdrop-blur-xl p-5 rounded-3xl shadow-xl border border-white/50 dark:border-white/20">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
                <span className="text-xl">📝</span>
              </div>
              <div>
                <h2 className="text-lg font-black uppercase text-slate-900 tracking-wider drop-shadow-sm">Marks Upload & Entry</h2>
                <p className="text-xs font-bold text-slate-600">Select an examination and class to enter student marks</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white/40 dark:bg-white/10 backdrop-blur-xl p-6 rounded-3xl shadow-xl border border-white/50 dark:border-white/20 flex flex-col gap-3">
             <label className="text-sm font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">Select Examination</label>
             <select 
               className="input py-3 w-full max-w-md font-bold text-slate-800"
               value={selectedWrittenExamId}
               onChange={(e) => setSelectedWrittenExamId(e.target.value)}
             >
               <option value="">-- Select Examination --</option>
               {exams.map(e => (
                 <option key={e.id} value={e.id}>{e.name}</option>
               ))}
             </select>
          </div>

          {selectedWrittenExamId && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {exams.filter(e => e.id === selectedWrittenExamId).map(exam => (
                <div key={exam.id} className="relative rounded-[2rem] p-6 overflow-hidden bg-white/40 dark:bg-white/10 backdrop-blur-2xl shadow-xl border-2 border-white/50 dark:border-white/20 hover:border-indigo-400 dark:hover:border-indigo-400 transition-all duration-300 flex flex-col group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-400/20 to-purple-400/20 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />
                  
                  <div className="relative z-10">
                    <h4 className="font-extrabold text-slate-900 text-xl drop-shadow-sm truncate whitespace-nowrap overflow-hidden" title={exam.name}>{exam.name}</h4>
                    <p className="text-xs font-bold text-slate-600 mt-1.5">Select a class to enter marks:</p>
                  </div>
                  
                  <div className="flex flex-col gap-3 flex-1 mt-5 relative z-10">
                    {(exam.classes || []).map((c: any) => (
                      <div key={c.id} className="flex gap-2 items-center bg-white/50 dark:bg-black/10 p-2 rounded-2xl border border-white/40 dark:border-white/10 hover:bg-white/80 dark:hover:bg-black/20 transition-colors shadow-sm">
                        <div className="flex-1 text-sm font-black text-slate-800 px-3 truncate">
                          {c.name}-{c.section}
                        </div>
                        <Link to={`/exams/${exam.id}/entry?classId=${c.id}`} className="px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold rounded-xl text-xs shadow-lg shadow-indigo-500/30 transition-all transform hover:-translate-y-0.5 text-center shrink-0">
                          Enter Marks
                        </Link>
                      </div>
                    ))}
                    {(!exam.classes || exam.classes.length === 0) && (
                      <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-center">
                        <p className="text-xs text-amber-700 font-bold">No classes assigned to this exam</p>
                      </div>
                    )}
                  </div>

                  {isAdmin && (
                    <div className="pt-4 mt-4 border-t border-white/20 dark:border-white/10 relative z-10">
                      <button onClick={() => { setExcelExamId(exam.id); setShowExcelModal(true); }} className="w-full px-4 py-3 bg-gradient-to-r from-emerald-400 to-green-500 hover:from-emerald-500 hover:to-green-600 text-white font-bold rounded-xl text-xs shadow-lg shadow-emerald-500/30 transition-all transform hover:-translate-y-0.5">
                        Excel Bulk Upload
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {showExcelModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-4">
              <div className="card w-full max-w-md p-6 space-y-5">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-bold">Upload Marks Excel</h3>
                  <button onClick={() => setShowExcelModal(false)} className="text-gray-400 hover:text-black dark:hover:text-white"><X className="w-5 h-5" /></button>
                </div>
                
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold mb-2">Instructions:</p>
                  <ul className="text-xs text-blue-600/80 dark:text-blue-400/80 list-disc pl-4 space-y-1">
                    <li>Download the sample Excel file.</li>
                    <li>Fill in the 'Student ID', 'Subject', 'Marks' columns.</li>
                    <li>Upload the filled file back here.</li>
                  </ul>
                  <button onClick={downloadSampleExcel} className="mt-3 text-xs font-bold bg-white dark:bg-gray-800 px-3 py-1.5 rounded-md shadow-sm border border-blue-100 dark:border-blue-800 text-blue-600 hover:bg-blue-50 w-full text-center">
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
                    <button type="submit" className="btn-primary text-sm bg-green-500 hover:bg-green-600">Upload Data</button>
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
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-150 dark:border-gray-800">
            <span className="text-xs font-extrabold uppercase text-gray-400">Manage Question Categories & Chapters</span>
            <button onClick={() => setShowGroupModal(true)} className="btn-primary flex items-center gap-2 text-xs font-bold">
              <Plus className="w-4 h-4" /> Add Question Group
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {questionGroups.map(group => (
              <div key={group.id} className="card p-6 space-y-4 hover:shadow-md transition-shadow relative group border-l-4 border-indigo-500">
                <div>
                  <h4 className="font-bold text-base text-gray-900 dark:text-white">{group.name}</h4>
                  <p className="text-xs text-gray-400 mt-1">{group.description || 'No description provided'}</p>
                </div>
                <div className="flex items-center justify-between text-xs font-semibold text-gray-500 border-t border-gray-100 dark:border-gray-800 pt-3">
                  <span>Questions in group: {group._count?.questions || 0}</span>
                  <button onClick={() => handleDeleteGroup(group.id)} className="p-1 text-gray-400 hover:text-red-500 rounded cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {showGroupModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-4">
              <div className="card w-full max-w-md p-6 space-y-5">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-bold">New Question Group</h3>
                  <button onClick={() => setShowGroupModal(false)} className="text-gray-400 hover:text-black dark:hover:text-white"><X className="w-5 h-5" /></button>
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
                    <button type="submit" className="btn-primary text-sm">Create Group</button>
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
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white/60 dark:bg-slate-900/50 backdrop-blur-md p-6 rounded-3xl border border-white/20 shadow-[0_8px_30px_rgb(0,0,0,0.04)] animate-fade-in-up">
            <div className="flex items-center gap-4 w-full sm:w-auto">
              <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-3.5 rounded-2xl shadow-lg shadow-purple-500/30 text-white shrink-0 hidden sm:block">
                <Layers className="w-6 h-6" />
              </div>
              <div className="flex flex-col sm:flex-row w-full gap-3 items-center">
                <span className="text-xs font-black uppercase text-indigo-500 tracking-wider shrink-0 w-full sm:w-auto">Select Group:</span>
                <select 
                  value={selectedGroupId} 
                  onChange={e => setSelectedGroupId(e.target.value)} 
                  className="appearance-none bg-white dark:bg-slate-800 border-2 border-indigo-100 dark:border-indigo-900/30 rounded-xl px-4 py-3 text-sm font-extrabold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all shadow-sm cursor-pointer w-full sm:min-w-[220px]"
                >
                  <option value="">-- Select Question Group --</option>
                  {questionGroups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
              </div>
            </div>
            
            {selectedGroupId && (
              <button 
                onClick={() => setShowQuestionModal(true)} 
                className="w-full sm:w-auto bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-md shadow-indigo-500/20 hover:-translate-y-0.5 px-5 py-3 rounded-xl text-xs uppercase tracking-widest font-black transition-all duration-300 flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" /> Create Question
              </button>
            )}
          </div>

          <div className="space-y-4">
            {questions.map((q, index) => {
              const opts = q.options ? JSON.parse(q.options) : [];
              return (
                <div key={q.id} className="bg-white/60 dark:bg-slate-900/40 backdrop-blur-md p-6 rounded-3xl border border-white/20 shadow-lg relative group transition-all duration-300 hover:shadow-xl hover:bg-white/80 dark:hover:bg-slate-900/60 flex flex-col gap-4 overflow-hidden">
                  <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-indigo-500 to-purple-500 rounded-l-3xl"></div>
                  <div className="flex justify-between items-start gap-4 pl-4">
                    <div>
                      <h4 className="font-extrabold text-base text-slate-900 dark:text-white leading-relaxed">
                        <span className="text-indigo-500 mr-2">Q{index + 1}.</span> 
                        {q.questionText}
                      </h4>
                      <div className="flex items-center gap-3 mt-3">
                        <span className="text-[10px] font-black uppercase tracking-widest bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 px-3 py-1 rounded-lg border border-indigo-200 dark:border-indigo-800/50">
                          {q.questionType}
                        </span>
                        <span className="text-[10px] font-black uppercase tracking-widest bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-3 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800/50">
                          {q.marks} Marks
                        </span>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleDeleteQuestion(q.id)} 
                      className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-400 hover:text-red-500 hover:bg-red-50 hover:border-red-100 dark:hover:bg-red-900/20 dark:hover:border-red-900/30 opacity-0 group-hover:opacity-100 transition-all duration-300 cursor-pointer shadow-sm"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>

                  {q.questionType === 'MCQ' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-4 pt-2">
                      {opts.map((opt: string, optIdx: number) => {
                        const correct = q.correctAnswer === String(optIdx);
                        return (
                          <div key={optIdx} className={`p-4 rounded-xl border-2 font-bold text-sm transition-all flex items-center gap-3 ${correct ? 'bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border-emerald-400 text-emerald-800 dark:text-emerald-300 shadow-sm' : 'bg-white/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-indigo-300 dark:hover:border-indigo-700/50'}`}>
                            <span className={`flex items-center justify-center w-6 h-6 rounded-full text-xs ${correct ? 'bg-emerald-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'}`}>
                              {String.fromCharCode(65 + optIdx)}
                            </span>
                            {opt} 
                            {correct && <CheckCircle className="w-4 h-4 ml-auto text-emerald-500" />}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {q.questionType === 'SUBJECTIVE' && (
                    <div className="text-sm bg-indigo-50/50 dark:bg-indigo-900/10 p-5 rounded-xl border border-indigo-100 dark:border-indigo-900/30 pl-4 ml-4">
                      <span className="text-xs font-black text-indigo-500 block uppercase tracking-widest mb-2 flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" /> Expected Key Phrases/Answers:
                      </span>
                      <p className="font-bold text-slate-700 dark:text-slate-300 leading-relaxed">{q.correctAnswer}</p>
                    </div>
                  )}
                </div>
              );
            })}
            {questions.length === 0 && (
              <div className="bg-white/60 dark:bg-slate-900/40 backdrop-blur-md rounded-3xl p-16 flex flex-col items-center justify-center text-center shadow-sm border border-slate-200/60 dark:border-slate-800">
                <Layers className="w-16 h-16 text-slate-300 mb-4" />
                <h3 className="text-xl font-black text-slate-700 dark:text-slate-200">No Questions Found</h3>
                <p className="text-sm font-semibold text-slate-500 mt-2 max-w-md">No questions defined inside this group. Add question elements to populate the exam staged database bank.</p>
              </div>
            )}
          </div>

          {showQuestionModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-4">
              <div className="card w-full max-w-lg p-6 space-y-5 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-bold">Add Question to Bank</h3>
                  <button onClick={() => setShowQuestionModal(false)} className="text-gray-400 hover:text-black dark:hover:text-white"><X className="w-5 h-5" /></button>
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
                      <span className="text-xs font-bold text-gray-500">Provide 4 Answer Options:</span>
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
                    <button type="submit" className="btn-primary text-sm">Save Question</button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══ TAB 5: ADD ONLINE EXAM ══ */}
      {activeTab === 'add-online-exam' && isAdminOrTeacher && (
        <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-150 dark:border-gray-800 space-y-6">
          <div>
            <h3 className="text-lg font-bold">Configure Advanced Online Exam</h3>
            <p className="text-xs text-gray-400 mt-1">Configure timed, automated grading online tests from the bank.</p>
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

            {/* Select questions */}
            <div className="space-y-3 pt-3 border-t border-gray-150 dark:border-gray-800">
              <span className="text-xs font-bold text-gray-500">Pick Staged Questions to Include in Exam:</span>
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-400">Filter Question Group:</span>
                <select value={selectedGroupId} onChange={e => setSelectedGroupId(e.target.value)} className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 text-xs font-bold">
                  {questionGroups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
              </div>

              <div className="max-h-60 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-xl divide-y divide-gray-100 dark:divide-gray-800">
                {questions.map(q => {
                  const checked = selectedQIds.includes(q.id);
                  return (
                    <label key={q.id} className="flex items-start gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800/40 cursor-pointer select-none">
                      <input type="checkbox" checked={checked} onChange={() => {
                        if (checked) {
                          setSelectedQIds(selectedQIds.filter(id => id !== q.id));
                        } else {
                          setSelectedQIds([...selectedQIds, q.id]);
                        }
                      }} className="mt-1" />
                      <div className="text-xs">
                        <p className="font-bold text-gray-800 dark:text-gray-200">{q.questionText}</p>
                        <span className="text-[10px] text-gray-400 font-semibold">{q.questionType} · Marks: {q.marks}</span>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3">
              <button type="submit" className="btn-primary flex items-center gap-2">
                <Save className="w-4 h-4" /> Publish Online Exam
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ══ TAB 8: QUESTION PAPERS (UPLOAD/DOWNLOAD) ══ */}
      {activeTab === 'question-papers' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-150 dark:border-gray-800">
            <span className="text-xs font-extrabold uppercase text-gray-400">Manage Question Papers</span>
            {(isAdmin || isTeacher) && (
              <button onClick={() => setShowQpModal(true)} className="btn-primary flex items-center gap-2 text-xs font-bold">
                <Plus className="w-4 h-4" /> Upload Paper
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {questionPapers.map(qp => (
              <div key={qp.id} className="card p-6 space-y-4 hover:shadow-md relative group border-t-4 border-emerald-500">
                <div>
                  <h4 className="font-bold text-base text-gray-900 dark:text-white">{qp.title}</h4>
                  <p className="text-[11px] text-gray-400 mt-1">Class: {qp.class?.name}-{qp.class?.section} | Subject: {qp.subject?.name}</p>
                </div>
                
                <div className="flex gap-2 pt-2">
                  <a href={qp.fileUrl} target="_blank" rel="noreferrer" className="btn-primary flex-1 text-center text-xs flex items-center justify-center gap-2">
                    <ExternalLink className="w-4 h-4" /> View/Download
                  </a>
                  {(isAdmin || isTeacher) && (
                    <button onClick={() => handleDeleteQp(qp.id)} className="p-2 border border-red-200 dark:border-red-900/40 text-red-500 hover:bg-red-50 rounded-xl cursor-pointer">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
            {questionPapers.length === 0 && (
              <div className="col-span-full py-12 text-center text-gray-400">
                No question papers uploaded yet.
              </div>
            )}
          </div>

          {showQpModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-4">
              <div className="card w-full max-w-md p-6 space-y-5">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-bold">Upload Question Paper</h3>
                  <button onClick={() => setShowQpModal(false)} className="text-gray-400 hover:text-black dark:hover:text-white"><X className="w-5 h-5" /></button>
                </div>
                <form onSubmit={handleCreateQp} className="space-y-4">
                  <div>
                    <label className="label">Title</label>
                    <input type="text" required placeholder="e.g. Mid Term Physics Paper" value={qpTitle} onChange={e => setQpTitle(e.target.value)} className="input" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label">Class</label>
                      <select required value={qpClassId} onChange={e => setQpClassId(e.target.value)} className="input">
                        <option value="">Select...</option>
                        {classes.map(c => <option key={c.id} value={c.id}>{c.name}-{c.section}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="label">Subject</label>
                      <select required value={qpSubjectId} onChange={e => setQpSubjectId(e.target.value)} className="input">
                        <option value="">Select...</option>
                        {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="label">File URL (PDF/Word)</label>
                    <input type="url" required placeholder="https://link-to-file.pdf" value={qpFileUrl} onChange={e => setQpFileUrl(e.target.value)} className="input" />
                  </div>
                  <div className="flex gap-3 justify-end pt-2">
                    <button type="button" onClick={() => setShowQpModal(false)} className="btn-secondary text-sm">Cancel</button>
                    <button type="submit" className="btn-primary text-sm">Upload Paper</button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {onlineExams.map(exam => (
              <div key={exam.id} className="card p-6 space-y-4 hover:shadow-md border-t-4 border-indigo-500">
                <div>
                  <Badge variant="success">{exam.subject?.name}</Badge>
                  <h4 className="font-bold text-base text-gray-900 dark:text-white mt-1.5">{exam.title}</h4>
                  <p className="text-[11px] text-gray-400 mt-1">Class: {exam.class?.name}-{exam.class?.section}</p>
                </div>

                <div className="text-xs space-y-2 text-gray-500 font-semibold border-y border-gray-100 dark:border-gray-800 py-3">
                  <p className="flex justify-between"><span>Duration:</span> <span>{exam.duration} mins</span></p>
                  <p className="flex justify-between"><span>Total Marks:</span> <span>{exam.totalMarks}</span></p>
                  <p className="flex justify-between"><span>Passing Marks:</span> <span>{exam.passMarks}</span></p>
                  <p className="flex justify-between"><span>Questions:</span> <span>{exam.questions?.length || 0} items</span></p>
                </div>

                {isStudent ? (
                  <button onClick={() => handleStartTakeExam(exam.id)} className="btn-primary w-full flex items-center justify-center gap-2">
                    <Play className="w-4 h-4" /> Start Exam
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button onClick={() => handleViewSubmissions(exam.id)} className="btn-secondary flex-1 text-xs font-bold">
                      Submissions ({exam.submissions?.length || 0})
                    </button>
                    <button onClick={() => handleDeleteOnlineExam(exam.id)} className="p-2 border border-red-200 dark:border-red-900/40 text-red-500 hover:bg-red-50 rounded-xl cursor-pointer">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            ))}
            {onlineExams.length === 0 && (
              <div className="col-span-full py-12 text-center text-gray-400">
                No active online exams scheduled or published.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══ TAB 7: EXAMINATIONS LIST ══ */}
      {activeTab === 'examination' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-transparent p-2">
            <h2 className="text-lg font-black text-slate-800 uppercase tracking-wider">Examinations List</h2>
            {isAdmin && (
              <button onClick={openCreateModal} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 text-xs font-bold transition-all shadow-md">
                <Plus className="w-4 h-4" /> Create Exam
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mt-4">
            {exams.map(e => {
              const isExpanded = expandedExam === e.id;
              return (
                <div key={e.id} className="bg-white dark:bg-gray-900 rounded-3xl p-5 md:p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 dark:border-gray-800 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all flex flex-col gap-4 relative overflow-hidden group cursor-pointer" onClick={() => setExpandedExam(isExpanded ? null : e.id)}>
                  
                  {/* Decorative background accent */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 dark:bg-indigo-900/10 rounded-full blur-3xl -mr-10 -mt-10 transition-transform group-hover:scale-150 duration-700 pointer-events-none" />
                  
                  <div className="flex justify-between items-start z-10 relative">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-black text-slate-800 dark:text-white leading-tight">{e.name}</h3>
                        {e.term && <span className="bg-indigo-100 text-indigo-700 text-[10px] font-black uppercase px-2 py-0.5 rounded-full">{e.term}</span>}
                      </div>
                      <p className="text-xs font-bold text-slate-400 flex items-center gap-1 mt-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(e.examDate).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                  </div>

                  <div className="z-10 relative mt-2">
                    <div className="text-[10px] font-extrabold uppercase text-slate-400 mb-2 tracking-wider">Target Classes</div>
                    <div className="flex flex-wrap gap-2">
                      {(e.classes || []).slice(0, isExpanded ? undefined : 3).map((c: any) => (
                        <span key={c.id} className="bg-slate-50 dark:bg-gray-800 text-slate-600 dark:text-slate-300 px-2.5 py-1 rounded-lg text-xs font-bold border border-slate-100 dark:border-gray-700 shadow-sm">
                          {c.name}-{c.section}
                        </span>
                      ))}
                      {!isExpanded && (e.classes || []).length > 3 && (
                        <span className="bg-slate-50 dark:bg-gray-800 text-slate-400 dark:text-slate-500 px-2.5 py-1 rounded-lg text-xs font-bold border border-slate-100 dark:border-gray-700 shadow-sm">
                          +{(e.classes.length - 3)} more
                        </span>
                      )}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="z-10 relative pt-4 border-t border-gray-100 dark:border-gray-800 mt-2 flex flex-wrap gap-2 animate-fade-in" onClick={ev => ev.stopPropagation()}>
                      {isAdmin && (
                        <button onClick={() => openEditModal(e)} className="flex-1 bg-white hover:bg-slate-50 text-indigo-600 border-2 border-indigo-50 text-xs font-bold px-4 py-2 flex justify-center items-center gap-1.5 rounded-xl transition-all">
                          <Edit3 className="w-4 h-4" /> Edit
                        </button>
                      )}
                      {user?.role === 'SUPER_ADMIN' && (
                        <button onClick={() => handleDeleteExam(e.id)} className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-100 text-xs font-bold px-3 py-2 flex justify-center items-center gap-1.5 rounded-xl transition-all">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                      <button onClick={() => setActiveTab('written-exam')} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 flex justify-center items-center rounded-xl shadow-md transition-all shadow-indigo-500/20">
                        Enter Grades
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
            
            {exams.length === 0 && (
              <div className="col-span-full py-16 flex flex-col items-center justify-center bg-white/50 backdrop-blur-md rounded-3xl border-2 border-dashed border-gray-200">
                <Layers className="w-12 h-12 text-gray-300 mb-3" />
                <h3 className="text-lg font-bold text-gray-500">No Examinations Found</h3>
                <p className="text-sm text-gray-400">Click "Create Exam" to schedule a new examination.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══ TAB 8: SETTINGS ══ */}
      {activeTab === 'settings' && (
        <div className="space-y-6 animate-fade-in-up">
          <div className="bg-white/60 dark:bg-slate-900/50 backdrop-blur-md p-6 rounded-3xl border border-white/20 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
            <div className="flex items-center gap-4 mb-8">
              <div className="bg-gradient-to-br from-slate-600 to-slate-800 p-3.5 rounded-2xl shadow-lg shadow-slate-500/30 text-white">
                <Settings className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl sm:text-2xl font-black bg-gradient-to-r from-slate-700 to-slate-900 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent drop-shadow-sm">Global Exam Settings</h3>

              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Grading Configuration */}
              <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                <h4 className="text-sm font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <Award className="w-4 h-4 text-purple-500" /> Grading Standards
                </h4>
                <div className="space-y-5">
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Primary Evaluation Mode</label>
                    <select className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all cursor-pointer">
                      <option value="CCE">CCE Grading System (A1, A2, B1...)</option>
                      <option value="GPA">10 Point GPA Scale</option>
                      <option value="PERCENTAGE">Direct Percentage (Max 100%)</option>
                      <option value="CUSTOM">Custom Range Scale</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Default Pass Marks (%)</label>
                      <input type="number" defaultValue="40" className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Grace Marks Limit</label>
                      <input type="number" defaultValue="5" className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Result Publishing Rules */}
              <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                <h4 className="text-sm font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <CheckSquare className="w-4 h-4 text-emerald-500" /> Result & Marks Rules
                </h4>
                <div className="space-y-4">
                  <label className="flex items-center justify-between p-3 border border-slate-100 dark:border-slate-700 rounded-xl cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                    <div className="pr-4">
                      <span className="text-sm font-bold text-slate-700 dark:text-slate-200 block">Auto-Publish Results</span>
                      <span className="text-xs font-medium text-slate-500">Publish immediately after teacher submission</span>
                    </div>
                    <div className="relative inline-block w-12 h-6 rounded-full bg-emerald-500">
                      <span className="absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform transform translate-x-6"></span>
                    </div>
                  </label>
                  
                  <label className="flex items-center justify-between p-3 border border-slate-100 dark:border-slate-700 rounded-xl cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                    <div className="pr-4">
                      <span className="text-sm font-bold text-slate-700 dark:text-slate-200 block">Show Rank to Students</span>
                      <span className="text-xs font-medium text-slate-500">Display class rank in student portal</span>
                    </div>
                    <div className="relative inline-block w-12 h-6 rounded-full bg-emerald-500">
                      <span className="absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform transform translate-x-6"></span>
                    </div>
                  </label>

                  <label className="flex items-center justify-between p-3 border border-slate-100 dark:border-slate-700 rounded-xl cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                    <div className="pr-4">
                      <span className="text-sm font-bold text-slate-700 dark:text-slate-200 block">Strict Moderation</span>
                      <span className="text-xs font-medium text-slate-500">Require principal approval before publish</span>
                    </div>
                    <div className="relative inline-block w-12 h-6 rounded-full bg-slate-300 dark:bg-slate-600">
                      <span className="absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform transform translate-x-0"></span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Security & Freeze Controls */}
              <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 lg:col-span-2">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <h4 className="text-sm font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-widest mb-1 flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 text-rose-500" /> Security & Freeze Controls
                    </h4>
                    <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                      Security logging is active. Grade entries, overrides, and exam schedules are tracked for student auditing automatically.
                    </p>
                  </div>
                  <button className="btn-primary whitespace-nowrap bg-gradient-to-r from-slate-800 to-slate-900 text-white border-0 shadow-lg shadow-slate-900/20">
                    <Save className="w-4 h-4 mr-2 inline" /> Save Settings
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SMS Modal */}
      {showSmsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-gray-900 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl border border-gray-100 dark:border-gray-800 animate-scale-up">
            <div className="p-6 bg-gradient-to-r from-amber-500 to-orange-500 text-white flex justify-between items-center">
              <h2 className="text-xl font-black flex items-center gap-2"><MessageSquare className="w-5 h-5" /> Send Marks via SMS</h2>
              <button onClick={() => setShowSmsModal(false)} className="p-2 hover:bg-white/20 rounded-full transition-colors"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="p-6 space-y-5">
              <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-xl border border-orange-100 dark:border-orange-800/30">
                <p className="text-sm font-bold text-orange-800 dark:text-orange-300">
                  ⚠️ This will send SMS to all parents in the selected class using the approved DLT template. Ensure Marks for Maths, Physics, and Chemistry are updated.
                </p>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Select Exam</label>
                <select value={smsExamId} onChange={e => setSmsExamId(e.target.value)} className="input-field">
                  <option value="">Select Exam...</option>
                  {exams.map(ex => <option key={ex.id} value={ex.id}>{ex.name}</option>)}
                </select>
              </div>

              {smsExamId && (
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Select Class</label>
                  <select value={smsClassId} onChange={e => {
                    setSmsClassId(e.target.value);
                    setSmsStudentId('');
                  }} className="input-field">
                    <option value="">Select Class...</option>
                    {exams.find(e => e.id === smsExamId)?.classes?.map((c: any) => (
                      <option key={c.id} value={c.id}>{c.name}-{c.section}</option>
                    ))}
                  </select>
                </div>
              )}

              {smsClassId && (
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Send To</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="smsSendType" value="all" checked={smsSendType === 'all'} onChange={() => setSmsSendType('all')} className="w-4 h-4 text-orange-500" />
                      <span className="text-sm font-semibold text-gray-700">Entire Class</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="smsSendType" value="individual" checked={smsSendType === 'individual'} onChange={() => setSmsSendType('individual')} className="w-4 h-4 text-orange-500" />
                      <span className="text-sm font-semibold text-gray-700">Individual Student</span>
                    </label>
                  </div>
                </div>
              )}

              {smsClassId && smsSendType === 'individual' && (
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Select Student</label>
                  <select value={smsStudentId} onChange={e => setSmsStudentId(e.target.value)} className="input-field">
                    <option value="">Select Student...</option>
                    {classStudents.map(s => (
                      <option key={s.id} value={s.id}>{s.user?.name || s.name} ({s.rollNumber || s.admissionNumber})</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="p-5 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 flex justify-end gap-3">
              <button onClick={() => setShowSmsModal(false)} className="px-5 py-2.5 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-200 transition-colors">Cancel</button>
              <button onClick={handleSendMarksSMS} disabled={isSendingSms || !smsExamId || !smsClassId} className="px-5 py-2.5 rounded-xl text-sm font-bold bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600 shadow-md shadow-orange-500/20 transition-all disabled:opacity-50 flex items-center gap-2">
                {isSendingSms ? 'Sending...' : 'Send SMS'}
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

