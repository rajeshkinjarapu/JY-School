import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  ArrowLeft, FileText, Sparkles, RefreshCw, CheckCircle2, Trash2, Edit2,
  Check, X, BookOpen, AlertCircle, HelpCircle, Layers, Award,
  Copy, Eye, ArrowRight, CornerDownLeft, ShieldCheck, Zap
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

const SAMPLE_EXAM_TEXT = `1. An electric dipole with dipole moment $p = 4 \\times 10^{-9} \\text{ C}\\cdot\\text{m}$ is aligned at $30^\\circ$ with an electric field of magnitude $E = 5 \\times 10^4 \\text{ N/C}$. What is the torque acting on the dipole?
(A) $10^{-4} \\text{ N}\\cdot\\text{m}$
(B) $2 \\times 10^{-4} \\text{ N}\\cdot\\text{m}$
(C) $10^{-5} \\text{ N}\\cdot\\text{m}$
(D) $5 \\times 10^{-4} \\text{ N}\\cdot\\text{m}$
Ans: A

2. The derivative of $f(x) = \\sin(x^2 + 1)$ with respect to $x$ is:
(A) $\\cos(x^2 + 1)$
(B) $2x \\cos(x^2 + 1)$
(C) $-2x \\cos(x^2 + 1)$
(D) $x \\cos(x^2 + 1)$
Correct Answer: B

3. Which organelle is known as the powerhouse of the cell?
(A) Ribosome
(B) Golgi Apparatus
(C) Mitochondria
(D) Lysosome
Key: C

4. What is the value of $\\lim_{x \\to 0} \\frac{\\sin(3x)}{x}$?
(A) 0
(B) 1
(C) 3
(D) Undefined
Ans: C`;

