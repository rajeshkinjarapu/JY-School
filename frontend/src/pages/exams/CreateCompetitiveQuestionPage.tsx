import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Save, Plus, Image as ImageIcon, CheckCircle2, FileEdit, Eye, AlertCircle } from 'lucide-react';
import LiveLatexPreview from '../../components/QuestionBank/LiveLatexPreview';
import ApiService from '../../api/axios';
import toast from 'react-hot-toast';

const CreateCompetitiveQuestionPage = () => {
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    examType: 'JEE Mains',
    subjectId: '',
    chapter: '',
    topic: 'Carnot Engine',
    difficulty: 'Hard',
    marks: 4,
    negativeMarks: 1,
    questionType: 'Single Correct',
    rawContent: '1. Enter your question text here $x^2 + y^2 = r^2$\n(A) Option A\n(B) Option B\n(C) Option C\n(D) Option D',
    correctAnswer: 'A',
    solution: ''
  });

  useEffect(() => {
    const fetchSubjects = async () => {
      const res = await ApiService.performGet('/api/subjects', 'Failed to fetch subjects');
      if (res.success && res.data) {
        setSubjects(res.data);
        if (res.data.length > 0) {
          setFormData(prev => ({ ...prev, subjectId: res.data[0].id }));
        }
      }
    };
    fetchSubjects();
  }, []);

  const handleChange = (e: any) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async (stayOnPage = false) => {
    let qText = formData.rawContent;
    let options: string[] = [];
    
    // Very simple regex parsing for (A) (B) (C) (D)
    const optionRegex = /\(A\)(.*?)\(B\)(.*?)\(C\)(.*?)\(D\)(.*)/s;
    const match = formData.rawContent.match(optionRegex);
    
    if (match) {
        qText = formData.rawContent.substring(0, match.index).trim();
        // Remove leading numbers like "1. " if present
        qText = qText.replace(/^\d+\.\s*/, '');
        options = [
           match[1].trim(),
           match[2].trim(),
           match[3].trim(),
           match[4].trim()
        ];
    } else {
        toast.error('Please format the question correctly with (A), (B), (C), (D) options.');
        return;
    }
    
    const ansIndex = formData.correctAnswer.charCodeAt(0) - 65;
    const correctAnsText = options.length === 4 ? options[ansIndex] : formData.correctAnswer;

    if (!formData.subjectId) {
      toast.error('Please select a subject');
      return;
    }

    setIsLoading(true);
    const payload = {
      subjectId: formData.subjectId,
      className: formData.examType,
      chapterName: formData.chapter,
      topicName: formData.topic,
      difficulty: formData.difficulty.toUpperCase(),
      questionType: formData.questionType === 'Single Correct' ? 'MCQ' : 'MULTI_CORRECT',
      questionText: qText,
      options: options,
      correctAnswer: correctAnsText,
      marks: Number(formData.marks),
      negativeMarks: Number(formData.negativeMarks),
      explanation: formData.solution
    };

    const res = await ApiService.performPost('/api/master-questions', payload, 'Failed to save question');
    setIsLoading(false);

    if (res.success) {
      toast.success('Question Saved Successfully!');
      if (!stayOnPage) {
        navigate('/competitive-question-bank');
      } else {
        setFormData({
          ...formData,
          rawContent: '2. \n(A) \n(B) \n(C) \n(D) ',
          solution: ''
        });
      }
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">
      <button onClick={() => navigate('/competitive-question-bank')} className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-bold mb-4">
        <ChevronLeft size={20} /> Back to Question Bank
      </button>

      <div className="bg-white rounded-3xl shadow-lg border border-slate-100 overflow-hidden">
        <div className="bg-indigo-900 text-white p-6">
          <h1 className="text-2xl font-bold uppercase tracking-wider">Question Entry</h1>
          <p className="text-indigo-200 mt-1">Create a new question for the competitive exam repository</p>
        </div>

        <div className="p-6 md:p-8 space-y-8">
          
          {/* Metadata Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Select Exam Type</label>
              <select name="examType" value={formData.examType} onChange={handleChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium outline-none focus:border-indigo-500">
                <option>JEE Mains</option>
                <option>JEE Advanced</option>
                <option>NEET</option>
                <option>BITSAT</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Select Subject</label>
              <select name="subjectId" value={formData.subjectId} onChange={handleChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium outline-none focus:border-indigo-500">
                <option value="">-- Select Subject --</option>
                {subjects.map(sub => (
                  <option key={sub.id} value={sub.id}>{sub.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Select Chapter</label>
              <input type="text" name="chapter" value={formData.chapter} onChange={handleChange} className="w-full p-3 bg-white border border-slate-200 rounded-xl font-medium outline-none focus:border-indigo-500" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Select Topic</label>
              <input type="text" name="topic" value={formData.topic} onChange={handleChange} className="w-full p-3 bg-white border border-slate-200 rounded-xl font-medium outline-none focus:border-indigo-500" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Difficulty Level</label>
              <select name="difficulty" value={formData.difficulty} onChange={handleChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium outline-none focus:border-indigo-500">
                <option>Easy</option>
                <option>Medium</option>
                <option>Hard</option>
                <option>Very Hard</option>
              </select>
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Marks</label>
                <input type="number" name="marks" value={formData.marks} onChange={handleChange} className="w-full p-3 bg-white border border-emerald-200 text-emerald-700 rounded-xl font-bold outline-none focus:border-emerald-500" />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Negative</label>
                <input type="number" name="negativeMarks" value={formData.negativeMarks} onChange={handleChange} className="w-full p-3 bg-white border border-red-200 text-red-600 rounded-xl font-bold outline-none focus:border-red-500" />
              </div>
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* Editor & Preview Split Pane */}
          <div className="bg-white border-2 border-slate-200 rounded-2xl overflow-hidden flex flex-col md:flex-row h-[600px] shadow-sm">
            
            {/* Editor Pane */}
            <div className="flex-1 flex flex-col border-b md:border-b-0 md:border-r border-slate-200 bg-slate-50">
              <div className="bg-slate-100 p-4 border-b border-slate-200 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <FileEdit size={18} className="text-indigo-600" />
                  <span className="font-bold text-sm text-slate-800">Raw Question Editor</span>
                </div>
                <span className="text-[11px] font-bold text-emerald-600 bg-emerald-100 px-2 py-1 rounded-md uppercase tracking-wider">LaTeX Supported</span>
              </div>
              <textarea 
                name="rawContent"
                value={formData.rawContent}
                onChange={handleChange}
                placeholder="1. Enter question text here $latex$\n(A) Option 1\n(B) Option 2\n(C) Option 3\n(D) Option 4"
                className="flex-1 w-full p-5 outline-none resize-none font-mono text-[14px] bg-transparent leading-relaxed text-slate-800 focus:bg-white transition-colors"
              ></textarea>
              <div className="p-3 bg-white border-t border-slate-200 text-xs text-slate-500 flex items-center gap-2">
                <AlertCircle size={14} className="text-amber-500" />
                Format: 1. Question text (A) Opt1 (B) Opt2 (C) Opt3 (D) Opt4
              </div>
            </div>

            {/* Preview Pane */}
            <div className="flex-1 flex flex-col bg-white">
              <div className="bg-slate-100 p-4 border-b border-slate-200 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Eye size={18} className="text-indigo-600" />
                  <span className="font-bold text-sm text-slate-800">Live Preview</span>
                </div>
              </div>
              <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
                <LiveLatexPreview 
                  content={formData.rawContent} 
                  examName=""
                  maxMarks=""
                  time=""
                  instructions={[]}
                  showHeader={false}
                  showPageBorder={false}
                />
              </div>
            </div>

          </div>

          {/* Correct Answer Selection */}
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
            <div className="flex justify-between items-center mb-4">
              <div>
                <label className="block text-sm font-bold text-slate-800 uppercase mb-1">Select Correct Answer</label>
                <p className="text-xs text-slate-500">Choose the correct option for this question</p>
              </div>
              <select name="questionType" value={formData.questionType} onChange={handleChange} className="p-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-indigo-700 outline-none shadow-sm">
                <option>Single Correct</option>
                <option>Multiple Correct</option>
                <option>Numerical</option>
              </select>
            </div>
            
            <div className="flex gap-4">
              {['A', 'B', 'C', 'D'].map(opt => (
                <div 
                  key={opt} 
                  onClick={() => setFormData({...formData, correctAnswer: opt})}
                  className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all cursor-pointer ${formData.correctAnswer === opt ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'}`}
                >
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-sm ${formData.correctAnswer === opt ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-500'}`}>
                    {opt}
                  </div>
                  <span className="font-bold">Option {opt}</span>
                  {formData.correctAnswer === opt && <CheckCircle2 className="text-emerald-500 ml-1" size={18} />}
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-4 pt-4">
            <button 
              onClick={() => handleSave(false)} 
              disabled={isLoading}
              className="flex-1 md:flex-none px-8 py-4 bg-indigo-600 text-white rounded-xl font-bold text-lg hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Save size={20} /> {isLoading ? 'SAVING...' : 'SAVE QUESTION'}
            </button>
            <button 
              onClick={() => handleSave(true)}
              disabled={isLoading} 
              className="flex-1 md:flex-none px-8 py-4 bg-white text-indigo-700 border-2 border-indigo-200 rounded-xl font-bold text-lg hover:bg-indigo-50 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Plus size={20} /> SAVE & ADD NEW
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateCompetitiveQuestionPage;
