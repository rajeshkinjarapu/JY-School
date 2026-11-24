import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Save, Plus, Image as ImageIcon, CheckCircle2, RefreshCw } from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';

export const CreateCompetitiveQuestionPage = () => {
  const navigate = useNavigate();
  const [exams, setExams] = useState<any[]>([]);
  const [selectedExamId, setSelectedExamId] = useState('');
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    subject: 'Physics',
    chapter: 'Thermodynamics',
    topic: 'Carnot Engine',
    difficulty: 'MEDIUM',
    marks: 4,
    negativeMarks: 1,
    questionType: 'Single Correct',
    questionText: '',
    optionA: '',
    optionB: '',
    optionC: '',
    optionD: '',
    correctAnswer: 'A',
    solution: ''
  });

  useEffect(() => {
    api.get('/api/competitive-exams/admin')
      .then(res => {
        const loaded = res.data?.data || [];
        setExams(loaded);
        if (loaded.length > 0) setSelectedExamId(loaded[0].id);
      })
      .catch(() => { });
  }, []);

  const handleChange = (e: any) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async (andAddNew = false) => {
    if (!selectedExamId) {
      toast.error('Please select an exam first');
      return;
    }
    if (!formData.questionText.trim()) {
      toast.error('Please enter question text');
      return;
    }
    if (!formData.optionA.trim() || !formData.optionB.trim()) {
      toast.error('Please fill at least Option A and Option B');
      return;
    }

    setLoading(true);
    try {
      const options = [formData.optionA, formData.optionB, formData.optionC || 'None', formData.optionD || 'All of the above'];
      let correctVal = formData.optionA;
      if (formData.correctAnswer === 'B') correctVal = formData.optionB;
      else if (formData.correctAnswer === 'C') correctVal = formData.optionC;
      else if (formData.correctAnswer === 'D') correctVal = formData.optionD;

      await api.post(`/api/competitive-exams/${selectedExamId}/questions`, {
        questionText: formData.questionText,
        options,
        correctAnswer: correctVal,
        marks: Number(formData.marks) || 4,
        chapterName: formData.chapter,
        difficulty: formData.difficulty,
      });

      toast.success('Question Saved to Database Successfully!');
      if (andAddNew) {
        setFormData(prev => ({
          ...prev,
          questionText: '',
          optionA: '',
          optionB: '',
          optionC: '',
          optionD: '',
          correctAnswer: 'A',
          solution: ''
        }));
      } else {
        navigate('/competitive-exams');
      }
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to save question');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">
      <button onClick={() => navigate('/competitive-exams')} className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-bold mb-4 cursor-pointer">
        <ChevronLeft size={20} /> Back to Competitive Exams
      </button>

      <div className="bg-white rounded-3xl shadow-lg border border-slate-100 overflow-hidden">
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6">
          <h1 className="text-2xl font-bold uppercase tracking-wider">Question Entry</h1>
          <p className="text-indigo-200 mt-1">Create a new question for the competitive exam repository</p>
        </div>

        <div className="p-6 md:p-8 space-y-8">

          {/* Metadata Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Target Competitive Exam</label>
              <select
                value={selectedExamId}
                onChange={e => setSelectedExamId(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 outline-none focus:border-indigo-500 cursor-pointer"
              >
                {exams.map(e => (
                  <option key={e.id} value={e.id}>{e.title}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Select Subject</label>
              <select name="subject" value={formData.subject} onChange={handleChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium outline-none focus:border-indigo-500">
                <option>Physics</option>
                <option>Chemistry</option>
                <option>Mathematics</option>
                <option>Biology</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Chapter Name</label>
              <input type="text" name="chapter" value={formData.chapter} onChange={handleChange} className="w-full p-3 bg-white border border-slate-200 rounded-xl font-medium outline-none focus:border-indigo-500" />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Difficulty Level</label>
              <select name="difficulty" value={formData.difficulty} onChange={handleChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium outline-none focus:border-indigo-500">
                <option value="EASY">Easy</option>
                <option value="MEDIUM">Medium</option>
                <option value="HARD">Hard</option>
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

          {/* Question Text */}
          <div>
            <div className="flex justify-between items-end mb-2">
              <label className="block text-sm font-bold text-slate-800 uppercase">Question Text</label>
            </div>
            <textarea
              name="questionText"
              rows={4}
              value={formData.questionText}
              onChange={handleChange}
              placeholder="Enter the competitive question problem statement..."
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-medium outline-none focus:border-indigo-500 resize-none"
            ></textarea>
          </div>

          {/* Options */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <label className="block text-sm font-bold text-slate-800 uppercase">Options (Click letter to select correct answer)</label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {['A', 'B', 'C', 'D'].map(opt => (
                <div key={opt} className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${formData.correctAnswer === opt ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 bg-white'}`}>
                  <div
                    onClick={() => setFormData({ ...formData, correctAnswer: opt })}
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-bold cursor-pointer transition-all ${formData.correctAnswer === opt ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                  >
                    {opt}
                  </div>
                  <input
                    type="text"
                    name={`option${opt}`}
                    value={(formData as any)[`option${opt}`]}
                    onChange={handleChange}
                    placeholder={`Option ${opt} text`}
                    className="flex-1 bg-transparent outline-none font-medium text-slate-800"
                  />
                  {formData.correctAnswer === opt && <CheckCircle2 className="text-emerald-500" size={20} />}
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-4 pt-4 border-t border-slate-100">
            <button
              type="button"
              disabled={loading}
              onClick={() => handleSave(false)}
              className="flex-1 md:flex-none px-8 py-4 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save size={18} />}
              SAVE QUESTION
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => handleSave(true)}
              className="flex-1 md:flex-none px-8 py-4 bg-white text-indigo-700 border-2 border-indigo-200 rounded-xl font-bold text-sm hover:bg-indigo-50 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Plus size={18} /> SAVE & ADD ANOTHER
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateCompetitiveQuestionPage;
