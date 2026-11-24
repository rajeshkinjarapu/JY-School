import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { 
  Play, Plus, Clock, FileText, CheckCircle, Edit, ShieldAlert, Award, FileQuestion, Users, RefreshCw, Trash2, BarChart3, Activity, TrendingUp, AlertTriangle, BookOpen, ChevronRight, CheckCircle2, XCircle, MinusCircle, Database, LayoutDashboard, List, UploadCloud, Download, Sparkles, Zap, Shield, HelpCircle, Check, ArrowRight, ArrowLeft, ExternalLink, X, Calendar, Hash, Target, Layers, Settings2, Sliders, Eye, Printer, Upload, Image as ImageIcon
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { DataCache } from '../../services/dataCache';
import toast from 'react-hot-toast';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { SingleRawBoxQuestionStudio } from './CompetitiveQuestionBankDashboard';

// ═══════════════════════════════════════════════════════════════
// KATEX LATEX MATH FORMULA RENDERER
// ═══════════════════════════════════════════════════════════════
export const LatexRenderer: React.FC<{ text: string; className?: string }> = ({ text, className = '' }) => {
  if (!text) return null;
  const trimmed = text.trim();

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

  const parts = [];
  const regex = /(\$\$[\s\S]+?\$\$|\$[^\$]+?\$)/g;
  let lastIndex = 0;
  let match;
  let keyIndex = 0;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(<span key={`text-${keyIndex++}`}>{text.substring(lastIndex, match.index)}</span>);
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
  if (lastIndex < text.length) {
    parts.push(<span key={`text-${keyIndex++}`}>{text.substring(lastIndex)}</span>);
  }

  return <span className={className}>{parts.length > 0 ? parts : text}</span>;
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
  const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'MANAGE_EXAMS' | 'QUESTION_BANK' | 'RESULTS'>('MANAGE_EXAMS');
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Inline Create Form & Modals
  const [showInlineCreate, setShowInlineCreate] = useState(false);
  const [aiModalExam, setAiModalExam] = useState<any | null>(null);
  const [selectedExamIdForQB, setSelectedExamIdForQB] = useState<string>('');
  const [createdExamModal, setCreatedExamModal] = useState<any | null>(null);
  const [previewExamPaper, setPreviewExamPaper] = useState<any | null>(null);

  const fetchExams = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/competitive-exams/admin');
      const loadedExams = extractExams(res.data);
      setExams(loadedExams);
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

  const totalQuestions = exams.reduce((acc, e) => acc + (e._count?.questions || e.questions?.length || 0), 0);
  const totalSubmissions = exams.reduce((acc, e) => acc + (e._count?.submissions || e.submissions?.length || 0), 0);

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
    navigate(`/competitive-question-bank?examId=${examId}`);
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 bg-slate-50 min-h-screen">
      {/* Executive Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 md:p-8 rounded-3xl text-white shadow-xl border border-indigo-500/20 relative overflow-hidden">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 rounded-full bg-indigo-500/20 border border-indigo-400/30 px-3 py-1 text-xs font-semibold text-indigo-200 mb-2">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            EDURACLE CBT TESTING ENGINE & NTA EXAM SUITE
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight flex items-center gap-3">
            <BookOpen className="h-8 w-8 text-blue-400" />
            Competitive Exams (JEE / NEET / EAMCET)
          </h1>
          <p className="text-slate-300 text-sm mt-1 max-w-2xl font-medium">
            National-standard computer based test creation, multi-subject section blueprints, and live proctoring.
          </p>
        </div>

        <div className="relative z-10 flex flex-wrap items-center gap-3">
          <button
            onClick={() => fetchExams()}
            className="p-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white border border-white/10 transition backdrop-blur-md shadow-xs cursor-pointer"
            title="Refresh List"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => {
              setActiveTab('MANAGE_EXAMS');
              setShowInlineCreate(true);
            }}
            className="px-5 py-3 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-extrabold text-sm shadow-lg shadow-indigo-500/25 flex items-center gap-2 transition hover:scale-105 cursor-pointer"
          >
            <Plus className="w-5 h-5" /> Create Exam Wizard
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="TOTAL EXAMS" value={exams.length} color="blue" icon={<List className="w-5 h-5" />} />
        <StatCard title="TOTAL QUESTIONS" value={totalQuestions} color="emerald" icon={<FileQuestion className="w-5 h-5" />} />
        <StatCard title="RESULTS PUBLISHED" value={totalSubmissions} color="purple" icon={<Award className="w-5 h-5" />} />
        <StatCard title="ACTIVE STUDENTS" value={exams.filter(e => e.isPublished).length} color="amber" icon={<Users className="w-5 h-5" />} />
      </div>

      {/* Navigation Tabs (Exact 4 Tabs) */}
      <div className="flex overflow-x-auto gap-2 bg-white p-2 rounded-2xl shadow-sm border border-slate-200">
        <TabButton 
          active={activeTab === 'DASHBOARD'} 
          onClick={() => setActiveTab('DASHBOARD')} 
          icon={<LayoutDashboard size={18} />} 
          label="Dashboard Overview" 
        />
        <TabButton 
          active={activeTab === 'MANAGE_EXAMS'} 
          onClick={() => setActiveTab('MANAGE_EXAMS')} 
          icon={<List size={18} />} 
          label={`Manage Exams (${exams.length})`} 
        />
        <TabButton 
          active={false} 
          onClick={() => navigate('/competitive-question-bank')} 
          icon={<Database size={18} />} 
          label={`Question Bank (${totalQuestions}) ↗`} 
        />
        <TabButton 
          active={activeTab === 'RESULTS'} 
          onClick={() => setActiveTab('RESULTS')} 
          icon={<Award size={18} />} 
          label={`Results & Ranks (${totalSubmissions})`} 
        />
      </div>

      {/* Tab Contents */}
      <div className="mt-6">
        {activeTab === 'DASHBOARD' && (
          <DashboardOverviewTab 
            exams={exams} 
            totalQuestions={totalQuestions} 
            totalSubmissions={totalSubmissions} 
            onOpenCreate={() => {
              setActiveTab('MANAGE_EXAMS');
              setShowInlineCreate(true);
            }}
            onPreviewPaper={(exam: any) => setPreviewExamPaper(exam)}
            navigate={navigate}
          />
        )}

        {activeTab === 'MANAGE_EXAMS' && (
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
            onPreviewPaper={(exam: any) => setPreviewExamPaper(exam)}
            navigate={navigate}
          />
        )}

        {activeTab === 'QUESTION_BANK' && (
          <QuestionBankTab 
            exams={exams} 
            selectedExamId={selectedExamIdForQB}
            setSelectedExamId={setSelectedExamIdForQB}
            onOpenAiModal={(exam: any) => setAiModalExam(exam)}
            onExamsUpdated={fetchExams}
            navigate={navigate} 
          />
        )}

        {activeTab === 'RESULTS' && (
          <ResultsAndRanksTab exams={exams} navigate={navigate} />
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
            setActiveTab('QUESTION_BANK');
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
                      onClick={() => onPreviewPaper(exam)}
                      className="py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow transition cursor-pointer"
                    >
                      <Eye className="w-4 h-4 text-cyan-400" />
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
// EDURACLE EXAM CREATION WIZARD (PROFESSIONAL PATTERN ENGINE)
// ═══════════════════════════════════════════════════════════════

const PATTERN_PRESETS = [
  {
    id: 'SCHOOL_GRAND_TEST',
    badge: 'SCHOOL GRAND TEST',
    title: 'School Grand Test',
    defaultTitle: '10th Class Grand Test - Mathematics',
    description: 'School Curriculum Assessment • 100 Marks • 120 Mins • Zero Negative',
    duration: 120,
    totalMarks: 100,
    passMarks: 35,
    negativeMarks: 0,
    color: 'from-blue-600 to-indigo-700',
    tagColor: 'bg-blue-100 text-blue-800',
    sections: [
      { name: 'Section 1: Objective MCQs', count: 20, marks: 40 },
      { name: 'Section 2: Conceptual Questions', count: 10, marks: 30 },
      { name: 'Section 3: Problem Solving', count: 6, marks: 30 },
    ],
  },
  {
    id: 'SSC_BOARD',
    badge: 'SSC BOARD PATTERN',
    title: 'SSC Board Model Paper',
    defaultTitle: 'SSC Board Practice Examination',
    description: 'State Board Objective Evaluation • 50 Marks • 60 Mins • Zero Negative',
    duration: 60,
    totalMarks: 50,
    passMarks: 18,
    negativeMarks: 0,
    color: 'from-emerald-600 to-teal-700',
    tagColor: 'bg-emerald-100 text-emerald-800',
    sections: [
      { name: 'Section A: Multiple Choice', count: 20, marks: 20 },
      { name: 'Section B: Fill in Blanks & Match', count: 15, marks: 15 },
      { name: 'Section C: Very Short Questions', count: 15, marks: 15 },
    ],
  },
  {
    id: 'JEE_MAINS',
    badge: 'JEE FOUNDATION',
    title: 'IIT-JEE Foundation Pattern',
    defaultTitle: '10th Standard JEE Foundation Objective Test',
    description: 'Physics, Chemistry, Mathematics • 300 Marks • 180 Mins • +4 / -1 Marking',
    duration: 180,
    totalMarks: 300,
    passMarks: 100,
    negativeMarks: 1,
    color: 'from-indigo-600 to-purple-700',
    tagColor: 'bg-indigo-100 text-indigo-800',
    sections: [
      { name: 'Section 1: Physics', count: 25, marks: 100 },
      { name: 'Section 2: Chemistry', count: 25, marks: 100 },
      { name: 'Section 3: Mathematics', count: 25, marks: 100 },
    ],
  },
  {
    id: 'NEET',
    badge: 'NEET FOUNDATION',
    title: 'NEET Medical Foundation',
    defaultTitle: 'NEET Medical Foundation Objective Test',
    description: 'Physics, Chemistry, Botany, Zoology • 720 Marks • 200 Mins • +4 / -1 Marking',
    duration: 200,
    totalMarks: 720,
    passMarks: 250,
    negativeMarks: 1,
    color: 'from-teal-600 to-emerald-700',
    tagColor: 'bg-teal-100 text-teal-800',
    sections: [
      { name: 'Physics', count: 45, marks: 180 },
      { name: 'Chemistry', count: 45, marks: 180 },
      { name: 'Botany', count: 45, marks: 180 },
      { name: 'Zoology', count: 45, marks: 180 },
    ],
  },
  {
    id: 'NAVODAYA',
    badge: 'NAVODAYA / OLYMPIAD',
    title: 'Navodaya & Sainik School',
    defaultTitle: 'Navodaya Entrance Examination Practice Test',
    description: 'Mental Ability (50M), Arithmetic (25M), Language (25M) • No Negative',
    duration: 120,
    totalMarks: 100,
    passMarks: 40,
    negativeMarks: 0,
    color: 'from-amber-600 to-orange-700',
    tagColor: 'bg-amber-100 text-amber-800',
    sections: [
      { name: 'Mental Ability (MAT)', count: 40, marks: 50 },
      { name: 'Arithmetic Test', count: 20, marks: 25 },
      { name: 'Language Test', count: 20, marks: 25 },
    ],
  },
  {
    id: 'CUSTOM',
    badge: 'CUSTOM SLIP TEST',
    title: 'Classroom Objective Slip Test',
    defaultTitle: 'Weekly Objective Slip Test',
    description: 'Custom duration, total marks, and questions for weekly testing',
    duration: 45,
    totalMarks: 25,
    passMarks: 10,
    negativeMarks: 0,
    color: 'from-slate-700 to-slate-900',
    tagColor: 'bg-slate-100 text-slate-800',
    sections: [
      { name: 'General Objective Section', count: 25, marks: 25 },
    ],
  },
];

const EduracleCreateExamWizard = ({ onClose, onCreated }: { onClose: () => void; onCreated: (exam: any) => void }) => {
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [selectedPattern, setSelectedPattern] = useState<string>('SCHOOL_GRAND_TEST');

  const [formData, setFormData] = useState({
    title: PATTERN_PRESETS[0].defaultTitle,
    pattern: 'SCHOOL_GRAND_TEST',
    duration: 120,
    totalMarks: 100,
    passMarks: 35,
    negativeMarks: 0,
    examDate: new Date().toISOString().split('T')[0],
    startTime: '09:00',
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

  const handleSelectPattern = (preset: typeof PATTERN_PRESETS[0]) => {
    setSelectedPattern(preset.id);
    setFormData(prev => ({
      ...prev,
      pattern: preset.id,
      title: preset.defaultTitle,
      duration: preset.duration,
      totalMarks: preset.totalMarks,
      passMarks: preset.passMarks,
      negativeMarks: preset.negativeMarks,
    }));
  };

  const currentPreset = PATTERN_PRESETS.find(p => p.id === selectedPattern) || PATTERN_PRESETS[0];

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
    <div className="bg-white rounded-3xl p-6 md:p-8 shadow-xl border border-slate-200 transition-all space-y-6">
      {/* Wizard Header */}
      <div className="flex justify-between items-start pb-5 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/25">
            <Zap className="w-6 h-6 text-amber-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-black text-slate-900">Eduracle CBT Exam Creator Wizard</h3>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-indigo-50 text-indigo-700 border border-indigo-200">
                National Standard Testing
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Select an examination blueprint pattern. All subject sections, marking schemes, and questions are configured automatically.
            </p>
          </div>
        </div>

        <button 
          onClick={onClose} 
          className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition cursor-pointer"
        >
          <X size={20} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* STEP 1: CHOOSE PRESET EXAM PATTERN */}
        <div>
          <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-600" />
            Step 1: Choose Standard Exam Pattern
          </label>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {PATTERN_PRESETS.map((preset) => {
              const isSelected = selectedPattern === preset.id;
              return (
                <div
                  key={preset.id}
                  onClick={() => handleSelectPattern(preset)}
                  className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50/50 shadow-md ring-2 ring-indigo-600/10'
                      : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/50'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-md ${preset.tagColor}`}>
                        {preset.badge}
                      </span>
                      {isSelected && (
                        <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                          <Check size={12} strokeWidth={3} />
                        </span>
                      )}
                    </div>
                    <h4 className="font-extrabold text-sm text-slate-900">{preset.title}</h4>
                    <p className="text-xs text-slate-500 mt-1 leading-snug">{preset.description}</p>
                  </div>

                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 mt-3 pt-2.5 border-t border-slate-100">
                    <span>⏱️ {preset.duration} Mins</span>
                    <span>🎯 {preset.totalMarks} Marks</span>
                    <span className="text-rose-600">Neg: -{preset.negativeMarks}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* SECTION BLUEPRINT CARD */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-indigo-600" />
              Active Blueprint: {currentPreset.title} Sections
            </span>
            <span className="text-[11px] font-bold text-indigo-600 bg-white px-2.5 py-0.5 rounded-md border border-slate-200">
              {currentPreset.sections.length} Subject Sections Configured
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
            {currentPreset.sections.map((sec, idx) => (
              <div key={idx} className="bg-white p-3 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-800">{sec.name}</p>
                  <p className="text-[10px] text-slate-400 font-medium">{sec.count} Questions • +4, -{currentPreset.negativeMarks}</p>
                </div>
                <span className="font-black text-indigo-600 text-sm">{sec.marks}M</span>
              </div>
            ))}
          </div>
        </div>

        {/* STEP 2: EXAM DETAILS & TARGET AUDIENCE */}
        <div className="space-y-4 pt-2">
          <label className="block text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-2">
            <Target className="w-4 h-4 text-indigo-600" />
            Step 2: Test Details & Target Classes
          </label>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Exam Name */}
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">
                Official Exam Title *
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 font-bold focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition text-sm"
              />
            </div>

            {/* Target Class (Smart Filtered) */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-bold text-slate-600 uppercase">
                  Target Class Batch *
                </label>
                <span className="text-[10px] text-indigo-600 font-bold">Recommended: 10th / 9th</span>
              </div>
              <select
                value={formData.classId}
                onChange={e => setFormData({ ...formData, classId: e.target.value })}
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 font-bold focus:border-indigo-500 outline-none text-sm cursor-pointer"
              >
                {classes.length === 0 && (
                  <option value="">⏳ Loading classes from school...</option>
                )}
                {seniorClasses.length > 0 && (
                  <optgroup label="🌟 Senior Classes (IIT-JEE / NEET Standard)">
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
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Exam Date */}
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">Exam Date</label>
              <input
                type="date"
                required
                value={formData.examDate}
                onChange={e => setFormData({ ...formData, examDate: e.target.value })}
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 font-bold outline-none text-sm cursor-pointer"
              />
            </div>

            {/* Start Time */}
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">Start Time</label>
              <input
                type="time"
                required
                value={formData.startTime}
                onChange={e => setFormData({ ...formData, startTime: e.target.value })}
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 font-bold outline-none text-sm cursor-pointer"
              />
            </div>

            {/* Duration */}
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">Duration (Minutes)</label>
              <input
                type="number"
                required
                value={formData.duration}
                onChange={e => setFormData({ ...formData, duration: Number(e.target.value) })}
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 font-bold outline-none text-sm"
              />
            </div>
          </div>
        </div>

        {/* Original Exam Setup Info */}
        <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200/80 flex items-center gap-3">
          <FileQuestion className="w-6 h-6 text-indigo-600 shrink-0" />
          <div>
            <span className="text-xs font-black text-indigo-950">
              Original School Exam Creation
            </span>
            <p className="text-[11px] text-indigo-800 font-medium mt-0.5">
              This will create your school's official online exam. After creation, you can add questions manually or synthesize questions for your curriculum in the Question Bank.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end items-center gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-3 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition cursor-pointer text-xs"
          >
            Cancel
          </button>
          
          <button
            type="submit"
            disabled={loading}
            className="px-8 py-3.5 rounded-xl font-extrabold text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg shadow-indigo-500/25 transition flex items-center gap-2 cursor-pointer disabled:opacity-50 text-xs sm:text-sm hover:scale-[1.02]"
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
      </form>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
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
  const [examData, setExamData] = useState<any>(exam);
  const [activeSection, setActiveSection] = useState<string>('ALL');

  useEffect(() => {
    const loadDetails = async () => {
      try {
        const res = await api.get(`/api/competitive-exams/${exam.id}`);
        if (res.data?.data) {
          setExamData(res.data.data);
        }
      } catch (err) {
        console.warn('Failed to load full exam paper details:', err);
      } finally {
        setLoading(false);
      }
    };
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

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between gap-4 shrink-0 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-3 py-0.5 rounded-full bg-indigo-500/30 text-indigo-300 text-[10px] font-black uppercase tracking-wider border border-indigo-400/30">
                Official NTA CBT Question Paper
              </span>
              <span className="text-xs text-slate-400 font-bold">Class: {examData.class?.name || '10th Standard'}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white line-clamp-1">
              {examData.title}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer border border-white/10"
              title="Print Question Paper"
            >
              <Printer className="w-4 h-4 text-amber-300" />
              <span className="hidden sm:inline">Print Paper</span>
            </button>
            <button
              onClick={() => {
                onClose();
                navigate(`/take-competitive-exam/${examData.id}`);
              }}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-black flex items-center gap-1.5 shadow transition cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>Launch CBT Exam</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Paper Metadata Ribbon */}
        <div className="bg-slate-100 px-6 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs font-bold text-slate-600 shrink-0">
          <div className="flex items-center gap-4 sm:gap-6">
            <span>⏱️ Duration: <strong className="text-slate-900">{examData.duration} Mins</strong></span>
            <span>🎯 Total Marks: <strong className="text-indigo-600">{examData.totalMarks}</strong></span>
            <span>📝 Questions: <strong className="text-emerald-600">{questions.length}</strong></span>
            <span>⚖️ Marking: <strong className="text-rose-600">+{examData.totalMarks > 400 ? '4' : '4'} / -{examData.negativeMarks || 1}</strong></span>
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

        {/* Paper Content / Questions List */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 bg-slate-50">
          {loading ? (
            <div className="py-20 text-center">
              <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-3" />
              <p className="text-slate-500 font-bold text-sm">Loading complete question paper with KaTeX math rendering...</p>
            </div>
          ) : filteredQuestions.length === 0 ? (
            <div className="py-16 text-center bg-white rounded-2xl border border-dashed border-slate-300">
              <FileQuestion className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h4 className="font-black text-slate-700 text-base">No questions in this section yet</h4>
              <p className="text-slate-400 text-xs mt-1">Questions will appear here once added to this exam.</p>
            </div>
          ) : (
            filteredQuestions.map((q: any, qIdx: number) => {
              let parsedOptions: string[] = [];
              try {
                parsedOptions = typeof q.options === 'string' ? JSON.parse(q.options) : (q.options || []);
              } catch {
                parsedOptions = ['Option A', 'Option B', 'Option C', 'Option D'];
              }

              const optLetters = ['A', 'B', 'C', 'D', 'E', 'F'];

              return (
                <div
                  key={q.id || qIdx}
                  className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-200 space-y-4 hover:border-indigo-200 transition"
                >
                  {/* Question Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <span className="w-8 h-8 rounded-xl bg-indigo-600 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-sm">
                        Q{qIdx + 1}
                      </span>
                      {q.chapterName && (
                        <span className="px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-700 font-bold text-[11px] border border-slate-200">
                          {q.chapterName}
                        </span>
                      )}
                      <span className="px-2 py-0.5 rounded-lg bg-indigo-50 text-indigo-700 font-bold text-[10px]">
                        {q.difficulty || 'MEDIUM'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100">
                        +{q.marks || 4} Marks
                      </span>
                      <span className="text-xs font-black text-rose-500 bg-rose-50 px-2 py-0.5 rounded-lg border border-rose-100">
                        -{examData.negativeMarks || 1} Neg
                      </span>
                    </div>
                  </div>

                  {/* Question Text */}
                  <div className="text-slate-800 text-sm sm:text-base font-semibold leading-relaxed pl-1">
                    <LatexRenderer text={q.questionText} />
                  </div>

                  {/* Question Image if present */}
                  {q.imageUrl && (
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl inline-block">
                      <img src={q.imageUrl} alt="Question Diagram" className="max-h-60 object-contain rounded-lg" />
                    </div>
                  )}

                  {/* 4 Options Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    {parsedOptions.map((opt: string, optIdx: number) => {
                      const isCorrect = String(opt).trim() === String(q.correctAnswer).trim() || optLetters[optIdx] === String(q.correctAnswer).trim();

                      return (
                        <div
                          key={optIdx}
                          className={`p-3.5 rounded-xl border flex items-start gap-3 transition ${
                            isCorrect
                              ? 'bg-emerald-50/80 border-emerald-300 ring-1 ring-emerald-300'
                              : 'bg-slate-50/60 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          <span
                            className={`w-6 h-6 rounded-lg font-black text-xs flex items-center justify-center shrink-0 ${
                              isCorrect
                                ? 'bg-emerald-600 text-white'
                                : 'bg-slate-200 text-slate-700'
                            }`}
                          >
                            {optLetters[optIdx]}
                          </span>
                          <div className="flex-1 text-xs sm:text-sm font-medium text-slate-800 leading-snug">
                            <LatexRenderer text={opt} />
                          </div>
                          {isCorrect && (
                            <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-extrabold text-[10px] shrink-0 flex items-center gap-1">
                              <Check className="w-3 h-3 text-emerald-700" /> Correct
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
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
// QUESTION BANK TAB (FULLY INTERACTIVE & REAL-TIME WITH KATEX)
// ═══════════════════════════════════════════════════════════════

const QuestionBankTab = ({ 
  exams, 
  selectedExamId, 
  setSelectedExamId, 
  onOpenAiModal, 
  onExamsUpdated, 
  navigate 
}: any) => {
  const [questions, setQuestions] = useState<any[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [isAddingQuestion, setIsAddingQuestion] = useState(false);
  const [showAiTextParserModal, setShowAiTextParserModal] = useState(false);

  const fetchQuestions = async (examId: string) => {
    if (!examId) {
      setQuestions([]);
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
    if (selectedExamId) {
      fetchQuestions(selectedExamId);
    } else if (exams.length > 0) {
      setSelectedExamId(exams[0].id);
    }
  }, [selectedExamId, exams]);

  const activeExam = exams.find((e: any) => e.id === selectedExamId) || exams[0];

  // If authoring mode is active, render the Dedicated Full Question Studio view
  if (isAddingQuestion && activeExam) {
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

  const handleDeleteQuestion = async (qId: string) => {
    if (!window.confirm('Are you sure you want to delete this question?')) return;
    try {
      await api.delete(`/api/competitive-exams/question/${qId}`);
      toast.success('Question deleted successfully');
      fetchQuestions(selectedExamId);
      onExamsUpdated();
    } catch (e) {
      toast.error('Failed to delete question');
    }
  };

  if (exams.length === 0) {
    return (
      <div className="p-16 flex flex-col items-center justify-center text-center bg-white rounded-3xl border border-slate-200 shadow-sm">
        <Database size={64} className="text-indigo-200 mb-4" />
        <h3 className="text-xl font-bold text-slate-800">No Exams Available</h3>
        <p className="text-slate-500 max-w-md mt-2">
          Create an exam first to start building or generating its question bank.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Controls Card */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex-1 w-full md:w-auto">
          <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">
            Select Exam to View & Manage Questions
          </label>
          <div className="flex items-center gap-3">
            <select
              value={selectedExamId}
              onChange={e => setSelectedExamId(e.target.value)}
              className="w-full md:max-w-md p-3 bg-slate-50 border border-slate-200 rounded-xl font-black text-slate-800 text-sm outline-none focus:border-indigo-500 focus:bg-white"
            >
              {exams.map((ex: any) => (
                <option key={ex.id} value={ex.id}>
                  {ex.title} ({ex._count?.questions || ex.questions?.length || 0} Questions)
                </option>
              ))}
            </select>
            
            <button
              onClick={() => fetchQuestions(selectedExamId)}
              className="p-3 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-700 transition cursor-pointer"
              title="Refresh Questions"
            >
              <RefreshCw size={18} className={loadingQuestions ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
          <button
            onClick={() => navigate(activeExam ? `/competitive-exams/${activeExam.id}/paste-ai` : '/competitive-exams/paste-ai')}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-xs flex items-center gap-1.5 shadow-sm transition hover:scale-105 cursor-pointer"
            title="Open Dedicated Full Page AI Text Parser"
          >
            <FileText size={16} className="text-emerald-200" /> 📄 Paste Exam Text (AI Parser)
          </button>

          <button
            onClick={() => activeExam && onOpenAiModal(activeExam)}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition cursor-pointer"
          >
            <Sparkles size={16} className="text-amber-300" /> ✨ AI Generate Questions
          </button>

          <button
            onClick={() => setIsAddingQuestion(true)}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition cursor-pointer"
          >
            <Plus size={16} /> Add Manually
          </button>
        </div>
      </div>

      {/* Exam Details Summary Pill */}
      {activeExam && (
        <div className="bg-slate-100 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs font-semibold text-slate-700 border border-slate-200">
          <div className="flex items-center gap-2">
            <span className="font-black text-slate-900">{activeExam.title}</span>
            <span>•</span>
            <span className="text-indigo-600 font-bold">{questions.length} Total Questions</span>
          </div>
          <div className="flex items-center gap-4 text-slate-500">
            <span>Duration: <b>{activeExam.duration}m</b></span>
            <span>Total Marks: <b>{activeExam.totalMarks}</b></span>
            <span>Negative: <b>-{activeExam.negativeMarks || 0}</b></span>
          </div>
        </div>
      )}

      {/* Questions List with KaTeX math formula rendering */}
      {loadingQuestions ? (
        <div className="p-16 flex flex-col items-center justify-center bg-white rounded-3xl border border-slate-200 shadow-sm">
          <RefreshCw className="w-8 h-8 animate-spin text-indigo-600 mb-2" />
          <p className="text-slate-500 font-bold text-sm">Loading questions from Question Bank...</p>
        </div>
      ) : questions.length === 0 ? (
        <div className="p-12 flex flex-col items-center justify-center text-center bg-white rounded-3xl border border-slate-200 shadow-sm">
          <FileQuestion size={48} className="text-indigo-200 mb-3" />
          <h4 className="text-base font-bold text-slate-800">No Questions Added to this Exam</h4>
          <p className="text-xs text-slate-500 mt-1 max-w-sm">
            Add questions manually or let Google Gemini AI synthesize high-quality MCQs with negative marks and solutions.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 mt-5">
            <button
              onClick={() => navigate(activeExam ? `/competitive-exams/${activeExam.id}/paste-ai` : '/competitive-exams/paste-ai')}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-black hover:from-emerald-700 hover:to-teal-700 transition flex items-center gap-1.5 shadow-md cursor-pointer hover:scale-105"
            >
              <FileText size={15} className="text-emerald-200" /> 📄 Paste Exam Text (AI Parser)
            </button>
            <button
              onClick={() => activeExam && onOpenAiModal(activeExam)}
              className="px-4 py-2.5 rounded-xl bg-purple-600 text-white text-xs font-bold hover:bg-purple-700 transition flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles size={14} className="text-amber-300" /> ✨ AI Generate Now
            </button>
            <button
              onClick={() => setIsAddingQuestion(true)}
              className="px-4 py-2.5 rounded-xl bg-slate-800 text-white text-xs font-bold hover:bg-slate-900 transition cursor-pointer"
            >
              + Add Manually
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {questions.map((q: any, idx: number) => {
            let options: string[] = [];
            try {
              options = typeof q.options === 'string' ? JSON.parse(q.options) : (q.options || []);
            } catch (e) {
              options = ['Option A', 'Option B', 'Option C', 'Option D'];
            }

            return (
              <div 
                key={q.id || idx} 
                className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 hover:border-indigo-300 transition"
              >
                {/* Header row */}
                <div className="flex justify-between items-start gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-black text-xs flex items-center justify-center">
                      Q{idx + 1}
                    </span>
                    <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md">
                      {q.chapterName || 'General'}
                    </span>
                    <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                      {q.difficulty || 'MEDIUM'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
                      +{q.marks || 4} Marks
                    </span>
                    <button
                      onClick={() => handleDeleteQuestion(q.id)}
                      className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                      title="Delete Question"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {/* Question Text with KaTeX Rendering */}
                <div className="text-sm font-bold text-slate-800 mb-4 whitespace-pre-wrap leading-relaxed">
                  <LatexRenderer text={q.questionText} />
                </div>

                {/* Options 2x2 grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                  {options.map((opt: string, oIdx: number) => {
                    const isCorrect = opt === q.correctAnswer;
                    const optLetter = String.fromCharCode(65 + oIdx);

                    return (
                      <div
                        key={oIdx}
                        className={`p-3 rounded-xl border flex items-center gap-2.5 transition ${
                          isCorrect
                            ? 'bg-emerald-50 border-emerald-400 text-emerald-900 font-black shadow-xs'
                            : 'bg-slate-50 border-slate-200 text-slate-700 font-medium'
                        }`}
                      >
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${
                          isCorrect ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
                        }`}>
                          {optLetter}
                        </span>
                        <span className="flex-1">
                          <LatexRenderer text={opt} />
                        </span>
                        {isCorrect && (
                          <span className="text-[10px] uppercase font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                            Correct
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



      {/* AI Text Parser Modal */}
      {showAiTextParserModal && (
        <AiTextParserModal
          exam={activeExam}
          onClose={() => setShowAiTextParserModal(false)}
          onParsedAndAdded={() => {
            setShowAiTextParserModal(false);
            fetchQuestions(selectedExamId);
            onExamsUpdated();
          }}
        />
      )}
    </div>
  );
};

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
                      onClick={() => onPreviewPaper(exam)}
                      className="py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                    >
                      <Eye className="w-4 h-4 text-cyan-400" /> View Paper
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
            Google Gemini 2.5 powered automated MCQ generator with LaTeX math formulas, negative marks, and difficulty tiering (Easy, Medium, Hard).
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
// RESULTS & RANKS TAB
// ═══════════════════════════════════════════════════════════════

const ResultsAndRanksTab = ({ exams, navigate }: any) => {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-lg font-black text-slate-800">Exam Results & Rank Lists</h2>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="divide-y divide-slate-100">
          {exams.map((exam: any) => {
            const subCount = exam._count?.submissions || exam.submissions?.length || 0;
            return (
              <div key={exam.id} className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-slate-50/80 transition">
                <div>
                  <h4 className="font-extrabold text-slate-900 text-base">{exam.title}</h4>
                  <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                    <span>Duration: {exam.duration}m</span>
                    <span>•</span>
                    <span>Max Marks: {exam.totalMarks}</span>
                    <span>•</span>
                    <span className="font-bold text-indigo-600">{subCount} Students Submitted</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => navigate(`/competitive-exam-leaderboard/${exam.id}`)}
                    className="px-4 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs border border-indigo-200 flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Award className="w-4 h-4 text-amber-500" /> View Rank List
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
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
// AI TEXT PARSER MODAL (PASTE RAW EXAM PAPER -> CBT QUESTIONS)
// ═══════════════════════════════════════════════════════════════

const AiTextParserModal = ({ exam, onClose, onParsedAndAdded }: any) => {
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
        toast.success(`🎉 Successfully extracted ${extracted.length} questions with Gemini AI!`);
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
      toast.success(`✅ Successfully added ${parsedQuestions.length} questions to exam!`);
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
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl border border-slate-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 via-teal-900 to-slate-900 text-white p-5 sm:p-6 flex justify-between items-center shrink-0">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-black uppercase tracking-wider mb-1">
              <Sparkles size={13} className="text-amber-300" /> Gemini 2.5 Flash AI Engine
            </div>
            <h3 className="text-lg sm:text-xl font-black flex items-center gap-2">
              <FileText className="w-5 h-5 text-emerald-400" /> Paste Exam Text (AI Smart Parser)
            </h3>
            <p className="text-xs text-slate-300 mt-0.5">
              Target Exam: <span className="font-bold text-white">{exam?.title}</span> • Instant KaTeX Math & Options Conversion
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full cursor-pointer transition text-slate-300 hover:text-white">
            <X size={22} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 sm:p-6 space-y-6 overflow-y-auto flex-1">
          {parsedQuestions.length === 0 ? (
            /* Input / Paste Form */
            <form onSubmit={handleParseText} className="space-y-4">
              <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 text-xs text-emerald-900">
                <p className="font-bold flex items-center gap-2 text-emerald-800 text-sm mb-1">
                  💡 How it works:
                </p>
                <p className="leading-relaxed">
                  Paste raw exam questions from Word, PDF, or text notes. Google Gemini 2.5 Flash AI automatically recognizes math equations ($LaTeX$), organizes 4 options (A, B, C, D), and detects answer keys in seconds.
                </p>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 uppercase mb-1.5 flex items-center justify-between">
                  <span>Paste Exam Questions Text Here *</span>
                  <span className="text-[11px] text-slate-400 font-semibold">Supports Multiple MCQs & Math Formulas</span>
                </label>
                <textarea
                  value={rawText}
                  onChange={e => setRawText(e.target.value)}
                  rows={10}
                  className="w-full border border-slate-200 rounded-2xl p-4 text-xs sm:text-sm font-mono text-slate-800 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 bg-slate-50 focus:bg-white transition"
                  placeholder={`Example format:

1. A particle starts from rest and moves with acceleration a = 4 m/s². What is its velocity after 5 seconds?
(A) 20 m/s
(B) 25 m/s
(C) 15 m/s
(D) 10 m/s
Ans: A

2. If $f(x) = x^2 + 2x$, what is the derivative $f'(x)$?
A) $2x + 2$
B) $x^2$
C) $2x$
D) $x + 2$
Correct: A`}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Subject / Chapter Section Hint
                  </label>
                  <input
                    type="text"
                    value={chapterHint}
                    onChange={e => setChapterHint(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl p-3 text-xs sm:text-sm font-bold text-slate-800 outline-none focus:border-emerald-500 bg-white"
                    placeholder="e.g. Mathematics / Calculus or Physics"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
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

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-3 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition cursor-pointer text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={parsing || !rawText.trim()}
                  className="px-6 py-3 rounded-xl font-black text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-md transition cursor-pointer disabled:opacity-50 flex items-center gap-2 text-xs hover:scale-105"
                >
                  {parsing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" /> 🤖 Gemini AI Digitizing Questions...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-amber-300" /> ⚡ Parse with AI (Gemini 2.5 Flash)
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            /* Parsed Questions Preview Screen */
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl">
                <div>
                  <h4 className="text-sm font-black text-emerald-900 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    AI Review: {parsedQuestions.length} Questions Ready to Add
                  </h4>
                  <p className="text-xs text-emerald-700 mt-0.5">
                    Review parsed questions and options below. You can edit the correct answer or remove questions before saving.
                  </p>
                </div>
                <button
                  onClick={() => setParsedQuestions([])}
                  className="px-3.5 py-1.5 rounded-xl border border-emerald-300 text-emerald-800 hover:bg-emerald-100 text-xs font-bold transition cursor-pointer"
                >
                  Paste Different Text
                </button>
              </div>

              {/* Questions List */}
              <div className="space-y-3">
                {parsedQuestions.map((q, idx) => {
                  const opts: string[] = Array.isArray(q.options) ? q.options : ['A', 'B', 'C', 'D'];
                  return (
                    <div key={idx} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 hover:border-emerald-300 transition relative">
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

                      {/* Question Text with KaTeX */}
                      <div className="text-xs sm:text-sm font-bold text-slate-800 leading-relaxed mb-3">
                        <LatexRenderer text={q.questionText} />
                      </div>

                      {/* Options Grid */}
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

                      {/* Correct Answer Dropdown Editor */}
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
            </div>
          )}
        </div>

        {/* Footer */}
        {parsedQuestions.length > 0 && (
          <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex justify-between items-center shrink-0">
            <button
              onClick={() => setParsedQuestions([])}
              className="px-4 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-slate-200 transition text-xs cursor-pointer"
            >
              Cancel & Start Over
            </button>
            <button
              onClick={handleSaveToExam}
              disabled={saving}
              className="px-6 py-3 rounded-xl font-black text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-md transition cursor-pointer disabled:opacity-50 flex items-center gap-2 text-xs hover:scale-105"
            >
              {saving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> Saving Questions to Exam...
                </>
              ) : (
                <>
                  <CheckCircle2 size={16} /> Confirm & Save All ({parsedQuestions.length}) Questions
                </>
              )}
            </button>
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

const StatCard = ({ title, value, color, icon }: any) => {
  const colors: any = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200/80',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-200/80',
    purple: 'bg-purple-50 text-purple-600 border-purple-200/80',
    amber: 'bg-amber-50 text-amber-600 border-amber-200/80',
  };
  return (
    <div className={`p-5 rounded-3xl border ${colors[color]} flex items-center justify-between shadow-xs`}>
      <div>
        <p className="text-[11px] font-black uppercase tracking-wider mb-0.5 opacity-75">{title}</p>
        <h3 className="text-3xl font-black text-slate-900">{value}</h3>
      </div>
      <div className="w-10 h-10 rounded-2xl bg-white/80 shadow-xs flex items-center justify-center">
        {icon}
      </div>
    </div>
  );
};

export default CompetitiveExamsPage;
