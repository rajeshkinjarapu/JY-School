import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Database, Filter, Plus, FileText, Search, Activity, BookOpen, Layers, Target, ChevronLeft, RefreshCw, FileQuestion, Sparkles } from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';

export const CompetitiveQuestionBankDashboard = () => {
  const navigate = useNavigate();
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchExams = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/competitive-exams/admin');
      setExams(res.data?.data || []);
    } catch (e) {
      console.error(e);
      toast.error('Failed to load exams');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExams();
  }, []);

  const totalQuestions = exams.reduce((acc, e) => acc + (e._count?.questions || e.questions?.length || 0), 0);
  const totalSubmissions = exams.reduce((acc, e) => acc + (e._count?.submissions || e.submissions?.length || 0), 0);

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      <button onClick={() => navigate('/competitive-exams')} className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-bold mb-4 cursor-pointer">
        <ChevronLeft size={20} /> Back to Competitive Exams
      </button>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 md:p-8 rounded-3xl text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-2xl md:text-3xl font-extrabold flex items-center gap-3">
             <Database className="text-cyan-400" /> QUESTION BANK REPOSITORY
          </h1>
          <p className="text-indigo-200 mt-1 text-sm">JEE Mains, NEET UG & Navodaya Competitive Question Banks</p>
        </div>
        <div className="flex items-center gap-3 relative z-10">
          <button 
            onClick={() => navigate('/competitive-question-bank/new')} 
            className="px-5 py-3 bg-white text-indigo-900 rounded-xl font-extrabold text-sm shadow-md hover:bg-indigo-50 flex items-center gap-2 transition cursor-pointer"
          >
            <Plus size={18} /> Add Question
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-center">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total Exams</p>
          <h3 className="text-3xl font-black text-slate-800">{exams.length}</h3>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-center">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total Questions</p>
          <h3 className="text-3xl font-black text-indigo-600">{totalQuestions}</h3>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-center">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Student Attempts</p>
          <h3 className="text-3xl font-black text-emerald-600">{totalSubmissions}</h3>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-center">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Live Tests</p>
          <h3 className="text-3xl font-black text-purple-600">{exams.filter(e => e.isPublished).length}</h3>
        </div>
      </div>

      {/* Exam Question Banks Grid */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-black text-slate-800">Available Exam Question Repositories</h3>
          <button 
            onClick={() => navigate('/competitive-exams')} 
            className="text-xs font-bold text-indigo-600 hover:underline"
          >
            Manage in Main Suite →
          </button>
        </div>

        {loading ? (
          <div className="p-12 flex justify-center items-center bg-white rounded-3xl border border-slate-100">
            <RefreshCw className="w-8 h-8 animate-spin text-indigo-600" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {exams.map(exam => {
              const qCount = exam._count?.questions || exam.questions?.length || 0;
              return (
                <div key={exam.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:border-indigo-300 transition flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-black uppercase text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md">
                      {exam.subject?.name || 'General Science'}
                    </span>
                    <h4 className="font-extrabold text-slate-900 text-base mt-2 line-clamp-1">{exam.title}</h4>
                    <p className="text-xs text-slate-400 mt-1">Class: {exam.class?.name || 'All'} • Duration: {exam.duration}m</p>
                  </div>

                  <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700"><b>{qCount}</b> Questions</span>
                    <button
                      onClick={() => navigate('/competitive-exams')}
                      className="text-xs font-black text-indigo-600 hover:text-indigo-800 cursor-pointer"
                    >
                      Open in Question Bank →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default CompetitiveQuestionBankDashboard;
