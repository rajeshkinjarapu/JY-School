import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import api from "../../api/axios";
import { CheckCircle, XCircle, Clock, Award, BarChart3, ChevronLeft, AlertTriangle, Play, HelpCircle, Check, Printer } from "lucide-react";
import katex from "katex";
import "katex/dist/katex.min.css";

// ═══════════════════════════════════════════════════════════════
// KATEX LATEX MATH FORMULA RENDERER
// ═══════════════════════════════════════════════════════════════
const LatexRenderer: React.FC<{ text: string; className?: string }> = ({ text, className = '' }) => {
  if (!text) return null;
  const trimmed = text.trim();

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

export const CompetitiveExamResultPage = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const submissionId = searchParams.get('submissionId');
  const navigate = useNavigate();
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
      <div className="p-12 flex flex-col items-center justify-center min-h-[60vh] space-y-3">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-600 font-bold text-sm">Evaluating test score and loading result...</p>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="p-4 md:p-8 max-w-3xl mx-auto space-y-6 animate-fadeIn">
        <button 
          onClick={() => navigate("/competitive-exams")} 
          className="p-2.5 bg-white rounded-2xl shadow-sm border border-slate-200 hover:bg-slate-50 flex items-center gap-2 text-xs font-bold text-slate-700 transition cursor-pointer"
        >
          <ChevronLeft size={16} /> Back to Competitive Exams
        </button>

        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-sm text-center space-y-5">
          <div className="w-16 h-16 rounded-3xl bg-amber-50 text-amber-500 border border-amber-200 flex items-center justify-center mx-auto shadow-xs">
            <AlertTriangle size={32} />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900">No Exam Submission Found</h2>
            <p className="text-sm text-slate-500 max-w-md mx-auto mt-1.5 leading-relaxed">
              No test attempt record is available for this exam yet. If you haven't taken this CBT test, you can launch it now.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
            <button
              onClick={() => navigate("/competitive-exams")}
              className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
            >
              Return to Exams List
            </button>
            <button
              onClick={() => navigate(`/take-competitive-exam/${id}`)}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-xs shadow-md transition cursor-pointer flex items-center gap-2"
            >
              <Play size={14} className="fill-white" /> Launch CBT Exam Now
            </button>
          </div>
        </div>
      </div>
    );
  }

  const exam = result.exam || {};
  const responses = result.responses || [];
  const totalQuestions = exam.questions?.length || responses.length;
  const correct = responses.filter((r: any) => r.isCorrect).length;
  const incorrect = responses.filter((r: any) => !r.isCorrect && r.selectedOption).length;
  const unattempted = totalQuestions - (correct + incorrect);
  const accuracy = (correct + incorrect) > 0 ? Math.round((correct / (correct + incorrect)) * 100) : 0;

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}m ${s}s`;
  };

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto bg-slate-50 min-h-screen">
      {/* Top Institutional School Branding Header */}
      <div className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 text-white p-6 sm:p-7 rounded-3xl border border-indigo-400/20 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-5">
        <div className="flex items-center gap-4 sm:gap-5">
          <button 
            onClick={() => navigate("/competitive-exams")} 
            className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-2xl transition cursor-pointer shrink-0 border border-white/20"
            title="Return to Exams"
          >
            <ChevronLeft size={20} />
          </button>

          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white p-1.5 shadow-lg flex items-center justify-center shrink-0 border border-white/20">
            <img 
              src={schoolInfo.logoUrl || '/logo.png?v=1'} 
              alt="School Logo" 
              className="w-full h-full object-contain" 
              onError={(e) => { (e.currentTarget as any).src = '/logo.png?v=1'; }} 
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black tracking-widest uppercase bg-amber-400 text-slate-950 px-2.5 py-0.5 rounded-full shadow-xs">
                OFFICIAL CBT SCORECARD
              </span>
              <span className="text-xs text-indigo-200 font-bold">Class: {exam.class?.name || '10th Standard'}</span>
            </div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-black tracking-wide text-white mt-1 uppercase">
              {schoolInfo.schoolName}
            </h1>
            <p className="text-xs sm:text-sm text-indigo-200 font-medium mt-0.5">
              {exam.title || 'Competitive Mock Test'} &bull; Subject: {exam.subject?.name || 'General'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <button
            onClick={() => window.print()}
            className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-1.5 border border-white/20 transition cursor-pointer"
          >
            <Printer size={15} /> Print Scorecard
          </button>
          <button
            onClick={() => navigate(`/take-competitive-exam/${exam.id || id}`)}
            className="px-5 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-md transition cursor-pointer"
          >
            <Play size={14} className="fill-white" /> Retake Test
          </button>
        </div>
      </div>

      {/* KPI Stats Ribbon */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
        <div className="bg-gradient-to-br from-indigo-600 to-purple-700 text-white p-5 rounded-3xl shadow-md flex flex-col justify-between">
          <p className="text-indigo-200 text-[10px] font-black uppercase tracking-wider">Total Marks</p>
          <div className="my-2">
            <h2 className="text-3xl font-black">{result.marksObtained}</h2>
            <span className="text-xs text-indigo-200 font-bold">out of {exam.totalMarks || 100}</span>
          </div>
          <span className="text-[10px] font-bold text-indigo-100 bg-white/10 px-2 py-0.5 rounded-full w-fit">
            Score Earned
          </span>
        </div>

        <div className="bg-white p-5 rounded-3xl shadow-xs border border-slate-200 flex flex-col justify-between">
          <div className="flex justify-between items-center">
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-wider">Correct</p>
            <CheckCircle className="w-5 h-5 text-emerald-500" />
          </div>
          <h3 className="text-2xl font-black text-emerald-600 my-1">{correct}</h3>
          <p className="text-[11px] font-bold text-slate-500">+{correct * 4} Marks</p>
        </div>

        <div className="bg-white p-5 rounded-3xl shadow-xs border border-slate-200 flex flex-col justify-between">
          <div className="flex justify-between items-center">
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-wider">Incorrect</p>
            <XCircle className="w-5 h-5 text-rose-500" />
          </div>
          <h3 className="text-2xl font-black text-rose-600 my-1">{incorrect}</h3>
          <p className="text-[11px] font-bold text-slate-500">-{incorrect * (exam.negativeMarks || 1)} Negative</p>
        </div>

        <div className="bg-white p-5 rounded-3xl shadow-xs border border-slate-200 flex flex-col justify-between">
          <div className="flex justify-between items-center">
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-wider">Accuracy</p>
            <Award className="w-5 h-5 text-indigo-500" />
          </div>
          <h3 className="text-2xl font-black text-indigo-600 my-1">{accuracy}%</h3>
          <p className="text-[11px] font-bold text-slate-500">{unattempted} Unattempted</p>
        </div>

        <div className="bg-white p-5 rounded-3xl shadow-xs border border-slate-200 flex flex-col justify-between">
          <div className="flex justify-between items-center">
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-wider">Time Spent</p>
            <Clock className="w-5 h-5 text-amber-500" />
          </div>
          <h3 className="text-2xl font-black text-slate-800 my-1">{formatTime(result.totalTimeTaken)}</h3>
          <p className="text-[11px] font-bold text-slate-500">Limit: {exam.duration || 180}m</p>
        </div>
      </div>

      {/* Detailed Question Analysis */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 space-y-5">
        <div className="flex justify-between items-center pb-4 border-b border-slate-100">
          <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
            <BarChart3 className="text-indigo-600" size={20} /> Detailed Question-by-Question Analysis
          </h3>
          <span className="text-xs font-bold text-slate-500">
            {responses.length} Responses Reviewed
          </span>
        </div>

        <div className="space-y-4">
          {responses.map((r: any, idx: number) => {
            const isCorrect = r.isCorrect;
            const notAttempted = !r.selectedOption || r.selectedOption.trim() === '';

            let borderBg = "border-slate-300 bg-slate-50/70";
            let statusBadge = (
              <span className="px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-700 text-[10px] font-black uppercase">
                Not Attempted (0 Marks)
              </span>
            );

            if (isCorrect) {
              borderBg = "border-emerald-500 bg-emerald-50/50";
              statusBadge = (
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase flex items-center gap-1">
                  <Check size={11} /> Correct (+{r.question?.marks || 4})
                </span>
              );
            } else if (!notAttempted) {
              borderBg = "border-rose-400 bg-rose-50/50";
              statusBadge = (
                <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-black uppercase">
                  Incorrect (-{exam.negativeMarks || 1})
                </span>
              );
            }

            return (
              <div key={r.id || idx} className={`p-5 rounded-2xl border-2 transition ${borderBg}`}>
                <div className="flex justify-between items-start gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                      Q{idx + 1}
                    </span>
                    {r.question?.chapterName && (
                      <span className="text-[10px] font-bold text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                        {r.question.chapterName}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {statusBadge}
                    <span className="text-[11px] font-bold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200 flex items-center gap-1">
                      <Clock size={11} /> {formatTime(r.timeTakenSeconds)}
                    </span>
                  </div>
                </div>

                {/* Question Statement with KaTeX */}
                <div className="text-sm font-bold text-slate-800 leading-relaxed pl-1 mb-3">
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
                    <span className="text-[10px] uppercase font-black text-slate-400 block mb-1">Your Selected Option</span>
                    <div className={`text-xs font-bold ${isCorrect ? "text-emerald-700" : notAttempted ? "text-slate-500" : "text-rose-700"}`}>
                      {notAttempted ? "— No Option Chosen —" : <LatexRenderer text={r.selectedOption} />}
                    </div>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-slate-200">
                    <span className="text-[10px] uppercase font-black text-emerald-600 block mb-1">Correct Answer Key</span>
                    <div className="text-xs font-bold text-emerald-700">
                      <LatexRenderer text={r.question?.correctAnswer || "A"} />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CompetitiveExamResultPage;
