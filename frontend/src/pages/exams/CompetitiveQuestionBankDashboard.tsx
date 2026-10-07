import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Database, Filter, Plus, FileText, Search, Activity, BookOpen, Layers, Target, ArrowLeft } from 'lucide-react';
import { PageHeader } from '../../components/UI/PageHeader';
import api from '../../api/axios';

const CompetitiveQuestionBankDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  
  // Real stats state
  const [stats, setStats] = useState({
    total: 0,
    physics: 0,
    chemistry: 0,
    biology: 0,
    maths: 0,
  });

  const [difficultyStats, setDifficultyStats] = useState([
    { label: 'Easy', count: 0, color: 'bg-emerald-500' },
    { label: 'Medium', count: 0, color: 'bg-amber-500' },
    { label: 'Hard', count: 0, color: 'bg-orange-500' },
    { label: 'Very Hard', count: 0, color: 'bg-red-500' },
  ]);

  const questionTypes = [
    'Single Correct', 'Multiple Correct', 'Numerical',
    'Assertion & Reason', 'Match the Following', 'True / False'
  ];

  useEffect(() => {
    fetchRealData();
  }, []);

  const fetchRealData = async () => {
    try {
      setLoading(true);
      // Fetching all questions from the backend
      const res = await api.get('/api/question-bank/questions');
      const questions = res.data?.data || res.data || [];
      
      let phys = 0, chem = 0, bio = 0, maths = 0;
      let easy = 0, med = 0, hard = 0, vhard = 0;

      questions.forEach((q: any) => {
        // Group by subject
        const sub = (q.subject || '').toUpperCase();
        if (sub.includes('PHYSICS')) phys++;
        else if (sub.includes('CHEMISTRY')) chem++;
        else if (sub.includes('BIOLOGY') || sub.includes('BOTANY') || sub.includes('ZOOLOGY')) bio++;
        else if (sub.includes('MATH')) maths++;

        // Group by difficulty
        const diff = (q.difficulty || '').toUpperCase();
        if (diff === 'EASY') easy++;
        else if (diff === 'MEDIUM') med++;
        else if (diff === 'HARD') hard++;
        else if (diff === 'VERY HARD' || diff === 'VERY_HARD') vhard++;
        else med++; // default to medium
      });

      setStats({
        total: questions.length,
        physics: phys,
        chemistry: chem,
        biology: bio,
        maths: maths,
      });

      setDifficultyStats([
        { label: 'Easy', count: easy, color: 'bg-emerald-500' },
        { label: 'Medium', count: med, color: 'bg-amber-500' },
        { label: 'Hard', count: hard, color: 'bg-orange-500' },
        { label: 'Very Hard', count: vhard, color: 'bg-red-500' },
      ]);
    } catch (error) {
      console.error('Failed to fetch question bank stats:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 overflow-auto bg-slate-50/50" style={{ minHeight: 'calc(100vh - 64px)' }}>
      <PageHeader 
        title="Question Bank" 
        icon={<Database className="w-5 h-5 text-indigo-600" />}
        action={
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/competitive-exams')} className="flex items-center gap-2 px-4 py-2 bg-white text-slate-700 rounded-xl hover:bg-slate-50 transition-all border border-slate-200 font-medium text-sm">
              <ArrowLeft className="w-4 h-4" /> Back to Online Exam
            </button>
            <button onClick={() => navigate('/competitive-question-bank/new')} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all shadow-md font-medium text-sm">
              <Plus className="w-4 h-4" /> Add Question
            </button>
          </div>
        }
      />

      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
        
        {loading ? (
           <div className="flex justify-center py-20">
             <div className="animate-spin rounded-full h-10 w-10 border-4 border-indigo-200 border-t-indigo-600"></div>
           </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-center transition-all hover:shadow-md hover:-translate-y-1">
                <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Total Questions</p>
                <h3 className="text-4xl font-extrabold text-slate-800">{stats.total.toLocaleString()}</h3>
              </div>
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-center transition-all hover:shadow-md hover:-translate-y-1">
                <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Physics</p>
                <h3 className="text-4xl font-extrabold text-indigo-600">{stats.physics.toLocaleString()}</h3>
              </div>
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-center transition-all hover:shadow-md hover:-translate-y-1">
                <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Chemistry</p>
                <h3 className="text-4xl font-extrabold text-emerald-600">{stats.chemistry.toLocaleString()}</h3>
              </div>
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-center transition-all hover:shadow-md hover:-translate-y-1">
                <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Biology / Maths</p>
                <h3 className="text-4xl font-extrabold text-blue-600">{(stats.biology + stats.maths).toLocaleString()}</h3>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm h-fit space-y-6">
                <div className="flex items-center gap-2 text-lg font-bold text-slate-800 border-b pb-4">
                  <Filter size={20} className="text-indigo-500" /> Smart Filters
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Subject</label>
                    <select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium outline-none focus:border-indigo-500">
                      <option>All Subjects</option>
                      <option>Physics</option>
                      <option>Chemistry</option>
                      <option>Botany</option>
                      <option>Zoology</option>
                      <option>Mathematics</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Chapter</label>
                    <select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium outline-none focus:border-indigo-500">
                      <option>All Chapters</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Topic</label>
                    <select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium outline-none focus:border-indigo-500">
                      <option>All Topics</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Difficulty</label>
                    <select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium outline-none focus:border-indigo-500">
                      <option>All Difficulties</option>
                      <option>Easy</option>
                      <option>Medium</option>
                      <option>Hard</option>
                      <option>Very Hard</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Question Type</label>
                    <select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium outline-none focus:border-indigo-500">
                      <option>All Types</option>
                      {questionTypes.map((t, i) => <option key={i}>{t}</option>)}
                    </select>
                  </div>
                </div>
                <button className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition">
                  Apply Filters
                </button>
              </div>

              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
                  <h3 className="text-lg font-bold text-slate-800 mb-6">Difficulty Distribution</h3>
                  {stats.total === 0 ? (
                    <div className="text-center py-6 text-slate-500 font-medium">No questions found yet. Start adding!</div>
                  ) : (
                    <div className="flex flex-col gap-4">
                      {difficultyStats.map((d, i) => (
                        <div key={i} className="flex items-center gap-4">
                            <div className="w-24 text-sm font-bold text-slate-600">{d.label}</div>
                            <div className="flex-1 bg-slate-100 rounded-full h-3 overflow-hidden">
                              <div className={`h-full ${d.color}`} style={{ width: `${(d.count / (stats.total || 1)) * 100}%` }}></div>
                            </div>
                            <div className="w-16 text-right font-bold text-slate-800">{d.count.toLocaleString()}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
                  <h3 className="text-lg font-bold text-slate-800 mb-6">Supported Question Types</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {questionTypes.map((t, i) => (
                      <div key={i} className="bg-slate-50 border border-slate-100 p-3 rounded-xl text-center font-bold text-slate-600 text-sm hover:border-indigo-200 transition-colors cursor-pointer">
                        {t}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-4">
                  <button onClick={() => navigate('/competitive-question-bank/new')} className="flex-1 py-4 bg-white border-2 border-indigo-100 text-indigo-700 rounded-xl font-bold text-lg hover:bg-indigo-50 transition flex justify-center items-center gap-2">
                    <Plus /> Add New Question
                  </button>
                  <button className="flex-1 py-4 bg-white border-2 border-emerald-100 text-emerald-700 rounded-xl font-bold text-lg hover:bg-emerald-50 transition flex justify-center items-center gap-2">
                    <Activity /> Bulk Upload
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CompetitiveQuestionBankDashboard;
