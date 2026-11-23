import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { 
  Play, Plus, Clock, FileText, CheckCircle, Edit, ShieldAlert, Award, FileQuestion, Users, RefreshCw, Trash2, BarChart3, Activity, TrendingUp, AlertTriangle, BookOpen, ChevronRight, CheckCircle2, XCircle, MinusCircle, Database, LayoutDashboard, List, UploadCloud, Download, Sparkles, Zap, Shield, HelpCircle, Check, ArrowRight, ExternalLink, X, Calendar, Hash, Target
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import toast from 'react-hot-toast';

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

const AdminCompetitiveDashboard = ({ navigate }: { navigate: any }) => {
  const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'MANAGE_EXAMS' | 'QUESTION_BANK' | 'RESULTS'>('MANAGE_EXAMS');
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Inline Create Form & Modals
  const [showInlineCreate, setShowInlineCreate] = useState(false);
  const [aiModalExam, setAiModalExam] = useState<any | null>(null);
  const [selectedExamIdForQB, setSelectedExamIdForQB] = useState<string>('');

  const fetchExams = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/competitive-exams/admin');
      const loadedExams = res.data?.data || [];
      setExams(loadedExams);
      if (loadedExams.length > 0 && !selectedExamIdForQB) {
        setSelectedExamIdForQB(loadedExams[0].id);
      }
    } catch (err: any) {
      console.warn('Admin route error, trying student route fallback:', err);
      try {
        const res2 = await api.get('/api/competitive-exams/student');
        const fallback = res2.data?.data || [];
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
    setSelectedExamIdForQB(examId);
    setActiveTab('QUESTION_BANK');
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 bg-slate-50 min-h-screen">
      {/* Executive Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 md:p-8 rounded-3xl text-white shadow-xl border border-indigo-500/20 relative overflow-hidden">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 rounded-full bg-indigo-500/20 border border-indigo-400/30 px-3 py-1 text-xs font-semibold text-indigo-200 mb-2">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            NTA Style Computer Based Test (CBT) & OMR Platform
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight flex items-center gap-3">
            <BookOpen className="h-8 w-8 text-blue-400" />
            Competitive Exams (JEE / NEET)
          </h1>
          <p className="text-slate-300 text-sm mt-1 max-w-2xl font-medium">
            Complete Management for Objective Type Exams (JEE Mains, NEET UG, Navodaya Entrance, EAMCET & State Exams).
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
            <Plus className="w-5 h-5" /> Create New Exam
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
          active={activeTab === 'QUESTION_BANK'} 
          onClick={() => setActiveTab('QUESTION_BANK')} 
          icon={<Database size={18} />} 
          label={`Question Bank (${totalQuestions})`} 
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
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// MANAGE EXAMS TAB (WITH FUNCTIONAL INLINE CREATE FORM)
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
  navigate 
}: any) => {
  return (
    <div className="space-y-6">
      {/* Inline Create Form (Matches User Screenshot Exactly) */}
      {showInlineCreate && (
        <InlineCreateExamForm 
          onClose={() => setShowInlineCreate(false)}
          onCreated={() => {
            setShowInlineCreate(false);
            onRefresh();
          }}
        />
      )}

      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-lg font-black text-slate-800">Available NTA Mock Tests & Online Exams</h2>
          <p className="text-xs text-slate-500 font-medium">Real-time CBT simulated test suite for students</p>
        </div>
        
        {!showInlineCreate && (
          <button
            onClick={() => setShowInlineCreate(true)}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition cursor-pointer"
          >
            <Plus size={16} /> Create Competitive Exam
          </button>
        )}
      </div>

      {loading ? (
        <div className="p-16 flex flex-col items-center justify-center bg-white rounded-3xl border border-slate-200 shadow-sm">
          <RefreshCw className="w-10 h-10 animate-spin text-indigo-600 mb-3" />
          <p className="text-slate-600 font-bold">Loading NTA Competitive Exams...</p>
        </div>
      ) : exams.length === 0 ? (
        <div className="p-16 flex flex-col items-center justify-center text-center bg-white rounded-3xl border border-slate-200 shadow-sm">
          <FileText size={64} className="text-indigo-200 mb-4" />
          <h3 className="text-xl font-bold text-slate-800">No Competitive Exams Found</h3>
          <p className="text-slate-500 max-w-md mt-2">
            Create your first JEE Mains, NEET, or Navodaya pattern mock test with automated negative marking and AI question generator.
          </p>
          <button
            onClick={() => setShowInlineCreate(true)}
            className="mt-6 px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold flex items-center gap-2 shadow-md transition cursor-pointer"
          >
            <Plus size={18} /> Create First Competitive Exam
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {exams.map((exam: any) => {
            const qCount = exam._count?.questions || exam.questions?.length || 0;
            const subCount = exam._count?.submissions || exam.submissions?.length || 0;
            const isJee = exam.title.toUpperCase().includes('JEE');
            const isNeet = exam.title.toUpperCase().includes('NEET');
            const isNavodaya = exam.title.toUpperCase().includes('NAVODAYA');

            let patternTag = 'NTA CBT PATTERN';
            let patternBadgeBg = 'bg-blue-100 text-blue-800 border-blue-200';
            if (isJee) {
              patternTag = 'JEE MAINS PATTERN (+4, -1)';
              patternBadgeBg = 'bg-indigo-100 text-indigo-800 border-indigo-200';
            } else if (isNeet) {
              patternTag = 'NEET UG PATTERN (+4, -1)';
              patternBadgeBg = 'bg-emerald-100 text-emerald-800 border-emerald-200';
            } else if (isNavodaya) {
              patternTag = 'NAVODAYA ENTRANCE (+5, 0)';
              patternBadgeBg = 'bg-amber-100 text-amber-800 border-amber-200';
            }

            return (
              <div
                key={exam.id}
                className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div>
                  {/* Header row */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <span className={`text-[11px] font-black uppercase tracking-wider px-3 py-1 rounded-full border ${patternBadgeBg}`}>
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

                  {/* Meta Tags */}
                  <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-slate-500 mt-2">
                    <span className="bg-slate-100 px-2.5 py-1 rounded-lg">
                      📚 Class: {exam.class?.name || 'All Classes'}
                    </span>
                    <span className="bg-slate-100 px-2.5 py-1 rounded-lg">
                      🧪 {exam.subject?.name || 'Multiple Subjects'}
                    </span>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-4 gap-2 my-4 p-3 rounded-2xl bg-slate-50 border border-slate-100 text-center">
                    <div>
                      <div className="text-xs text-slate-400 font-semibold uppercase">Duration</div>
                      <div className="text-sm font-black text-slate-800">{exam.duration}m</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-400 font-semibold uppercase">Total Marks</div>
                      <div className="text-sm font-black text-indigo-600">{exam.totalMarks}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-400 font-semibold uppercase">Questions</div>
                      <div className="text-sm font-black text-emerald-600">{qCount}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-400 font-semibold uppercase">Negative</div>
                      <div className="text-sm font-black text-rose-600">-{exam.negativeMarks || 0}</div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  {/* Primary Launch CBT Exam Button */}
                  <button
                    onClick={() => navigate(`/take-competitive-exam/${exam.id}`)}
                    className="w-full py-3 px-4 rounded-xl text-white font-extrabold text-xs shadow-md bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition flex items-center justify-center gap-2 cursor-pointer group-hover:scale-[1.01]"
                  >
                    <Play className="w-4 h-4 fill-white" />
                    Launch Authentic NTA CBT Exam Simulator
                  </button>

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

                  <div className="flex items-center justify-between pt-1">
                    <button
                      onClick={() => onOpenAiModal(exam)}
                      className="text-xs font-extrabold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" /> ✨ AI Generate Questions
                    </button>

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
// INLINE CREATE EXAM FORM (MATCHES SCREENSHOT 4 EXACTLY)
// ═══════════════════════════════════════════════════════════════

const InlineCreateExamForm = ({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) => {
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    title: 'JEE MAINS MODEL EXAMINATION',
    examType: 'JEE Mains Pattern',
    pattern: 'JEE_MAINS',
    totalMarks: 300,
    duration: 180,
    passMarks: 100,
    negativeMarks: 1,
    examDate: new Date().toISOString().split('T')[0],
    classId: '',
    subjectId: '',
  });

  useEffect(() => {
    api.get('/api/classes').then(res => {
      const cls = res.data?.data || res.data || [];
      setClasses(cls);
      if (cls.length > 0) setFormData(prev => ({ ...prev, classId: cls[0].id }));
    }).catch(() => {});

    api.get('/api/subjects').then(res => {
      const subs = res.data?.data || res.data || [];
      setSubjects(subs);
      if (subs.length > 0) setFormData(prev => ({ ...prev, subjectId: subs[0].id }));
    }).catch(() => {});
  }, []);

  const handleExamTypeChange = (type: string) => {
    if (type === 'JEE Mains Pattern') {
      setFormData(prev => ({
        ...prev,
        examType: type,
        pattern: 'JEE_MAINS',
        title: prev.title.includes('NEET') || prev.title.includes('Navodaya') ? 'JEE MAINS MODEL EXAMINATION' : prev.title,
        duration: 180,
        totalMarks: 300,
        passMarks: 100,
        negativeMarks: 1,
      }));
    } else if (type === 'NEET Pattern') {
      setFormData(prev => ({
        ...prev,
        examType: type,
        pattern: 'NEET',
        title: 'NEET UG ALL INDIA PRACTICE TEST',
        duration: 200,
        totalMarks: 720,
        passMarks: 250,
        negativeMarks: 1,
      }));
    } else if (type === 'Navodaya / Sainik School') {
      setFormData(prev => ({
        ...prev,
        examType: type,
        pattern: 'NAVODAYA',
        title: 'NAVODAYA CLASS 6 ENTRANCE MODEL EXAM',
        duration: 120,
        totalMarks: 100,
        passMarks: 40,
        negativeMarks: 0,
      }));
    } else if (type === 'State EAMCET / EAPCET') {
      setFormData(prev => ({
        ...prev,
        examType: type,
        pattern: 'EAMCET',
        title: 'STATE EAMCET / EAPCET PRACTICE EXAM',
        duration: 180,
        totalMarks: 160,
        passMarks: 40,
        negativeMarks: 0,
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        examType: type,
        pattern: 'CUSTOM',
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error('Please enter exam title');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        title: formData.title,
        duration: Number(formData.duration) || 180,
        totalMarks: Number(formData.totalMarks) || 300,
        passMarks: Number(formData.passMarks) || 100,
        negativeMarks: Number(formData.negativeMarks) || 1,
        startTime: new Date(`${formData.examDate}T09:00:00`).toISOString(),
        endTime: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        classId: formData.classId || undefined,
        subjectId: formData.subjectId || undefined,
        isPublished: true,
      };

      await api.post('/api/competitive-exams', payload);
      toast.success('Competitive Exam created successfully!');
      onCreated();
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to create exam');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 md:p-8 shadow-md border border-slate-200 transition-all">
      <div className="flex justify-between items-center pb-4 mb-6 border-b border-slate-100">
        <div>
          <h3 className="text-lg font-black text-slate-800">Create Competitive Exam</h3>
          <p className="text-xs text-slate-500 font-medium">Configure new objective CBT examination</p>
        </div>
        <button 
          onClick={onClose} 
          className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition cursor-pointer"
        >
          <X size={20} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Exam Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-2">
              Exam Name (e.g. Grand Test - 1)
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 font-bold focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition"
              placeholder="e.g. JEE MAINS MODEL EXAMINATION"
            />
          </div>

          {/* Exam Type */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-2">
              Exam Type
            </label>
            <select
              value={formData.examType}
              onChange={e => handleExamTypeChange(e.target.value)}
              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 font-bold focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition cursor-pointer"
            >
              <option value="JEE Mains Pattern">JEE Mains Pattern</option>
              <option value="NEET Pattern">NEET Pattern</option>
              <option value="Navodaya / Sainik School">Navodaya / Sainik School</option>
              <option value="State EAMCET / EAPCET">State EAMCET / EAPCET</option>
              <option value="Custom Mock Test">Custom Mock Test</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Total Marks */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-2">
              Total Marks
            </label>
            <input
              type="number"
              required
              value={formData.totalMarks}
              onChange={e => setFormData({ ...formData, totalMarks: Number(e.target.value) })}
              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 font-bold focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition"
            />
          </div>

          {/* Duration */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-2">
              Duration (Minutes)
            </label>
            <input
              type="number"
              required
              value={formData.duration}
              onChange={e => setFormData({ ...formData, duration: Number(e.target.value) })}
              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 font-bold focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition"
            />
          </div>

          {/* Exam Date */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-2">
              Exam Date
            </label>
            <input
              type="date"
              required
              value={formData.examDate}
              onChange={e => setFormData({ ...formData, examDate: e.target.value })}
              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 font-bold focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition cursor-pointer"
            />
          </div>
        </div>

        {/* Target Class & Subject optional selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-2">
              Target Class
            </label>
            <select
              value={formData.classId}
              onChange={e => setFormData({ ...formData, classId: e.target.value })}
              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 font-medium focus:border-indigo-500 outline-none"
            >
              {classes.map(c => (
                <option key={c.id} value={c.id}>{c.name} {c.section ? `(${c.section})` : ''}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-2">
              Subject
            </label>
            <select
              value={formData.subjectId}
              onChange={e => setFormData({ ...formData, subjectId: e.target.value })}
              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 font-medium focus:border-indigo-500 outline-none"
            >
              {subjects.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Notice Alert */}
        <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-blue-800 text-xs flex items-center gap-2">
          <AlertTriangle size={18} className="text-blue-600 shrink-0" />
          <span>After creating the exam, you can configure subject-wise negative marking and cutoffs in the Manage Exams tab.</span>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end items-center gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-3 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition cursor-pointer"
          >
            Cancel
          </button>
          
          <button
            type="submit"
            disabled={loading}
            className="px-8 py-3 rounded-xl font-extrabold text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg shadow-indigo-500/25 transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" /> Creating Exam...
              </>
            ) : (
              'Create Exam'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// QUESTION BANK TAB (FULLY INTERACTIVE & REAL-TIME)
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
  const [showAddModal, setShowAddModal] = useState(false);

  // Load questions whenever selectedExamId changes
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
      // Fallback endpoint
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
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition cursor-pointer"
          >
            <Plus size={16} /> Add Question Manually
          </button>

          <button
            onClick={() => activeExam && onOpenAiModal(activeExam)}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition cursor-pointer"
          >
            <Sparkles size={16} className="text-amber-300" /> ✨ AI Generate Questions
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

      {/* Questions List */}
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
          <div className="flex items-center gap-3 mt-5">
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition"
            >
              + Add Question Manually
            </button>
            <button
              onClick={() => activeExam && onOpenAiModal(activeExam)}
              className="px-4 py-2.5 rounded-xl bg-purple-600 text-white text-xs font-bold hover:bg-purple-700 transition flex items-center gap-1.5"
            >
              <Sparkles size={14} className="text-amber-300" /> ✨ AI Generate Now
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

                {/* Question Text */}
                <p className="text-sm font-bold text-slate-800 mb-4 whitespace-pre-wrap leading-relaxed">
                  {q.questionText}
                </p>

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
                        <span className="flex-1">{opt}</span>
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

      {/* Manual Add Question Modal */}
      {showAddModal && (
        <ManualAddQuestionModal
          exam={activeExam}
          onClose={() => setShowAddModal(false)}
          onAdded={() => {
            setShowAddModal(false);
            fetchQuestions(selectedExamId);
            onExamsUpdated();
          }}
        />
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// MANUAL ADD QUESTION MODAL
// ═══════════════════════════════════════════════════════════════

const ManualAddQuestionModal = ({ exam, onClose, onAdded }: any) => {
  const [formData, setFormData] = useState({
    chapterName: 'General Physics / Maths',
    difficulty: 'MEDIUM',
    marks: 4,
    questionText: '',
    optionA: '',
    optionB: '',
    optionC: '',
    optionD: '',
    correctAnswer: 'A',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.questionText.trim()) return toast.error('Please enter question text');
    if (!formData.optionA.trim() || !formData.optionB.trim()) return toast.error('Please enter at least options A and B');

    setLoading(true);
    try {
      const options = [formData.optionA, formData.optionB, formData.optionC || 'None', formData.optionD || 'All of the above'];
      let correctOptValue = formData.optionA;
      if (formData.correctAnswer === 'B') correctOptValue = formData.optionB;
      else if (formData.correctAnswer === 'C') correctOptValue = formData.optionC;
      else if (formData.correctAnswer === 'D') correctOptValue = formData.optionD;

      await api.post(`/api/competitive-exams/${exam.id}/questions`, {
        questionText: formData.questionText,
        options,
        correctAnswer: correctOptValue,
        marks: Number(formData.marks) || 4,
        chapterName: formData.chapterName,
        difficulty: formData.difficulty,
      });

      toast.success('Question added successfully!');
      onAdded();
    } catch (err: any) {
      toast.error('Failed to add question');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-xl w-full overflow-hidden shadow-2xl border border-slate-200">
        <div className="bg-slate-900 text-white p-6 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-black">Add Question to Question Bank</h3>
            <p className="text-xs text-slate-300">{exam?.title}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full cursor-pointer">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Chapter / Topic</label>
              <input
                type="text"
                required
                value={formData.chapterName}
                onChange={e => setFormData({ ...formData, chapterName: e.target.value })}
                className="w-full border border-slate-200 rounded-xl p-2.5 text-sm font-semibold outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Difficulty</label>
              <select
                value={formData.difficulty}
                onChange={e => setFormData({ ...formData, difficulty: e.target.value })}
                className="w-full border border-slate-200 rounded-xl p-2.5 text-sm font-semibold outline-none focus:border-indigo-500"
              >
                <option value="EASY">Easy</option>
                <option value="MEDIUM">Medium</option>
                <option value="HARD">Hard</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Question Text</label>
            <textarea
              required
              rows={3}
              value={formData.questionText}
              onChange={e => setFormData({ ...formData, questionText: e.target.value })}
              className="w-full border border-slate-200 rounded-xl p-3 text-sm font-bold text-slate-800 outline-none focus:border-indigo-500 resize-none"
              placeholder="Enter the competitive question problem statement..."
            />
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 uppercase">Answer Options</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {(['A', 'B', 'C', 'D'] as const).map(opt => (
                <div key={opt} className="flex items-center gap-2">
                  <span className={`w-7 h-7 rounded-lg font-black text-xs flex items-center justify-center shrink-0 ${
                    formData.correctAnswer === opt ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {opt}
                  </span>
                  <input
                    type="text"
                    required
                    value={(formData as any)[`option${opt}`]}
                    onChange={e => setFormData({ ...formData, [`option${opt}`]: e.target.value })}
                    placeholder={`Option ${opt} text`}
                    className="w-full border border-slate-200 rounded-xl p-2 text-xs font-medium outline-none focus:border-indigo-500"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Correct Option</label>
              <select
                value={formData.correctAnswer}
                onChange={e => setFormData({ ...formData, correctAnswer: e.target.value })}
                className="w-full border border-emerald-300 bg-emerald-50 text-emerald-900 font-black rounded-xl p-2.5 text-sm outline-none"
              >
                <option value="A">Option A is Correct</option>
                <option value="B">Option B is Correct</option>
                <option value="C">Option C is Correct</option>
                <option value="D">Option D is Correct</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Marks (+)</label>
              <input
                type="number"
                value={formData.marks}
                onChange={e => setFormData({ ...formData, marks: Number(e.target.value) })}
                className="w-full border border-slate-200 rounded-xl p-2.5 text-sm font-bold outline-none focus:border-indigo-500"
              />
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
              className="px-6 py-2.5 rounded-xl font-extrabold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md transition cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Question'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// DASHBOARD OVERVIEW TAB
// ═══════════════════════════════════════════════════════════════

const DashboardOverviewTab = ({ exams, totalQuestions, totalSubmissions, onOpenCreate, navigate }: any) => {
  return (
    <div className="space-y-6">
      {/* Quick Launch Hero */}
      <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <h2 className="text-xl font-black text-slate-900">NTA CBT Simulator & Automated Ranking</h2>
          <p className="text-sm text-slate-500 mt-1 max-w-xl">
            Conduct JEE Mains, NEET UG & Navodaya objective exams online with automated timers, negative marks deduction, and live leaderboards.
          </p>
          <div className="flex flex-wrap items-center gap-3 mt-4">
            <button
              onClick={onOpenCreate}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs flex items-center gap-2 shadow-md transition cursor-pointer"
            >
              <Plus size={16} /> Create Competitive Exam
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
            <div className="text-[11px] font-bold text-slate-500 uppercase">Mock Tests</div>
          </div>
          <div>
            <div className="text-2xl font-black text-emerald-600">{totalQuestions}</div>
            <div className="text-[11px] font-bold text-slate-500 uppercase">Bank MCQs</div>
          </div>
        </div>
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
      .then(res => setExams(res.data?.data || []))
      .catch(err => {
        // Fallback to admin list for open exams if student profile has class mismatch
        api.get('/api/competitive-exams/admin')
          .then(res2 => setExams(res2.data?.data || []))
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
