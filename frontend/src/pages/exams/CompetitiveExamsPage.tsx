import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { 
  Play, Plus, Clock, FileText, CheckCircle, Edit, ShieldAlert, Award, FileQuestion, Users, RefreshCw, Trash2, BarChart3, Activity, TrendingUp, AlertTriangle, BookOpen, ChevronRight, CheckCircle2, XCircle, MinusCircle, Database, LayoutDashboard, List, UploadCloud, Download, Sparkles, Zap, Shield, HelpCircle, Check, ArrowRight, ArrowLeft, ExternalLink, X, Calendar, Hash, Target, Layers, Settings2, Sliders, Eye, Printer, Upload, Image as ImageIcon, Search, Trophy, UserCheck, Menu, ZoomIn, ZoomOut, FileSpreadsheet, FolderOpen
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import api from '../../api/axios';
import { DataCache } from '../../services/dataCache';
import toast from 'react-hot-toast';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { SingleRawBoxQuestionStudio } from './CompetitiveQuestionBankDashboard';
import { LiveLatexPreview } from '../../components/QuestionBank/LiveLatexPreview';
import { printPaper } from '../question-bank/MCQPaperGeneratorPage';

// ═══════════════════════════════════════════════════════════════
// KATEX LATEX MATH FORMULA RENDERER
// ═══════════════════════════════════════════════════════════════
export const LatexRenderer: React.FC<{ text?: string; content?: string; className?: string }> = ({ text, content, className = '' }) => {
  const raw = text ?? content ?? '';
  if (!raw) return null;
  const trimmed = raw.trim();

  // If text is purely an image URL or data URI
  if (trimmed.startsWith('data:image/') || trimmed.match(/^https?:\/\/.*\.(png|jpg|jpeg|gif|webp|svg)($|\?)/i)) {
    return (
      <div className="my-1.5 inline-block">
        <img src={trimmed} alt="Diagram" className="max-h-44 max-w-full rounded-xl object-contain border border-slate-200 shadow-xs" />
      </div>
    );
  }

  // Handle markdown images: ![alt](url)
  if (trimmed.includes('![') && trimmed.includes('](')) {
    const mdParts = trimmed.split(/(!\[.*?\]\(.*?\))/g);
    return (
      <span className={className}>
        {mdParts.map((part, pIdx) => {
          const match = part.match(/^!\[(.*?)\]\((.*?)\)$/);
          if (match) {
            return (
              <span key={pIdx} className="block my-2">
                <img src={match[2]} alt={match[1] || 'Diagram'} className="max-h-48 max-w-full rounded-xl object-contain border border-slate-200 shadow-xs" />
              </span>
            );
          }
          return <LatexRenderer key={pIdx} text={part} />;
        })}
      </span>
    );
  }

  // Auto-detect bare LaTeX formulas without $ (e.g. \frac{1}{4\pi\varepsilon_0}\frac{q}{a}, \sqrt{3}/2, x^2)
  const hasDollar = raw.includes('$');
  const hasLatexCommands = /\\[a-zA-Z]+|\^\{?[0-9a-zA-Z+\-]+\}?|_\{?[0-9a-zA-Z+\-]+\}?/.test(trimmed);

  if (!hasDollar && hasLatexCommands) {
    try {
      const html = katex.renderToString(trimmed, { displayMode: false, throwOnError: false });
      return <span className={className} dangerouslySetInnerHTML={{ __html: html }} />;
    } catch {
      // Fallback
    }
  }

  let normalized = raw;
  const dollars = (normalized.match(/(?<!\\)\$/g) || []).length;
  if (dollars % 2 !== 0) {
    normalized = normalized + '$';
  }

  const parts = [];
  const regex = /(\$\$[\s\S]+?\$\$|\$[^\$]+?\$)/g;
  let lastIndex = 0;
  let match;
  let keyIndex = 0;

  while ((match = regex.exec(normalized)) !== null) {
    if (match.index > lastIndex) {
      parts.push(<span key={`text-${keyIndex++}`}>{normalized.substring(lastIndex, match.index)}</span>);
    }
    const mathStr = match[0];
    const isDisplay = mathStr.startsWith('$$');
    const math = isDisplay ? mathStr.slice(2, -2) : mathStr.slice(1, -1);
    try {
      const html = katex.renderToString(math, { displayMode: isDisplay, throwOnError: false });
      parts.push(<span key={`math-${keyIndex++}`} dangerouslySetInnerHTML={{ __html: html }} />);
    } catch {
      parts.push(<span key={`math-${keyIndex++}`}>{mathStr}</span>);
    }
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < normalized.length) {
    parts.push(<span key={`text-${keyIndex++}`}>{normalized.substring(lastIndex)}</span>);
  }

  return <span className={className}>{parts.length > 0 ? parts : raw}</span>;
};

export const CompetitiveExamsPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isStudent = (user?.role || '').toUpperCase() === 'STUDENT';
  
  if (isStudent) {
    return <StudentCompetitivePortal navigate={navigate} />;
  }

  return <AdminCompetitiveDashboard navigate={navigate} />;
};

// ═══════════════════════════════════════════════════════════════
// ADMIN / TEACHER DASHBOARD
// ═══════════════════════════════════════════════════════════════

// Helper to safely extract exams array from various API response formats
const extractExams = (payload: any): any[] => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.exams)) return payload.exams;
  return [];
};

