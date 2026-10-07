import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../hooks/useAuth';
import { ShieldAlert } from 'lucide-react';

const TakeCompetitiveExamPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [exam, setExam] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState(0);
  
  const [answers, setAnswers] = useState<Record<string, { option: string, timeSpent: number }>>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [questionStatuses, setQuestionStatuses] = useState<Record<string, 'not_visited' | 'not_answered' | 'answered' | 'marked_review' | 'answered_marked_review'>>({});
  
  const [warnings, setWarnings] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Instruction Steps: 0 = General Instructions 1, 1 = General Instructions 2, 2 = Exam Running
  const [instructionStep, setInstructionStep] = useState(0);
  const [instructionsAccepted, setInstructionsAccepted] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(Date.now());
  const activeQuestionTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchExam();
    
    // Check if opened in another tab
    const tabKey = `exam_running_${id}`;
    if (localStorage.getItem(tabKey)) {
      alert("Exam is already running in another tab. If this is a mistake, please clear browser data.");
      navigate('/competitive-exams');
      return;
    }
    localStorage.setItem(tabKey, 'true');

    return () => {
      exitFullScreen();
      removeAntiCheat();
      localStorage.removeItem(tabKey);
      if (timerRef.current) clearInterval(timerRef.current);
      if (activeQuestionTimerRef.current) clearInterval(activeQuestionTimerRef.current);
    };
  }, [id]);

  const fetchExam = async () => {
    try {
      const res = await api.get(`/api/competitive-exams/${id}/student`);
      const examData = res.data.data || res.data;
      setExam(examData);
      
      setTimeLeft((examData.duration || 180) * 60);
      
      const initStatuses: any = {};
      (examData.questions || []).forEach((q: any) => initStatuses[q.id] = 'not_visited');
      if (examData.questions && examData.questions.length > 0) {
        initStatuses[examData.questions[0].id] = 'not_answered';
      }
      setQuestionStatuses(initStatuses);
    } catch (err) {
      alert('Failed to load exam or unauthorized.');
      navigate('/competitive-exams');
    } finally {
      setLoading(false);
    }
  };

  const startExamRun = () => {
    if (!instructionsAccepted) return;
    setInstructionStep(2);
    enterFullScreen();
    setupAntiCheat();
    startTimers();
  };

  const startTimers = () => {
    startTimeRef.current = Date.now();
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

    activeQuestionTimerRef.current = setInterval(() => {
      setAnswers(prev => {
        if (!exam || !exam.questions[currentQuestionIndex]) return prev;
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
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
  };

  const removeAntiCheat = () => {
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    window.removeEventListener('blur', handleWindowBlur);
  };

  const handleVisibilityChange = () => {
    if (document.visibilityState === 'hidden') triggerWarning();
  };

  const handleWindowBlur = () => {
    triggerWarning();
  };

  const triggerWarning = () => {
    if (isSubmitting || instructionStep < 2) return;
    setWarnings(w => {
      const newWarnings = w + 1;
      if (newWarnings >= 3) {
        alert("Maximum tab switches reached. Exam auto-submitting for suspicious activity.");
        autoSubmit();
      } else {
        alert(`WARNING: You have switched tabs or lost window focus. Attempt ${newWarnings}/3. Exam will be auto-submitted if you continue.`);
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
    } catch (e) {}
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
      selectedOption: data.option,
      timeTakenSeconds: data.timeSpent
    }));

    const totalTimeTaken = Math.floor((Date.now() - startTimeRef.current) / 1000);

    try {
      await api.post(`/api/competitive-exams/${id}/submit`, {
        answers: formattedAnswers,
        totalTimeTaken
      });
      
      alert("Exam submitted successfully!");
      localStorage.removeItem(`exam_running_${id}`);
      exitFullScreen();
      navigate(`/competitive-exam-result/${id}`, { replace: true });
    } catch (error) {
      alert("Failed to submit exam. Please contact admin.");
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

    moveToNextQuestion();
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

  const handleSaveAndMarkForReview = () => {
    const qId = exam.questions[currentQuestionIndex].id;
    const hasAnswered = !!answers[qId]?.option;
    
    setQuestionStatuses(prev => ({
      ...prev,
      [qId]: hasAnswered ? 'answered_marked_review' : 'marked_review'
    }));
    moveToNextQuestion();
  };

  const handleMarkForReviewAndNext = () => {
    const qId = exam.questions[currentQuestionIndex].id;
    const hasAnswered = !!answers[qId]?.option;
    
    setQuestionStatuses(prev => ({
      ...prev,
      [qId]: hasAnswered ? 'answered_marked_review' : 'marked_review'
    }));
    moveToNextQuestion();
  };

  const moveToNextQuestion = () => {
    if (currentQuestionIndex < exam.questions.length - 1) {
      const nextIndex = currentQuestionIndex + 1;
      setCurrentQuestionIndex(nextIndex);
      const nextQId = exam.questions[nextIndex].id;
      setQuestionStatuses(prev => ({
        ...prev,
        [nextQId]: prev[nextQId] === 'not_visited' ? 'not_answered' : prev[nextQId]
      }));
    }
  };

  const moveToPrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      const prevIndex = currentQuestionIndex - 1;
      setCurrentQuestionIndex(prevIndex);
      const prevQId = exam.questions[prevIndex].id;
      setQuestionStatuses(prev => ({
        ...prev,
        [prevQId]: prev[prevQId] === 'not_visited' ? 'not_answered' : prev[prevQId]
      }));
    }
  };

  const navigateToQuestion = (index: number) => {
    const currentQId = exam.questions[currentQuestionIndex].id;
    if (questionStatuses[currentQId] === 'not_visited') {
      setQuestionStatuses(prev => ({ ...prev, [currentQId]: 'not_answered' }));
    }
    
    setCurrentQuestionIndex(index);
    const targetQId = exam.questions[index].id;
    setQuestionStatuses(prev => ({
      ...prev,
      [targetQId]: prev[targetQId] === 'not_visited' ? 'not_answered' : prev[targetQId]
    }));
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (loading || !exam) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50"><div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full"></div></div>;
  }

  // Calculate palette counts
  const counts = {
    not_visited: 0,
    not_answered: 0,
    answered: 0,
    marked_review: 0,
    answered_marked_review: 0
  };
  Object.values(questionStatuses).forEach(status => {
    if (counts[status] !== undefined) counts[status]++;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'not_visited': return 'bg-[#E2E8F0] text-slate-700 border-slate-300';
      case 'not_answered': return 'bg-[#ef4444] text-white border-red-600'; // Red
      case 'answered': return 'bg-[#22c55e] text-white border-green-600'; // Green
      case 'marked_review': return 'bg-[#8b5cf6] text-white border-purple-600'; // Purple
      case 'answered_marked_review': return 'bg-[#8b5cf6] text-white border-purple-600 relative after:content-[""] after:absolute after:-bottom-1 after:-right-1 after:w-3 after:h-3 after:bg-green-500 after:rounded-full after:border after:border-white'; // Purple with small green dot
      default: return 'bg-[#E2E8F0] text-slate-700 border-slate-300';
    }
  };

  // -----------------------------------------------------
  // STEP 0: INSTRUCTIONS PAGE 1
  // -----------------------------------------------------
  if (instructionStep === 0) {
    return (
      <div className="min-h-screen bg-white flex flex-col font-sans">
        <header className="flex items-center justify-between p-4 border-b shadow-sm">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-blue-600 text-white rounded-md flex items-center justify-center font-bold text-xl">JY</div>
             <h1 className="text-xl font-bold text-gray-800">JY School eConnect</h1>
          </div>
          <div className="text-xl font-semibold text-gray-700">{exam.title}</div>
          <select className="border p-2 rounded bg-white text-sm">
            <option>English</option>
          </select>
        </header>

        <div className="flex-1 overflow-auto p-6 md:p-10 max-w-5xl mx-auto w-full">
          <div className="text-center mb-8 border-b-2 border-red-500 inline-block mx-auto pb-1">
             <h2 className="text-2xl font-bold text-gray-800">Read following instructions carefully.</h2>
          </div>

          <h3 className="font-bold text-lg mb-4 underline">General Instructions:</h3>
          <ol className="list-decimal pl-6 space-y-4 text-sm text-gray-700">
            <li>Total time available for this test will be displayed on the next screen.</li>
            <li>The clock has been set at the server and the countdown timer at the top right corner of your screen will display the time remaining for you to complete the exam. When the clock runs out the exam ends by default. you are not required to end or submit your exam.</li>
            <li>The question palette at the right of screen shows one of the following statuses of each of the questions numbered:</li>
          </ol>

          <div className="mt-8 space-y-4 ml-4">
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 flex items-center justify-center border border-gray-300 bg-gray-200 font-bold">1</div>
              <span className="text-sm">You have not visited the question yet.</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 flex items-center justify-center border border-red-700 bg-red-500 text-white font-bold" style={{ clipPath: 'polygon(0% 0%, 100% 0%, 100% 75%, 75% 100%, 0% 100%)' }}>2</div>
              <span className="text-sm">You have not answered the question.</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 flex items-center justify-center border border-green-700 bg-green-500 text-white font-bold" style={{ clipPath: 'polygon(0% 25%, 25% 0%, 100% 0%, 100% 100%, 0% 100%)' }}>3</div>
              <span className="text-sm">You have answered the question.</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 flex items-center justify-center border border-purple-700 bg-purple-500 text-white font-bold rounded-full">4</div>
              <span className="text-sm">You have NOT answered the question but have marked the question for review.</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 flex items-center justify-center border border-purple-700 bg-purple-500 text-white font-bold rounded-full relative">
                5
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border border-white"></div>
              </div>
              <span className="text-sm">You have answered the question but marked it for review.</span>
            </div>
          </div>

          <p className="mt-8 text-sm text-gray-700">The Marked for Review status simply acts as a reminder that you have set to look at the question again. If an answer is selected for a question that is Marked for Review, the answer will be considered in the final evaluation.</p>
        </div>

        <div className="p-4 border-t bg-gray-50 flex justify-center">
          <button 
            onClick={() => setInstructionStep(1)} 
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-12 rounded-full text-lg shadow-md transition-all flex items-center gap-2"
          >
            Next <span>&raquo;</span>
          </button>
        </div>
      </div>
    );
  }

  // -----------------------------------------------------
  // STEP 1: INSTRUCTIONS PAGE 2
  // -----------------------------------------------------
  if (instructionStep === 1) {
    return (
      <div className="min-h-screen bg-white flex flex-col font-sans">
        <header className="flex items-center justify-between p-4 border-b shadow-sm">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-blue-600 text-white rounded-md flex items-center justify-center font-bold text-xl">JY</div>
             <h1 className="text-xl font-bold text-gray-800">JY School eConnect</h1>
          </div>
          <div className="text-xl font-semibold text-gray-700">{exam.title}</div>
          <select className="border p-2 rounded bg-white text-sm">
            <option>English</option>
          </select>
        </header>

        <div className="flex-1 overflow-auto p-6 md:p-10 max-w-5xl mx-auto w-full">
          <div className="text-center mb-8 border-b-2 border-red-500 inline-block mx-auto pb-1">
             <h2 className="text-2xl font-bold text-gray-800">General Instructions</h2>
          </div>

          <ol className="list-decimal pl-6 space-y-3 text-sm text-gray-700 font-medium">
            <li>This test contains <span className="font-bold">{exam.questions?.length || 0} questions</span>.</li>
            <li>Total duration of the test is <span className="font-bold">{exam.duration} minutes</span>.</li>
            <li>You will earn <span className="font-bold">{exam.marksPerQuestion} mark</span> for every question answered correctly.</li>
            <li><span className="font-bold">{exam.negativeMarks} marks</span> will be deducted for indicating incorrect response for each question.</li>
            <li>No deduction from the total score will be made if no response is indicated.</li>
            <li>The countdown timer at the top right corner of screen will display the remaining time available for you to complete the examination. When the timer reaches zero, the examination will end by itself.</li>
            <li>Use a scribble pad for any rough work.</li>
            <li>You are not allowed to use a calculator.</li>
          </ol>
        </div>

        <div className="p-6 border-t bg-gray-50 flex flex-col items-center gap-4">
          <label className="flex items-center gap-3 cursor-pointer text-sm font-bold text-gray-700">
            <input 
              type="checkbox" 
              className="w-5 h-5 cursor-pointer accent-blue-600"
              checked={instructionsAccepted}
              onChange={(e) => setInstructionsAccepted(e.target.checked)}
            />
            I have read and understood the instructions
          </label>
          
          <button 
            onClick={startExamRun} 
            disabled={!instructionsAccepted}
            className={`py-3 px-16 rounded-full text-lg shadow-md transition-all font-bold flex items-center gap-2 ${
              instructionsAccepted 
                ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer' 
                : 'bg-blue-300 text-blue-100 cursor-not-allowed'
            }`}
          >
            Start Test <span>&raquo;</span>
          </button>
        </div>
      </div>
    );
  }

  // -----------------------------------------------------
  // STEP 2: EXAM RUNNING ENGINE (NTA STYLE)
  // -----------------------------------------------------
  const currentQuestion = exam.questions[currentQuestionIndex];
  const qId = currentQuestion?.id;
  const currentAnswer = answers[qId]?.option || '';

  return (
    <div className="h-screen w-full bg-white flex flex-col font-sans overflow-hidden select-none">
      {/* Top Header - White */}
      <header className="flex items-center justify-between px-6 py-2 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 text-white rounded-md flex items-center justify-center font-bold text-xl">JY</div>
          <h1 className="text-xl font-bold text-gray-800">JY School eConnect</h1>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-600">Subject</span>
            <select className="border border-gray-300 rounded p-1 text-sm bg-gray-50 w-32 outline-none">
              <option>All Subjects</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-600">Language</span>
            <select className="border border-gray-300 rounded p-1 text-sm bg-gray-50 outline-none">
              <option>English</option>
            </select>
          </div>
        </div>
      </header>

      {/* Sub Header - Light Gray */}
      <div className="bg-gray-100 px-6 py-2 border-b border-gray-200 flex justify-between items-center text-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white rounded-md border border-gray-300 flex items-center justify-center text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <div className="leading-tight">
            <div><span className="font-semibold text-gray-600">Name : </span><span className="font-bold text-[#f97316]">{user?.name}</span></div>
            <div><span className="font-semibold text-gray-600">Exam : </span><span className="font-bold text-[#f97316]">{exam.title}</span></div>
            <div><span className="font-semibold text-gray-600">Time : </span><span className="font-bold text-blue-600 text-base">{formatTime(timeLeft)}</span></div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Side: Question Area */}
        <div className="flex-1 flex flex-col border-r border-gray-200">
          {/* Question Header */}
          <div className="px-6 py-3 border-b border-gray-200 flex justify-between items-center bg-gray-50">
            <div className="font-bold text-lg text-gray-800 flex items-center gap-2">
              Q. {(currentQuestionIndex + 1).toString().padStart(2, '0')} of {exam.questions.length.toString().padStart(2, '0')}
              <span className="text-red-500 cursor-pointer" title="Report Issue"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 6a3 3 0 013-3h10a1 1 0 01.8 1.6L14.25 8l2.55 3.4A1 1 0 0116 13H6a1 1 0 00-1 1v3a1 1 0 11-2 0V6z" clipRule="evenodd" /></svg></span>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="bg-green-600 text-white text-xs font-bold px-2 py-1 rounded">Single Select Question</div>
              <div className="flex items-center gap-1 text-sm font-bold">
                <span className="text-gray-600">Marks:</span>
                <span className="bg-green-600 text-white px-1.5 py-0.5 rounded">+{exam.marksPerQuestion}</span>
                <span className="bg-red-600 text-white px-1.5 py-0.5 rounded">-{exam.negativeMarks}</span>
              </div>
              <div className="bg-[#6b21a8] text-white text-xs font-bold px-3 py-1 rounded">
                Time : {formatTime(answers[qId]?.timeSpent || 0)}
              </div>
            </div>
          </div>

          {/* Question Content */}
          <div className="flex-1 overflow-auto p-8 relative">
            <div className="text-base font-medium text-gray-800 mb-8 leading-relaxed whitespace-pre-wrap">
              {currentQuestion?.questionText}
              
              {currentQuestion?.imageUrl && (
                <div className="mt-4">
                  <img src={currentQuestion.imageUrl} alt="Question" className="max-w-full h-auto max-h-80 border" />
                </div>
              )}
            </div>

            <div className="space-y-4">
              {['A', 'B', 'C', 'D'].map((optKey) => {
                const optVal = currentQuestion?.[`option${optKey}`];
                if (!optVal) return null;
                const isSelected = currentAnswer === optKey;
                
                return (
                  <div 
                    key={optKey} 
                    onClick={() => handleOptionSelect(qId, optKey)}
                    className={`flex items-center gap-4 p-4 rounded-md border-2 cursor-pointer transition-all ${
                      isSelected 
                        ? 'border-blue-500 bg-blue-50/30' 
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                      isSelected ? 'bg-blue-600 text-white' : 'bg-gray-700 text-white'
                    }`}>
                      {optKey}
                    </div>
                    <div className="flex-1 text-gray-700 font-medium">{optVal}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="border-t border-gray-200 bg-white p-4">
            <div className="flex justify-between items-center mb-4">
              <div className="flex gap-2">
                <button onClick={handleSaveAndNext} className="bg-green-600 hover:bg-green-700 text-white font-bold text-xs px-4 py-2 rounded shadow-sm border border-green-700 uppercase tracking-wide">Save & Next</button>
                <button onClick={handleClearResponse} className="bg-white hover:bg-gray-50 text-gray-700 font-bold text-xs px-4 py-2 rounded shadow-sm border border-gray-300 uppercase tracking-wide">Clear</button>
                <button onClick={handleSaveAndMarkForReview} className="bg-[#f97316] hover:bg-orange-600 text-white font-bold text-xs px-4 py-2 rounded shadow-sm border border-orange-600 uppercase tracking-wide">Save & Mark For Review</button>
                <button onClick={handleMarkForReviewAndNext} className="bg-[#6b21a8] hover:bg-purple-800 text-white font-bold text-xs px-4 py-2 rounded shadow-sm border border-purple-800 uppercase tracking-wide">Mark For Review & Next</button>
              </div>
            </div>
            <div className="flex justify-between items-center border-t pt-4">
              <div className="flex gap-2">
                <button onClick={moveToPrevQuestion} disabled={currentQuestionIndex === 0} className="bg-white disabled:opacity-50 text-gray-700 font-bold text-sm px-4 py-1.5 rounded border border-gray-300">&lt;&lt; BACK</button>
                <button onClick={moveToNextQuestion} disabled={currentQuestionIndex === exam.questions.length - 1} className="bg-white disabled:opacity-50 text-gray-700 font-bold text-sm px-4 py-1.5 rounded border border-gray-300">NEXT &gt;&gt;</button>
              </div>
              <div className="flex gap-2">
                <button className="bg-[#0ea5e9] hover:bg-sky-600 text-white font-bold text-sm px-6 py-2 rounded uppercase tracking-wide">Questions</button>
                <button className="bg-[#f97316] hover:bg-orange-600 text-white font-bold text-sm px-6 py-2 rounded uppercase tracking-wide">Pause</button>
                <button onClick={() => setShowSubmitModal(true)} className="bg-green-600 hover:bg-green-700 text-white font-bold text-sm px-6 py-2 rounded uppercase tracking-wide">Submit</button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Question Palette */}
        <div className="w-[340px] bg-white flex flex-col overflow-hidden">
          {/* Palette Legend */}
          <div className="p-4 border-b border-gray-200">
            <div className="border border-dashed border-gray-400 p-3 bg-gray-50 text-xs">
              <div className="grid grid-cols-2 gap-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 flex items-center justify-center border border-gray-300 bg-gray-200 font-bold">{counts.not_visited}</div>
                  <span>Not Visited</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 flex items-center justify-center border border-red-700 bg-red-500 text-white font-bold" style={{ clipPath: 'polygon(0% 0%, 100% 0%, 100% 75%, 75% 100%, 0% 100%)' }}>{counts.not_answered}</div>
                  <span>Not Answered</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 flex items-center justify-center border border-green-700 bg-green-500 text-white font-bold" style={{ clipPath: 'polygon(0% 25%, 25% 0%, 100% 0%, 100% 100%, 0% 100%)' }}>{counts.answered}</div>
                  <span>Answered</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 flex items-center justify-center border border-purple-700 bg-purple-500 text-white font-bold rounded-full">{counts.marked_review}</div>
                  <span>Marked for Review</span>
                </div>
                <div className="flex items-center gap-2 col-span-2">
                  <div className="w-7 h-7 flex items-center justify-center border border-purple-700 bg-purple-500 text-white font-bold rounded-full relative">
                    {counts.answered_marked_review}
                    <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 bg-green-500 rounded-full border border-white"></div>
                  </div>
                  <span>Answered & Marked for Review</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-blue-600 text-white text-xs font-bold p-2">Science</div>

          {/* Palette Grid */}
          <div className="flex-1 overflow-auto p-4">
            <div className="grid grid-cols-5 gap-3">
              {exam.questions.map((q: any, index: number) => {
                const status = questionStatuses[q.id] || 'not_visited';
                let style = {};
                let classes = "w-10 h-10 flex items-center justify-center font-bold text-sm cursor-pointer hover:opacity-80 ";
                
                if (status === 'not_visited') {
                  classes += "border border-gray-300 bg-gray-200 text-gray-700";
                } else if (status === 'not_answered') {
                  classes += "border border-red-700 bg-red-500 text-white";
                  style = { clipPath: 'polygon(0% 0%, 100% 0%, 100% 75%, 75% 100%, 0% 100%)' };
                } else if (status === 'answered') {
                  classes += "border border-green-700 bg-green-500 text-white";
                  style = { clipPath: 'polygon(0% 25%, 25% 0%, 100% 0%, 100% 100%, 0% 100%)' };
                } else if (status === 'marked_review') {
                  classes += "border border-purple-700 bg-purple-500 text-white rounded-full";
                } else if (status === 'answered_marked_review') {
                  classes += "border border-purple-700 bg-purple-500 text-white rounded-full relative";
                }

                return (
                  <div key={q.id} className="relative flex justify-center">
                    <div 
                      onClick={() => navigateToQuestion(index)}
                      className={classes}
                      style={style}
                    >
                      {index + 1}
                    </div>
                    {status === 'answered_marked_review' && (
                      <div className="absolute bottom-0 right-1 w-3 h-3 bg-green-500 rounded-full border border-white z-10 pointer-events-none"></div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Submit Confirmation Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in-up">
            <div className="bg-indigo-600 px-6 py-4 flex items-center gap-3">
              <ShieldAlert className="w-6 h-6 text-white" />
              <h2 className="text-xl font-bold text-white">Submit Exam?</h2>
            </div>
            
            <div className="p-6">
              <p className="text-slate-600 mb-6">Are you sure you want to submit the exam? You cannot change your answers after submission.</p>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-center">
                  <div className="text-2xl font-black text-slate-800">{counts.answered + counts.answered_marked_review}</div>
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Answered</div>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-center">
                  <div className="text-2xl font-black text-slate-800">{exam.questions.length - (counts.answered + counts.answered_marked_review)}</div>
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pending</div>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button 
                  onClick={() => setShowSubmitModal(false)}
                  className="px-5 py-2.5 rounded-lg font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => handleSubmit(true)}
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-lg font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors flex items-center gap-2"
                >
                  {isSubmitting ? 'Submitting...' : 'Confirm Submission'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TakeCompetitiveExamPage;
