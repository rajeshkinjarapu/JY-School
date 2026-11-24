import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft, Plus, Trash2, Edit, RefreshCw, FileText, Sparkles, BookOpen,
  CheckCircle2, Search, Upload, Eye, Layers, Database, Check, Award, X
} from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import katex from 'katex';
import 'katex/dist/katex.min.css';

// ═══════════════════════════════════════════════════════════════
// KATEX LATEX MATH FORMULA RENDERER
// ═══════════════════════════════════════════════════════════════
export const LatexRenderer: React.FC<{ text: string; className?: string }> = ({ text, className = '' }) => {
  if (!text) return null;
  const trimmed = text.trim();

  // Pure image URL or data URI
  if (trimmed.startsWith('data:image/') || trimmed.match(/^https?:\/\/.*\.(png|jpg|jpeg|gif|webp|svg)($|\?)/i)) {
    return (
      <div className="my-1.5 inline-block">
        <img src={trimmed} alt="Diagram" className="max-h-44 max-w-full rounded-xl object-contain border border-slate-200 shadow-xs" />
      </div>
    );
  }

  // Markdown images: ![alt](url)
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

// ═══════════════════════════════════════════════════════════════
// REAL-TIME AUTO-PARSER (ONE SINGLE UNIFIED QUESTION & OPTIONS BOX)
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

  // Regex to match (A), (B), [A], A), A., Option A, etc.
  const optRegex = /^\s*(?:\(?([A-Da-d])\)?[\.\:\-\)]|\bOption\s+([A-Da-d])[\.\:\-\)]?)\s*(.*)$/i;
  // Regex to match Ans: A, Answer: B, Key: C, Correct: D, etc.
  const ansRegex = /^\s*(?:Ans(?:wer)?|Key|Correct(?:\s*Answer)?)\s*[:=\-]?\s*\(?([A-Da-d1-4])\)?/i;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      if (!currentOptKey) qTextLines.push('');
      continue;
    }

    // Check if line is an answer key line
    const ansMatch = trimmed.match(ansRegex);
    if (ansMatch) {
      detectedAnsLetter = ansMatch[1].toUpperCase();
      continue;
    }

    // Check if line is an option line
    const optMatch = trimmed.match(optRegex);
    if (optMatch) {
      const letter = (optMatch[1] || optMatch[2]).toUpperCase();
      currentOptKey = letter;
      letterMap[currentOptKey] = optMatch[3] || '';
    } else if (currentOptKey) {
      // Append multi-line option
      letterMap[currentOptKey] += ' ' + trimmed;
    } else {
      // Question problem statement
      qTextLines.push(trimmed);
    }
  }

  // Join question lines and strip optional leading question numbers like "1. ", "Q1. ", "Question 1: "
  let questionText = qTextLines.join('\n').trim();
  questionText = questionText.replace(/^(?:Q(?:uestion)?\s*\d+[\.\:\-\)]|\d+[\.\:\-\)])\s*/i, '');

  const options = [
    (letterMap['A'] || '').trim(),
    (letterMap['B'] || '').trim(),
    (letterMap['C'] || '').trim(),
    (letterMap['D'] || '').trim(),
  ];

  // Auto-detect correct answer index
  let correctAnswerIndex = 0;
  if (detectedAnsLetter) {
    if (['A', '1'].includes(detectedAnsLetter)) correctAnswerIndex = 0;
    else if (['B', '2'].includes(detectedAnsLetter)) correctAnswerIndex = 1;
    else if (['C', '3'].includes(detectedAnsLetter)) correctAnswerIndex = 2;
    else if (['D', '4'].includes(detectedAnsLetter)) correctAnswerIndex = 3;
  }

  return { questionText, options, correctAnswerIndex, detectedAnswerKey: detectedAnsLetter };
};

