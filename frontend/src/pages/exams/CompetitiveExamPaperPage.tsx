import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Printer, Play, ZoomIn, ZoomOut, RefreshCw, FileQuestion, Sparkles, 
  FileText, Plus, Columns, Check, ChevronRight, Layers, Clock, Target, Award
} from 'lucide-react';
import api from '../../api/axios';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';
import { LiveLatexPreview } from '../../components/QuestionBank/LiveLatexPreview';
import { printPaper } from '../question-bank/MCQPaperGeneratorPage';

const CompetitiveExamPaperPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isTeacher = (user?.role || '').toUpperCase() === 'TEACHER';

  const [loading, setLoading] = useState(true);
  const [examData, setExamData] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [schoolLogo, setSchoolLogo] = useState<string>('');
  const [isDoubleColumn, setIsDoubleColumn] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(0.85);
  const [activeSection, setActiveSection] = useState('ALL');
  const [populating, setPopulating] = useState(false);

  const loadExamDetails = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await api.get(`/api/competitive-exams/${id}`);
      const data = res.data?.data || res.data;
      setExamData(data);
      const qList = data.questions || [];
      setQuestions(qList);

      // Fetch School logo if available
      try {
        const schoolRes = await api.get('/api/settings/school-profile');
        const sData = schoolRes.data?.data || schoolRes.data;
        if (sData?.logoUrl) {
          setSchoolLogo(sData.logoUrl);
        }
      } catch {
        // Fallback to default
      }
    } catch (err: any) {
      console.error('Failed to load exam paper details', err);
      toast.error('Failed to load exam question paper');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExamDetails();
  }, [id]);

  // Extract unique subjects / sections from questions
  const sections = useMemo(() => {
    const secSet = new Set<string>();
    questions.forEach((q: any) => {
      const name = (q.chapterName || q.subject?.name || '').trim();
      if (name) {
        const sec = name.includes(':') ? name.split(':')[0].trim() : name;
        secSet.add(sec);
      }
    });
    return Array.from(secSet);
  }, [questions]);

  // Filter questions by section if selected
  const filteredQuestions = useMemo(() => {
    if (activeSection === 'ALL') return questions;
    return questions.filter((q: any) => {
      const name = (q.chapterName || q.subject?.name || '').trim();
      return name.startsWith(activeSection) || name.includes(activeSection);
    });
  }, [questions, activeSection]);

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

  const paperInstructions = useMemo(() => {
    const marksPerQ = examData?.totalMarks && filteredQuestions.length > 0 
      ? Math.max(1, Math.round(examData.totalMarks / filteredQuestions.length)) 
      : (examData?.marksPerQuestion || 4);
    const hasNeg = Number(examData?.negativeMarks) > 0;
    return [
      `This paper contains ${filteredQuestions.length} objective multiple choice questions.`,
      hasNeg 
        ? `Each correct answer carries +${marksPerQ} marks. Negative marking: -${examData.negativeMarks} mark for each wrong answer.`
        : `Each correct answer carries +${marksPerQ} marks. There is NO negative marking for incorrect answers.`,
      `Rough calculations must be carried out on rough sheets only.`
    ];
  }, [filteredQuestions.length, examData?.negativeMarks, examData?.totalMarks, examData?.marksPerQuestion]);

  const handlePopulateSample = async () => {
    if (!id) return;
    setPopulating(true);
    try {
      await api.post(`/api/competitive-exams/${id}/populate-sample`);
      toast.success('Sample NTA questions added successfully!');
      await loadExamDetails();
    } catch {
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
    <div className="min-h-screen bg-[#F4F7FC] flex flex-col text-slate-800">
      
      {/* ─── TOP NAVIGATION & CONTROL BAR ─── */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-4">
        {/* Left: Back & Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/competitive-exams')}
            className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 transition cursor-pointer shadow-xs flex items-center justify-center"
            title="Back to Competitive Exams"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
              <span className="hover:text-indigo-600 cursor-pointer" onClick={() => navigate('/competitive-exams')}>
                Competitive Exams
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-800 font-bold truncate max-w-[200px] sm:max-w-xs">
                {examData?.title || 'Exam Paper'}
              </span>
              <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 text-[11px] font-bold">
                A4 Paper Studio
              </span>
            </div>
            <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight line-clamp-1">
              {examData?.title || 'Question Paper Preview'}
            </h1>
          </div>
        </div>

        {/* Right: Controls & Actions */}
        <div className="flex items-center flex-wrap gap-2 sm:gap-3">
          
          {/* 1 / 2 Column Toggle */}
          <button
            type="button"
            onClick={() => setIsDoubleColumn((v) => !v)}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-extrabold flex items-center gap-1.5 transition cursor-pointer border border-slate-200"
            title="Toggle Single / Double Column Layout"
          >
            <Columns className="w-4 h-4 text-indigo-600" />
            <span>{isDoubleColumn ? '2 Columns' : '1 Column'}</span>
          </button>

          {/* Zoom Controls */}
          <div className="flex items-center bg-slate-100 rounded-xl p-1 border border-slate-200">
            <button
              type="button"
              onClick={() => setZoomLevel((z) => Math.max(0.5, Number((z - 0.1).toFixed(2))))}
              className="p-1.5 text-slate-600 hover:bg-white hover:text-slate-900 rounded-lg cursor-pointer transition"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-xs font-black text-slate-700 px-2 min-w-[42px] text-center">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              type="button"
              onClick={() => setZoomLevel((z) => Math.min(1.2, Number((z + 0.1).toFixed(2))))}
              className="p-1.5 text-slate-600 hover:bg-white hover:text-slate-900 rounded-lg cursor-pointer transition"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>

          {/* Print / Download Paper Button */}
          <button
            onClick={handlePrint}
            disabled={filteredQuestions.length === 0}
            className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 active:scale-95 text-slate-950 text-xs font-black flex items-center gap-2 transition cursor-pointer shadow-sm disabled:opacity-50"
            title="Print or Save A4 Question Paper as PDF"
          >
            <Printer className="w-4 h-4" />
            <span>Print / Download Paper</span>
          </button>

          {/* Launch CBT Exam Button (Hidden for Teacher) */}
          {!isTeacher && examData?.id && (
            <button
              onClick={() => navigate(`/take-competitive-exam/${examData.id}`)}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#5B3DF5] to-[#7B3DF5] hover:opacity-95 active:scale-95 text-white text-xs font-black flex items-center gap-2 shadow-sm transition cursor-pointer"
              title="Start Live CBT Computer Based Test"
            >
              <Play className="w-4 h-4 fill-white" />
              <span className="hidden sm:inline">Launch CBT Exam</span>
            </button>
          )}
        </div>
      </header>

      {/* ─── EXAM METADATA & SECTION TABS RIBBON ─── */}
      <div className="bg-white border-b border-slate-200/80 px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs font-bold text-slate-600 shadow-[0_2px_10px_rgba(15,23,42,0.03)]">
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
          <span className="flex items-center gap-1.5 text-slate-700 bg-[#FFF4E5] border border-[#FDE2BA] px-3 py-1 rounded-xl">
            <Clock className="w-3.5 h-3.5 text-[#D97706]" />
            Duration: <strong className="text-slate-900">{examData?.duration || 180} Mins</strong>
          </span>
          <span className="flex items-center gap-1.5 text-slate-700 bg-[#EAF3FF] border border-[#D4E6FF] px-3 py-1 rounded-xl">
            <Target className="w-3.5 h-3.5 text-[#2563EB]" />
            Total Marks: <strong className="text-[#2563EB]">{examData?.totalMarks || 100}</strong>
          </span>
          <span className="flex items-center gap-1.5 text-slate-700 bg-[#EAFAEE] border border-[#CBEFD6] px-3 py-1 rounded-xl">
            <Layers className="w-3.5 h-3.5 text-[#16A34A]" />
            Questions: <strong className="text-[#16A34A]">{questions.length}</strong>
          </span>
          <span className="flex items-center gap-1.5 text-slate-700 bg-[#FEECEF] border border-[#FBD0D8] px-3 py-1 rounded-xl">
            <Award className="w-3.5 h-3.5 text-[#E11D48]" />
            Marking:{' '}
            <strong className={Number(examData?.negativeMarks) > 0 ? 'text-[#E11D48]' : 'text-[#16A34A]'}>
              {Number(examData?.negativeMarks) > 0 ? `+4 / -${examData?.negativeMarks}` : '+4 / 0 (No Negative)'}
            </strong>
          </span>
        </div>

        {/* Section filter tabs */}
        {sections.length > 1 && (
          <div className="flex items-center gap-1.5 overflow-x-auto py-1">
            <button
              onClick={() => setActiveSection('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeSection === 'ALL'
                  ? 'bg-gradient-to-r from-[#5B3DF5] to-[#7B3DF5] text-white shadow-sm'
                  : 'bg-[#F4F7FC] text-slate-700 hover:bg-slate-200/70 border border-slate-200'
              }`}
            >
              All Sections ({questions.length})
            </button>
            {sections.map((sec, idx) => (
              <button
                key={idx}
                onClick={() => setActiveSection(sec)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  activeSection === sec
                    ? 'bg-gradient-to-r from-[#5B3DF5] to-[#7B3DF5] text-white shadow-sm'
                    : 'bg-[#F4F7FC] text-slate-700 hover:bg-slate-200/70 border border-slate-200'
                }`}
              >
                {sec}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ─── PAPER PREVIEW CANVAS ─── */}
      <main className="flex-1 p-4 sm:p-8 overflow-auto bg-[#F4F7FC] flex justify-center items-start">
        {loading ? (
          <div className="py-24 text-center w-full my-auto">
            <RefreshCw className="w-10 h-10 text-[#5B3DF5] animate-spin mx-auto mb-3" />
            <p className="text-slate-700 font-black text-base">Loading Question Paper...</p>
            <p className="text-slate-500 text-xs mt-1">Rendering KaTeX mathematical equations and diagrams</p>
          </div>
        ) : filteredQuestions.length === 0 ? (
          <div className="py-14 px-8 text-center bg-white rounded-2xl border border-dashed border-[#C7BDFC] max-w-xl mx-auto space-y-5 my-auto shadow-[0_2px_10px_rgba(15,23,42,0.03)]">
            <div className="w-16 h-16 rounded-2xl bg-[#F3EEFF] text-[#5B3DF5] flex items-center justify-center mx-auto shadow-xs">
              <FileQuestion className="w-8 h-8" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-lg sm:text-xl">No Questions in this Exam Paper Yet</h3>
              <p className="text-slate-500 text-xs sm:text-sm mt-1 max-w-md mx-auto leading-relaxed">
                This exam currently has 0 questions. You can auto-fill sample NTA questions, paste raw exam text from Word/PDF with Gemini AI, or add questions manually in the Studio.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                disabled={populating}
                onClick={handlePopulateSample}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#F59E0B] to-[#EA580C] hover:opacity-95 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-sm transition cursor-pointer disabled:opacity-50"
              >
                {populating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 fill-white" />}
                <span>{populating ? 'Populating...' : '✨ Auto-Fill Sample NTA Questions'}</span>
              </button>
              {examData?.id && (
                <button
                  onClick={() => navigate(`/competitive-exams/${examData.id}/paste-ai`)}
                  className="px-4 py-2.5 rounded-xl bg-[#EAFAEE] hover:bg-[#DCFCE7] text-[#16A34A] border border-[#CBEFD6] font-extrabold text-xs flex items-center gap-1.5 transition cursor-pointer"
                >
                  <FileText className="w-4 h-4" />
                  <span>📄 Paste Exam Text (AI Parser)</span>
                </button>
              )}
              {examData?.id && (
                <button
                  onClick={() => navigate(`/competitive-question-bank?examId=${examData.id}`)}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#5B3DF5] to-[#7B3DF5] hover:opacity-95 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Add Questions in Studio</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          <div
            style={{
              transform: `scale(${zoomLevel})`,
              transformOrigin: 'top center',
              transition: 'transform 0.15s ease-out',
            }}
            className="shrink-0 mb-16"
          >
            <LiveLatexPreview
              content={formattedPaperContent}
              examName={examData?.title || 'COMPETITIVE EXAMINATION'}
              examClass={examData?.class?.name || '10th Standard'}
              examSubject={activeSection !== 'ALL' ? activeSection : (examData?.subject?.name || 'General')}
              maxMarks={String(examData?.totalMarks || 100)}
              time={examData?.duration ? `${examData.duration} Mins` : '180 Mins'}
              instructions={paperInstructions}
              logoBase64={schoolLogo}
              isDoubleColumn={isDoubleColumn}
              fontSize="medium"
              questionSpacing="normal"
              showHeader={true}
            />
          </div>
        )}
      </main>

      {/* ─── STICKY FOOTER ─── */}
      <footer className="sticky bottom-0 z-40 bg-white border-t border-slate-200 px-4 sm:px-6 py-3 flex items-center justify-between gap-4 shadow-sm">
        <p className="text-xs text-slate-500 font-medium">
          Showing <strong className="text-slate-900 font-bold">{filteredQuestions.length}</strong> of {questions.length} questions in this paper
        </p>

        <div className="flex items-center gap-3">
          <button
            onClick={handlePrint}
            disabled={filteredQuestions.length === 0}
            className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
          >
            <Printer className="w-4 h-4" />
            <span>Print / Download PDF</span>
          </button>
          {!isTeacher && examData?.id && (
            <button
              onClick={() => navigate(`/take-competitive-exam/${examData.id}`)}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#5B3DF5] to-[#7B3DF5] hover:opacity-95 text-white font-extrabold text-xs shadow-sm transition cursor-pointer flex items-center gap-1.5"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>Launch CBT Exam Now</span>
            </button>
          )}
        </div>
      </footer>

    </div>
  );
};

export default CompetitiveExamPaperPage;
