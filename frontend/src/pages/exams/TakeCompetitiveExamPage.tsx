import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { Clock, AlertTriangle, ShieldAlert } from 'lucide-react';

const TakeCompetitiveExamPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [exam, setExam] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState(0);
  
  const [answers, setAnswers] = useState<Record<string, { option: string, timeSpent: number }>>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [questionStatuses, setQuestionStatuses] = useState<Record<string, 'not_visited' | 'not_answered' | 'answered' | 'marked_review' | 'answered_marked_review'>>({});
  
  const [warnings, setWarnings] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(Date.now());
  const activeQuestionTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchExam();
    enterFullScreen();
    setupAntiCheat();
    
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
      const examData = res.data.data;
      setExam(examData);
      
      // Calculate remaining time synced with server end time ideally.
      // For simplicity here, we use duration in seconds
      setTimeLeft(examData.duration * 60);
      
      // Init statuses
      const initStatuses: any = {};
      examData.questions.forEach((q: any) => initStatuses[q.id] = 'not_visited');
      if (examData.questions.length > 0) {
        initStatuses[examData.questions[0].id] = 'not_answered';
      }
      setQuestionStatuses(initStatuses);
      
      startTimers();
    } catch (err) {
      alert('Failed to load exam or unauthorized.');
      navigate('/competitive-exams');
    } finally {
      setLoading(false);
    }
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
    if (document.visibilityState === 'hidden') {
      triggerWarning();
    }
  };

  const handleWindowBlur = () => {
    triggerWarning();
  };

  const triggerWarning = () => {
    if (isSubmitting) return;
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
    if (!force) {
      const confirm = window.confirm("Are you sure you want to submit the exam?");
      if (!confirm) return;
    }
    
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
      navigate('/competitive-exams');
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
    return <div className="min-h-screen bg-gray-100 flex items-center justify-center">Loading Exam Environment...</div>;
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

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans select-none" style={{ height: '100vh', overflow: 'hidden' }}>
      {/* Header */}
      <header className="bg-indigo-900 text-white p-3 flex justify-between items-center shadow-md shrink-0">
        <h1 className="text-xl font-bold">{exam.title}</h1>
        <div className="flex items-center gap-6">
          {warnings > 0 && (
            <div className="flex items-center gap-2 text-yellow-300 font-bold bg-red-900/30 px-3 py-1 rounded">
              <ShieldAlert size={18} /> Warnings: {warnings}/3
            </div>
          )}
          <div className="flex items-center gap-2 bg-indigo-800 px-4 py-1.5 rounded-lg border border-indigo-700">
            <Clock size={20} className={timeLeft < 300 ? 'text-red-400 animate-pulse' : 'text-indigo-300'} />
            <span className={`text-xl font-mono font-bold ${timeLeft < 300 ? 'text-red-400' : 'text-white'}`}>
              {formatTime(timeLeft)}
            </span>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Area: Question */}
        <div className="flex-1 flex flex-col border-r border-gray-300 overflow-hidden">
          <div className="bg-gray-100 p-3 border-b border-gray-300 flex justify-between items-center font-bold text-gray-700">
            <span>Question No. {currentQuestionIndex + 1}</span>
            <span className="text-sm text-gray-500 font-normal">Marks: +{currentQuestion.marks} / -{exam.negativeMarks}</span>
          </div>
          
          <div className="flex-1 overflow-y-auto p-8">
            <div className="text-lg font-medium text-gray-800 mb-6 whitespace-pre-wrap">
              {currentQuestion.questionText}
            </div>
            
            {currentQuestion.imageUrl && (
              <div className="mb-8 p-4 bg-white border border-gray-200 rounded-lg inline-block">
                <img src={currentQuestion.imageUrl} alt="Question Graphic" className="max-w-full max-h-80 object-contain" />
              </div>
            )}
            
            <div className="space-y-4">
              {currentQuestion.options.map((opt: string, idx: number) => {
                const isSelected = answers[qId]?.option === opt;
                return (
                  <label key={idx} className={`flex items-start p-4 border rounded-lg cursor-pointer transition-colors ${isSelected ? 'bg-indigo-50 border-indigo-500' : 'hover:bg-gray-50 border-gray-300'}`}>
                    <div className="flex items-center h-6">
                      <input
                        type="radio"
                        name={`question-${qId}`}
                        checked={isSelected}
                        onChange={() => handleOptionSelect(qId, opt)}
                        className="w-5 h-5 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                      />
                    </div>
                    <div className="ml-3">
                      <span className="text-gray-700 text-base">{opt}</span>
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
            <h3 className="font-bold text-gray-700 mb-3">{exam.subject.name}</h3>
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
              onClick={() => handleSubmit()}
              disabled={isSubmitting}
              className="w-full py-3 bg-green-600 text-white rounded font-bold text-lg hover:bg-green-700 shadow-md flex items-center justify-center gap-2"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Exam'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TakeCompetitiveExamPage;
