import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Sparkles, Save, ArrowLeft, FileText, Upload, Copy, PlusCircle, RefreshCw, Edit } from 'lucide-react';
import api from '../../api/axios';

interface Question {
  questionText: string;
  options: string[];
  correctAnswer: string;
  marks: number;
}

const ManageExamQuestions = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [questions, setQuestions] = useState<Question[]>([]);
  const [activeTab, setActiveTab] = useState<'ai' | 'manual'>('ai');
  
  // AI Generation States
  const [aiLoading, setAiLoading] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiInstructions, setAiInstructions] = useState('Generate 10 multiple choice questions suitable for a 10th-grade exam.');
  const [file, setFile] = useState<File | null>(null);
  
  // Manual Entry States
  const [manualQuestion, setManualQuestion] = useState<Question>({
    questionText: '',
    options: ['', '', '', ''],
    correctAnswer: '',
    marks: 1
  });

  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const showToast = (msg: string, type: 'success' | 'error') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleAiGenerate = async () => {
    setAiLoading(true);
    try {
      const formData = new FormData();
      formData.append('instructions', aiInstructions);
      if (aiPrompt) formData.append('prompt', aiPrompt);
      if (file) formData.append('file', file);

      const res = await api.post('/api/online-exams/generate-ai', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      const data = res.data?.data || res.data;
      if (Array.isArray(data)) {
        setQuestions([...questions, ...data]);
        showToast(`Generated ${data.length} questions successfully!`, 'success');
      }
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Failed to generate questions using AI', 'error');
    } finally {
      setAiLoading(false);
    }
  };

  const addManualQuestion = () => {
    if (!manualQuestion.questionText || !manualQuestion.correctAnswer || manualQuestion.options.some(o => !o)) {
      showToast("Please fill all fields and options", 'error');
      return;
    }
    if (!manualQuestion.options.includes(manualQuestion.correctAnswer)) {
      showToast("Correct answer must exactly match one of the options", 'error');
      return;
    }
    setQuestions([...questions, manualQuestion]);
    setManualQuestion({ questionText: '', options: ['', '', '', ''], correctAnswer: '', marks: 1 });
    showToast("Question added. Click 'Save Exam Questions' to upload.", 'success');
  };

  const saveQuestionsToBackend = async () => {
    if (questions.length === 0) { showToast("No questions to save", 'error'); return; }
    try {
      await api.post(`/api/online-exams/${id}/questions`, { questions });
      showToast("Questions saved to exam successfully!", 'success');
      setTimeout(() => navigate('/online-exams'), 1000);
    } catch (error) {
      showToast('Failed to save questions', 'error');
    }
  };

  const inputCls = "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white";
  const labelCls = "block text-sm font-medium text-gray-700 mb-1";

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-lg shadow-lg text-white font-medium ${toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>
          {toast.msg}
        </div>
      )}

      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/online-exams')} className="p-2 hover:bg-gray-100 rounded-lg text-gray-600">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Manage Exam Questions</h1>
          <p className="text-gray-500 mt-1">Add questions manually or generate them using Gemini AI.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Builder */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-5 border-b border-gray-100">
            <h2 className="font-bold text-gray-800 text-lg">Add Questions</h2>
          </div>
          <div className="p-5">
            {/* Tabs */}
            <div className="flex border border-gray-200 rounded-lg overflow-hidden mb-5">
              <button
                onClick={() => setActiveTab('ai')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium transition-colors ${activeTab === 'ai' ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                <Sparkles className="h-4 w-4" /> AI Generator
              </button>
              <button
                onClick={() => setActiveTab('manual')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium transition-colors ${activeTab === 'manual' ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                <Edit className="h-4 w-4" /> Manual Entry
              </button>
            </div>

            {activeTab === 'ai' && (
              <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100 space-y-4">
                <div>
                  <label className={labelCls + " flex items-center gap-1.5"}><Sparkles className="h-4 w-4 text-purple-600" /> AI Instructions</label>
                  <textarea
                    className={inputCls + " min-h-[80px]"}
                    value={aiInstructions}
                    onChange={e => setAiInstructions(e.target.value)}
                    placeholder="e.g. Generate 10 tough MCQ questions on Indian History for Class 10."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="border bg-white p-3 rounded-lg">
                    <label className={labelCls + " flex items-center gap-1.5"}><Copy className="h-4 w-4 text-blue-500" /> Paste Source Text</label>
                    <textarea className={inputCls + " min-h-[100px]"} value={aiPrompt} onChange={e => setAiPrompt(e.target.value)} placeholder="Paste notes or article here..." />
                  </div>
                  <div className="border bg-white p-3 rounded-lg">
                    <label className={labelCls + " flex items-center gap-1.5"}><Upload className="h-4 w-4 text-green-500" /> Upload File (PDF/Doc)</label>
                    <input type="file" className={inputCls + " mt-2 cursor-pointer"} onChange={e => setFile(e.target.files?.[0] || null)} />
                    <p className="text-xs text-gray-400 mt-2">AI will extract questions from the uploaded document.</p>
                  </div>
                </div>

                <button
                  className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-medium hover:opacity-90 flex items-center justify-center gap-2 disabled:opacity-50"
                  onClick={handleAiGenerate}
                  disabled={aiLoading}
                >
                  {aiLoading ? <><RefreshCw className="h-4 w-4 animate-spin" /> Generating...</> : <><Sparkles className="h-4 w-4" /> Generate with Gemini AI</>}
                </button>
              </div>
            )}

            {activeTab === 'manual' && (
              <div className="space-y-3">
                <div>
                  <label className={labelCls}>Question Text</label>
                  <textarea
                    className={inputCls + " min-h-[80px]"}
                    value={manualQuestion.questionText}
                    onChange={e => setManualQuestion({...manualQuestion, questionText: e.target.value})}
                    placeholder="Enter question here"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {manualQuestion.options.map((opt, i) => (
                    <div key={i}>
                      <label className={labelCls}>Option {i + 1}</label>
                      <input
                        className={inputCls}
                        value={opt}
                        onChange={e => {
                          const newOptions = [...manualQuestion.options];
                          newOptions[i] = e.target.value;
                          setManualQuestion({...manualQuestion, options: newOptions});
                        }}
                        placeholder={`Option ${i + 1}`}
                      />
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Correct Answer (must match an option)</label>
                    <input className={inputCls} value={manualQuestion.correctAnswer} onChange={e => setManualQuestion({...manualQuestion, correctAnswer: e.target.value})} placeholder="Correct Answer" />
                  </div>
                  <div>
                    <label className={labelCls}>Marks</label>
                    <input type="number" className={inputCls} value={manualQuestion.marks} onChange={e => setManualQuestion({...manualQuestion, marks: parseInt(e.target.value)})} />
                  </div>
                </div>
                <button onClick={addManualQuestion} className="w-full py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 flex items-center justify-center gap-2 mt-2">
                  <PlusCircle className="h-4 w-4" /> Add Question to List
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right: Preview */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col max-h-[80vh] overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-gray-100">
            <div>
              <h2 className="font-bold text-gray-800 text-lg">Preview Questions ({questions.length})</h2>
              <p className="text-sm text-gray-400">Review before saving.</p>
            </div>
            <button
              onClick={saveQuestionsToBackend}
              disabled={questions.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium text-sm disabled:opacity-50"
            >
              <Save className="h-4 w-4" /> Save Exam Questions
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {questions.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-gray-400 border-2 border-dashed border-gray-200 rounded-xl">
                <FileText className="h-8 w-8 mb-2 opacity-50" />
                <p>No questions added yet.</p>
              </div>
            ) : (
              questions.map((q, idx) => (
                <div key={idx} className="p-4 border border-gray-200 rounded-xl bg-white shadow-sm relative">
                  <button
                    className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center text-red-500 hover:bg-red-50 rounded"
                    onClick={() => { const nq = [...questions]; nq.splice(idx, 1); setQuestions(nq); }}
                  >
                    ×
                  </button>
                  <p className="font-semibold text-gray-800 mb-2 pr-6">Q{idx + 1}. {q.questionText}</p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {q.options.map((opt, oIdx) => (
                      <div key={oIdx} className={`p-2 rounded border ${opt === q.correctAnswer ? 'bg-green-50 border-green-300 font-medium text-green-800' : 'bg-gray-50 border-gray-200'}`}>
                        {String.fromCharCode(65 + oIdx)}. {opt}
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-400 text-right mt-2 font-medium">Marks: {q.marks}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManageExamQuestions;