const AdminCompetitiveDashboard = ({ navigate }: { navigate: any }) => {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  const activeTab: 'DASHBOARD' | 'EXAMS' | 'QUESTIONS' | 'RESULTS' | 'STUDENTS' | 'REPORTS' = useMemo(() => {
    const p = location.pathname;
    if (p.includes('/competitive-exams/exams')) return 'EXAMS';
    if (p.includes('/competitive-exams/question-bank')) return 'QUESTIONS';
    if (p.includes('/competitive-exams/students')) return 'STUDENTS';
    if (p.includes('/competitive-exams/results')) return 'RESULTS';
    if (p.includes('/competitive-exams/reports')) return 'REPORTS';
    return 'DASHBOARD';
  }, [location.pathname]);

  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Inline Create Form & Modals
  const [showInlineCreate, setShowInlineCreate] = useState(false);
  const [aiModalExam, setAiModalExam] = useState<any | null>(null);
  const [selectedExamIdForQB, setSelectedExamIdForQB] = useState<string>('');
  const [createdExamModal, setCreatedExamModal] = useState<any | null>(null);
  const [previewExamPaper, setPreviewExamPaper] = useState<any | null>(null);
  const [masterQuestionsList, setMasterQuestionsList] = useState<any[]>([]);
  const [totalSchoolStudents, setTotalSchoolStudents] = useState<number>(0);

  const qbPresetSubject = searchParams.get('subject') || 'ALL';
  const openBulkImportOnQB = searchParams.get('bulkImport') === 'true';

  useEffect(() => {
    if (activeTab === 'EXAMS' && searchParams.get('create') === 'true') {
      setShowInlineCreate(true);
    }
    const examIdParam = searchParams.get('examId');
    if (activeTab === 'QUESTIONS' && examIdParam) {
      setSelectedExamIdForQB(examIdParam);
    }
  }, [activeTab, searchParams]);

  const fetchExams = async () => {
    setLoading(true);
    try {
      const [res, mqRes, stRes] = await Promise.all([
        api.get('/api/competitive-exams/admin'),
        api.get('/api/master-questions').catch(() => ({ data: { data: [] } })),
        api.get('/api/students?limit=1').catch(() => null),
      ]);
      const loadedExams = extractExams(res.data);
      setExams(loadedExams);
      const mqList = mqRes?.data?.data || mqRes?.data || [];
      setMasterQuestionsList(Array.isArray(mqList) ? mqList : []);
      const stTotal = stRes?.data?.pagination?.total || stRes?.data?.meta?.total || (Array.isArray(stRes?.data?.data) ? stRes.data.data.length : 0);
      if (stTotal > 0) setTotalSchoolStudents(stTotal);
      if (loadedExams.length > 0 && !selectedExamIdForQB) {
        setSelectedExamIdForQB(loadedExams[0].id);
      }
    } catch (err: any) {
      console.warn('Admin route error, trying student route fallback:', err);
      try {
        const res2 = await api.get('/api/competitive-exams/student');
        const fallback = extractExams(res2.data);
        setExams(fallback);
      } catch (err2) {
        console.warn('Competitive exams not loaded yet:', err2);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExams();
  }, []);

  const examQuestionsCount = exams.reduce((acc, e) => acc + (e._count?.questions || e.questions?.length || 0), 0);
  const totalQuestions = Math.max(masterQuestionsList.length, examQuestionsCount);
  const totalSubmissions = exams.reduce((acc, e) => acc + (e._count?.submissions || e.submissions?.length || 0), 0);

  const nowTs = Date.now();
  const liveExams = useMemo(() => exams.filter((e: any) => {
    const start = e.startTime ? new Date(e.startTime).getTime() : 0;
    const end = e.endTime ? new Date(e.endTime).getTime() : 0;
    if (start && end) return nowTs >= start && nowTs <= end;
    return e.isPublished !== false;
  }), [exams, nowTs]);

  const upcomingExams = useMemo(() => exams.filter((e: any) => {
    const start = e.startTime ? new Date(e.startTime).getTime() : 0;
    return start > nowTs;
  }), [exams, nowTs]);

  // Compute Active Students across all exams
  const activeStudents = useMemo(() => {
    const studentMap = new Map<string, any>();
    exams.forEach((ex: any) => {
      (ex.submissions || []).forEach((sub: any) => {
        const student = sub.student;
        if (!student) return;
        const sId = student.id || sub.studentId;
        if (!studentMap.has(sId)) {
          studentMap.set(sId, {
            id: sId,
            name: student.user?.name || 'Student',
            photoUrl: student.user?.photoUrl,
            rollNo: student.rollNo || '-',
            className: student.class ? `${student.class.name} ${student.class.section ? `(${student.class.section})` : ''}` : '-',
            rawClassName: student.class?.name || '',
            attempts: 1,
            bestScore: sub.marksObtained || 0,
            latestDate: sub.createdAt || sub.submittedAt,
            latestExam: ex.title,
            examId: ex.id,
            submissionId: sub.id,
          });
        } else {
          const item = studentMap.get(sId);
          item.attempts += 1;
          if ((sub.marksObtained || 0) > item.bestScore) {
            item.bestScore = sub.marksObtained || 0;
          }
          const subDt = sub.createdAt || sub.submittedAt;
          if (new Date(subDt) > new Date(item.latestDate)) {
            item.latestDate = subDt;
            item.latestExam = ex.title;
            item.examId = ex.id;
            item.submissionId = sub.id;
          }
        }
      });
    });
    return Array.from(studentMap.values()).sort((a, b) => b.attempts - a.attempts);
  }, [exams]);

  const handleDeleteExam = async (id: string, title: string) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"?`)) return;
    try {
      await api.delete(`/api/competitive-exams/${id}`);
      toast.success('Exam deleted successfully');
      fetchExams();
    } catch (e) {
      toast.error('Failed to delete exam');
    }
  };

  const handleOpenQuestionBankForExam = (examId: string) => {
    setSelectedExamIdForQB(examId);
    navigate(`/competitive-exams/question-bank?examId=${examId}`);
  };

  const pageMeta: Record<string, { title: string; subtitle: string; badge: string }> = {
    DASHBOARD: {
      title: 'Online Exam Module',
      subtitle: 'Dashboard Overview, Live & Upcoming Exams, Subject & Topic Question Bank, Results & Reports',
      badge: 'CBT Testing Suite',
    },
    EXAMS: {
      title: 'Exam Management',
      subtitle: 'Create, schedule, publish exams, launch CBT simulator, and manage exam papers',
      badge: 'Exams & Scheduling',
    },
    QUESTIONS: {
      title: 'Master Question Bank',
      subtitle: 'Subject-wise & Topic-wise permanent PostgreSQL Question Bank with Bulk Excel Import & AI Parser',
      badge: 'Question Repository',
    },
    STUDENTS: {
      title: 'Student Management',
      subtitle: 'Participating students, exam attempts, best scores, and individual performance tracking',
      badge: 'Candidate Directory',
    },
    RESULTS: {
      title: 'Results & Result Cards',
      subtitle: 'Exam rankings, scorecards, accuracy analytics, and printable A4 Result Cards',
      badge: 'Merit & Scorecards',
    },
    REPORTS: {
      title: 'Performance Reports & Analytics',
      subtitle: 'Pass/Fail percentages, average & highest scores, and Excel report export',
      badge: 'Analytics & Export',
    },
  };
  const currentMeta = pageMeta[activeTab] || pageMeta.DASHBOARD;

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6 min-h-screen bg-slate-50">
      {/* Clean & Professional Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('toggleSidebar'))}
            className="p-2 md:hidden rounded-xl bg-white hover:bg-slate-50 border border-slate-200/90 text-slate-700 shadow-xs cursor-pointer shrink-0"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <button
            onClick={() => navigate(activeTab === 'DASHBOARD' ? '/dashboard' : '/competitive-exams')}
            className="px-3 py-2 sm:py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200/90 text-slate-700 shadow-xs cursor-pointer transition flex items-center gap-1.5 shrink-0 text-xs font-bold"
            title={activeTab === 'DASHBOARD' ? 'Back to School Dashboard' : 'Back to Online Exam Dashboard'}
          >
            <ArrowLeft className="w-4 h-4" />
            {activeTab !== 'DASHBOARD' && <span className="hidden sm:inline">Exam Dashboard</span>}
          </button>
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20 shrink-0">
            <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {currentMeta.title}
              </h1>
              <span className="hidden sm:inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-black bg-indigo-50 text-indigo-700 border border-indigo-200">
                {currentMeta.badge}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              {currentMeta.subtitle}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => fetchExams()}
            className="p-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-600 border border-slate-200/90 transition shadow-xs cursor-pointer"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          {activeTab !== 'QUESTIONS' && (
            <>
              <button
                onClick={() => navigate('/competitive-exams/bulk-import')}
                className="px-3.5 py-2.5 rounded-xl bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-200 font-extrabold text-xs shadow-xs flex items-center gap-1.5 transition cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Bulk Import</span>
              </button>

              <button
                onClick={() => {
                  setShowInlineCreate(true);
                  navigate('/competitive-exams/exams?create=true');
                }}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-extrabold text-xs shadow-sm shadow-indigo-500/20 flex items-center gap-2 transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Create Exam</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Show 6 KPI Cards ONLY on main Dashboard so sub-pages stay clean & dedicated */}
      {activeTab === 'DASHBOARD' && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
          <StatCard
            title="TOTAL EXAMS"
            value={exams.length}
            subtitle="All Created Tests"
            color="blue"
            icon={<List className="w-4 h-4" />}
            onClick={() => navigate('/competitive-exams/exams')}
          />
          <StatCard
            title="LIVE EXAMS"
            value={liveExams.length}
            subtitle="Active Right Now"
            color="emerald"
            icon={<Activity className="w-4 h-4" />}
            onClick={() => navigate('/competitive-exams/exams')}
          />
          <StatCard
            title="UPCOMING EXAMS"
            value={upcomingExams.length}
            subtitle="Scheduled Tests"
            color="indigo"
            icon={<Calendar className="w-4 h-4" />}
            onClick={() => navigate('/competitive-exams/exams')}
          />
          <StatCard
            title="TOTAL QUESTIONS"
            value={totalQuestions}
            subtitle="Master Question Bank"
            color="purple"
            icon={<FileQuestion className="w-4 h-4" />}
            onClick={() => navigate('/competitive-exams/question-bank')}
          />
          <StatCard
            title="TOTAL STUDENTS"
            value={totalSchoolStudents || activeStudents.length}
            subtitle={`${activeStudents.length} Attempted`}
            color="amber"
            icon={<Users className="w-4 h-4" />}
            onClick={() => navigate('/competitive-exams/students')}
          />
          <StatCard
            title="RESULT CARDS"
            value={totalSubmissions}
            subtitle="Ranks & Reports"
            color="rose"
            icon={<Award className="w-4 h-4" />}
            onClick={() => navigate('/competitive-exams/results')}
          />
        </div>
      )}

      {/* Dedicated Page Contents */}
      <div className="mt-2">
        {activeTab === 'DASHBOARD' && (
          <OnlineExamDashboardOverview
            exams={exams}
            liveExams={liveExams}
            upcomingExams={upcomingExams}
            masterQuestionsList={masterQuestionsList}
            activeStudents={activeStudents}
            onCreateExam={() => {
              setShowInlineCreate(true);
              navigate('/competitive-exams/exams?create=true');
            }}
            onOpenQuestionBank={(subjectFilter?: string) => {
              navigate(subjectFilter && subjectFilter !== 'ALL'
                ? `/competitive-exams/question-bank?subject=${encodeURIComponent(subjectFilter)}`
                : '/competitive-exams/question-bank');
            }}
            onOpenBulkImport={() => navigate('/competitive-exams/question-bank?bulkImport=true')}
            onOpenReports={() => navigate('/competitive-exams/reports')}
            onPreviewPaper={(exam: any) => setPreviewExamPaper(exam)}
            navigate={navigate}
          />
        )}

        {activeTab === 'EXAMS' && (
          <ManageExamsTab
            exams={exams}
            loading={loading}
            showInlineCreate={showInlineCreate}
            setShowInlineCreate={setShowInlineCreate}
            onRefresh={fetchExams}
            onOpenAiModal={(exam: any) => setAiModalExam(exam)}
            onOpenQuestionBank={handleOpenQuestionBankForExam}
            onDelete={handleDeleteExam}
            onExamCreated={(newExam: any) => {
              setCreatedExamModal(newExam);
            }}
            onPreviewPaper={(exam: any) => navigate(`/competitive-exams/${exam.id}/paper`)}
            navigate={navigate}
          />
        )}

        {activeTab === 'QUESTIONS' && (
          <SubjectWiseQuestionBankTab 
            exams={exams} 
            selectedExamId={selectedExamIdForQB}
            setSelectedExamId={setSelectedExamIdForQB}
            onOpenAiModal={(exam: any) => setAiModalExam(exam)}
            onExamsUpdated={fetchExams}
            presetSubject={qbPresetSubject}
            openBulkImportInitially={openBulkImportOnQB}
            onConsumeBulkImportFlag={() => {
              const next = new URLSearchParams(searchParams);
              next.delete('bulkImport');
              setSearchParams(next, { replace: true });
            }}
            navigate={navigate} 
          />
        )}

        {activeTab === 'RESULTS' && (
          <ResultsAndRanksTab exams={exams} navigate={navigate} />
        )}

        {activeTab === 'STUDENTS' && (
          <ActiveStudentsTab exams={exams} navigate={navigate} />
        )}

        {activeTab === 'REPORTS' && (
          <OnlineExamReportsTab exams={exams} masterQuestionsList={masterQuestionsList} navigate={navigate} />
        )}
      </div>

      {/* AI Question Generator Modal */}
      {aiModalExam && (
        <AiQuestionGeneratorModal
          exam={aiModalExam}
          onClose={() => setAiModalExam(null)}
          onGenerated={() => {
            setAiModalExam(null);
            fetchExams();
          }}
        />
      )}

      {/* Created Exam Success Launch Modal */}
      {createdExamModal && (
        <ExamLaunchSuccessModal
          exam={createdExamModal}
          onClose={() => setCreatedExamModal(null)}
          onLaunchExam={() => navigate(`/take-competitive-exam/${createdExamModal.id}`)}
          onOpenQuestionBank={() => {
            setSelectedExamIdForQB(createdExamModal.id);
            setActiveTab('QUESTIONS');
            setCreatedExamModal(null);
          }}
        />
      )}

      {/* Exam Paper Full Preview Modal */}
      {previewExamPaper && (
        <ExamPaperPreviewModal
          exam={previewExamPaper}
          onClose={() => setPreviewExamPaper(null)}
          navigate={navigate}
        />
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// MANAGE EXAMS TAB
// ═══════════════════════════════════════════════════════════════

const ManageExamsTab = ({ 
  exams, 
  loading, 
  showInlineCreate, 
  setShowInlineCreate, 
  onRefresh, 
  onOpenAiModal, 
  onOpenQuestionBank, 
  onDelete, 
  onExamCreated,
  onPreviewPaper,
  navigate 
}: any) => {
  return (
    <div className="space-y-6">
      {/* Eduracle Exam Creation Wizard */}
      {showInlineCreate && (
        <EduracleCreateExamWizard 
          onClose={() => setShowInlineCreate(false)}
          onCreated={(newExam: any) => {
            setShowInlineCreate(false);
            onRefresh();
            if (onExamCreated && newExam) onExamCreated(newExam);
          }}
        />
      )}

      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-lg font-black text-slate-800">Available Online Exams & Mock Papers</h2>
          <p className="text-xs text-slate-500 font-medium">Real-time CBT simulated test suite for students with instant scorecards</p>
        </div>
        
        {!showInlineCreate && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowInlineCreate(true)}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition cursor-pointer"
            >
              <Plus size={16} /> Create Competitive Exam
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="p-16 flex flex-col items-center justify-center bg-white rounded-3xl border border-slate-200 shadow-sm">
          <RefreshCw className="w-10 h-10 animate-spin text-indigo-600 mb-3" />
          <p className="text-slate-600 font-bold">Loading Competitive Exams...</p>
        </div>
      ) : exams.length === 0 ? (
        <div className="p-16 flex flex-col items-center justify-center text-center bg-white rounded-3xl border border-slate-200 shadow-sm">
          <div className="w-20 h-20 rounded-3xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
            <BookOpen className="w-10 h-10 text-indigo-600" />
          </div>
          <h3 className="text-xl font-black text-slate-800">No Online Exams Created Yet</h3>
          <p className="text-slate-500 max-w-md mt-2 text-sm">
            Create an objective CBT exam for your school classes (10th, 9th, 8th). Configure questions, answer options, time duration, and marking scheme.
          </p>
          <div className="flex items-center justify-center gap-3 mt-6">
            <button
              onClick={() => setShowInlineCreate(true)}
              className="px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs flex items-center gap-2 shadow-md transition cursor-pointer hover:scale-105"
            >
              <Plus size={16} /> Create School Online Exam
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {exams.map((exam: any) => {
            const qCount = exam._count?.questions || exam.questions?.length || 0;
            const subCount = exam._count?.submissions || exam.submissions?.length || 0;
            const isJee = exam.title.toUpperCase().includes('JEE');
            const isNeet = exam.title.toUpperCase().includes('NEET');
            const isNavodaya = exam.title.toUpperCase().includes('NAVODAYA');
            const isEamcet = exam.title.toUpperCase().includes('EAMCET');

            let patternTag = 'NTA CBT PATTERN';
            let patternBadgeBg = 'bg-blue-100 text-blue-800 border-blue-200';
            let sections = ['General Objective Test'];
            if (isJee) {
              patternTag = 'JEE MAINS PATTERN (+4, -1)';
              patternBadgeBg = 'bg-indigo-100 text-indigo-800 border-indigo-200';
              sections = ['Physics', 'Chemistry', 'Mathematics'];
            } else if (isNeet) {
              patternTag = 'NEET UG PATTERN (+4, -1)';
              patternBadgeBg = 'bg-emerald-100 text-emerald-800 border-emerald-200';
              sections = ['Physics', 'Chemistry', 'Botany', 'Zoology'];
            } else if (isEamcet) {
              patternTag = 'EAMCET PATTERN (NO NEGATIVE)';
              patternBadgeBg = 'bg-cyan-100 text-cyan-800 border-cyan-200';
              sections = ['Mathematics (80Q)', 'Physics (40Q)', 'Chemistry (40Q)'];
            } else if (isNavodaya) {
              patternTag = 'NAVODAYA ENTRANCE (+5, 0)';
              patternBadgeBg = 'bg-amber-100 text-amber-800 border-amber-200';
              sections = ['Mental Ability', 'Arithmetic', 'Language'];
            }

            return (
              <div
                key={exam.id}
                className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div>
                  {/* Header row */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <span className={`text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full border ${patternBadgeBg}`}>
                      {patternTag}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-xs font-extrabold text-emerald-600">Active</span>
                    </div>
                  </div>

                  {/* Exam Title */}
                  <h3 className="text-lg font-black text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-2">
                    {exam.title}
                  </h3>

                  {/* Subject Sections Blueprint Badges */}
                  <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                    {sections.map((sec, sIdx) => (
                      <span key={sIdx} className="px-2.5 py-0.5 rounded-lg text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                        {sec}
                      </span>
                    ))}
                  </div>

                  {/* Meta Tags */}
                  <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-slate-500 mt-2.5">
                    <span className="bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-lg">
                      📚 Class: {exam.class?.name || '10th Standard'}
                    </span>
                    <span className="bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-lg">
                      👥 Submissions: {subCount}
                    </span>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-4 gap-2 my-4 p-3 rounded-2xl bg-slate-50 border border-slate-100 text-center">
                    <div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase">Duration</div>
                      <div className="text-sm font-black text-slate-800">{exam.duration}m</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase">Total Marks</div>
                      <div className="text-sm font-black text-indigo-600">{exam.totalMarks}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase">Questions</div>
                      <div className="text-sm font-black text-emerald-600">{qCount}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase">Marking</div>
                      <div className="text-sm font-black text-rose-600">+{exam.totalMarks > 400 ? '4' : '4'} / -{exam.negativeMarks || 0}</div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  {/* Primary Launch CBT Exam & View Paper Buttons */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => navigate(`/competitive-exams/${exam.id}/paper`)}
                      className="py-2.5 px-3 rounded-xl bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 text-slate-800 hover:text-indigo-700 font-black text-xs flex items-center justify-center gap-1.5 shadow-xs transition cursor-pointer"
                    >
                      <Eye className="w-4 h-4 text-indigo-600" />
                      View Exam Paper
                    </button>
                    <button
                      onClick={() => navigate(`/take-competitive-exam/${exam.id}`)}
                      className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow transition cursor-pointer"
                    >
                      <Play className="w-4 h-4 fill-white" />
                      Launch CBT Exam
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => navigate(`/live-exam-monitor/${exam.id}`)}
                      className="py-2 px-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center justify-center gap-1 transition cursor-pointer"
                      title="Live Proctoring"
                    >
                      <Activity className="w-3.5 h-3.5 text-rose-500" /> Live Monitor
                    </button>

                    <button
                      onClick={() => navigate(`/competitive-exam-leaderboard/${exam.id}`)}
                      className="py-2 px-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center justify-center gap-1 transition cursor-pointer"
                      title="View Leaderboard"
                    >
                      <Award className="w-3.5 h-3.5 text-amber-500" /> Rank List
                    </button>

                    <button
                      onClick={() => onOpenQuestionBank(exam.id)}
                      className="py-2 px-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center justify-center gap-1 transition cursor-pointer"
                      title="Manage Questions in Question Bank"
                    >
                      <FileQuestion className="w-3.5 h-3.5 text-indigo-500" /> Questions ({qCount})
                    </button>
                  </div>

                  <div className="flex items-center justify-between pt-1 flex-wrap gap-2">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => navigate(`/competitive-exams/${exam.id}/paste-ai`)}
                        className="text-xs font-extrabold text-emerald-600 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
                        title="Open Dedicated AI Text Parser Workspace"
                      >
                        <FileText className="w-3.5 h-3.5 text-emerald-500" /> 📄 Paste Exam Text (AI Parser)
                      </button>

                      <button
                        onClick={() => onOpenAiModal(exam)}
                        className="text-xs font-extrabold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" /> ✨ AI Generate
                      </button>
                    </div>

                    <button
                      onClick={() => onDelete(exam.id, exam.title)}
                      className="text-xs font-bold text-rose-500 hover:text-rose-700 flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// EDURACLE EXAM CREATION WIZARD (REAL STANDARD TEMPLATES & SETTINGS ENGINE)
// ═══════════════════════════════════════════════════════════════

export interface ExamBlueprintSection {
  name: string;
  count: number;
  marks: number;
}

export interface ExamPatternPreset {
  id: string;
  badge: string;
  title: string;
  subtitle: string;
  defaultTitle: string;
  description: string;
  duration: number;
  totalMarks: number;
  marksPerQuestion: number;
  passMarks: number;
  negativeMarks: number;
  color: string;
  tagColor: string;
  sections: ExamBlueprintSection[];
}

const PATTERN_PRESETS: ExamPatternPreset[] = [
  {
    id: 'SCHOOL_GRAND_TEST',
    badge: 'CBSE / STATE BOARD',
    title: 'School Grand Test',
    subtitle: 'Annual & Pre-Final Exam Pattern',
    defaultTitle: '10th Class Grand Test - Mathematics',
    description: 'Comprehensive School Assessment • 100 Marks • 120 Mins • Zero Negative',
    duration: 120,
    totalMarks: 100,
    marksPerQuestion: 2,
    passMarks: 35,
    negativeMarks: 0,
    color: 'from-blue-600 to-indigo-700',
    tagColor: 'bg-blue-100 text-blue-800 border-blue-200',
    sections: [
      { name: 'Section A: Objective & Conceptual MCQs', count: 25, marks: 50 },
      { name: 'Section B: Application & Problem Solving', count: 25, marks: 50 },
    ],
  },
  {
    id: 'SSC_BOARD',
    badge: 'SSC 10TH BOARD',
    title: 'SSC 10th Board Model Paper',
    subtitle: 'State Board Objective Evaluation',
    defaultTitle: 'SSC 10th Board Practice Examination',
    description: 'Part-B Standard Pattern • 50 Marks • 60 Mins • Zero Negative',
    duration: 60,
    totalMarks: 50,
    marksPerQuestion: 1,
    passMarks: 18,
    negativeMarks: 0,
    color: 'from-emerald-600 to-teal-700',
    tagColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    sections: [
      { name: 'Section A: Multiple Choice (Part-B)', count: 20, marks: 20 },
      { name: 'Section B: Conceptual & Analytical', count: 15, marks: 15 },
      { name: 'Section C: Very Short Objective Qs', count: 15, marks: 15 },
    ],
  },
  {
    id: 'JEE_MAINS',
    badge: 'NTA JEE MAINS',
    title: 'IIT-JEE Mains Mock Exam',
    subtitle: 'Official NTA Examination Pattern',
    defaultTitle: 'JEE Mains Grand Mock Test (Full Syllabus)',
    description: 'Physics, Chemistry, Mathematics • 300 Marks • 180 Mins • +4 / -1 Marking',
    duration: 180,
    totalMarks: 300,
    marksPerQuestion: 4,
    passMarks: 100,
    negativeMarks: 1,
    color: 'from-indigo-600 to-purple-700',
    tagColor: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    sections: [
      { name: 'Section 1: Physics', count: 25, marks: 100 },
      { name: 'Section 2: Chemistry', count: 25, marks: 100 },
      { name: 'Section 3: Mathematics', count: 25, marks: 100 },
    ],
  },
  {
    id: 'NEET',
    badge: 'NTA NEET UG',
    title: 'NEET UG Medical Mock Exam',
    subtitle: 'National Medical Foundation Pattern',
    defaultTitle: 'NEET UG Grand Mock Test (Full Syllabus)',
    description: 'Physics, Chemistry, Botany, Zoology • 720 Marks • 200 Mins • +4 / -1 Marking',
    duration: 200,
    totalMarks: 720,
    marksPerQuestion: 4,
    passMarks: 250,
    negativeMarks: 1,
    color: 'from-teal-600 to-emerald-700',
    tagColor: 'bg-teal-100 text-teal-800 border-teal-200',
    sections: [
      { name: 'Physics (Sec A & B)', count: 45, marks: 180 },
      { name: 'Chemistry (Sec A & B)', count: 45, marks: 180 },
      { name: 'Botany (Sec A & B)', count: 45, marks: 180 },
      { name: 'Zoology (Sec A & B)', count: 45, marks: 180 },
    ],
  },
  {
    id: 'EAMCET',
    badge: 'AP / TS EAPCET',
    title: 'State EAPCET / EAMCET Pattern',
    subtitle: 'Engineering & Agriculture Common Entrance',
    defaultTitle: 'State EAPCET Grand Practice Examination',
    description: 'Maths (80M), Physics (40M), Chemistry (40M) • 160 Marks • 180 Mins • Zero Negative',
    duration: 180,
    totalMarks: 160,
    marksPerQuestion: 1,
    passMarks: 40,
    negativeMarks: 0,
    color: 'from-cyan-600 to-blue-700',
    tagColor: 'bg-cyan-100 text-cyan-800 border-cyan-200',
    sections: [
      { name: 'Mathematics (Part 1)', count: 80, marks: 80 },
      { name: 'Physics (Part 2)', count: 40, marks: 40 },
      { name: 'Chemistry (Part 3)', count: 40, marks: 40 },
    ],
  },
  {
    id: 'NAVODAYA',
    badge: 'NAVODAYA / SAINIK',
    title: 'Navodaya & Sainik School JNVST',
    subtitle: 'Class 6th & 9th Entrance Pattern',
    defaultTitle: 'Navodaya & Sainik School Entrance Practice Test',
    description: 'Mental Ability (50M), Arithmetic (25M), Language (25M) • 100 Marks • 120 Mins',
    duration: 120,
    totalMarks: 100,
    marksPerQuestion: 1.25,
    passMarks: 40,
    negativeMarks: 0,
    color: 'from-amber-600 to-orange-700',
    tagColor: 'bg-amber-100 text-amber-800 border-amber-200',
    sections: [
      { name: 'Mental Ability Test (MAT)', count: 40, marks: 50 },
      { name: 'Arithmetic Test (Maths)', count: 20, marks: 25 },
      { name: 'Language Comprehension', count: 20, marks: 25 },
    ],
  },
  {
    id: 'SLIP_TEST',
    badge: 'WEEKLY SLIP TEST',
    title: 'Weekly Classroom Slip Test',
    subtitle: 'Formative Assessment (FA / ST)',
    defaultTitle: 'Weekly Objective Slip Test',
    description: 'Quick Evaluation • 25 Marks • 45 Mins • Zero Negative',
    duration: 45,
    totalMarks: 25,
    marksPerQuestion: 1,
    passMarks: 10,
    negativeMarks: 0,
    color: 'from-rose-600 to-pink-700',
    tagColor: 'bg-rose-100 text-rose-800 border-rose-200',
    sections: [
      { name: 'Section 1: Objective & Concept MCQs', count: 25, marks: 25 },
    ],
  },
  {
    id: 'CUSTOM',
    badge: 'CUSTOM BLUEPRINT',
    title: 'Custom Flexible Examination',
    subtitle: 'Teacher Configured Blueprint',
    defaultTitle: 'School Custom Objective Examination',
    description: 'Completely customizable time, questions, marks, and negative marking',
    duration: 60,
    totalMarks: 50,
    marksPerQuestion: 1,
    passMarks: 20,
    negativeMarks: 0,
    color: 'from-purple-600 to-violet-800',
    tagColor: 'bg-purple-100 text-purple-800 border-purple-200',
    sections: [
      { name: 'General Objective Questions', count: 50, marks: 50 },
    ],
  },
];

const EduracleCreateExamWizard = ({ onClose, onCreated }: { onClose: () => void; onCreated: (exam: any) => void }) => {
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [selectedPattern, setSelectedPattern] = useState<string>('SCHOOL_GRAND_TEST');
  const [marksPerQuestion, setMarksPerQuestion] = useState<number>(2);
  const [sections, setSections] = useState<ExamBlueprintSection[]>(PATTERN_PRESETS[0].sections);
  const [showSettingsStudio, setShowSettingsStudio] = useState<boolean>(true);

  const [formData, setFormData] = useState({
    title: PATTERN_PRESETS[0].defaultTitle,
    pattern: 'SCHOOL_GRAND_TEST',
    duration: 120,
    totalMarks: 100,
    passMarks: 35,
    negativeMarks: 0,
    examDate: new Date().toISOString().split('T')[0],
    startTime: '09:00',
    endTime: '11:00',
    classId: '',
    subjectId: '',
  });

  useEffect(() => {
    const loadClassesAndSubjects = async () => {
      try {
        let clsList: any[] = [];
        try {
          clsList = await DataCache.get('classes');
        } catch {
          const res = await api.get('/api/classes');
          clsList = res.data?.data || res.data || [];
        }
        if (Array.isArray(clsList) && clsList.length > 0) {
          setClasses(clsList);
          const seniorClass = clsList.find((c: any) => 
            (c.name || '').includes('10') || (c.name || '').includes('9') || (c.name || '').includes('8') || (c.name || '').includes('5')
          ) || clsList[0];
          if (seniorClass) {
            setFormData(prev => ({ ...prev, classId: seniorClass.id }));
          }
        }
      } catch (e) {
        console.warn('Failed to load classes in wizard:', e);
      }

      try {
        let subList: any[] = [];
        try {
          subList = await DataCache.get('subjects');
        } catch {
          const res2 = await api.get('/api/subjects');
          subList = res2.data?.data || res2.data || [];
        }
        if (Array.isArray(subList) && subList.length > 0) {
          setSubjects(subList);
          const mathOrScience = subList.find((s: any) => 
            (s.name || '').toLowerCase().includes('math') || 
            (s.name || '').toLowerCase().includes('phys') || 
            (s.name || '').toLowerCase().includes('scien')
          ) || subList[0];
          if (mathOrScience) {
            setFormData(prev => ({ ...prev, subjectId: mathOrScience.id }));
          }
        }
      } catch (e) {
        console.warn('Failed to load subjects in wizard:', e);
      }
    };

    loadClassesAndSubjects();
  }, []);

  const handleSelectPattern = (preset: ExamPatternPreset) => {
    setSelectedPattern(preset.id);
    setMarksPerQuestion(preset.marksPerQuestion);
    setSections(preset.sections.map(s => ({ ...s })));
    setFormData(prev => ({
      ...prev,
      pattern: preset.id,
      title: preset.defaultTitle,
      duration: preset.duration,
      totalMarks: preset.totalMarks,
      passMarks: preset.passMarks,
      negativeMarks: preset.negativeMarks,
    }));
    setShowSettingsStudio(true);
  };

  const handleResetDefaults = () => {
    const preset = PATTERN_PRESETS.find(p => p.id === selectedPattern) || PATTERN_PRESETS[0];
    setMarksPerQuestion(preset.marksPerQuestion);
    setSections(preset.sections.map(s => ({ ...s })));
    setFormData(prev => ({
      ...prev,
      title: preset.defaultTitle,
      duration: preset.duration,
      totalMarks: preset.totalMarks,
      passMarks: preset.passMarks,
      negativeMarks: preset.negativeMarks,
    }));
    toast.success('Reset settings to template defaults');
  };

  const currentPreset = PATTERN_PRESETS.find(p => p.id === selectedPattern) || PATTERN_PRESETS[0];
  const totalQuestionsCount = sections.reduce((acc, s) => acc + (Number(s.count) || 0), 0);

  const handleMarksPerQuestionChange = (val: number) => {
    const safeVal = Math.max(0.5, val);
    setMarksPerQuestion(safeVal);
    setSections(prev => prev.map(s => ({ ...s, marks: Math.round(s.count * safeVal) })));
    setFormData(prev => ({ ...prev, totalMarks: Math.round(totalQuestionsCount * safeVal) }));
  };

  const handleAddSection = () => {
    setSections(prev => [
      ...prev,
      { name: `Section ${prev.length + 1}: Subject / Topic`, count: 10, marks: Math.round(10 * marksPerQuestion) }
    ]);
  };

  const handleRemoveSection = (idx: number) => {
    if (sections.length <= 1) {
      toast.error('At least one section is required');
      return;
    }
    setSections(prev => prev.filter((_, i) => i !== idx));
  };

  const handleUpdateSection = (idx: number, field: keyof ExamBlueprintSection, val: any) => {
    setSections(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: val };
      if (field === 'count') {
        next[idx].marks = Math.round(Number(val || 0) * marksPerQuestion);
      }
      return next;
    });
  };

  const handleSyncTotalMarksFromSections = () => {
    const totalFromSec = sections.reduce((acc, s) => acc + (Number(s.marks) || 0), 0);
    setFormData(prev => ({ ...prev, totalMarks: totalFromSec }));
    toast.success(`Total marks updated to ${totalFromSec}M`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error('Please enter exam title');
      return;
    }

    setLoading(true);
    try {
      const startDateTime = new Date(`${formData.examDate}T${formData.startTime}:00`);
      const endDateTime = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 year active window

      const resolvedClassId = formData.classId || (classes.length > 0 ? classes[0].id : undefined);
      const resolvedSubjectId = formData.subjectId || (subjects.length > 0 ? subjects[0].id : undefined);

      const payload = {
        title: formData.title,
        pattern: formData.pattern,
        duration: Number(formData.duration) || 120,
        totalMarks: Number(formData.totalMarks) || 100,
        passMarks: Number(formData.passMarks) || 35,
        negativeMarks: Number(formData.negativeMarks) || 0,
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        classId: resolvedClassId,
        subjectId: resolvedSubjectId,
        isPublished: true,
      };

      const res = await api.post('/api/competitive-exams', payload);
      toast.success('Exam created successfully! Now add questions in Question Bank.');
      const newExam = res.data?.data || res.data;
      onCreated(newExam);
    } catch (err: any) {
      console.error('Create exam error:', err);
      const msg = err.response?.data?.message || err.message || 'Failed to create exam';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // Group classes to display senior classes prominently
  const seniorClasses = classes.filter((c: any) => 
    (c.name || '').includes('10') || (c.name || '').includes('9') || (c.name || '').includes('8') || (c.name || '').includes('5')
  );
  const otherClasses = classes.filter((c: any) => !seniorClasses.includes(c));

  return (
    <div className="bg-white rounded-3xl p-5 md:p-8 shadow-xl border border-slate-200 transition-all space-y-7">
      {/* Wizard Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-5 border-b border-slate-100">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/25 shrink-0">
            <Zap className="w-6 h-6 text-amber-300" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-xl font-black text-slate-900">Eduracle Online Exam Creator</h3>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-indigo-50 text-indigo-700 border border-indigo-200">
                8 Real Standard Templates
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Choose an official examination blueprint or customize time, date, marks per question, and negative marking rules.
            </p>
          </div>
        </div>

        <button 
          onClick={onClose} 
          className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition cursor-pointer self-end sm:self-center"
        >
          <X size={20} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-7">
        
        {/* STEP 1: CHOOSE REAL STANDARD EXAM PATTERN */}
        <div>
          <div className="flex items-center justify-between mb-3.5">
            <label className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-600" />
              Step 1: Choose Authentic Examination Pattern
            </label>
            <span className="text-[11px] font-bold text-slate-500">
              8 Real School & National Standard Patterns
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {PATTERN_PRESETS.map((preset) => {
              const isSelected = selectedPattern === preset.id;
              return (
                <div
                  key={preset.id}
                  onClick={() => handleSelectPattern(preset)}
                  className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between group ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50/40 shadow-sm ring-2 ring-indigo-600/10'
                      : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/50'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-md border ${preset.tagColor}`}>
                        {preset.badge}
                      </span>
                      {isSelected ? (
                        <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                          <Check size={12} strokeWidth={3} />
                        </span>
                      ) : (
                        <span className="w-5 h-5 rounded-full border border-slate-200 group-hover:border-slate-300" />
                      )}
                    </div>
                    <h4 className="font-extrabold text-sm text-slate-900 leading-snug">{preset.title}</h4>
                    <p className="text-[11px] font-medium text-slate-400 mt-0.5">{preset.subtitle}</p>
                    <p className="text-xs text-slate-500 mt-2 leading-relaxed">{preset.description}</p>
                  </div>

                  <div className="mt-3.5 pt-2.5 border-t border-slate-100 flex flex-col gap-2">
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-600">
                      <span>⏱️ {preset.duration}m</span>
                      <span>🎯 {preset.totalMarks}M</span>
                      <span className={preset.negativeMarks > 0 ? 'text-rose-600' : 'text-emerald-600'}>
                        {preset.negativeMarks > 0 ? `Neg: -${preset.negativeMarks}` : 'No Neg'}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectPattern(preset);
                      }}
                      className={`w-full py-1.5 px-2 rounded-xl text-[11px] font-black flex items-center justify-center gap-1.5 transition cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      <Settings2 size={13} />
                      <span>{isSelected ? '⚙️ Settings & Customize' : 'Select & Configure'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* STEP 2: INTEGRATED SETTINGS & BLUEPRINT CUSTOMIZER STUDIO */}
        <div className="rounded-3xl border-2 border-indigo-200/90 bg-slate-50/70 p-5 md:p-6 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-4 border-b border-slate-200">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                <Settings2 size={16} />
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                  Step 2: Settings & Blueprint Customizer
                </h4>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Currently Configuring: <strong className="text-indigo-600">{currentPreset.title}</strong> ({currentPreset.badge})
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleResetDefaults}
              className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="Reset all fields to template standard values"
            >
              <RefreshCw size={13} />
              <span>↺ Reset Defaults</span>
            </button>
          </div>

          {/* GROUP 1: EXAM TITLE, CLASS & SUBJECT */}
          <div className="space-y-4">
            <h5 className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Target size={14} className="text-indigo-600" />
              1. Basic Information & Target Batch
            </h5>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Exam Title */}
              <div className="md:col-span-1">
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                  Official Exam Title *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. 10th Class Grand Test - Mathematics"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-bold focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none text-xs"
                />
              </div>

              {/* Target Class */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                  Target Class Batch *
                </label>
                <select
                  value={formData.classId}
                  onChange={e => setFormData({ ...formData, classId: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-bold focus:border-indigo-500 outline-none text-xs cursor-pointer"
                >
                  {classes.length === 0 && <option value="">⏳ Loading classes...</option>}
                  {seniorClasses.length > 0 && (
                    <optgroup label="🌟 Senior Classes (10th, 9th, 8th)">
                      {seniorClasses.map(c => (
                        <option key={c.id} value={c.id}>Class {c.name} {c.section ? `(${c.section})` : ''}</option>
                      ))}
                    </optgroup>
                  )}
                  {otherClasses.length > 0 && (
                    <optgroup label="Middle & Primary Classes">
                      {otherClasses.map(c => (
                        <option key={c.id} value={c.id}>Class {c.name} {c.section ? `(${c.section})` : ''}</option>
                      ))}
                    </optgroup>
                  )}
                </select>
              </div>

              {/* Subject / Stream */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                  Subject / Stream *
                </label>
                <select
                  value={formData.subjectId}
                  onChange={e => setFormData({ ...formData, subjectId: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-bold focus:border-indigo-500 outline-none text-xs cursor-pointer"
                >
                  {subjects.length === 0 && <option value="">⏳ Loading subjects...</option>}
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* GROUP 2: DATE, START TIME & DURATION */}
          <div className="space-y-4 pt-2 border-t border-slate-200">
            <h5 className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Clock size={14} className="text-indigo-600" />
              2. Exam Schedule & Duration Controls
            </h5>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Exam Date */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase">Exam Date *</label>
                  <div className="flex items-center gap-1 text-[10px] font-bold">
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, examDate: new Date().toISOString().split('T')[0] }))}
                      className="text-indigo-600 hover:underline cursor-pointer"
                    >
                      Today
                    </button>
                    <span className="text-slate-300">•</span>
                    <button
                      type="button"
                      onClick={() => {
                        const tm = new Date();
                        tm.setDate(tm.getDate() + 1);
                        setFormData(prev => ({ ...prev, examDate: tm.toISOString().split('T')[0] }));
                      }}
                      className="text-indigo-600 hover:underline cursor-pointer"
                    >
                      Tomorrow
                    </button>
                  </div>
                </div>
                <input
                  type="date"
                  required
                  value={formData.examDate}
                  onChange={e => setFormData({ ...formData, examDate: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-bold outline-none text-xs cursor-pointer focus:border-indigo-500"
                />
              </div>

              {/* Start Time */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Start Time *</label>
                <input
                  type="time"
                  required
                  value={formData.startTime}
                  onChange={e => setFormData({ ...formData, startTime: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-bold outline-none text-xs cursor-pointer focus:border-indigo-500"
                />
              </div>

              {/* Duration with Quick Pills */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                  Duration: <strong className="text-indigo-600">{formData.duration} Mins</strong>
                </label>
                <input
                  type="number"
                  min={5}
                  required
                  value={formData.duration}
                  onChange={e => setFormData({ ...formData, duration: Number(e.target.value) })}
                  className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 font-bold outline-none text-xs focus:border-indigo-500"
                />
                {/* Duration Pills */}
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {[30, 45, 60, 90, 120, 180, 200].map(mins => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, duration: mins }))}
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition cursor-pointer ${
                        formData.duration === mins
                          ? 'bg-indigo-600 text-white'
                          : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {mins >= 60 ? `${mins / 60}h` : `${mins}m`}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* GROUP 3: MARKS PER QUESTION & NEGATIVE EVALUATION */}
          <div className="space-y-4 pt-2 border-t border-slate-200">
            <h5 className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Award size={14} className="text-indigo-600" />
              3. Marking Scheme & Negative Marking Settings
            </h5>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Marks Per Question */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                  Marks Per Question *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min={0.5}
                    step={0.5}
                    required
                    value={marksPerQuestion}
                    onChange={e => handleMarksPerQuestionChange(Number(e.target.value) || 1)}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-black outline-none text-xs focus:border-indigo-500"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400">
                    Marks / Q
                  </span>
                </div>
                {/* Marks Presets */}
                <div className="flex items-center gap-1 mt-1.5">
                  {[1, 2, 4].map(m => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => handleMarksPerQuestionChange(m)}
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition cursor-pointer ${
                        marksPerQuestion === m
                          ? 'bg-indigo-600 text-white'
                          : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      +{m} Mark
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-slate-400 font-medium mt-1">Each correct MCQ awards this score</p>
              </div>

              {/* Negative Marking Scheme */}
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                  Does this Exam have Negative Marking? *
                </label>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {/* Option 1: No Negative */}
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, negativeMarks: 0 }))}
                    className={`p-3 rounded-2xl border-2 text-left transition cursor-pointer flex items-center justify-between ${
                      formData.negativeMarks === 0
                        ? 'bg-emerald-50 border-emerald-500 shadow-xs ring-2 ring-emerald-500/10'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                        <span className="text-xs font-black text-slate-900">No Negative Marking (0)</span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-0.5">School Grand Test / SSC / Navodaya</p>
                    </div>
                    {formData.negativeMarks === 0 && <Check size={16} className="text-emerald-600 stroke-[3]" />}
                  </button>

                  {/* Option 2: Yes, Deduct */}
                  <div
                    onClick={() => {
                      if (formData.negativeMarks === 0) {
                        setFormData(prev => ({ ...prev, negativeMarks: 1 }));
                      }
                    }}
                    className={`p-3 rounded-2xl border-2 transition cursor-pointer flex flex-col justify-between ${
                      formData.negativeMarks > 0
                        ? 'bg-rose-50 border-rose-500 shadow-xs ring-2 ring-rose-500/10'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                        <span className="text-xs font-black text-slate-900">Yes, Deduct Marks</span>
                      </div>
                      {formData.negativeMarks > 0 && <Check size={16} className="text-rose-600 stroke-[3]" />}
                    </div>

                    {formData.negativeMarks > 0 ? (
                      <div className="flex items-center gap-2 mt-2 pt-2 border-t border-rose-200">
                        <span className="text-[10px] font-bold text-rose-800">Penalty / Q:</span>
                        <div className="flex items-center gap-1">
                          {[1, 0.25, 0.5].map(pen => (
                            <button
                              key={pen}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setFormData(prev => ({ ...prev, negativeMarks: pen }));
                              }}
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition cursor-pointer ${
                                formData.negativeMarks === pen
                                  ? 'bg-rose-600 text-white'
                                  : 'bg-white text-rose-700 border border-rose-200'
                              }`}
                            >
                              -{pen}
                            </button>
                          ))}
                        </div>
                        <input
                          type="number"
                          step={0.25}
                          min={0.1}
                          value={formData.negativeMarks}
                          onChange={e => setFormData(prev => ({ ...prev, negativeMarks: Math.max(0, Number(e.target.value)) }))}
                          className="w-14 px-1.5 py-0.5 bg-white border border-rose-300 rounded text-center text-[10px] font-black text-rose-800 outline-none"
                        />
                      </div>
                    ) : (
                      <p className="text-[10px] text-slate-500 mt-0.5">IIT-JEE (-1) / NEET (-1) Pattern</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Total Marks & Pass Marks Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                  Total Exam Marks * (Calculated: {totalQuestionsCount} Qs × {marksPerQuestion}M)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    required
                    value={formData.totalMarks}
                    onChange={e => setFormData({ ...formData, totalMarks: Number(e.target.value) })}
                    className="flex-1 px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-black outline-none text-xs focus:border-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={handleSyncTotalMarksFromSections}
                    className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer transition shrink-0"
                    title="Sync total marks with section sum"
                  >
                    Sync
                  </button>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase">Pass Marks *</label>
                  <div className="flex items-center gap-1 text-[10px] font-bold text-indigo-600">
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, passMarks: Math.round(prev.totalMarks * 0.35) }))}
                      className="hover:underline cursor-pointer"
                    >
                      35%
                    </button>
                    <span>•</span>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, passMarks: Math.round(prev.totalMarks * 0.40) }))}
                      className="hover:underline cursor-pointer"
                    >
                      40%
                    </button>
                    <span>•</span>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, passMarks: Math.round(prev.totalMarks * 0.50) }))}
                      className="hover:underline cursor-pointer"
                    >
                      50%
                    </button>
                  </div>
                </div>
                <input
                  type="number"
                  min={1}
                  required
                  value={formData.passMarks}
                  onChange={e => setFormData({ ...formData, passMarks: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-black outline-none text-xs focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* GROUP 4: SUBJECT SECTIONS & BLUEPRINT BUILDER */}
          <div className="space-y-4 pt-2 border-t border-slate-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h5 className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Sliders size={14} className="text-indigo-600" />
                  4. Subject Sections Blueprint Customizer
                </h5>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Configure question counts and marks for each subject or section
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-indigo-700 bg-white px-2.5 py-1 rounded-xl border border-slate-200">
                  Total: {totalQuestionsCount} Qs • {sections.reduce((a, s) => a + (Number(s.marks) || 0), 0)} Marks
                </span>
                <button
                  type="button"
                  onClick={handleAddSection}
                  className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black flex items-center gap-1 cursor-pointer transition shadow-xs"
                >
                  <Plus size={13} /> Add Section
                </button>
              </div>
            </div>

            <div className="space-y-2.5">
              {sections.map((sec, idx) => (
                <div
                  key={idx}
                  className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                >
                  <div className="flex-1 w-full sm:w-auto">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1 block">
                      Section #{idx + 1} Name
                    </span>
                    <input
                      type="text"
                      value={sec.name}
                      onChange={e => handleUpdateSection(idx, 'name', e.target.value)}
                      placeholder="e.g. Physics / Section A: Objective"
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-indigo-500 focus:bg-white"
                    />
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                    <div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1 block">
                        Questions
                      </span>
                      <input
                        type="number"
                        min={1}
                        value={sec.count}
                        onChange={e => handleUpdateSection(idx, 'count', Number(e.target.value) || 1)}
                        className="w-20 px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black text-slate-800 text-center outline-none focus:border-indigo-500 focus:bg-white"
                      />
                    </div>

                    <div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1 block">
                        Marks
                      </span>
                      <input
                        type="number"
                        min={1}
                        value={sec.marks}
                        onChange={e => handleUpdateSection(idx, 'marks', Number(e.target.value) || 1)}
                        className="w-20 px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black text-indigo-600 text-center outline-none focus:border-indigo-500 focus:bg-white"
                      />
                    </div>

                    <div className="pt-4 sm:pt-0">
                      <button
                        type="button"
                        onClick={() => handleRemoveSection(idx)}
                        disabled={sections.length <= 1}
                        className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer disabled:opacity-30"
                        title="Delete Section"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* LIVE BLUEPRINT REVIEW SUMMARY CARD */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[10px] font-black text-indigo-600 uppercase tracking-wider bg-indigo-50 px-2.5 py-0.5 rounded-md border border-indigo-200">
              Exam Summary Before Publishing
            </span>
            <h4 className="text-base font-black text-slate-900 mt-1">{formData.title || 'Untitled Exam'}</h4>
            <div className="flex flex-wrap items-center gap-3 text-xs font-bold text-slate-600 mt-1">
              <span>⏱️ {formData.duration} Mins</span>
              <span>•</span>
              <span>📝 {totalQuestionsCount} Questions</span>
              <span>•</span>
              <span>🎯 {formData.totalMarks} Total Marks</span>
              <span>•</span>
              <span>Pass: {formData.passMarks}M</span>
              <span>•</span>
              <span className={formData.negativeMarks > 0 ? 'text-rose-600' : 'text-emerald-600'}>
                {formData.negativeMarks > 0 ? `Neg: -${formData.negativeMarks}` : 'Zero Negative'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full md:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-3 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition cursor-pointer text-xs"
            >
              Cancel
            </button>
            
            <button
              type="submit"
              disabled={loading}
              className="px-7 py-3 rounded-xl font-extrabold text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-md shadow-indigo-500/25 transition flex items-center gap-2 cursor-pointer disabled:opacity-50 text-xs sm:text-sm hover:scale-[1.02]"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> Creating Exam...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 text-amber-300" /> Publish School Online Exam
                </>
              )}
            </button>
          </div>
        </div>

      </form>
    </div>
  );
};


// EXAM LAUNCH SUCCESS MODAL
// ═══════════════════════════════════════════════════════════════

const ExamLaunchSuccessModal = ({ exam, onClose, onLaunchExam, onOpenQuestionBank }: any) => {
  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white p-6 text-center relative">
          <div className="w-16 h-16 rounded-3xl bg-white/20 backdrop-blur-md flex items-center justify-center mx-auto mb-3 shadow-inner">
            <CheckCircle2 size={36} className="text-emerald-300" />
          </div>
          <h3 className="text-xl font-black">CBT Examination Published!</h3>
          <p className="text-xs text-indigo-100 mt-1">Configured for Eduracle Computer Based Testing</p>
        </div>

        <div className="p-6 space-y-4">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <p className="text-[10px] font-bold text-slate-400 uppercase">Exam Title</p>
            <h4 className="text-base font-black text-slate-900 mt-0.5">{exam?.title}</h4>
            <div className="flex items-center gap-4 text-xs text-slate-600 font-bold mt-2">
              <span>⏱️ {exam?.duration} Mins</span>
              <span>•</span>
              <span>🎯 {exam?.totalMarks} Marks</span>
              <span>•</span>
              <span className="text-rose-600">Neg: -{exam?.negativeMarks || 0}</span>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <button
              onClick={onLaunchExam}
              className="w-full py-3.5 px-4 rounded-xl text-white font-black text-xs shadow-lg bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.01]"
            >
              <Play className="w-4 h-4 fill-white" />
              Launch CBT Exam Simulator Now (Test Mode)
            </button>

            <button
              onClick={onOpenQuestionBank}
              className="w-full py-3 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <FileQuestion size={16} className="text-indigo-600" />
              View & Edit Questions in Question Bank
            </button>

            <button
              onClick={onClose}
              className="w-full py-2.5 text-slate-400 hover:text-slate-600 font-bold text-xs transition cursor-pointer"
            >
              Close & Back to Exams Directory
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// EXAM PAPER FULL PREVIEW MODAL (OFFICIAL QUESTION PAPER VIEW)
// ═══════════════════════════════════════════════════════════════

const ExamPaperPreviewModal: React.FC<{ exam: any; onClose: () => void; navigate: any }> = ({ exam, onClose, navigate }) => {
  const [loading, setLoading] = useState(true);
  const [populating, setPopulating] = useState(false);
  const [examData, setExamData] = useState<any>(exam);
  const [activeSection, setActiveSection] = useState<string>('ALL');
  const [isDoubleColumn, setIsDoubleColumn] = useState<boolean>(true);
  const [zoomLevel, setZoomLevel] = useState<number>(0.85);
  const [schoolLogo, setSchoolLogo] = useState<string>(() => localStorage.getItem('jy_school_logo') || '/logo.png');

  const loadDetails = async () => {
    try {
      const [res, settingsRes] = await Promise.all([
        api.get(`/api/competitive-exams/${exam.id}`),
        api.get('/api/settings').catch(() => null),
      ]);
      if (res.data?.data) {
        setExamData(res.data.data);
      }
      const sData = settingsRes?.data?.data || settingsRes?.data;
      if (sData?.schoolLogoUrl || sData?.logoUrl) {
        setSchoolLogo(sData.schoolLogoUrl || sData.logoUrl);
      }
    } catch (err) {
      console.warn('Failed to load full exam paper details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDetails();
  }, [exam.id]);

  const questions: any[] = examData?.questions || [];

  // Group chapters / subjects into sections
  const sections = Array.from(new Set(questions.map((q: any) => {
    if (!q.chapterName) return 'General';
    if (q.chapterName.includes(':')) return q.chapterName.split(':')[0].trim();
    return q.chapterName;
  })));

  const filteredQuestions = activeSection === 'ALL'
    ? questions
    : questions.filter((q: any) => {
        if (!q.chapterName) return activeSection === 'General';
        return q.chapterName.startsWith(activeSection) || q.chapterName.includes(activeSection);
      });

  // Convert questions into MCQ Paper Generator LiveLatexPreview format
  const formattedPaperContent = useMemo(() => {
    return filteredQuestions.map((q: any, qIdx: number) => {
      let parsedOptions: string[] = [];
      try {
        parsedOptions = typeof q.options === 'string' ? JSON.parse(q.options) : (q.options || []);
      } catch {
        parsedOptions = ['Option A', 'Option B', 'Option C', 'Option D'];
      }
      const optLetters = ['A', 'B', 'C', 'D', 'E', 'F'];
      const qBody = (q.questionText || '').trim();
      const imgPart = q.imageUrl ? `\n[IMAGE:${q.imageUrl}]` : '';
      const optsPart = parsedOptions
        .map((opt: string, idx: number) => `(${optLetters[idx] || idx + 1}) ${String(opt || '').trim()}`)
        .join('\n');
      return `${qIdx + 1}. ${qBody}${imgPart}\n${optsPart}`;
    }).join('\n\n');
  }, [filteredQuestions]);

  const paperInstructions = useMemo(() => [
    `This paper contains ${filteredQuestions.length} objective multiple choice questions.`,
    `Each correct answer carries +4 marks. Negative marking: -${examData?.negativeMarks || 1} mark for each wrong answer.`,
    `Rough calculations must be carried out on rough sheets only.`
  ], [filteredQuestions.length, examData?.negativeMarks]);

  const handlePopulateSample = async () => {
    setPopulating(true);
    try {
      await api.post(`/api/competitive-exams/${examData.id}/populate-sample`);
      toast.success('Sample NTA questions added successfully!');
      await loadDetails();
    } catch (e) {
      toast.error('Failed to auto-populate questions');
    } finally {
      setPopulating(false);
    }
  };

  const handlePrint = async () => {
    if (filteredQuestions.length === 0) {
      toast.error('No questions in paper to print');
      return;
    }
    await printPaper('a4-preview-paper');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-2 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-6xl w-full max-h-[94vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-indigo-600 via-indigo-700 to-blue-700 text-white flex items-center justify-between gap-4 shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-3 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-black uppercase tracking-wider border border-white/25">
                A4 Question Paper Preview (MCQ Format)
              </span>
              <span className="text-xs text-indigo-100 font-bold">Class: {examData.class?.name || '10th Standard'}</span>
            </div>
            <h2 className="text-lg sm:text-xl font-black tracking-tight text-white line-clamp-1">
              {examData.title}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {/* Column Toggle */}
            <button
              type="button"
              onClick={() => setIsDoubleColumn((v) => !v)}
              className="px-3 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer border border-white/20"
              title="Toggle 1-Column / 2-Column Layout"
            >
              <span>{isDoubleColumn ? '2 Columns' : '1 Column'}</span>
            </button>

            {/* Zoom Controls */}
            <div className="hidden sm:flex items-center bg-white/15 rounded-xl p-0.5 border border-white/20">
              <button
                type="button"
                onClick={() => setZoomLevel((z) => Math.max(0.5, Number((z - 0.1).toFixed(2))))}
                className="p-1.5 text-white hover:bg-white/20 rounded-lg cursor-pointer"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="text-[11px] font-bold px-1.5">{Math.round(zoomLevel * 100)}%</span>
              <button
                type="button"
                onClick={() => setZoomLevel((z) => Math.min(1.2, Number((z + 0.1).toFixed(2))))}
                className="p-1.5 text-white hover:bg-white/20 rounded-lg cursor-pointer"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              onClick={handlePrint}
              disabled={filteredQuestions.length === 0}
              className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black flex items-center gap-1.5 transition cursor-pointer shadow-sm disabled:opacity-50"
              title="Print Clean A4 Question Paper"
            >
              <Printer className="w-4 h-4" />
              <span>Print Paper</span>
            </button>
            <button
              onClick={() => {
                onClose();
                navigate(`/take-competitive-exam/${examData.id}`);
              }}
              className="px-4 py-2 rounded-xl bg-white text-indigo-700 hover:bg-indigo-50 text-xs font-black flex items-center gap-1.5 shadow transition cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-indigo-700" />
              <span className="hidden sm:inline">Launch CBT Exam</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-white/20 text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Paper Metadata Ribbon */}
        <div className="bg-slate-50 px-6 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs font-bold text-slate-600 shrink-0">
          <div className="flex items-center gap-4 sm:gap-6">
            <span>⏱️ Duration: <strong className="text-slate-900">{examData.duration} Mins</strong></span>
            <span>🎯 Total Marks: <strong className="text-indigo-600">{examData.totalMarks}</strong></span>
            <span>📝 Questions: <strong className="text-emerald-600">{questions.length}</strong></span>
            <span>⚖️ Marking: <strong className="text-rose-600">+4 / -{examData.negativeMarks || 1}</strong></span>
          </div>

          {/* Section filter tabs */}
          {sections.length > 1 && (
            <div className="flex items-center gap-1 overflow-x-auto py-1">
              <button
                onClick={() => setActiveSection('ALL')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                  activeSection === 'ALL'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                All Sections ({questions.length})
              </button>
              {sections.map((sec, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveSection(sec)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                    activeSection === sec
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
                  }`}
                >
                  {sec}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Paper Content / Live A4 MCQ Paper Preview */}
        <div className="p-4 sm:p-6 overflow-auto flex-1 bg-slate-200/70 flex justify-center items-start">
          {loading ? (
            <div className="py-20 text-center w-full">
              <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-3" />
              <p className="text-slate-500 font-bold text-sm">Loading complete question paper with KaTeX math rendering...</p>
            </div>
          ) : filteredQuestions.length === 0 ? (
            <div className="py-12 px-6 text-center bg-white rounded-3xl border border-dashed border-slate-300 max-w-xl mx-auto space-y-4 my-auto">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto shadow-xs">
                <FileQuestion className="w-7 h-7" />
              </div>
              <div>
                <h4 className="font-black text-slate-800 text-base sm:text-lg">No Questions in this Exam Paper Yet</h4>
                <p className="text-slate-500 text-xs mt-1 max-w-md mx-auto leading-relaxed">
                  This exam currently has 0 questions. You can auto-fill sample NTA questions, paste text from Word/PDF with Gemini AI, or add questions manually in the Studio.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
                <button
                  disabled={populating}
                  onClick={handlePopulateSample}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-extrabold text-xs flex items-center gap-1.5 shadow transition cursor-pointer disabled:opacity-50"
                >
                  {populating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles size={14} className="fill-white" />}
                  {populating ? 'Populating Questions...' : '✨ Auto-Fill Sample NTA Questions'}
                </button>
                <button
                  onClick={() => {
                    onClose();
                    navigate(`/competitive-exams/${examData.id}/paste-ai`);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-xs flex items-center gap-1.5 shadow transition cursor-pointer"
                >
                  <FileText size={14} /> 📄 Paste Exam Text (AI Parser)
                </button>
                <button
                  onClick={() => {
                    onClose();
                    navigate(`/competitive-question-bank?examId=${examData.id}`);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs flex items-center gap-1.5 shadow transition cursor-pointer"
                >
                  <Plus size={14} /> + Add Questions in Studio
                </button>
              </div>
            </div>
          ) : (
            <div
              style={{
                transform: `scale(${zoomLevel})`,
                transformOrigin: 'top center',
                transition: 'transform 0.15s ease-out',
              }}
              className="shrink-0 mb-10"
            >
              <LiveLatexPreview
                content={formattedPaperContent}
                examName={examData.title || 'COMPETITIVE EXAMINATION'}
                examClass={examData.class?.name || '10th Standard'}
                examSubject={activeSection !== 'ALL' ? activeSection : (examData.subject?.name || 'General')}
                maxMarks={String(examData.totalMarks || 100)}
                time={examData.duration ? `${examData.duration} Mins` : '180 Mins'}
                instructions={paperInstructions}
                logoBase64={schoolLogo}
                isDoubleColumn={isDoubleColumn}
                fontSize="medium"
                questionSpacing="normal"
                showHeader={true}
              />
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-white border-t border-slate-200 flex items-center justify-between shrink-0">
          <p className="text-xs text-slate-500 font-medium">
            Showing <strong className="text-slate-800">{filteredQuestions.length}</strong> of {questions.length} questions
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
            >
              Close Preview
            </button>
            <button
              onClick={() => {
                onClose();
                navigate(`/take-competitive-exam/${examData.id}`);
              }}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-xs shadow-md transition cursor-pointer flex items-center gap-1.5"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              Launch CBT Exam Now
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// QUESTION BANK TAB (SUBJECT-WISE, SEARCH, KATEX, AI PARSER)
// ═══════════════════════════════════════════════════════════════

const normalizeSubject = (chapterName: string = ''): string => {
  const lower = (chapterName || '').toLowerCase();
  if (lower.includes('math')) return 'Mathematics';
  if (lower.includes('phys')) return 'Physics';
  if (lower.includes('chem')) return 'Chemistry';
  if (lower.includes('bio') || lower.includes('botan') || lower.includes('zool')) return 'Biology';
  if (lower.includes('mental') || lower.includes('reason') || lower.includes('arith')) return 'Mental Ability';
  if (!chapterName || lower.includes('general')) return 'General';
  return chapterName.split(':')[0].trim();
};

const QuestionBankTab = ({ 
  exams, 
  selectedExamId, 
  setSelectedExamId, 
  onOpenAiModal, 
  onExamsUpdated,
  presetSubject,
  openBulkImportInitially,
  onConsumeBulkImportFlag,
  navigate 
}: any) => {
  const [bankSource, setBankSource] = useState<'MASTER' | 'EXAM'>('MASTER');
  const [questions, setQuestions] = useState<any[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [isAddingQuestion, setIsAddingQuestion] = useState(false);
  const [showAddMasterModal, setShowAddMasterModal] = useState(false);
  const [showMasterAiModal, setShowMasterAiModal] = useState(false);
  const [showExcelBulkModal, setShowExcelBulkModal] = useState(false);
  const [showPickFromBankModal, setShowPickFromBankModal] = useState(false);
  
  // Subject, Topic, Category & Search Filters
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedSubject, setSelectedSubject] = useState<string>(presetSubject || 'ALL');
  const [selectedTopic, setSelectedTopic] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('ALL');

  useEffect(() => {
    if (presetSubject) {
      setSelectedSubject(presetSubject);
      setSelectedTopic('ALL');
    }
  }, [presetSubject]);

  useEffect(() => {
    if (openBulkImportInitially) {
      setBankSource('MASTER');
      setShowExcelBulkModal(true);
      onConsumeBulkImportFlag?.();
    }
  }, [openBulkImportInitially]);

  const fetchMasterBank = async () => {
    setLoadingQuestions(true);
    try {
      const res = await api.get('/api/master-questions');
      const list = res.data?.data || res.data || [];
      setQuestions(Array.isArray(list) ? list : []);
    } catch (e) {
      toast.error('Failed to load Master Question Bank');
    } finally {
      setLoadingQuestions(false);
    }
  };

  const fetchQuestions = async (examId: string) => {
    if (bankSource === 'MASTER') {
      await fetchMasterBank();
      return;
    }

    if (!examId) {
      setQuestions([]);
      return;
    }

    if (examId === 'ALL') {
      const allQ = exams.flatMap((ex: any) => 
        (ex.questions || []).map((q: any) => ({
          ...q,
          examTitle: ex.title,
          examId: ex.id
        }))
      );
      setQuestions(allQ);
      return;
    }

    setLoadingQuestions(true);
    try {
      const res = await api.get(`/api/competitive-exams/${examId}`);
      setQuestions(res.data?.data?.questions || []);
    } catch (e) {
      console.error('Failed to load questions:', e);
      try {
        const res2 = await api.get(`/api/competitive-exams/${examId}/student`);
        setQuestions(res2.data?.data?.questions || []);
      } catch (err) {
        toast.error('Failed to load questions for selected exam');
      }
    } finally {
      setLoadingQuestions(false);
    }
  };

  useEffect(() => {
    if (bankSource === 'MASTER') {
      fetchMasterBank();
    } else if (selectedExamId) {
      fetchQuestions(selectedExamId);
    } else if (exams.length > 0) {
      setSelectedExamId(exams[0].id);
    } else {
      setQuestions([]);
    }
  }, [bankSource, selectedExamId, exams]);

  const activeExam = exams.find((e: any) => e.id === selectedExamId) || exams[0];

  // Compute subject distribution
  const subjectStats = useMemo(() => {
    const counts: Record<string, number> = {
      'ALL': questions.length,
      'Mathematics': 0,
      'Physics': 0,
      'Chemistry': 0,
      'Biology': 0,
      'General': 0,
    };

    questions.forEach((q: any) => {
      const sub = normalizeSubject(q.subjectName || q.chapterName);
      counts[sub] = (counts[sub] || 0) + 1;
    });

    return counts;
  }, [questions]);

  // Distinct subjects present
  const availableSubjects = useMemo(() => {
    const defaultList = ['ALL', 'Mathematics', 'Physics', 'Chemistry', 'Biology', 'General'];
    const extraSubjects = Object.keys(subjectStats).filter(s => !defaultList.includes(s) && subjectStats[s] > 0);
    return [...defaultList, ...extraSubjects];
  }, [subjectStats]);

  // Topic / Chapter breakdown for the selected Subject
  const topicStats = useMemo(() => {
    const map: Record<string, number> = {};
    questions.forEach((q: any) => {
      const qSub = normalizeSubject(q.subjectName || q.chapterName);
      if (selectedSubject !== 'ALL' && qSub !== selectedSubject) return;
      const rawTopic = (q.topicName || q.chapterName || 'General').trim();
      const topic = rawTopic.includes(':') ? rawTopic.split(':').slice(1).join(':').trim() || rawTopic : rawTopic;
      map[topic] = (map[topic] || 0) + 1;
    });
    return map;
  }, [questions, selectedSubject]);

  // Filtered Questions
  const filteredQuestions = useMemo(() => {
    return questions.filter((q: any) => {
      const qSubject = normalizeSubject(q.subjectName || q.chapterName);
      const matchesSubject = selectedSubject === 'ALL' || qSubject === selectedSubject;
      const rawTopic = (q.topicName || q.chapterName || 'General').trim();
      const qTopic = rawTopic.includes(':') ? rawTopic.split(':').slice(1).join(':').trim() || rawTopic : rawTopic;
      const matchesTopic = selectedTopic === 'ALL' || qTopic === selectedTopic;
      const matchesCategory = bankSource !== 'MASTER' || selectedCategory === 'ALL' || (q.category || 'GENERAL').toUpperCase() === selectedCategory;
      const matchesDifficulty = difficultyFilter === 'ALL' || (q.difficulty || 'MEDIUM').toUpperCase() === difficultyFilter.toUpperCase();
      const qText = (q.questionText || '').toLowerCase();
      const chText = (q.chapterName || '').toLowerCase();
      const subText = (q.subjectName || '').toLowerCase();
      const matchesSearch = !searchQuery.trim() || 
        qText.includes(searchQuery.toLowerCase()) || 
        chText.includes(searchQuery.toLowerCase()) ||
        subText.includes(searchQuery.toLowerCase());

      return matchesSubject && matchesTopic && matchesCategory && matchesDifficulty && matchesSearch;
    });
  }, [questions, selectedSubject, selectedTopic, selectedCategory, bankSource, difficultyFilter, searchQuery]);

  // If authoring mode is active for an exam, render the Dedicated Full Question Studio view
  if (isAddingQuestion && activeExam && bankSource === 'EXAM') {
    return (
      <DedicatedQuestionEditorView
        exam={activeExam}
        onBack={() => setIsAddingQuestion(false)}
        onSaved={(addAnother: boolean) => {
          fetchQuestions(selectedExamId);
          onExamsUpdated();
          if (!addAnother) {
            setIsAddingQuestion(false);
          }
        }}
      />
    );
  }

  // If AI text parser view is active, render the Dedicated Full AI Parser view
  if (isAiParsing && activeExam) {
    return (
      <DedicatedAiParserView
        exam={activeExam}
        onBack={() => setIsAiParsing(false)}
        onParsedAndAdded={() => {
          setIsAiParsing(false);
          fetchQuestions(selectedExamId);
          onExamsUpdated();
        }}
      />
    );
  }

  const handleDeleteQuestion = async (qId: string) => {
    if (!window.confirm('Are you sure you want to delete this question?')) return;
    try {
      if (bankSource === 'MASTER') {
        await api.delete(`/api/master-questions/${qId}`);
        toast.success('Deleted from Master Question Bank');
        await fetchMasterBank();
      } else {
        await api.delete(`/api/competitive-exams/question/${qId}`);
        toast.success('Removed from Exam');
        await fetchQuestions(selectedExamId);
      }
      onExamsUpdated();
    } catch (e) {
      toast.error('Failed to delete question');
    }
  };

  return (
    <div className="space-y-4">
      {/* Unified Clean Filter & Action Card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        {bankSource === 'EXAM' ? (
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3 pb-3 border-b border-slate-100">
            <div className="flex flex-wrap items-center gap-2.5 flex-1 w-full">
              <button
                type="button"
                onClick={() => setBankSource('MASTER')}
                className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
              >
                ← Master Bank
              </button>
              {exams.length > 0 && (
                <select
                  value={selectedExamId}
                  onChange={e => setSelectedExamId(e.target.value)}
                  className="w-full sm:w-auto min-w-[240px] px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 text-xs outline-none focus:border-indigo-500 focus:bg-white transition"
                >
                  <option value="ALL">All Exams ({exams.reduce((acc, ex) => acc + (ex._count?.questions || ex.questions?.length || 0), 0)})</option>
                  {exams.map((ex: any) => (
                    <option key={ex.id} value={ex.id}>
                      {ex.title} ({ex._count?.questions || ex.questions?.length || 0})
                    </option>
                  ))}
                </select>
              )}
            </div>

            {exams.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                {activeExam && (
                  <button
                    onClick={() => setShowPickFromBankModal(true)}
                    className="px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Database size={14} />
                    <span>Pick from Bank</span>
                  </button>
                )}
                <button
                  onClick={() => navigate(activeExam ? `/competitive-exams/${activeExam.id}/paste-ai` : '/competitive-exams/paste-ai')}
                  className="px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                >
                  <FileText size={14} />
                  <span>AI Parser</span>
                </button>
                <button
                  onClick={() => setIsAddingQuestion(true)}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                >
                  <Plus size={14} />
                  <span>Add Question</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          /* Clean Category + Action Bar */
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3.5 border-b border-slate-100">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1.5">Category</span>
              {['ALL', 'JEE', 'NEET', 'NAVODAYA', 'APPSC', 'SSC', 'SCHOOL'].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-50 text-slate-600 border border-slate-200/80 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  {cat === 'ALL' ? 'All' : cat === 'NAVODAYA' ? 'Navodaya' : cat === 'SCHOOL' ? 'School' : cat}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                onClick={() => navigate('/competitive-exams/bulk-import')}
                className="px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/90 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
              >
                <FileSpreadsheet size={14} />
                <span>Bulk Excel</span>
              </button>
              <button
                onClick={() => setShowMasterAiModal(true)}
                className="px-3.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/90 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
              >
                <FileText size={14} />
                <span>AI Parser</span>
              </button>
              <button
                onClick={() => setShowAddMasterModal(true)}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition cursor-pointer"
              >
                <Plus size={14} />
                <span>Add Question</span>
              </button>
            </div>
          </div>
        )}

        {/* Subject Pills Row */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-indigo-500" /> Subjects
            </span>
            <span className="text-xs font-semibold text-slate-500">
              Showing <strong className="text-slate-800">{filteredQuestions.length}</strong> of {questions.length}
            </span>
          </div>

          <div className="flex overflow-x-auto gap-2 pb-0.5 scrollbar-none">
            {availableSubjects.map((subName) => {
              const count = subjectStats[subName] || 0;
              const isSelected = selectedSubject === subName;

              const subjectColors: Record<string, { active: string; inactive: string }> = {
                'ALL': { active: 'bg-slate-800 text-white shadow-xs', inactive: 'bg-slate-50 text-slate-700 border border-slate-200/80 hover:bg-slate-100' },
                'Mathematics': { active: 'bg-blue-600 text-white shadow-xs', inactive: 'bg-blue-50/70 text-blue-700 border border-blue-200/70 hover:bg-blue-100/70' },
                'Physics': { active: 'bg-purple-600 text-white shadow-xs', inactive: 'bg-purple-50/70 text-purple-700 border border-purple-200/70 hover:bg-purple-100/70' },
                'Chemistry': { active: 'bg-emerald-600 text-white shadow-xs', inactive: 'bg-emerald-50/70 text-emerald-700 border border-emerald-200/70 hover:bg-emerald-100/70' },
                'Biology': { active: 'bg-rose-600 text-white shadow-xs', inactive: 'bg-rose-50/70 text-rose-700 border border-rose-200/70 hover:bg-rose-100/70' },
                'General': { active: 'bg-amber-600 text-white shadow-xs', inactive: 'bg-amber-50/70 text-amber-700 border border-amber-200/70 hover:bg-amber-100/70' },
              };

              const styling = subjectColors[subName] || { active: 'bg-slate-800 text-white', inactive: 'bg-slate-50 text-slate-700 border border-slate-200' };

              return (
                <button
                  key={subName}
                  onClick={() => {
                    setSelectedSubject(subName);
                    setSelectedTopic('ALL');
                  }}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 shrink-0 ${
                    isSelected ? styling.active : styling.inactive
                  }`}
                >
                  <span>{subName === 'ALL' ? 'All Subjects' : subName}</span>
                  <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold leading-none ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-white text-slate-600 border border-slate-200/70'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Topic Pills (shown when topics exist) */}
          {Object.keys(topicStats).length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pt-2 border-t border-slate-100 scrollbar-none">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-1 mr-1">
                <FolderOpen className="w-3.5 h-3.5 text-indigo-400" /> Topics
              </span>
              <button
                type="button"
                onClick={() => setSelectedTopic('ALL')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer shrink-0 ${
                  selectedTopic === 'ALL' ? 'bg-slate-800 text-white' : 'bg-slate-50 text-slate-600 border border-slate-200/80 hover:bg-slate-100'
                }`}
              >
                All Topics
              </button>
              {Object.entries(topicStats).map(([tName, tCount]) => (
                <button
                  key={tName}
                  type="button"
                  onClick={() => setSelectedTopic(tName)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer shrink-0 flex items-center gap-1 ${
                    selectedTopic === tName ? 'bg-indigo-600 text-white' : 'bg-indigo-50/70 text-indigo-700 hover:bg-indigo-100 border border-indigo-200/70'
                  }`}
                >
                  <span>{tName}</span>
                  <span className="opacity-75">({tCount})</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Search & Difficulty Row */}
        <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-1">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search questions, formulas, or topics..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-8 py-2.5 rounded-xl bg-slate-50/80 border border-slate-200 text-xs font-semibold text-slate-800 placeholder-slate-400 outline-none focus:border-indigo-500 focus:bg-white transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          <select
            value={difficultyFilter}
            onChange={e => setDifficultyFilter(e.target.value)}
            className="w-full sm:w-auto px-3.5 py-2.5 rounded-xl bg-slate-50/80 border border-slate-200 text-xs font-bold text-slate-700 outline-none focus:border-indigo-500 focus:bg-white transition cursor-pointer"
          >
            <option value="ALL">All Levels</option>
            <option value="EASY">Easy</option>
            <option value="MEDIUM">Medium</option>
            <option value="HARD">Hard</option>
          </select>
        </div>
      </div>

      {/* Questions List with KaTeX math formula rendering */}
      {loadingQuestions ? (
        <div className="p-16 flex flex-col items-center justify-center bg-white rounded-2xl border border-slate-200/80 shadow-xs">
          <RefreshCw className="w-7 h-7 animate-spin text-indigo-600 mb-2.5" />
          <p className="text-slate-500 font-semibold text-xs">Loading questions...</p>
        </div>
      ) : filteredQuestions.length === 0 ? (
        <div className="p-14 flex flex-col items-center justify-center text-center bg-white rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-center mb-3">
            <FileQuestion size={24} className="text-indigo-500" />
          </div>
          <h4 className="text-sm font-bold text-slate-800">
            {searchQuery || selectedSubject !== 'ALL' || selectedCategory !== 'ALL' || difficultyFilter !== 'ALL'
              ? 'No Questions Matching Selected Filters'
              : 'No Questions in Question Bank Yet'}
          </h4>
          <p className="text-xs text-slate-500 mt-1 max-w-sm leading-relaxed">
            {searchQuery || selectedSubject !== 'ALL' || selectedCategory !== 'ALL' || difficultyFilter !== 'ALL'
              ? 'Try changing the category, subject, or clearing your search query.'
              : 'Use + Add Question, AI Parser, or Bulk Excel above to add questions to your repository.'}
          </p>
          {(searchQuery || selectedSubject !== 'ALL' || selectedCategory !== 'ALL' || difficultyFilter !== 'ALL') && (
            <button
              onClick={() => {
                setSelectedCategory('ALL');
                setSelectedSubject('ALL');
                setSelectedTopic('ALL');
                setSearchQuery('');
                setDifficultyFilter('ALL');
              }}
              className="mt-4 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredQuestions.map((q: any, idx: number) => {
            let options: string[] = [];
            try {
              options = typeof q.options === 'string' ? JSON.parse(q.options) : (q.options || []);
            } catch (e) {
              options = ['Option A', 'Option B', 'Option C', 'Option D'];
            }

            const qSub = normalizeSubject(q.chapterName);
            const subBadgeColors: Record<string, string> = {
              'Mathematics': 'bg-blue-50 text-blue-700 border-blue-200',
              'Physics': 'bg-purple-50 text-purple-700 border-purple-200',
              'Chemistry': 'bg-emerald-50 text-emerald-700 border-emerald-200',
              'Biology': 'bg-rose-50 text-rose-700 border-rose-200',
              'General': 'bg-amber-50 text-amber-700 border-amber-200',
            };

            return (
              <div 
                key={q.id || idx} 
                className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200/90 hover:border-indigo-300 transition"
              >
                {/* Header row */}
                <div className="flex justify-between items-start gap-3 mb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-black text-xs flex items-center justify-center">
                      Q{idx + 1}
                    </span>
                    <span className={`text-xs font-black px-2.5 py-0.5 rounded-md border ${subBadgeColors[qSub] || 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                      {qSub}
                    </span>
                    {q.chapterName && q.chapterName !== qSub && (
                      <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                        {q.chapterName}
                      </span>
                    )}
                    <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                      {q.difficulty || 'MEDIUM'}
                    </span>
                    {q.category && (
                      <span className="text-[10px] font-black text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                        {q.category}
                      </span>
                    )}
                    {typeof q._count?.examQuestions === 'number' && (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        Used in {q._count.examQuestions} Exams
                      </span>
                    )}
                    {q.examTitle && (
                      <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                        Exam: {q.examTitle}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                      +{q.marks || 4} Marks
                    </span>
                    <button
                      onClick={() => handleDeleteQuestion(q.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                      title="Delete Question"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {/* Question Text with KaTeX Rendering */}
                <div className="text-sm font-bold text-slate-900 mb-3 whitespace-pre-wrap leading-relaxed pl-0.5">
                  <LatexRenderer text={q.questionText} />
                </div>

                {/* Image diagram if present */}
                {q.imageUrl && (
                  <div className="mb-3 p-2 bg-slate-50 border border-slate-200 rounded-xl inline-block">
                    <img src={q.imageUrl} alt="Diagram" className="max-h-48 object-contain rounded" />
                  </div>
                )}

                {/* Options 2x2 grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                  {options.map((opt: string, oIdx: number) => {
                    const isCorrect = String(opt).trim() === String(q.correctAnswer).trim() || String.fromCharCode(65 + oIdx) === String(q.correctAnswer).trim();
                    const optLetter = String.fromCharCode(65 + oIdx);

                    return (
                      <div
                        key={oIdx}
                        className={`p-3 rounded-xl border flex items-start gap-2.5 transition ${
                          isCorrect
                            ? 'bg-emerald-50/90 border-emerald-400 text-emerald-950 font-black ring-1 ring-emerald-400 shadow-xs'
                            : 'bg-slate-50/70 border-slate-200 text-slate-700 font-medium'
                        }`}
                      >
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${
                          isCorrect ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
                        }`}>
                          {optLetter}
                        </span>
                        <div className="flex-1 leading-snug">
                          <LatexRenderer text={opt} />
                        </div>
                        {isCorrect && (
                          <span className="text-[10px] uppercase font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full shrink-0 flex items-center gap-0.5">
                            <Check size={11} className="text-emerald-700" /> Correct
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Single Question to Master Bank Modal */}
      {showAddMasterModal && (
        <AddMasterQuestionModal
          onClose={() => setShowAddMasterModal(false)}
          onSaved={() => {
            setShowAddMasterModal(false);
            fetchMasterBank();
            onExamsUpdated();
          }}
        />
      )}

      {/* AI Text Parser for Master Bank Modal */}
      {showMasterAiModal && (
        <MasterAiParserModal
          onClose={() => setShowMasterAiModal(false)}
          onSaved={() => {
            setShowMasterAiModal(false);
            fetchMasterBank();
            onExamsUpdated();
          }}
        />
      )}

      {/* Excel / CSV Bulk Import Modal */}
      {showExcelBulkModal && (
        <ExcelBulkImportModal
          onClose={() => setShowExcelBulkModal(false)}
          onSaved={() => {
            setShowExcelBulkModal(false);
            fetchMasterBank();
            onExamsUpdated();
          }}
        />
      )}

      {/* Pick from Master Bank Modal */}
      {showPickFromBankModal && activeExam && (
        <PickFromMasterBankModal
          exam={activeExam}
          onClose={() => setShowPickFromBankModal(false)}
          onImported={() => {
            setShowPickFromBankModal(false);
            fetchQuestions(selectedExamId);
            onExamsUpdated();
          }}
        />
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// MASTER BANK MODALS (ADD, AI PARSE, PICK INTO EXAM)
// ═══════════════════════════════════════════════════════════════

const AddMasterQuestionModal: React.FC<{ onClose: () => void; onSaved: () => void }> = ({ onClose, onSaved }) => {
  const [rawInput, setRawInput] = useState('');
  const [category, setCategory] = useState('JEE');
  const [subjectName, setSubjectName] = useState('Mathematics');
  const [chapterName, setChapterName] = useState('General');
  const [difficulty, setDifficulty] = useState('MEDIUM');
  const [saving, setSaving] = useState(false);

  const parsed = useMemo(() => parseSingleRawQuestionAndOptions(rawInput), [rawInput]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!parsed.questionText.trim()) {
      toast.error('Please enter or paste a question with options');
      return;
    }
    setSaving(true);
    try {
      const correctOpt = parsed.options[parsed.correctAnswerIndex] || parsed.options[0] || 'A';
      await api.post('/api/master-questions', {
        category,
        subjectName,
        chapterName: chapterName.trim() || subjectName,
        difficulty,
        marks: 4,
        negativeMarks: 0,
        questionText: parsed.questionText,
        options: parsed.options,
        correctAnswer: correctOpt,
      });
      toast.success('Question saved permanently to Master Bank!');
      onSaved();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to save question');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl border border-slate-200">
        <div className="p-5 bg-gradient-to-r from-indigo-600 to-blue-700 text-white flex justify-between items-center">
          <div>
            <h3 className="text-lg font-black flex items-center gap-2">
              <Database className="w-5 h-5" /> Add Question to Central Master Bank
            </h3>
            <p className="text-xs text-indigo-100 mt-0.5">Saved permanently in PostgreSQL — reusable across any exam</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full cursor-pointer">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-4 overflow-y-auto flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-black text-slate-500 uppercase mb-1">Category</label>
              <select value={category} onChange={e => setCategory(e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800">
                {['JEE', 'NEET', 'NAVODAYA', 'APPSC', 'SSC', 'SCHOOL', 'GENERAL'].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-black text-slate-500 uppercase mb-1">Subject</label>
              <select value={subjectName} onChange={e => setSubjectName(e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800">
                {['Mathematics', 'Physics', 'Chemistry', 'Biology', 'Mental Ability', 'English', 'General'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-black text-slate-500 uppercase mb-1">Difficulty</label>
              <select value={difficulty} onChange={e => setDifficulty(e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800">
                <option value="EASY">Easy</option>
                <option value="MEDIUM">Medium</option>
                <option value="HARD">Hard</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-black text-slate-500 uppercase mb-1">Chapter / Topic</label>
            <input type="text" value={chapterName} onChange={e => setChapterName(e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800" placeholder="e.g. Quadratic Equations" />
          </div>

          <div>
            <label className="block text-[11px] font-black text-slate-500 uppercase mb-1">Paste Question + Options + Answer Key *</label>
            <textarea
              rows={7}
              value={rawInput}
              onChange={e => setRawInput(e.target.value)}
              className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-mono text-slate-800 focus:bg-white focus:border-indigo-500 outline-none"
              placeholder={"1. If $x^2 - 5x + 6 = 0$, find the roots.\n(A) 2, 3\n(B) 1, 6\n(C) -2, -3\n(D) 3, 4\nAns: A"}
              required
            />
          </div>

          {parsed.questionText && (
            <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-200 space-y-2">
              <div className="text-[11px] font-black text-indigo-700 uppercase">Live KaTeX Preview</div>
              <div className="text-sm font-bold text-slate-900"><LatexRenderer text={parsed.questionText} /></div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {parsed.options.map((opt, i) => (
                  <div key={i} className={`p-2 rounded-xl border ${i === parsed.correctAnswerIndex ? 'bg-emerald-50 border-emerald-400 font-bold text-emerald-900' : 'bg-white border-slate-200'}`}>
                    <strong>({String.fromCharCode(65 + i)})</strong> <LatexRenderer text={opt || '-'} />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
            <button type="button" onClick={onClose} className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer">Cancel</button>
            <button type="submit" disabled={saving} className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black cursor-pointer disabled:opacity-50">
              {saving ? 'Saving...' : 'Save to Master Bank'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const MasterAiParserModal: React.FC<{ onClose: () => void; onSaved: () => void }> = ({ onClose, onSaved }) => {
  const [rawText, setRawText] = useState('');
  const [category, setCategory] = useState('JEE');
  const [subjectName, setSubjectName] = useState('Mathematics');
  const [chapterName, setChapterName] = useState('General');
  const [parsing, setParsing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [parsedQuestions, setParsedQuestions] = useState<any[]>([]);

  const handleParse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawText.trim()) return;
    setParsing(true);
    try {
      const res = await api.post('/api/master-questions/ai-parse-text', {
        rawText,
        defaultMarks: 4,
        chapterName: `${subjectName}: ${chapterName}`,
      });
      setParsedQuestions(res.data?.questions || []);
      toast.success(`Extracted ${res.data?.questions?.length || 0} questions!`);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to parse text');
    } finally {
      setParsing(false);
    }
  };

  const handleSaveAll = async () => {
    if (parsedQuestions.length === 0) return;
    setSaving(true);
    try {
      await api.post('/api/master-questions/bulk', {
        questions: parsedQuestions,
        category,
        subjectName,
      });
      toast.success(`Saved ${parsedQuestions.length} questions permanently to DB!`);
      onSaved();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to save questions');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl border border-slate-200">
        <div className="p-5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white flex justify-between items-center">
          <div>
            <h3 className="text-lg font-black">AI Smart Text Parser → Master Question Bank</h3>
            <p className="text-xs text-emerald-100 mt-0.5">Paste multiple questions and save them permanently to PostgreSQL</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full cursor-pointer"><X size={20} /></button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {parsedQuestions.length === 0 ? (
            <form onSubmit={handleParse} className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <select value={category} onChange={e => setCategory(e.target.value)} className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800">
                  {['JEE', 'NEET', 'NAVODAYA', 'APPSC', 'SSC', 'SCHOOL', 'GENERAL'].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <select value={subjectName} onChange={e => setSubjectName(e.target.value)} className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800">
                  {['Mathematics', 'Physics', 'Chemistry', 'Biology', 'Mental Ability', 'English', 'General'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <input type="text" value={chapterName} onChange={e => setChapterName(e.target.value)} placeholder="Chapter" className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800" />
              </div>
              <textarea
                rows={9}
                value={rawText}
                onChange={e => setRawText(e.target.value)}
                className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-mono text-slate-800"
                placeholder="Paste 10-50 MCQ questions here..."
                required
              />
              <div className="flex justify-end gap-2">
                <button type="button" onClick={onClose} className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold cursor-pointer">Cancel</button>
                <button type="submit" disabled={parsing} className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black cursor-pointer disabled:opacity-50">
                  {parsing ? 'Parsing with Gemini AI...' : '⚡ Parse Questions'}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-3">
              <div className="flex justify-between items-center bg-emerald-50 p-3 rounded-xl border border-emerald-200">
                <span className="text-xs font-black text-emerald-800">{parsedQuestions.length} Questions Ready to Save</span>
                <button onClick={() => setParsedQuestions([])} className="text-xs font-bold text-emerald-700 underline cursor-pointer">Back</button>
              </div>
              {parsedQuestions.map((q, i) => (
                <div key={i} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                  <div className="font-bold text-slate-900">Q{i + 1}. <LatexRenderer text={q.questionText} /></div>
                </div>
              ))}
              <div className="flex justify-end gap-2 pt-2">
                <button onClick={onClose} className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold cursor-pointer">Cancel</button>
                <button onClick={handleSaveAll} disabled={saving} className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black cursor-pointer disabled:opacity-50">
                  {saving ? 'Saving to DB...' : `Save All (${parsedQuestions.length}) to Master Bank`}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const PickFromMasterBankModal: React.FC<{ exam: any; onClose: () => void; onImported: () => void }> = ({ exam, onClose, onImported }) => {
  const [bankList, setBankList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    api.get('/api/master-questions')
      .then(res => setBankList(res.data?.data || res.data || []))
      .catch(() => toast.error('Failed to load Master Question Bank'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return bankList;
    const q = search.toLowerCase();
    return bankList.filter(item =>
      (item.questionText || '').toLowerCase().includes(q) ||
      (item.chapterName || '').toLowerCase().includes(q) ||
      (item.subjectName || '').toLowerCase().includes(q) ||
      (item.category || '').toLowerCase().includes(q)
    );
  }, [bankList, search]);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleImport = async () => {
    if (selectedIds.length === 0) return;
    setImporting(true);
    try {
      await api.post(`/api/competitive-exams/${exam.id}/import-from-bank`, { masterQuestionIds: selectedIds });
      toast.success(`Imported ${selectedIds.length} questions into ${exam.title}!`);
      onImported();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to import questions');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl border border-slate-200">
        <div className="p-5 bg-gradient-to-r from-amber-500 to-orange-500 text-white flex justify-between items-center">
          <div>
            <h3 className="text-lg font-black">Pick Questions from Central Master Bank</h3>
            <p className="text-xs text-amber-100 mt-0.5">Target Exam: {exam.title}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full cursor-pointer"><X size={20} /></button>
        </div>

        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by question, subject, chapter, category..."
            className="flex-1 px-4 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-800 outline-none focus:border-indigo-500"
          />
          <button
            type="button"
            onClick={() => setSelectedIds(filtered.map(q => q.id))}
            className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-indigo-600 cursor-pointer"
          >
            Select All ({filtered.length})
          </button>
        </div>

        <div className="p-4 overflow-y-auto flex-1 space-y-2.5 bg-slate-50">
          {loading ? (
            <div className="py-12 text-center text-xs font-bold text-slate-500">Loading Master Question Bank...</div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-xs font-bold text-slate-500">No questions found in Master Bank.</div>
          ) : (
            filtered.map((q) => {
              const checked = selectedIds.includes(q.id);
              return (
                <div
                  key={q.id}
                  onClick={() => toggleSelect(q.id)}
                  className={`p-4 rounded-2xl border cursor-pointer transition flex items-start gap-3 ${
                    checked ? 'bg-indigo-50 border-indigo-400' : 'bg-white border-slate-200 hover:border-indigo-300'
                  }`}
                >
                  <input type="checkbox" checked={checked} readOnly className="mt-1 w-4 h-4 text-indigo-600 rounded" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-black px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">{q.category || 'GENERAL'}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">{q.subjectName || q.chapterName}</span>
                      <span className="text-[10px] font-bold text-slate-500">{q.difficulty}</span>
                    </div>
                    <div className="text-xs font-bold text-slate-800 line-clamp-2"><LatexRenderer text={q.questionText} /></div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="p-4 bg-white border-t border-slate-200 flex justify-between items-center">
          <span className="text-xs font-bold text-slate-600">Selected: <strong className="text-indigo-600">{selectedIds.length}</strong> questions</span>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold cursor-pointer">Cancel</button>
            <button
              onClick={handleImport}
              disabled={importing || selectedIds.length === 0}
              className="px-6 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black cursor-pointer disabled:opacity-50"
            >
              {importing ? 'Importing...' : `Import (${selectedIds.length}) to Exam`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const SubjectWiseQuestionBankTab = QuestionBankTab;

// ═══════════════════════════════════════════════════════════════
// DEDICATED QUESTION STUDIO & UNIFIED OPTIONS EDITOR
// ═══════════════════════════════════════════════════════════════

export const parseSingleRawQuestionAndOptions = (raw: string) => {
  if (!raw || !raw.trim()) {
    return {
      questionText: '',
      options: ['', '', '', ''],
      correctAnswerIndex: 0,
      detectedAnswerKey: '',
    };
  }

  const lines = raw.split('\n');
  const qTextLines: string[] = [];
  const letterMap: Record<string, string> = {};
  let currentOptKey = '';
  let detectedAnsLetter = '';

  const optRegex = /^\s*(?:\(?([A-Da-d])\)?[\.\:\-\)]|\bOption\s+([A-Da-d])[\.\:\-\)]?)\s*(.*)$/i;
  const ansRegex = /^\s*(?:Ans(?:wer)?|Key|Correct(?:\s*Answer)?)\s*[:=\-]?\s*\(?([A-Da-d1-4])\)?/i;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      if (!currentOptKey) qTextLines.push('');
      continue;
    }

    const ansMatch = trimmed.match(ansRegex);
    if (ansMatch) {
      detectedAnsLetter = ansMatch[1].toUpperCase();
      continue;
    }

    const optMatch = trimmed.match(optRegex);
    if (optMatch) {
      const letter = (optMatch[1] || optMatch[2]).toUpperCase();
      currentOptKey = letter;
      letterMap[currentOptKey] = optMatch[3] || '';
    } else if (currentOptKey) {
      letterMap[currentOptKey] += ' ' + trimmed;
    } else {
      qTextLines.push(trimmed);
    }
  }

  let questionText = qTextLines.join('\n').trim();
  questionText = questionText.replace(/^(?:Q(?:uestion)?\s*\d+[\.\:\-\)]|\d+[\.\:\-\)])\s*/i, '');

  const options = [
    (letterMap['A'] || '').trim(),
    (letterMap['B'] || '').trim(),
    (letterMap['C'] || '').trim(),
    (letterMap['D'] || '').trim(),
  ];

  let correctAnswerIndex = 0;
  if (detectedAnsLetter) {
    if (['A', '1'].includes(detectedAnsLetter)) correctAnswerIndex = 0;
    else if (['B', '2'].includes(detectedAnsLetter)) correctAnswerIndex = 1;
    else if (['C', '3'].includes(detectedAnsLetter)) correctAnswerIndex = 2;
    else if (['D', '4'].includes(detectedAnsLetter)) correctAnswerIndex = 3;
  }

  return { questionText, options, correctAnswerIndex, detectedAnswerKey: detectedAnsLetter };
};

const DedicatedQuestionEditorView = SingleRawBoxQuestionStudio;

// ═══════════════════════════════════════════════════════════════
// DASHBOARD OVERVIEW TAB
// ═══════════════════════════════════════════════════════════════

const DashboardOverviewTab = ({ exams, totalQuestions, totalSubmissions, onOpenCreate, onPreviewPaper, navigate }: any) => {
  return (
    <div className="space-y-6">
      {/* Quick Launch Hero */}
      <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <h2 className="text-xl font-black text-slate-900">Eduracle CBT Simulator & School Online Exams</h2>
          <p className="text-sm text-slate-500 mt-1 max-w-xl">
            Conduct authentic School Grand Tests, SSC Board, and IIT-JEE / NEET Foundation objective exams online with automated timers, negative marks deduction, and live leaderboards.
          </p>
          <div className="flex flex-wrap items-center gap-3 mt-4">
            <button
              onClick={onOpenCreate}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs flex items-center gap-2 shadow-md transition cursor-pointer"
            >
              <Plus size={16} /> + Create School Online Exam
            </button>
            {exams.length > 0 && (
              <button
                onClick={() => navigate(`/take-competitive-exam/${exams[0].id}`)}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-extrabold text-xs flex items-center gap-2 shadow-md transition cursor-pointer"
              >
                <Play size={16} className="fill-white" /> Launch CBT Simulator
              </button>
            )}
          </div>
        </div>

        <div className="w-full md:w-auto p-4 rounded-2xl bg-slate-50 border border-slate-100 grid grid-cols-2 gap-4 text-center">
          <div>
            <div className="text-2xl font-black text-indigo-600">{exams.length}</div>
            <div className="text-[11px] font-bold text-slate-500 uppercase">Scheduled Exams</div>
          </div>
          <div>
            <div className="text-2xl font-black text-emerald-600">{totalQuestions}</div>
            <div className="text-[11px] font-bold text-slate-500 uppercase">Total MCQs</div>
          </div>
        </div>
      </div>

      {/* Live Available Exams Grid */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-black text-slate-900">Active Online Exams & Papers ({exams.length})</h3>
            <p className="text-xs text-slate-500 font-medium">Click "Launch CBT Exam" to start the computer-based test or "View Paper" to preview questions</p>
          </div>
          {exams.length > 0 && (
            <button
              onClick={onOpenCreate}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow flex items-center gap-1.5 cursor-pointer"
            >
              <Plus size={14} /> New Exam
            </button>
          )}
        </div>

        {exams.length === 0 ? (
          <div className="p-10 text-center bg-white rounded-3xl border border-slate-200 shadow-sm">
            <Award className="w-12 h-12 text-indigo-500 mx-auto mb-3" />
            <h4 className="text-lg font-black text-slate-800">No School Online Exams Created Yet</h4>
            <p className="text-slate-500 text-xs mt-1 max-w-md mx-auto">
              Create an authentic online examination for your school classes. Configure custom subjects, add question blueprints, and launch live computer-based tests.
            </p>
            <div className="flex items-center justify-center gap-3 mt-4">
              <button
                onClick={onOpenCreate}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl shadow-md cursor-pointer inline-flex items-center gap-2 transition hover:scale-105"
              >
                <Plus className="w-4 h-4" /> + Create First School Exam
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {exams.map((exam: any) => {
              const qCount = exam._count?.questions || exam.questions?.length || 0;
              const isNeet = (exam.title || '').toUpperCase().includes('NEET');

              return (
                <div key={exam.id} className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border ${
                        isNeet ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-indigo-100 text-indigo-800 border-indigo-200'
                      }`}>
                        {isNeet ? 'NEET UG PATTERN (+4, -1)' : 'JEE MAINS PATTERN (+4, -1)'}
                      </span>
                      <span className="text-xs font-extrabold text-emerald-600 flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Active
                      </span>
                    </div>
                    <h4 className="text-base font-black text-slate-900">{exam.title}</h4>
                    <div className="flex items-center gap-4 text-xs font-bold text-slate-500 my-3">
                      <span>⏱️ {exam.duration}m</span>
                      <span>🎯 {exam.totalMarks} Marks</span>
                      <span>📝 {qCount} Questions</span>
                      <span className="text-rose-600">Neg: -{exam.negativeMarks || 1}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100">
                    <button
                      onClick={() => navigate(`/competitive-exams/${exam.id}/paper`)}
                      className="py-2.5 px-3 rounded-xl bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 text-slate-800 hover:text-indigo-700 font-black text-xs flex items-center justify-center gap-1.5 shadow-xs transition cursor-pointer"
                    >
                      <Eye className="w-4 h-4 text-indigo-600" /> View Paper
                    </button>
                    <button
                      onClick={() => navigate(`/take-competitive-exam/${exam.id}`)}
                      className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow transition cursor-pointer"
                    >
                      <Play className="w-4 h-4 fill-white" /> Launch CBT Exam
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Feature Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
            <Zap className="w-5 h-5" />
          </div>
          <h3 className="text-base font-black text-slate-800">CBT Live Engine</h3>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Full-screen proctored environment preventing tab switches, multi-tab access, with real-time countdown clock and NTA 5-color status palette.
          </p>
        </div>

        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
            <Sparkles className="w-5 h-5" />
          </div>
          <h3 className="text-base font-black text-slate-800">AI Question Synthesizer</h3>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            AI-powered automated MCQ generator with LaTeX math formulas, negative marks, and difficulty tiering (Easy, Medium, Hard).
          </p>
        </div>

        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm">
          <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
            <Award className="w-5 h-5" />
          </div>
          <h3 className="text-base font-black text-slate-800">Instant Automated Ranking</h3>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Zero teacher evaluation burden. Immediate scoring with negative deduction (+4, -1), tie-breaker time analytics, and PDF leaderboard export.
          </p>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// RESULTS & RANKS TAB (PER-EXAM & ALL-EXAM DETAILED SCORECARDS)
// ═══════════════════════════════════════════════════════════════

const ResultsAndRanksTab = ({ exams, navigate }: any) => {
  const [selectedExamId, setSelectedExamId] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Extract all submissions across all exams or selected exam
  const allSubmissions = useMemo(() => {
    const list: any[] = [];
    exams.forEach((ex: any) => {
      if (selectedExamId !== 'ALL' && ex.id !== selectedExamId) return;
      (ex.submissions || []).forEach((sub: any) => {
        list.push({
          ...sub,
          examId: ex.id,
          examTitle: ex.title,
          examTotalMarks: ex.totalMarks || 300,
          examDuration: ex.duration || 180,
          studentName: sub.student?.user?.name || 'Student',
          studentPhoto: sub.student?.user?.photoUrl,
          studentRollNo: sub.student?.rollNo || '-',
          studentClass: sub.student?.class ? `${sub.student.class.name} ${sub.student.class.section ? `(${sub.student.class.section})` : ''}` : '-',
        });
      });
    });

    // Sort by marksObtained descending, then time taken ascending (official tie-breaker)
    return list.sort((a, b) => {
      if (b.marksObtained !== a.marksObtained) {
        return (b.marksObtained || 0) - (a.marksObtained || 0);
      }
      return (a.totalTimeTaken || 0) - (b.totalTimeTaken || 0);
    });
  }, [exams, selectedExamId]);

  const filteredSubmissions = useMemo(() => {
    if (!searchQuery.trim()) return allSubmissions;
    const q = searchQuery.toLowerCase();
    return allSubmissions.filter((sub: any) => 
      sub.studentName.toLowerCase().includes(q) ||
      sub.studentRollNo.toLowerCase().includes(q) ||
      sub.examTitle.toLowerCase().includes(q) ||
      sub.studentClass.toLowerCase().includes(q)
    );
  }, [allSubmissions, searchQuery]);

  // Statistics
  const totalSubmissionsCount = allSubmissions.length;
  const highestScore = totalSubmissionsCount > 0 ? Math.max(...allSubmissions.map(s => s.marksObtained || 0)) : 0;
  const averageScore = totalSubmissionsCount > 0 ? Math.round(allSubmissions.reduce((acc, s) => acc + (s.marksObtained || 0), 0) / totalSubmissionsCount) : 0;
  const topStudent = totalSubmissionsCount > 0 ? allSubmissions[0]?.studentName : '-';

  const formatTime = (secs: number) => {
    if (!secs) return '0m';
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
  };

  const getRankBadge = (index: number) => {
    if (index === 0) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-100 text-amber-800 font-black text-xs border border-amber-300 shadow-xs shrink-0">
          <Trophy className="w-3.5 h-3.5 text-amber-600 fill-amber-500" /> #1 Rank
        </span>
      );
    }
    if (index === 1) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-200 text-slate-800 font-black text-xs border border-slate-300 shadow-xs shrink-0">
          <Award className="w-3.5 h-3.5 text-slate-600" /> #2 Rank
        </span>
      );
    }
    if (index === 2) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-700/10 text-amber-900 font-black text-xs border border-amber-600/30 shadow-xs shrink-0">
          <Award className="w-3.5 h-3.5 text-amber-700" /> #3 Rank
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-slate-100 text-slate-600 font-bold text-xs border border-slate-200 shrink-0">
        #{index + 1}
      </span>
    );
  };

  return (
    <div className="space-y-5">
      {/* KPI Stats Ribbon */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total Submissions</div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 mt-1">{totalSubmissionsCount}</div>
          <div className="text-[11px] text-slate-500 font-semibold mt-0.5">Tests Completed</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="text-[10px] font-black uppercase tracking-wider text-emerald-600">Top / Highest Score</div>
          <div className="text-xl sm:text-2xl font-black text-emerald-600 mt-1">{highestScore}</div>
          <div className="text-[11px] text-slate-500 font-semibold mt-0.5 truncate">Topper: {topStudent}</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="text-[10px] font-black uppercase tracking-wider text-indigo-600">Average Score</div>
          <div className="text-xl sm:text-2xl font-black text-indigo-600 mt-1">{averageScore}</div>
          <div className="text-[11px] text-slate-500 font-semibold mt-0.5">Class Mean Performance</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="text-[10px] font-black uppercase tracking-wider text-purple-600">Exam Coverage</div>
          <div className="text-xl sm:text-2xl font-black text-purple-600 mt-1">{exams.length}</div>
          <div className="text-[11px] text-slate-500 font-semibold mt-0.5">Online Exams Active</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/90 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex-1 w-full sm:w-auto">
          <label className="block text-[11px] font-black text-slate-500 uppercase tracking-wider mb-1.5">
            Filter by Exam
          </label>
          <select
            value={selectedExamId}
            onChange={e => setSelectedExamId(e.target.value)}
            className="w-full sm:max-w-md p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-black text-slate-800 text-xs sm:text-sm outline-none focus:border-indigo-500 focus:bg-white transition"
          >
            <option value="ALL">All Competitive Exams ({exams.reduce((acc, ex) => acc + (ex._count?.submissions || ex.submissions?.length || 0), 0)} Total Submissions)</option>
            {exams.map((ex: any) => {
              const subCount = ex._count?.submissions || ex.submissions?.length || 0;
              return (
                <option key={ex.id} value={ex.id}>
                  {ex.title} ({subCount} Submissions)
                </option>
              );
            })}
          </select>
        </div>

        <div className="w-full sm:w-72">
          <label className="block text-[11px] font-black text-slate-500 uppercase tracking-wider mb-1.5">
            Search Student
          </label>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by student, roll no, class..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 placeholder-slate-400 outline-none focus:border-indigo-500 focus:bg-white transition"
            />
          </div>
        </div>
      </div>

      {/* Results List */}
      {filteredSubmissions.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200/90 shadow-xs space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center mx-auto shadow-xs">
            <Award className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-black text-slate-800">
              {searchQuery ? 'No Submissions Matching Search' : 'No Test Submissions Yet'}
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 leading-relaxed">
              {searchQuery
                ? 'Try a different student name or roll number.'
                : 'Students who submit their CBT online tests will appear here instantly with marks, ranks, and full scorecards.'}
            </p>
          </div>
          {exams.length > 0 && (
            <div className="pt-2">
              <button
                onClick={() => navigate(`/take-competitive-exam/${exams[0].id}`)}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-xs shadow-md transition cursor-pointer inline-flex items-center gap-2"
              >
                <Play className="w-3.5 h-3.5 fill-white" /> Launch CBT Exam Test
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200/90 overflow-hidden shadow-xs">
          <div className="px-6 py-4 bg-slate-50 border-b border-slate-200/90 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-slate-800 uppercase tracking-wider">
                Exam Submissions & Ranks
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-indigo-100 text-indigo-700">
                {filteredSubmissions.length} Records
              </span>
            </div>
            {selectedExamId !== 'ALL' && (
              <button
                onClick={() => navigate(`/competitive-exam-leaderboard/${selectedExamId}`)}
                className="text-xs font-black text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
              >
                <Trophy size={14} className="text-amber-500" /> View Full Leaderboard
              </button>
            )}
          </div>

          <div className="divide-y divide-slate-100">
            {filteredSubmissions.map((sub: any, idx: number) => {
              const pct = sub.examTotalMarks > 0 ? Math.round(((sub.marksObtained || 0) / sub.examTotalMarks) * 100) : 0;
              const isPassing = pct >= 40;

              return (
                <div 
                  key={sub.id || idx} 
                  className="p-4 sm:p-5 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 hover:bg-slate-50/80 transition"
                >
                  {/* Left: Rank & Student Profile */}
                  <div className="flex items-center gap-3.5 min-w-0">
                    {getRankBadge(idx)}

                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-xs overflow-hidden">
                      {sub.studentPhoto ? (
                        <img src={sub.studentPhoto} alt={sub.studentName} className="w-full h-full object-cover" />
                      ) : (
                        sub.studentName.charAt(0).toUpperCase()
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-black text-slate-900 text-sm sm:text-base truncate">
                          {sub.studentName}
                        </h4>
                        <span className="px-2 py-0.2 rounded-md bg-slate-100 text-slate-600 font-bold text-[10px]">
                          Roll: {sub.studentRollNo}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500 font-medium mt-0.5">
                        <span className="font-bold text-slate-700">Class: {sub.studentClass}</span>
                        <span>•</span>
                        <span className="text-indigo-600 font-bold truncate">{sub.examTitle}</span>
                      </div>
                    </div>
                  </div>

                  {/* Middle: Score, Time & Percentage */}
                  <div className="flex items-center gap-4 sm:gap-6 w-full lg:w-auto justify-between lg:justify-end">
                    <div className="text-center sm:text-right">
                      <div className="text-[10px] text-slate-400 font-bold uppercase">Marks Obtained</div>
                      <div className="text-base sm:text-lg font-black text-slate-900">
                        <span className={sub.marksObtained >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                          {sub.marksObtained}
                        </span>
                        <span className="text-xs text-slate-400 font-bold"> / {sub.examTotalMarks}</span>
                      </div>
                      <div className="flex items-center gap-1.5 justify-center sm:justify-end mt-0.5">
                        <span className={`px-1.5 py-0.2 rounded text-[10px] font-black ${
                          isPassing ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                        }`}>
                          {pct}%
                        </span>
                        <span className="text-[10px] text-slate-400 font-semibold">
                          ⏱️ {formatTime(sub.totalTimeTaken)}
                        </span>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => navigate(`/competitive-exam-result/${sub.examId}?submissionId=${sub.id}`)}
                        className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs shadow-xs transition cursor-pointer flex items-center gap-1.5"
                      >
                        <Award size={14} />
                        <span>View Scorecard</span>
                      </button>
                      <button
                        onClick={() => navigate(`/competitive-exam-leaderboard/${sub.examId}`)}
                        className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 transition cursor-pointer"
                        title="View Exam Leaderboard"
                      >
                        <Trophy size={15} className="text-amber-500" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// ACTIVE STUDENTS TAB (PARTICIPATING STUDENTS DIRECTORY)
// ═══════════════════════════════════════════════════════════════

const ActiveStudentsTab = ({ exams, navigate }: any) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState<string>('ALL');

  // Compute Active Students across all exams
  const studentMap = useMemo(() => {
    const map = new Map<string, any>();
    exams.forEach((ex: any) => {
      (ex.submissions || []).forEach((sub: any) => {
        const student = sub.student;
        if (!student) return;
        const sId = student.id || sub.studentId;
        if (!map.has(sId)) {
          map.set(sId, {
            id: sId,
            name: student.user?.name || 'Student',
            photoUrl: student.user?.photoUrl,
            rollNo: student.rollNo || '-',
            className: student.class ? `${student.class.name} ${student.class.section ? `(${student.class.section})` : ''}` : '-',
            rawClassName: student.class?.name || '',
            attempts: 1,
            bestScore: sub.marksObtained || 0,
            latestDate: sub.createdAt,
            latestExam: ex.title,
            examId: ex.id,
            submissionId: sub.id,
          });
        } else {
          const item = map.get(sId);
          item.attempts += 1;
          if ((sub.marksObtained || 0) > item.bestScore) {
            item.bestScore = sub.marksObtained || 0;
          }
          if (new Date(sub.createdAt) > new Date(item.latestDate)) {
            item.latestDate = sub.createdAt;
            item.latestExam = ex.title;
            item.examId = ex.id;
            item.submissionId = sub.id;
          }
        }
      });
    });
    return Array.from(map.values()).sort((a, b) => b.attempts - a.attempts);
  }, [exams]);

  const classesList = useMemo(() => {
    const set = new Set<string>();
    studentMap.forEach(s => {
      if (s.rawClassName) set.add(s.rawClassName);
    });
    return Array.from(set);
  }, [studentMap]);

  const filteredStudents = useMemo(() => {
    return studentMap.filter((st: any) => {
      const matchSearch = !searchQuery.trim() || 
        st.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        st.rollNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        st.latestExam.toLowerCase().includes(searchQuery.toLowerCase());
      const matchClass = selectedClass === 'ALL' || st.rawClassName === selectedClass;
      return matchSearch && matchClass;
    });
  }, [studentMap, searchQuery, selectedClass]);

  const totalAttempts = studentMap.reduce((acc, s) => acc + s.attempts, 0);

  return (
    <div className="space-y-5">
      {/* KPI Ribbon */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">Active Test Takers</div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 mt-1">{studentMap.length}</div>
          <div className="text-[11px] text-slate-500 font-semibold mt-0.5">Students with CBT attempts</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="text-[10px] font-black uppercase tracking-wider text-indigo-600">Total Attempts</div>
          <div className="text-xl sm:text-2xl font-black text-indigo-600 mt-1">{totalAttempts}</div>
          <div className="text-[11px] text-slate-500 font-semibold mt-0.5">Cumulative test submissions</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs col-span-2 md:col-span-1">
          <div className="text-[10px] font-black uppercase tracking-wider text-purple-600">Classes Engaged</div>
          <div className="text-xl sm:text-2xl font-black text-purple-600 mt-1">{classesList.length}</div>
          <div className="text-[11px] text-slate-500 font-semibold mt-0.5">Standards participating</div>
        </div>
      </div>

      {/* Search & Class Filter */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/90 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="w-full sm:max-w-md">
          <label className="block text-[11px] font-black text-slate-500 uppercase tracking-wider mb-1.5">
            Search Active Students
          </label>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by student name, roll number, or exam..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 placeholder-slate-400 outline-none focus:border-indigo-500 focus:bg-white transition"
            />
          </div>
        </div>

        {classesList.length > 0 && (
          <div className="w-full sm:w-auto">
            <label className="block text-[11px] font-black text-slate-500 uppercase tracking-wider mb-1.5">
              Filter by Class
            </label>
            <select
              value={selectedClass}
              onChange={e => setSelectedClass(e.target.value)}
              className="w-full sm:w-48 p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 text-xs outline-none focus:border-indigo-500"
            >
              <option value="ALL">All Classes ({studentMap.length})</option>
              {classesList.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Students Directory Grid */}
      {filteredStudents.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200/90 shadow-xs space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center mx-auto shadow-xs">
            <Users className="w-8 h-8" />
          </div>
          <h3 className="text-base sm:text-lg font-black text-slate-800">
            {searchQuery ? 'No Students Found' : 'No Active Students Yet'}
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            Students who attempt any online competitive exam will appear here with their total test attempts and best scores.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStudents.map((st: any) => (
            <div
              key={st.id}
              className="bg-white p-5 rounded-3xl border border-slate-200/90 hover:border-indigo-300 shadow-xs hover:shadow-md transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-black text-base flex items-center justify-center shrink-0 shadow-xs overflow-hidden">
                    {st.photoUrl ? (
                      <img src={st.photoUrl} alt={st.name} className="w-full h-full object-cover" />
                    ) : (
                      st.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-black text-slate-900 text-sm sm:text-base truncate">{st.name}</h4>
                    <p className="text-xs font-bold text-slate-500">Roll: {st.rollNo} • {st.className}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 rounded-2xl border border-slate-100 text-center mb-3">
                  <div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase">Attempts</div>
                    <div className="text-sm font-black text-indigo-600">{st.attempts} Exams</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase">Best Score</div>
                    <div className="text-sm font-black text-emerald-600">{st.bestScore} Marks</div>
                  </div>
                </div>

                <div className="text-[11px] text-slate-500 font-medium">
                  <span className="font-bold text-slate-700">Latest Test:</span> {st.latestExam}
                </div>
              </div>

              <div className="pt-3 mt-3 border-t border-slate-100 flex items-center gap-2">
                <button
                  onClick={() => navigate(`/competitive-exam-result/${st.examId}?submissionId=${st.submissionId}`)}
                  className="w-full py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-black text-xs border border-indigo-200 transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Award size={14} className="text-amber-500" />
                  <span>View Latest Scorecard</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// DEDICATED STUDENT PORTAL
// ═══════════════════════════════════════════════════════════════

const StudentCompetitivePortal = ({ navigate }: { navigate: any }) => {
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/competitive-exams/student')
      .then(res => setExams(extractExams(res.data)))
      .catch(err => {
        api.get('/api/competitive-exams/admin')
          .then(res2 => setExams(extractExams(res2.data)))
          .catch(() => {});
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen p-8 flex flex-col items-center justify-center bg-slate-50">
        <RefreshCw className="w-10 h-10 animate-spin text-indigo-600 mb-3" />
        <p className="text-slate-600 font-bold">Loading Your NTA Competitive Tests...</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">
      {/* Student Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-900 p-6 md:p-8 rounded-3xl text-white shadow-xl border border-indigo-500/20">
        <div className="inline-flex items-center gap-2 rounded-full bg-blue-500/20 border border-blue-400/30 px-3 py-1 text-xs font-semibold text-blue-200 mb-2">
          <Zap className="w-3.5 h-3.5 text-amber-400" /> NTA CBT Candidate Examination Desk
        </div>
        <h1 className="text-2xl md:text-3xl font-black">All-India Competitive Mock Tests</h1>
        <p className="text-blue-200 text-sm mt-1 max-w-xl">
          Real JEE Mains, NEET & Navodaya exam practice with official countdown timers, negative marking and instant scorecard analysis.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {exams.map((exam: any) => {
          const hasSubmitted = !!exam.submission;
          return (
            <div key={exam.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                    Official NTA Pattern
                  </span>
                  {hasSubmitted ? (
                    <span className="text-xs font-black text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 size={14} /> Completed
                    </span>
                  ) : (
                    <span className="text-xs font-black text-blue-600 flex items-center gap-1 animate-pulse">
                      <Clock size={14} /> Available Now
                    </span>
                  )}
                </div>

                <h3 className="text-lg font-black text-slate-800">{exam.title}</h3>
                
                <div className="grid grid-cols-3 gap-2 my-4 p-3 rounded-2xl bg-slate-50 border border-slate-100 text-center text-xs">
                  <div>
                    <span className="text-slate-400">Duration</span>
                    <p className="font-black text-slate-800">{exam.duration}m</p>
                  </div>
                  <div>
                    <span className="text-slate-400">Total Marks</span>
                    <p className="font-black text-indigo-600">{exam.totalMarks}</p>
                  </div>
                  <div>
                    <span className="text-slate-400">Negative</span>
                    <p className="font-black text-rose-600">-{exam.negativeMarks || 0}</p>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 space-y-2">
                {hasSubmitted ? (
                  <button
                    onClick={() => navigate(`/competitive-exam-result/${exam.id}`)}
                    className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Award size={16} /> View Scorecard & Solutions
                  </button>
                ) : (
                  <button
                    onClick={() => navigate(`/take-competitive-exam/${exam.id}`)}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-xs shadow-lg shadow-indigo-500/25 transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Play size={16} className="fill-white" /> Start NTA CBT Online Exam
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// AI QUESTION GENERATOR MODAL
// ═══════════════════════════════════════════════════════════════

const AiQuestionGeneratorModal = ({ exam, onClose, onGenerated }: any) => {
  const [chapter, setChapter] = useState('Kinematics & Laws of Motion');
  const [difficulty, setDifficulty] = useState('MEDIUM');
  const [count, setCount] = useState(5);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post(`/api/competitive-exams/${exam.id}/generate-ai`, {
        prompt: `Create high-quality competitive multiple choice questions for ${chapter}`,
        chapterName: chapter,
        difficulty: difficulty,
        count: count
      });
      toast.success(`Generated ${count} AI questions successfully!`);
      onGenerated();
    } catch (err: any) {
      toast.error('AI generation error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-200">
        <div className="bg-gradient-to-r from-indigo-900 to-purple-900 text-white p-6 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-black flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-300" /> AI Question Generator
            </h3>
            <p className="text-xs text-indigo-200 mt-0.5">{exam.title}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full cursor-pointer">
            <XCircle size={22} />
          </button>
        </div>

        <form onSubmit={handleGenerate} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Chapter / Topic</label>
            <input
              type="text"
              value={chapter}
              onChange={e => setChapter(e.target.value)}
              className="w-full border border-slate-200 rounded-xl p-3 text-sm font-bold text-slate-800 outline-none focus:border-indigo-500"
              placeholder="e.g. Chemical Bonding, Newton's Laws"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Difficulty</label>
              <select
                value={difficulty}
                onChange={e => setDifficulty(e.target.value)}
                className="w-full border border-slate-200 rounded-xl p-2.5 text-sm font-semibold bg-white outline-none focus:border-indigo-500"
              >
                <option value="EASY">Easy</option>
                <option value="MEDIUM">Medium (JEE Level)</option>
                <option value="HARD">Hard (Advanced)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Number of Questions</label>
              <select
                value={count}
                onChange={e => setCount(Number(e.target.value))}
                className="w-full border border-slate-200 rounded-xl p-2.5 text-sm font-semibold bg-white outline-none focus:border-indigo-500"
              >
                <option value={3}>3 Questions</option>
                <option value={5}>5 Questions</option>
                <option value={10}>10 Questions</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl font-extrabold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-md transition cursor-pointer disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> Synthesizing...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" /> Generate Questions
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// DEDICATED AI TEXT PARSER VIEW (FULL PAGE EXAM DIGITIZER)
// ═══════════════════════════════════════════════════════════════

const DedicatedAiParserView = ({ exam, onBack, onParsedAndAdded }: any) => {
  const [rawText, setRawText] = useState('');
  const [chapterHint, setChapterHint] = useState(exam?.subject?.name || 'General');
  const [defaultMarks, setDefaultMarks] = useState(4);
  const [parsing, setParsing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [parsedQuestions, setParsedQuestions] = useState<any[]>([]);

  const handleParseText = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawText.trim()) {
      toast.error('Please paste your exam questions text');
      return;
    }

    setParsing(true);
    try {
      const res = await api.post(`/api/competitive-exams/${exam.id}/ai-parse-text`, {
        rawText,
        defaultMarks: Number(defaultMarks) || 4,
        chapterName: chapterHint,
        previewOnly: true,
      });

      const extracted = res.data?.questions || [];
      if (extracted.length === 0) {
        toast.error('No questions detected. Please verify your text format.');
      } else {
        setParsedQuestions(extracted);
        toast.success(`Successfully extracted ${extracted.length} questions!`);
      }
    } catch (err: any) {
      console.error('AI text parse error:', err);
      toast.error(err.response?.data?.message || 'Failed to parse text questions.');
    } finally {
      setParsing(false);
    }
  };

  const handleSaveToExam = async () => {
    if (parsedQuestions.length === 0) return;
    setSaving(true);
    try {
      await api.post(`/api/competitive-exams/${exam.id}/bulk-add-questions`, {
        questions: parsedQuestions,
      });
      toast.success(`Successfully added ${parsedQuestions.length} questions to exam!`);
      onParsedAndAdded();
    } catch (err: any) {
      console.error('Bulk save error:', err);
      toast.error(err.response?.data?.message || 'Failed to save questions to exam.');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveParsedQuestion = (indexToRemove: number) => {
    setParsedQuestions(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleOptionChange = (qIndex: number, newCorrectAnswer: string) => {
    setParsedQuestions(prev => prev.map((q, idx) => idx === qIndex ? { ...q, correctAnswer: newCorrectAnswer } : q));
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Top Header Navigation */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition flex items-center gap-2 font-bold text-xs cursor-pointer shadow-xs"
            title="Return to Question Bank"
          >
            <ArrowLeft size={16} /> Back to Question Bank
          </button>
          <div>
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-emerald-600" />
              <span>Smart Exam Text Parser & Digitizer</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
                {exam?.title}
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Paste full exam papers from Word, PDF, or text notes • Automatic KaTeX formulas & 4 options extraction
            </p>
          </div>
        </div>

        {parsedQuestions.length > 0 && (
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setParsedQuestions([])}
              className="px-4 py-2.5 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition text-xs cursor-pointer"
            >
              Paste Different Text
            </button>
            <button
              onClick={handleSaveToExam}
              disabled={saving}
              className="px-6 py-2.5 rounded-xl font-black text-white bg-emerald-600 hover:bg-emerald-700 shadow-md transition cursor-pointer disabled:opacity-50 flex items-center gap-2 text-xs"
            >
              {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 size={16} />}
              Confirm & Save All ({parsedQuestions.length}) Questions
            </button>
          </div>
        )}
      </div>

      {parsedQuestions.length === 0 ? (
        /* Large Full-Page Input Form */
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-5 text-xs text-emerald-900">
            <p className="font-black flex items-center gap-2 text-emerald-800 text-sm mb-1.5">
              💡 How it works:
            </p>
            <p className="leading-relaxed">
              Paste raw exam questions from Word, PDF, or text notes. The AI engine automatically recognizes math equations ($LaTeX$), organizes 4 options (A, B, C, D), and detects answer keys in seconds.
            </p>
          </div>

          <form onSubmit={handleParseText} className="space-y-6">
            <div>
              <label className="block text-xs font-black text-slate-900 uppercase mb-2 flex items-center justify-between">
                <span>Paste Exam Questions Text Here *</span>
                <span className="text-[11px] text-slate-400 font-bold">Supports 20+ Questions & Math Formulas with $...$</span>
              </label>
              <textarea
                value={rawText}
                onChange={e => setRawText(e.target.value)}
                rows={14}
                className="w-full border border-slate-200 rounded-2xl p-4 text-xs sm:text-sm font-mono text-slate-800 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 bg-slate-50 focus:bg-white transition leading-relaxed shadow-xs"
                placeholder={`Example format:\n\n1. A particle starts from rest and moves with acceleration a = 4 m/s². What is its velocity after 5 seconds?\n(A) 20 m/s\n(B) 25 m/s\n(C) 15 m/s\n(D) 10 m/s\nAns: A\n\n2. If $f(x) = x^2 + 2x$, what is the derivative $f'(x)$?\nA) $2x + 2$\nB) $x^2$\nC) $2x$\nD) $x + 2$\nCorrect: A`}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                  Subject / Chapter Section Hint
                </label>
                <input
                  type="text"
                  value={chapterHint}
                  onChange={e => setChapterHint(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl p-3 text-xs sm:text-sm font-bold text-slate-800 outline-none focus:border-emerald-500 bg-slate-50 focus:bg-white"
                  placeholder="e.g. Mathematics / Calculus or Physics"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                  Default Marks per Question
                </label>
                <input
                  type="number"
                  value={defaultMarks}
                  onChange={e => setDefaultMarks(Number(e.target.value))}
                  className="w-full border border-slate-200 rounded-xl p-3 text-xs sm:text-sm font-bold text-slate-800 outline-none focus:border-emerald-500 bg-white"
                  min={1}
                  max={20}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={onBack}
                className="px-5 py-3 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition cursor-pointer text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={parsing || !rawText.trim()}
                className="px-8 py-3 rounded-xl font-black text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-md transition cursor-pointer disabled:opacity-50 flex items-center gap-2 text-xs hover:scale-105"
              >
                {parsing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> AI Digitizing Questions...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-300" /> Parse Questions with AI
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* Parsed Questions Full Review Area */
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl">
            <div>
              <h4 className="text-sm font-black text-emerald-900 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                Review & Confirm: {parsedQuestions.length} Questions Extracted
              </h4>
              <p className="text-xs text-emerald-700 mt-0.5">
                Review questions and options below. You can customize the correct answer or remove questions before importing into Question Bank.
              </p>
            </div>
            <button
              onClick={() => setParsedQuestions([])}
              className="px-3.5 py-1.5 rounded-xl border border-emerald-300 text-emerald-800 hover:bg-emerald-100 text-xs font-bold transition cursor-pointer"
            >
              Paste Different Text
            </button>
          </div>

          <div className="space-y-4">
            {parsedQuestions.map((q, idx) => {
              const opts: string[] = Array.isArray(q.options) ? q.options : ['A', 'B', 'C', 'D'];
              return (
                <div key={idx} className="bg-slate-50 border border-slate-200 rounded-2xl p-5 hover:border-emerald-300 transition relative">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-xl bg-slate-900 text-white font-black text-xs flex items-center justify-center shrink-0">
                        #{idx + 1}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-700 font-bold text-[10px] uppercase">
                        {q.chapterName || 'General'}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-bold text-[10px]">
                        +{q.marks || 4} Marks
                      </span>
                    </div>
                    <button
                      onClick={() => handleRemoveParsedQuestion(idx)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                      title="Remove this question"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <div className="text-sm font-bold text-slate-800 leading-relaxed mb-3">
                    <LatexRenderer text={q.questionText} />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {opts.map((opt, oIdx) => {
                      const optLabel = String.fromCharCode(65 + oIdx);
                      const isCorrect = q.correctAnswer === opt;
                      return (
                        <div
                          key={oIdx}
                          className={`p-2.5 rounded-xl border flex items-start gap-2 ${
                            isCorrect
                              ? 'bg-emerald-50 border-emerald-400 text-emerald-950 font-bold'
                              : 'bg-white border-slate-200 text-slate-700'
                          }`}
                        >
                          <span className={`w-5 h-5 rounded-md text-[10px] font-black flex items-center justify-center shrink-0 ${
                            isCorrect ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {optLabel}
                          </span>
                          <div className="flex-1">
                            <LatexRenderer text={opt} />
                          </div>
                          {isCorrect && (
                            <span className="text-[10px] font-black uppercase text-emerald-700 flex items-center gap-0.5 shrink-0">
                              <Check size={12} /> Correct
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-200 flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-semibold">Change Correct Answer:</span>
                    <select
                      value={q.correctAnswer}
                      onChange={e => handleOptionChange(idx, e.target.value)}
                      className="p-1.5 bg-white border border-slate-300 rounded-lg font-bold text-slate-800 text-xs outline-none focus:border-emerald-500"
                    >
                      {opts.map((opt, oIdx) => (
                        <option key={oIdx} value={opt}>
                          Option ({String.fromCharCode(65 + oIdx)}): {opt.length > 30 ? opt.substring(0, 30) + '...' : opt}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex justify-between items-center">
            <button
              onClick={() => setParsedQuestions([])}
              className="px-4 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-slate-200 transition text-xs cursor-pointer"
            >
              Cancel & Start Over
            </button>
            <button
              onClick={handleSaveToExam}
              disabled={saving}
              className="px-8 py-3 rounded-xl font-black text-white bg-emerald-600 hover:bg-emerald-700 shadow-md transition cursor-pointer disabled:opacity-50 flex items-center gap-2 text-xs"
            >
              {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 size={16} />}
              Confirm & Save All ({parsedQuestions.length}) Questions
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// EXCEL / CSV BULK QUESTION IMPORT MODAL
// ═══════════════════════════════════════════════════════════════

const ExcelBulkImportModal: React.FC<{ onClose: () => void; onSaved: () => void }> = ({ onClose, onSaved }) => {
  const [rows, setRows] = useState<any[]>([]);
  const [fileName, setFileName] = useState('');
  const [saving, setSaving] = useState(false);

  const handleDownloadSample = () => {
    const sample = [
      {
        Category: 'JEE',
        Subject: 'Mathematics',
        Topic: 'Quadratic Equations',
        Question: 'If $x^2 - 5x + 6 = 0$, what are the roots?',
        'Option A': '2, 3',
        'Option B': '1, 6',
        'Option C': '-2, -3',
        'Option D': '3, 4',
        'Correct Answer': 'A',
        Difficulty: 'EASY',
        Explanation: 'Factoring gives $(x-2)(x-3)=0$.'
      },
      {
        Category: 'NEET',
        Subject: 'Biology',
        Topic: 'Cell Biology',
        Question: 'Which organelle is known as the powerhouse of the cell?',
        'Option A': 'Ribosome',
        'Option B': 'Mitochondria',
        'Option C': 'Golgi Body',
        'Option D': 'Nucleus',
        'Correct Answer': 'B',
        Difficulty: 'EASY',
        Explanation: 'Mitochondria produces ATP through cellular respiration.'
      }
    ];
    const ws = XLSX.utils.json_to_sheet(sample);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Questions');
    XLSX.writeFile(wb, 'Online_Exam_Question_Bank_Template.xlsx');
    toast.success('Sample Excel template downloaded!');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const jsonRows: any[] = XLSX.utils.sheet_to_json(ws);
        const mapped = jsonRows.map((r) => {
          const opts = [
            String(r['Option A'] ?? r.optionA ?? '').trim(),
            String(r['Option B'] ?? r.optionB ?? '').trim(),
            String(r['Option C'] ?? r.optionC ?? '').trim(),
            String(r['Option D'] ?? r.optionD ?? '').trim(),
          ];
          const rawAns = String(r['Correct Answer'] ?? r.correctAnswer ?? 'A').trim();
          let correctAnswer = rawAns;
          const idxMap: Record<string, number> = { A: 0, B: 1, C: 2, D: 3 };
          if (idxMap[rawAns.toUpperCase()] !== undefined && opts[idxMap[rawAns.toUpperCase()]]) {
            correctAnswer = opts[idxMap[rawAns.toUpperCase()]];
          }
          return {
            category: String(r.Category ?? r.category ?? 'GENERAL').toUpperCase(),
            subjectName: String(r.Subject ?? r.subjectName ?? 'General').trim(),
            topicName: String(r.Topic ?? r.topicName ?? 'General').trim(),
            chapterName: `${String(r.Subject ?? r.subjectName ?? 'General').trim()}: ${String(r.Topic ?? r.topicName ?? 'General').trim()}`,
            questionText: String(r.Question ?? r.questionText ?? '').trim(),
            options: opts,
            correctAnswer,
            difficulty: String(r.Difficulty ?? r.difficulty ?? 'MEDIUM').toUpperCase(),
            marks: 4,
            negativeMarks: 0,
            explanation: String(r.Explanation ?? r.explanation ?? '').trim() || null,
          };
        }).filter((q) => q.questionText);
        setRows(mapped);
        if (mapped.length === 0) toast.error('No valid questions found in file');
        else toast.success(`Loaded ${mapped.length} questions from Excel!`);
      } catch (err) {
        toast.error('Failed to read Excel/CSV file');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleSaveAll = async () => {
    if (rows.length === 0) return;
    setSaving(true);
    try {
      await api.post('/api/master-questions/bulk', { questions: rows });
      toast.success(`Imported ${rows.length} questions permanently to Question Bank!`);
      onSaved();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Bulk import failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl border border-slate-200">
        <div className="p-5 bg-gradient-to-r from-amber-500 to-orange-500 text-white flex justify-between items-center">
          <div>
            <h3 className="text-lg font-black flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5" /> Bulk Import Questions (Excel / CSV)
            </h3>
            <p className="text-xs text-amber-100 mt-0.5">Upload 100–1000+ Subject & Topic-wise MCQs directly into PostgreSQL</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full cursor-pointer"><X size={20} /></button>
        </div>

        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black text-amber-900">Step 1: Download Sample Excel Template</p>
              <p className="text-[11px] text-amber-700 mt-0.5">Columns: Category, Subject, Topic, Question, Option A-D, Correct Answer, Difficulty, Explanation (Marks & Negative Marks are configured when creating an Exam)</p>
            </div>
            <button
              type="button"
              onClick={handleDownloadSample}
              className="px-4 py-2 rounded-xl bg-white hover:bg-amber-100 text-amber-800 border border-amber-300 text-xs font-black flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              <Download size={14} /> Download Template (.xlsx)
            </button>
          </div>

          <div>
            <label className="block text-xs font-black text-slate-700 uppercase mb-2">Step 2: Upload Filled Excel / CSV File</label>
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
              className="w-full p-4 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 text-xs font-bold text-slate-700 cursor-pointer hover:border-indigo-400"
            />
            {fileName && <p className="text-xs text-indigo-600 font-bold mt-1.5">Selected: {fileName} ({rows.length} questions)</p>}
          </div>

          {rows.length > 0 && (
            <div className="space-y-2 max-h-60 overflow-y-auto border border-slate-200 rounded-2xl p-3 bg-slate-50">
              {rows.slice(0, 15).map((r, i) => (
                <div key={i} className="p-2.5 bg-white rounded-xl border border-slate-200 text-xs flex items-center justify-between gap-2">
                  <div className="truncate font-bold text-slate-800">
                    <span className="text-indigo-600 mr-1.5">#{i + 1}</span>
                    [{r.subjectName} / {r.topicName}] {r.questionText}
                  </div>
                  <span className="text-[10px] font-black px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 shrink-0">{r.difficulty}</span>
                </div>
              ))}
              {rows.length > 15 && <p className="text-center text-[11px] font-bold text-slate-500">...and {rows.length - 15} more questions</p>}
            </div>
          )}
        </div>

        <div className="p-4 bg-white border-t border-slate-200 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold cursor-pointer">Cancel</button>
          <button
            onClick={handleSaveAll}
            disabled={saving || rows.length === 0}
            className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black cursor-pointer disabled:opacity-50"
          >
            {saving ? 'Importing...' : `Import (${rows.length}) Questions to DB`}
          </button>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// ONLINE EXAM DASHBOARD OVERVIEW
// ═══════════════════════════════════════════════════════════════

const OnlineExamDashboardOverview: React.FC<any> = ({
  exams,
  liveExams,
  upcomingExams,
  masterQuestionsList,
  activeStudents,
  onCreateExam,
  onOpenQuestionBank,
  onOpenBulkImport,
  onOpenReports,
  onPreviewPaper,
  navigate,
}) => {
  const subjectBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    masterQuestionsList.forEach((q: any) => {
      const sub = normalizeSubject(q.subjectName || q.chapterName);
      counts[sub] = (counts[sub] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [masterQuestionsList]);

  return (
    <div className="space-y-6">
      {/* Quick Action Command Bar */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-slate-900">Online Exam Command Center</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Create exams, manage your Subject & Topic Question Bank, monitor live tests, and export performance reports
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <button onClick={onCreateExam} className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black flex items-center gap-1.5 shadow-xs cursor-pointer">
            <Plus size={15} /> Create Exam
          </button>
          <button onClick={() => onOpenQuestionBank('ALL')} className="px-4 py-2.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-xs font-black flex items-center gap-1.5 cursor-pointer">
            <Database size={15} /> Question Bank ({masterQuestionsList.length})
          </button>
          <button onClick={() => navigate('/competitive-exams/bulk-import')} className="px-4 py-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-black flex items-center gap-1.5 cursor-pointer">
            <FileSpreadsheet size={15} /> Bulk Import
          </button>
          <button onClick={onOpenReports} className="px-4 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-black flex items-center gap-1.5 cursor-pointer">
            <BarChart3 size={15} /> View Reports
          </button>
        </div>
      </div>

      {/* 6 Dedicated Module Cards (Each opens its own separate page) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {[
          { label: 'Exam Management', sub: `${exams.length} Exams`, icon: List, color: 'bg-blue-50 text-blue-600 border-blue-200 hover:border-blue-400', onClick: () => navigate('/competitive-exams/exams') },
          { label: 'Question Bank', sub: `${masterQuestionsList.length} Saved Qs`, icon: Database, color: 'bg-purple-50 text-purple-600 border-purple-200 hover:border-purple-400', onClick: () => onOpenQuestionBank('ALL') },
          { label: 'Bulk Import', sub: 'Excel / CSV / AI', icon: FileSpreadsheet, color: 'bg-amber-50 text-amber-600 border-amber-200 hover:border-amber-400', onClick: () => navigate('/competitive-exams/bulk-import') },
          { label: 'Student Management', sub: `${activeStudents.length} Active`, icon: Users, color: 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:border-emerald-400', onClick: () => navigate('/competitive-exams/students') },
          { label: 'Results & Cards', sub: 'Ranks & Scorecards', icon: Award, color: 'bg-rose-50 text-rose-600 border-rose-200 hover:border-rose-400', onClick: () => navigate('/competitive-exams/results') },
          { label: 'View Reports', sub: 'Analytics & Excel', icon: BarChart3, color: 'bg-indigo-50 text-indigo-600 border-indigo-200 hover:border-indigo-400', onClick: onOpenReports },
        ].map((mod) => {
          const Icon = mod.icon;
          return (
            <button
              key={mod.label}
              type="button"
              onClick={mod.onClick}
              className="bg-white p-4 rounded-2xl border border-slate-200 hover:border-indigo-400 hover:shadow-md transition-all text-left cursor-pointer group flex flex-col justify-between gap-3"
            >
              <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${mod.color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-black text-slate-900 group-hover:text-indigo-600 transition-colors">{mod.label}</div>
                <div className="text-[11px] font-semibold text-slate-500 mt-0.5">{mod.sub} →</div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Live & Upcoming Exams (2 Columns) */}
        <div className="lg:col-span-2 space-y-5">
          {/* Live Exams */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Exams ({liveExams.length})
              </h3>
              <span className="text-xs font-bold text-slate-400">Active CBT Tests</span>
            </div>

            {liveExams.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <p className="text-xs font-bold text-slate-500">No exams are currently live.</p>
                <button onClick={onCreateExam} className="mt-3 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-black cursor-pointer">
                  + Schedule New Exam
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {liveExams.slice(0, 4).map((ex: any) => (
                  <div key={ex.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">LIVE</span>
                        <span className="text-xs font-bold text-slate-500">{ex.class?.name || 'All Classes'}</span>
                      </div>
                      <h4 className="text-sm font-black text-slate-900 mt-1">{ex.title}</h4>
                      <p className="text-[11px] font-semibold text-slate-500 mt-0.5">
                        ⏱️ {ex.duration}m • 📝 {ex._count?.questions || ex.questions?.length || 0} Qs • 🎯 {ex.totalMarks} Marks
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button onClick={() => navigate(`/competitive-exams/${ex.id}/paper`)} className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 cursor-pointer shadow-xs">
                        View Paper
                      </button>
                      <button onClick={() => navigate(`/live-exam-monitor/${ex.id}`)} className="px-3 py-2 rounded-xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-700 hover:bg-rose-100 cursor-pointer">
                        Live Monitor
                      </button>
                      <button onClick={() => navigate(`/take-competitive-exam/${ex.id}`)} className="px-3.5 py-2 rounded-xl bg-indigo-600 text-white text-xs font-black hover:bg-indigo-700 cursor-pointer">
                        Launch
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Upcoming Exams */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-600" />
                Upcoming Exams ({upcomingExams.length})
              </h3>
            </div>

            {upcomingExams.length === 0 ? (
              <p className="text-xs font-semibold text-slate-400 py-4 text-center bg-slate-50 rounded-2xl border border-slate-100">
                No upcoming scheduled exams. Create an exam with a future start time to see it here.
              </p>
            ) : (
              <div className="space-y-2.5">
                {upcomingExams.slice(0, 4).map((ex: any) => (
                  <div key={ex.id} className="p-3.5 rounded-2xl bg-indigo-50/50 border border-indigo-100 flex items-center justify-between gap-3">
                    <div>
                      <h4 className="text-sm font-black text-slate-900">{ex.title}</h4>
                      <p className="text-[11px] font-semibold text-indigo-700">
                        Starts: {new Date(ex.startTime).toLocaleString()} • {ex.duration} Mins
                      </p>
                    </div>
                    <button onClick={() => navigate(`/competitive-exams/${ex.id}/paper`)} className="px-3 py-1.5 rounded-xl bg-white border border-indigo-200 text-xs font-bold text-indigo-700 hover:bg-indigo-50 cursor-pointer shadow-xs">
                      Preview Paper
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Subject-wise Question Bank Summary */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-4 h-fit">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Database className="w-4 h-4 text-purple-600" />
              Subject-wise Bank
            </h3>
            <button onClick={() => onOpenQuestionBank('ALL')} className="text-xs font-bold text-indigo-600 hover:underline cursor-pointer">
              View All →
            </button>
          </div>

          {subjectBreakdown.length === 0 ? (
            <div className="p-6 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-2">
              <p className="text-xs font-bold text-slate-500">Question Bank is empty.</p>
              <button onClick={() => navigate('/competitive-exams/bulk-import')} className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-black cursor-pointer">
                + Add / Bulk Import
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {subjectBreakdown.map(([subName, count]) => (
                <button
                  key={subName}
                  onClick={() => onOpenQuestionBank(subName)}
                  className="w-full p-3 rounded-2xl bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 flex items-center justify-between transition cursor-pointer"
                >
                  <span className="text-xs font-black text-slate-800">{subName}</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-white border border-slate-200 text-xs font-black text-indigo-600">
                    {count} Qs
                  </span>
                </button>
              ))}
            </div>
          )}

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-500">
            <span>Participating Students:</span>
            <span className="text-slate-900 font-black">{activeStudents.length}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// ONLINE EXAM REPORTS & ANALYTICS TAB
// ═══════════════════════════════════════════════════════════════

const OnlineExamReportsTab: React.FC<{ exams: any[]; masterQuestionsList: any[]; navigate: any }> = ({
  exams,
  masterQuestionsList,
  navigate,
}) => {
  const reportRows = useMemo(() => {
    return exams.map((ex: any) => {
      const subs: any[] = ex.submissions || [];
      const count = subs.length;
      const totalMarks = ex.totalMarks || 100;
      const passMarks = ex.passMarks || Math.round(totalMarks * 0.35);
      const passed = subs.filter((s: any) => (s.marksObtained || 0) >= passMarks).length;
      const avg = count > 0 ? Math.round(subs.reduce((a: number, s: any) => a + (s.marksObtained || 0), 0) / count) : 0;
      const highest = count > 0 ? Math.max(...subs.map((s: any) => s.marksObtained || 0)) : 0;
      const passRate = count > 0 ? Math.round((passed / count) * 100) : 0;
      return {
        id: ex.id,
        title: ex.title,
        className: ex.class?.name || 'All',
        questionsCount: ex._count?.questions || ex.questions?.length || 0,
        attempts: count,
        passed,
        passRate,
        avgScore: avg,
        highestScore: highest,
        totalMarks,
      };
    });
  }, [exams]);

  const handleExportExcel = () => {
    if (reportRows.length === 0) {
      toast.error('No exam data to export');
      return;
    }
    const ws = XLSX.utils.json_to_sheet(reportRows.map((r) => ({
      'Exam Title': r.title,
      'Class': r.className,
      'Questions': r.questionsCount,
      'Total Attempts': r.attempts,
      'Passed': r.passed,
      'Pass Rate %': `${r.passRate}%`,
      'Average Score': `${r.avgScore} / ${r.totalMarks}`,
      'Highest Score': `${r.highestScore} / ${r.totalMarks}`,
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Exam_Reports');
    XLSX.writeFile(wb, `Online_Exam_Reports_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success('Report exported to Excel!');
  };

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-slate-900">Performance Reports & Analytics</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Exam-wise pass percentage, average & highest scores, and Master Question Bank coverage ({masterQuestionsList.length} Qs)
          </p>
        </div>
        <button
          onClick={handleExportExcel}
          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black flex items-center gap-1.5 shadow-xs cursor-pointer"
        >
          <Download size={15} /> Export Report (.xlsx)
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        {reportRows.length === 0 ? (
          <div className="p-12 text-center text-xs font-bold text-slate-500">
            No exams created yet. Create an exam and collect student submissions to view analytics reports.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-black uppercase text-[10.5px] tracking-wider">
                  <th className="py-3.5 px-5">Exam Title</th>
                  <th className="py-3.5 px-4 text-center">Class</th>
                  <th className="py-3.5 px-4 text-center">Questions</th>
                  <th className="py-3.5 px-4 text-center">Attempts</th>
                  <th className="py-3.5 px-4 text-center">Pass Rate</th>
                  <th className="py-3.5 px-4 text-center">Avg Score</th>
                  <th className="py-3.5 px-4 text-center">Highest</th>
                  <th className="py-3.5 px-4 text-right">Leaderboard</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reportRows.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="py-3.5 px-5 font-black text-slate-900">{r.title}</td>
                    <td className="py-3.5 px-4 text-center font-bold text-slate-600">{r.className}</td>
                    <td className="py-3.5 px-4 text-center font-bold text-indigo-600">{r.questionsCount}</td>
                    <td className="py-3.5 px-4 text-center font-bold text-slate-800">{r.attempts}</td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-black">
                        {r.passRate}%
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold text-slate-700">{r.avgScore} / {r.totalMarks}</td>
                    <td className="py-3.5 px-4 text-center font-black text-amber-600">{r.highestScore}</td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => navigate(`/competitive-exam-leaderboard/${r.id}`)}
                        className="px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs cursor-pointer"
                      >
                        View Ranks →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// UI REUSABLE HELPERS
// ═══════════════════════════════════════════════════════════════

const TabButton = ({ active, onClick, icon, label }: any) => (
  <button 
    onClick={onClick} 
    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-extrabold text-xs transition-all whitespace-nowrap cursor-pointer ${
      active 
        ? 'bg-indigo-600 text-white shadow-md' 
        : 'bg-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-800'
    }`}
  >
    {icon} {label}
  </button>
);

interface StatCardProps {
  title: string;
  value: number | string;
  color: 'blue' | 'emerald' | 'purple' | 'amber' | 'indigo' | 'rose';
  icon: React.ReactNode;
  subtitle?: string;
  active?: boolean;
  onClick?: () => void;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, color, icon, subtitle, active, onClick }) => {
  const activeBorders: Record<string, string> = {
    blue: 'border-blue-500 bg-blue-50/70 ring-2 ring-blue-500/20 shadow-md',
    emerald: 'border-emerald-500 bg-emerald-50/70 ring-2 ring-emerald-500/20 shadow-md',
    purple: 'border-purple-500 bg-purple-50/70 ring-2 ring-purple-500/20 shadow-md',
    amber: 'border-amber-500 bg-amber-50/70 ring-2 ring-amber-500/20 shadow-md',
    indigo: 'border-indigo-500 bg-indigo-50/70 ring-2 ring-indigo-500/20 shadow-md',
    rose: 'border-rose-500 bg-rose-50/70 ring-2 ring-rose-500/20 shadow-md',
  };

  const badgeBg: Record<string, string> = {
    blue: 'bg-blue-600 text-white',
    emerald: 'bg-emerald-600 text-white',
    purple: 'bg-purple-600 text-white',
    amber: 'bg-amber-600 text-white',
    indigo: 'bg-indigo-600 text-white',
    rose: 'bg-rose-600 text-white',
  };

  const defaultBadgeBg: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    purple: 'bg-purple-50 text-purple-600',
    amber: 'bg-amber-50 text-amber-600',
    indigo: 'bg-indigo-50 text-indigo-600',
    rose: 'bg-rose-50 text-rose-600',
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={`p-4 sm:p-5 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden group w-full ${
        active
          ? activeBorders[color]
          : 'bg-white hover:bg-slate-50/90 border-slate-200/90 shadow-xs hover:border-slate-300'
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-slate-500">
          {title}
        </span>
        <div className={`p-2 rounded-xl transition-colors ${active ? badgeBg[color] : defaultBadgeBg[color]}`}>
          {icon}
        </div>
      </div>
      <div className="text-2xl sm:text-3xl font-black text-slate-900">{value}</div>
      <div className="text-[11px] sm:text-xs font-semibold text-slate-500 mt-1 flex items-center justify-between">
        <span className="truncate">{subtitle || 'Click to view'}</span>
        {active && (
          <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-200 px-1.5 py-0.2 rounded shrink-0">
            Active
          </span>
        )}
      </div>
    </button>
  );
};

export default CompetitiveExamsPage;
