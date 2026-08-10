import React, { useState, useEffect } from 'react';
import { Key, Save, CheckCircle2, AlertTriangle, FileText, ChevronDown } from 'lucide-react';
import { api } from '../../api/axios';
import toast from 'react-hot-toast';

interface GeneratedPaper {
  id: string;
  examName: string;
  examSubject: string;
  examDate: string;
  time: string;
  content: string;
}

interface Answer {
  qNo: number;
  answer: string;
}

export const AnswerKeyManager = () => {
  const [papers, setPapers] = useState<GeneratedPaper[]>([]);
  const [selectedPaperId, setSelectedPaperId] = useState<string>('');
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchPapers();
  }, []);

  useEffect(() => {
    if (selectedPaperId) {
      loadPaperAndAnswerKey(selectedPaperId);
    } else {
      setAnswers([]);
    }
  }, [selectedPaperId]);

  const fetchPapers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/generated-papers');
      setPapers(res.data);
    } catch (error) {
      toast.error('Failed to load papers');
    } finally {
      setLoading(false);
    }
  };

  const parseQuestionCount = (content: string): number => {
    const lines = content.split('\n');
    let maxQ = 0;
    for (const line of lines) {
      const match = line.match(/^(\d+)[\.\)]\s/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxQ) maxQ = num;
      }
    }
    return maxQ > 0 ? maxQ : 20; // Default to 20 if no questions detected
  };

  const loadPaperAndAnswerKey = async (paperId: string) => {
    try {
      setLoading(true);
      
      const paper = papers.find(p => p.id === paperId);
      if (!paper) return;

      const numQuestions = parseQuestionCount(paper.content);
      
      const initialAnswers: Answer[] = Array.from({ length: numQuestions }, (_, i) => ({
        qNo: i + 1,
        answer: ''
      }));

      try {
        const res = await api.get(`/api/answer-keys/${paperId}`);
        if (res.data && res.data.answers) {
          const dbAnswers: Answer[] = res.data.answers;
          // Merge db answers with initial answers
          dbAnswers.forEach(dbA => {
            const index = initialAnswers.findIndex(ia => ia.qNo === dbA.qNo);
            if (index !== -1) {
              initialAnswers[index].answer = dbA.answer || '';
            } else {
              initialAnswers.push(dbA);
            }
          });
        }
      } catch (err: any) {
        if (err.response?.status !== 404) {
          console.error("Failed to fetch existing answer key");
        }
      }

      setAnswers(initialAnswers.sort((a, b) => a.qNo - b.qNo));
    } catch (error) {
      toast.error('Failed to load answer key data');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!selectedPaperId) {
      toast.error('Please select a paper first');
      return;
    }
    try {
      setSaving(true);
      toast.loading('Saving Answer Key...', { id: 'save-ak' });
      await api.post('/api/answer-keys', {
        paperId: selectedPaperId,
        answers: answers
      });
      toast.success('Answer Key saved successfully!', { id: 'save-ak' });
    } catch (error) {
      toast.error('Failed to save answer key', { id: 'save-ak' });
    } finally {
      setSaving(false);
    }
  };

  const handleAnswerChange = (qNo: number, value: string) => {
    setAnswers(prev => prev.map(a => a.qNo === qNo ? { ...a, answer: value.toUpperCase() } : a));
  };

  const selectedPaper = papers.find(p => p.id === selectedPaperId);

  return (
    <div className="flex flex-col h-full bg-[#f8fafc] animate-fade-in pb-16 min-h-[80vh] rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
      <div className="bg-white/80 backdrop-blur-xl border-b border-slate-200/80 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2">
            <Key className="w-6 h-6 text-indigo-500" />
            Answer Key Manager
          </h2>
          <p className="text-sm font-bold text-slate-500 mt-1">Select an exam paper to view or edit its answer key.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <select
              value={selectedPaperId}
              onChange={(e) => setSelectedPaperId(e.target.value)}
              className="appearance-none pl-10 pr-10 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 min-w-[250px] cursor-pointer"
            >
              <option value="">Select Exam Paper...</option>
              {papers.map(p => (
                <option key={p.id} value={p.id}>{p.examName} ({p.examSubject || 'General'})</option>
              ))}
            </select>
            <FileText className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
          
          <button
            onClick={handleSave}
            disabled={!selectedPaperId || saving}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
            Save Key
          </button>
        </div>
      </div>

      <div className="p-6 overflow-auto">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4" />
            <p className="text-sm font-bold text-slate-500">Loading paper and answers...</p>
          </div>
        ) : !selectedPaperId ? (
          <div className="flex flex-col items-center justify-center py-24 bg-white/50 border border-slate-200 border-dashed rounded-3xl">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm mb-4">
              <Key className="w-8 h-8 text-slate-300" />
            </div>
            <p className="text-lg font-black text-slate-700">No Paper Selected</p>
            <p className="text-sm text-slate-400 mt-1">Please select an exam paper from the dropdown above.</p>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-[2rem] p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6 p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100">
              <AlertTriangle className="w-5 h-5 text-indigo-500" />
              <p className="text-sm font-bold text-slate-700">
                Found <span className="text-indigo-600 font-black">{answers.length}</span> questions for <span className="font-black text-slate-900">{selectedPaper?.examName}</span>. 
                Enter the correct option (A, B, C, D) or the exact answer text below.
              </p>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {answers.map((ans) => (
                <div key={ans.qNo} className="flex flex-col gap-1.5 group">
                  <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 pl-1 flex justify-between items-center">
                    <span>Q {ans.qNo}</span>
                    {ans.answer && <CheckCircle2 className="w-3 h-3 text-emerald-500" />}
                  </label>
                  <input
                    type="text"
                    value={ans.answer}
                    onChange={(e) => handleAnswerChange(ans.qNo, e.target.value)}
                    placeholder="Ans"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 focus:bg-white transition-all text-center"
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