export const CompetitiveQuestionBankDashboard = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialExamId = searchParams.get('examId') || '';

  const [exams, setExams] = useState<any[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<string>(initialExamId);
  const [loadingExams, setLoadingExams] = useState<boolean>(true);

  // Questions for current exam
  const [questions, setQuestions] = useState<any[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Mode: 'LIST' or 'ADD'
  const [mode, setMode] = useState<'LIST' | 'ADD'>('LIST');

  // AI Modal
  const [showAiModal, setShowAiModal] = useState<boolean>(false);

  // Fetch all exams
  const fetchExams = async () => {
    setLoadingExams(true);
    try {
      const res = await api.get('/api/competitive-exams/admin');
      const list = Array.isArray(res.data) ? res.data : (res.data?.data || res.data?.exams || []);
      setExams(list);
      if (list.length > 0) {
        if (initialExamId && list.some((e: any) => e.id === initialExamId)) {
          setSelectedExamId(initialExamId);
        } else if (!selectedExamId) {
          setSelectedExamId(list[0].id);
        }
      }
    } catch (e) {
      console.warn('Admin fetch failed, trying student endpoint:', e);
      try {
        const res2 = await api.get('/api/competitive-exams/student');
        const list2 = Array.isArray(res2.data) ? res2.data : (res2.data?.data || []);
        setExams(list2);
        if (list2.length > 0 && !selectedExamId) {
          setSelectedExamId(list2[0].id);
        }
      } catch (err2) {
        toast.error('Failed to load exams');
      }
    } finally {
      setLoadingExams(false);
    }
  };

  useEffect(() => {
    fetchExams();
  }, []);

  // Fetch questions when selectedExamId changes
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
      try {
        const res2 = await api.get(`/api/competitive-exams/${examId}/student`);
        setQuestions(res2.data?.data?.questions || []);
      } catch (err) {
        console.warn('Failed to load questions:', err);
      }
    } finally {
      setLoadingQuestions(false);
    }
  };

  useEffect(() => {
    if (selectedExamId) {
      fetchQuestions(selectedExamId);
    }
  }, [selectedExamId]);

  const activeExam = exams.find((e: any) => e.id === selectedExamId) || exams[0];

  const handleDeleteQuestion = async (qId: string) => {
    if (!window.confirm('Are you sure you want to delete this question?')) return;
    try {
      await api.delete(`/api/competitive-exams/question/${qId}`);
      toast.success('Question deleted successfully');
      fetchQuestions(selectedExamId);
      fetchExams();
    } catch (e) {
      toast.error('Failed to delete question');
    }
  };

  // Filtered questions
  const filteredQuestions = questions.filter((q: any) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      (q.questionText || '').toLowerCase().includes(query) ||
      (q.chapterName || '').toLowerCase().includes(query) ||
      (q.correctAnswer || '').toLowerCase().includes(query)
    );
  });

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 bg-slate-50 min-h-screen">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/competitive-exams')}
            className="p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-2 transition cursor-pointer"
          >
            <ArrowLeft size={16} />
            <span>Back to Competitive Exams</span>
          </button>
          <div className="h-5 w-px bg-slate-200 hidden sm:block" />
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <Database size={16} />
            </span>
            <div>
              <h1 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                Competitive Question Bank Repository
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                JEE Mains, NEET, Navodaya & School Objective Question Central Hub
              </p>
            </div>
          </div>
        </div>

        {/* Exam Switcher Dropdown */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <label className="text-xs font-bold text-slate-500 uppercase shrink-0">
            Exam:
          </label>
          <select
            value={selectedExamId}
            onChange={(e) => setSelectedExamId(e.target.value)}
            disabled={loadingExams}
            className="w-full sm:w-72 p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-black text-slate-800 text-xs outline-none focus:border-indigo-500 focus:bg-white"
          >
            {loadingExams ? (
              <option>Loading exams...</option>
            ) : exams.length === 0 ? (
              <option value="">No exams found</option>
            ) : (
              exams.map((ex: any) => (
                <option key={ex.id} value={ex.id}>
                  {ex.title} ({ex._count?.questions || ex.questions?.length || 0}Q)
                </option>
              ))
            )}
          </select>
        </div>
      </div>

      {/* Target Exam Info Ribbon */}
      {activeExam && (
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-3xl shadow-lg border border-indigo-500/20 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-[11px] font-black uppercase tracking-wider border border-indigo-400/30">
              <BookOpen size={13} className="text-amber-400" />
              Target Question Repository
            </div>
            <h2 className="text-xl sm:text-2xl font-black">{activeExam.title}</h2>
            <p className="text-xs text-slate-300 font-medium">
              Class: <strong className="text-white">{activeExam.class?.name || '10th Standard'}</strong> • 
              Duration: <strong className="text-white">{activeExam.duration} Mins</strong> • 
              Total Marks: <strong className="text-white">{activeExam.totalMarks}</strong> • 
              Marking: <strong className="text-emerald-400">+{activeExam.totalMarks > 400 ? '4' : '4'}</strong> / <strong className="text-rose-400">-{activeExam.negativeMarks || 0}</strong>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setMode('ADD')}
              className={`px-4 py-2.5 rounded-xl font-extrabold text-xs flex items-center gap-1.5 shadow transition cursor-pointer ${
                mode === 'ADD'
                  ? 'bg-indigo-500 text-white shadow-indigo-500/30 ring-2 ring-indigo-300'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white'
              }`}
            >
              <Plus size={16} /> + Add Question (Single Box Studio)
            </button>

            <button
              onClick={() => navigate(activeExam ? `/competitive-exams/${activeExam.id}/paste-ai` : '/competitive-exams/paste-ai')}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-xs flex items-center gap-1.5 shadow transition cursor-pointer hover:scale-105"
            >
              <FileText size={16} className="text-emerald-200" /> 📄 Paste Exam Text (AI Parser)
            </button>

            <button
              onClick={() => setShowAiModal(true)}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shadow transition cursor-pointer"
            >
              <Sparkles size={16} className="text-amber-300" /> ✨ AI Generate
            </button>
          </div>
        </div>
      )}

      {/* Main Body: Mode 'ADD' or Mode 'LIST' */}
      {mode === 'ADD' && activeExam ? (
        /* ═══════════════════════════════════════════════════════════════ */
        /* SINGLE UNIFIED RAW QUESTION & OPTIONS BOX STUDIO               */
        /* ═══════════════════════════════════════════════════════════════ */
        <SingleRawBoxQuestionStudio
          exam={activeExam}
          onBack={() => setMode('LIST')}
          onSaved={(addAnother: boolean) => {
            fetchQuestions(selectedExamId);
            fetchExams();
            if (!addAnother) {
              setMode('LIST');
            }
          }}
        />
      ) : (
        /* ═══════════════════════════════════════════════════════════════ */
        /* QUESTIONS LIST VIEW                                            */
        /* ═══════════════════════════════════════════════════════════════ */
        <div className="space-y-4">
          {/* Search & Actions Bar */}
          <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search questions or chapters..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-indigo-500 focus:bg-white transition"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
              <span className="text-xs font-bold text-slate-500">
                Showing <strong className="text-slate-900">{filteredQuestions.length}</strong> of {questions.length} Questions
              </span>
              <button
                onClick={() => fetchQuestions(selectedExamId)}
                className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
                title="Refresh Questions"
              >
                <RefreshCw size={15} className={loadingQuestions ? 'animate-spin' : ''} />
              </button>
            </div>
          </div>

          {/* Questions Stream */}
          {loadingQuestions ? (
            <div className="p-16 flex flex-col items-center justify-center bg-white rounded-3xl border border-slate-200 shadow-sm">
              <RefreshCw className="w-10 h-10 animate-spin text-indigo-600 mb-3" />
              <p className="text-slate-600 font-bold">Loading Questions Repository...</p>
            </div>
          ) : filteredQuestions.length === 0 ? (
            <div className="p-16 flex flex-col items-center justify-center text-center bg-white rounded-3xl border border-slate-200 shadow-sm">
              <div className="w-16 h-16 rounded-3xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
                <Database size={32} />
              </div>
              <h3 className="text-lg font-black text-slate-800">No Questions Found</h3>
              <p className="text-xs text-slate-500 max-w-md mt-1">
                Add questions manually using the single raw text box studio or paste entire exam question papers to digitize with Gemini 2.5 Flash AI.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
                <button
                  onClick={() => setMode('ADD')}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs flex items-center gap-2 shadow transition cursor-pointer hover:scale-105"
                >
                  <Plus size={16} /> + Add Question (Single Box)
                </button>
                <button
                  onClick={() => navigate(activeExam ? `/competitive-exams/${activeExam.id}/paste-ai` : '/competitive-exams/paste-ai')}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-extrabold text-xs flex items-center gap-2 shadow transition cursor-pointer hover:scale-105"
                >
                  <FileText size={16} /> 📄 Paste Exam Text (AI Parser)
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredQuestions.map((q: any, idx: number) => {
                let options: string[] = [];
                try {
                  options = typeof q.options === 'string' ? JSON.parse(q.options) : (q.options || []);
                } catch {
                  options = ['Option A', 'Option B', 'Option C', 'Option D'];
                }

                const optLetters = ['A', 'B', 'C', 'D', 'E', 'F'];

                return (
                  <div
                    key={q.id || idx}
                    className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-200 hover:border-indigo-300 transition space-y-4"
                  >
                    {/* Header */}
                    <div className="flex justify-between items-start gap-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="w-7 h-7 rounded-xl bg-indigo-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                          Q{idx + 1}
                        </span>
                        <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-lg border border-slate-200">
                          {q.chapterName || 'General'}
                        </span>
                        <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                          {q.difficulty || 'MEDIUM'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100">
                          +{q.marks || 4} Marks
                        </span>
                        <span className="text-xs font-black text-rose-500 bg-rose-50 px-2 py-0.5 rounded-lg border border-rose-100">
                          -{activeExam?.negativeMarks || 1} Neg
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

                    {/* Question Statement with KaTeX */}
                    <div className="text-sm font-bold text-slate-800 leading-relaxed pl-1">
                      <LatexRenderer text={q.questionText} />
                    </div>

                    {/* Question Diagram if present */}
                    {q.imageUrl && (
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl inline-block">
                        <img src={q.imageUrl} alt="Diagram" className="max-h-56 object-contain rounded-xl" />
                      </div>
                    )}

                    {/* 4 Options Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                      {options.map((opt: string, oIdx: number) => {
                        const letter = optLetters[oIdx] || String.fromCharCode(65 + oIdx);
                        const isCorrect = String(opt).trim() === String(q.correctAnswer).trim() || letter === String(q.correctAnswer).trim();

                        return (
                          <div
                            key={oIdx}
                            className={`p-3 rounded-2xl border flex items-start gap-2.5 transition ${
                              isCorrect
                                ? 'bg-emerald-50/90 border-emerald-400 ring-1 ring-emerald-400 text-emerald-950 font-bold shadow-xs'
                                : 'bg-slate-50 border-slate-200 text-slate-700 font-medium'
                            }`}
                          >
                            <span
                              className={`w-5 h-5 rounded-lg text-[10px] font-black flex items-center justify-center shrink-0 ${
                                isCorrect ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
                              }`}
                            >
                              {letter}
                            </span>
                            <div className="flex-1 text-xs">
                              <LatexRenderer text={opt} />
                            </div>
                            {isCorrect && (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black shrink-0 flex items-center gap-0.5">
                                <Check size={11} /> Correct
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
        </div>
      )}

      {/* AI Generate Modal */}
      {showAiModal && activeExam && (
        <AiQuestionGeneratorModal
          exam={activeExam}
          onClose={() => setShowAiModal(false)}
          onGenerated={() => {
            setShowAiModal(false);
            fetchQuestions(selectedExamId);
            fetchExams();
          }}
        />
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// SINGLE UNIFIED RAW QUESTION & OPTIONS BOX STUDIO COMPONENT
// ═══════════════════════════════════════════════════════════════
export const SingleRawBoxQuestionStudio = ({ exam, onBack, onSaved }: any) => {
  const [chapterName, setChapterName] = useState(exam?.subject?.name ? `${exam.subject.name}: Unit Topic` : 'Physics: Kinematics');
  const [difficulty, setDifficulty] = useState('MEDIUM');
  const [marks, setMarks] = useState(4);
  const [loading, setLoading] = useState(false);

  // Default raw text showing the unified single box format
  const sampleTemplate = `What is the derivative of $f(x) = \\sin(x^2)$ with respect to $x$?
(A) $\\cos(x^2)$
(B) $2x \\cos(x^2)$
(C) $-2x \\cos(x^2)$
(D) $x^2 \\cos(x)$
Ans: B`;

  const [rawQuestionInput, setRawQuestionInput] = useState<string>(sampleTemplate);
  const [questionImageUrl, setQuestionImageUrl] = useState<string>('');
  const [optionImages, setOptionImages] = useState<[string, string, string, string]>(['', '', '', '']);
  const [manualCorrectIndex, setManualCorrectIndex] = useState<number | null>(null);

  // File input refs
  const questionFileRef = useRef<HTMLInputElement | null>(null);

  // Parse in real-time from single box
  const parsed = parseSingleRawQuestionAndOptions(rawQuestionInput);
  const effectiveCorrectIndex = manualCorrectIndex !== null ? manualCorrectIndex : parsed.correctAnswerIndex;

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>, target: 'question' | number) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      if (target === 'question') {
        setQuestionImageUrl(base64);
        toast.success('Question diagram attached');
      } else {
        const updated = [...optionImages] as [string, string, string, string];
        updated[target] = base64;
        setOptionImages(updated);
        toast.success(`Diagram attached to Option ${String.fromCharCode(65 + target)}`);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (addAnother: boolean) => {
    if (!parsed.questionText.trim()) {
      return toast.error('Please enter question problem statement in the box');
    }
    if (!parsed.options[0] && !parsed.options[1]) {
      return toast.error('Please provide at least Option (A) and Option (B) in the box');
    }

    setLoading(true);
    try {
      const finalOptions = [0, 1, 2, 3].map(i => {
        const text = parsed.options[i] || `Option ${String.fromCharCode(65 + i)}`;
        const img = optionImages[i];
        if (img) {
          return `${text} ![Option ${String.fromCharCode(65 + i)} Diagram](${img})`.trim();
        }
        return text;
      });

      const correctOptionValue = finalOptions[effectiveCorrectIndex] || finalOptions[0];

      await api.post(`/api/competitive-exams/${exam.id}/questions`, {
        questionText: parsed.questionText.trim(),
        imageUrl: questionImageUrl || null,
        options: finalOptions,
        correctAnswer: correctOptionValue,
        marks: Number(marks) || 4,
        chapterName: chapterName.trim() || 'General',
        difficulty,
      });

      toast.success(addAnother ? 'Question added! Ready for next question.' : 'Question saved to Question Bank!');

      if (addAnother) {
        setRawQuestionInput('');
        setQuestionImageUrl('');
        setOptionImages(['', '', '', '']);
        setManualCorrectIndex(null);
        onSaved(true);
      } else {
        onSaved(false);
      }
    } catch (err: any) {
      console.error('Failed to add question:', err);
      toast.error('Failed to save question to exam');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Top Header */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-2 transition cursor-pointer"
          >
            <ArrowLeft size={16} /> Back to Question List
          </button>
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
              <span>Single-Box Question Authoring Studio</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold">
                {exam?.title}
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Paste question, options, and answer in one single box • Live KaTeX math preview
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 w-full md:w-auto justify-end">
          <button
            type="button"
            disabled={loading}
            onClick={() => handleSave(true)}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-md transition cursor-pointer disabled:opacity-50"
          >
            <Plus size={16} /> Save & Add Another
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={() => handleSave(false)}
            className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-md transition cursor-pointer disabled:opacity-50"
          >
            <Check size={16} /> {loading ? 'Saving...' : 'Save & Return to Bank'}
          </button>
        </div>
      </div>

      {/* Main 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Single Unified Input & Settings (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Classification & Marks */}
          <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">Classification & Marks</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                  Chapter / Subject Section
                </label>
                <input
                  type="text"
                  value={chapterName}
                  onChange={e => setChapterName(e.target.value)}
                  placeholder="e.g. Physics: Kinematics or Mathematics: Calculus"
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800 outline-none focus:border-indigo-500 bg-slate-50 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Difficulty</label>
                <select
                  value={difficulty}
                  onChange={e => setDifficulty(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800 outline-none focus:border-indigo-500 bg-white"
                >
                  <option value="EASY">Easy</option>
                  <option value="MEDIUM">Medium (JEE / NEET)</option>
                  <option value="HARD">Hard (Advanced)</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-4 pt-1 border-t border-slate-100">
              <div className="w-36">
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Marks (+)</label>
                <input
                  type="number"
                  value={marks}
                  onChange={e => setMarks(Number(e.target.value))}
                  className="w-full border border-slate-200 rounded-xl p-2 text-xs font-bold text-slate-800 outline-none focus:border-indigo-500"
                />
              </div>
              <div className="text-xs text-slate-500 pt-5">
                Negative Marks: <b className="text-rose-600">-{exam?.negativeMarks || 0}</b>
              </div>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* THE SINGLE UNIFIED RAW QUESTION & OPTIONS BOX                   */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <label className="block text-xs font-black text-slate-900 uppercase">
                  Paste / Type Question, Options & Answer (All in One Box)
                </label>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Type problem statement, options (A)-(D), and Ans: B in this single box. Everything is auto-detected live!
                </p>
              </div>
              <button
                type="button"
                onClick={() => setRawQuestionInput(sampleTemplate)}
                className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-lg transition cursor-pointer"
              >
                Sample Template
              </button>
            </div>

            {/* THE ONE BOX */}
            <textarea
              rows={10}
              value={rawQuestionInput}
              onChange={e => {
                setRawQuestionInput(e.target.value);
                setManualCorrectIndex(null); // Reset manual override on typing
              }}
              placeholder={`Example:
What is the acceleration of a freely falling particle near the surface of Earth?
(A) 9.8 m/s²
(B) 10.5 m/s²
(C) 8.9 m/s²
(D) 12 m/s²
Ans: A`}
              className="w-full border border-slate-200 rounded-2xl p-4 text-xs font-mono font-medium leading-relaxed text-slate-800 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 bg-slate-50 focus:bg-white transition"
              required
            />

            {/* Diagram / Graphic Upload for Question */}
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 uppercase flex items-center gap-1.5">
                  Optional Question Diagram / Graphic
                </label>
                {questionImageUrl && (
                  <button
                    type="button"
                    onClick={() => setQuestionImageUrl('')}
                    className="text-xs text-rose-500 font-bold hover:underline cursor-pointer"
                  >
                    Remove Diagram
                  </button>
                )}
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3">
                <input
                  type="file"
                  accept="image/*"
                  ref={questionFileRef}
                  onChange={e => handleImageFileChange(e, 'question')}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => questionFileRef.current?.click()}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 hover:border-indigo-400 bg-slate-50 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer shrink-0"
                >
                  <Upload size={14} /> Upload Diagram from PC
                </button>
                <div className="w-full flex-1">
                  <input
                    type="text"
                    value={questionImageUrl.startsWith('data:') ? 'Image attached from computer' : questionImageUrl}
                    onChange={e => setQuestionImageUrl(e.target.value)}
                    placeholder="Or paste online image URL (https://...)"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {questionImageUrl && (
                <div className="mt-2 p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-center">
                  <img
                    src={questionImageUrl}
                    alt="Question Diagram Preview"
                    className="max-h-48 max-w-full rounded-xl object-contain border border-slate-200 shadow-xs"
                  />
                </div>
              )}
            </div>

            {/* Detected 4 Options & Correct Answer Selection Grid */}
            <div className="pt-3 border-t border-slate-100 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-black text-slate-700 uppercase">
                  Detected Options (Click on an option to set it as correct):
                </span>
                <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  Option {String.fromCharCode(65 + effectiveCorrectIndex)} is marked correct
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {([0, 1, 2, 3] as const).map(idx => {
                  const letter = String.fromCharCode(65 + idx);
                  const isCorrect = effectiveCorrectIndex === idx;
                  const text = parsed.options[idx] || `[Option ${letter} empty]`;

                  return (
                    <div
                      key={idx}
                      onClick={() => setManualCorrectIndex(idx)}
                      className={`p-3 rounded-2xl border-2 transition cursor-pointer ${
                        isCorrect
                          ? 'border-emerald-500 bg-emerald-50/70 shadow-xs'
                          : 'border-slate-200 bg-slate-50 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span
                          className={`w-5 h-5 rounded-lg text-[10px] font-black flex items-center justify-center shrink-0 ${
                            isCorrect ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {letter}
                        </span>
                        {isCorrect && (
                          <span className="text-[10px] font-black uppercase text-emerald-800 bg-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                            <Check size={11} /> Correct
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-800 font-medium">
                        <LatexRenderer text={text} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Live NTA CBT Real-Time Student Preview (5 Cols) */}
        <div className="lg:col-span-5 sticky top-6 space-y-4">
          <div className="bg-slate-900 text-white p-4 rounded-3xl shadow-xl border border-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="text-xs font-black uppercase text-indigo-300 flex items-center gap-1.5">
                <Eye size={14} /> NTA CBT Real-Time Student Preview
              </span>
              <span className="text-[10px] font-mono bg-indigo-950 px-2.5 py-0.5 rounded text-indigo-300 border border-indigo-800">
                Live Simulation
              </span>
            </div>

            {/* Simulated Question Card */}
            <div className="bg-white text-slate-800 rounded-2xl p-5 mt-4 shadow-inner space-y-4">
              <div className="flex justify-between items-center text-xs pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white font-black text-xs flex items-center justify-center">
                    Q1
                  </span>
                  <span className="font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                    {chapterName || 'General'}
                  </span>
                </div>
                <span className="font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                  +{marks} / -{exam?.negativeMarks || 0} Marks
                </span>
              </div>

              {/* Problem statement */}
              <div className="text-sm font-bold text-slate-800 leading-relaxed min-h-[2.5rem]">
                {parsed.questionText ? (
                  <LatexRenderer text={parsed.questionText} />
                ) : (
                  <span className="text-slate-400 italic font-normal">
                    Question statement will render here with KaTeX formulas...
                  </span>
                )}
              </div>

              {/* Diagram */}
              {questionImageUrl && (
                <div className="p-2 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center">
                  <img
                    src={questionImageUrl}
                    alt="Simulated Diagram"
                    className="max-h-40 max-w-full rounded-lg object-contain"
                  />
                </div>
              )}

              {/* Options */}
              <div className="space-y-2 pt-2">
                {([0, 1, 2, 3] as const).map(idx => {
                  const letter = String.fromCharCode(65 + idx);
                  const isCorrect = effectiveCorrectIndex === idx;
                  const text = parsed.options[idx] || `Option ${letter}`;

                  return (
                    <div
                      key={idx}
                      className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 transition ${
                        isCorrect
                          ? 'border-emerald-500 bg-emerald-50/50 text-slate-900 font-bold'
                          : 'border-slate-200 bg-slate-50 text-slate-700 font-medium'
                      }`}
                    >
                      <span
                        className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${
                          isCorrect ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {letter}
                      </span>
                      <div className="flex-1">
                        <LatexRenderer text={text} />
                      </div>
                      {isCorrect && (
                        <span className="text-[10px] uppercase font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full shrink-0">
                          Correct
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <p className="text-[11px] text-slate-400 mt-3 text-center">
              This preview reflects exactly how the question will appear on candidate CBT screens.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// AI QUESTION GENERATOR MODAL COMPONENT
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
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full cursor-pointer text-slate-300 hover:text-white">
            <X size={22} />
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
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Count</label>
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
              className="px-5 py-2.5 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition cursor-pointer text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl font-extrabold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-md transition cursor-pointer disabled:opacity-50 flex items-center gap-2 text-xs"
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

export default CompetitiveQuestionBankDashboard;
