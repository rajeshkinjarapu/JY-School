import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/UI/PageHeader';
import { 
  Database, Plus, Search, Filter, Trash2, Edit, FileText, CheckCircle, 
  ChevronRight, MoreVertical, Image as ImageIcon, BookOpen, BarChart2
} from 'lucide-react';
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
  imageUrl?: string;
  explanation?: string;
  subject: Subject;
  class?: ClassObj;
}

export const MasterQuestionBankPage = () => {
  const [questions, setQuestions] = useState<MasterQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classes, setClasses] = useState<ClassObj[]>([]);
  const [stats, setStats] = useState({ total: 0, easy: 0, medium: 0, hard: 0 });
  const navigate = useNavigate();
  
  // Filters
  const [subjectId, setSubjectId] = useState('');
  const [classId, setClassId] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  
  useEffect(() => {
    fetchFilters();
  }, []);

  const fetchFilters = async () => {
    try {
      const [clsRes, subRes] = await Promise.all([
        api.get('/api/classes?limit=5000'),
        api.get('/api/subjects?limit=5000')
      ]);
      const allC = clsRes.data?.data || [];
      const uniqueClasses: ClassObj[] = [];
      const seen = new Set();
      for(const c of allC) {
        if(!seen.has(c.name)) {
          seen.add(c.name);
          uniqueClasses.push(c);
        }
      }
      uniqueClasses.sort((a, b) => {
        const numA = parseInt(a.name) || 0;
        const numB = parseInt(b.name) || 0;
        if (numA !== numB) return numA - numB;
        return a.name.localeCompare(b.name);
      });
      setClasses(uniqueClasses);
      
      // Deduplicate Subjects
      const allS = subRes.data?.data || [];
      const uniqueSubjects: any[] = [];
      const seenS = new Set();
      for(const s of allS) {
        if(!seenS.has(s.name)) {
          seenS.add(s.name);
          uniqueSubjects.push(s);
        }
      }
      uniqueSubjects.sort((a, b) => a.name.localeCompare(b.name));
      
      setSubjects(uniqueSubjects);
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
      const data = res.data?.data || [];
      setQuestions(data);
      
      // Calculate Stats
      const easy = data.filter((q: any) => q.difficulty === 'EASY').length;
      const medium = data.filter((q: any) => q.difficulty === 'MEDIUM').length;
      const hard = data.filter((q: any) => q.difficulty === 'HARD').length;
      setStats({ total: data.length, easy, medium, hard });
      
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, [subjectId, classId, difficulty]);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this question?")) return;
    try {
      await api.delete(`/api/master-questions/${id}`);
      setQuestions(questions.filter(q => q.id !== id));
      setStats(prev => ({ ...prev, total: prev.total - 1 }));
    } catch (e) {
      alert("Failed to delete question");
    }
  };

  const filteredQuestions = questions.filter(q => 
    q.questionText.toLowerCase().includes(searchQuery.toLowerCase()) ||
    q.chapterName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col bg-[#f4f6fb]" style={{ minHeight: 'calc(100vh - 64px)' }}>
      <PageHeader 
        title="Master Question Bank" 
        icon={<Database className="w-5 h-5" />} 
        action={
          <button onClick={() => navigate('/question-bank/master-bank/new')} className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl hover:from-indigo-700 hover:to-violet-700 transition-all shadow-lg shadow-indigo-300/40 font-bold">
            <Plus className="w-5 h-5" /> Add New Question
          </button>
        }
      />
      
      <div className="flex-1 p-6 overflow-auto">
        <div className="max-w-[1600px] mx-auto flex flex-col xl:flex-row gap-6">
          
          {/* LEFT SIDEBAR - FILTERS */}
          <div className="w-full xl:w-72 flex-shrink-0 space-y-5">
            {/* Stats Widget */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-indigo-400" /> Bank Overview
              </h3>
              <div className="flex items-center justify-between mb-4">
                <div className="text-3xl font-black text-gray-800">{stats.total}</div>
                <div className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg">Questions</div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500 font-medium flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-400"></div> Easy</span>
                  <span className="font-bold text-gray-800">{stats.easy}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500 font-medium flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-amber-400"></div> Medium</span>
                  <span className="font-bold text-gray-800">{stats.medium}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500 font-medium flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-rose-400"></div> Hard</span>
                  <span className="font-bold text-gray-800">{stats.hard}</span>
                </div>
              </div>
            </div>

            {/* Filters Widget */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sticky top-6">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Filter className="w-4 h-4 text-indigo-400" /> Smart Filters
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1.5">Class</label>
                  <select className="w-full border-2 border-gray-100 rounded-xl px-3.5 py-2.5 bg-gray-50 text-sm font-medium focus:bg-white outline-none focus:border-indigo-300 transition-all cursor-pointer" value={classId} onChange={e => setClassId(e.target.value)}>
                    <option value="">All Classes</option>
                    {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1.5">Subject</label>
                  <select className="w-full border-2 border-gray-100 rounded-xl px-3.5 py-2.5 bg-gray-50 text-sm font-medium focus:bg-white outline-none focus:border-indigo-300 transition-all cursor-pointer" value={subjectId} onChange={e => setSubjectId(e.target.value)}>
                    <option value="">All Subjects</option>
                    {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1.5">Difficulty</label>
                  <select className="w-full border-2 border-gray-100 rounded-xl px-3.5 py-2.5 bg-gray-50 text-sm font-medium focus:bg-white outline-none focus:border-indigo-300 transition-all cursor-pointer" value={difficulty} onChange={e => setDifficulty(e.target.value)}>
                    <option value="">All Difficulties</option>
                    <option value="EASY">Easy</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HARD">Hard</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* MAIN CONTENT - QUESTIONS LIST */}
          <div className="flex-1 min-w-0 space-y-5">
            {/* Search Bar */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-2 flex items-center gap-3">
              <div className="flex-1 relative">
                <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input 
                  type="text" 
                  placeholder="Search questions by text or chapter name..." 
                  className="w-full bg-gray-50 border-none rounded-xl py-3 pl-12 pr-4 text-sm font-medium text-gray-800 focus:bg-indigo-50/30 focus:ring-2 focus:ring-indigo-100 outline-none transition-all placeholder-gray-400"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* Questions Feed */}
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
                <p className="text-gray-500 font-medium">Loading questions from bank...</p>
              </div>
            ) : filteredQuestions.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-16 flex flex-col items-center justify-center text-center">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                  <Database className="w-10 h-10 text-gray-300" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">No Questions Found</h3>
                <p className="text-gray-500 max-w-sm mb-6">We couldn't find any questions matching your current filters and search criteria.</p>
                <button onClick={() => { setClassId(''); setSubjectId(''); setDifficulty(''); setSearchQuery(''); }} className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 font-bold transition-all">
                  Clear All Filters
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredQuestions.map((q, i) => {
                  let opts = [];
                  try { opts = JSON.parse(q.options || '[]'); } catch(e) {}
                  const isExpanded = expandedId === q.id;
                  
                  return (
                    <div key={q.id} className={`bg-white rounded-2xl border-2 transition-all duration-200 overflow-hidden ${isExpanded ? 'border-indigo-400 shadow-md' : 'border-gray-100 shadow-sm hover:border-indigo-200 hover:shadow-md cursor-pointer'}`} onClick={() => !isExpanded && setExpandedId(q.id)}>
                      {/* Card Header (Always visible) */}
                      <div className="p-5">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            {/* Badges */}
                            <div className="flex flex-wrap items-center gap-2 mb-3">
                              <span className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded-lg text-[11px] font-bold uppercase tracking-wider">{q.class?.name || 'Any'}</span>
                              <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5"><BookOpen className="w-3 h-3" /> {q.subject?.name}</span>
                              <span className="px-2.5 py-1 bg-gray-50 text-gray-500 rounded-lg text-[11px] font-bold uppercase tracking-wider truncate max-w-[150px]">{q.chapterName}</span>
                              <span className={`px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wider ${q.difficulty === 'HARD' ? 'bg-rose-50 text-rose-600' : q.difficulty === 'MEDIUM' ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}>{q.difficulty}</span>
                            </div>
                            
                            {/* Question Preview */}
                            <div className="flex gap-3">
                              <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 font-black flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
                                Q
                              </div>
                              <div className="flex-1">
                                <p className={`text-[15px] font-semibold text-gray-800 leading-relaxed ${!isExpanded && 'line-clamp-2'}`}>
                                  {q.questionText}
                                </p>
                                {!isExpanded && q.imageUrl && (
                                  <div className="mt-2 flex items-center gap-1.5 text-xs font-bold text-indigo-500 bg-indigo-50 px-2.5 py-1 rounded-lg w-max">
                                    <ImageIcon className="w-3.5 h-3.5" /> Contains Image Diagram
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          {/* Actions */}
                          <div className="flex flex-col items-end gap-2 flex-shrink-0">
                            {isExpanded ? (
                              <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                                <button className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"><Edit className="w-4 h-4" /></button>
                                <button onClick={(e) => handleDelete(q.id, e)} className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"><Trash2 className="w-4 h-4" /></button>
                                <button onClick={(e) => { e.stopPropagation(); setExpandedId(null); }} className="px-3 py-1.5 bg-gray-100 text-gray-600 text-xs font-bold rounded-lg hover:bg-gray-200">Close</button>
                              </div>
                            ) : (
                              <button className="w-8 h-8 flex items-center justify-center text-gray-300 hover:text-indigo-500 hover:bg-indigo-50 rounded-full transition-colors">
                                <ChevronRight className="w-5 h-5" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Expanded Content */}
                      {isExpanded && (
                        <div className="px-5 pb-5 pt-2 border-t border-gray-100 bg-gray-50/30">
                          {q.imageUrl && (
                            <div className="mb-6 ml-11">
                              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Diagram / Figure</p>
                              <img src={q.imageUrl} alt="Question Diagram" className="max-h-48 rounded-xl border border-gray-200 shadow-sm" />
                            </div>
                          )}

                          <div className="ml-11 grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                            {opts.map((opt: string, idx: number) => {
                              const isImageOpt = opt.startsWith('[IMAGE:');
                              const optContent = isImageOpt ? opt.replace('[IMAGE:', '').replace(']', '') : opt;
                              const isCorrect = opt === q.correctAnswer;
                              
                              return (
                                <div key={idx} className={`relative p-3 rounded-xl border-2 transition-all flex items-start gap-3 ${isCorrect ? 'bg-emerald-50 border-emerald-300 shadow-sm' : 'bg-white border-gray-100'}`}>
                                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${isCorrect ? 'bg-emerald-500 text-white shadow-sm' : 'bg-gray-100 text-gray-500'}`}>
                                    {String.fromCharCode(65 + idx)}
                                  </div>
                                  <div className="flex-1 mt-0.5 text-sm font-medium text-gray-700">
                                    {isImageOpt ? (
                                      <img src={optContent} alt={`Option ${String.fromCharCode(65 + idx)}`} className="max-h-24 rounded-lg border border-gray-200" />
                                    ) : (
                                      optContent
                                    )}
                                  </div>
                                  {isCorrect && <CheckCircle className="w-5 h-5 text-emerald-500 absolute top-3 right-3" />}
                                </div>
                              );
                            })}
                          </div>

                          {q.explanation && (
                            <div className="ml-11 mt-5 p-4 bg-indigo-50 border border-indigo-100 rounded-xl">
                              <p className="text-xs font-bold text-indigo-800 uppercase tracking-wider mb-1.5 flex items-center gap-1.5"><Sparkles className="w-3 h-3" /> Explanation</p>
                              <p className="text-sm text-indigo-900/80 leading-relaxed font-medium">{q.explanation}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

// Helper icon
const Sparkles = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
);

export default MasterQuestionBankPage;
