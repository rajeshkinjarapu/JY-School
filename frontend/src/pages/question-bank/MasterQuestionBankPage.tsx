import React, { useState, useEffect } from 'react';
import { PageHeader } from '../../components/UI/PageHeader';
import { Database, Plus, Search, Filter, Trash2, Edit, FileText, CheckCircle } from 'lucide-react';
import api from '../../api/axios';

interface Subject { id: string; name: string; }
interface ClassObj { id: string; name: string; section: string; }
interface MasterQuestion {
  id: string;
  chapterName: string;
  topicName?: string;
  difficulty: string;
  questionText: string;
  options: string;
  correctAnswer: string;
  marks: number;
  subject: Subject;
  class?: ClassObj;
}

export const MasterQuestionBankPage = () => {
  const [questions, setQuestions] = useState<MasterQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classes, setClasses] = useState<ClassObj[]>([]);
  
  // Filters
  const [subjectId, setSubjectId] = useState('');
  const [classId, setClassId] = useState('');
  const [difficulty, setDifficulty] = useState('');
  
  useEffect(() => {
    fetchFilters();
    fetchQuestions();
  }, []);

  const fetchFilters = async () => {
    try {
      const [subRes, clsRes] = await Promise.all([
        api.get('/api/subjects'),
        api.get('/api/classes')
      ]);
      setSubjects(subRes.data?.data || []);
      setClasses(clsRes.data?.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (subjectId) params.append('subjectId', subjectId);
      if (classId) params.append('classId', classId);
      if (difficulty) params.append('difficulty', difficulty);

      const res = await api.get(`/api/master-questions?${params.toString()}`);
      setQuestions(res.data?.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, [subjectId, classId, difficulty]);

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this question?")) return;
    try {
      await api.delete(`/api/master-questions/${id}`);
      setQuestions(questions.filter(q => q.id !== id));
    } catch (e) {
      alert("Failed to delete question");
    }
  };

  return (
    <div className="flex-1 overflow-auto bg-gray-50/50" style={{ minHeight: 'calc(100vh - 64px)' }}>
      <PageHeader 
        title="Master Question Bank" 
        icon={<Database className="w-5 h-5" />} 
        action={
          <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm font-medium">
            <Plus className="w-4 h-4" /> Add Questions
          </button>
        }
      />
      
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Filters */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2 text-gray-500 mr-2">
            <Filter className="w-4 h-4" />
            <span className="font-medium text-sm">Filters:</span>
          </div>
          <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" value={classId} onChange={e => setClassId(e.target.value)}>
            <option value="">All Classes</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.name} {c.section}</option>)}
          </select>
          <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" value={subjectId} onChange={e => setSubjectId(e.target.value)}>
            <option value="">All Subjects</option>
            {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" value={difficulty} onChange={e => setDifficulty(e.target.value)}>
            <option value="">All Difficulties</option>
            <option value="EASY">Easy</option>
            <option value="MEDIUM">Medium</option>
            <option value="HARD">Hard</option>
          </select>
        </div>

        {/* Questions List */}
        {loading ? (
          <div className="text-center py-10 text-gray-400">Loading questions...</div>
        ) : questions.length === 0 ? (
          <div className="bg-white p-10 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-gray-400">
            <Database className="w-12 h-12 mb-3 text-gray-300" />
            <p className="text-lg font-medium text-gray-600">No questions found</p>
            <p className="text-sm">Try adjusting your filters or add new questions.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {questions.map((q, i) => {
              let opts = [];
              try { opts = JSON.parse(q.options || '[]'); } catch(e) {}
              
              return (
                <div key={q.id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:border-indigo-200 transition-colors">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-md text-xs font-semibold">{q.subject?.name}</span>
                      <span className="px-2.5 py-1 bg-gray-100 text-gray-600 rounded-md text-xs font-medium">{q.chapterName}</span>
                      <span className={`px-2.5 py-1 rounded-md text-xs font-medium ${q.difficulty === 'HARD' ? 'bg-red-50 text-red-600' : q.difficulty === 'MEDIUM' ? 'bg-orange-50 text-orange-600' : 'bg-green-50 text-green-600'}`}>{q.difficulty}</span>
                    </div>
                    <button onClick={() => handleDelete(q.id)} className="text-gray-400 hover:text-red-500 p-1">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="text-gray-800 font-medium mb-3 text-[15px] leading-relaxed">
                    <span className="text-indigo-500 font-bold mr-2">Q.</span>
                    {q.questionText}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-4">
                    {opts.map((opt: string, idx: number) => (
                      <div key={idx} className={`p-2.5 rounded-lg border text-sm flex items-start gap-2 ${opt === q.correctAnswer ? 'bg-green-50 border-green-200 text-green-800 font-medium' : 'bg-gray-50 border-gray-100 text-gray-600'}`}>
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs shrink-0 ${opt === q.correctAnswer ? 'bg-green-200 text-green-800' : 'bg-gray-200 text-gray-500'}`}>
                          {String.fromCharCode(65 + idx)}
                        </div>
                        {opt}
                      </div>
                    ))}
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

export default MasterQuestionBankPage;
