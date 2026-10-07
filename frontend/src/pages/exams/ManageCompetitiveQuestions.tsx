import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../api/axios";
import { PageHeader } from "../../components/UI/PageHeader";
import { ChevronLeft, Plus, Edit2, Trash2, Upload, FileText, Database, Search, CheckCircle2, X, Save } from "lucide-react";
import { toast } from 'react-hot-toast';

export const ManageCompetitiveQuestions = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [exam, setExam] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Question Bank Modal State
  const [showQBModal, setShowQBModal] = useState(false);
  const [qbQuestions, setQbQuestions] = useState<any[]>([]);
  const [qbLoading, setQbLoading] = useState(false);
  const [selectedQBQuestions, setSelectedQBQuestions] = useState<string[]>([]);
  const [qbSearch, setQbSearch] = useState('');

  // Manual Question Modal State
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualForm, setManualForm] = useState({
    questionText: '',
    optionA: '', optionB: '', optionC: '', optionD: '',
    correctAnswer: 'A',
    solution: '',
    subject: '',
    marks: 4,
    negativeMarks: 1
  });

  useEffect(() => {
    fetchExamDetails();
  }, [id]);

  const fetchExamDetails = () => {
    api.get(`/api/competitive-exams/${id}/student`).then(res => {
      setExam(res.data.data);
      setLoading(false);
    }).catch(err => {
      setLoading(false);
    });
  };

  const handleDeleteQuestion = async (qId: string) => {
    if (!window.confirm("Are you sure you want to delete this question?")) return;
    try {
      await api.delete(`/api/competitive-exams/question/${qId}`);
      toast.success("Question deleted");
      fetchExamDetails();
    } catch (e) {
      toast.error("Failed to delete question");
    }
  };

  const openQuestionBank = async () => {
    setShowQBModal(true);
    setQbLoading(true);
    try {
      const res = await api.get('/api/question-bank/questions');
      setQbQuestions(res.data?.data || res.data || []);
    } catch (err) {
      toast.error('Failed to load question bank');
    } finally {
      setQbLoading(false);
    }
  };

  const toggleQBSelection = (qId: string) => {
    setSelectedQBQuestions(prev => 
      prev.includes(qId) ? prev.filter(id => id !== qId) : [...prev, qId]
    );
  };

  const handleLinkQBQuestions = async () => {
    if (selectedQBQuestions.length === 0) return toast.error("Select at least one question");
    
    try {
      await api.post(`/api/competitive-exams/${id}/questions/link`, { questionIds: selectedQBQuestions });
      toast.success("Questions linked successfully!");
      fetchExamDetails();
      setShowQBModal(false);
      setSelectedQBQuestions([]);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to link questions");
    }
  };

  const handleManualSubmit = async (e: React.FormEvent, isAddNew: boolean = false) => {
    e.preventDefault();
    if (!manualForm.questionText || !manualForm.optionA || !manualForm.optionB) {
      toast.error("Please fill question text and at least two options");
      return;
    }
    
    try {
      const payload = {
        questionText: manualForm.questionText,
        options: [manualForm.optionA, manualForm.optionB, manualForm.optionC, manualForm.optionD].filter(Boolean),
        correctAnswer: manualForm.correctAnswer,
        explanation: manualForm.solution,
        marks: manualForm.marks,
        negativeMarks: manualForm.negativeMarks,
        subjectId: manualForm.subject // Need to map properly in production
      };
      await api.post(`/api/competitive-exams/${id}/questions`, payload);
      toast.success("Question added successfully!");
      fetchExamDetails();
      
      // Reset form
      setManualForm({
        questionText: '', optionA: '', optionB: '', optionC: '', optionD: '',
        correctAnswer: 'A', solution: '', subject: '', marks: 4, negativeMarks: 1
      });
      
      if (!isAddNew) {
        setShowManualModal(false);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to add question");
    }
  };

  if (loading) return <div className="p-12 flex justify-center"><div className="animate-spin w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full"></div></div>;

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 bg-slate-50 min-h-screen">
      <div className="flex items-center gap-4 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <button onClick={() => navigate("/competitive-exams")} className="p-3 bg-slate-50 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-100 transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800">{exam?.title}</h1>
          <p className="text-sm font-semibold text-slate-500">Manage Questions mapped to this exam</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <FileText className="text-indigo-600 w-6 h-6" /> 
                Questions ({exam?.questions?.length || 0})
              </h3>
            </div>
            
            <div className="space-y-4">
              {exam?.questions?.length === 0 ? (
                <div className="text-center p-12 bg-slate-50 rounded-2xl border border-slate-200">
                  <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500 font-bold">No questions added yet.</p>
                  <p className="text-slate-400 text-sm">Use the panel on the right to add questions.</p>
                </div>
              ) : (
                exam?.questions?.map((q: any, idx: number) => (
                  <div key={q.id} className="p-5 border border-slate-200 bg-slate-50 rounded-2xl hover:border-indigo-300 transition-colors">
                    <div className="flex justify-between items-start mb-4">
                      <p className="font-bold text-slate-800 text-base flex-1 pr-4">
                        <span className="text-indigo-600 mr-2">Q{idx + 1}.</span> 
                        {q.questionText}
                      </p>
                      <div className="flex items-center gap-2 shrink-0">
                        <button className="p-2 text-blue-600 hover:bg-blue-100 bg-white rounded-lg border border-slate-200 shadow-sm transition-colors"><Edit2 size={14}/></button>
                        <button onClick={() => handleDeleteQuestion(q.id)} className="p-2 text-rose-600 hover:bg-rose-100 bg-white rounded-lg border border-slate-200 shadow-sm transition-colors"><Trash2 size={14}/></button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      {q.options?.map((opt: string, oIdx: number) => {
                        const isCorrect = q.correctAnswer && (opt === q.correctAnswer || String.fromCharCode(65+oIdx) === q.correctAnswer);
                        return (
                          <div key={oIdx} className={`px-4 py-2.5 rounded-xl border ${isCorrect ? "bg-emerald-50 border-emerald-300 text-emerald-800 font-bold shadow-sm" : "bg-white border-slate-200 text-slate-600 font-medium"}`}>
                            <span className="text-slate-400 mr-2 font-bold">{String.fromCharCode(65+oIdx)}.</span> {opt}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col gap-4">
            <h3 className="font-extrabold text-lg text-slate-800 border-b border-slate-100 pb-4">Add Questions</h3>
            
            <button onClick={() => setShowManualModal(true)} className="w-full flex items-center justify-center gap-3 p-4 bg-indigo-50 border-2 border-indigo-100 hover:bg-indigo-100 hover:border-indigo-200 text-indigo-700 rounded-2xl font-bold transition-all">
              <Plus className="w-5 h-5" /> Add Manually
            </button>
            
            <div className="relative flex items-center py-2">
              <div className="flex-grow border-t border-slate-200"></div>
              <span className="flex-shrink-0 mx-4 text-slate-400 text-xs font-bold uppercase tracking-wider">OR</span>
              <div className="flex-grow border-t border-slate-200"></div>
            </div>
            
            <button onClick={openQuestionBank} className="w-full flex items-center justify-center gap-3 p-4 bg-emerald-50 border-2 border-emerald-100 hover:bg-emerald-100 hover:border-emerald-200 text-emerald-700 rounded-2xl font-bold transition-all">
              <Database className="w-5 h-5" /> Select from Question Bank
            </button>
          </div>
        </div>
      </div>

      {/* QUESTION BANK MODAL */}
      {showQBModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl flex flex-col h-[85vh] overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2"><Database className="text-indigo-600" /> Question Bank</h2>
              <button onClick={() => setShowQBModal(false)} className="p-2 text-slate-400 hover:bg-slate-200 rounded-xl transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4 border-b border-slate-100 flex gap-4 bg-white">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Search questions..."
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                  value={qbSearch}
                  onChange={(e) => setQbSearch(e.target.value)}
                />
              </div>
              <select className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 outline-none">
                <option value="">All Subjects</option>
              </select>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
              {qbLoading ? (
                 <div className="flex justify-center p-12"><div className="animate-spin w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full"></div></div>
              ) : (
                <div className="space-y-4">
                  {qbQuestions.filter(q => q.questionText?.toLowerCase().includes(qbSearch.toLowerCase())).map((q: any) => (
                    <div key={q.id} onClick={() => toggleQBSelection(q.id)} className={`p-4 border-2 rounded-2xl cursor-pointer transition-all ${selectedQBQuestions.includes(q.id) ? 'border-indigo-500 bg-indigo-50/30 shadow-sm' : 'border-slate-200 bg-white hover:border-indigo-300'}`}>
                      <div className="flex gap-4">
                        <div className="pt-1">
                          <div className={`w-5 h-5 rounded flex items-center justify-center border ${selectedQBQuestions.includes(q.id) ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300 bg-white'}`}>
                            {selectedQBQuestions.includes(q.id) && <CheckCircle2 className="w-4 h-4 text-white" />}
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-bold uppercase">{q.subject || 'General'}</span>
                            <span className="px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded text-[10px] font-bold uppercase">{q.difficulty || 'Medium'}</span>
                          </div>
                          <p className="font-bold text-slate-800 text-sm line-clamp-2">{q.questionText}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="p-4 border-t border-slate-100 bg-white flex justify-between items-center">
              <div className="text-sm font-bold text-slate-600">
                <span className="text-indigo-600 font-extrabold">{selectedQBQuestions.length}</span> questions selected
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowQBModal(false)} className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-sm transition-colors">Cancel</button>
                <button onClick={handleLinkQBQuestions} className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm shadow-md transition-colors">Link to Exam</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MANUAL QUESTION MODAL (Interactive Editor) */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Edit2 className="text-indigo-600 w-5 h-5" /> Interactive Question Editor
              </h2>
              <button onClick={() => setShowManualModal(false)} className="p-2 text-slate-400 hover:bg-slate-200 rounded-xl transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 md:p-8 overflow-y-auto bg-slate-50/50">
              <div className="space-y-8">
                
                {/* Question Text Box */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="flex justify-between items-center mb-3">
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">Question Text</label>
                    <button className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
                      <Upload className="w-3.5 h-3.5" /> Upload Image / Diagram
                    </button>
                  </div>
                  <textarea 
                    className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl text-base text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all resize-y min-h-[120px]"
                    placeholder="Enter your question here..."
                    value={manualForm.questionText}
                    onChange={(e) => setManualForm({...manualForm, questionText: e.target.value})}
                  />
                </div>
                
                {/* Options Box */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">Options</label>
                    <span className="text-xs font-semibold text-slate-400">Click on an option letter to mark as Correct Answer</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {['A', 'B', 'C', 'D'].map((opt) => {
                      const isCorrect = manualForm.correctAnswer === opt;
                      return (
                        <div 
                          key={opt} 
                          className={`flex items-center gap-3 p-2 rounded-2xl border-2 transition-all ${
                            isCorrect ? 'border-emerald-500 bg-emerald-50/30' : 'border-slate-100 hover:border-slate-300'
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => setManualForm({...manualForm, correctAnswer: opt})}
                            className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center font-bold text-sm transition-all ${
                              isCorrect ? 'bg-emerald-500 text-white shadow-md shadow-emerald-200' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                            }`}
                          >
                            {isCorrect ? <CheckCircle2 className="w-5 h-5" /> : opt}
                          </button>
                          <input 
                            type="text"
                            placeholder={`Option ${opt} text`}
                            className="w-full bg-transparent border-none focus:outline-none text-sm text-slate-700 py-2"
                            value={(manualForm as any)[`option${opt}`]}
                            onChange={(e) => setManualForm({...manualForm, [`option${opt}`]: e.target.value})}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Solution Box */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-3">Solution / Explanation (Optional)</label>
                  <textarea 
                    className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all resize-y min-h-[100px]"
                    placeholder="Provide a step-by-step solution..."
                    value={manualForm.solution}
                    onChange={(e) => setManualForm({...manualForm, solution: e.target.value})}
                  />
                </div>

                {/* Marks Box */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Positive Marks</label>
                    <input type="number" min="1" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:border-indigo-500 outline-none" value={manualForm.marks} onChange={(e) => setManualForm({...manualForm, marks: Number(e.target.value)})} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Negative Marks</label>
                    <input type="number" min="0" step="0.25" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:border-indigo-500 outline-none" value={manualForm.negativeMarks} onChange={(e) => setManualForm({...manualForm, negativeMarks: Number(e.target.value)})} />
                  </div>
                </div>

              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="px-6 py-4 border-t border-slate-100 bg-white flex justify-between items-center">
              <button type="button" onClick={() => setShowManualModal(false)} className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl transition-colors text-sm">
                Cancel
              </button>
              <div className="flex gap-3">
                <button 
                  type="button" 
                  onClick={(e) => handleManualSubmit(e, true)}
                  className="px-6 py-3 bg-white border-2 border-indigo-100 hover:border-indigo-200 text-indigo-600 font-bold rounded-xl transition-colors text-sm flex items-center gap-2"
                >
                  <Plus className="w-4 h-4"/> Save & Add New
                </button>
                <button 
                  type="button" 
                  onClick={(e) => handleManualSubmit(e, false)}
                  className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-md shadow-indigo-200 text-sm flex items-center gap-2"
                >
                  <Save className="w-4 h-4"/> Save Question
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
