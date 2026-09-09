import React, { useState, useEffect } from 'react';
import { PageHeader } from '../../components/UI/PageHeader';
import { ArrowLeft, Sparkles, Save, Layout, FileText, CheckCircle, Database } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';

interface Subject { id: string; name: string; }
interface ClassObj { id: string; name: string; section: string; }

export const AddMasterQuestionPage = () => {
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classes, setClasses] = useState<ClassObj[]>([]);
  const [loading, setLoading] = useState(false);

  const [newQ, setNewQ] = useState({
    subjectId: '', classId: '', chapterName: '', topicName: '',
    difficulty: 'MEDIUM', questionText: '', options: ['', '', '', ''],
    correctAnswer: '', marks: 1, explanation: ''
  });
  
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    fetchFilters();
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

  const handleSave = async () => {
    if (!newQ.subjectId || !newQ.classId || !newQ.chapterName || !newQ.questionText || !newQ.correctAnswer) {
      alert("Please fill in all required fields (Class, Subject, Chapter, Question Text, and Correct Answer).");
      return;
    }
    setLoading(true);
    try {
      await api.post('/api/master-questions', {
        ...newQ,
        options: JSON.stringify(newQ.options)
      });
      navigate('/question-bank/master-bank');
    } catch (e) {
      alert("Failed to save question.");
    } finally {
      setLoading(false);
    }
  };

  const handleAIGenerate = async () => {
    if (!newQ.subjectId || !newQ.classId || !newQ.chapterName) {
      alert("Please select Class, Subject and enter a Chapter Name first.");
      return;
    }
    setIsGenerating(true);
    try {
      // The current backend generate-ai endpoint generates AND saves the questions.
      // We will generate 1 question, and then extract the first one's data.
      const res = await api.post('/api/master-questions/generate-ai', {
        subjectId: newQ.subjectId,
        classId: newQ.classId,
        chapterName: newQ.chapterName,
        difficulty: newQ.difficulty,
        prompt: aiPrompt || "Generate a standard question",
        count: 1
      });
      
      const generated = res.data?.data?.[0];
      if (generated) {
        let opts = ['', '', '', ''];
        try { opts = JSON.parse(generated.options); } catch (e) {}
        setNewQ({
          ...newQ,
          questionText: generated.questionText,
          options: opts.length === 4 ? opts : ['', '', '', ''],
          correctAnswer: generated.correctAnswer,
          explanation: generated.explanation || ''
        });
        alert("AI generated and saved a question successfully! You can modify it or save a new one.");
      }
    } catch (e) {
      alert("AI Generation failed.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#f8f9fc] overflow-hidden" style={{ minHeight: 'calc(100vh - 64px)' }}>
      <PageHeader 
        title="Add Master Question" 
        icon={<Database className="w-5 h-5" />} 
        action={
          <div className="flex gap-3">
            <button onClick={() => navigate('/question-bank/master-bank')} className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2 font-medium shadow-sm transition-all">
              <ArrowLeft className="w-4 h-4" /> Back to Bank
            </button>
            <button onClick={handleSave} disabled={loading} className="px-5 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-lg hover:from-indigo-700 hover:to-violet-700 flex items-center gap-2 font-medium shadow-md transition-all transform hover:scale-[1.02] disabled:opacity-50">
              <Save className="w-4 h-4" /> {loading ? 'Saving...' : 'Save Question'}
            </button>
          </div>
        }
      />
      
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-6">
          
          {/* Left Sidebar - Meta Configuration */}
          <div className="w-full lg:w-1/3 xl:w-1/4 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-5 flex items-center gap-2">
                <Layout className="w-5 h-5 text-indigo-500" />
                Configuration
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Class <span className="text-red-500">*</span></label>
                  <select className="w-full border border-gray-200 rounded-xl px-4 py-2.5 bg-gray-50 focus:bg-white transition-colors outline-none focus:ring-2 focus:ring-indigo-500/50" value={newQ.classId} onChange={e => setNewQ({...newQ, classId: e.target.value})}>
                    <option value="">Select Class</option>
                    {classes.map(c => <option key={c.id} value={c.id}>{c.name} {c.section}</option>)}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Subject <span className="text-red-500">*</span></label>
                  <select className="w-full border border-gray-200 rounded-xl px-4 py-2.5 bg-gray-50 focus:bg-white transition-colors outline-none focus:ring-2 focus:ring-indigo-500/50" value={newQ.subjectId} onChange={e => setNewQ({...newQ, subjectId: e.target.value})}>
                    <option value="">Select Subject</option>
                    {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Chapter <span className="text-red-500">*</span></label>
                  <input type="text" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 bg-gray-50 focus:bg-white transition-colors outline-none focus:ring-2 focus:ring-indigo-500/50" placeholder="e.g. Kinematics" value={newQ.chapterName} onChange={e => setNewQ({...newQ, chapterName: e.target.value})} />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Topic (Optional)</label>
                  <input type="text" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 bg-gray-50 focus:bg-white transition-colors outline-none focus:ring-2 focus:ring-indigo-500/50" placeholder="e.g. Projectile Motion" value={newQ.topicName} onChange={e => setNewQ({...newQ, topicName: e.target.value})} />
                </div>

                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Difficulty</label>
                    <select className="w-full border border-gray-200 rounded-xl px-4 py-2.5 bg-gray-50 focus:bg-white outline-none focus:ring-2 focus:ring-indigo-500/50" value={newQ.difficulty} onChange={e => setNewQ({...newQ, difficulty: e.target.value})}>
                      <option value="EASY">Easy</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HARD">Hard</option>
                    </select>
                  </div>
                  <div className="w-24">
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Marks</label>
                    <input type="number" min="1" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 bg-gray-50 focus:bg-white outline-none focus:ring-2 focus:ring-indigo-500/50 text-center" value={newQ.marks} onChange={e => setNewQ({...newQ, marks: parseInt(e.target.value) || 1})} />
                  </div>
                </div>
              </div>
            </div>

            {/* AI Generator Box */}
            <div className="bg-gradient-to-br from-indigo-50 to-violet-50 rounded-2xl shadow-sm border border-indigo-100 p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Sparkles className="w-24 h-24 text-indigo-600" />
              </div>
              <h3 className="text-lg font-bold text-indigo-900 mb-2 flex items-center gap-2 relative z-10">
                <Sparkles className="w-5 h-5 text-indigo-600" />
                AI Generate
              </h3>
              <p className="text-xs text-indigo-700/70 mb-4 relative z-10 leading-relaxed">
                Need inspiration? Let AI generate a question based on your chapter and topic.
              </p>
              <textarea 
                className="w-full border border-indigo-200 rounded-xl px-4 py-3 bg-white/60 focus:bg-white transition-colors outline-none focus:ring-2 focus:ring-indigo-500/50 text-sm mb-4 relative z-10 resize-none h-24 placeholder-indigo-300"
                placeholder="Optional prompt (e.g. 'Focus on real-world applications of Newton's laws')"
                value={aiPrompt}
                onChange={e => setAiPrompt(e.target.value)}
              />
              <button 
                onClick={handleAIGenerate}
                disabled={isGenerating}
                className="w-full py-2.5 bg-indigo-600 text-white rounded-xl font-medium shadow-md shadow-indigo-600/20 hover:bg-indigo-700 transition-all relative z-10 flex justify-center items-center gap-2 disabled:opacity-60"
              >
                {isGenerating ? (
                  <><span className="animate-spin text-xl">⏳</span> Generating...</>
                ) : (
                  <><Sparkles className="w-4 h-4" /> Generate Magic</>
                )}
              </button>
            </div>
          </div>

          {/* Right Main Panel - Large Editor */}
          <div className="w-full lg:w-2/3 xl:w-3/4 flex flex-col gap-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-full">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-500" />
                  Question Editor
                </h3>
              </div>
              
              <div className="p-6 flex-1 flex flex-col">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Question Text <span className="text-red-500">*</span></label>
                <textarea 
                  className="w-full flex-1 min-h-[300px] border border-gray-200 rounded-xl p-5 bg-gray-50 focus:bg-white transition-colors outline-none focus:ring-2 focus:ring-indigo-500/50 text-[15px] leading-relaxed text-gray-800 resize-none font-medium" 
                  placeholder="Type your question here... (Supports multiple lines and rich text structure)"
                  value={newQ.questionText}
                  onChange={e => setNewQ({...newQ, questionText: e.target.value})}
                />
              </div>

              <div className="p-6 border-t border-gray-100 bg-gray-50/30">
                <h4 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" /> Options & Answer
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  {newQ.options.map((opt, i) => (
                    <div key={i} className="flex flex-col">
                      <label className="text-xs font-semibold text-gray-500 mb-1 ml-1 uppercase tracking-wider">Option {String.fromCharCode(65 + i)}</label>
                      <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded bg-gray-200 text-gray-600 flex items-center justify-center text-xs font-bold">
                          {String.fromCharCode(65 + i)}
                        </div>
                        <input 
                          type="text" 
                          className="w-full border border-gray-200 rounded-xl pl-11 pr-4 py-3 bg-white outline-none focus:ring-2 focus:ring-indigo-500/50 text-sm font-medium" 
                          value={opt} 
                          onChange={e => {
                            const newOpts = [...newQ.options];
                            newOpts[i] = e.target.value;
                            setNewQ({...newQ, options: newOpts});
                          }} 
                          placeholder={`Enter option ${String.fromCharCode(65 + i)} text`} 
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Correct Answer (Exact Match) <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
                        <CheckCircle className="w-4 h-4" />
                      </div>
                      <input 
                        type="text" 
                        className="w-full border-2 border-green-200 rounded-xl pl-11 pr-4 py-3 bg-green-50 outline-none focus:border-green-400 focus:ring-4 focus:ring-green-500/20 text-sm font-bold text-green-800 placeholder-green-300 transition-all" 
                        value={newQ.correctAnswer} 
                        onChange={e => setNewQ({...newQ, correctAnswer: e.target.value})} 
                        placeholder="Must perfectly match one of the options above" 
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Explanation (Optional)</label>
                    <textarea 
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 bg-white outline-none focus:ring-2 focus:ring-indigo-500/50 text-sm resize-none h-12" 
                      value={newQ.explanation} 
                      onChange={e => setNewQ({...newQ, explanation: e.target.value})} 
                      placeholder="Brief explanation for the answer..." 
                    />
                  </div>
                </div>

              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default AddMasterQuestionPage;