export const PasteCompetitiveExamTextPage: React.FC = () => {
  const { id: routeExamId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [exams, setExams] = useState<any[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<string>(routeExamId || '');
  const [loadingExams, setLoadingExams] = useState<boolean>(true);

  // Form inputs
  const [rawText, setRawText] = useState<string>('');
  const [chapterHint, setChapterHint] = useState<string>('Physics: Electrostatics');
  const [defaultMarks, setDefaultMarks] = useState<number>(4);
  const [difficulty, setDifficulty] = useState<string>('MEDIUM');

  // Parser state
  const [parsing, setParsing] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [parsedQuestions, setParsedQuestions] = useState<any[]>([]);

  // Editing question inline
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingText, setEditingText] = useState<string>('');

  // Fetch exams list
  useEffect(() => {
    const fetchExams = async () => {
      setLoadingExams(true);
      try {
        const res = await api.get('/api/competitive-exams/admin');
        const list = Array.isArray(res.data) ? res.data : (res.data?.data || res.data?.exams || []);
        setExams(list);
        if (list.length > 0) {
          if (routeExamId && list.some((e: any) => e.id === routeExamId)) {
            setSelectedExamId(routeExamId);
          } else if (!selectedExamId) {
            setSelectedExamId(list[0].id);
          }
        }
      } catch (err) {
        console.warn('Admin fetch failed, falling back to student endpoint:', err);
        try {
          const res2 = await api.get('/api/competitive-exams/student');
          const list2 = Array.isArray(res2.data) ? res2.data : (res2.data?.data || []);
          setExams(list2);
          if (list2.length > 0 && !selectedExamId) {
            setSelectedExamId(list2[0].id);
          }
        } catch (err2) {
          toast.error('Failed to load exams list');
        }
      } finally {
        setLoadingExams(false);
      }
    };
    fetchExams();
  }, [routeExamId]);

  const activeExam = exams.find((e: any) => e.id === selectedExamId) || exams[0];

  useEffect(() => {
    if (activeExam?.subject?.name) {
      setChapterHint(`${activeExam.subject.name}: Unit Test`);
    }
  }, [activeExam]);

  // Load sample template
  const handleLoadSample = () => {
    setRawText(SAMPLE_EXAM_TEXT);
    setChapterHint('Physics & Mathematics: Model Set');
    setDefaultMarks(4);
    toast.success('Sample questions template loaded!');
  };

  // AI Parse handler
  const handleParseText = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExamId) {
      toast.error('Please select an exam first');
      return;
    }
    if (!rawText.trim()) {
      toast.error('Please paste your exam questions text');
      return;
    }

    setParsing(true);
    try {
      const res = await api.post(`/api/competitive-exams/${selectedExamId}/ai-parse-text`, {
        rawText,
        defaultMarks: Number(defaultMarks) || 4,
        chapterName: chapterHint.trim() || 'General',
        difficulty,
        previewOnly: true,
      });

      const extracted = res.data?.questions || [];
      if (extracted.length === 0) {
        toast.error('No questions detected. Please verify your text format.');
      } else {
        setParsedQuestions(extracted);
        toast.success(`🎉 Successfully converted ${extracted.length} questions with Gemini 2.5 Flash!`);
      }
    } catch (err: any) {
      console.error('AI text parse error:', err);
      toast.error(err.response?.data?.message || 'Failed to parse text questions.');
    } finally {
      setParsing(false);
    }
  };

  // Bulk save parsed questions to exam
  const handleSaveToExam = async () => {
    if (!selectedExamId) {
      toast.error('Please select an exam to save questions');
      return;
    }
    if (parsedQuestions.length === 0) {
      toast.error('No parsed questions to save');
      return;
    }

    setSaving(true);
    try {
      await api.post(`/api/competitive-exams/${selectedExamId}/bulk-add-questions`, {
        questions: parsedQuestions,
      });
      toast.success(`✅ Successfully added ${parsedQuestions.length} questions to ${activeExam?.title || 'Exam'}!`);
      navigate('/competitive-exams');
    } catch (err: any) {
      console.error('Bulk save error:', err);
      toast.error(err.response?.data?.message || 'Failed to save questions to exam.');
    } finally {
      setSaving(false);
    }
  };

  // Remove question from review list
  const handleRemoveQuestion = (idx: number) => {
    setParsedQuestions(prev => prev.filter((_, i) => i !== idx));
    toast.success('Question removed from batch');
  };

  // Change correct answer for a parsed question
  const handleChangeCorrectAnswer = (qIndex: number, newAns: string) => {
    setParsedQuestions(prev => prev.map((q, idx) => idx === qIndex ? { ...q, correctAnswer: newAns } : q));
  };

  // Inline edit
  const handleStartEdit = (idx: number, currentText: string) => {
    setEditingIndex(idx);
    setEditingText(currentText);
  };

  const handleSaveEdit = (idx: number) => {
    if (!editingText.trim()) return;
    setParsedQuestions(prev => prev.map((q, i) => i === idx ? { ...q, questionText: editingText.trim() } : q));
    setEditingIndex(null);
    toast.success('Question updated');
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 bg-slate-50 min-h-screen">
      {/* Top Breadcrumb & Navigation Bar */}
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
            <span className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-xs">
              <Sparkles size={16} />
            </span>
            <div>
              <h1 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                AI Smart Exam Text Importer
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                Google Gemini 2.5 Flash Automated KaTeX & MCQ Digitizer
              </p>
            </div>
          </div>
        </div>

        {/* Target Exam Dropdown */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <label className="text-xs font-bold text-slate-500 uppercase shrink-0">
            Target Exam:
          </label>
          <select
            value={selectedExamId}
            onChange={(e) => setSelectedExamId(e.target.value)}
            disabled={loadingExams}
            className="w-full sm:w-72 p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-black text-slate-800 text-xs outline-none focus:border-emerald-500 focus:bg-white"
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

      {/* Target Exam Details Banner */}
      {activeExam && (
        <div className="bg-gradient-to-r from-emerald-900 via-teal-950 to-slate-900 text-white p-6 rounded-3xl shadow-lg border border-emerald-500/20 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-black uppercase tracking-wider border border-emerald-400/30">
              <Zap size={13} className="text-amber-400" />
              NTA CBT Blueprint Target
            </div>
            <h2 className="text-xl sm:text-2xl font-black">{activeExam.title}</h2>
            <p className="text-xs text-emerald-200/80 font-medium">
              Class: <strong className="text-white">{activeExam.class?.name || '10th Standard'}</strong> • 
              Duration: <strong className="text-white">{activeExam.duration} Mins</strong> • 
              Total Marks: <strong className="text-white">{activeExam.totalMarks}</strong> • 
              Negative Marking: <strong className="text-rose-300">-{activeExam.negativeMarks || 0}</strong>
            </p>
          </div>

          <div className="flex items-center gap-3 bg-white/10 p-3 rounded-2xl border border-white/10 backdrop-blur-xs">
            <div className="text-center px-3 border-r border-white/10">
              <div className="text-xl font-black text-emerald-300">{activeExam._count?.questions || activeExam.questions?.length || 0}</div>
              <div className="text-[10px] uppercase font-bold text-slate-300">Existing Qs</div>
            </div>
            <div className="text-center px-3">
              <div className="text-xl font-black text-amber-300">{parsedQuestions.length}</div>
              <div className="text-[10px] uppercase font-bold text-slate-300">Parsed Qs</div>
            </div>
          </div>
        </div>
      )}

      {/* Main 2-Column Full-Page Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* LEFT COLUMN: RAW TEXT INPUT & PARSER SETTINGS (5 Cols)          */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <FileText size={15} className="text-emerald-600" />
                Step 1: Paste Raw Exam Text
              </span>
              <button
                type="button"
                onClick={handleLoadSample}
                className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-3 py-1 rounded-xl transition cursor-pointer flex items-center gap-1"
              >
                <Copy size={12} />
                Load Sample Text
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleParseText} className="space-y-4">
              <div>
                <div className="flex justify-between items-center text-xs font-bold text-slate-600 mb-1.5">
                  <label htmlFor="rawText">Questions, Options & Answer Keys *</label>
                  <span className="text-[11px] font-mono text-slate-400">
                    {rawText.length} chars
                  </span>
                </div>
                <textarea
                  id="rawText"
                  rows={16}
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  placeholder={`Paste multiple questions directly from Word, PDF, or text notes...

Example format:
1. What is the acceleration of a freely falling body?
(A) 9.8 m/s²
(B) 10 m/s²
(C) 0 m/s²
(D) 100 m/s²
Ans: A

2. Evaluate $\\int x^2 dx$:
(A) $x^3 / 3 + C$
(B) $2x + C$
(C) $x^2 + C$
(D) $3x^3 + C$
Key: A`}
                  className="w-full border border-slate-200 rounded-2xl p-4 text-xs font-mono leading-relaxed text-slate-800 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 bg-slate-50 focus:bg-white transition"
                  required
                />
              </div>

              {/* Classification & Marks Hint */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    Subject / Chapter Section
                  </label>
                  <input
                    type="text"
                    value={chapterHint}
                    onChange={(e) => setChapterHint(e.target.value)}
                    placeholder="e.g. Physics: Kinematics"
                    className="w-full border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800 outline-none focus:border-emerald-500 bg-slate-50 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    Difficulty Level
                  </label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800 outline-none focus:border-emerald-500 bg-white"
                  >
                    <option value="EASY">Easy</option>
                    <option value="MEDIUM">Medium (JEE / NEET)</option>
                    <option value="HARD">Hard (Advanced)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    Marks per Question
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={defaultMarks}
                    onChange={(e) => setDefaultMarks(Number(e.target.value))}
                    className="w-full border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800 outline-none focus:border-emerald-500 bg-slate-50 focus:bg-white"
                  />
                </div>

                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={() => {
                      setRawText('');
                      setParsedQuestions([]);
                    }}
                    className="w-full py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-bold text-xs transition cursor-pointer"
                  >
                    Clear Input
                  </button>
                </div>
              </div>

              {/* Action Parse Button */}
              <button
                type="submit"
                disabled={parsing || !rawText.trim()}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:from-emerald-700 hover:to-indigo-700 text-white font-extrabold text-sm shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2 transition hover:scale-[1.01] cursor-pointer disabled:opacity-50"
              >
                {parsing ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>Gemini 2.5 Flash AI Parsing Questions...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 text-amber-300" />
                    <span>Parse with AI (Gemini 2.5 Flash)</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Quick Guidance Box */}
          <div className="bg-emerald-50/70 border border-emerald-200 rounded-3xl p-5 text-xs text-emerald-950 space-y-2">
            <h4 className="font-extrabold flex items-center gap-1.5 text-emerald-900 text-sm">
              <CheckCircle2 size={16} className="text-emerald-600" /> Supported AI Features
            </h4>
            <ul className="list-disc pl-5 space-y-1 text-emerald-800 leading-relaxed font-medium">
              <li><strong>KaTeX LaTeX Formulas:</strong> Automatically renders equations wrapped in <code>$...$</code> or <code>$$...$$</code>.</li>
              <li><strong>Flexible Options:</strong> Recognizes <code>(A)</code>, <code>[B]</code>, <code>C)</code>, <code>1.</code>, or line-by-line options.</li>
              <li><strong>Smart Key Detection:</strong> Detects <code>Ans: B</code>, <code>Answer: (C)</code>, <code>Key: 3</code>, or <code>Correct: D</code>.</li>
              <li><strong>Batch Scale:</strong> Paste 10, 20, or 50 questions at once for instant digitization.</li>
            </ul>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* RIGHT COLUMN: LIVE KATEX PREVIEW & REVIEW (7 Cols)             */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <div className="lg:col-span-7 space-y-4">
          
          {parsedQuestions.length === 0 ? (
            /* Empty State Guidance */
            <div className="bg-white rounded-3xl p-10 sm:p-14 border border-slate-200 shadow-sm text-center flex flex-col items-center justify-center min-h-[500px]">
              <div className="w-20 h-20 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4 shadow-xs">
                <Sparkles size={36} className="text-emerald-600" />
              </div>
              <h3 className="text-xl font-black text-slate-800">
                Ready to Digitize Exam Questions
              </h3>
              <p className="text-slate-500 text-xs sm:text-sm max-w-md mt-2 leading-relaxed">
                Paste your question paper on the left and click <strong>"Parse with AI"</strong>. Your questions will be formatted into NTA CBT cards with live KaTeX math formula rendering, options A-D, and customizable answer keys.
              </p>
              <button
                type="button"
                onClick={handleLoadSample}
                className="mt-6 px-6 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs flex items-center gap-2 shadow transition cursor-pointer hover:scale-105"
              >
                <Copy size={14} className="text-emerald-400" />
                Try Sample Questions Template
              </button>
            </div>
          ) : (
            /* Parsed Questions Review List */
            <div className="space-y-4">
              {/* Review Bar */}
              <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-xl bg-emerald-600 text-white font-black text-xs flex items-center justify-center">
                    {parsedQuestions.length}
                  </span>
                  <div>
                    <h3 className="text-sm font-black text-slate-900">
                      AI Review: {parsedQuestions.length} Questions Formatted
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Check formulas and verify the correct answers before saving.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <button
                    onClick={() => setParsedQuestions([])}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-bold transition cursor-pointer"
                  >
                    Clear Results
                  </button>
                  <button
                    onClick={handleSaveToExam}
                    disabled={saving}
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-xs shadow-md transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {saving ? (
                      <>
                        <RefreshCw size={14} className="animate-spin" /> Saving...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={14} /> Confirm & Save All
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Questions Cards */}
              <div className="space-y-4">
                {parsedQuestions.map((q: any, idx: number) => {
                  const opts: string[] = Array.isArray(q.options) ? q.options : ['A', 'B', 'C', 'D'];
                  const optLetters = ['A', 'B', 'C', 'D', 'E', 'F'];
                  const isEditing = editingIndex === idx;

                  return (
                    <div
                      key={idx}
                      className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm hover:border-emerald-300 transition space-y-4"
                    >
                      {/* Card Header */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="w-7 h-7 rounded-xl bg-slate-900 text-white font-black text-xs flex items-center justify-center shrink-0">
                            Q{idx + 1}
                          </span>
                          <span className="px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-700 font-bold text-[11px] border border-slate-200">
                            {q.chapterName || chapterHint || 'General'}
                          </span>
                          <span className="px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 font-black text-[11px] border border-emerald-200">
                            +{q.marks || defaultMarks} Marks
                          </span>
                          <span className="px-2 py-0.5 rounded-lg bg-indigo-50 text-indigo-700 font-bold text-[10px]">
                            {q.difficulty || difficulty}
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleStartEdit(idx, q.questionText)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition cursor-pointer"
                            title="Edit Question Text"
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            onClick={() => handleRemoveQuestion(idx)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                            title="Delete this question"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>

                      {/* Question Text / Inline Edit */}
                      {isEditing ? (
                        <div className="space-y-2">
                          <textarea
                            value={editingText}
                            onChange={(e) => setEditingText(e.target.value)}
                            rows={3}
                            className="w-full border border-indigo-300 rounded-xl p-3 text-xs sm:text-sm font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/20"
                          />
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => setEditingIndex(null)}
                              className="px-3 py-1 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-100"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleSaveEdit(idx)}
                              className="px-3 py-1 rounded-lg text-xs font-black text-white bg-indigo-600 hover:bg-indigo-700"
                            >
                              Save Changes
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-slate-800 text-xs sm:text-sm font-bold leading-relaxed">
                          <LatexRenderer text={q.questionText} />
                        </div>
                      )}

                      {/* Options 2x2 Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                        {opts.map((opt: string, oIdx: number) => {
                          const letter = optLetters[oIdx] || String.fromCharCode(65 + oIdx);
                          const isCorrect = String(opt).trim() === String(q.correctAnswer).trim() || letter === String(q.correctAnswer).trim();

                          return (
                            <div
                              key={oIdx}
                              onClick={() => handleChangeCorrectAnswer(idx, opt)}
                              className={`p-3 rounded-2xl border flex items-start gap-2.5 transition cursor-pointer ${
                                isCorrect
                                  ? 'bg-emerald-50/90 border-emerald-400 ring-1 ring-emerald-400 shadow-xs'
                                  : 'bg-slate-50 border-slate-200 hover:bg-slate-100/70'
                              }`}
                            >
                              <span
                                className={`w-5 h-5 rounded-lg text-[10px] font-black flex items-center justify-center shrink-0 ${
                                  isCorrect ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'
                                }`}
                              >
                                {letter}
                              </span>
                              <div className="flex-1 text-xs text-slate-800 font-medium">
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

                      {/* Correct Answer Switcher */}
                      <div className="pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                        <span className="text-slate-500 font-bold">
                          Correct Answer:
                        </span>
                        <div className="flex items-center gap-2">
                          <select
                            value={q.correctAnswer}
                            onChange={(e) => handleChangeCorrectAnswer(idx, e.target.value)}
                            className="p-1.5 bg-slate-50 border border-slate-200 rounded-xl font-black text-slate-800 text-xs outline-none focus:border-emerald-500"
                          >
                            {opts.map((opt: string, oIdx: number) => {
                              const letter = optLetters[oIdx] || String.fromCharCode(65 + oIdx);
                              return (
                                <option key={oIdx} value={opt}>
                                  Option ({letter}): {opt.length > 40 ? opt.substring(0, 40) + '...' : opt}
                                </option>
                              );
                            })}
                          </select>
                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>

              {/* Bottom Sticky Action Bar */}
              <div className="sticky bottom-4 z-20 bg-slate-900/95 backdrop-blur-md text-white p-4 sm:p-5 rounded-3xl shadow-2xl border border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4">
                <div>
                  <h4 className="text-sm font-black text-white flex items-center gap-2">
                    <CheckCircle2 size={18} className="text-emerald-400" />
                    {parsedQuestions.length} Questions Ready to Commit
                  </h4>
                  <p className="text-xs text-slate-300">
                    Will be added to <strong>{activeExam?.title || 'Exam'}</strong> with full KaTeX math support.
                  </p>
                </div>

                <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
                  <button
                    onClick={() => {
                      if (window.confirm('Are you sure you want to discard these parsed questions?')) {
                        setParsedQuestions([]);
                      }
                    }}
                    className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 text-xs font-bold transition cursor-pointer"
                  >
                    Discard Batch
                  </button>
                  <button
                    onClick={handleSaveToExam}
                    disabled={saving}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-xs shadow-lg shadow-emerald-600/30 transition cursor-pointer flex items-center gap-2 hover:scale-105 disabled:opacity-50"
                  >
                    {saving ? (
                      <>
                        <RefreshCw size={15} className="animate-spin" />
                        <span>Saving Questions to Database...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={16} />
                        <span>Save All ({parsedQuestions.length}) Questions to Exam</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};

export default PasteCompetitiveExamTextPage;
