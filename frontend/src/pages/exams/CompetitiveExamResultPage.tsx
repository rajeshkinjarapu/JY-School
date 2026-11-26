import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import api from "../../api/axios";
import { useAuth } from "../../hooks/useAuth";
import { CheckCircle, XCircle, Clock, Award, BarChart3, ChevronLeft, AlertTriangle, Play, Check, Printer, Trophy, Lightbulb } from "lucide-react";
import katex from "katex";
import "katex/dist/katex.min.css";

// ═══════════════════════════════════════════════════════════════
// KATEX LATEX MATH FORMULA RENDERER
// ═══════════════════════════════════════════════════════════════
const LatexRenderer: React.FC<{ text?: string; content?: string; className?: string }> = ({ text, content, className = '' }) => {
  const raw = text ?? content ?? '';
  if (!raw) return null;
  const trimmed = raw.trim();

  // Pure image URL or data URI
  if (trimmed.startsWith('data:image/') || trimmed.match(/^https?:\/\/.*\.(png|jpg|jpeg|gif|webp|svg)($|\?)/i)) {
    return (
      <div className="my-1.5 inline-block">
        <img src={trimmed} alt="Diagram" className="max-h-40 max-w-full rounded-xl object-contain border border-slate-200 shadow-xs" />
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

export const CompetitiveExamResultPage = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const submissionId = searchParams.get('submissionId');
  const navigate = useNavigate();
  const { user } = useAuth();
  const isStaff = ['SUPER_ADMIN', 'ADMIN', 'TEACHER'].includes((user?.role || '').toUpperCase());
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [schoolInfo, setSchoolInfo] = useState<{ schoolName: string; logoUrl: string }>({
    schoolName: 'JY SCHOOL',
    logoUrl: '/logo.png?v=1'
  });

  useEffect(() => {
    api.get('/api/settings').then(res => {
      const data = res.data?.data || res.data;
      if (data) {
        setSchoolInfo({
          schoolName: data.schoolName || 'JY SCHOOL',
          logoUrl: data.schoolLogoUrl || data.logoUrl || '/logo.png?v=1'
        });
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const fetchResult = async () => {
      setLoading(true);
      try {
        const query = submissionId ? `?submissionId=${submissionId}` : '';
        const res = await api.get(`/api/competitive-exams/${id}/result${query}`);
        setResult(res.data?.data || null);
      } catch (err: any) {
        console.warn('Result fetch error:', err);
        setResult(null);
      } finally {
        setLoading(false);
      }
    };
    fetchResult();
  }, [id, submissionId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F4F7FC] p-12 flex flex-col items-center justify-center space-y-3">
        <div className="w-10 h-10 border-4 border-[#5B3DF5] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-600 font-bold text-sm">Evaluating test score and loading result...</p>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="min-h-screen bg-[#F4F7FC] p-4 md:p-8 flex items-center justify-center">
        <div className="max-w-xl w-full space-y-5">
          <button 
            onClick={() => navigate("/competitive-exams")} 
            className="px-4 py-2.5 bg-white rounded-xl shadow-[0_2px_10px_rgba(15,23,42,0.03)] border border-slate-200/80 hover:bg-slate-50 inline-flex items-center gap-2 text-xs font-bold text-slate-700 transition cursor-pointer"
          >
            <ChevronLeft size={16} /> Back to Online Exam Module
          </button>

          <div className="bg-white rounded-2xl p-8 sm:p-10 border border-slate-200/80 shadow-[0_4px_20px_rgba(15,23,42,0.05)] text-center space-y-5">
            <div className="w-16 h-16 rounded-2xl bg-[#FFF4E5] text-[#D97706] border border-[#FDE2BA] flex items-center justify-center mx-auto">
              <AlertTriangle size={32} />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                {isStaff ? 'No Student Submission Yet' : 'No Exam Submission Found'}
              </h2>
              <p className="text-sm text-slate-500 max-w-md mx-auto mt-1.5 leading-relaxed">
                {isStaff
                  ? 'No student has submitted an attempt for this exam yet. You can view the exam merit leaderboard or launch a CBT preview.'
                  : "No test attempt record is available for this exam yet. If you haven't taken this CBT test, you can launch it now."}
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                onClick={() => navigate("/competitive-exams/results")}
                className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
              >
                {isStaff ? 'View All Results' : 'Return to Exams List'}
              </button>
              {isStaff && (
                <button
                  onClick={() => navigate(`/competitive-exam-leaderboard/${id}`)}
                  className="px-5 py-2.5 rounded-xl bg-[#FFF4E5] hover:bg-[#FFE9CC] text-[#D97706] border border-[#FDE2BA] font-extrabold text-xs transition cursor-pointer flex items-center gap-1.5"
                >
                  <Trophy size={14} /> Merit Leaderboard
                </button>
              )}
              <button
                onClick={() => navigate(`/take-competitive-exam/${id}`)}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#5B3DF5] to-[#7B3DF5] hover:opacity-95 text-white font-extrabold text-xs shadow-sm transition cursor-pointer flex items-center gap-2"
              >
                <Play size={14} className="fill-white" /> {isStaff ? 'Launch CBT Preview' : 'Launch CBT Exam Now'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const exam = result.exam || {};
  const responses = result.responses || [];
  const totalQuestions = exam.questions?.length || responses.length;
  const correctResponses = responses.filter((r: any) => r.isCorrect);
  const incorrectResponses = responses.filter((r: any) => !r.isCorrect && r.selectedOption && String(r.selectedOption).trim() !== '');
  const correct = correctResponses.length;
  const incorrect = incorrectResponses.length;
  const unattempted = Math.max(0, totalQuestions - (correct + incorrect));
  const accuracy = (correct + incorrect) > 0 ? Math.round((correct / (correct + incorrect)) * 100) : 0;
  const negPerQ = Number(exam.negativeMarks ?? 0);
  const marksPerQDefault = Number(exam.marksPerQuestion || responses[0]?.question?.marks || 4);
  const positiveMarksEarned = correctResponses.reduce((sum: number, r: any) => sum + Number(r.question?.marks || marksPerQDefault), 0);
  const negativeMarksDeducted = Number((incorrect * negPerQ).toFixed(2));
  const isStaffBlueprintPreview = Boolean(result.previewOnly);

  const formatTime = (secs: number) => {
    const safe = Math.max(0, Number(secs) || 0);
    const m = Math.floor(safe / 60);
    const s = safe % 60;
    return `${m}m ${s}s`;
  };

  return (
    <div className="min-h-screen bg-[#F4F7FC]">
      <div className="p-4 md:p-8 space-y-5 max-w-7xl mx-auto">
        {isStaffBlueprintPreview && (
          <div className="bg-[#FFF4E5] border border-[#FDE2BA] rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 text-xs font-bold text-[#9A3412]">
              <AlertTriangle size={16} className="text-[#D97706] shrink-0" />
              <span>Staff Answer-Key Preview: No student has submitted this exam yet. Below is the official question &amp; answer key verification sheet.</span>
            </div>
            <button
              onClick={() => navigate(`/competitive-exam-leaderboard/${exam.id || id}`)}
              className="px-3.5 py-1.5 rounded-xl bg-white border border-[#FDE2BA] text-[#D97706] text-xs font-extrabold cursor-pointer hover:bg-amber-50"
            >
              Open Leaderboard
            </button>
          </div>
        )}

        {/* Top Institutional School Branding Header (Unified Pastel Light Card) */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-[0_2px_10px_rgba(15,23,42,0.03)] flex flex-col md:flex-row justify-between items-start md:items-center gap-5">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate(isStaff ? "/competitive-exams/results" : "/competitive-exams")} 
              className="p-2.5 bg-[#F4F7FC] hover:bg-slate-200/70 text-slate-700 rounded-xl border border-slate-200 transition cursor-pointer shrink-0"
              title="Return to Exams"
            >
              <ChevronLeft size={20} />
            </button>

            <div className="w-14 h-14 rounded-2xl bg-[#F4F7FC] p-1.5 flex items-center justify-center shrink-0 border border-slate-200">
              <img 
                src={schoolInfo.logoUrl || '/logo.png?v=1'} 
                alt="School Logo" 
                className="w-full h-full object-contain" 
                onError={(e) => { (e.currentTarget as any).src = '/logo.png?v=1'; }} 
              />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-black tracking-widest uppercase bg-[#EFEAFE] text-[#5B3DF5] border border-[#DDD4FE] px-2.5 py-0.5 rounded-full">
                  OFFICIAL CBT SCORECARD
                </span>
                <span className="text-xs text-slate-600 font-bold">
                  {result.student?.user?.name ? `${result.student.user.name} • ` : ''}
                  Class: {exam.class?.name || 'All'}
                </span>
              </div>
              <h1 className="text-lg sm:text-xl md:text-2xl font-black tracking-tight text-slate-900 mt-1 uppercase">
                {schoolInfo.schoolName}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 font-semibold mt-0.5">
                {exam.title || 'Competitive Exam'} &bull; Subject: {exam.subject?.name || 'General'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-end print:hidden">
            {isStaff && (
              <button
                onClick={() => navigate(`/competitive-exam-leaderboard/${exam.id || id}`)}
                className="px-4 py-2.5 rounded-xl bg-[#FFF4E5] hover:bg-[#FFE9CC] text-[#D97706] border border-[#FDE2BA] font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
              >
                <Trophy size={15} /> Leaderboard
              </button>
            )}
            <button
              onClick={() => window.print()}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
            >
              <Printer size={15} /> Print Scorecard
            </button>
            <button
              onClick={() => navigate(`/take-competitive-exam/${exam.id || id}`)}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#5B3DF5] to-[#7B3DF5] hover:opacity-95 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-sm transition cursor-pointer"
            >
              <Play size={14} className="fill-white" /> {isStaff ? 'Preview CBT' : 'Retake Test'}
            </button>
          </div>
        </div>

        {/* Unified Pastel 5-Tile KPI Stats Ribbon */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
          <div className="bg-gradient-to-br from-[#5B3DF5] to-[#7B3DF5] text-white p-5 rounded-2xl shadow-sm flex flex-col justify-between">
            <p className="text-indigo-100 text-[10px] font-black uppercase tracking-wider">Total Marks</p>
            <div className="my-1.5">
              <h2 className="text-3xl font-black tabular-nums">{result.marksObtained}</h2>
              <span className="text-xs text-indigo-100 font-bold">out of {exam.totalMarks || 100}</span>
            </div>
            <span className="text-[10px] font-bold text-white bg-white/15 px-2.5 py-0.5 rounded-full w-fit">
              Score Earned
            </span>
          </div>

          <div className="bg-[#EAFAEE] p-5 rounded-2xl border border-[#CBEFD6] flex flex-col justify-between">
            <div className="flex justify-between items-center">
              <p className="text-[#16A34A] text-[10px] font-black uppercase tracking-wider">Correct</p>
              <CheckCircle className="w-5 h-5 text-[#16A34A]" />
            </div>
            <h3 className="text-2xl font-black text-slate-900 my-1 tabular-nums">{correct}</h3>
            <p className="text-[11px] font-bold text-[#16A34A]">+{positiveMarksEarned} Marks</p>
          </div>

          <div className="bg-[#FEECEF] p-5 rounded-2xl border border-[#FBD0D8] flex flex-col justify-between">
            <div className="flex justify-between items-center">
              <p className="text-[#E11D48] text-[10px] font-black uppercase tracking-wider">Incorrect</p>
              <XCircle className="w-5 h-5 text-[#E11D48]" />
            </div>
            <h3 className="text-2xl font-black text-slate-900 my-1 tabular-nums">{incorrect}</h3>
            <p className="text-[11px] font-bold text-[#E11D48]">
              {negPerQ > 0 ? `-${negativeMarksDeducted} Negative` : '0 Negative Penalty'}
            </p>
          </div>

          <div className="bg-[#EAF3FF] p-5 rounded-2xl border border-[#D4E6FF] flex flex-col justify-between">
            <div className="flex justify-between items-center">
              <p className="text-[#2563EB] text-[10px] font-black uppercase tracking-wider">Accuracy</p>
              <Award className="w-5 h-5 text-[#2563EB]" />
            </div>
            <h3 className="text-2xl font-black text-slate-900 my-1 tabular-nums">{accuracy}%</h3>
            <p className="text-[11px] font-bold text-slate-600">{unattempted} Unattempted</p>
          </div>

          <div className="bg-[#FFF4E5] p-5 rounded-2xl border border-[#FDE2BA] flex flex-col justify-between col-span-2 md:col-span-1">
            <div className="flex justify-between items-center">
              <p className="text-[#D97706] text-[10px] font-black uppercase tracking-wider">Time Spent</p>
              <Clock className="w-5 h-5 text-[#D97706]" />
            </div>
            <h3 className="text-2xl font-black text-slate-900 my-1 tabular-nums">{formatTime(result.totalTimeTaken)}</h3>
            <p className="text-[11px] font-bold text-slate-600">Limit: {exam.duration || 180}m</p>
          </div>
        </div>

        {/* Detailed Question Analysis */}
        <div className="bg-white rounded-2xl p-5 sm:p-7 shadow-[0_2px_10px_rgba(15,23,42,0.03)] border border-slate-200/80 space-y-5">
          <div className="flex justify-between items-center pb-4 border-b border-slate-100">
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <BarChart3 className="text-[#5B3DF5]" size={20} /> Detailed Question-by-Question Analysis
            </h3>
            <span className="text-xs font-bold text-slate-500">
              {responses.length} Questions Reviewed
            </span>
          </div>

          <div className="space-y-4">
            {responses.map((r: any, idx: number) => {
              const isCorrect = r.isCorrect;
              const notAttempted = !r.selectedOption || String(r.selectedOption).trim() === '';
              const qMarks = Number(r.question?.marks || marksPerQDefault);

              let borderBg = "border-slate-200 bg-slate-50/70";
              let statusBadge = (
                <span className="px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-700 text-[10px] font-black uppercase">
                  Not Attempted (0 Marks)
                </span>
              );

              if (isCorrect) {
                borderBg = "border-[#86EFAC] bg-[#F2FCF5]";
                statusBadge = (
                  <span className="px-2.5 py-0.5 rounded-full bg-[#DCFCE7] text-[#15803D] text-[10px] font-black uppercase flex items-center gap-1">
                    <Check size={11} /> Correct (+{qMarks})
                  </span>
                );
              } else if (!notAttempted) {
                borderBg = "border-[#FDA4AF] bg-[#FFF5F7]";
                statusBadge = (
                  <span className="px-2.5 py-0.5 rounded-full bg-[#FFE4E6] text-[#BE123C] text-[10px] font-black uppercase">
                    Incorrect ({negPerQ > 0 ? `-${negPerQ}` : '0'})
                  </span>
                );
              }

              return (
                <div key={r.id || idx} className={`p-5 rounded-2xl border transition ${borderBg}`}>
                  <div className="flex flex-wrap justify-between items-start gap-3 mb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-[#5B3DF5] to-[#7B3DF5] text-white font-black text-xs flex items-center justify-center shrink-0">
                        Q{idx + 1}
                      </span>
                      {r.question?.chapterName && (
                        <span className="text-[11px] font-bold text-[#2563EB] bg-[#EAF3FF] px-2.5 py-0.5 rounded-lg border border-[#D4E6FF]">
                          {r.question.chapterName}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {statusBadge}
                      <span className="text-[11px] font-bold text-slate-600 bg-white px-2.5 py-0.5 rounded-lg border border-slate-200 flex items-center gap-1">
                        <Clock size={11} /> {formatTime(r.timeTakenSeconds)}
                      </span>
                    </div>
                  </div>

                  {/* Question Statement with KaTeX */}
                  <div className="text-sm font-bold text-slate-900 leading-relaxed pl-1 mb-3">
                    <LatexRenderer text={r.question?.questionText || "Question text unavailable"} />
                  </div>

                  {/* Question Diagram if any */}
                  {r.question?.imageUrl && (
                    <div className="mb-3 p-2 bg-white rounded-xl border border-slate-200 inline-block">
                      <img src={r.question.imageUrl} alt="Diagram" className="max-h-40 object-contain rounded" />
                    </div>
                  )}

                  {/* Answer Comparison */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200/60">
                    <div className="bg-white p-3 rounded-xl border border-slate-200">
                      <span className="text-[10px] uppercase font-black text-slate-400 block mb-1">Selected Answer</span>
                      <div className={`text-xs font-bold ${isCorrect ? "text-[#15803D]" : notAttempted ? "text-slate-500" : "text-[#BE123C]"}`}>
                        {notAttempted ? "— No Option Chosen —" : <LatexRenderer text={r.selectedOption} />}
                      </div>
                    </div>

                    <div className="bg-white p-3 rounded-xl border border-[#CBEFD6]">
                      <span className="text-[10px] uppercase font-black text-[#16A34A] block mb-1">Correct Answer Key</span>
                      <div className="text-xs font-bold text-[#15803D]">
                        <LatexRenderer text={r.question?.correctAnswer || "A"} />
                      </div>
                    </div>
                  </div>

                  {r.question?.explanation && (
                    <div className="mt-3 p-3 rounded-xl bg-[#EAF3FF] border border-[#D4E6FF] text-xs text-slate-700 flex items-start gap-2">
                      <Lightbulb size={15} className="text-[#2563EB] shrink-0 mt-0.5" />
                      <div>
                        <span className="font-black text-[#1D4ED8] mr-1">Solution:</span>
                        <LatexRenderer text={r.question.explanation} />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompetitiveExamResultPage;
