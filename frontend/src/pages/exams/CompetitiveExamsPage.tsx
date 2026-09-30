import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Play, Plus, Clock, FileText, CheckCircle, Lock, Edit, ShieldAlert, Award, FileQuestion, Users, RefreshCw, Trash2, BarChart3, BookOpen } from 'lucide-react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import CreateCompetitiveExamModal from './CreateCompetitiveExamModal';

const CompetitiveExamsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const isAdminOrTeacher = ['ADMIN', 'SUPER_ADMIN', 'TEACHER'].includes(user?.role || '');

  useEffect(() => {
    fetchExams();
  }, [user]);

  const fetchExams = async () => {
    try {
      setLoading(true);
      if (user?.role === 'STUDENT') {
        const res = await api.get('/api/competitive-exams/student');
        setExams(res.data.data || []);
      } else if (isAdminOrTeacher) {
        const res = await api.get('/api/competitive-exams/admin');
        setExams(res.data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch competitive exams', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartExam = (exam: any, hasSubmitted: boolean = false) => {
    if (hasSubmitted) {
      navigate(`/competitive-exam-result/${exam.id}`);
      return;
    }

    const now = new Date();
    const startTime = new Date(exam.startTime);
    const endTime = new Date(exam.endTime);

    if (now < startTime) {
      alert(`Exam starts at ${format(startTime, 'dd MMM yyyy, hh:mm a')}`);
      return;
    }
    if (now > endTime) {
      alert('Exam has already ended');
      return;
    }

    if (window.innerWidth < 1024) {
      alert('Please use a Desktop or Laptop for the best examination experience.');
    }

    navigate(`/take-competitive-exam/${exam.id}`);
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 bg-slate-50 min-h-screen">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 bg-gradient-to-br from-indigo-900 to-indigo-700 p-8 rounded-3xl shadow-2xl relative overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 rounded-full bg-white opacity-5 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-48 h-48 rounded-full bg-indigo-500 opacity-20 blur-2xl"></div>

        <div className="relative z-10">
          <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <Award className="h-8 w-8 text-yellow-400" />
            Competitive Exams (Mock Tests)
          </h1>
          <p className="text-indigo-200 mt-2 text-sm md:text-base font-medium">JEE / NEET Pattern Proctored Exams</p>
        </div>
        
        <div className="flex gap-3 relative z-10 w-full sm:w-auto">
          <button
            onClick={fetchExams}
            disabled={loading}
            className="flex-1 sm:flex-none flex justify-center items-center gap-2 px-5 py-3 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-all duration-200 backdrop-blur-md border border-white/20 shadow-lg disabled:opacity-50 font-medium"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          {isAdminOrTeacher && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex-1 sm:flex-none flex justify-center items-center gap-2 px-6 py-3 bg-white text-indigo-700 rounded-xl hover:bg-indigo-50 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 font-bold"
            >
              <Plus className="h-5 w-5 text-indigo-600" />
              Create Exam
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 bg-white rounded-3xl shadow-sm border border-slate-100">
          <div className="bg-indigo-50 p-4 rounded-full mb-4">
            <RefreshCw className="h-10 w-10 animate-spin text-indigo-600" />
          </div>
          <p className="text-slate-600 font-medium text-lg">Loading your mock tests...</p>
        </div>
      ) : exams.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 md:p-20 text-center shadow-lg border border-slate-100 flex flex-col items-center justify-center min-h-[500px]">
          <div className="bg-gradient-to-br from-indigo-100 to-purple-100 p-8 rounded-full mb-6 shadow-inner relative overflow-hidden">
             <div className="absolute top-0 right-0 w-full h-full bg-white opacity-20 transform translate-x-1/2 -translate-y-1/2 rotate-45"></div>
             <FileText className="h-20 w-20 text-indigo-600 relative z-10" />
          </div>
          <h2 className="text-3xl font-extrabold text-slate-800 mb-3 tracking-tight">No Exams Available</h2>
          <p className="text-slate-500 max-w-md mx-auto mb-10 text-lg">
            There are no mock tests scheduled currently. Check back later or create a new one to get started.
          </p>
          {isAdminOrTeacher && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 font-bold text-lg"
            >
              <Plus className="h-6 w-6" /> Create First Mock Test
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {exams.map((exam) => {
            const hasSubmitted = !!exam.submission;
            const isUpcoming = new Date() < new Date(exam.startTime);
            const isMissed = !hasSubmitted && new Date() > new Date(exam.endTime);

            return (
              <div key={exam.id} className="group bg-white rounded-3xl border border-slate-100 overflow-hidden hover:shadow-xl hover:border-blue-100 transition-all duration-300 transform hover:-translate-y-1 flex flex-col">
                <div className={`h-1.5 w-full ${hasSubmitted ? 'bg-emerald-500' : isUpcoming ? 'bg-amber-400' : isMissed ? 'bg-red-500' : 'bg-blue-600'}`}></div>
                
                <div className="p-6 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-5">
                    <div className="flex gap-4 items-start">
                      <div className={`h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 border transition-colors ${hasSubmitted ? 'bg-emerald-50 border-emerald-100' : isUpcoming ? 'bg-amber-50 border-amber-100' : isMissed ? 'bg-red-50 border-red-100' : 'bg-blue-50 border-blue-100'}`}>
                        {hasSubmitted ? <CheckCircle className="h-6 w-6 text-emerald-600" /> : isUpcoming ? <Lock className="h-6 w-6 text-amber-500" /> : <ShieldAlert className="h-6 w-6 text-blue-600" />}
                      </div>
                      <div className="flex-1 min-w-0 mt-0.5">
                        <h3 className="font-bold text-lg text-slate-800 line-clamp-1" title={exam.title}>{exam.title}</h3>
                        <div className="flex items-center gap-2 mt-1.5 text-xs font-medium text-slate-500">
                          <span className="bg-slate-100 px-2.5 py-0.5 rounded-md text-slate-600">{exam.subject?.name || 'General'}</span>
                          {exam.class && (
                            <>
                              <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                              <span>{exam.class.name}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-6 mt-auto">
                    <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-transparent">
                      <div className="p-2 rounded-xl bg-white shadow-sm text-blue-500"><Clock className="h-4 w-4" /></div>
                      <div>
                        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Duration</p>
                        <p className="font-bold text-slate-700 text-sm">{exam.duration}m</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-transparent">
                      <div className="p-2 rounded-xl bg-white shadow-sm text-amber-500"><Award className="h-4 w-4" /></div>
                      <div>
                        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Marks</p>
                        <p className="font-bold text-slate-700 text-sm">{exam.totalMarks}</p>
                      </div>
                    </div>
                    {isAdminOrTeacher && (
                      <>
                        <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-transparent">
                          <div className="p-2 rounded-xl bg-white shadow-sm text-purple-500"><FileQuestion className="h-4 w-4" /></div>
                          <div>
                            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Questions</p>
                            <p className="font-bold text-slate-700 text-sm">{exam._count?.questions || 0}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-transparent">
                          <div className="p-2 rounded-xl bg-white shadow-sm text-emerald-500"><Users className="h-4 w-4" /></div>
                          <div>
                            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Attempts</p>
                            <p className="font-bold text-slate-700 text-sm">{exam._count?.submissions || 0}</p>
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  <div className="mb-6 bg-slate-50 p-3 rounded-xl flex items-center justify-between text-sm">
                    <span className="text-slate-500 font-medium">Schedule:</span>
                    <span className="font-bold text-slate-700">{format(new Date(exam.startTime), 'dd MMM yyyy, hh:mm a')}</span>
                  </div>

                  <div className="mt-auto border-t border-slate-100 pt-4">
                    {user?.role === 'STUDENT' && (
                      <button
                        onClick={() => handleStartExam(exam, hasSubmitted)}
                        disabled={!hasSubmitted && isMissed}
                        className={`w-full py-3 rounded-xl flex items-center justify-center gap-2 font-bold transition-all shadow-sm ${
                          hasSubmitted 
                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100'
                            : isMissed
                            ? 'bg-red-50 text-red-600 border border-red-200 opacity-70 cursor-not-allowed'
                            : isUpcoming
                            ? 'bg-slate-100 text-slate-500 cursor-not-allowed border border-slate-200'
                            : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-md'
                        }`}
                      >
                        {hasSubmitted ? 'View Detailed Report' : isMissed ? 'Exam Missed' : isUpcoming ? 'Starts Soon' : 'Start Exam (Desktop)'}
                        {!hasSubmitted && !isMissed && !isUpcoming && <Play size={18} />}
                        {hasSubmitted && <BarChart3 size={18} />}
                      </button>
                    )}
                    
                    {isAdminOrTeacher && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => navigate(`/manage-competitive-questions/${exam.id}`)}
                          className="flex-1 py-3 bg-white border-2 border-slate-100 text-slate-700 rounded-xl hover:bg-slate-50 hover:border-slate-200 font-bold flex items-center justify-center gap-2 transition-all"
                        >
                          <Edit className="h-4 w-4" /> Manage
                        </button>
                        <button
                          onClick={() => navigate(`/competitive-exam-leaderboard/${exam.id}`)}
                          className="flex-1 py-3 bg-white border-2 border-indigo-100 text-indigo-700 rounded-xl hover:bg-indigo-50 hover:border-indigo-200 font-bold flex items-center justify-center gap-2 transition-all"
                        >
                          <Award className="h-4 w-4" /> Results
                        </button>
                        <button
                          onClick={async () => {
                            if(window.confirm('Delete this exam?')) {
                              await api.delete(`/api/competitive-exams/${exam.id}`);
                              fetchExams();
                            }
                          }}
                          className="p-3 bg-white border-2 border-red-100 text-red-600 rounded-xl hover:bg-red-50 hover:border-red-200 font-bold flex items-center justify-center transition-all"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showCreateModal && (
        <CreateCompetitiveExamModal onClose={() => { setShowCreateModal(false); fetchExams(); }} />
      )}
    </div>
  );
};

export default CompetitiveExamsPage;
