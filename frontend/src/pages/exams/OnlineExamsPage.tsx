import React, { useState, useEffect } from 'react';
import { PlusCircle, RefreshCw, Edit, Clock, Award, HelpCircle, Users, BookOpen, Send, CheckCircle2, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import CreateOnlineExamModal from './CreateOnlineExamModal';
import api from '../../api/axios';

interface OnlineExam {
  id: string;
  title: string;
  duration: number;
  startTime: string;
  endTime: string;
  totalMarks: number;
  passMarks: number;
  isPublished: boolean;
  class: { name: string; section: string };
  subject: { name: string };
  _count: { questions: number; submissions: number };
}

const OnlineExamsPage = () => {
  const [exams, setExams] = useState<OnlineExam[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const navigate = useNavigate();

  const fetchExams = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/online-exams/admin');
      if (res.data && Array.isArray(res.data)) {
        setExams(res.data);
      } else if (res.data?.data) {
        setExams(res.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch online exams', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExams();
  }, []);

  const handlePublish = async (id: string) => {
    try {
      await api.put(`/api/online-exams/${id}/publish`);
      fetchExams();
    } catch (error) {
      console.error('Failed to publish', error);
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 bg-[#F8FAFC] min-h-screen">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 tracking-tight">Online Quizzes</h1>
          <p className="text-slate-500 mt-1.5 text-sm md:text-base">Create and manage dynamic online quizzes and assignments.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={fetchExams}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 text-slate-700 bg-white rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all duration-200 shadow-sm disabled:opacity-50 font-medium text-sm"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl hover:from-indigo-700 hover:to-violet-700 transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 font-medium text-sm"
          >
            <PlusCircle className="h-4 w-4" />
            Create Exam
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div>
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <RefreshCw className="h-10 w-10 animate-spin text-indigo-600 mb-4" />
            <p className="text-slate-500 font-medium">Loading your exams...</p>
          </div>
        ) : exams.length === 0 ? (
          <div className="text-center py-20 px-4 bg-white border border-slate-200 border-dashed rounded-3xl shadow-sm">
            <div className="h-20 w-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-5 shadow-inner">
              <FileText className="h-10 w-10 text-indigo-600" />
            </div>
            <h3 className="text-2xl font-bold text-slate-800 mb-3">No Exams Created Yet</h3>
            <p className="text-slate-500 mb-8 max-w-md mx-auto">Get started by creating your first online quiz or examination for your students.</p>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors shadow-md hover:shadow-lg font-semibold inline-flex items-center gap-2"
            >
              <PlusCircle className="h-5 w-5" />
              Create Your First Exam
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {exams.map((exam) => (
              <div
                key={exam.id}
                className="group bg-white rounded-3xl border border-slate-100 overflow-hidden hover:shadow-xl hover:border-indigo-100 transition-all duration-300 transform hover:-translate-y-1 flex flex-col"
              >
                {/* Status Bar */}
                <div className={`h-1.5 w-full ${exam.isPublished ? 'bg-emerald-500' : 'bg-amber-400'}`} />
                
                <div className="p-6 flex-1 flex flex-col">
                  {/* Header */}
                  <div className="flex justify-between items-start mb-5">
                    <div className="flex gap-4 items-start">
                      <div className="h-12 w-12 rounded-2xl bg-indigo-50 flex items-center justify-center shrink-0 border border-indigo-100/50 group-hover:bg-indigo-100 transition-colors">
                        <BookOpen className="h-6 w-6 text-indigo-600" />
                      </div>
                      <div className="flex-1 min-w-0 mt-0.5">
                        <h3 className="font-bold text-lg text-slate-800 truncate" title={exam.title}>
                          {exam.title}
                        </h3>
                        <div className="flex items-center gap-2 mt-1.5 text-xs font-medium text-slate-500">
                          <span className="bg-slate-100 px-2.5 py-0.5 rounded-md text-slate-600">{exam.class.name} {exam.class.section}</span>
                          <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                          <span className="truncate">{exam.subject.name}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="mb-6">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                        exam.isPublished
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${exam.isPublished ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                      {exam.isPublished ? 'Published & Live' : 'Draft Mode'}
                    </span>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-4 mb-6 mt-auto">
                    <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 group-hover:bg-indigo-50/50 transition-colors border border-transparent group-hover:border-indigo-50">
                      <div className="p-2 rounded-xl bg-white shadow-sm text-blue-500"><Clock className="h-4 w-4" /></div>
                      <div>
                        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Duration</p>
                        <p className="font-bold text-slate-700 text-sm">{exam.duration}m</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 group-hover:bg-indigo-50/50 transition-colors border border-transparent group-hover:border-indigo-50">
                      <div className="p-2 rounded-xl bg-white shadow-sm text-amber-500"><Award className="h-4 w-4" /></div>
                      <div>
                        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Marks</p>
                        <p className="font-bold text-slate-700 text-sm">{exam.totalMarks}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 group-hover:bg-indigo-50/50 transition-colors border border-transparent group-hover:border-indigo-50">
                      <div className="p-2 rounded-xl bg-white shadow-sm text-purple-500"><HelpCircle className="h-4 w-4" /></div>
                      <div>
                        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Questions</p>
                        <p className="font-bold text-slate-700 text-sm">{exam._count.questions}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 group-hover:bg-indigo-50/50 transition-colors border border-transparent group-hover:border-indigo-50">
                      <div className="p-2 rounded-xl bg-white shadow-sm text-emerald-500"><Users className="h-4 w-4" /></div>
                      <div>
                        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Attempts</p>
                        <p className="font-bold text-slate-700 text-sm">{exam._count.submissions}</p>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-4 border-t border-slate-100">
                    <button
                      onClick={() => navigate(`/online-exams/${exam.id}/manage`)}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 border-2 border-slate-100 text-slate-600 bg-white rounded-xl hover:bg-slate-50 hover:border-slate-200 hover:text-slate-800 transition-all text-sm font-bold"
                    >
                      <Edit className="h-4 w-4" /> Manage
                    </button>
                    {!exam.isPublished ? (
                      <button
                        onClick={() => handlePublish(exam.id)}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-all shadow-sm hover:shadow text-sm font-bold"
                      >
                        <Send className="h-4 w-4" /> Publish
                      </button>
                    ) : (
                      <div className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-xl cursor-default text-sm font-bold">
                        <CheckCircle2 className="h-4 w-4" /> Live
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <CreateOnlineExamModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          setIsCreateModalOpen(false);
          fetchExams();
        }}
      />
    </div>
  );
};

export default OnlineExamsPage;
