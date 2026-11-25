import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { Clock, AlertTriangle, ShieldAlert, Eye, LogOut, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';
import katex from 'katex';
import 'katex/dist/katex.min.css';

// KaTeX LaTeX renderer with Diagram & Image support for CBT interface
const LatexRenderer: React.FC<{ content: string; className?: string }> = ({ content, className = '' }) => {
  if (!content) return null;
  const trimmed = content.trim();

  // If content is purely an image URL or data URI
  if (trimmed.startsWith('data:image/') || trimmed.match(/^https?:\/\/.*\.(png|jpg|jpeg|gif|webp|svg)($|\?)/i)) {
    return (
      <div className="my-1.5 inline-block">
        <img src={trimmed} alt="Diagram" className="max-h-52 max-w-full rounded-xl object-contain border border-slate-200 shadow-xs" />
      </div>
    );
  }

  // Handle markdown images: ![alt](url)
  if (trimmed.includes('![') && trimmed.includes('](')) {
    const mdParts = trimmed.split(/(!\[.*?\]\(.*?\))/g);
    return (
      <span className={`inline-latex-content ${className}`}>
        {mdParts.map((part, pIdx) => {
          const match = part.match(/^!\[(.*?)\]\((.*?)\)$/);
          if (match) {
            return (
              <span key={pIdx} className="block my-2">
                <img src={match[2]} alt={match[1] || 'Diagram'} className="max-h-52 max-w-full rounded-xl object-contain border border-slate-200 shadow-xs" />
              </span>
            );
          }
          return <LatexRenderer key={pIdx} content={part} />;
        })}
      </span>
    );
  }

  const parts = content.split(/(\$\$[\s\S]*?\$\$|\$[^$]+?\$)/g);
  return (
    <span className={`inline-latex-content ${className}`}>
      {parts.map((part, index) => {
        if (!part) return null;
        if (part.startsWith('$$') && part.endsWith('$$')) {
          const math = part.slice(2, -2).trim();
          try {
            const html = katex.renderToString(math, { displayMode: true, throwOnError: false });
            return <span key={index} dangerouslySetInnerHTML={{ __html: html }} className="block my-2" />;
          } catch {
            return <code key={index} className="block my-2 bg-slate-100 p-2 rounded">{math}</code>;
          }
        }
        if (part.startsWith('$') && part.endsWith('$')) {
          const math = part.slice(1, -1).trim();
          try {
            const html = katex.renderToString(math, { displayMode: false, throwOnError: false });
            return <span key={index} dangerouslySetInnerHTML={{ __html: html }} className="inline-block px-0.5" />;
          } catch {
            return <code key={index} className="bg-slate-100 px-1 rounded">{math}</code>;
          }
        }
        return <span key={index}>{part}</span>;
      })}
    </span>
  );
};

const TakeCompetitiveExamPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isStaff = ['SUPER_ADMIN', 'ADMIN', 'TEACHER'].includes((user?.role || '').toUpperCase());

  const [schoolInfo, setSchoolInfo] = useState<{ schoolName: string; logoUrl?: string }>({
    schoolName: 'SRI VENKATESWARA JY SCHOOL',
    logoUrl: '/logo.png?v=1'
  });

  const [exam, setExam] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState(0);

  const [answers, setAnswers] = useState<Record<string, { option: string, timeSpent: number }>>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [questionStatuses, setQuestionStatuses] = useState<Record<string, 'not_visited' | 'not_answered' | 'answered' | 'marked_review' | 'answered_marked_review'>>({});

  const [warnings, setWarnings] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasStartedExam, setHasStartedExam] = useState(false);
  const [instructionsAccepted, setInstructionsAccepted] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [warningMessage, setWarningMessage] = useState('');

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(Date.now());
  const activeQuestionTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    api.get('/api/settings').then(res => {
      const data = res.data?.data || res.data;
      if (data) {
        setSchoolInfo({
          schoolName: data.schoolName || 'SRI VENKATESWARA JY SCHOOL',
          logoUrl: data.schoolLogoUrl || data.logoUrl || '/logo.png?v=1'
        });
      }
    }).catch(() => { });
  }, []);

  useEffect(() => {
    fetchExam();
    enterFullScreen();

    // Check if opened in another tab within the session
    const tabKey = `exam_running_${id}`;
    sessionStorage.setItem(tabKey, 'true');

    return () => {
      exitFullScreen();
      removeAntiCheat();
      sessionStorage.removeItem(tabKey);
      if (timerRef.current) clearInterval(timerRef.current);
      if (activeQuestionTimerRef.current) clearInterval(activeQuestionTimerRef.current);
    };
  }, [id]);

  useEffect(() => {
    if (hasStartedExam && !isStaff) {
      setupAntiCheat();
    }
    return () => {
      removeAntiCheat();
    };
  }, [hasStartedExam, isStaff]);

  const fetchExam = async () => {
    try {
      const res = await api.get(`/api/competitive-exams/${id}/student`);
      const examData = res.data?.data || res.data;
      if (!examData) throw new Error('No exam data received');
      setExam(examData);

      // Calculate remaining time synced with server end time ideally.
      // For simplicity here, we use duration in seconds
      setTimeLeft((examData.duration || 180) * 60);

      // Init statuses
      const initStatuses: any = {};
      const qs = examData.questions || [];
      qs.forEach((q: any) => initStatuses[q.id] = 'not_visited');
      if (qs.length > 0) {
        initStatuses[qs[0].id] = 'not_answered';
      }
      setQuestionStatuses(initStatuses);
    } catch (err) {
      toast.error('Failed to load exam or unauthorized.');
      navigate('/competitive-exams');
    } finally {
      setLoading(false);
    }
  };

  const startExamRun = () => {
    if (!instructionsAccepted) return;
    setHasStartedExam(true);
    startTimers();
  };

  const startTimers = () => {
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          autoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Track time spent on active question
    activeQuestionTimerRef.current = setInterval(() => {
      setAnswers(prev => {
        if (!exam || !exam.questions || !exam.questions[currentQuestionIndex]) return prev;
        const qId = exam.questions[currentQuestionIndex].id;
        const currentAns = prev[qId] || { option: '', timeSpent: 0 };
        return {
          ...prev,
          [qId]: { ...currentAns, timeSpent: currentAns.timeSpent + 1 }
        };
      });
    }, 1000);
  };

  const setupAntiCheat = () => {
    if (isStaff) return; // Completely disabled for staff previewing exams
    document.addEventListener('visibilitychange', handleVisibilityChange);
  };

  const removeAntiCheat = () => {
    document.removeEventListener('visibilitychange', handleVisibilityChange);
  };

  const handleVisibilityChange = () => {
    if (isStaff || !hasStartedExam || isSubmitting) return;
    if (document.visibilityState === 'hidden') {
      triggerWarning();
    }
  };

  const triggerWarning = () => {
    if (isSubmitting || isStaff) return;
    setWarnings(w => {
      const newWarnings = w + 1;
      if (newWarnings >= 3) {
        setWarningMessage("Maximum tab switches reached (3/3). Your exam is being automatically submitted for suspicious activity.");
        setShowWarningModal(true);
        setTimeout(() => autoSubmit(), 2000);
      } else {
        setWarningMessage(`Tab switch or window minimizing detected (Attempt ${newWarnings}/3). Please remain on the exam screen. Further attempts will lead to auto-submission.`);
        setShowWarningModal(true);
      }
      return newWarnings;
    });
  };

  const enterFullScreen = async () => {
    try {
      const docElm = document.documentElement;
      if (docElm.requestFullscreen) await docElm.requestFullscreen();
    } catch (e) {
      console.log('Fullscreen failed');
    }
  };

  const exitFullScreen = async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      }
    } catch (e) { }
  };

  const autoSubmit = () => {
    handleSubmit(true);
  };

  const handleSubmit = async (force = false) => {
    if (!force && !showSubmitModal) {
      setShowSubmitModal(true);
      return;
    }
    setShowSubmitModal(false);

    setIsSubmitting(true);
    if (timerRef.current) clearInterval(timerRef.current);
    if (activeQuestionTimerRef.current) clearInterval(activeQuestionTimerRef.current);

    const formattedAnswers = Object.entries(answers).map(([questionId, data]) => ({
      questionId,
      selectedOption: data.option ? String(data.option).trim() : null,
      timeTakenSeconds: Math.max(0, Number(data.timeSpent) || 0)
    }));

    const totalTimeTaken = Math.max(0, Math.floor((Date.now() - startTimeRef.current) / 1000));

    try {
      const res = await api.post(`/api/competitive-exams/${id}/submit`, {
        answers: formattedAnswers,
        totalTimeTaken
      });

      const submissionId = res.data?.submissionId || res.data?.data?.id;
      toast.success("Exam submitted successfully!");
      sessionStorage.removeItem(`exam_running_${id}`);
      exitFullScreen();
      navigate(`/competitive-exam-result/${id}${submissionId ? `?submissionId=${submissionId}` : ''}`, { replace: true });
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to submit exam. Please contact admin.");
      setIsSubmitting(false);
    }
  };

  const handleOptionSelect = (qId: string, option: string) => {
    setAnswers(prev => ({
      ...prev,
      [qId]: { ...prev[qId], option }
    }));
  };

  const handleSaveAndNext = () => {
    const qId = exam.questions[currentQuestionIndex].id;
    const hasAnswered = !!answers[qId]?.option;

    setQuestionStatuses(prev => ({
      ...prev,
      [qId]: hasAnswered ? 'answered' : 'not_answered'
    }));

    if (currentQuestionIndex < exam.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      const nextQId = exam.questions[currentQuestionIndex + 1].id;
      setQuestionStatuses(prev => ({
        ...prev,
        [nextQId]: prev[nextQId] === 'not_visited' ? 'not_answered' : prev[nextQId]
      }));
    }
  };

  const handleClearResponse = () => {
    const qId = exam.questions[currentQuestionIndex].id;
    setAnswers(prev => {
      const newAnswers = { ...prev };
      if (newAnswers[qId]) {
        newAnswers[qId] = { ...newAnswers[qId], option: '' };
      }
      return newAnswers;
    });
  };

  const handleMarkForReview = () => {
    const qId = exam.questions[currentQuestionIndex].id;
    const hasAnswered = !!answers[qId]?.option;

    setQuestionStatuses(prev => ({
      ...prev,
      [qId]: hasAnswered ? 'answered_marked_review' : 'marked_review'
    }));

    if (currentQuestionIndex < exam.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const navigateToQuestion = (index: number) => {
    // Current question status update before leaving
    const currentQId = exam.questions[currentQuestionIndex].id;
    if (questionStatuses[currentQId] === 'not_visited' || questionStatuses[currentQId] === 'not_answered') {
      const hasAnswered = !!answers[currentQId]?.option;
      setQuestionStatuses(prev => ({
        ...prev,
        [currentQId]: hasAnswered ? 'answered' : 'not_answered'
      }));
    }

    setCurrentQuestionIndex(index);

    const targetQId = exam.questions[index].id;
    if (questionStatuses[targetQId] === 'not_visited') {
      setQuestionStatuses(prev => ({
        ...prev,
        [targetQId]: 'not_answered'
      }));
    }
  };

  const formatTime = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (loading || !exam) {
    return <div className="min-h-screen bg-gray-100 flex items-center justify-center font-bold text-slate-700">Loading Exam Environment...</div>;
  }

  if (!exam.questions || exam.questions.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md border border-slate-200">
          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-black text-slate-800">No Questions Found</h2>
          <p className="text-sm text-slate-500 mt-2">This exam does not have any questions populated yet. Please add questions from the Question Bank first.</p>
          <button onClick={() => navigate('/competitive-exams')} className="mt-6 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm shadow cursor-pointer">
            Back to Competitive Exams
          </button>
        </div>
      </div>
    );
  }

  const currentQuestion = exam.questions[currentQuestionIndex];
  const qId = currentQuestion.id;

  // Stats for palette
  const stats = {
    answered: 0,
    not_answered: 0,
    not_visited: 0,
    marked_review: 0,
    answered_marked_review: 0
  };
  Object.values(questionStatuses).forEach(s => stats[s]++);

  if (!hasStartedExam) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans select-none p-3 sm:p-6 md:p-8">
        <div className="w-full max-w-7xl mx-auto bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-200 flex flex-col min-h-[92vh]">
          {/* Institutional School Branding Header */}
          <div className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-blue-700 text-white p-6 sm:p-8 border-b border-indigo-500/20 shrink-0">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-5">
              <div className="flex items-center gap-4 sm:gap-5">
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
                      CBT ONLINE ASSESSMENT PORTAL
                    </span>
                    {isStaff && (
                      <span className="text-[10px] font-bold bg-indigo-500/30 text-indigo-200 px-2.5 py-0.5 rounded-full border border-indigo-400/30">
                        Staff Preview Mode
                      </span>
                    )}
                  </div>
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-black tracking-wide text-white mt-1 uppercase">
                    {schoolInfo.schoolName}
                  </h1>
                  <p className="text-xs sm:text-sm text-indigo-200 font-medium mt-0.5">
                    Computer Based Examination System &bull; Secure Digital Assessment
                  </p>
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-md px-5 py-3.5 rounded-2xl border border-white/15 text-left md:text-right shrink-0">
                <p className="text-[10px] font-black uppercase text-indigo-300 tracking-wider">Exam Title</p>
                <p className="text-lg sm:text-xl font-black text-amber-300 truncate max-w-sm">{exam.title}</p>
                <p className="text-xs text-white/80 font-bold mt-0.5">Subject: {exam.subject?.name || 'General'}</p>
              </div>
            </div>
          </div>
          <div className="p-6 md:p-8 flex-1 overflow-y-auto">
            <h2 className="text-xl font-bold text-slate-800 mb-6 border-b pb-2">Exam Instructions</h2>

            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <p className="text-sm font-bold text-slate-400 uppercase">Duration</p>
                <p className="text-lg font-bold text-slate-800">{exam.duration} Minutes</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <p className="text-sm font-bold text-slate-400 uppercase">Total Marks</p>
                <p className="text-lg font-bold text-slate-800">{exam.totalMarks}</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <p className="text-sm font-bold text-slate-400 uppercase">Total Questions</p>
                <p className="text-lg font-bold text-slate-800">{exam.questions?.length || 0}</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <p className="text-sm font-bold text-slate-400 uppercase">Marking Scheme</p>
                <p className="text-lg font-bold text-emerald-600">+{exam.questions?.[0]?.marks || 4} / <span className="text-red-500">-{exam.negativeMarks || 1}</span></p>
              </div>
            </div>

            <h3 className="font-bold text-slate-800 mb-4">Navigation Rules & Symbols</h3>
            <ul className="space-y-4 text-sm text-slate-700">
              <li className="flex gap-4 items-start">
                <div className="w-8 h-8 shrink-0 bg-gray-200 rounded text-gray-700 flex items-center justify-center font-bold">1</div>
                <span>You have not visited the question yet.</span>
              </li>
              <li className="flex gap-4 items-start">
                <div className="w-8 h-8 shrink-0 bg-red-500 text-white rounded-t-lg rounded-br-lg flex items-center justify-center font-bold">2</div>
                <span>You have visited the question but have not answered it.</span>
              </li>
              <li className="flex gap-4 items-start">
                <div className="w-8 h-8 shrink-0 bg-green-500 text-white rounded-t-lg rounded-br-lg flex items-center justify-center font-bold">3</div>
                <span>You have answered the question.</span>
              </li>
              <li className="flex gap-4 items-start">
                <div className="w-8 h-8 shrink-0 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold">4</div>
                <span>You have NOT answered the question, but have marked the question for review.</span>
              </li>
              <li className="flex gap-4 items-start">
                <div className="w-8 h-8 shrink-0 bg-purple-600 text-white rounded-full border-2 border-green-400 flex items-center justify-center font-bold relative"><span className="absolute -bottom-1 -right-1 w-2.5 h-2.5 bg-green-400 rounded-full"></span>5</div>
                <span>The question(s) "Answered and Marked for Review" will be considered for evaluation.</span>
              </li>
            </ul>

            <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
              <p className="font-bold text-yellow-800">Submission Rules</p>
              <p className="text-yellow-700 text-sm mt-1">The exam will be auto-submitted when the timer reaches 00:00:00. Do not switch tabs or resize the window during the exam. Doing so may result in automatic submission.</p>
            </div>
          </div>
          <div className="p-6 bg-slate-50 border-t border-slate-100 shrink-0">
            <label className="flex items-center gap-3 cursor-pointer mb-6">
              <input type="checkbox" checked={instructionsAccepted} onChange={(e) => setInstructionsAccepted(e.target.checked)} className="w-5 h-5 text-indigo-600 rounded" />
              <span className="font-bold text-slate-700">I have read and understood the instructions. I agree to abide by the rules.</span>
            </label>
            <div className="flex justify-end">
              <button onClick={startExamRun} disabled={!instructionsAccepted} className={`px-10 py-4 rounded-xl font-bold text-lg transition-all shadow-md ${instructionsAccepted ? 'bg-indigo-600 text-white hover:bg-indigo-700 hover:-translate-y-0.5' : 'bg-slate-300 text-slate-500 cursor-not-allowed'}`}>
                START EXAM
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans select-none" style={{ height: '100vh', overflow: 'hidden' }}>
      {/* Institutional School Branding Header */}
      <header className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-blue-700 text-white px-4 py-2.5 sm:px-6 sm:py-3 flex justify-between items-center shadow-lg shrink-0 border-b border-indigo-500/20 w-full">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-white p-1 shadow-md flex items-center justify-center shrink-0 border border-white/20">
            <img
              src={schoolInfo.logoUrl || '/logo.png?v=1'}
              alt="School Logo"
              className="w-full h-full object-contain"
              onError={(e) => { (e.currentTarget as any).src = '/logo.png?v=1'; }}
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-black tracking-wide text-white uppercase leading-tight">
                {schoolInfo.schoolName}
              </h2>
              {isStaff && (
                <span className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30 text-[10px] font-bold">
                  <Eye size={11} /> Staff Preview
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <p className="text-xs sm:text-sm font-bold text-amber-300 truncate max-w-xs sm:max-w-md">
                {exam.title}
              </p>
              <span className="text-[11px] text-indigo-200 hidden sm:inline">&bull; {exam.subject?.name || 'General'}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 sm:gap-4">
          {isStaff && (
            <button
              onClick={() => {
                exitFullScreen();
                navigate('/competitive-exams');
              }}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/20 transition cursor-pointer flex items-center gap-1"
            >
              <LogOut size={13} /> Exit Preview
            </button>
          )}
          {warnings > 0 && !isStaff && (
            <div className="flex items-center gap-2 text-yellow-300 font-bold bg-red-900/40 border border-red-500/30 px-3 py-1 rounded-xl text-xs">
              <ShieldAlert size={16} /> Warnings: {warnings}/3
            </div>
          )}
          <div className="flex items-center gap-2 bg-indigo-950/80 px-3.5 py-1.5 rounded-xl border border-indigo-400/30 shadow-inner">
            <Clock size={18} className={timeLeft < 300 ? 'text-red-400 animate-pulse' : 'text-indigo-300'} />
            <span className={`text-lg sm:text-xl font-mono font-black ${timeLeft < 300 ? 'text-red-400' : 'text-white'}`}>
              {formatTime(timeLeft)}
            </span>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden w-full">
        {/* Left Area: Question */}
        <div className="flex-1 flex flex-col border-r border-slate-200 overflow-hidden bg-white">
          <div className="bg-slate-50 px-6 py-3 border-b border-slate-200 flex justify-between items-center font-bold text-slate-800 shrink-0">
            <div className="flex items-center gap-2.5">
              <span className="text-base font-black text-slate-900">Question No. {currentQuestionIndex + 1}</span>
              {currentQuestion.chapterName && (
                <span className="text-xs px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 font-bold border border-indigo-200">
                  {currentQuestion.chapterName}
                </span>
              )}
            </div>
            <span className="text-xs font-extrabold text-slate-600 bg-white px-3 py-1 rounded-lg border border-slate-200 shadow-xs">
              Marks: <span className="text-emerald-600">+{currentQuestion.marks}</span> / <span className="text-rose-500">-{exam.negativeMarks}</span>
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-6 md:p-8">
            <div className="text-xl md:text-2xl font-bold text-slate-900 mb-6 leading-relaxed">
              <LatexRenderer content={currentQuestion.questionText} />
            </div>

            {currentQuestion.imageUrl && (
              <div className="mb-8 p-3 bg-white border border-slate-200 rounded-2xl shadow-sm inline-block">
                <img src={currentQuestion.imageUrl} alt="Question Graphic" className="max-w-full max-h-80 object-contain rounded-xl" />
              </div>
            )}

            <div className="space-y-4 max-w-4xl">
              {currentQuestion.options.map((opt: string, idx: number) => {
                const isSelected = answers[qId]?.option === opt;
                const optionLabel = String.fromCharCode(65 + idx);
                return (
                  <label
                    key={idx}
                    className={`flex items-start p-4 md:p-5 border-2 rounded-2xl cursor-pointer transition-all ${isSelected
                      ? 'bg-indigo-50/80 border-indigo-600 shadow-md ring-2 ring-indigo-500/20'
                      : 'hover:bg-slate-50 border-slate-200 hover:border-slate-300 bg-white shadow-xs'
                      }`}
                  >
                    <div className="flex items-center gap-3 shrink-0 mr-3">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-sm transition-all ${isSelected
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-700 border border-slate-300'
                        }`}>
                        {optionLabel}
                      </div>
                      <input
                        type="radio"
                        name={`question-${qId}`}
                        checked={isSelected}
                        onChange={() => handleOptionSelect(qId, opt)}
                        className="w-5 h-5 text-indigo-600 border-slate-300 focus:ring-indigo-500"
                      />
                    </div>
                    <div className="flex-1 pt-0.5">
                      <span className="text-slate-900 text-lg md:text-xl font-bold leading-relaxed">
                        <LatexRenderer content={opt} />
                      </span>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="bg-gray-50 p-4 border-t border-gray-300 flex justify-between items-center shrink-0">
            <div className="flex gap-3">
              <button onClick={handleMarkForReview} className="px-6 py-2 border border-gray-400 text-gray-700 bg-white rounded shadow-sm hover:bg-gray-50 font-medium">
                Mark for Review & Next
              </button>
              <button onClick={handleClearResponse} className="px-6 py-2 border border-gray-400 text-gray-700 bg-white rounded shadow-sm hover:bg-gray-50 font-medium">
                Clear Response
              </button>
            </div>
            <button onClick={handleSaveAndNext} className="px-8 py-2 bg-indigo-600 text-white rounded shadow-sm hover:bg-indigo-700 font-medium text-lg">
              Save & Next
            </button>
          </div>
        </div>

        {/* Right Area: Palette */}
        <div className="w-80 flex flex-col bg-gray-50 overflow-hidden">
          {/* User Info */}
          <div className="p-4 border-b border-gray-300 bg-white flex items-center gap-3">
            <div className="w-12 h-12 bg-indigo-100 rounded text-indigo-800 flex items-center justify-center font-bold text-xl">
              S
            </div>
            <div>
              <p className="font-bold text-gray-800">Student Profile</p>
              <p className="text-xs text-gray-500">{exam.subject.name}</p>
            </div>
          </div>

          {/* Legend */}
          <div className="p-4 border-b border-gray-300 text-xs font-medium text-gray-700 grid grid-cols-2 gap-y-3 bg-white">
            <div className="flex items-center gap-2"><div className="w-6 h-6 rounded-t-lg rounded-br-lg bg-green-500 text-white flex items-center justify-center">{stats.answered}</div> Answered</div>
            <div className="flex items-center gap-2"><div className="w-6 h-6 rounded-t-lg rounded-br-lg bg-red-500 text-white flex items-center justify-center">{stats.not_answered}</div> Not Answered</div>
            <div className="flex items-center gap-2"><div className="w-6 h-6 rounded bg-gray-200 text-gray-700 flex items-center justify-center">{stats.not_visited}</div> Not Visited</div>
            <div className="flex items-center gap-2"><div className="w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center">{stats.marked_review}</div> Marked Review</div>
            <div className="flex items-center gap-2 col-span-2"><div className="w-6 h-6 rounded-full bg-purple-600 border-2 border-green-400 text-white flex items-center justify-center relative">{stats.answered_marked_review}<span className="absolute -bottom-1 -right-1 w-2 h-2 bg-green-400 rounded-full"></span></div> Answered & Marked Review</div>
          </div>

          {/* Palette Grid */}
          <div className="flex-1 overflow-y-auto p-4 bg-[#e5f1f8]">
            <h3 className="font-bold text-gray-700 mb-3">{exam.subject?.name || 'General Subject'}</h3>
            <div className="grid grid-cols-5 gap-3">
              {exam.questions.map((q: any, idx: number) => {
                const status = questionStatuses[q.id];
                let bgClass = "bg-gray-200 text-gray-700 rounded";
                if (status === 'answered') bgClass = "bg-green-500 text-white rounded-t-lg rounded-br-lg";
                else if (status === 'not_answered') bgClass = "bg-red-500 text-white rounded-t-lg rounded-br-lg";
                else if (status === 'marked_review') bgClass = "bg-purple-600 text-white rounded-full";
                else if (status === 'answered_marked_review') bgClass = "bg-purple-600 text-white rounded-full border-2 border-green-400";

                return (
                  <button
                    key={q.id}
                    onClick={() => navigateToQuestion(idx)}
                    className={`w-10 h-10 flex items-center justify-center font-bold relative ${bgClass} hover:opacity-80`}
                  >
                    {idx + 1}
                    {status === 'answered_marked_review' && <span className="absolute -bottom-1 -right-1 w-2.5 h-2.5 bg-green-400 rounded-full border border-white"></span>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Final Submit */}
          <div className="p-4 bg-white border-t border-gray-300 shrink-0">
            <button
              onClick={() => setShowSubmitModal(true)}
              disabled={isSubmitting}
              className="w-full py-3 bg-green-600 text-white rounded font-bold text-lg hover:bg-green-700 shadow-md flex items-center justify-center gap-2"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Exam'}
            </button>
          </div>
        </div>
      </div>

      {showSubmitModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl">
            <h2 className="text-2xl font-black text-indigo-900 mb-6 text-center uppercase tracking-wider">Submit Exam?</h2>

            <div className="bg-slate-50 rounded-2xl p-6 space-y-4 mb-8 border border-slate-100">
              <div className="flex justify-between items-center text-lg">
                <span className="font-bold text-slate-500 flex items-center gap-2"><div className="w-4 h-4 bg-green-500 rounded-sm"></div> Answered</span>
                <span className="font-extrabold text-slate-800">{stats.answered + stats.answered_marked_review}</span>
              </div>
              <div className="flex justify-between items-center text-lg">
                <span className="font-bold text-slate-500 flex items-center gap-2"><div className="w-4 h-4 bg-red-500 rounded-sm"></div> Not Answered</span>
                <span className="font-extrabold text-slate-800">{stats.not_answered}</span>
              </div>
              <div className="flex justify-between items-center text-lg">
                <span className="font-bold text-slate-500 flex items-center gap-2"><div className="w-4 h-4 bg-purple-600 rounded-full"></div> Marked Review</span>
                <span className="font-extrabold text-slate-800">{stats.marked_review}</span>
              </div>
            </div>

            <p className="text-center font-bold text-slate-600 mb-8">Are you sure you want to submit?</p>

            <div className="flex gap-4">
              <button onClick={() => setShowSubmitModal(false)} className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-lg transition-colors">
                CANCEL
              </button>
              <button onClick={() => handleSubmit(true)} disabled={isSubmitting} className="flex-1 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-lg transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5">
                SUBMIT EXAM
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modern In-App Warning Modal (Replaces native browser alert) */}
      {showWarningModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl text-center space-y-4 border border-rose-200 animate-in fade-in zoom-in-95">
            <div className="w-16 h-16 rounded-3xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto shadow-xs">
              <ShieldAlert size={36} />
            </div>
            <h3 className="text-xl font-black text-slate-900">Proctoring Alert</h3>
            <p className="text-sm text-slate-600 leading-relaxed font-medium">
              {warningMessage}
            </p>
            {warnings < 3 ? (
              <button
                onClick={() => setShowWarningModal(false)}
                className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-sm shadow-md transition cursor-pointer"
              >
                I Understand & Return to Exam
              </button>
            ) : (
              <div className="p-3 bg-rose-50 text-rose-700 font-bold text-xs rounded-xl">
                Auto-submitting exam now...
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TakeCompetitiveExamPage;
