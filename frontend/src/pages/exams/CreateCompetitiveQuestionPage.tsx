import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Save, Plus, Image as ImageIcon, CheckCircle2 } from 'lucide-react';

const CreateCompetitiveQuestionPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    examType: 'JEE Mains',
    subject: 'Physics',
    chapter: 'Thermodynamics',
    topic: 'Carnot Engine',
    difficulty: 'Hard',
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

  const handleChange = (e: any) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = () => {
    alert('Question Saved Successfully!');
    navigate('/competitive-question-bank');
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
              <select name="subject" value={formData.subject} onChange={handleChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium outline-none focus:border-indigo-500">
                <option>Physics</option>
                <option>Chemistry</option>
                <option>Mathematics</option>
                <option>Biology</option>
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

          {/* Question Text */}
          <div>
            <div className="flex justify-between items-end mb-2">
              <label className="block text-sm font-bold text-slate-800 uppercase">Question Text</label>
              <button className="text-indigo-600 font-bold text-sm flex items-center gap-1 hover:text-indigo-800">
                <ImageIcon size={16} /> Upload Image / Diagram
              </button>
            </div>
            <textarea 
              name="questionText"
              rows={4}
              value={formData.questionText}
              onChange={handleChange}
              placeholder="Enter the question text here. (Math/Rich text editor representation)"
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-medium outline-none focus:border-indigo-500 resize-none"
            ></textarea>
          </div>

          {/* Options */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <label className="block text-sm font-bold text-slate-800 uppercase">Options</label>
              <select name="questionType" value={formData.questionType} onChange={handleChange} className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-indigo-700 outline-none">
                <option>Single Correct</option>
                <option>Multiple Correct</option>
                <option>Numerical</option>
              </select>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {['A', 'B', 'C', 'D'].map(opt => (
                <div key={opt} className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${formData.correctAnswer === opt ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 bg-white'}`}>
                  <div 
                    onClick={() => setFormData({...formData, correctAnswer: opt})}
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

          {/* Solution */}
          <div>
            <label className="block text-sm font-bold text-slate-800 uppercase mb-2">Solution / Explanation</label>
            <textarea 
              name="solution"
              rows={3}
              value={formData.solution}
              onChange={handleChange}
              placeholder="Step by step explanation..."
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-medium outline-none focus:border-indigo-500 resize-none"
            ></textarea>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-4 pt-4 border-t border-slate-100">
            <button onClick={handleSave} className="flex-1 md:flex-none px-8 py-4 bg-indigo-600 text-white rounded-xl font-bold text-lg hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2">
              <Save size={20} /> SAVE QUESTION
            </button>
            <button className="flex-1 md:flex-none px-8 py-4 bg-white text-indigo-700 border-2 border-indigo-200 rounded-xl font-bold text-lg hover:bg-indigo-50 transition-all flex items-center justify-center gap-2">
              <Plus size={20} /> SAVE & ADD NEW
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateCompetitiveQuestionPage;
